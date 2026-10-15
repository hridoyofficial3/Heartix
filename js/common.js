// ============================================================
// HEARTIX COMMON HELPERS
// ============================================================
import { initIntegrations } from './integrations.js';

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
// Runs once when common.js is imported by any page
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initIntegrations().catch(e => console.warn('Integrations init:', e));
        });
    } else {
        initIntegrations().catch(e => console.warn('Integrations init:', e));
    }
}