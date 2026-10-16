// ============================================================
// HEARTIX LANDING PAGE — Customer View v3
// ============================================================
import { db } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getWishlist, saveWishlist, isInWishlist,
    updateCartBadges, updateWishlistBadges
} from './common.js';

import {
    collection, getDocs, doc, getDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let landingData = null;
let products = [];
let settings = {};
let countdownTimer = null;
let selectedProductId = null;

const params = new URLSearchParams(window.location.search);
const slug = (params.get('slug') || '').trim().toLowerCase();

// ============ WHATSAPP NUMBER (fixed) ============
function getWhatsAppNumber() {
    // Priority 1: integrations.whatsapp.number
    if (settings.integrations?.whatsapp?.number) {
        return String(settings.integrations.whatsapp.number).replace(/\D/g, '');
    }
    // Priority 2: legacy settings.whatsapp
    if (settings.whatsapp) {
        return String(settings.whatsapp).replace(/\D/g, '');
    }
    return '';
}

function getContactPhone() {
    return (settings.contactPhone || '').replace(/\s+/g, '');
}

// ============ COUNTDOWN ============
function formatCountdown(ms) {
    if (ms <= 0) return null;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    return { days, hours, mins, secs };
}

function updateCountdown() {
    if (!landingData || !landingData.countdownEnd) return;
    const el = document.getElementById('countdown');
    if (!el) return;

    const end = new Date(landingData.countdownEnd).getTime();
    if (isNaN(end) || end <= Date.now()) {
        // Hide section if expired
        const sec = document.getElementById('countdown-section');
        if (sec) sec.classList.add('hidden');
        if (countdownTimer) clearInterval(countdownTimer);
        return;
    }

    const remaining = end - Date.now();
    const t = formatCountdown(remaining);
    if (!t) return;

    const pad = (n) => String(n).padStart(2, '0');
    el.innerHTML = `
        <div class="countdown-item"><span class="countdown-num">${pad(t.days)}</span><span class="countdown-label">দিন</span></div>
        <span class="countdown-sep">:</span>
        <div class="countdown-item"><span class="countdown-num">${pad(t.hours)}</span><span class="countdown-label">ঘণ্টা</span></div>
        <span class="countdown-sep">:</span>
        <div class="countdown-item"><span class="countdown-num">${pad(t.mins)}</span><span class="countdown-label">মিনিট</span></div>
        <span class="countdown-sep">:</span>
        <div class="countdown-item"><span class="countdown-num">${pad(t.secs)}</span><span class="countdown-label">সেকেন্ড</span></div>
    `;
}

// ============ HERO ============
function renderHero() {
    const el = document.getElementById('hero-section');
    if (!el) return;
    const theme = landingData.theme || 'navy';
    const bgStyle = landingData.banner ? `background-image: url('${escapeHtml(landingData.banner)}')` : '';
    const withImage = landingData.banner ? 'with-image' : '';

    el.innerHTML = `
        <div class="landing-hero theme-${theme} ${withImage}" style="${bgStyle}">
            <div class="landing-hero-deco top-right"></div>
            <div class="landing-hero-deco bottom-left"></div>
            <div class="landing-hero-content">
                ${landingData.badge ? `<span class="landing-badge">${escapeHtml(landingData.badge)}</span>` : ''}
                <h1 class="landing-title">${escapeHtml(landingData.title || 'Special Offer')}</h1>
                ${landingData.subtitle ? `<p class="landing-subtitle">${escapeHtml(landingData.subtitle)}</p>` : ''}
                <button onclick="scrollToOrderForm()" class="landing-cta-btn pulse">
                    <i class="fas fa-shopping-bag"></i> অর্ডার করুন
                </button>
            </div>
        </div>
    `;
}

window.scrollToOrderForm = function() {
    const form = document.getElementById('order-form-section');
    if (form) {
        const top = form.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top, behavior: 'smooth' });
    }
};

