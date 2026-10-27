self.addEventListener('install', function(e) {
  self.skipWaiting(); // Se instala inmediatamente
});

self.addEventListener('activate', function(e) {
  // Limpia cualquier caché vieja que haya quedado
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
  );
  self.clients.claim();
});

// Este bloque es OBLIGATORIO para que el móvil permita instalar la app
self.addEventListener('fetch', function(e) {
  // Estrategia "Network Only": Siempre busca la versión más reciente en internet
  e.respondWith(fetch(e.request));
});
