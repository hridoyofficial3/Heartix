// ============================================================
// HEARTIX LANDING PAGE — Customer View v5
// Professional WhatsApp message
// ============================================================
import { db, auth } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getWishlist, saveWishlist, isInWishlist,
    updateCartBadges, updateWishlistBadges,
    validatePhone, generateOrderNumber
} from './common.js';

import {
    collection, getDocs, doc, getDoc, query, where,
    runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let landingData = null;
let products = [];
let settings = {};
let countdownTimer = null;
let selectedProductId = null;
let isSubmitting = false;
let loggedInUser = null;
let loggedInProfile = null;

const params = new URLSearchParams(window.location.search);
const slug = (params.get('slug') || '').trim().toLowerCase();

// ============ WHATSAPP ============
function getWhatsAppNumber() {
    if (settings.integrations?.whatsapp?.number) {
        return String(settings.integrations.whatsapp.number).replace(/\D/g, '');
    }
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
    const sec = document.getElementById('countdown-section');
    if (!el) return;

    const end = new Date(landingData.countdownEnd).getTime();
    if (isNaN(end) || end <= Date.now()) {
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
                <button onclick="scrollToOrderForm()" class="landing-cta-btn">
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

window.selectProduct = function(pid) {
    if (selectedProductId === pid) {
        selectedProductId = null;
    } else {
        selectedProductId = pid;
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

// ============ SAVE/LOAD LAST ORDER ============
function saveLastOrderInfo(name, phone, address) {
    try {
        localStorage.setItem('heartix_last_order', JSON.stringify({ name, phone, address }));
    } catch (e) {}
}

function loadLastOrderInfo() {
    try {
        const saved = JSON.parse(localStorage.getItem('heartix_last_order') || 'null');
        if (saved) {
            if (saved.name) document.getElementById('order-name').value = saved.name;
            if (saved.phone) document.getElementById('order-phone').value = saved.phone;
            if (saved.address) document.getElementById('order-address').value = saved.address;
        }
    } catch (e) {}
}

// ============ SUBMIT ORDER ============
window.submitOrder = async function() {
    if (isSubmitting) return;

    const name = (document.getElementById('order-name').value || '').trim();
    const phone = (document.getElementById('order-phone').value || '').trim();
    const address = (document.getElementById('order-address').value || '').trim();
    const note = (document.getElementById('order-note').value || '').trim();

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
    if (!validatePhone(phone)) {
        showToast('সঠিক মোবাইল নাম্বার দিন (01XXXXXXXXX)', 'error');
        document.getElementById('order-phone').focus();
        return;
    }
    if (!address || address.length < 5) {
        showToast('সম্পূর্ণ ঠিকানা দিন', 'error');
        document.getElementById('order-address').focus();
        return;
    }

    const btn = document.getElementById('submit-order-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> অর্ডার হচ্ছে...';
    isSubmitting = true;

    try {
        const p = products.find(x => x.id === selectedProductId);
        if (!p) throw new Error('প্রোডাক্ট পাওয়া যায়নি');

        const email = loggedInUser?.email || '';
        const orderRef = doc(collection(db, 'orders'));
        const orderNumber = generateOrderNumber();

        let finalSubtotal = Number(p.price) || 0;
        const isFree = settings.freeDeliveryAbove > 0 && finalSubtotal >= settings.freeDeliveryAbove;
        const finalDelivery = isFree ? 0 : (Number(settings.deliveryCharge) || 0);
        const finalTotal = finalSubtotal + finalDelivery;

        const items = [{
            id: p.id,
            name: p.name,
            price: Number(p.price) || 0,
            quantity: 1,
            image: p.image || '',
            isPreorder: Number(p.stock) <= 0
        }];

        const hasPreorder = items.some(it => it.isPreorder);

        const orderData = {
            orderNumber,
            customer: {
                name, phone, email, address,
                district: '', thana: '',
                ipAddress: '',
                isRepeat: false,
                orderCount: 1,
                previousOrderNumbers: [],
                flagged: false,
                flagReason: ''
            },
            items,
            subtotal: finalSubtotal,
            discount: 0,
            couponCode: '',
            deliveryCharge: finalDelivery,
            total: finalTotal,
            paymentMethod: 'full-cod',
            advancePaid: 0,
            dueAmount: finalTotal,
            status: 'pending',
            stockDeducted: false,
            hasPreorder,
            adminNote: note
                ? `[Landing: ${landingData.title || ''}] ${note}`
                : `[Landing: ${landingData.title || ''}]`,
            source: 'landing',
            landingSlug: slug,
            landingTitle: landingData.title || '',
            createdAt: serverTimestamp()
        };

        await runTransaction(db, async (transaction) => {
            if (!hasPreorder) {
                const pRef = doc(db, 'products', p.id);
                const pSnap = await transaction.get(pRef);
                if (pSnap.exists()) {
                    const data = pSnap.data();
                    const currentStock = Number(data.stock) || 0;
                    if (currentStock > 0) {
                        transaction.update(pRef, { stock: Math.max(0, currentStock - 1) });
                        orderData.stockDeducted = true;
                    }
                }
            }
            transaction.set(orderRef, orderData);
        });

        saveLastOrderInfo(name, phone, address);
        showToast('✅ আপনার অর্ডার কনফার্ম হয়েছে!', 'success');
        showSuccessScreen(orderNumber, finalTotal);

    } catch (e) {
        console.error('Order error:', e);
        showToast(e.message || 'অর্ডার পাঠানো যায়নি', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle text-xl"></i><span>অর্ডার কনফার্ম করুন</span>';
        isSubmitting = false;
    }
};

function showSuccessScreen(orderNumber, total) {
    const formSection = document.getElementById('order-form-section');
    if (!formSection) return;

    formSection.innerHTML = `
        <div class="bg-white rounded-3xl premium-shadow-lg overflow-hidden">
            <div class="navy-gradient p-8 text-center relative overflow-hidden">
                <div class="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
                <div class="absolute bottom-0 left-0 w-32 h-32 bg-gold/10 rounded-full -ml-16 -mb-16"></div>
                <div class="relative">
                    <div class="w-20 h-20 gold-gradient rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl">
                        <i class="fas fa-check text-navy text-3xl"></i>
                    </div>
                    <h2 class="font-display text-3xl text-white font-bold mb-2">অর্ডার সফল!</h2>
                    <p class="text-gold text-sm">আমরা আপনার অর্ডার পেয়েছি</p>
                </div>
            </div>
            <div class="p-6 space-y-4">
                <div class="bg-cream rounded-2xl p-5 text-center">
                    <p class="text-[11px] text-gray-500 uppercase tracking-wider font-bold mb-1">আপনার Order Number</p>
                    <p class="font-display text-2xl font-bold text-navy tracking-wider">${escapeHtml(orderNumber)}</p>
                    <button onclick="copyOrderNum('${escapeHtml(orderNumber)}')" class="mt-2 text-xs gold-text font-bold">
                        <i class="fas fa-copy mr-1"></i> কপি করুন
                    </button>
                </div>

                <div class="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <p class="text-xs text-green-800 leading-relaxed flex items-start gap-2">
                        <i class="fas fa-info-circle text-green-600 mt-0.5"></i>
                        <span><strong>পরবর্তী ধাপ:</strong> আমরা শীঘ্রই কল করে আপনার অর্ডার কনফার্ম করব।</span>
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <a href="track-order.html?order=${encodeURIComponent(orderNumber)}" class="bg-white border-2 border-navy text-navy py-3 rounded-xl text-xs font-bold text-center">
                        <i class="fas fa-truck mr-1"></i> Track Order
                    </a>
                    <a href="index.html" class="navy-gradient text-white py-3 rounded-xl text-xs font-bold text-center">
                        <i class="fas fa-home mr-1"></i> হোম
                    </a>
                </div>

                <p class="text-[10px] text-gray-400 text-center">
                    <i class="fas fa-shield-alt mr-1"></i> এই নাম্বারটি সংরক্ষণ করুন
                </p>
            </div>
        </div>
    `;

    setTimeout(() => {
        window.scrollTo({ top: formSection.offsetTop - 70, behavior: 'smooth' });
    }, 200);
}

window.copyOrderNum = function(num) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(num).then(() => showToast('কপি হয়েছে ✅')).catch(() => {});
    }
};

// ============ LOAD USER ============
function loadLoggedInUser() {
    return new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            try { unsub(); } catch (e) {}
            if (user) {
                loggedInUser = user;
                try {
                    const snap = await getDoc(doc(db, 'customers', user.uid));
                    if (snap.exists()) loggedInProfile = snap.data();
                    else loggedInProfile = { email: user.email, name: user.displayName || '' };
                } catch (e) {
                    loggedInProfile = { email: user.email, name: user.displayName || '' };
                }
            }
            resolve();
        });
    });
}

function prefillFromProfile() {
    if (!loggedInProfile) return;
    if (loggedInProfile.name && !document.getElementById('order-name').value) {
        document.getElementById('order-name').value = loggedInProfile.name;
    }
    if (loggedInProfile.phone && !document.getElementById('order-phone').value) {
        document.getElementById('order-phone').value = loggedInProfile.phone;
    }
    if (loggedInProfile.address && !document.getElementById('order-address').value) {
        const addr = [loggedInProfile.address, loggedInProfile.thana, loggedInProfile.district].filter(Boolean).join(', ');
        document.getElementById('order-address').value = addr;
    }
}

// ============ FLOATING CONTACT (Professional Message) ============
function setupFloatingContact() {
    const wrap = document.getElementById('floating-contact');
    const callBtn = document.getElementById('float-call');
    const waBtn = document.getElementById('float-wa');
    if (!wrap) return;

    let show = false;

    const waNum = getWhatsAppNumber();
    if (waBtn && waNum) {
        // Professional WhatsApp message
        const offerTitle = landingData.title || 'Special Offer';
        const msg = `🛍️ আসসালামু আলাইকুম,\n\nআমি একটি অর্ডার করতে চাই।\n\n📌 Page: ${offerTitle}\n🔗 Link: ${window.location.href}\n\nঅনুগ্রহ করে আমাকে সাহায্য করুন।`;
        waBtn.href = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
        show = true;
    } else if (waBtn) {
        waBtn.style.display = 'none';
    }

    const cp = getContactPhone();
    if (callBtn && cp) {
        callBtn.href = `tel:${cp}`;
        show = true;
    } else if (callBtn) {
        callBtn.style.display = 'none';
    }

    if (show) wrap.classList.remove('hidden');
}

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
            getDoc(doc(db, 'settings', 'main')).catch(() => null),
            loadLoggedInUser()
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

        // Countdown
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

        setupFloatingContact();
        prefillFromProfile();
        loadLastOrderInfo();

        updateCartBadges();
        updateWishlistBadges();

    } catch (e) {
        console.error('Landing load error:', e);
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}

loadLanding();

console.log('✅ landing.js v5 loaded (professional WhatsApp message)');