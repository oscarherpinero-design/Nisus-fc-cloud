const CACHE_NAME = 'nisus-fc-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './app.js',
  './escudo.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// 1. Instalación: guarda los archivos base
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

// 2. Activación: borra cachés viejas cuando cambies CACHE_NAME
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 3. Intercepción de peticiones
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Nunca cachear llamadas en vivo a Firebase ni a la API del BCV
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebasestorage.googleapis.com') ||
    url.hostname.includes('dolarapi.com')
  ) {
    return;
  }

  // Network-First para tu HTML y JS (siempre trae tus últimos cambios si hay red)
  const isAppCode =
    req.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('app.js');

  if (isAppCode) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-First para librerías, íconos, fuentes e imágenes
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
