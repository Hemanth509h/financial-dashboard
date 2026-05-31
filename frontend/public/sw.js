const CACHE_NAME = 'gigfinance-v8';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.svg'
];

async function cacheCurrentBuild(cache) {
  const response = await fetch('/index.html', { cache: 'reload' });
  if (!response.ok) return;

  const html = await response.clone().text();
  await cache.put('/index.html', response);

  const assetUrls = Array.from(
    html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g),
    (match) => match[1],
  );

  await Promise.allSettled(
    assetUrls.map((assetUrl) => cache.add(new Request(assetUrl, { cache: 'reload' }))),
  );
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await cache.addAll(urlsToCache);
        await cacheCurrentBuild(cache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Use a Network First strategy for navigate requests (SPA routing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (url.includes('manifest.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Bypass cache for all API requests to ensure live data
  if (url.includes('/api/')) {
    return;
  }

  // Use Stale-While-Revalidate for other assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            if (event.request.url.startsWith('http') && event.request.method === 'GET') {
              cache.put(event.request, fetchRes.clone());
            }
            return fetchRes;
          });
        });
      }).catch(err => {
        console.error('Fetch failed:', err);
        throw err;
      })
  );
});
