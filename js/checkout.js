// ============================================================
// HEARTIX CHECKOUT — with logged-in autofill + repeat customer + IP + Email
// ============================================================
import { db, auth } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getCart, saveCart, validatePhone, generateOrderNumber
} from './common.js';
import { DISTRICTS } from './districts.js';
import { notifyOrderPlaced } from './email-notify.js';

import {
    collection, doc, getDoc, getDocs, query, where,
    runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============ STATE ============
let settings = { deliveryCharge: 100, freeDeliveryAbove: 0, bkashNumber: '', nagadNumber: '', whatsapp: '' };
let isLoading = true;
let isPlacingOrder = false;
let cachedFreshPrices = {};
let appliedCoupon = null;
let currentIP = '';
let previousOrders = [];
let autoFillSourceOrder = null;
let lastCheckedPhone = '';
let phoneLookupTimer = null;
let backTrapActive = false;
let loggedInUser = null;
let loggedInProfile = null;
const RECENT_ORDER_WINDOW_MIN = 10;

// ============ HELPERS ============
function initDistricts() {
    const sel = document.getElementById('customer-district');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">Select District</option>';
    const sorted = [...new Set(DISTRICTS)].sort();
    sorted.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        sel.appendChild(opt);
    });
    if (currentVal) sel.value = currentVal;
}

try {
    const saved = JSON.parse(localStorage.getItem('heartix_coupon') || 'null');
    if (saved && saved.code) appliedCoupon = saved;
} catch (e) {}

// ============ IP FETCH ============
async function fetchIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
        const data = await res.json();
        return (data && data.ip) ? String(data.ip) : '';
    } catch (e) {
        console.warn('IP fetch failed:', e);
        return '';
    }
}

// ============ FIREBASE QUERIES ============
async function lookupOrdersByPhone(phone) {
    try {
        const q = query(collection(db, "orders"), where("customer.phone", "==", phone));
        const snap = await getDocs(q);
        const orders = [];
        snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
        orders.sort((a, b) => {
            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta;
        });
        return orders;
    } catch (e) {
        console.warn('Phone lookup failed:', e);
        return [];
    }
}

async function checkSameIPRecent(ip, phone) {
    if (!ip) return false;
    try {
        const q = query(collection(db, "orders"), where("customer.ipAddress", "==", ip));
        const snap = await getDocs(q);
        const now = Date.now();
        const windowMs = RECENT_ORDER_WINDOW_MIN * 60 * 1000;
        let found = false;
        snap.forEach(d => {
            const data = d.data();
            const cPhone = data.customer?.phone || '';
            const ts = data.createdAt?.toMillis ? data.createdAt.toMillis() : 0;
            if (cPhone !== phone && ts && (now - ts) < windowMs) {
                found = true;
            }
        });
        return found;
    } catch (e) {
        console.warn('IP check failed:', e);
        return false;
    }
}

async function loadFreshCartData() {
    const cart = getCart();
    if (cart.length === 0) return { ok: true };
    const fresh = {};
    const issues = [];
    for (const item of cart) {
        try {
            const snap = await getDoc(doc(db, "products", item.id));
            if (!snap.exists()) {
                issues.push({ type: 'missing', name: item.name });
                continue;
            }
            const data = snap.data();
            const stock = Number(data.stock) || 0;
            if (stock < item.quantity) {
                issues.push({ type: 'stock', name: data.name || item.name, stock });
                continue;
            }
            fresh[item.id] = {
                id: item.id,
                name: data.name || item.name,
                price: Number(data.price) || 0,
                image: data.image || item.image || '',
                quantity: item.quantity
            };
        } catch (e) {
            issues.push({ type: 'error', name: item.name });
        }
    }
    cachedFreshPrices = fresh;
    return { ok: issues.length === 0, issues };
}

