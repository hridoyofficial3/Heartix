// ============================================================
// HEARTIX WISHLIST PAGE
// ============================================================
import { db } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getCart, saveCart, getQtyInCart,
    getWishlist, saveWishlist,
    updateCartBadges
} from './common.js';

import {
    collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let allProducts = [];
let isLoading = true;

// ============ INITIAL BADGE ============
(function() {
    try {
        const cart = JSON.parse(localStorage.getItem('heartix_cart') || '[]');
        const count = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
        const h = document.getElementById('cart-count-header');
        if (h) h.textContent = count;
    } catch(e) {}
})();

// ============ CART ACTIONS ============
window.addToCart = function(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    const stock = p.stock !== undefined ? Number(p.stock) : 999;
    if (stock <= 0) { showToast('প্রোডাক্ট স্টকে নেই', 'error'); return; }
    let cart = getCart();
    const idx = cart.findIndex(i => i.id === id);
    const currentQty = idx > -1 ? (Number(cart[idx].quantity) || 0) : 0;
    if (stock !== 999 && currentQty + 1 > stock) {
        showToast(`স্টকে মাত্র ${stock} টি আছে`, 'error');
        return;
    }
    if (idx > -1) cart[idx].quantity = currentQty + 1;
    else cart.push({ id, name: p.name, price: Number(p.price) || 0, image: p.image, quantity: 1 });
    saveCart(cart);
    updateCartBadges();
    showToast((p.name || '').substring(0, 25) + ' কার্টে যোগ', 'success');
    renderWishlist();
}

window.removeFromCart = function(id) {
    let cart = getCart();
    const idx = cart.findIndex(i => i.id === id);
    if (idx > -1) {
        if (cart[idx].quantity > 1) cart[idx].quantity--;
        else cart.splice(idx, 1);
        saveCart(cart);
        updateCartBadges();
        renderWishlist();
    }
}

window.removeFromWishlist = function(id, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    let w = getWishlist();
    const idx = w.indexOf(id);
    if (idx > -1) {
        w.splice(idx, 1);
        saveWishlist(w);
        showToast('Wishlist থেকে সরানো হয়েছে', 'warn');
        renderWishlist();
    }
}

// ============ RENDER ============
function renderWishlist() {
    const skeleton = document.getElementById('loading-skeleton');
    const emptyEl = document.getElementById('empty-wishlist');
    const listEl = document.getElementById('wishlist-list');

    if (isLoading) return;
    skeleton.classList.add('hidden');

    const wishlistIds = getWishlist();
    const wishlistProducts = wishlistIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean);

    if (wishlistProducts.length === 0) {
        emptyEl.classList.remove('hidden');
        listEl.classList.add('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    listEl.classList.remove('hidden');

    let html = '';
    wishlistProducts.forEach(p => {
        const hasDiscount = p.oldPrice && p.oldPrice > p.price;
        const discountPct = hasDiscount ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
        const isOut = p.stock !== undefined && Number(p.stock) <= 0;
        const qty = getQtyInCart(p.id);

        let actionHtml = '';
        if (isOut) {
            actionHtml = `<button disabled class="w-full mt-2 add-cart-btn opacity-50">Out of Stock</button>`;
        } else if (qty === 0) {
            actionHtml = `<button onclick="event.preventDefault(); event.stopPropagation(); addToCart('${p.id}')" class="w-full mt-2 add-cart-btn"><i class="fas fa-shopping-bag"></i> Add To Cart</button>`;
        } else {
            actionHtml = `<div class="mt-2 qty-control w-full"><button onclick="event.preventDefault(); event.stopPropagation(); removeFromCart('${p.id}')">−</button><span class="qty-num flex-1">${qty}</span><button onclick="event.preventDefault(); event.stopPropagation(); addToCart('${p.id}')">+</button></div>`;
        }

        html += `<div class="bg-white rounded-2xl p-2.5 premium-shadow relative flex flex-col">
            <button onclick="removeFromWishlist('${p.id}', event)" class="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md z-10" aria-label="Remove from wishlist">
                <i class="fas fa-heart text-red-500 text-sm"></i>
            </button>
            <a href="product.html?id=${p.id}" class="block flex-1">
                <div class="relative mb-2">
                    <img src="${p.image || 'https://via.placeholder.com/200x200?text=No+Image'}" alt="${escapeHtml(p.name)}" loading="lazy" class="prod-img w-full h-28 rounded-lg" onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'">
                    ${hasDiscount ? `<span class="absolute top-1.5 left-1.5 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">-${discountPct}%</span>` : ''}
                </div>
                <h4 class="text-[12px] font-semibold text-navy leading-tight mb-1 line-clamp-2" style="min-height:32px;">${escapeHtml(p.name)}</h4>
                <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                    <p class="font-display text-base font-bold text-navy">৳${formatPrice(p.price)}</p>
                    ${hasDiscount ? `<p class="text-[9px] text-gray-400 line-through">৳${formatPrice(p.oldPrice)}</p>` : ''}
                </div>
            </a>
            ${actionHtml}
        </div>`;
    });
    listEl.innerHTML = html;
}

// ============ LOAD PRODUCTS ============
async function loadProducts() {
    if (!db) { isLoading = false; renderWishlist(); return; }
    try {
        const snap = await getDocs(collection(db, "products"));
        allProducts = [];
        snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
    } catch (e) { console.error('Load error:', e); }
    isLoading = false;
    renderWishlist();
}

// ============ INIT ============
updateCartBadges();
loadProducts();