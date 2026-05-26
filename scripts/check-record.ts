import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const rows = await sql`SELECT id, site, type, tag, short_title, title, description, LEFT(body, 300) as body_preview FROM articles WHERE site='electronnexus' ORDER BY id DESC LIMIT 1`;
console.log(JSON.stringify(rows[0], null, 2));
