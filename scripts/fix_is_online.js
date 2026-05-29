
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({path: path.resolve('/root/vercel-projects/electronnexus/.env.local')});
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});

async function main() {
  const client = await pool.connect();
  
  // Fix is_online
  const r = await client.query("UPDATE articles SET is_online='true' WHERE site='electronnexus' AND (is_online IS NULL OR is_online != 'true')");
  console.log('Updated is_online:', r.rowCount, 'rows');
  
  // Verify
  const v = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus' AND is_online='true'");
  console.log('Now is_online=true:', v.rows[0].count);
  
  // Check broken links sample (random 5 article URLs)
  const sample = await client.query("SELECT short_title FROM articles WHERE site='electronnexus' AND short_title IS NOT NULL ORDER BY RANDOM() LIMIT 5");
  console.log('\nSample URLs to check:');
  sample.rows.forEach(r => console.log('  https://electronnexus.com/article/' + r.short_title));
  
  await client.release();
  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
