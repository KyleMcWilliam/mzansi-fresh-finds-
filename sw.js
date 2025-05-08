// sw.js

const CACHE_NAME = 'mzansi-fresh-finds-v4'; // << INCREMENTED VERSION AGAIN
const urlsToCache = [
    '/', 
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    // Placeholder images
    '/images/placeholder-food.png',    
    '/images/placeholder-bakery.png',
    '/images/placeholder-fruitveg.png',
    '/images/placeholder-dairy.png',
    '/images/placeholder-meat.png',
    '/images/placeholder-prepared.png',
    '/images/placeholder-pantry.png',
    // PWA icons
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-512x512.png'
    // Add any other core static assets like fonts IF self-hosted, or logo
    // '/fonts/poppins-v15-latin-regular.woff2', 
    // '/images/logo.png' 
];

// Install event: Cache core assets
self.addEventListener('install', event => {
    console.log('[SW] Install event');
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
                console.error('[SW] Caching failed during install for:', urlsToCache, error);
            })
    );
});

// Activate event: Clean up old caches and claim clients
self.addEventListener('activate', event => {
    console.log('[SW] Activate event');
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
            console.log('[SW] Claiming clients.');
            return self.clients.claim(); // Take control immediately
        })
        .catch(error => {
             console.error('[SW] Activation failed:', error);
        })
    );
});

// Fetch event: Cache-First strategy for core assets
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        // console.log('[SW] Ignoring non-GET request:', event.request.method, event.request.url);
        return;
    }

    // Example: Skip caching for API calls if they exist (adjust URL pattern)
    // if (event.request.url.includes('/api/')) {
    //    console.log('[SW] Skipping cache for API request:', event.request.url);
    //    return fetch(event.request); 
    // }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Return cached response if found
                if (cachedResponse) {
                    // console.log('[SW] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request).then(
                    networkResponse => {
                        // Check for valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            // console.log('[SW] Invalid network response, not caching:', event.request.url, networkResponse.status);
                            return networkResponse; 
                        }

                        // Clone response for caching
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // console.log('[SW] Caching new resource:', event.request.url);
                                cache.put(event.request, responseToCache);
                            })
                            .catch(error => {
                                console.error('[SW] Failed to cache resource:', event.request.url, error);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('[SW] Network fetch failed:', event.request.url, error);
                    // Optional: Return an offline fallback page for navigation requests
                    // if (event.request.mode === 'navigate') {
                    //     return caches.match('/offline.html'); 
                    // }
                    // For other assets, just let the browser show its error
                    return new Response("Network error occurred", {
                        status: 408, // Request Timeout
                        headers: { 'Content-Type': 'text/plain' }
                    });
                });
            })
    );
});