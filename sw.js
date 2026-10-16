// ============================================================
// HEARTIX PWA — Service Worker
// Strategy: Static assets cached, HTML network-first, Firebase never cached
// ============================================================

const CACHE_NAME = 'heartix-v1';
const STATIC_CACHE = 'heartix-static-v1';

// Only cache static assets — NEVER cache HTML/API/Firebase
const STATIC_ASSETS = [
    '/css/common.css',
    '/css/index.css',
    '/css/product.css',
    '/css/cart.css',
    '/css/checkout.css',
    '/css/account.css',
    '/css/wishlist.css',
    '/css/contact.css',
    '/css/order-success.css',
    '/css/track-order.css',
    '/css/messages.css',
    '/css/moderator.css',
    '/logo.png'
];

// ============ INSTALL ============
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                // Cache each asset individually — don't fail if one is missing
                return Promise.allSettled(
                    STATIC_ASSETS.map(url =>
                        cache.add(url).catch(err => console.warn('Cache skip:', url))
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

// ============ ACTIVATE ============
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== STATIC_CACHE) {
                        console.log('Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ============ FETCH ============
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Skip non-GET
    if (req.method !== 'GET') return;

    // Skip cross-origin (Firebase, Cloudinary, Google Fonts, CDN)
    if (url.origin !== self.location.origin) return;

    // Skip API paths — always network
    if (url.pathname.startsWith('/api/')) return;

    // Static assets → Cache-first
    const isStaticAsset = STATIC_ASSETS.some(a => url.pathname.endsWith(a.replace('/', '')));
    const isStaticExt = /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i.test(url.pathname);

    if (isStaticAsset || isStaticExt) {
        event.respondWith(
            caches.match(req).then(cached => {
                if (cached) return cached;
                return fetch(req).then(res => {
                    // Cache new static asset
                    if (res && res.status === 200) {
                        const resClone = res.clone();
                        caches.open(STATIC_CACHE).then(cache => cache.put(req, resClone)).catch(() => {});
                    }
                    return res;
                }).catch(() => caches.match(req));
            })
        );
        return;
    }

    // HTML → Network-first, fallback to cache
    if (req.headers.get('accept')?.includes('text/html') || url.pathname === '/' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(req).then(res => {
                if (res && res.status === 200) {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(() => {});
                }
                return res;
            }).catch(() => caches.match(req).then(c => c || caches.match('/index.html')))
        );
        return;
    }

    // Default: network
});

// ============ MESSAGE (for future use) ============
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('✅ Heartix Service Worker loaded');