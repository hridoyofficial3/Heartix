// ============================================================
// HEARTIX LANDING PAGE — Customer View
// ============================================================
import { db } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getCart, saveCart, getQtyInCart,
    getWishlist, saveWishlist, isInWishlist,
    updateCartBadges, updateWishlistBadges
} from './common.js';

import {
    collection, getDocs, doc, getDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let landingData = null;
let products = [];
let settings = {};
let countdownTimer = null;
let currentQuickProduct = null;

const params = new URLSearchParams(window.location.search);
const slug = (params.get('slug') || '').trim().toLowerCase();

// ============ HELPERS ============
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
    if (isNaN(end)) return;
    const now = Date.now();
    const remaining = end - now;
    const t = formatCountdown(remaining);
    if (!t) {
        el.innerHTML = '<p class="text-red-600 font-bold text-sm">Offer শেষ হয়েছে</p>';
        if (countdownTimer) clearInterval(countdownTimer);
        return;
    }
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

// ============ RENDER HERO ============
function renderHero() {
    const el = document.getElementById('hero-section');
    if (!el) return;
    const theme = landingData.theme || 'navy';
    const bgStyle = landingData.banner ? `background-image: url('${escapeHtml(landingData.banner)}')` : '';
    const withImage = landingData.banner ? 'with-image' : '';
    const titleTheme = theme === 'gold' && !landingData.banner ? 'theme-gold' : '';
    const badgeTheme = theme === 'gold' && !landingData.banner ? 'theme-gold' : '';
    const secTheme = theme === 'gold' && !landingData.banner ? 'theme-gold' : '';

    el.innerHTML = `
        <div class="landing-hero theme-${theme} ${withImage}" style="${bgStyle}">
            <div class="landing-hero-deco top-right"></div>
            <div class="landing-hero-deco bottom-left"></div>
            <div class="landing-hero-content">
                ${landingData.badge ? `<span class="landing-badge ${badgeTheme}">${escapeHtml(landingData.badge)}</span>` : ''}
                <h1 class="landing-title ${titleTheme}">${escapeHtml(landingData.title || 'Special Offer')}</h1>
                ${landingData.subtitle ? `<p class="landing-subtitle ${secTheme}">${escapeHtml(landingData.subtitle)}</p>` : ''}
                <div class="landing-cta-row">
                    <button onclick="scrollToProducts()" class="landing-cta-btn landing-cta-primary pulse">
                        <i class="fas fa-shopping-bag"></i> এখনই কিনুন
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.scrollToProducts = function() {
    const grid = document.getElementById('products-grid');
    if (grid) {
        const top = grid.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: 'smooth' });
    }
};

// ============ RENDER PRODUCTS ============
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
        const isOut = Number(p.stock) <= 0;

        html += `
            <div class="landing-product-card">
                ${hasDiscount ? `<span class="discount-badge">-${discountPct}%</span>` : ''}
                <button onclick="toggleWishlistLanding('${p.id}', event)" class="wishlist-btn-mini ${inWishlist ? 'active' : ''}" aria-label="Wishlist">
                    <i class="fas fa-heart"></i>
                </button>
                <a href="product.html?id=${p.id}" class="block">
                    <img src="${p.image || 'https://via.placeholder.com/200x200?text=?'}" alt="${escapeHtml(p.name)}" class="product-img" loading="lazy" onerror="this.src='https://via.placeholder.com/200x200?text=?'">
                    <h4 class="name">${escapeHtml(p.name)}</h4>
                    <div class="price-row">
                        <p class="price">৳${formatPrice(p.price)}</p>
                        ${hasDiscount ? `<p class="old-price">৳${formatPrice(p.oldPrice)}</p>` : ''}
                    </div>
                </a>
                ${isOut ? `
                    <button onclick="quickOrder('${p.id}')" class="wa-btn" style="margin-top:0;">
                        <i class="fas fa-clock"></i> Pre-order
                    </button>
                ` : `
                    <button onclick="quickOrder('${p.id}')" class="order-btn">
                        <i class="fas fa-bolt"></i> এখনই অর্ডার
                    </button>
                    <button onclick="whatsappOrder('${p.id}')" class="wa-btn">
                        <i class="fab fa-whatsapp"></i> WhatsApp-এ অর্ডার
                    </button>
                `}
            </div>
        `;
    });
    grid.innerHTML = html;
}

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

// ============ QUICK ORDER ============
window.quickOrder = function(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    currentQuickProduct = p;

    const isOut = Number(p.stock) <= 0;
    const hasDiscount = p.oldPrice && p.oldPrice > p.price;

    document.getElementById('quick-product-info').innerHTML = `
        <img src="${p.image || 'https://via.placeholder.com/60x60?text=?'}" class="quick-product-thumb" onerror="this.src='https://via.placeholder.com/60x60?text=?'">
        <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-navy line-clamp-2">${escapeHtml(p.name)}</p>
            <p class="text-sm font-bold text-navy mt-1">৳${formatPrice(p.price)}</p>
            ${hasDiscount ? `<p class="text-[10px] text-gray-400 line-through">৳${formatPrice(p.oldPrice)}</p>` : ''}
            ${isOut ? `<p class="text-[10px] text-purple-600 font-bold mt-1"><i class="fas fa-clock"></i> Pre-order</p>` : ''}
        </div>
    `;

    // Prefill from localStorage
    try {
        const saved = JSON.parse(localStorage.getItem('heartix_last_order') || 'null');
        if (saved) {
            if (saved.name) document.getElementById('qo-name').value = saved.name;
            if (saved.phone) document.getElementById('qo-phone').value = saved.phone;
            if (saved.address) document.getElementById('qo-address').value = saved.address;
        }
    } catch (e) {}

    document.getElementById('quick-order-modal').classList.remove('hidden');
};

window.closeQuickOrder = function() {
    document.getElementById('quick-order-modal').classList.add('hidden');
    currentQuickProduct = null;
};

window.sendQuickOrder = function() {
    if (!currentQuickProduct) return;
    const name = (document.getElementById('qo-name').value || '').trim();
    const phone = (document.getElementById('qo-phone').value || '').trim();
    const address = (document.getElementById('qo-address').value || '').trim();

    if (!name || name.length < 2) return showToast('আপনার নাম দিন', 'error');
    if (!/^01[3-9]\d{8}$/.test(phone)) return showToast('সঠিক ফোন নাম্বার দিন', 'error');

    // Save for next time
    try {
        localStorage.setItem('heartix_last_order', JSON.stringify({ name, phone, address }));
    } catch (e) {}

    const p = currentQuickProduct;
    const waNumber = (settings.whatsapp || '').replace(/\D/g, '');
    if (!waNumber) return showToast('WhatsApp নম্বর সেট করা নেই', 'error');

    const isOut = Number(p.stock) <= 0;
    let msg = `🛍️ *Heartix Order*\n\n`;
    msg += `📦 *Product:* ${p.name}\n`;
    msg += `💰 *Price:* ৳${formatPrice(p.price)}\n`;
    if (isOut) msg += `⏳ *Type:* Pre-order\n`;
    msg += `\n👤 *Customer:*\n`;
    msg += `নাম: ${name}\n`;
    msg += `📱 ফোন: ${phone}\n`;
    if (address) msg += `📍 ঠিকানা: ${address}\n`;
    if (landingData && landingData.title) msg += `\n🎯 *From Offer:* ${landingData.title}`;
    msg += `\n\nঅনুগ্রহ করে আমার order টি confirm করুন। ধন্যবাদ! 🙏`;

    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeQuickOrder();
};

window.whatsappOrder = function(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const waNumber = (settings.whatsapp || '').replace(/\D/g, '');
    if (!waNumber) return showToast('WhatsApp নম্বর সেট করা নেই', 'error');

    let msg = `🛍️ *Heartix Order*\n\n`;
    msg += `📦 *Product:* ${p.name}\n`;
    msg += `💰 *Price:* ৳${formatPrice(p.price)}\n`;
    if (landingData && landingData.title) msg += `🎯 *Offer:* ${landingData.title}\n`;
    msg += `\nআমি এই product টি অর্ডার করতে চাই।`;

    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
};

// ============ LOAD ============
async function loadLanding() {
    if (!slug) {
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        return;
    }

    try {
        // Load landing page data
        let snap = null;
        try {
            const q = query(collection(db, 'landing_pages'), where('slug', '==', slug));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
                const d = qSnap.docs[0];
                snap = { id: d.id, ...d.data() };
            }
        } catch (e) { console.warn('Landing query:', e); }

        // Fallback: try by doc ID
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

        // Load products + settings
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

        // Render
        document.title = (landingData.title || 'Special Offer') + ' - Heartix';
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');

        renderHero();
        renderProducts();

        // Countdown
        if (landingData.countdownEnd) {
            const cdSection = document.getElementById('countdown-section');
            if (cdSection) cdSection.classList.remove('hidden');
            updateCountdown();
            if (countdownTimer) clearInterval(countdownTimer);
            countdownTimer = setInterval(updateCountdown, 1000);
        }

        // Description
        if (landingData.description) {
            document.getElementById('description-section').classList.remove('hidden');
            document.getElementById('description-text').textContent = landingData.description;
        }

        // Contact links
        const waBtn = document.getElementById('whatsapp-cta');
        const callBtn = document.getElementById('call-cta');
        const floatWa = document.getElementById('floating-wa');

        const waNum = (settings.whatsapp || '').replace(/\D/g, '');
        const waEnabled = settings.integrations?.whatsapp?.enabled !== false && waNum;

        if (waEnabled) {
            const welcomeMsg = encodeURIComponent(`আমি "${landingData.title}" page থেকে আসছি। সাহায্য দরকার।`);
            const waUrl = `https://wa.me/${waNum}?text=${welcomeMsg}`;
            if (waBtn) { waBtn.href = waUrl; waBtn.style.display = ''; }
            if (floatWa) { floatWa.href = waUrl; floatWa.classList.remove('hidden'); floatWa.classList.add('flex'); }
        } else {
            if (waBtn) waBtn.style.display = 'none';
            if (floatWa) floatWa.style.display = 'none';
        }

        if (settings.contactPhone && callBtn) {
            callBtn.href = `tel:${settings.contactPhone}`;
        } else if (callBtn) {
            callBtn.style.display = 'none';
        }

        // Cart badge
        updateCartBadges();
        updateWishlistBadges();

    } catch (e) {
        console.error('Landing load error:', e);
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}

loadLanding();

console.log('✅ landing.js loaded');