const CACHE_NAME = 'scatola-ricordi-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', function(event) {
  console.log('Service Worker installato');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  // Gestione delle richieste di mappe
  if (event.request.url.includes('tile.openstreetmap.org') || 
      event.request.url.includes('basemaps.cartocdn.com')) {
    event.respondWith(
      caches.open('map-tiles').then(function(cache) {
        return cache.match(event.request).then(function(response) {
          return response || fetch(event.request).then(function(networkResponse) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // Gestione standard per altre richieste
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker attivato');
  // Elimina cache vecchie
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME && cacheName !== 'map-tiles') {
            console.log('Cancellazione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});