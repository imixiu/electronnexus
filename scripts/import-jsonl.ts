import { neon } from "@neondatabase/serverless";
import * as https from "https";

const URL = "https://smartbuy.alibaba.com/verticalSite/readOss.vhtml?path=/vertical_site/outsite/&file=dianzi.jsonl";
const SITE = "electronnexus";

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function parseRecord(line: string) {
  const obj = JSON.parse(line);
  const customId: string = obj.custom_id; // e.g. "smartphones|Strike Pack What..."
  const pipeIdx = customId.indexOf("|");
  const tag = pipeIdx >= 0 ? customId.substring(0, pipeIdx) : "";
  const rawTitle = pipeIdx >= 0 ? customId.substring(pipeIdx + 1) : customId;
  const shortTitle = rawTitle.toLowerCase().replace(/\s+/g, "-");

  const content = JSON.parse(obj.response.body.choices[0].message.content);
  return {
    tag,
    shortTitle,
    type: content.type as string,
    title: content.title as string,
    description: content.description as string,
    body: content.article as string,
  };
}

async function main() {
  const testOnly = process.argv[2] === "--test";
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Fetching JSONL...");
  const raw = await fetchUrl(URL);
  const lines = raw.split("\n").filter((l) => l.trim());
  console.log(`Total records: ${lines.length}`);

  const toProcess = testOnly ? lines.slice(0, 1) : lines;

  let ok = 0, skip = 0, err = 0;
  for (const line of toProcess) {
    try {
      const r = parseRecord(line);
      await sql`
        INSERT INTO articles (site, type, short_title, title, description, body, tag, language, is_online)
        VALUES (${SITE}, ${r.type}, ${r.shortTitle}, ${r.title}, ${r.description}, ${r.body}, ${r.tag}, 'en', 'Y')
        ON CONFLICT (site, short_title) DO UPDATE SET
          type = EXCLUDED.type,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          body = EXCLUDED.body,
          tag = EXCLUDED.tag
      `;
      console.log(`[OK] ${r.shortTitle.substring(0, 60)}`);
      ok++;
    } catch (e: any) {
      console.error(`[ERR] ${e.message}`);
      err++;
    }
  }
  console.log(`\nDone: ${ok} inserted/updated, ${skip} skipped, ${err} errors`);
}

main().catch(console.error);
