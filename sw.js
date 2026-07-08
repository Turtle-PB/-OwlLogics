// OwlLogics Service Worker — PWA Offline Support
// (c) 2024 OwlLogics Contributors — Patent Pending

var CACHE_NAME = 'owllogics-v1.0';
var ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/core.js',
  './js/protocols.js',
  './js/labels.js',
  './js/ui.js',
  './js/flvisual.js',
  './js/sap-forklift.js',
  './js/sap-idoc.js',
  './js/owl-ai.js',
  './js/metrics.js',
  './js/logistics.js',
  './manifest.json',
  './sw.js',
  './owllogics.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

// Install — cache all assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — cache-first strategy
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (Azure IoT, etc.)
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      // Return cached immediately, fetch in background for updates
      var fetchPromise = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});
