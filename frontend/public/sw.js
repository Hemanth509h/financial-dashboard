const CACHE_NAME = 'gigfinance-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
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
  // Use a Network First strategy for navigate requests (SPA routing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (event.request.url.includes('manifest.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Bypass cache for all API requests to ensure live data
  if (event.request.url.includes('/api/')) {
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
