import { readFile } from "fs/promises";
import path from "path";
import { Pool } from "pg";

const TYPE_LABELS: Record<string, string> = {
  smartphones: "Smartphones",
  laptopspcs: "Laptops & Computers",
  audio: "Audio & Headphones",
  smarthome: "Smart Home",
  wearables: "Wearables",
  gaming: "Gaming & Entertainment",
  informational: "Guides & Tips",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildArticleCards(articles: any[]): string {
  return articles
    .map((a) => {
      const typeLabel = TYPE_LABELS[a.type] || a.type;
      const href = `/${a.type}/${a.short_title}`;
      const title = escapeHtml(a.title);
      const author = escapeHtml(a.author || "ElectronNexus Team");
      const imgHtml = a.img
        ? `<div class="card-img" style="background-image:url('${a.img}');background-size:cover;background-position:center"></div>`
        : `<div class="card-img">📰</div>`;
      return `<div class="article-card">
${imgHtml}
<div class="card-body">
<div class="card-type">${escapeHtml(typeLabel)}</div>
<h3><a href="${href}">${title}</a></h3>
<div class="card-meta"><span class="author">${author}</span></div>
</div>
</div>`;
    })
    .join("\n");
}

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "index.html");
  let html = await readFile(filePath, "utf-8");

  // Fetch latest articles from DB
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    });
    const result = await pool.query(
      "SELECT short_title, title, type, img, author FROM articles WHERE site='electronnexus' AND is_online='Y' ORDER BY published_time DESC NULLS LAST, id DESC LIMIT 6"
    );
    await pool.end();

    if (result.rows.length > 0) {
      const cardsHtml = buildArticleCards(result.rows);
      // Replace the articles-grid content
      html = html.replace(
        /(<div class="articles-grid">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>\s*<!-- EXPERT REVIEWS)/,
        `$1\n${cardsHtml}\n</div>\n</div>\n</section>\n\n<!-- EXPERT REVIEWS`
      );
    }
  } catch (e) {
    console.error("Failed to fetch latest articles:", e);
    // Fall back to static HTML
  }

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
