const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const [,, SITE_NAME, SITE_DIR, DOMAIN] = process.argv;
const DB_URL = 'postgresql://neondb_owner:npg_HKw8qxGg5cfj@ep-fancy-leaf-a4zukau9-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
const TODAY = new Date().toISOString().slice(0, 10);
const OUT_DIR = `/root/vercel-projects/${SITE_DIR}/public/sitemap`;

async function main() {
  const sql = neon(DB_URL);

  const articles = await sql`SELECT type, short_title FROM articles WHERE site = ${SITE_NAME} ORDER BY id`;
  const authors = await sql`SELECT slug FROM authors WHERE site = ${SITE_NAME} ORDER BY id`;

  const urls = [];
  urls.push(`https://${DOMAIN}/`);
  urls.push(`https://${DOMAIN}/author/team`);
  for (const { slug } of authors) {
    if (slug !== 'team') urls.push(`https://${DOMAIN}/author/${slug}`);
  }
  const types = [...new Set(articles.filter(a => a.type).map(a => a.type))];
  for (const t of types) urls.push(`https://${DOMAIN}/${t}`);
  for (const { type, short_title } of articles) {
    const base = type ? `${type}/${short_title}` : `articles/${short_title}`;
    urls.push(`https://${DOMAIN}/${base}`);
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const chunks = [];
  for (let i = 0; i < urls.length; i += 5000) chunks.push(urls.slice(i, i + 5000));

  for (let i = 0; i < chunks.length; i++) {
    const urlTags = chunks[i].map(u =>
      `<url>\n<loc>${u}</loc>\n<lastmod>${TODAY}</lastmod>\n<changefreq>weekly</changefreq>\n</url>`
    ).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlTags}\n</urlset>`;
    fs.writeFileSync(path.join(OUT_DIR, `sitemap${i + 1}.xml`), xml);
  }

  const sitemapTags = chunks.map((_, i) =>
    `<sitemap>\n<loc>https://${DOMAIN}/sitemap/sitemap${i + 1}.xml</loc>\n<lastmod>${TODAY}</lastmod>\n</sitemap>`
  ).join('\n');
  const index = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapTags}\n</sitemapindex>`;
  fs.writeFileSync(path.join(OUT_DIR, 'sitemapindex.xml'), index);

  console.log(`Total URLs: ${urls.length}`);
  console.log(`Sitemap files: ${chunks.length}`);
  chunks.forEach((c, i) => console.log(`  sitemap${i + 1}.xml: ${c.length} URLs`));
}

main().catch(e => { console.error(e); process.exit(1); });
