// ============================================================
// HEARTIX ADMIN — Global Back Button Trap v2 (instant)
// Uses MutationObserver for zero-delay modal detection
// ============================================================

const OTHER_MODAL_IDS = [
    'product-modal',
    'category-modal',
    'coupon-modal',
    'hero-modal',
    'section-modal',
    'banner-modal',
    'testimonial-modal',
    'more-menu-modal',
    'status-picker-modal',
    'category-reorder-modal',
    'section-reorder-modal',
    'product-reorder-modal',
    'inline-cat-modal',
    'product-picker-modal',
    'status-confirm-modal',
    'bulk-upload-modal'
];

let _trapActive = false;

// ============ DETECTION ============
function isOtherModalOpen() {
    for (const id of OTHER_MODAL_IDS) {
        const m = document.getElementById(id);
        if (m && !m.classList.contains('hidden')) return true;
    }
    // Dynamic modal (created/removed from DOM)
    if (document.getElementById('delete-order-modal')) return true;
    return false;
}

function closeOtherModals() {
    for (const id of OTHER_MODAL_IDS) {
        const m = document.getElementById(id);
        if (m) m.classList.add('hidden');
    }
    const del = document.getElementById('delete-order-modal');
    if (del) {
        del.style.opacity = '0';
        del.style.transition = 'opacity 0.12s';
        setTimeout(() => { try { del.remove(); } catch (e) {} }, 130);
    }
}

// ============ TRAP CONTROL ============
function activateTrap() {
    if (_trapActive) return;
    try {
        history.pushState({ adminBackTrap: true, _t: Date.now() }, '', location.href);
        _trapActive = true;
    } catch (e) { /* silent */ }
}

function releaseTrap() {
    _trapActive = false;
}

function checkState() {
    if (isOtherModalOpen()) activateTrap();
    else releaseTrap();
}

// ============ INSTANT DETECTION (MutationObserver) ============
const classObserver = new MutationObserver(checkState);

function observeAllModals() {
    document.querySelectorAll('[id$="-modal"]').forEach(el => {
        if (!el._btObserved) {
            classObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
            el._btObserved = true;
        }
    });
}

// Watch for dynamically added modals (like delete-order-modal)
const bodyObserver = new MutationObserver(() => {
    observeAllModals();
    checkState();
});

// ============ POPSTATE HANDLER ============
window.addEventListener('popstate', () => {
    if (isOtherModalOpen()) {
        // Modal is open → close it and stay on admin.html
        closeOtherModals();
        _trapActive = false;
        activateTrap();
    } else {
        // No modal → allow navigation
        releaseTrap();
    }
});

// ============ INIT ============
function init() {
    observeAllModals();
    bodyObserver.observe(document.body, { childList: true, subtree: true });
    // Fallback poll just in case (500ms — much slower but as backup)
    setInterval(checkState, 500);
    checkState();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ admin-back-trap.js v2 (instant MutationObserver)');