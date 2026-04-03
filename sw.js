/* LIMAJE — service worker mínimo para instalación PWA (Netlify + HTTPS). */
var CACHE = 'limaje-pwa-v4';
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
          if (hit) return hit;
          var path = (url.pathname || '').toLowerCase();
          var ext = path.indexOf('.') >= 0 ? path.split('.').pop() : '';
          /* Nunca devolver HTML en lugar de .js/.json → rompe la app (SyntaxError). */
          if (ext === 'js' || ext === 'json' || ext === 'png' || ext === 'ico' || ext === 'svg' || ext === 'woff2')
            return new Response('', { status: 504, statusText: 'Sin red' });
          if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') >= 0)
            return caches.match('/Limaje.html');
          return new Response('', { status: 504 });
        });
      })
  );
});
