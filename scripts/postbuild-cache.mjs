/**
 * Postbuild script: inject CF Cache API into OpenNext worker.js
 * Caches GET 200 responses for content pages (1 year).
 * Skips sitemap, _next, api, and non-200 responses.
 */
import { readFileSync, writeFileSync } from "fs";

const WORKER_PATH = ".open-next/worker.js";
const worker = readFileSync(WORKER_PATH, "utf-8");

// 1. Cache helpers + bot detection (shared between cache and middleware)
const cacheHelpers = `
            // --- Bot detection (for cache gating) ---
            function isBotRequest(request) {
                const cf = request.cf;
                if (cf && cf.botManagement) {
                    if (cf.botManagement.verifiedBot === true) return true;
                    if (cf.botManagement.score !== undefined && cf.botManagement.score < 30) return true;
                }
                const ua = (request.headers.get("user-agent") || "").toLowerCase();
                const bots = [
                    "googlebot","google-structured-data","google-read-aloud","google-safety",
                    "mediapartners-google","adsbot-google","google-physicalweb","google-inspectiontool",
                    "bingbot","msnbot","bingpreview",
                    "yandex","yandexbot","yandeximages","yandexvideo","yandexmediabot","yandexmetrika",
                    "baiduspider","baidu-image","baidu-mobaider",
                    "duckduckbot","applebot","applebot-extended",
                    "yahoo","slurp","y!j","y!j-brw","y!j-asr",
                    "naver","yeti","naverbot","me2day",
                    "daum","daumoa","daumweb",
                    "seznam","seznambot",
                    "sogou","sogou web spider","sogou orion spider",
                    "360spider","sosospider","qihoo",
                    "petalbot","bytespider","toutiao",
                    "semrushbot","semrush","ahrefsbot","ahrefs",
                    "mj12bot","dotbot","rogerbot","screaming frog",
                    "lighthouse","pagespeed","gtmetrix","pingdom",
                    "uptimerobot","sitechecker","woorank","seositecheckup",
                    "majestic","mozbot","cognitiveseo","seranking",
                    "similarweb","builtwith","wappalyzer",
                    "facebookexternalhit","facebookcatalog","facebot",
                    "twitterbot","linkedinbot","slackbot","discordbot",
                    "telegrambot","whatsapp","viber","skypeuripreview",
                    "pinterestbot","line/","wechat",
                    "crawler","spider","bot/","bot;","bot-","robot",
                    "ia_archiver","exabot","alexabot",
                    "headlesschrome","phantomjs","puppeteer","playwright",
                    "selenium","webdriver","cypress","nightmare",
                    "wget","curl","python-requests","scrapy",
                    "httpclient","apache-httpclient","okhttp",
                    "java/","go-http-client","node-fetch",
                    "axios","libwww-perl","ruby","perl"
                ];
                return bots.some(p => ua.includes(p));
            }
            // --- CF Cache API ---
            function shouldCache(url) {
                const p = new URL(url).pathname;
                if (p.startsWith("/sitemap/") || p.startsWith("/_next/") || p.startsWith("/api/")) return false;
                if (/\\.[a-z]{2,5}$/.test(p) && !p.endsWith(".html")) return false;
                return true;
            }
            async function cacheGet(url) {
                try {
                    const key = new Request(url, { method: "GET", headers: {} });
                    const hit = await caches.default.match(key);
                    if (hit) {
                        const r = new Response(hit.body, hit);
                        r.headers.set("x-cache", "HIT");
                        return r;
                    }
                } catch(e) {}
                return null;
            }
            async function cachePut(url, resp) {
                if (resp.status !== 200) {
                    resp.headers.set("x-cache", "SKIP-" + resp.status);
                    return resp;
                }
                try {
                    const body = await resp.arrayBuffer();
                    const key = new Request(url, { method: "GET", headers: {} });
                    const h = new Headers(resp.headers);
                    h.delete("vary");
                    h.set("cache-control", "public, max-age=315360000, s-maxage=315360000");
                    await caches.default.put(key, new Response(body, { status: 200, headers: h }));
                    const rh = new Headers(resp.headers);
                    rh.set("cache-control", "public, max-age=315360000, s-maxage=315360000");
                    rh.set("x-cache", "MISS");
                    return new Response(body, { status: 200, headers: rh });
                } catch(e) {
                    resp.headers.set("x-cache", "ERR");
                    return resp;
                }
            }`;

// Inject after skew protection check
let patched = worker.replace(
    "const url = new URL(request.url);",
    cacheHelpers + "\n            const url = new URL(request.url);"
);

// 2. Cache lookup before middleware — ONLY for bot requests
// Humans must always go through middleware for 302 redirect logic
const lastHelperLine = cacheHelpers.split("\n").pop().trim();
patched = patched.replace(
    lastHelperLine + "\n            const url = new URL(request.url);",
    lastHelperLine + `
            if (request.method === "GET" && shouldCache(request.url) && isBotRequest(request)) {
                const hit = await cacheGet(request.url);
                if (hit) return hit;
            }
            const url = new URL(request.url);`
);

// 3. Intercept middleware Response return — only cache for bot requests
patched = patched.replace(
    `            if (reqOrResp instanceof Response) {
                return reqOrResp;
            }`,
    `            if (reqOrResp instanceof Response) {
                if (request.method === "GET" && shouldCache(request.url) && isBotRequest(request)) {
                    return await cachePut(request.url, reqOrResp);
                }
                return reqOrResp;
            }`
);

// 4. Intercept handler return — only cache for bot requests
patched = patched.replace(
    `            return handler(reqOrResp, env, ctx, request.signal);`,
    `            const resp = await handler(reqOrResp, env, ctx, request.signal);
            if (request.method === "GET" && shouldCache(request.url) && isBotRequest(request)) {
                return await cachePut(request.url, resp);
            }
            return resp;`
);


// 7. Block /_next/image at Worker entry — unoptimized: true means this route should never be hit
patched = patched.replace(
    `            const url = new URL(request.url);`,
    `            const url = new URL(request.url);
            if (url.pathname === "/_next/image") {
                return new Response("Not Found", {
                    status: 404,
                    headers: { "Cache-Control": "public, max-age=86400" }
                });
            }`
);

writeFileSync(WORKER_PATH, patched);
console.log("✓ Injected CF Cache API (URL+status-based, middleware+handler)");

// Delete static index.html from assets so route handler takes over
import { unlinkSync } from "fs";
try {
  unlinkSync(".open-next/assets/index.html");
  console.log("✓ Deleted .open-next/assets/index.html");
} catch(e) {
  console.log("(no static index.html to delete)");
}