async function validateCoupon(coupon, subtotal) {
    if (!coupon || !coupon.code) return { valid: false, discount: 0, reason: 'no_coupon' };
    try {
        const snap = await getDoc(doc(db, "coupons", coupon.code));
        if (!snap.exists()) return { valid: false, discount: 0, reason: 'not_found' };
        const c = snap.data();
        if (c.active === false) return { valid: false, discount: 0, reason: 'inactive' };
        if (c.expiry && new Date(c.expiry) < new Date()) return { valid: false, discount: 0, reason: 'expired' };
        if (c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses) return { valid: false, discount: 0, reason: 'exhausted' };
        if (c.minOrder > 0 && subtotal < c.minOrder) return { valid: false, discount: 0, reason: 'min_order' };
        let discount = 0;
        if (c.type === 'percentage') {
            discount = Math.round((subtotal * Number(c.value || 0)) / 100);
        } else {
            discount = Number(c.value || 0);
        }
        discount = Math.min(discount, subtotal);
        discount = Math.max(discount, 0);
        return { valid: true, discount, type: c.type, value: c.value, code: snap.id };
    } catch (e) {
        return { valid: false, discount: 0, reason: 'error' };
    }
}

async function loadLoggedInUser() {
    return new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            try { unsub(); } catch (e) {}
            if (user) {
                loggedInUser = user;
                try {
                    const snap = await getDoc(doc(db, "customers", user.uid));
                    if (snap.exists()) {
                        loggedInProfile = snap.data();
                    } else {
                        loggedInProfile = { email: user.email, name: user.displayName || '' };
                    }
                } catch (e) {
                    loggedInProfile = { email: user.email, name: user.displayName || '' };
                }
            }
            resolve();
        });
    });
}

function prefillFromLoggedInProfile() {
    if (!loggedInUser || !loggedInProfile) return false;
    const p = loggedInProfile;
    let filled = false;
    if (p.name) { document.getElementById('customer-name').value = p.name; filled = true; }
    if (p.phone) { document.getElementById('customer-phone').value = p.phone; filled = true; }
    if (p.email || loggedInUser.email) {
        document.getElementById('customer-email').value = p.email || loggedInUser.email;
        filled = true;
    }
    if (p.address) { document.getElementById('customer-address').value = p.address; filled = true; }
    if (p.district) { document.getElementById('customer-district').value = p.district; filled = true; }
    if (p.thana) { document.getElementById('customer-thana').value = p.thana; filled = true; }
    if (filled) {
        showToast('আপনার saved তথ্য অটো-ফিল করা হয়েছে ✅', 'success');
    }
    if (p.phone) lastCheckedPhone = p.phone;
    return filled;
}

async function loadSettings() {
    fetchIP().then(ip => { currentIP = ip; });
    if (!db) { isLoading = false; afterLoad(); return; }
    try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (snap.exists()) {
            const s = snap.data();
            settings.deliveryCharge = Number(s.deliveryCharge) || 100;
            settings.freeDeliveryAbove = Number(s.freeDeliveryAbove) || 0;
            settings.bkashNumber = s.bkashNumber || '';
            settings.nagadNumber = s.nagadNumber || '';
            settings.whatsapp = s.whatsapp || '';
        }
    } catch (e) { console.warn('Settings:', e); }
    isLoading = false;
    afterLoad();
}

async function afterLoad() {
    document.getElementById('loading-skeleton').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    const cart = getCart();
    if (cart.length === 0) {
        document.getElementById('empty-cart').classList.remove('hidden');
        document.getElementById('checkout-form').classList.add('hidden');
        return;
    }
    document.getElementById('empty-cart').classList.add('hidden');
    document.getElementById('checkout-form').classList.remove('hidden');
    initDistricts();
    attachPaymentListeners();
    attachPhoneListener();
    await loadLoggedInUser();
    const result = await loadFreshCartData();
    renderOrderReview();
    await updateSummary();
    if (loggedInUser) {
        prefillFromLoggedInProfile();
    }
    updatePaymentInfo('full-cod');
    if (!result.ok) {
        const missing = result.issues.filter(i => i.type === 'missing').length;
        const lowStock = result.issues.filter(i => i.type === 'stock').length;
        let msg = '';
        if (missing) msg += `${missing} টি প্রোডাক্ট আর নেই। `;
        if (lowStock) msg += `${lowStock} টি প্রোডাক্টের স্টক কম। `;
        showToast(msg + 'কার্টে ফিরে ঠিক করুন', 'error');
        document.getElementById('place-order-btn').disabled = true;
        document.getElementById('place-order-btn').classList.add('opacity-50', 'cursor-not-allowed');
    }
}

