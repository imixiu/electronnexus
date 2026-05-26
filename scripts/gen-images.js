const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const { Pool } = require('pg');

const SITE = 'electronnexus';
const SITE_DIR = '/root/vercel-projects/electronnexus';
const API_KEY = process.env.DASHSCOPE_API_KEY;
const BLOB_TOKEN = process.env.BLOB_TOKEN;
const CONCURRENCY = 8;

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const authorPrompts = {
  'team': 'Minimalist tech media logo icon, geometric design, purple gradient background, modern clean style, 512x512',
  'alex-chen': 'Professional headshot of a young Asian male tech journalist, 30s, smart casual, studio lighting, neutral background',
  'sarah-mitchell': 'Professional headshot of a woman in her late 20s, audio specialist, headphones around neck, warm lighting',
  'david-kumar': 'Professional headshot of an Indian male tech expert, 30s, glasses, polo shirt, studio lighting, friendly smile',
  'emma-wilson': 'Professional headshot of a Caucasian woman, early 30s, smart home enthusiast, casual professional, studio lighting',
  'james-park': 'Professional headshot of a Korean-American male, late 20s, gaming reviewer, casual attire, energetic expression',
  'lisa-tanaka': 'Professional headshot of a Japanese-American woman, early 30s, fitness tech expert, athletic casual, studio lighting',
  'mike-russo': 'Professional headshot of a Caucasian male analyst, 40s, business casual, studio lighting, authoritative expression',
};

const topicPrompts = {
  'smartphones': 'smartphone device on clean surface, modern mobile technology, professional product photography, editorial style',
  'laptopspcs': 'laptop computer on clean desk, modern workspace, professional product photography, editorial style',
  'audio': 'premium headphones and audio equipment, professional product photography, studio lighting, editorial style',
  'smarthome': 'smart home devices, connected technology, IoT gadgets, modern interior, professional editorial photography',
  'wearables': 'smartwatch on wrist, wearable technology, fitness tracker, professional product photography, clean background',
  'gaming': 'gaming peripherals, RGB keyboard mouse, gaming monitor, professional product photography, dramatic lighting',
};

function apiCall(prompt, size = '1024*576') {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'qwen-image-plus',
      input: { messages: [{ role: 'user', content: [{ text: prompt }] }] },
      parameters: { size }
    });
    const req = https.request({
      hostname: 'dashscope.aliyuncs.com',
      path: '/api/v1/services/aigc/multimodal-generation/generation',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          const url = data.output?.choices?.[0]?.message?.content?.[0]?.image;
          url ? resolve(url) : reject(new Error('No image in response'));
        } catch (e) { reject(new Error('JSON parse error: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      const mod = u.startsWith('https') ? require('https') : require('http');
      mod.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location);
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      }).on('error', reject);
    };
    get(url);
  });
}

function blobUpload(localPath, blobPath) {
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const tokenFlag = VERCEL_TOKEN ? ` --token ${VERCEL_TOKEN}` : '';
  const cmd = `vercel blob put "${localPath}" --pathname "${blobPath}" --access public${tokenFlag} 2>&1`;
  try {
    const out = execSync(cmd, {
      encoding: 'utf-8', timeout: 60000, cwd: SITE_DIR,
      env: { ...process.env, BLOB_READ_WRITE_TOKEN: BLOB_TOKEN }
    });
    const match = out.match(/https:\/\/[^\s]+/);
    if (!match) throw new Error('No URL in blob output: ' + out.slice(0, 200));
    return match[0];
  } catch (e) {
    const detail = e.stdout || e.stderr || e.message;
    throw new Error('Blob upload failed: ' + String(detail).slice(0, 200));
  }
}

async function genAndUpload(prompt, blobPath, size) {
  for (let i = 0; i < 3; i++) {
    try {
      const ossUrl = await apiCall(prompt, size);
      const tmp = `/tmp/img-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
      await download(ossUrl, tmp);
      const blobUrl = blobUpload(tmp, blobPath);
      fs.unlinkSync(tmp);
      return blobUrl;
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function processAuthors() {
  console.log('=== Author Headshots (8 images) ===');
  const rows = (await pool.query("SELECT slug FROM authors WHERE site=$1", [SITE])).rows;
  let done = 0;
  for (const { slug } of rows) {
    const prompt = authorPrompts[slug] || `Professional headshot of ${slug}, tech professional, studio lighting`;
    try {
      const url = await genAndUpload(prompt, `authors/electronnexus/v2/${slug}.png`, '512*512');
      await pool.query('UPDATE authors SET img=$1 WHERE site=$2 AND slug=$3', [url, SITE, slug]);
      done++;
      console.log(`  [${done}/${rows.length}] ${slug} ✓`);
    } catch (e) {
      console.log(`  [${done}/${rows.length}] ${slug} FAILED: ${e.message.slice(0, 80)}`);
    }
  }
  console.log(`Authors done: ${done}/${rows.length}`);
}

async function processArticles() {
  const args = process.argv.slice(2);
  const modeIdx = args.indexOf('articles');
  const batchSize = modeIdx >= 0 ? parseInt(args[modeIdx + 1] || '0') : 0;
  const offset = modeIdx >= 0 ? parseInt(args[modeIdx + 2] || '0') : 0;
  
  let query = "SELECT id, short_title, type FROM articles WHERE site=$1 AND (img IS NULL OR img='' OR img LIKE '%placehold%') ORDER BY id";
  const params = [SITE];
  if (batchSize > 0) { query += ' LIMIT $2 OFFSET $3'; params.push(batchSize, offset); }
  
  const articles = (await pool.query(query, params)).rows;
  console.log(`\n=== Article Covers: ${articles.length} articles, concurrency=${CONCURRENCY} ===`);
  
  let ok = 0, fail = 0, t0 = Date.now();
  const sem = { permits: CONCURRENCY, queue: [] };
  const acquire = () => sem.permits > 0 ? (sem.permits--, Promise.resolve()) : new Promise(r => sem.queue.push(r));
  const release = () => sem.queue.length > 0 ? sem.queue.shift()() : sem.permits++;

  await Promise.all(articles.map(async (a) => {
    await acquire();
    try {
      const ctx = topicPrompts[a.type] || 'consumer electronics, technology';
      const prompt = `Blog cover: ${a.short_title.replace(/-/g, ' ')}. ${ctx}. Clean editorial style. No text.`;
      const url = await genAndUpload(prompt, `covers/electronnexus/v2/${a.short_title}.png`, '1024*576');
      await pool.query('UPDATE articles SET img=$1 WHERE id=$2', [url, a.id]);
      ok++;
    } catch (e) {
      fail++;
      if (fail <= 5) console.log(`  FAIL [${a.id}] ${a.short_title}: ${e.message?.slice(0, 150)}`);
    }
    release();
    const el = ((Date.now() - t0) / 1000).toFixed(0);
    if ((ok + fail) % 10 === 0 || (ok + fail) === articles.length) {
      console.log(`  ${ok + fail}/${articles.length} | OK=${ok} FAIL=${fail} | ${el}s | ${(ok / (el || 1)).toFixed(1)}/s`);
    }
  }));
  
  const el = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\nDone: ${ok} OK, ${fail} failed in ${el}s`);
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('authors') ? 'authors' : 
               args.includes('articles') ? 'articles' : 'all';
  
  if (mode === 'all' || mode === 'authors') await processAuthors();
  if (mode === 'all' || mode === 'articles') await processArticles();
  
  await pool.end();
}

main().catch(e => { console.error(e); pool.end(); process.exit(1); });
