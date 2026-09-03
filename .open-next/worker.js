//@ts-expect-error: Will be resolved by wrangler build
import { handleCdnCgiImageRequest, handleImageRequest } from "./cloudflare/images.js";
//@ts-expect-error: Will be resolved by wrangler build
import { runWithCloudflareRequestContext } from "./cloudflare/init.js";
//@ts-expect-error: Will be resolved by wrangler build
import { maybeGetSkewProtectionResponse } from "./cloudflare/skew-protection.js";
// @ts-expect-error: Will be resolved by wrangler build
import { handler as middlewareHandler } from "./middleware/handler.mjs";
//@ts-expect-error: Will be resolved by wrangler build
export { DOQueueHandler } from "./.build/durable-objects/queue.js";
//@ts-expect-error: Will be resolved by wrangler build
export { DOShardedTagCache } from "./.build/durable-objects/sharded-tag-cache.js";
//@ts-expect-error: Will be resolved by wrangler build
export { BucketCachePurge } from "./.build/durable-objects/bucket-cache-purge.js";
export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {
            const response = maybeGetSkewProtectionResponse(request);
            if (response) {
                return response;
            }
            
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
                if (/\.[a-z]{2,5}$/.test(p) && !p.endsWith(".html")) return false;
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
            }
            if (request.method === "GET" && shouldCache(request.url) && isBotRequest(request)) {
                const hit = await cacheGet(request.url);
                if (hit) return hit;
            }
            const url = new URL(request.url);
            if (url.pathname === "/_next/image") {
                return new Response("Not Found", {
                    status: 404,
                    headers: { "Cache-Control": "public, max-age=86400" }
                });
            }
            // Serve images in development.
            // Note: "/cdn-cgi/image/..." requests do not reach production workers.
            if (url.pathname.startsWith("/cdn-cgi/image/")) {
                return handleCdnCgiImageRequest(url, env);
            }
            // Fallback for the Next default image loader.
            if (url.pathname ===
                `${globalThis.__NEXT_BASE_PATH__}/_next/image${globalThis.__TRAILING_SLASH__ ? "/" : ""}`) {
                return await handleImageRequest(url, request.headers, env);
            }
            // - `Request`s are handled by the Next server
            const reqOrResp = await middlewareHandler(request, env, ctx);
            if (reqOrResp instanceof Response) {
                if (request.method === "GET" && shouldCache(request.url) && isBotRequest(request)) {
                    return await cachePut(request.url, reqOrResp);
                }
                return reqOrResp;
            }
            // @ts-expect-error: resolved by wrangler build
            const { handler } = await import("./server-functions/default/handler.mjs");
            const resp = await handler(reqOrResp, env, ctx, request.signal);
            if (request.method === "GET" && shouldCache(request.url) && isBotRequest(request)) {
                return await cachePut(request.url, resp);
            }
            return resp;
        });
    },
};
