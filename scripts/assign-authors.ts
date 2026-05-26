import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const SITE = "electronnexus";

// Authors excluding "team" (id 292)
const AUTHORS = ["Alex Chen", "Sarah Mitchell", "David Kumar", "Emma Wilson", "James Park", "Lisa Tanaka", "Mike Russo"];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  // Get all articles without author, ordered by id desc (newest first = closest to today)
  const rows = await sql`
    SELECT id FROM articles WHERE site=${SITE} AND (author IS NULL OR author='') ORDER BY id DESC
  `;
  console.log(`Articles to assign: ${rows.length}`);

  // Build assignment schedule going backwards from 2026-05-26
  // Each workday (Mon-Sat): 7 authors × 3 articles = 21 per day
  const assignments: { id: number; author: string; date: Date }[] = [];
  let cursor = new Date("2026-05-26");
  let idx = 0;

  while (idx < rows.length) {
    // Skip Sunday (0)
    if (cursor.getDay() === 0) {
      cursor = addDays(cursor, -1);
      continue;
    }
    for (const author of AUTHORS) {
      for (let i = 0; i < 3; i++) {
        if (idx >= rows.length) break;
        assignments.push({ id: (rows[idx] as any).id, author, date: new Date(cursor) });
        idx++;
      }
      if (idx >= rows.length) break;
    }
    cursor = addDays(cursor, -1);
  }

  console.log(`Assigning ${assignments.length} articles...`);

  // Batch update in chunks of 500
  const CHUNK = 500;
  for (let i = 0; i < assignments.length; i += CHUNK) {
    const chunk = assignments.slice(i, i + CHUNK);
    for (const a of chunk) {
      await sql`
        UPDATE articles SET author=${a.author}, published_time=${a.date.toISOString()}
        WHERE id=${a.id}
      `;
    }
    console.log(`Progress: ${Math.min(i + CHUNK, assignments.length)}/${assignments.length}`);
  }
  console.log("Done.");
}

main().catch(console.error);
