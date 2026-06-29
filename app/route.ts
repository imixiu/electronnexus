import { INDEX_HTML } from "../lib/index-html";
import { query } from "../lib/db";

const TYPE_LABELS: Record<string, string> = {
  smartphones: "Smartphones",
  laptopspcs: "Laptops & Computers",
  audio: "Audio & Headphones",
  smarthome: "Smart Home",
  wearables: "Wearables",
  gaming: "Gaming & Entertainment",
  informational: "Guides & Tips",
  comparative: "Comparisons",
  commercial: "Buying Guides",
  review: "Reviews",
  more: "More Electronics",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildFeaturedMain(a: any): string {
  const typeLabel = TYPE_LABELS[a.type] || a.type;
  const href = `/${a.type}/${a.short_title}`;
  const title = escapeHtml(a.title);
  const desc = a.description
    ? escapeHtml(a.description.length > 160 ? a.description.slice(0, 157) + "..." : a.description)
    : "";
  const imgHtml = a.img
    ? `<a href="${href}"><div class="img-placeholder" style="background-image:url('${a.img}');background-size:cover;background-position:center"></div></a>`
    : `<a href="${href}"><div class="img-placeholder">📱</div></a>`;
  return `<div class="featured-main">
${imgHtml}
<div class="content">
<span class="tag">${escapeHtml(typeLabel)}</span>
<h3><a href="${href}">${title}</a></h3>
<p>${desc}</p>
</div>
</div>`;
}

function buildFeaturedSide(articles: any[]): string {
  const items = articles.map((a, i) => {
    const typeLabel = TYPE_LABELS[a.type] || a.type;
    const href = `/${a.type}/${a.short_title}`;
    const title = escapeHtml(a.title);
    const author = escapeHtml(a.author || "ElectronNexus Team");
    const num = String(i + 1).padStart(2, "0");
    return `<a href="${href}" class="featured-item"><div class="num">${num}</div><div class="info"><h4>${title}</h4><p>${author} · ${escapeHtml(typeLabel)}</p></div></a>`;
  });
  return items.join("\n");
}

function buildArticleCards(articles: any[]): string {
  return articles
    .map((a) => {
      const typeLabel = TYPE_LABELS[a.type] || a.type;
      const href = `/${a.type}/${a.short_title}`;
      const title = escapeHtml(a.title);
      const author = escapeHtml(a.author || "ElectronNexus Team");
      const imgHtml = a.img
        ? `<div class="card-img" style="background-image:url('${a.img}');background-size:cover;background-position:center"></div>`
        : `<div class="card-img">📰</div>`;
      return `<div class="article-card">
${imgHtml}
<div class="card-body">
<div class="card-type">${escapeHtml(typeLabel)}</div>
<h3><a href="${href}">${title}</a></h3>
<div class="card-meta"><span class="author">${author}</span></div>
</div>
</div>`;
    })
    .join("\n");
}

function buildTrending(articles: any[]): string {
  return articles
    .map((a, i) => {
      const typeLabel = TYPE_LABELS[a.type] || a.type;
      const href = `/${a.type}/${a.short_title}`;
      const title = escapeHtml(a.title);
      const author = escapeHtml(a.author || "ElectronNexus Team");
      const num = String(i + 1).padStart(2, "0");
      return `<a href="${href}" class="trending-item">
<div class="trending-rank">${num}</div>
<div class="trending-info">
<span class="cat">${escapeHtml(typeLabel)}</span>
<h4>${title}</h4>
<p>${author}</p>
</div>
</a>`;
    })
    .join("\n");
}

export async function GET() {
  let html = INDEX_HTML;

  try {
    const rows = await query(
        "SELECT short_title, title, type, img, author, description FROM articles WHERE site='electronnexus' AND is_online='Y' ORDER BY published_time IS NULL, published_time DESC, id DESC LIMIT 18"
      ) as any[];

      if (rows.length >= 2) {
        const featuredMain = rows[0];
        const featuredSide = rows.slice(1, 6);
        const latestCards = rows.slice(6, 12);
        const trending = rows.slice(12, 17);

        // --- Featured Stories ---
        html = html.replace(
          /(<div class="featured-grid">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>\s*<!-- LATEST)/,
          (_match, p1) => `${p1}\n${buildFeaturedMain(featuredMain)}\n<div class="featured-side">\n${buildFeaturedSide(featuredSide)}\n</div>\n</div>\n</div>\n</section>\n\n<!-- LATEST`
        );

        // --- Latest Articles ---
        if (latestCards.length > 0) {
          html = html.replace(
            /(<div class="articles-grid">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>\s*<!-- EXPERT REVIEWS)/,
            (_match, p1) => `${p1}\n${buildArticleCards(latestCards)}\n</div>\n</div>\n</section>\n\n<!-- EXPERT REVIEWS`
          );
        }

        // --- Trending Now ---
        if (trending.length > 0) {
          html = html.replace(
            /(<div class="trending-list">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>\s*<!-- NEWSLETTER)/,
            (_match, p1) => `${p1}\n${buildTrending(trending)}\n</div>\n</div>\n</section>\n\n<!-- NEWSLETTER`
          );
        }
      }
  } catch (e) {
    console.error("Failed to fetch articles:", e);
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=31536000",
    },
  });
}
