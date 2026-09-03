import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Category → Alibaba showroom mapping
const SHOWROOM_MAP: Record<string, string> = {
  smartphones: "smartphones",
  laptopspcs: "laptops",
  audio: "audio",
  smarthome: "smarthome",
  wearables: "wearables",
  gaming: "gaming",
  more: "consumer-electronics",
};

const SHOWROOM_DEFAULT =
  "https://www.alibaba.com/showroom/consumer-electronics.html?outsite=1";

function getShowroomUrl(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    const cat = SHOWROOM_MAP[segments[0]];
    if (cat)
      return `https://www.alibaba.com/showroom/${cat}.html?outsite=1`;
  }
  return SHOWROOM_DEFAULT;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // www → root
  if (host.startsWith("www.")) {
    const url = request.nextUrl.clone();
    url.host = host.slice(4);
    return NextResponse.redirect(url, 301);
  }

  const { pathname, searchParams } = request.nextUrl;

  // Page param normalization (legacy SEO compat)
  const pageParam = searchParams.get("page");
  if (pageParam) {
    const page = parseInt(pageParam, 10);
    if (page <= 1) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("page");
      return NextResponse.redirect(url, 301);
    }
    if (page > 1) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("page");
      url.pathname = `${pathname}/page/${page}`;
      return NextResponse.redirect(url, 301);
    }
  }

  // ── Showroom redirect: 302 for non-bots only ──
  const cf = (request as any).cf;
  const bm = cf?.botManagement;
  const hasBotManagement = bm && bm.score !== undefined;

  let isBot = false;
  if (hasBotManagement) {
    // CF Bot Management available (paid feature)
    isBot = bm.verifiedBot === true || bm.score < 30;
  } else {
    // Fallback: comprehensive UA-based detection
    const ua = (request.headers.get("user-agent") || "").toLowerCase();
    const botPatterns = [
      "googlebot", "bingbot", "baiduspider", "yandex", "duckduckbot",
      "slurp", "applebot", "facebookexternalhit", "facebookcatalog",
      "twitterbot", "linkedinbot", "slackbot", "discordbot", "whatsapp",
      "pinterestbot", "semrushbot", "ahrefsbot", "mj12bot", "dotbot",
      "petalbot", "bytespider", "sogou", "exabot", "ia_archiver",
      "screaming frog", "crawler", "spider", "bot/", "bot;",
      "headlesschrome", "phantomjs", "wget", "curl", "python-requests",
      "scrapy", "httpclient", "apache-httpclient", "okhttp",
      "google-structured-data", "google-read-aloud", "google-safety",
      "mediapartners-google", "adsbot-google", "google-physicalweb",
      "lighthouse", "pagespeed", "gtmetrix", "pingdom", "uptimerobot",
      "sitechecker", "woorank", "seositecheckup",
    ];
    isBot = botPatterns.some((p) => ua.includes(p));
  }

  if (!isBot) {
    const target = getShowroomUrl(pathname);
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: target,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  // Bots → normal page
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap|robots).*)"],
};
