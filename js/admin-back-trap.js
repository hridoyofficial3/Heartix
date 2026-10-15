// ============================================================
// HEARTIX ADMIN — Global Back Button Trap (all modals)
// Prevents back button from navigating away while any modal open
// ============================================================

const ADMIN_MODAL_IDS = [
    'order-edit-modal',
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

let _trapPushed = false;
let _lastAnyOpen = false;

// ============ HELPERS ============
function anyModalOpen() {
    // Static modals
    for (const id of ADMIN_MODAL_IDS) {
        const m = document.getElementById(id);
        if (m && !m.classList.contains('hidden')) return true;
    }
    // Dynamic modal (removed from DOM when closed)
    const del = document.getElementById('delete-order-modal');
    if (del) return true;
    return false;
}

function closeAllAdminModals() {
    for (const id of ADMIN_MODAL_IDS) {
        const m = document.getElementById(id);
        if (m) m.classList.add('hidden');
    }
    // Remove dynamic modal
    const del = document.getElementById('delete-order-modal');
    if (del) {
        del.style.opacity = '0';
        del.style.transition = 'opacity 0.12s';
        setTimeout(() => { try { del.remove(); } catch (e) {} }, 130);
    }
    // Clear editing order state (if exposed)
    try {
        if (typeof window.editingOrderId !== 'undefined') window.editingOrderId = null;
        if (typeof window.editingOrderItems !== 'undefined') window.editingOrderItems = [];
    } catch (e) {}
}

// ============ POLL: detect modal open/close ============
// Runs every 250ms — lightweight and reliable for admin panel
setInterval(() => {
    const nowOpen = anyModalOpen();

    if (nowOpen && !_lastAnyOpen) {
        // A modal just OPENED — push a state so back button is trapped
        if (!_trapPushed) {
            try {
                history.pushState({ adminTrap: true }, '', location.href);
                _trapPushed = true;
            } catch (e) { /* ignore */ }
        }
    } else if (!nowOpen && _lastAnyOpen) {
        // All modals CLOSED — release trap so back works normally now
        _trapPushed = false;
    }

    _lastAnyOpen = nowOpen;
}, 250);

// ============ POPSTATE: back button pressed ============
window.addEventListener('popstate', () => {
    if (anyModalOpen()) {
        // Modal is open — close it and STAY on current page
        closeAllAdminModals();
        _trapPushed = false;
        _lastAnyOpen = false;

        // Re-push state so user doesn't navigate away
        try {
            history.pushState({ adminTrap: true }, '', location.href);
            _trapPushed = true;
            _lastAnyOpen = true;
        } catch (e) {}
    } else {
        // No modal open — allow normal back navigation
        _trapPushed = false;
    }
});

console.log('✅ admin-back-trap.js loaded');