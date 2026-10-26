const CACHE_NAME = 'nisus-fc-cache-v2';

// 1. Instalar y forzar activación inmediata
self.addEventListener('install', event => {
    self.skipWaiting(); // ¡Esto obliga al navegador a activarlo sin esperar!
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './app.js',
                './escudo.png'
            ]);
        })
    );
});

// 2. Tomar el control de la página al instante
self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

// 3. Estrategia "Cache First" con Caché Dinámico (Guarda Tailwind y Firebase)
self.addEventListener('fetch', event => {
    // Ignoramos las llamadas directas a la base de datos (Firestore maneja su propio offline)
    if (event.request.url.includes('firestore.googleapis.com')) return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse; // Lo tenemos guardado, lo devolvemos rápido
            }
            // Si no lo tenemos (ej. las librerías CDN), lo descargamos y lo guardamos para la próxima
            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse; // Si es un recurso externo raro, solo lo pasa
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                console.log('Estás sin conexión y el recurso no está en caché.');
            });
        })
    );
});