// ============ PRODUCTS ============
function renderProducts() {
    const grid = document.getElementById('products-grid');
    const empty = document.getElementById('empty-products');
    const countEl = document.getElementById('product-count');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '';
        grid.classList.add('hidden');
        if (empty) empty.classList.remove('hidden');
        if (countEl) countEl.textContent = '';
        return;
    }
    grid.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
    if (countEl) countEl.textContent = `${products.length}টি product`;

    let html = '';
    products.forEach(p => {
        const hasDiscount = p.oldPrice && p.oldPrice > p.price;
        const discountPct = hasDiscount ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
        const inWishlist = isInWishlist(p.id);
        const isSelected = selectedProductId === p.id;

        html += `
            <div class="landing-product-card ${isSelected ? 'selected' : ''}" data-pid="${p.id}">
                ${hasDiscount ? `<span class="discount-badge">-${discountPct}%</span>` : ''}
                <button onclick="toggleWishlistLanding('${p.id}', event)" class="wishlist-btn-mini ${inWishlist ? 'active' : ''}" aria-label="Wishlist">
                    <i class="fas fa-heart"></i>
                </button>
                <img src="${p.image || 'https://via.placeholder.com/200x200?text=?'}" alt="${escapeHtml(p.name)}" class="product-img" loading="lazy" onerror="this.src='https://via.placeholder.com/200x200?text=?'">
                <h4 class="name">${escapeHtml(p.name)}</h4>
                <p class="price">৳${formatPrice(p.price)}</p>
                ${hasDiscount ? `<p class="old-price">৳${formatPrice(p.oldPrice)}</p>` : ''}
                <button onclick="selectProduct('${p.id}')" class="select-btn">
                    <i class="fas fa-${isSelected ? 'check-circle' : 'plus-circle'}"></i>
                    ${isSelected ? 'Selected' : 'Select করুন'}
                </button>
            </div>
        `;
    });
    grid.innerHTML = html;
}

