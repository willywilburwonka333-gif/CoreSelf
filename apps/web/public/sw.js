const CACHE_NAME = 'core-self-genesis-1-3';
const CORE_FILES = ['/', '/manifest.webmanifest'];

async function warmAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch('/', { cache: 'reload' });
  if (!response.ok) throw new Error('App shell unavailable');
  const html = await response.clone().text();
  await cache.put('/', response);
  const assetPaths = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((path) => path.startsWith('/') && !path.startsWith('/api/'));
  await Promise.allSettled([...new Set([...CORE_FILES, ...assetPaths])].map((path) => cache.add(path)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(warmAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
