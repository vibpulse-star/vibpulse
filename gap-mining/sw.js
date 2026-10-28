const PREFIX = 'gap-mining-';
const CACHE = PREFIX + 'v1';
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "app.js", "score.js", "../shared/app.css", "../shared/install.js", "../shared/store.js", "../shared/dom.js"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

// Only delete this app's old caches: all three apps share one origin.
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Serve the cached copy instantly (works offline) and refresh it from the network in the background.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request)
      .then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; })
      .catch(() => cached);
    return cached || fresh;
  }));
});
