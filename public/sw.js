const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
    "/",
    "/index.html",
    "/styles.css",
    "/app.js",
    "/assets/icons/logo.webp"                    
]

// Aqui hacemos el precaching para que al momento de instalar el SW, se almacenen en cache los archivos de urlsToCache
self.addEventListener("install", (e) => {
    console.log('service worker installed successfully');
    e.waitUntil(
        // en el cache esta guardando todos los archivos del array de urls.
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

// Activación y limpieza de caché antigua
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activado');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
                        console.log('Borrando caché antigua:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});


const DYNAMIC_CACHE_NAME = 'pwa-dynamic-cache-v1';

// Estrategias de almacenamiento en caché
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Estrategia Cache First para archivos estáticos
    if (urlsToCache.includes(url.pathname)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // Estrategia Network First para datos dinámicos
    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Estrategia Stale-While-Revalidate para contenido mixto
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                });
            });
            return cachedResponse || fetchPromise;
        })
    );
});
