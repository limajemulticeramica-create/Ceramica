/* LIMAJE — service worker mínimo para instalación PWA (Netlify + HTTPS). */
var CACHE = 'limaje-pwa-v2';
var PRECACHE = ['/', '/Limaje.html', '/manifest.json', '/icon-192.png', '/icon-512.png', '/logo.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE.map(function (u) { return new Request(u, { cache: 'reload' }); })).catch(function () {});
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(function (res) {
        var copy = res.clone();
        if (res.ok) caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('/Limaje.html');
        });
      })
  );
});