function attachPhoneListener() {
    const phoneInput = document.getElementById('customer-phone');
    if (!phoneInput) return;
    phoneInput.addEventListener('input', (e) => {
        const raw = e.target.value.replace(/\D/g, '');
        if (raw !== e.target.value) e.target.value = raw;
        const phone = raw;
        if (phoneLookupTimer) clearTimeout(phoneLookupTimer);
        if (phone.length !== 11) return;
        if (phone === lastCheckedPhone) return;
        if (loggedInProfile && loggedInProfile.phone === phone) return;
        phoneLookupTimer = setTimeout(() => {
            lastCheckedPhone = phone;
            handlePhoneLookup(phone);
        }, 600);
    });
}

async function handlePhoneLookup(phone) {
    if (!validatePhone(phone)) return;
    const orders = await lookupOrdersByPhone(phone);
    previousOrders = orders;
    if (orders.length === 0) return;
    const latest = orders[0];
    autoFillSourceOrder = latest;
    const ts = latest.createdAt?.toMillis ? latest.createdAt.toMillis() : 0;
    const minutesAgo = ts ? Math.floor((Date.now() - ts) / 60000) : null;
    if (minutesAgo !== null && minutesAgo < RECENT_ORDER_WINDOW_MIN) {
        showWarningModal(latest, minutesAgo);
    } else {
        showRepeatModal(latest, orders.length);
    }
}

function activateBackTrap() {
    if (backTrapActive) return;
    backTrapActive = true;
    try { history.pushState({ trap: true }, '', location.href); } catch (e) {}
    window.addEventListener('popstate', handlePopState);
    document.body.style.overflow = 'hidden';
}

function releaseBackTrap() {
    if (!backTrapActive) return;
    backTrapActive = false;
    window.removeEventListener('popstate', handlePopState);
    document.body.style.overflow = '';
}

function handlePopState() {
    const warnOpen = !document.getElementById('warning-modal').classList.contains('hidden');
    const repOpen = !document.getElementById('repeat-modal').classList.contains('hidden');
    const histOpen = !document.getElementById('history-modal').classList.contains('hidden');
    if (warnOpen || repOpen || histOpen) {
        try { history.pushState({ trap: true }, '', location.href); } catch (e) {}
    } else {
        releaseBackTrap();
    }
}

const STATUS_COLORS = {
    'pending': 'bg-yellow-100 text-yellow-700',
    'confirmed': 'bg-blue-100 text-blue-700',
    'shipped': 'bg-purple-100 text-purple-700',
    'delivered': 'bg-green-100 text-green-700',
    'cancelled': 'bg-red-100 text-red-700'
};

function getStatusClass(status) {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
}

