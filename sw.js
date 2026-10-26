const CACHE_NAME = 'nisus-fc-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    './escudo.png'
];

// Instalar y guardar los archivos en el teléfono
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

// Interceptar peticiones para cargar la app sin internet
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // Si el archivo está en caché, lo devuelve. Si no, lo busca en internet.
            return response || fetch(event.request);
        })
    );
});
