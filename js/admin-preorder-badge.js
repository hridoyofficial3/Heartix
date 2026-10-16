// ============================================================
// HEARTIX ADMIN — Pre-order Badge (self-injecting)
// ============================================================
(function() {
    'use strict';

    let observer = null;

    function scanNewCards() {
        const list = document.getElementById('order-list-admin');
        if (!list) return;

        import('./firebase.js').then(({ db }) => {
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js").then(({ collection, getDocs }) => {
                getDocs(collection(db, 'orders')).then(snap => {
                    const preorderNums = new Set();
                    snap.forEach(d => {
                        const data = d.data();
                        if (data.hasPreorder === true) {
                            preorderNums.add(data.orderNumber || d.id);
                        }
                    });

                    list.querySelectorAll('.order-details').forEach(card => {
                        if (card.dataset.preorderDone) return;

                        const orderNumEl = card.querySelector('summary p.font-bold');
                        if (!orderNumEl) return;
                        const orderNum = orderNumEl.textContent.trim();

                        if (!preorderNums.has(orderNum)) return;

                        card.dataset.preorderDone = '1';

                        const badgesArea = card.querySelector('summary .flex.gap-1.flex-wrap');
                        if (badgesArea) {
                            const badge = document.createElement('span');
                            badge.className = 'inline-flex items-center gap-1 text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full';
                            badge.innerHTML = '<i class="fas fa-clock text-[8px]"></i> Pre-order';
                            badgesArea.appendChild(badge);
                        }

                        card.style.borderLeftColor = '#A855F7';
                    });
                }).catch(e => console.warn('Pre-order fetch:', e));
            });
        }).catch(e => console.warn('Firebase import:', e));
    }

    function setupObserver() {
        const list = document.getElementById('order-list-admin');
        if (!list) return false;
        if (observer) observer.disconnect();
        observer = new MutationObserver(() => setTimeout(scanNewCards, 100));
        observer.observe(list, { childList: true, subtree: true });
        return true;
    }

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