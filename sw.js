const CACHE_NAME = "febdays2026-fusion-v2";
const ASSETS = [
  "./","./index.html","./styles.css","./config.js","./app.js",
  "./manifest.webmanifest","./assets/icon.svg",
  "./assets/logo-feb.png",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
  "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    for (const asset of ASSETS) { try { await cache.add(asset); } catch (_) {} }
  }));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy)).catch(() => {});
    return res;
  })));
});
