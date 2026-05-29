
const { Pool } = require('pg');
require('dotenv').config({path: __dirname + '/.env.local'});
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});

async function main() {
  const client = await pool.connect();
  
  let r = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus'");
  console.log('Total:', r.rows[0].count);
  
  r = await client.query("SELECT author, COUNT(*) as cnt FROM articles WHERE site='electronnexus' GROUP BY author ORDER BY author");
  console.log('\nBy author:');
  r.rows.forEach(row => console.log('  ' + row.author + ': ' + row.cnt));
  
  r = await client.query("SELECT type, COUNT(*) as cnt FROM articles WHERE site='electronnexus' GROUP BY type ORDER BY type");
  console.log('\nBy category:');
  r.rows.forEach(row => console.log('  ' + (row.type || 'NULL') + ': ' + row.cnt));
  
  r = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus' AND (img IS NULL OR img='')");
  console.log('\nMissing images:', r.rows[0].count);
  
  r = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus' AND (author IS NULL OR author='')");
  console.log('Missing authors:', r.rows[0].count);
  
  r = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus' AND (description IS NULL OR description='')");
  console.log('Missing descriptions:', r.rows[0].count);
  
  r = await client.query("SELECT id, title, author, type, img FROM articles WHERE site='electronnexus' AND published_time::date = '2026-05-29' ORDER BY id");
  console.log('\nToday (2026-05-29):', r.rows.length, 'articles');
  r.rows.forEach(row => console.log('  ID:' + row.id + ' | ' + row.author + ' | ' + (row.type||'?') + ' | img:' + (row.img ? 'YES' : 'NO') + ' | ' + row.title.substring(0,70)));
  
  r = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus' AND published_time::date = '2026-05-28'");
  console.log('\nYesterday (2026-05-28):', r.rows[0].count);
  
  r = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus' AND LENGTH(title) > 200");
  console.log('Long titles (>200):', r.rows[0].count);
  
  r = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus' AND is_online='true'");
  console.log('\nis_online=true:', r.rows[0].count);
  r = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus' AND (is_online IS NULL OR is_online != 'true')");
  console.log('is_online!=true:', r.rows[0].count);
  
  r = await client.query("SELECT id, title, author, type, published_time FROM articles WHERE site='electronnexus' ORDER BY published_time DESC LIMIT 5");
  console.log('\nLatest 5:');
  r.rows.forEach(row => console.log('  ' + row.id + ' | ' + row.published_time + ' | ' + row.author + ' | ' + row.title.substring(0,60)));
  
  await client.release();
  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