function formatOrderDate(ts) {
    if (!ts || !ts.toDate) return '';
    try {
        return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
}

window.showRepeatModal = function(order, count) {
    document.getElementById('rep-order-num').textContent = order.orderNumber || order.id.slice(0, 10);
    document.getElementById('rep-date').textContent = formatOrderDate(order.createdAt);
    document.getElementById('rep-total').textContent = '৳' + formatPrice(order.total);
    const statusEl = document.getElementById('rep-status');
    statusEl.textContent = (order.status || 'pending').toUpperCase();
    statusEl.className = 'text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ' + getStatusClass(order.status);
    document.getElementById('repeat-modal').classList.remove('hidden');
    activateBackTrap();
}

window.closeRepeatModal = function() {
    document.getElementById('repeat-modal').classList.add('hidden');
    releaseBackTrap();
}

window.continueFromRepeat = function() {
    autoFillFromOrder(autoFillSourceOrder);
    document.getElementById('repeat-modal').classList.add('hidden');
    releaseBackTrap();
    showToast('তথ্য অটো-ফিল করা হয়েছে ✅', 'success');
}

window.showWarningModal = function(order, minutesAgo) {
    document.getElementById('warn-minutes').textContent = minutesAgo;
    document.getElementById('warn-order-num').textContent = order.orderNumber || order.id.slice(0, 10);
    document.getElementById('warn-date').textContent = formatOrderDate(order.createdAt);
    document.getElementById('warn-total').textContent = '৳' + formatPrice(order.total);
    const statusEl = document.getElementById('warn-status');
    statusEl.textContent = (order.status || 'pending').toUpperCase();
    statusEl.className = 'text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ' + getStatusClass(order.status);
    document.getElementById('warn-track-link').href = 'track-order.html?order=' + encodeURIComponent(order.orderNumber || '');
    document.getElementById('warning-modal').classList.remove('hidden');
    activateBackTrap();
}

window.cancelFromWarning = function() {
    document.getElementById('warning-modal').classList.add('hidden');
    releaseBackTrap();
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-address').value = '';
    document.getElementById('customer-district').value = '';
    document.getElementById('customer-thana').value = '';
    lastCheckedPhone = '';
    autoFillSourceOrder = null;
    showToast('ফোন নাম্বার আবার লিখুন বা আগের Order Track করুন', 'info');
    setTimeout(() => {
        const p = document.getElementById('customer-phone');
        if (p) p.focus();
    }, 250);
}

window.continueFromWarning = function() {
    autoFillFromOrder(autoFillSourceOrder);
    document.getElementById('warning-modal').classList.add('hidden');
    releaseBackTrap();
    showToast('নতুন অর্ডারের জন্য প্রস্তুত ✅', 'success');
}

window.showHistoryModal = function() {
    const list = document.getElementById('history-list');
    document.getElementById('hist-count').textContent = previousOrders.length;
    if (previousOrders.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 text-xs py-6">কোনো অর্ডার নেই</p>';
    } else {
        let html = '';
        previousOrders.forEach(o => {
            const date = formatOrderDate(o.createdAt);
            const statusClass = getStatusClass(o.status);
            const items = (o.items || []).length;
            html += `<a href="track-order.html?order=${encodeURIComponent(o.orderNumber || '')}" class="block bg-gray-50 rounded-xl p-3 active:bg-gray-100">
                <div class="flex justify-between items-start gap-2 mb-1">
                    <div class="min-w-0 flex-1">
                        <p class="font-bold text-navy text-xs">${escapeHtml(o.orderNumber || o.id.slice(0, 10))}</p>
                        <p class="text-[10px] text-gray-500 mt-0.5">${date} • ${items} item(s)</p>
                    </div>
                    <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${statusClass}">${o.status || 'pending'}</span>
                </div>
                <div class="flex justify-between items-baseline">
                    <span class="text-[10px] text-gray-500">Total</span>
                    <span class="font-bold text-navy text-sm">৳${formatPrice(o.total)}</span>
                </div>
            </a>`;
        });
        list.innerHTML = html;
    }
    document.getElementById('history-modal').classList.remove('hidden');
}

window.closeHistoryModal = function() {
    document.getElementById('history-modal').classList.add('hidden');
    const warnOpen = !document.getElementById('warning-modal').classList.contains('hidden');
    const repOpen = !document.getElementById('repeat-modal').classList.contains('hidden');
    if (!warnOpen && !repOpen) releaseBackTrap();
}

function autoFillFromOrder(order) {
    if (!order) return;
    const c = order.customer || {};
    if (c.name) document.getElementById('customer-name').value = c.name;
    if (c.email) document.getElementById('customer-email').value = c.email;
    if (c.address) document.getElementById('customer-address').value = c.address;
    if (c.district) document.getElementById('customer-district').value = c.district;
    if (c.thana) document.getElementById('customer-thana').value = c.thana;
}

function renderOrderReview() {
    const cart = getCart();
    const reviewDiv = document.getElementById('order-review');
    if (!reviewDiv) return;
    let html = '';
    cart.forEach(item => {
        const fresh = cachedFreshPrices[item.id];
        const price = fresh ? fresh.price : (Number(item.price) || 0);
        const qty = Number(item.quantity) || 1;
        const image = fresh ? fresh.image : item.image;
        const name = fresh ? fresh.name : item.name;
        html += `
            <div class="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <img src="${image || 'https://via.placeholder.com/60x60?text=?'}" class="w-14 h-14 object-contain rounded-lg bg-gray-50 flex-shrink-0" onerror="this.src='https://via.placeholder.com/60x60?text=?'">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium navy-text line-clamp-2">${escapeHtml(name)}</p>
                    <p class="text-xs text-gray-500 mt-0.5">৳ ${formatPrice(price)} × ${qty}</p>
                </div>
                <p class="font-bold navy-text text-sm flex-shrink-0">৳ ${formatPrice(price * qty)}</p>
            </div>`;
    });
    reviewDiv.innerHTML = html;
}

async function updateSummary() {
    const cart = getCart();
    let subtotal = 0;
    cart.forEach(item => {
        const fresh = cachedFreshPrices[item.id];
        const price = fresh ? fresh.price : (Number(item.price) || 0);
        subtotal += price * (Number(item.quantity) || 0);
    });
    let discount = 0;
    if (appliedCoupon && appliedCoupon.code) {
        const validation = await validateCoupon(appliedCoupon, subtotal);
        if (validation.valid) {
            discount = validation.discount;
        } else {
            if (validation.reason !== 'no_coupon') {
                let msg = 'Coupon আর কাজ করছে না';
                if (validation.reason === 'expired') msg = 'Coupon expired';
                else if (validation.reason === 'inactive') msg = 'Coupon inactive';
                else if (validation.reason === 'exhausted') msg = 'Coupon সীমা শেষ';
                else if (validation.reason === 'min_order') msg = 'Minimum order পূরণ হয়নি';
                showToast(msg, 'warn');
                appliedCoupon = null;
                try { localStorage.removeItem('heartix_coupon'); } catch(e) {}
            }
        }
    }
    const afterDiscount = subtotal - discount;
    const isFree = settings.freeDeliveryAbove > 0 && afterDiscount >= settings.freeDeliveryAbove;
    const dc = isFree ? 0 : settings.deliveryCharge;
    const total = afterDiscount + dc;
    document.getElementById('checkout-subtotal').innerText = '৳ ' + formatPrice(subtotal);
    const discountRow = document.getElementById('checkout-discount-row');
    if (discount > 0) {
        discountRow.classList.remove('hidden');
        document.getElementById('checkout-discount').innerText = '-৳ ' + formatPrice(discount);
        document.getElementById('checkout-coupon-badge').textContent = appliedCoupon.code;
    } else {
        discountRow.classList.add('hidden');
    }
    document.getElementById('checkout-delivery').innerText = dc === 0 ? 'ফ্রি' : '৳ ' + formatPrice(dc);
    document.getElementById('checkout-total').innerText = '৳ ' + formatPrice(total);
    const fn = document.getElementById('checkout-free-note');
    if (isFree) fn.classList.remove('hidden');
    else fn.classList.add('hidden');
}

function attachPaymentListeners() {
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
            this.closest('.payment-option').classList.add('selected');
            updatePaymentInfo(this.value);
        });
    });
    const initial = document.querySelector('input[name="payment"]:checked');
    if (initial) initial.closest('.payment-option').classList.add('selected');
}

