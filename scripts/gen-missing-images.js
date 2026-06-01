const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const { neon } = require('@neondatabase/serverless');

require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);
const API_KEY = process.env.DASHSCOPE_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const SITE = 'electronnexus';
const CONCURRENCY = 3;

const topicPrompts = {
  smartphones: 'smartphone device on clean surface, modern mobile technology, professional product photography, editorial style',
  laptopspcs: 'laptop computer on clean desk, modern workspace, professional product photography, editorial style',
  audio: 'premium headphones and audio equipment, professional product photography, studio lighting, editorial style',
  smarthome: 'smart home devices, connected technology, IoT gadgets, modern interior, professional editorial photography',
  wearables: 'smartwatch on wrist, wearable technology, fitness tracker, professional product photography, clean background',
  gaming: 'gaming peripherals, RGB keyboard mouse, gaming monitor, professional product photography, dramatic lighting',
  more: 'consumer electronics accessories, tech gadgets, professional product photography, clean editorial style',
  informational: 'technology guide concept, clean infographic style, modern editorial photography',
  comparative: 'side by side tech product comparison, professional editorial photography',
  commercial: 'buying guide concept, consumer electronics, professional editorial photography',
  review: 'tech product review setup, professional editorial photography',
};

function apiCall(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'qwen-image-plus',
      input: { messages: [{ role: 'user', content: [{ text: prompt }] }] },
      parameters: { size: '1024*576' }
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
          url ? resolve(url) : reject(new Error('No image: ' + JSON.stringify(data).slice(0, 200)));
        } catch (e) { reject(e); }
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

function blobUpload(localPath, blobPath) {
  const cmd = `vercel blob put "${localPath}" --pathname "${blobPath}" --access public 2>&1`;
  const out = execSync(cmd, {
    encoding: 'utf-8', timeout: 60000,
    cwd: '/root/vercel-projects/electronnexus',
    env: { ...process.env, BLOB_READ_WRITE_TOKEN: BLOB_TOKEN }
  });
  const match = out.match(/https:\/\/[^\s]+/);
  if (!match) throw new Error('No URL in blob output: ' + out.slice(0, 200));
  return match[0];
}

async function genAndUpload(prompt, blobPath) {
  for (let i = 0; i < 3; i++) {
    try {
      const ossUrl = await apiCall(prompt);
      const tmp = `/tmp/img-${Date.now()}.png`;
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

async function main() {
  const articles = await sql`
    SELECT id, short_title, type FROM articles
    WHERE site=${SITE} AND is_online='Y' AND (img IS NULL OR img='')
    ORDER BY id DESC
  `;
  console.log(`共 ${articles.length} 篇无图文章，并发=${CONCURRENCY}`);

  let ok = 0, fail = 0;
  const sem = { permits: CONCURRENCY, queue: [] };
  const acquire = () => sem.permits > 0 ? (sem.permits--, Promise.resolve()) : new Promise(r => sem.queue.push(r));
  const release = () => sem.queue.length > 0 ? sem.queue.shift()() : sem.permits++;

  await Promise.all(articles.map(async (a, i) => {
    await acquire();
    try {
      const ctx = topicPrompts[a.type] || 'consumer electronics, technology';
      const prompt = `Blog cover: ${a.short_title.replace(/-/g, ' ')}. ${ctx}. Clean editorial style. No text.`;
      const url = await genAndUpload(prompt, `covers/electronnexus/v2/${a.short_title}.png`);
      await sql`UPDATE articles SET img=${url} WHERE id=${a.id}`;
      ok++;
      console.log(`[${ok+fail}/${articles.length}] ✓ ${a.short_title}`);
    } catch (e) {
      fail++;
      console.log(`[${ok+fail}/${articles.length}] ✗ ${a.short_title}: ${e.message.slice(0, 80)}`);
    } finally {
      release();
    }
  }));

  console.log(`\n完成: ${ok} 成功, ${fail} 失败`);
}

main().catch(console.error);
