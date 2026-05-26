/**
 * Generate ALL images for a site: author headshots + article covers
 * Uploads to Vercel Blob for permanent URLs.
 * Usage: DASHSCOPE_API_KEY=xxx BLOB_TOKEN=xxx DB_URL=xxx node gen-all-images.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE = 'electronnexus';
const SITE_DIR = '/root/vercel-projects/electronnexus';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const BLOB_TOKEN = process.env.BLOB_TOKEN;
const DB_URL = process.env.DB_URL;

if (!DASHSCOPE_API_KEY) { console.error('DASHSCOPE_API_KEY required'); process.exit(1); }
if (!BLOB_TOKEN) { console.error('BLOB_TOKEN required'); process.exit(1); }
if (!DB_URL) { console.error('DB_URL required'); process.exit(1); }

const { Pool } = require('pg');
const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

// Author headshot prompts
const authorPrompts = {
  'team': 'Professional team logo icon for a tech media company, minimalist geometric design, purple gradient background, modern clean style',
  'alex-chen': 'Professional headshot portrait of a young Asian male tech journalist in his 30s, wearing smart casual attire, studio lighting, clean neutral background, confident expression',
  'sarah-mitchell': 'Professional headshot portrait of a woman in her late 20s, audio specialist, wearing headphones around neck, warm studio lighting, clean background',
  'david-kumar': 'Professional headshot portrait of an Indian male tech expert in his 30s, wearing glasses and a polo shirt, studio lighting, clean background, friendly smile',
  'emma-wilson': 'Professional headshot portrait of a Caucasian woman in her early 30s, smart home technology enthusiast, casual professional attire, studio lighting, clean background',
  'james-park': 'Professional headshot portrait of a Korean-American male gaming tech reviewer in his late 20s, casual attire, studio lighting, clean background, energetic expression',
  'lisa-tanaka': 'Professional headshot portrait of a Japanese-American woman fitness tech expert in her early 30s, athletic casual wear, studio lighting, clean background',
  'mike-russo': 'Professional headshot portrait of a Caucasian male tech industry analyst in his 40s, business casual attire, studio lighting, clean background, authoritative expression',
};

// Topic prompts for article covers
const topicPrompts = {
  'smartphones': 'smartphone device, mobile technology, modern phone on clean surface, professional product photography, editorial style, soft lighting',
  'laptops-computers': 'laptop computer, modern workspace, clean desk setup, professional product photography, editorial style, soft lighting',
  'audio-gear': 'headphones and audio equipment, premium earbuds, speaker setup, professional product photography, editorial style, studio lighting',
  'smart-home': 'smart home devices, connected home technology, IoT gadgets, modern minimalist interior, professional editorial photography',
  'wearables': 'smartwatch and fitness tracker on wrist, wearable technology, health monitoring device, professional product photography, clean background',
  'gaming': 'gaming setup, gaming peripherals, RGB keyboard and mouse, gaming monitor, professional product photography, dramatic lighting',
};

function generateImage(prompt, size = '1024*576') {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'qwen-image-plus',
      input: { messages: [{ role: 'user', content: [{ text: prompt }] }] },
      parameters: { size }
    });
    const opts = {
      hostname: 'dashscope.aliyuncs.com',
      path: '/api/v1/services/aigc/multimodal-generation/generation',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const url = json.output?.choices?.[0]?.message?.content?.[0]?.image;
          if (url) resolve(url);
          else reject(new Error('No image URL: ' + JSON.stringify(json).substring(0, 200)));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    mod.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // follow redirect
        mod.get(res.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }
    }).on('error', reject);
  });
}

function uploadToBlob(localPath, blobPath) {
  const cmd = `cd ${SITE_DIR} && npx vercel blob put "${localPath}" --pathname "${blobPath}" --access public --rw-token ${BLOB_TOKEN} 2>/dev/null`;
  const result = execSync(cmd, { encoding: 'utf-8', timeout: 60000 });
  const parsed = JSON.parse(result);
  return parsed[0].url;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function processAuthor(slug, prompt) {
  console.log(`  [author] Generating: ${slug}`);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ossUrl = await generateImage(prompt, '512*512');
      const tmpPath = `/tmp/author-${slug}.png`;
      await downloadFile(ossUrl, tmpPath);
      const blobUrl = uploadToBlob(tmpPath, `authors/${SITE}/${slug}.png`);
      await pool.query('UPDATE authors SET img = $1 WHERE site = $2 AND slug = $3', [blobUrl, SITE, slug]);
      fs.unlinkSync(tmpPath);
      console.log(`  [author] ${slug} -> ${blobUrl}`);
      return blobUrl;
    } catch (e) {
      console.log(`  [author] ${slug} attempt ${attempt+1} failed: ${e.message.substring(0, 100)}`);
      if (attempt < 2) await sleep(3000 * (attempt + 1));
    }
  }
  return null;
}

async function processArticle(article) {
  const { id, short_title, type } = article;
  const topicContext = topicPrompts[type] || 'consumer electronics, technology product';
  const prompt = `Professional blog cover image: ${short_title.replace(/-/g, ' ')}. ${topicContext}. Clean, modern, editorial style. No text overlay.`;
  
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ossUrl = await generateImage(prompt);
      const tmpPath = `/tmp/article-${id}.png`;
      await downloadFile(ossUrl, tmpPath);
      const blobUrl = uploadToBlob(tmpPath, `covers/${SITE}/${short_title}.png`);
      await pool.query('UPDATE articles SET img = $1 WHERE id = $2', [blobUrl, id]);
      fs.unlinkSync(tmpPath);
      return { ok: true, id, blobUrl };
    } catch (e) {
      if (attempt < 1) await sleep(2000);
      else return { ok: false, id, error: e.message.substring(0, 100) };
    }
  }
}

async function main() {
  const mode = process.argv[2] || 'authors'; // 'authors' or 'articles' or 'all'
  
  if (mode === 'authors' || mode === 'all') {
    console.log('=== Generating Author Headshots ===');
    const authors = await pool.query("SELECT slug FROM authors WHERE site = $1 ORDER BY slug", [SITE]);
    console.log(`Found ${authors.rows.length} authors`);
    for (const row of authors.rows) {
      const prompt = authorPrompts[row.slug] || `Professional headshot portrait of ${row.slug.replace(/-/g, ' ')}, tech professional, studio lighting, clean background`;
      await processAuthor(row.slug, prompt);
      await sleep(1000); // Rate limit
    }
    console.log('Author headshots complete!');
  }
  
  if (mode === 'articles' || mode === 'all') {
    console.log('\n=== Generating Article Cover Images ===');
    const batchSize = parseInt(process.argv[3] || '50');
    const offset = parseInt(process.argv[4] || '0');
    const articles = await pool.query(
      "SELECT id, short_title, type FROM articles WHERE site = $1 AND (img IS NULL OR img = '') ORDER BY id LIMIT $2 OFFSET $3",
      [SITE, batchSize, offset]
    );
    console.log(`Processing ${articles.rows.length} articles (offset=${offset})`);
    
    let ok = 0, fail = 0;
    // Process 3 at a time
    for (let i = 0; i < articles.rows.length; i += 3) {
      const batch = articles.rows.slice(i, i + 3);
      const results = await Promise.all(batch.map(a => processArticle(a)));
      results.forEach(r => { if (r?.ok) ok++; else fail++; });
      console.log(`  Progress: ${ok + fail}/${articles.rows.length} | OK=${ok} FAIL=${fail}`);
      await sleep(1500); // Rate limit between batches
    }
    console.log(`\nArticles complete: ${ok} OK, ${fail} failed`);
  }
  
  pool.end();
}

main().catch(e => { console.error(e); pool.end(); process.exit(1); });
