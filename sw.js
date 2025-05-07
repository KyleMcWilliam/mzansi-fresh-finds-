const CACHE_NAME = 'mzansi-fresh-finds-v1';
const urlsToCache = [
    '/', // Alias for index.html if server is configured
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/images/placeholder-food.png',
    // Add paths to your PWA icons here
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-512x512.png'
    // '/images/logo.png' // if you have one
];

// Install event: Opens the cache and adds core files to it.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event: Serves assets from cache if available, otherwise fetches from network.
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Not in cache - fetch from network
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    // Network request failed, try to serve a fallback or just fail
                    console.error('Fetching failed:', error);
                    // You could return a generic offline page here if desired
                    // For now, just let the browser handle the error
                    throw error;
                });
            })
    );
});

// Activate event: Cleans up old caches.
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME]; // Add future cache versions here
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});