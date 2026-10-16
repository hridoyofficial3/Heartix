// ============================================================
// HEARTIX ADMIN — Pre-order Badge (self-injecting)
// ============================================================
(function() {
    'use strict';

    let observer = null;

    function injectBadges() {
        const list = document.getElementById('order-list-admin');
        if (!list) return;

        // Find all order cards
        const cards = list.querySelectorAll('.order-details');
        cards.forEach(card => {
            if (card.dataset.preorderProcessed) return;
            card.dataset.preorderProcessed = '1';

            // Look at badges area — find existing badges
            const badgesArea = card.querySelector('summary .flex.gap-1.flex-wrap');
            if (!badgesArea) return;

            // Try to detect if any item has isPreorder: true
            // We can't access the data directly, so check via edit button
            const editBtn = card.querySelector('[onclick*="openOrderEdit"]');
            if (!editBtn) return;
            const onclick = editBtn.getAttribute('onclick') || '';
            const match = onclick.match(/openOrderEdit\(['"]([^'"]+)['"]\)/);
            if (!match) return;
            const orderId = match[1];

            // Check global ordersList (from admin.js)
            let order = null;
            try {
                // admin.js keeps allOrdersList in module scope, so we need another way
                // Look for the order data on the card itself if we cached it
                order = window.__heartixOrderCache && window.__heartixOrderCache[orderId];
            } catch (e) {}

            // If no cached data, try to read from the visible card content
            // Check if the card has a purple pre-order badge already inside summary (badges area)
            const items = card.querySelectorAll('img[src*="cloudinary"], img[src*="placeholder"]');
            // We can't detect preorder from images, skip if no cache

            if (!order) {
                // Fallback: fetch from Firestore would be expensive
                // Skip for now, will be handled on next reload
            }
        });
    }

    // Alternative: hook into renderAdminOrders by watching mutations
    function scanNewCards() {
        const list = document.getElementById('order-list-admin');
        if (!list) return;

        // Fetch orders from Firestore and match by orderNumber displayed on card
        // This is more reliable
        import('./firebase.js').then(({ db }) => {
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js").then(({ collection, getDocs }) => {
                getDocs(collection(db, 'orders')).then(snap => {
                    const preorderIds = new Set();
                    snap.forEach(d => {
                        const data = d.data();
                        if (data.hasPreorder === true) {
                            preorderIds.add(data.orderNumber || d.id);
                        }
                    });

                    // Now scan visible cards
                    list.querySelectorAll('.order-details').forEach(card => {
                        if (card.dataset.preorderDone) return;

                        const orderNumEl = card.querySelector('summary p.font-bold');
                        if (!orderNumEl) return;
                        const orderNum = orderNumEl.textContent.trim();

                        if (!preorderIds.has(orderNum)) return;

                        card.dataset.preorderDone = '1';

                        // Insert purple pre-order badge
                        const badgesArea = card.querySelector('summary .flex.gap-1.flex-wrap');
                        if (badgesArea) {
                            const badge = document.createElement('span');
                            badge.className = 'inline-flex items-center gap-1 text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full';
                            badge.innerHTML = '<i class="fas fa-clock text-[8px]"></i> Pre-order';
                            badgesArea.appendChild(badge);
                        }

                        // Also add purple left border
                        if (!card.classList.contains('preorder-border')) {
                            card.classList.add('preorder-border');
                            card.style.borderLeftColor = '#A855F7';
                        }
                    });
                }).catch(e => console.warn('Pre-order badge fetch:', e));
            });
        }).catch(e => console.warn('Firebase import:', e));
    }

    // ============ OBSERVER ============
    function setupObserver() {
        const list = document.getElementById('order-list-admin');
        if (!list) return false;
        if (observer) observer.disconnect();

        observer = new MutationObserver(() => {
            setTimeout(scanNewCards, 100);
        });
        observer.observe(list, { childList: true, subtree: true });
        return true;
    }

    // ============ WRAP showTab ============
    function wrapShowTab() {
        if (typeof window.showTab === 'function' && !window._preorderWrapped) {
            const orig = window.showTab;
            window.showTab = function(tab) {
                orig.apply(this, arguments);
                if (tab === 'orders') {
                    setTimeout(() => {
                        setupObserver();
                        scanNewCards();
                    }, 400);
                }
            };
            window._preorderWrapped = true;
        }
    }

    // ============ INIT ============
    let attempts = 0;
    function tryInit() {
        if (setupObserver() || attempts++ > 30) {
            scanNewCards();
            return;
        }
        setTimeout(tryInit, 500);
    }

    function init() {
        setTimeout(wrapShowTab, 500);
        setTimeout(wrapShowTab, 1500);
        setTimeout(tryInit, 800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('✅ admin-preorder-badge.js loaded');
})();