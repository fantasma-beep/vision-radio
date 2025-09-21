// sw.js (Service Worker)

// Incrementa la versión si realizas cambios significativos en los archivos a cachear
const CACHE_NAME = 'vision-radio-cache-v2'; 

// Lista de URLs a precachear.
// ¡ATENCIÓN! Asegúrate de que todas estas rutas sean correctas y existan en tu repositorio.
const urlsToCache = [
  '/vision-radio/', // La URL raíz de tu proyecto GitHub Pages
  '/vision-radio/index.html', // Tu página principal
  '/vision-radio/manifest.json', // El manifiesto de tu PWA
  '/vision-radio/sw.js', // El propio Service Worker
  '/vision-radio/logo-vision.png', // Tu archivo de logo
  '/vision-radio/494615713_1348055410294820_9029691649736311255_n.jpg', // Tu imagen de fondo
  '/vision-radio/install-android.html', // Si tienes esta página
  '/vision-radio/install-ios.html', // Si tienes esta página
  // Fuentes y CDN externos (no necesitan el prefijo /vision-radio/)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'
  // Si tienes una carpeta 'icons' en la raíz y la usas en manifest.json, 
  // también deberías cachear tus iconos aquí, por ejemplo:
  // '/vision-radio/icons/icon-72x72.png',
  // '/vision-radio/icons/icon-96x96.png',
  // ... y el resto de los iconos
];

// Evento 'install': Se ejecuta cuando el Service Worker se instala.
// Aquí cacheamos todos los recursos listados en urlsToCache.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache abierto');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Service Worker: Fallo al cachear algunos archivos:', err);
        });
      })
  );
});

// Evento 'fetch': Se interceptan todas las peticiones de red.
// Intentamos servir los recursos desde la caché primero, y si no están, desde la red.
self.addEventListener('fetch', event => {
  // Ignoramos las peticiones de streaming de audio para no intentar cachearlas
  if (event.request.url.includes('stream.zeno.fm')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - devuelve la respuesta desde la caché
        if (response) {
          return response;
        }
        // Si no está en caché, intenta obtenerlo de la red
        return fetch(event.request).then(response => {
          // Si la respuesta de la red es válida, la cachea para futuras peticiones
          // Se clona la respuesta porque la respuesta de un fetch solo se puede consumir una vez
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
      .catch(error => {
        // Esto se ejecutará si la petición de red falla y el recurso no está en caché
        console.error('Service Worker: Error en fetch, recurso no disponible:', error);
        // Aquí podrías devolver una página offline si lo deseas
        // return caches.match('/vision-radio/offline.html'); 
      })
  );
});

// Evento 'activate': Se ejecuta cuando el Service Worker se activa.
// Aquí eliminamos las cachés antiguas para mantener solo la versión actual.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
