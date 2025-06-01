// sw.js

const CACHE_NAME = 'mzansi-fresh-finds-v7';
const urlsToCache = [
    '/', 
    '/index.html',
    '/style.css',
    '/manifest.json',

    // New data file
    '/data/deals.json',

    // New JS Modules
    '/js/app.js',
    '/js/config.js',
    '/js/deals.js',
    '/js/modal.js',
    '/js/ui.js',
    '/js/utils.js',

    // Other HTML pages for better offline experience
    '/about.html',
    '/contact.html',
    '/business-signup.html',
    '/privacy.html',
    '/images/placeholders/bakery.svg',
    '/images/placeholders/fruitveg.svg',
    '/images/placeholders/dairy.svg',
    '/images/placeholders/meat.svg',
    '/images/placeholders/prepared.svg',
    '/images/placeholders/pantry.svg',
    '/images/placeholders/default.svg',

    // PWA Icons
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-512x512.png'

    // Commented out fonts as they are not self-hosted
    // '/fonts/poppins-v15-latin-regular.woff2', 
];

// Install event: Cache core assets
self.addEventListener('install', event => {
    console.log('[SW] Install event for cache:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Opened cache:', CACHE_NAME);
                // Use addAll for atomic caching - if one fails, none are cached
                return cache.addAll(urlsToCache); 
            })
            .then(() => {
                console.log('[SW] Core files cached successfully. Activating.');
                return self.skipWaiting(); // Force activation
            })
            .catch(error => {
                console.error('[SW] Caching failed during install for version:', CACHE_NAME, error);
            })
    );
});

// Activate event: Clean up old caches and claim clients
self.addEventListener('activate', event => {
    console.log('[SW] Activate event for cache:', CACHE_NAME);
    const cacheWhitelist = [CACHE_NAME]; 
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('[SW] Claiming clients for cache:', CACHE_NAME);
            return self.clients.claim(); // Take control immediately
        })
        .catch(error => {
             console.error('[SW] Activation failed for cache:', CACHE_NAME, error);
        })
    );
});

// Fetch event: Cache-First strategy for core assets
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // For external placeholder images, try network first, then nothing (no offline for these)
    if (event.request.url.startsWith('https://via.placeholder.com/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Optionally return a generic fallback or just let it fail
                return new Response('Placeholder image could not be loaded.', {
                    status: 404,
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(
                    networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse; 
                        }
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(error => {
                                console.error('[SW] Failed to cache resource:', event.request.url, error);
                            });
                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('[SW] Network fetch failed:', event.request.url, error);
                    return new Response(`Network error occurred while fetching ${event.request.url}. Resource could not be loaded.`, {
                        status: 408,
                        headers: { 'Content-Type': 'text/plain' }
                    });
                });
            })
    );
});