async function updatePaymentInfo(method) {
    const box = document.getElementById('payment-instructions');
    const content = document.getElementById('payment-info-content');
    if (!box || !content) return;
    const cart = getCart();
    let subtotal = 0;
    cart.forEach(item => {
        const fresh = cachedFreshPrices[item.id];
        const price = fresh ? fresh.price : (Number(item.price) || 0);
        subtotal += price * (Number(item.quantity) || 0);
    });
    let discount = 0;
    if (appliedCoupon && appliedCoupon.code) {
        const validation = await validateCoupon(appliedCoupon, subtotal);
        if (validation.valid) discount = validation.discount;
    }
    const afterDiscount = subtotal - discount;
    const isFree = settings.freeDeliveryAbove > 0 && afterDiscount >= settings.freeDeliveryAbove;
    const dc = isFree ? 0 : settings.deliveryCharge;
    const total = afterDiscount + dc;
    if (method === 'full-cod') { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    let html = '';
    if (method === 'delivery-advance') {
        html += `<p class="text-navy mb-2">ডেলিভারি চার্জ <strong class="gold-text">৳ ${formatPrice(dc)}</strong> পাঠাতে হবে:</p>`;
    } else {
        html += `<p class="text-navy mb-2">সম্পূর্ণ <strong class="gold-text">৳ ${formatPrice(total)}</strong> পাঠাতে হবে:</p>`;
    }
    if (settings.bkashNumber) html += `<p class="text-sm mb-1 flex items-center gap-2"><i class="fas fa-mobile-alt text-pink-500"></i><strong>bKash:</strong> <span class="font-mono">${escapeHtml(settings.bkashNumber)}</span></p>`;
    if (settings.nagadNumber) html += `<p class="text-sm mb-1 flex items-center gap-2"><i class="fas fa-mobile-alt text-orange-500"></i><strong>Nagad:</strong> <span class="font-mono">${escapeHtml(settings.nagadNumber)}</span></p>`;
    if (!settings.bkashNumber && !settings.nagadNumber) {
        html += `<p class="text-red-500 text-sm"><i class="fas fa-exclamation-triangle mr-1"></i> অ্যাডমিন পেমেন্ট নম্বর সেট করেননি।</p>`;
    }
    content.innerHTML = html;
}

function setFieldError(id, hasError) {
    const el = document.getElementById(id);
    if (!el) return;
    if (hasError) el.classList.add('field-error');
    else el.classList.remove('field-error');
}

function validateForm() {
    const name = (document.getElementById('customer-name').value || '').trim();
    const phone = (document.getElementById('customer-phone').value || '').trim();
    const email = (document.getElementById('customer-email').value || '').trim();
    const address = (document.getElementById('customer-address').value || '').trim();
    let ok = true;
    if (!name || name.length < 2) { setFieldError('customer-name', true); if (ok) showToast('সঠিক নাম দিন', 'error'); ok = false; }
    else setFieldError('customer-name', false);
    if (!validatePhone(phone)) { setFieldError('customer-phone', true); if (ok) showToast('সঠিক ফোন নাম্বার (01XXXXXXXXX)', 'error'); ok = false; }
    else setFieldError('customer-phone', false);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('customer-email', true); if (ok) showToast('সঠিক ইমেইল দিন', 'error'); ok = false; }
    else setFieldError('customer-email', false);
    if (!address || address.length < 5) { setFieldError('customer-address', true); if (ok) showToast('সম্পূর্ণ ঠিকানা দিন', 'error'); ok = false; }
    else setFieldError('customer-address', false);
    return ok;
}

