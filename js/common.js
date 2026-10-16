// ============================================================
// HEARTIX COMMON HELPERS + THEME (all-in-one)
// ============================================================
import { initIntegrations } from './integrations.js';

// ============ THEME (Dark Mode) ============
(function initTheme() {
    try {
        var STORAGE_KEY = 'heartix_theme';

        var CSS = [
            'body.dark-mode { background: #0F1729 !important; color: #E5E7EB !important; }',
            'body.dark-mode .bg-white { background: #1A2235 !important; }',
            'body.dark-mode .bg-gray-50 { background: #1F2A3E !important; }',
            'body.dark-mode .bg-cream { background: #1F2A3E !important; }',
            'body.dark-mode .bg-gray-100 { background: #253048 !important; }',
            'body.dark-mode .text-navy, body.dark-mode .navy-text { color: #E5E7EB !important; }',
            'body.dark-mode .text-gray-500, body.dark-mode .text-gray-600 { color: #9CA3AF !important; }',
            'body.dark-mode .text-gray-400 { color: #6B7280 !important; }',
            'body.dark-mode .text-gray-700 { color: #D1D5DB !important; }',
            'body.dark-mode .border-gray-100 { border-color: #253048 !important; }',
            'body.dark-mode .border-gray-200 { border-color: #2A3548 !important; }',
            'body.dark-mode .border-gray-300 { border-color: #374151 !important; }',
            'body.dark-mode .glass { background: rgba(15,23,41,0.85) !important; border-color: #253048 !important; }',
            'body.dark-mode input, body.dark-mode select, body.dark-mode textarea { background: #1F2A3E !important; color: #E5E7EB !important; border-color: #2A3548 !important; }',
            'body.dark-mode input::placeholder, body.dark-mode textarea::placeholder { color: #6B7280 !important; }',
            'body.dark-mode .shimmer { background: linear-gradient(90deg, #1A2235 25%, #253048 50%, #1A2235 75%); background-size: 1000px 100%; }',
            'body.dark-mode header img[src*="logo"] { background: #FBF8F3; border-radius: 6px; padding: 1px 3px; }',
            '#theme-toggle { position: fixed !important; right: 12px !important; bottom: 160px !important; z-index: 9999 !important; width: 44px; height: 44px; border-radius: 50%; background: #0A1628; color: #D4A84B; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.35); cursor: pointer; border: 2px solid #D4A84B; font-size: 18px; }',
            'body.dark-mode #theme-toggle { background: #D4A84B; color: #0A1628; border-color: #E8C77B; }'
        ].join('\n');

        function getSaved() {
            try { return localStorage.getItem(STORAGE_KEY) || 'light'; }
            catch (e) { return 'light'; }
        }

        function save(t) {
            try { localStorage.setItem(STORAGE_KEY, t); } catch (e) {}
        }

        function apply(t) {
            if (t === 'dark') {
                document.documentElement.classList.add('dark-mode');
                if (document.body) document.body.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
                if (document.body) document.body.classList.remove('dark-mode');
            }
            var btn = document.getElementById('theme-toggle');
            if (btn) {
                btn.innerHTML = t === 'dark'
                    ? '<i class="fas fa-sun"></i>'
                    : '<i class="fas fa-moon"></i>';
            }
        }

        function toggle() {
            var current = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            var next = current === 'dark' ? 'light' : 'dark';
            apply(next);
            save(next);
        }

        function injectCSS() {
            if (document.getElementById('theme-dark-css')) return;
            var style = document.createElement('style');
            style.id = 'theme-dark-css';
            style.textContent = CSS;
            document.head.appendChild(style);
        }

        function injectBtn() {
            if (document.getElementById('theme-toggle')) return;
            var path = window.location.pathname.toLowerCase();
            if (path.indexOf('admin') !== -1 || path.indexOf('moderator') !== -1 || path.indexOf('messages') !== -1) return;

            var btn = document.createElement('button');
            btn.id = 'theme-toggle';
            btn.setAttribute('aria-label', 'Toggle theme');
            btn.onclick = toggle;
            document.body.appendChild(btn);
        }

        if (document.head) injectCSS();

        var saved = getSaved();
        if (saved === 'dark') document.documentElement.classList.add('dark-mode');

        function init() {
            apply(saved);
            injectBtn();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

        console.log('✅ Theme ready');
    } catch (e) {
        console.warn('Theme init failed:', e);
    }
})();

// ============ TOAST ============
export function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast-bar ' + type;
    const icon = type === 'success' ? 'check-circle' :
                 type === 'warn' ? 'exclamation-circle' :
                 type === 'info' ? 'info-circle' : 'times-circle';
    t.innerHTML = `<i class="fas fa-${icon}"></i><span>${escapeHtml(msg)}</span>`;
    c.appendChild(t);
    setTimeout(() => {
        t.style.transition = 'opacity 0.3s';
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 300);
    }, 2500);
}

