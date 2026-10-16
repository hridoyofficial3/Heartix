// ============================================================
// HEARTIX PWA — Service Worker v2
// ============================================================

const CACHE_NAME = 'heartix-v2';
const STATIC_CACHE = 'heartix-static-v2';

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
    '/css/moderator.css'
];

// ============ INSTALL ============
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
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
                    if (key !== STATIC_CACHE && key !== CACHE_NAME) {
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

    if (req.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;

    const isStaticExt = /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i.test(url.pathname);

    if (isStaticExt) {
        event.respondWith(
            caches.match(req).then(cached => {
                if (cached) return cached;
                return fetch(req).then(res => {
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
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('✅ Heartix Service Worker v2 loaded');