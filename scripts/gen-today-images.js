
// Targeted image generation for today's electronnexus articles
const fs = require('fs');
const path = require('path');

// Load env
const realEnv = fs.readFileSync(path.join(__dirname, '..', '.env.real'), 'utf8');
const dbMatch = realEnv.match(/^DATABASE_URL=(.+)$/m);
if (dbMatch) process.env.DATABASE_URL = dbMatch[1].trim();

const localEnv = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
for (const line of localEnv.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m && !process.env[m[1]]) {
    process.env[m[1]] = m[2].trim();
  }
}

// Monkey-patch the query to only process today's articles
const origArgv = process.argv;
process.argv = ['node', 'gen-images.js', 'articles', '20', '0'];

// Override the query in gen-images.js by patching the pool
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// We need to override the articles query. Let's do it directly.
const https = require('https');
const { execSync } = require('child_process');

const SITE = 'electronnexus';
const SITE_DIR = '/root/vercel-projects/electronnexus';
const API_KEY = process.env.DASHSCOPE_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN;
const CONCURRENCY = 5;

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
          url ? resolve(url) : reject(new Error('No image in response: ' + JSON.stringify(data).slice(0,200)));
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
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { get(res.headers.location); return; }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      }).on('error', reject);
    };
    get(url);
  });
}

function blobUpload(filePath, blobPath) {
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const tokenFlag = VERCEL_TOKEN ? ` --token ${VERCEL_TOKEN}` : '';
  const cmd = `vercel blob put "${filePath}" --pathname "${blobPath}" --access public${tokenFlag} 2>&1`;
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

(async () => {
  // Get today's no-img articles for electronnexus
  const articles = (await pool.query(
    "SELECT id, short_title, type FROM articles WHERE site=$1 AND published_time >= CURRENT_DATE AND (img IS NULL OR img='') ORDER BY id",
    ['electronnexus']
  )).rows;
  
  console.log(`Found ${articles.length} articles needing images`);
  if (articles.length === 0) { console.log('Nothing to do'); await pool.end(); return; }
  
  let ok = 0, fail = 0, t0 = Date.now();
  
  for (const a of articles) {
    try {
      const ctx = topicPrompts[a.type] || 'consumer electronics, technology';
      const prompt = `Blog cover: ${a.short_title.replace(/-/g, ' ')}. ${ctx}. Clean editorial style. No text.`;
      console.log(`  Generating image for [${a.id}] ${a.short_title}...`);
      const url = await genAndUpload(prompt, `covers/electronnexus/v2/${a.short_title}.png`, '1024*576');
      await pool.query('UPDATE articles SET img=$1 WHERE id=$2', [url, a.id]);
      ok++;
      console.log(`  [${ok}/${articles.length}] OK: ${a.id} -> ${url.substring(0, 60)}...`);
    } catch (e) {
      fail++;
      console.log(`  FAIL [${a.id}]: ${e.message?.slice(0, 150)}`);
    }
  }
  
  const el = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\nDone: ${ok} OK, ${fail} failed in ${el}s`);
  await pool.end();
})().catch(e => { console.error(e); pool.end(); process.exit(1); });
