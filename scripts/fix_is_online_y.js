
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({path: path.resolve('/root/vercel-projects/electronnexus/.env.local')});
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});

async function main() {
  const client = await pool.connect();
  
  // Fix is_online from 'true' to 'Y' (what queries.ts expects)
  const r = await client.query("UPDATE articles SET is_online='Y' WHERE site='electronnexus'");
  console.log('Updated is_online to Y:', r.rowCount, 'rows');
  
  // Verify
  const v = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus' AND is_online='Y'");
  console.log('is_online=Y count:', v.rows[0].count);
  
  const v2 = await client.query("SELECT COUNT(*) FROM articles WHERE site='electronnexus' AND is_online='true'");
  console.log('is_online=true count:', v2.rows[0].count);
  
  await client.release();
  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
