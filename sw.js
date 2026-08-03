// Service Worker for JAGGAER Prospect Intelligence
// Provides offline support and caching strategy

const CACHE_NAME = 'jaggaer-dashboard-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install event - cache assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE).catch(function(err) {
        console.log('Cache addAll error:', err);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') { return; }
  // Network-first: always try the network so new deploys load immediately; fall back to cache offline.
  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response && response.status === 200 && response.type !== 'error') {
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, responseToCache); });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(r) { return r || caches.match('./index.html'); });
    })
  );
});
