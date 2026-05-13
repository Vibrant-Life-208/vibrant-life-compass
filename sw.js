const CACHE = 'heros-compass-v49';
const CORE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/app.js',
  '/js/arrive.js',
  '/js/auth.js',
  '/js/studios.js',
  '/js/store.js',
  '/js/crypto.js',
  '/js/north.js',
  '/js/year-map.js',
  '/js/year-view.js',
  '/js/session-view.js',
  '/js/patterns.js',
  '/js/modals.js',
  '/js/logins.js',
  '/js/stillness.js',
  '/js/tasks.js',
  '/js/game-plan.js',
  '/js/partner.js',
  '/js/parent-view.js',
  '/js/admin.js',
  '/js/setup.js',
  '/js/backend/config.js',
  '/js/backend/local-store.js',
  '/js/backend/supabase-adapter.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Network-first for JS, CSS, HTML, JSON, SVG - so reloads pick up code changes
  // immediately. Cache is the fallback when offline.
  const isCode = /\.(js|mjs|css|html|json|svg)(\?|$)/.test(url.pathname);
  if (isCode) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  // Other assets (icons, fonts, etc.) - cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});
