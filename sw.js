const CACHE = 'heros-compass-v16';
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
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});