// ============ PLACE ORDER (with Email) ============
window.placeOrder = async function() {
    if (isPlacingOrder) return;
    const cart = getCart();
    if (cart.length === 0) return showToast("কার্ট খালি!", 'error');
    if (!validateForm()) return;

    const name = (document.getElementById('customer-name').value || '').trim();
    const phone = (document.getElementById('customer-phone').value || '').trim();
    const email = (document.getElementById('customer-email').value || '').trim();
    const address = (document.getElementById('customer-address').value || '').trim();
    const district = document.getElementById('customer-district').value || '';
    const thana = (document.getElementById('customer-thana').value || '').trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Placing Order...';
    isPlacingOrder = true;

    try {
        if (!db) throw new Error("Database connection failed");
        if (!currentIP) {
            currentIP = await fetchIP();
        }
        const ipFlagged = await checkSameIPRecent(currentIP, phone);
        if (previousOrders.length === 0) {
            previousOrders = await lookupOrdersByPhone(phone);
        }
        const isRepeat = previousOrders.length > 0;
        const orderCount = previousOrders.length + 1;
        const previousOrderNumbers = previousOrders.slice(0, 5).map(o => o.orderNumber || '').filter(Boolean);

        let couponData = null;
        if (appliedCoupon && appliedCoupon.code) {
            const cSnap = await getDoc(doc(db, "coupons", appliedCoupon.code));
            if (cSnap.exists()) couponData = { code: cSnap.id, ...cSnap.data() };
        }

        const orderRef = doc(collection(db, "orders"));
        const orderNumber = generateOrderNumber();

        let finalSubtotal = 0;
        let finalTotal = 0;
        let finalDelivery = 0;
        let finalAdvance = 0;
        let finalDiscount = 0;
        let finalItems = [];

        await runTransaction(db, async (transaction) => {
            const readData = [];
            for (const item of cart) {
                const pRef = doc(db, "products", item.id);
                const pSnap = await transaction.get(pRef);
                if (!pSnap.exists()) throw new Error(`প্রোডাক্টটি আর নেই: ${item.name}`);
                const data = pSnap.data();
                const currentStock = Number(data.stock) || 0;
                const qty = Number(item.quantity) || 1;
                if (currentStock < qty) throw new Error(`"${data.name || item.name}" - স্টকে মাত্র ${currentStock} টি আছে`);
                readData.push({
                    ref: pRef,
                    freshPrice: Number(data.price) || 0,
                    freshName: data.name || item.name,
                    freshImage: data.image || item.image || '',
                    stock: currentStock,
                    qty
                });
            }

            let couponSnapData = null;
            let couponRef = null;
            if (couponData) {
                couponRef = doc(db, "coupons", couponData.code);
                const cSnap = await transaction.get(couponRef);
                if (cSnap.exists()) couponSnapData = cSnap.data();
            }

            finalSubtotal = readData.reduce((s, r) => s + r.freshPrice * r.qty, 0);
            finalDiscount = 0;
            let couponValid = false;
            if (couponSnapData) {
                const c = couponSnapData;
                couponValid = c.active !== false
                    && (!c.expiry || new Date(c.expiry) >= new Date())
                    && (!c.maxUses || (c.usedCount || 0) < c.maxUses)
                    && (!c.minOrder || finalSubtotal >= c.minOrder);
                if (couponValid) {
                    if (c.type === 'percentage') finalDiscount = Math.round((finalSubtotal * Number(c.value || 0)) / 100);
                    else finalDiscount = Number(c.value || 0);
                    finalDiscount = Math.min(finalDiscount, finalSubtotal);
                }
            }

            const afterDiscount = finalSubtotal - finalDiscount;
            const isFree = settings.freeDeliveryAbove > 0 && afterDiscount >= settings.freeDeliveryAbove;
            finalDelivery = isFree ? 0 : settings.deliveryCharge;
            finalTotal = afterDiscount + finalDelivery;
            if (paymentMethod === 'full-online') finalAdvance = finalTotal;
            else if (paymentMethod === 'delivery-advance') finalAdvance = finalDelivery;

            finalItems = readData.map(r => ({
                id: r.ref.id,
                name: r.freshName,
                price: r.freshPrice,
                quantity: r.qty,
                image: r.freshImage
            }));

            for (const r of readData) {
                transaction.update(r.ref, { stock: r.stock - r.qty });
            }
            if (couponValid && couponRef && couponSnapData) {
                const newCount = (couponSnapData.usedCount || 0) + 1;
                transaction.update(couponRef, { usedCount: newCount });
            }

            transaction.set(orderRef, {
                orderNumber,
                customer: {
                    name, phone, email, address, district, thana,
                    ipAddress: currentIP || '',
                    isRepeat,
                    orderCount,
                    previousOrderNumbers,
                    flagged: ipFlagged,
                    flagReason: ipFlagged ? 'same_ip_recent' : ''
                },
                items: finalItems,
                subtotal: finalSubtotal,
                discount: finalDiscount,
                couponCode: couponValid ? couponData.code : '',
                deliveryCharge: finalDelivery,
                total: finalTotal,
                paymentMethod,
                advancePaid: finalAdvance,
                dueAmount: finalTotal - finalAdvance,
                status: 'pending',
                stockDeducted: true,
                createdAt: serverTimestamp()
            });
        });

        // ============ SEND EMAIL NOTIFICATIONS (non-blocking) ============
        if (email) {
            notifyOrderPlaced({
                orderNumber,
                customerName: name,
                customerPhone: phone,
                customerEmail: email,
                customerAddress: [address, thana, district].filter(Boolean).join(', '),
                total: finalTotal
            }).catch(e => console.warn('Email notify failed:', e));
        } else {
            // Customer-এর email না থাকলে শুধু admin alert
            notifyOrderPlaced({
                orderNumber,
                customerName: name,
                customerPhone: phone,
                customerEmail: '',
                customerAddress: [address, thana, district].filter(Boolean).join(', '),
                total: finalTotal
            }).catch(e => console.warn('Admin alert failed:', e));
        }

        saveCart([]);
        try { localStorage.removeItem('heartix_coupon'); } catch(e) {}
        window.location.href = 'order-success.html?order=' + encodeURIComponent(orderNumber);
    } catch (e) {
        console.error('Order error:', e);
        showToast(e.message || "অর্ডার প্লেস করা যায়নি", 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> PLACE ORDER';
        isPlacingOrder = false;
    }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSettings);
else loadSettings();