// ============ FORM PRODUCT SELECTOR ============
function renderFormProductSelector() {
    const sel = document.getElementById('form-product-selector');
    if (!sel) return;

    if (products.length === 0) {
        sel.innerHTML = '<p class="text-xs text-gray-400 text-center py-3">কোনো product নেই</p>';
        return;
    }

    let html = '';
    products.forEach(p => {
        const isSelected = selectedProductId === p.id;
        const hasDiscount = p.oldPrice && p.oldPrice > p.price;
        html += `
            <div class="form-prod-row ${isSelected ? 'selected' : ''}" onclick="selectProduct('${p.id}')">
                <div class="check-circle"><i class="fas fa-check"></i></div>
                <img src="${p.image || 'https://via.placeholder.com/50x50?text=?'}" class="form-prod-img" onerror="this.src='https://via.placeholder.com/50x50?text=?'">
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-navy truncate">${escapeHtml(p.name)}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-sm font-bold text-navy">৳${formatPrice(p.price)}</span>
                        ${hasDiscount ? `<span class="text-[10px] text-gray-400 line-through">৳${formatPrice(p.oldPrice)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    sel.innerHTML = html;
}

// ============ SELECT PRODUCT ============
window.selectProduct = function(pid) {
    if (selectedProductId === pid) {
        selectedProductId = null;
    } else {
        selectedProductId = pid;
        // Auto scroll to form on first selection
        setTimeout(() => scrollToOrderForm(), 100);
    }
    renderProducts();
    renderFormProductSelector();
};

// ============ WISHLIST ============
window.toggleWishlistLanding = function(id, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    let w = getWishlist();
    const idx = w.indexOf(id);
    const p = products.find(x => x.id === id);
    if (idx > -1) {
        w.splice(idx, 1);
        showToast('Wishlist থেকে সরানো হয়েছে', 'warn');
    } else {
        w.push(id);
        showToast('Wishlist-এ যোগ হয়েছে', 'success');
    }
    saveWishlist(w);
    updateWishlistBadges();
    renderProducts();
};

// ============ SUBMIT ORDER ============
window.submitOrder = function() {
    const name = (document.getElementById('order-name').value || '').trim();
    const phone = (document.getElementById('order-phone').value || '').trim();
    const address = (document.getElementById('order-address').value || '').trim();

    // Validation
    if (!selectedProductId) {
        showToast('প্রোডাক্ট select করুন', 'error');
        scrollToOrderForm();
        return;
    }
    if (!name || name.length < 2) {
        showToast('সঠিক নাম দিন', 'error');
        document.getElementById('order-name').focus();
        return;
    }
    if (!/^01[3-9]\d{8}$/.test(phone)) {
        showToast('সঠিক মোবাইল নাম্বার দিন (01XXXXXXXXX)', 'error');
        document.getElementById('order-phone').focus();
        return;
    }
    if (!address || address.length < 5) {
        showToast('সম্পূর্ণ ঠিকানা দিন', 'error');
        document.getElementById('order-address').focus();
        return;
    }

    const waNumber = getWhatsAppNumber();
    if (!waNumber) {
        showToast('WhatsApp নাম্বার সেট করা নেই। ফোনে order করুন।', 'error');
        return;
    }

    // Save for next time
    try {
        localStorage.setItem('heartix_last_order', JSON.stringify({ name, phone, address }));
    } catch (e) {}

    const p = products.find(x => x.id === selectedProductId);
    if (!p) return;

    // Build message
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let msg = `🛍️ *Heartix — নতুন অর্ডার*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📦 *প্রোডাক্ট*\n`;
    msg += `${p.name}\n`;
    msg += `💰 দাম: ৳${formatPrice(p.price)}\n`;
    msg += `📊 Quantity: 1\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `👤 *গ্রাহকের তথ্য*\n`;
    msg += `নাম: ${name}\n`;
    msg += `📱 মোবাইল: ${phone}\n`;
    msg += `🏠 ঠিকানা: ${address}\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (landingData.title) msg += `🎯 Offer: ${landingData.title}\n`;
    msg += `🕒 সময়: ${dateStr} ${timeStr}\n\n`;
    msg += `অনুগ্রহ করে আমার অর্ডারটি কনফার্ম করুন। ধন্যবাদ! 🙏`;

    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('WhatsApp-এ পাঠানো হচ্ছে...', 'success');
};

// ============ LOAD ============
async function loadLanding() {
    if (!slug) {
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        return;
    }

    try {
        let snap = null;
        try {
            const q = query(collection(db, 'landing_pages'), where('slug', '==', slug));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
                const d = qSnap.docs[0];
                snap = { id: d.id, ...d.data() };
            }
        } catch (e) { console.warn('Landing query:', e); }

        if (!snap) {
            const direct = await getDoc(doc(db, 'landing_pages', slug));
            if (direct.exists()) snap = { id: direct.id, ...direct.data() };
        }

        if (!snap || snap.active === false) {
            document.getElementById('loading-skeleton').classList.add('hidden');
            document.getElementById('error-state').classList.remove('hidden');
            return;
        }

        landingData = snap;

        const [prodSnap, setSnap] = await Promise.all([
            getDocs(collection(db, 'products')).catch(() => null),
            getDoc(doc(db, 'settings', 'main')).catch(() => null)
        ]);

        const allProducts = {};
        if (prodSnap) prodSnap.forEach(d => { allProducts[d.id] = { id: d.id, ...d.data() }; });

        products = (landingData.productIds || [])
            .map(pid => allProducts[pid])
            .filter(Boolean);

        if (setSnap && setSnap.exists()) {
            settings = setSnap.data();
        }

        document.title = (landingData.title || 'Special Offer') + ' - Heartix';
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');

        renderHero();
        renderProducts();
        renderFormProductSelector();

        // Countdown - only show if valid future date
        if (landingData.countdownEnd) {
            const end = new Date(landingData.countdownEnd).getTime();
            if (!isNaN(end) && end > Date.now()) {
                document.getElementById('countdown-section').classList.remove('hidden');
                updateCountdown();
                if (countdownTimer) clearInterval(countdownTimer);
                countdownTimer = setInterval(updateCountdown, 1000);
            }
        }

        // Description
        if (landingData.description) {
            document.getElementById('description-section').classList.remove('hidden');
            document.getElementById('description-text').textContent = landingData.description;
        }

        // Call button
        const callBtn = document.getElementById('call-order-btn');
        const cp = getContactPhone();
        if (callBtn && cp) {
            callBtn.href = `tel:${cp}`;
        } else if (callBtn) {
            callBtn.style.display = 'none';
        }

        // Auto-fill last order
        try {
            const saved = JSON.parse(localStorage.getItem('heartix_last_order') || 'null');
            if (saved) {
                if (saved.name) document.getElementById('order-name').value = saved.name;
                if (saved.phone) document.getElementById('order-phone').value = saved.phone;
                if (saved.address) document.getElementById('order-address').value = saved.address;
            }
        } catch (e) {}

        updateCartBadges();
        updateWishlistBadges();

    } catch (e) {
        console.error('Landing load error:', e);
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}

loadLanding();

console.log('✅ landing.js v3 loaded');