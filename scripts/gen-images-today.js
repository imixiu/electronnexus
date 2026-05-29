const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const localEnv = fs.readFileSync(envPath, 'utf8');
for (const line of localEnv.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const realEnvPath = path.join(__dirname, '..', '.env.real');
if (fs.existsSync(realEnvPath)) {
  const realEnv = fs.readFileSync(realEnvPath, 'utf8');
  const dbMatch = realEnv.match(/^DATABASE_URL=(.+)$/m);
  if (dbMatch) process.env.DATABASE_URL = dbMatch[1].trim();
}

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const https = require('https');
const { execSync } = require('child_process');

const SITE = 'electronnexus';
const SITE_DIR = '/root/vercel-projects/electronnexus';
const API_KEY = process.env.DASHSCOPE_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const topicPrompts = {
  'smartphones': 'smartphone device on clean surface, modern mobile technology, professional product photography, editorial style',
  'laptopspcs': 'laptop computer on clean desk, modern workspace, professional product photography, editorial style',
  'audio': 'premium headphones and audio equipment, professional product photography, studio lighting, editorial style',
  'smarthome': 'smart home devices, connected technology, IoT gadgets, modern interior, professional editorial photography',
  'wearables': 'smartwatch on wrist, wearable technology, fitness tracker, professional product photography, clean background',
  'gaming': 'gaming peripherals, RGB keyboard mouse, gaming monitor, professional product photography, dramatic lighting',
  'more': 'consumer electronics gadgets, modern technology products, professional product photography, clean editorial style',
};

const TARGET_IDS = [1338610, 1338611, 1338612, 1338613, 1338614, 1338615, 1338616, 1338617, 1338618, 1338619, 1338620, 1338621, 1338622, 1338623, 1338624, 1338625];

function apiCall(prompt, size) {
  size = size || '1024*576';
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
      headers: { 'Authorization': 'Bearer ' + API_KEY, 'Content-Type': 'application/json' },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          const url = data.output && data.output.choices && data.output.choices[0] && data.output.choices[0].message && data.output.choices[0].message.content && data.output.choices[0].message.content[0] && data.output.choices[0].message.content[0].image;
          url ? resolve(url) : reject(new Error('No image: ' + JSON.stringify(data).slice(0,200)));
        } catch (e) { reject(new Error('Parse: ' + e.message)); }
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
  const cmd = 'vercel blob put "' + filePath + '" --pathname "' + blobPath + '" --access public 2>&1';
  const out = execSync(cmd, {
    encoding: 'utf-8', timeout: 60000, cwd: SITE_DIR,
    env: Object.assign({}, process.env, { BLOB_READ_WRITE_TOKEN: BLOB_TOKEN })
  });
  const match = out.match(/https:\/\/[^\s]+/);
  if (!match) throw new Error('No URL in blob output');
  return match[0];
}

async function genAndUpload(prompt, blobPath, size) {
  for (let i = 0; i < 3; i++) {
    try {
      const ossUrl = await apiCall(prompt, size);
      const tmp = '/tmp/img-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.png';
      await download(ossUrl, tmp);
      const blobUrl = blobUpload(tmp, blobPath);
      try { fs.unlinkSync(tmp); } catch(e) {}
      return blobUrl;
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

(async () => {
  const articles = (await pool.query(
    "SELECT id, short_title, type FROM articles WHERE site=$1 AND id = ANY($2) AND (img IS NULL OR img='') ORDER BY id",
    ['electronnexus', TARGET_IDS]
  )).rows;

  console.log('Found ' + articles.length + ' articles needing images');
  if (articles.length === 0) { console.log('Nothing to do'); await pool.end(); return; }

  let ok = 0, fail = 0, t0 = Date.now();
  for (const a of articles) {
    try {
      const ctx = topicPrompts[a.type] || 'consumer electronics, technology';
      const prompt = 'Blog cover: ' + a.short_title.replace(/-/g, ' ') + '. ' + ctx + '. Clean editorial style. No text.';
      console.log('Generating [' + a.id + '] ' + a.short_title + '...');
      const url = await genAndUpload(prompt, 'covers/electronnexus/v2/' + a.short_title + '.png', '1024*576');
      await pool.query('UPDATE articles SET img=$1 WHERE id=$2', [url, a.id]);
      ok++;
      console.log('[' + ok + '/' + articles.length + '] OK: ' + a.id);
    } catch (e) {
      fail++;
      console.log('FAIL [' + a.id + ']: ' + (e.message || '').slice(0, 150));
    }
  }
  const el = ((Date.now() - t0) / 1000).toFixed(0);
  console.log('\nDone: ' + ok + ' OK, ' + fail + ' failed in ' + el + 's');
  await pool.end();
})().catch(e => { console.error(e); pool.end(); process.exit(1); });
