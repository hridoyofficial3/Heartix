// ============================================================
// HEARTIX CART PAGE
// ============================================================
import { db } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getCart, saveCart,
    getWishlist, saveWishlist,
    updateCartBadges
} from './common.js';

import {
    collection, doc, getDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let settings = { deliveryCharge: 100, freeDeliveryAbove: 0 };
let allProductsMap = {};
let isLoading = true;
let loadFailed = false;
let appliedCoupon = null;

// Load saved coupon from localStorage
try {
    const saved = JSON.parse(localStorage.getItem('heartix_coupon') || 'null');
    if (saved && saved.code) appliedCoupon = saved;
} catch (e) {}

// ============ HELPERS ============
function getStock(productId) {
    const p = allProductsMap[productId];
    if (!p) return null;
    return p.stock !== undefined ? Number(p.stock) : 999;
}

// ============ LOAD DATA ============
async function loadData() {
    if (!db) {
        isLoading = false;
        loadFailed = true;
        renderCart();
        return;
    }
    try {
        const [setSnap, prodSnap] = await Promise.all([
            getDoc(doc(db, "settings", "main")).catch(() => null),
            getDocs(collection(db, "products")).catch(() => null)
        ]);

        if (setSnap && setSnap.exists()) {
            const s = setSnap.data();
            settings.deliveryCharge = Number(s.deliveryCharge) || 100;
            settings.freeDeliveryAbove = Number(s.freeDeliveryAbove) || 0;
        }

        if (prodSnap) {
            prodSnap.forEach(d => {
                allProductsMap[d.id] = { id: d.id, ...d.data() };
            });
        }
    } catch (e) {
        console.error('Load error:', e);
        loadFailed = true;
    }
    isLoading = false;
    renderCart();
}

// ============ RENDER CART ============
function renderCart() {
    const skeleton = document.getElementById('loading-skeleton');
    const errorState = document.getElementById('error-state');
    const cartItemsDiv = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const cartSummary = document.getElementById('cart-summary');
    const clearBtn = document.getElementById('clear-cart-btn');

    skeleton.classList.add('hidden');

    if (loadFailed) {
        errorState.classList.remove('hidden');
        cartItemsDiv.classList.add('hidden');
        emptyCart.classList.add('hidden');
        cartSummary.classList.add('hidden');
        clearBtn.classList.remove('flex');
        clearBtn.classList.add('hidden');
        return;
    }
    errorState.classList.add('hidden');

    const cart = getCart();

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '';
        cartItemsDiv.classList.add('hidden');
        emptyCart.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        clearBtn.classList.remove('flex');
        clearBtn.classList.add('hidden');
        return;
    }

    emptyCart.classList.add('hidden');
    cartItemsDiv.classList.remove('hidden');
    cartSummary.classList.remove('hidden');
    clearBtn.classList.remove('hidden');
    clearBtn.classList.add('flex');

    let html = '';
    let subtotal = 0;
    let hasStockIssue = false;
    let hasMissingProduct = false;

    cart.forEach((item, index) => {
        const stock = getStock(item.id);
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const lineTotal = price * qty;
        subtotal += lineTotal;

        const productMissing = stock === null;
        const notEnoughStock = !productMissing && stock !== 999 && qty > stock;
        if (productMissing) hasMissingProduct = true;
        if (notEnoughStock) hasStockIssue = true;

        let warning = '';
        if (productMissing) {
            warning = `<p class="text-[10px] text-red-600 mt-1 font-semibold"><i class="fas fa-exclamation-circle"></i> প্রোডাক্টটি আর পাওয়া যাচ্ছে না</p>`;
        } else if (notEnoughStock) {
            warning = `<p class="text-[10px] text-red-500 mt-1"><i class="fas fa-exclamation-triangle"></i> স্টকে মাত্র ${stock} টি আছে</p>`;
        }

        html += `
            <div class="bg-white rounded-2xl premium-shadow p-3 flex items-center gap-3 ${productMissing ? 'opacity-60' : ''}">
                <img src="${item.image || 'https://via.placeholder.com/100x100?text=?'}" alt="${escapeHtml(item.name)}" class="w-20 h-20 object-contain rounded-xl bg-gray-50 flex-shrink-0" onerror="this.src='https://via.placeholder.com/100x100?text=?'">
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold navy-text line-clamp-2 mb-1">${escapeHtml(item.name)}</h4>
                    <p class="price-per-item mb-2">৳ ${formatPrice(price)}</p>
                    ${warning}
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                        <button onclick="changeQty(${index}, -1)" class="w-8 h-8 bg-cream rounded-lg flex items-center justify-center text-navy font-bold text-lg">−</button>
                        <span class="font-semibold text-sm w-8 text-center navy-text">${qty}</span>
                        <button onclick="changeQty(${index}, 1)" class="w-8 h-8 bg-cream rounded-lg flex items-center justify-center text-navy font-bold text-lg ${(!productMissing && stock !== 999 && qty >= stock) ? 'opacity-40' : ''}" ${(!productMissing && stock !== 999 && qty >= stock) ? 'disabled' : ''}>+</button>
                        <button onclick="moveToWishlist(${index})" class="ml-1 text-[10px] text-gray-500 font-semibold px-2 py-1 rounded-lg bg-gray-50 hover:bg-gray-100">
                            <i class="fas fa-heart text-red-400 mr-1"></i> Save
                        </button>
                    </div>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="price-line-total mb-2">৳ ${formatPrice(lineTotal)}</p>
                    <button onclick="removeItem(${index})" class="text-red-500 text-sm w-8 h-8 flex items-center justify-center ml-auto" aria-label="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
    });

    cartItemsDiv.innerHTML = html;

    document.getElementById('cart-count-summary').textContent = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

    // Calculate discount
    let discount = 0;
    if (appliedCoupon && appliedCoupon.value > 0) {
        if (appliedCoupon.type === 'percentage') {
            discount = Math.round((subtotal * appliedCoupon.value) / 100);
        } else {
            discount = Math.min(appliedCoupon.value, subtotal);
        }
        if (appliedCoupon.minOrder > 0 && subtotal < appliedCoupon.minOrder) {
            discount = 0;
        }
    }
    if (discount < 0) discount = 0;
    if (discount > subtotal) discount = subtotal;

    const afterDiscount = subtotal - discount;
    const isFreeDelivery = settings.freeDeliveryAbove > 0 && afterDiscount >= settings.freeDeliveryAbove;
    const deliveryCharge = isFreeDelivery ? 0 : settings.deliveryCharge;
    const total = afterDiscount + deliveryCharge;

    document.getElementById('subtotal').innerText = '৳ ' + formatPrice(subtotal);

    const discountRow = document.getElementById('discount-row');
    if (discount > 0) {
        discountRow.classList.remove('hidden');
        document.getElementById('discount-amount').innerText = '-৳ ' + formatPrice(discount);
    } else {
        discountRow.classList.add('hidden');
    }

    document.getElementById('delivery-charge').innerText = deliveryCharge === 0 ? 'ফ্রি' : '৳ ' + formatPrice(deliveryCharge);
    document.getElementById('total').innerText = '৳ ' + formatPrice(total);

    updateCouponUI();

    // Free delivery note
    const freeNote = document.getElementById('free-delivery-note');
    const freeHint = document.getElementById('free-delivery-hint');

    if (isFreeDelivery) {
        freeNote.classList.remove('hidden');
        document.getElementById('free-delivery-amount').innerText = formatPrice(settings.freeDeliveryAbove);
        freeHint.classList.add('hidden');
    } else if (settings.freeDeliveryAbove > 0 && afterDiscount > 0) {
        const remaining = settings.freeDeliveryAbove - afterDiscount;
        if (remaining > 0) {
            freeHint.classList.remove('hidden');
            document.getElementById('free-delivery-hint-text').innerText = `আর ৳${formatPrice(remaining)} যোগ করলে ফ্রি ডেলিভারি পাবেন!`;
        } else {
            freeHint.classList.add('hidden');
        }
        freeNote.classList.add('hidden');
    } else {
        freeNote.classList.add('hidden');
        freeHint.classList.add('hidden');
    }

    // Stock warning
    const stockWarnBox = document.getElementById('stock-warning-box');
    const stockWarnText = document.getElementById('stock-warning-text');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (hasMissingProduct || hasStockIssue) {
        stockWarnBox.classList.remove('hidden');
        if (hasMissingProduct) stockWarnText.textContent = 'কিছু প্রোডাক্ট আর পাওয়া যাচ্ছে না। সেগুলো সরিয়ে ফেলুন।';
        else stockWarnText.textContent = 'কিছু প্রোডাক্টের স্টক কম। পরিমাণ ঠিক করুন।';
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        stockWarnBox.classList.add('hidden');
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// ============ COUPON UI ============
function updateCouponUI() {
    const inputWrap = document.getElementById('coupon-input-wrap');
    const appliedBox = document.getElementById('coupon-applied');
    if (appliedCoupon && appliedCoupon.code) {
        inputWrap.classList.add('hidden');
        appliedBox.classList.remove('hidden');
        document.getElementById('coupon-applied-code').textContent = appliedCoupon.code;
        document.getElementById('coupon-applied-desc').textContent =
            appliedCoupon.type === 'percentage'
                ? `${appliedCoupon.value}% off`
                : `৳${appliedCoupon.value} off`;
    } else {
        inputWrap.classList.remove('hidden');
        appliedBox.classList.add('hidden');
    }
    document.getElementById('coupon-error').classList.add('hidden');
}

window.applyCoupon = async function() {
    const input = document.getElementById('coupon-input');
    const code = (input.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const errEl = document.getElementById('coupon-error');
    errEl.classList.add('hidden');

    if (!code) {
        errEl.textContent = 'Coupon code দিন';
        errEl.classList.remove('hidden');
        return;
    }

    if (!db) {
        errEl.textContent = 'সার্ভার সংযোগ নেই';
        errEl.classList.remove('hidden');
        return;
    }

    const btn = document.getElementById('coupon-apply-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner spin"></i>';

    try {
        const snap = await getDoc(doc(db, "coupons", code));
        if (!snap.exists()) {
            errEl.textContent = 'এই coupon নেই';
            errEl.classList.remove('hidden');
            return;
        }
        const c = snap.data();
        if (c.active === false) {
            errEl.textContent = 'Coupon টি active নেই';
            errEl.classList.remove('hidden');
            return;
        }
        if (c.expiry && new Date(c.expiry) < new Date()) {
            errEl.textContent = 'Coupon টি expired';
            errEl.classList.remove('hidden');
            return;
        }
        if (c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses) {
            errEl.textContent = 'Coupon টি ব্যবহারের সীমা শেষ';
            errEl.classList.remove('hidden');
            return;
        }

        const cart = getCart();
        const subtotal = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
        if (c.minOrder > 0 && subtotal < c.minOrder) {
            errEl.textContent = `এই coupon ব্যবহারে কমপক্ষে ৳${formatPrice(c.minOrder)} এর অর্ডার দরকার`;
            errEl.classList.remove('hidden');
            return;
        }

        appliedCoupon = {
            code: snap.id,
            type: c.type || 'percentage',
            value: Number(c.value) || 0,
            minOrder: Number(c.minOrder) || 0
        };
        try { localStorage.setItem('heartix_coupon', JSON.stringify(appliedCoupon)); } catch (e) {}
        showToast('Coupon applied!', 'success');
        input.value = '';
        renderCart();
    } catch (e) {
        console.error('Coupon error:', e);
        errEl.textContent = 'Coupon check করা যায়নি';
        errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Apply';
    }
}

window.removeCoupon = function() {
    appliedCoupon = null;
    try { localStorage.removeItem('heartix_coupon'); } catch (e) {}
    document.getElementById('coupon-input').value = '';
    showToast('Coupon removed', 'warn');
    renderCart();
}

// ============ ACTIONS ============
window.proceedToCheckout = function() {
    const cart = getCart();
    for (const item of cart) {
        const stock = getStock(item.id);
        if (stock === null) {
            showToast('কিছু প্রোডাক্ট আর নেই, কার্ট রিফ্রেশ করুন', 'error');
            return;
        }
        if (stock !== 999 && item.quantity > stock) {
            showToast(`"${item.name}" স্টকে মাত্র ${stock} টি`, 'error');
            return;
        }
    }
    window.location.href = 'checkout.html';
}

window.changeQty = function(index, change) {
    let cart = getCart();
    if (!cart[index]) return;

    const productId = cart[index].id;
    const stock = getStock(productId);
    const newQty = (Number(cart[index].quantity) || 0) + change;

    if (newQty <= 0) {
        const name = cart[index].name || '';
        cart.splice(index, 1);
        saveCart(cart);
        updateCartBadges();
        renderCart();
        showToast(name.substring(0, 30) + ' কার্ট থেকে সরানো হয়েছে', 'warn');
        return;
    }

    if (stock !== null && stock !== 999 && newQty > stock) {
        showToast(`স্টকে মাত্র ${stock} টি আছে`, 'error');
        return;
    }

    cart[index].quantity = newQty;
    saveCart(cart);
    updateCartBadges();
    renderCart();
}

window.removeItem = function(index) {
    let cart = getCart();
    if (!cart[index]) return;
    const name = cart[index].name || '';
    cart.splice(index, 1);
    saveCart(cart);
    updateCartBadges();
    renderCart();
    showToast(name.substring(0, 30) + ' সরানো হয়েছে', 'warn');
}

window.clearCart = function() {
    const cart = getCart();
    if (cart.length === 0) return;
    if (!confirm('আপনি কি পুরো কার্ট খালি করতে চান?')) return;
    saveCart([]);
    try { localStorage.removeItem('heartix_coupon'); } catch (e) {}
    appliedCoupon = null;
    updateCartBadges();
    renderCart();
    showToast('কার্ট খালি করা হয়েছে', 'warn');
}

window.moveToWishlist = function(index) {
    let cart = getCart();
    if (!cart[index]) return;
    const item = cart[index];
    let wl = getWishlist();
    if (!wl.includes(item.id)) {
        wl.push(item.id);
        saveWishlist(wl);
    }
    cart.splice(index, 1);
    saveCart(cart);
    updateCartBadges();
    renderCart();
    showToast('Wishlist-এ সরানো হয়েছে', 'success');
}

// ============ INIT ============
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadData);
} else {
    loadData();
}