// ============ ESCAPE HTML ============
export function escapeHtml(t) {
    if (t === null || t === undefined) return '';
    const d = document.createElement('div');
    d.textContent = String(t);
    return d.innerHTML;
}

// ============ FORMAT PRICE ============
export function formatPrice(n) {
    return Number(n || 0).toLocaleString('en-IN');
}

// ============ CART ============
export function getCart() {
    try {
        const raw = JSON.parse(localStorage.getItem('heartix_cart') || '[]');
        if (!Array.isArray(raw)) return [];
        return raw.filter(i => i && typeof i === 'object' && i.id && (Number(i.quantity) || 0) > 0);
    } catch (e) { return []; }
}

export function saveCart(c) {
    try { localStorage.setItem('heartix_cart', JSON.stringify(c)); } catch (e) {}
}

export function getQtyInCart(id) {
    const i = getCart().find(x => x.id === id);
    return i ? i.quantity : 0;
}

// ============ WISHLIST ============
export function getWishlist() {
    try {
        const w = JSON.parse(localStorage.getItem('heartix_wishlist') || '[]');
        return Array.isArray(w) ? w : [];
    } catch (e) { return []; }
}

export function saveWishlist(w) {
    try { localStorage.setItem('heartix_wishlist', JSON.stringify(w)); } catch (e) {}
}

export function isInWishlist(id) {
    return getWishlist().includes(id);
}

// ============ RECENTLY VIEWED ============
export function getRecentlyViewed() {
    try {
        const r = JSON.parse(localStorage.getItem('heartix_recent') || '[]');
        return Array.isArray(r) ? r : [];
    } catch (e) { return []; }
}

export function addToRecentlyViewed(id) {
    try {
        let r = getRecentlyViewed().filter(x => x !== id);
        r.unshift(id);
        r = r.slice(0, 10);
        localStorage.setItem('heartix_recent', JSON.stringify(r));
    } catch (e) {}
}

// ============ BADGES ============
export function updateCartBadges() {
    const cart = getCart();
    const count = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const ids = ['cart-count-header', 'cart-count-bottom', 'cart-count-sidebar'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
    });
    const f = document.getElementById('floating-cart');
    if (f) {
        if (count > 0) {
            f.classList.remove('hide'); f.classList.add('show');
            const amount = cart.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 0)), 0);
            const fc = document.getElementById('floating-cart-count');
            const ft = document.getElementById('floating-cart-total');
            if (fc) fc.innerText = count + ' item' + (count > 1 ? 's' : '');
            if (ft) ft.innerText = '৳' + amount.toLocaleString('en-IN');
        } else {
            f.classList.add('hide'); f.classList.remove('show');
        }
    }
}

export function updateWishlistBadges() {
    const w = getWishlist();
    const count = w.length;
    const ids = ['wishlist-count-header', 'wishlist-count-sidebar'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (count > 0) {
                el.textContent = count;
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });
}

// ============ VALIDATION ============
export function validatePhone(phone) {
    return /^01[3-9]\d{8}$/.test(phone);
}

// ============ ORDER NUMBER ============
export function generateOrderNumber() {
    const d = new Date();
    const y = d.getFullYear().toString().slice(-2);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const timePart = String(d.getMilliseconds()).padStart(3, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HX${y}${m}${day}${rand}${timePart}`;
}

// ============ AUTO-INIT INTEGRATIONS ============
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initIntegrations().catch(e => console.warn('Integrations init:', e));
        });
    } else {
        initIntegrations().catch(e => console.warn('Integrations init:', e));
    }
}