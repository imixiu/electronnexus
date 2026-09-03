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
  "https://www.alibaba.com/showroom/consumer-electronics.html?ots=electronnexus";

function getShowroomUrl(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    const cat = SHOWROOM_MAP[segments[0]];
    if (cat)
      return `https://www.alibaba.com/showroom/${cat}.html?ots=electronnexus`;
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
    // Fallback: comprehensive UA-based detection (all lowercase, UA already lowercased)
    const ua = (request.headers.get("user-agent") || "").toLowerCase();
    const botPatterns = [
      // Search engine crawlers
      "googlebot", "google-structured-data", "google-read-aloud",
      "google-safety", "mediapartners-google", "adsbot-google",
      "google-physicalweb", "google-inspectiontool",
      "bingbot", "msnbot", "bingpreview",
      "yandex", "yandexbot", "yandeximages", "yandexvideo",
      "yandexmediabot", "yandexmetrika",
      "baiduspider", "baidu-image", "baidu-mobaider",
      "duckduckbot", "applebot", "applebot-extended",
      "yahoo", "slurp", "y!j", "y!j-brw", "y!j-asr",
      "naver", "yeti", "naverbot", "me2day",
      "daum", "daumoa", "daumweb",
      "seznam", "seznambot",
      "sogou", "sogou web spider", "sogou orion spider",
      "360spider", "sosospider", "qihoo",
      "petalbot", "bytespider", "toutiao",
      
      // SEO/monitoring tools
      "semrushbot", "semrush", "ahrefsbot", "ahrefs",
      "mj12bot", "dotbot", "rogerbot", "screaming frog",
      "lighthouse", "pagespeed", "gtmetrix", "pingdom",
      "uptimerobot", "sitechecker", "woorank", "seositecheckup",
      "majestic", "mozbot", "cognitiveseo", "seranking",
      "similarweb", "builtwith", "wappalyzer",
      
      // Social media / preview bots
      "facebookexternalhit", "facebookcatalog", "facebot",
      "twitterbot", "linkedinbot", "slackbot", "discordbot",
      "telegrambot", "whatsapp", "viber", "skypeuripreview",
      "pinterestbot", "line/", "wechat",
      
      // Generic bot patterns
      "crawler", "spider", "bot/", "bot;", "bot-", "robot",
      "ia_archiver", "exabot", "alexabot",
      
      // Headless/automation tools
      "headlesschrome", "phantomjs", "puppeteer", "playwright",
      "selenium", "webdriver", "cypress", "nightmare",
      
      // HTTP clients / scrapers
      "wget", "curl", "python-requests", "scrapy",
      "httpclient", "apache-httpclient", "okhttp",
      "java/", "go-http-client", "node-fetch",
      "axios", "libwww-perl", "ruby", "perl",
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
