// ============================================================
// HEARTIX ADMIN — JavaScript (Complete)
// ============================================================
import { db, auth } from './firebase.js';
import { escapeHtml, formatPrice as fmt } from './common.js';

import {
    collection, getDocs, addDoc, updateDoc, deleteDoc,
    doc, setDoc, getDoc, query, orderBy, increment, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============ CONFIG ============
const CLOUDINARY_CLOUD_NAME = "ju2w6e9r";
const CLOUDINARY_UPLOAD_PRESET = "heartix_unsigned";

const DEFAULT_CATEGORIES = [
    { key: 'TV', label: 'Televisions', icon: '📺' },
    { key: 'Fridge', label: 'Refrigerators', icon: '❄️' },
    { key: 'Fan', label: 'Fans', icon: '🌀' },
    { key: 'Gadget', label: 'Smart Gadgets', icon: '🔌' }
];

// ============ STATE ============
let allProductsList = [];
let allOrdersList = [];
let allReviewsList = [];
let allCouponsList = [];
let allCategories = [...DEFAULT_CATEGORIES];
let customSections = [];
let middleBanners = [];
let testimonials = [];
let heroBanners = [];
let currentOrderFilter = 'all';
let currentUser = null;
let editingOrderId = null;
let editingOrderItems = [];
let pendingStatusChange = null;
let statusPickerOrderId = null;
let pendingImages = [];
let existingImages = [];
let pendingCategoryImage = null;
let existingCategoryImage = null;
let removeExistingCategoryImage = false;
let pendingBannerImage = null;
let pendingTestImage = null;
let pendingHeroImage = null;
let removeHeroImage = false;

// ============ HELPERS ============
function safeHeroTitle(t) {
    if (!t) return '';
    return escapeHtml(t).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
}

function toast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    const icons = { success: 'check-circle', error: 'times-circle', warn: 'exclamation-triangle', info: 'info-circle' };
    t.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i><span>${escapeHtml(msg)}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.style.transition = 'all 0.3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

function showSection(id) {
    ['loading-section', 'login-section', 'not-admin-section', 'dashboard-section'].forEach(s => {
        document.getElementById(s).classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
}

async function verifyAdmin(uid) {
    try {
        const snap = await getDoc(doc(db, "settings", "admins"));
        if (snap.exists()) {
            const uids = snap.data().uids || [];
            return Array.isArray(uids) && uids.includes(uid);
        }
    } catch (e) {}
    return false;
}

// ============ MORE MENU (Mobile) ============
window.openMoreMenu = function() {
    document.getElementById('more-menu-modal').classList.remove('hidden');
}
window.closeMoreMenu = function() {
    document.getElementById('more-menu-modal').classList.add('hidden');
}

// ============ AUTH ============
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const ok = await verifyAdmin(user.uid);
        if (ok) {
            const ed = document.getElementById('admin-email-display');
            if (ed) ed.textContent = user.email || '';
            const se = document.getElementById('settings-email');
            if (se) se.textContent = user.email || '';
            showSection('dashboard-section');
            loadAllData();
        } else {
            await signOut(auth);
            showSection('not-admin-section');
        }
    } else {
        currentUser = null;
        showSection('login-section');
    }
});

window.login = async function() {
    const email = (document.getElementById('admin-email').value || '').trim();
    const password = document.getElementById('admin-password').value || '';
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');
    if (!email || !password) { errEl.textContent = 'ইমেইল ও পাসওয়ার্ড দিন'; errEl.classList.remove('hidden'); return; }
    const btn = document.getElementById('login-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing in...';
    try {
        await signInWithEmailAndPassword(auth, email, password);
        document.getElementById('admin-password').value = '';
    } catch (e) {
        let msg = 'লগইন ব্যর্থ';
        if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'ইমেইল বা পাসওয়ার্ড ভুল';
        else if (e.code === 'auth/user-not-found') msg = 'এই ইমেইলে ইউজার নেই';
        else if (e.code === 'auth/invalid-email') msg = 'সঠিক ইমেইল দিন';
        else if (e.code === 'auth/too-many-requests') msg = 'অনেকবার ভুল — কিছুক্ষণ পর চেষ্টা';
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
    } finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> SIGN IN'; }
}

window.logout = async function() {
    try { await signOut(auth); } catch (e) {}
    location.reload();
}

window.showTab = function(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const c = document.getElementById('content-' + tab);
    if (c) { c.classList.remove('hidden'); c.classList.add('animate-fade-in'); }
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.dataset.tab) btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.mob-nav-btn').forEach(btn => {
        if (btn.dataset.tab) {
            const m = btn.dataset.tab === tab;
            btn.classList.toggle('text-gold', m);
            btn.classList.toggle('text-gray-400', !m);
        }
    });
    if (tab === 'settings') loadSettings();
    window.scrollTo({top:0, behavior:'smooth'});
}

async function loadAllData() {
    await loadSettingsData();
    await loadProducts();
    await loadOrders();
    await loadReviews();
    await loadCoupons();
    await loadMessagesBadge();
    updateStats();
}

// ============ MESSAGES BADGE ============
async function loadMessagesBadge() {
    try {
        const snap = await getDocs(collection(db, "messages"));
        let unreadCount = 0;
        snap.forEach(d => { if (!d.data().read) unreadCount++; });
        const b1 = document.getElementById('messages-badge-sidebar');
        const b2 = document.getElementById('messages-badge-mob');
        if (unreadCount > 0) {
            if (b1) { b1.textContent = unreadCount; b1.classList.remove('hidden'); }
            if (b2) { b2.textContent = unreadCount; b2.classList.remove('hidden'); }
        } else {
            if (b1) b1.classList.add('hidden');
            if (b2) b2.classList.add('hidden');
        }
    } catch (e) { console.warn('Messages badge:', e); }
}

// ============ SETTINGS DATA ============
async function loadSettingsData() {
    try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (snap.exists()) {
            const s = snap.data();
            if (Array.isArray(s.categories) && s.categories.length > 0) allCategories = s.categories;
            if (Array.isArray(s.customSections)) customSections = s.customSections;
            if (Array.isArray(s.middleBanners)) middleBanners = s.middleBanners;
            if (Array.isArray(s.testimonials)) testimonials = s.testimonials;
            if (Array.isArray(s.heroBanners)) heroBanners = s.heroBanners;
        }
    } catch (e) {}
    renderAdminCategories();
    populateSectionDropdown();
    populateCategoryCheckboxes();
    renderHeroBannersList();
    renderSectionsList();
    renderBannersList();
    renderTestimonialsList();
}

function populateSectionDropdown() {
    const sel = document.getElementById('section-category');
    if (!sel) return;
    const cv = sel.value;
    sel.innerHTML = '';
    allCategories.forEach(c => {
        const o = document.createElement('option');
        o.value = c.key; o.textContent = c.label;
        sel.appendChild(o);
    });
    if (cv) sel.value = cv;
}

function populateCategoryCheckboxes() {
    const container = document.getElementById('p-categories-list');
    if (!container) return;
    if (allCategories.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 col-span-2 text-center py-2">কোনো category নেই — "New" ক্লিক করুন</p>';
        return;
    }
    let html = '';
    allCategories.forEach(c => {
        html += `<label class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" value="${escapeHtml(c.key)}" class="cat-checkbox w-4 h-4 accent-[#D4A84B]">
            <span class="text-xs font-medium text-navy truncate">${escapeHtml(c.label)}</span>
        </label>`;
    });
    container.innerHTML = html;
}

async function uploadToImgBB(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
    const result = await res.json();
    if (!result.secure_url) throw new Error(result.error?.message || "Upload failed");
    return result.secure_url;
}

// ============ INLINE CATEGORY (Quick Add from Product Modal) ============
window.openInlineCategoryModal = function() {
    document.getElementById('inline-cat-key').value = '';
    document.getElementById('inline-cat-label').value = '';
    document.getElementById('inline-cat-icon').value = '';
    document.getElementById('inline-cat-modal').classList.remove('hidden');
}

window.closeInlineCategoryModal = function() {
    document.getElementById('inline-cat-modal').classList.add('hidden');
}

window.saveInlineCategory = async function() {
    const key = document.getElementById('inline-cat-key').value.trim().replace(/\s+/g, '');
    const label = document.getElementById('inline-cat-label').value.trim();
    const icon = document.getElementById('inline-cat-icon').value.trim() || '📦';
    if (!key || !label) return toast('Key ও Name দুটোই দিন', 'error');
    if (allCategories.some(c => c.key === key)) return toast('এই Key আগে থেকেই আছে', 'error');

    const btn = document.getElementById('inline-cat-save-btn');
    btn.disabled = true; btn.textContent = 'Saving...';

    try {
        allCategories.push({ key, label, icon });
        await setDoc(doc(db, "settings", "main"), { categories: allCategories }, { merge: true });

        // Refresh checkbox list, then check the newly added one
        populateCategoryCheckboxes();
        const newCb = document.querySelector(`#p-categories-list .cat-checkbox[value="${key}"]`);
        if (newCb) newCb.checked = true;

        // Also refresh section dropdown + category list tab
        populateSectionDropdown();
        renderAdminCategories();

        closeInlineCategoryModal();
        toast('Category যোগ হয়েছে!');
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    } finally {
        btn.disabled = false; btn.textContent = 'SAVE';
    }
}

// ============ COUPONS ============
async function loadCoupons() {
    try {
        const snap = await getDocs(collection(db, "coupons"));
        allCouponsList = [];
        snap.forEach(d => allCouponsList.push({ code: d.id, ...d.data() }));
        renderAdminCoupons();
    } catch (e) { console.error('Coupons:', e); }
}

window.renderAdminCoupons = function() {
    const list = document.getElementById('coupon-list-admin');
    if (!list) return;
    if (allCouponsList.length === 0) {
        list.innerHTML = `<div class="bg-white rounded-2xl p-12 text-center premium-shadow">
            <i class="fas fa-ticket-alt text-4xl text-gray-200 mb-3"></i>
            <p class="text-sm text-gray-500 mb-2">কোনো coupon নেই</p>
            <p class="text-xs text-gray-400">"New Coupon" ক্লিক করে প্রথম coupon তৈরি করুন</p>
        </div>`;
        return;
    }
    let html = '';
    allCouponsList.forEach(c => {
        const isExpired = c.expiry && new Date(c.expiry) < new Date();
        const isExhausted = c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses;
        const isInactive = c.active === false;
        const statusBadge = isExpired ? '<span class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">EXPIRED</span>'
            : isExhausted ? '<span class="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">EXHAUSTED</span>'
            : isInactive ? '<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">INACTIVE</span>'
            : '<span class="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>';
        const discount = c.type === 'percentage' ? `${c.value}%` : `৳${fmt(c.value)}`;
        html += `<div class="coupon-card bg-white rounded-2xl p-4 premium-shadow border-l-4 border-gold">
            <div class="flex justify-between items-start mb-2 gap-2">
                <div class="min-w-0 flex-1">
                    <p class="font-bold text-navy text-lg tracking-wider">${escapeHtml(c.code)}</p>
                    ${c.description ? `<p class="text-xs text-gray-500 mt-0.5">${escapeHtml(c.description)}</p>` : ''}
                </div>
                <div class="text-right flex-shrink-0">${statusBadge}</div>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center mb-3">
                <div class="bg-gray-50 rounded-lg p-2">
                    <p class="text-[9px] text-gray-500 font-bold uppercase">Discount</p>
                    <p class="text-sm font-bold text-gold mt-0.5">${discount}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-2">
                    <p class="text-[9px] text-gray-500 font-bold uppercase">Min Order</p>
                    <p class="text-sm font-bold text-navy mt-0.5">${c.minOrder > 0 ? '৳' + fmt(c.minOrder) : '—'}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-2">
                    <p class="text-[9px] text-gray-500 font-bold uppercase">Used</p>
                    <p class="text-sm font-bold text-navy mt-0.5">${c.usedCount || 0}${c.maxUses > 0 ? ' / ' + c.maxUses : ''}</p>
                </div>
            </div>
            ${c.expiry ? `<p class="text-[11px] text-gray-500 mb-2"><i class="fas fa-calendar mr-1"></i>Expires: ${c.expiry}</p>` : ''}
            <div class="grid grid-cols-2 gap-2">
                <button onclick="editCoupon('${escapeHtml(c.code)}')" class="py-2.5 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center gap-2 text-xs font-bold">
                    <i class="fas fa-pen"></i> Edit
                </button>
                <button onclick="deleteCoupon('${escapeHtml(c.code)}')" class="py-2.5 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 text-xs font-bold">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

window.openCouponModal = function() {
    document.getElementById('coupon-modal-title').innerText = 'Add Coupon';
    document.getElementById('edit-coupon-code').value = '';
    ['cp-code','cp-desc','cp-value','cp-expiry'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('cp-type').value = 'percentage';
    document.getElementById('cp-min').value = '0';
    document.getElementById('cp-maxuses').value = '0';
    document.getElementById('cp-active').checked = true;
    document.getElementById('cp-code').disabled = false;
    updateCouponValueLabel();
    document.getElementById('coupon-modal').classList.remove('hidden');
}
window.closeCouponModal = function() { document.getElementById('coupon-modal').classList.add('hidden'); }

window.updateCouponValueLabel = function() {
    const type = document.getElementById('cp-type').value;
    const label = document.getElementById('cp-value-label');
    if (label) label.textContent = type === 'percentage' ? 'Discount Value (%) *' : 'Discount Value (৳) *';
    const input = document.getElementById('cp-value');
    if (input) {
        if (type === 'percentage') { input.max = 90; input.min = 1; }
        else { input.max = ''; input.min = 1; }
    }
}

window.editCoupon = function(code) {
    const c = allCouponsList.find(x => x.code === code);
    if (!c) return;
    document.getElementById('coupon-modal-title').innerText = 'Edit Coupon';
    document.getElementById('edit-coupon-code').value = c.code;
    document.getElementById('cp-code').value = c.code;
    document.getElementById('cp-code').disabled = true;
    document.getElementById('cp-desc').value = c.description || '';
    document.getElementById('cp-type').value = c.type || 'percentage';
    document.getElementById('cp-value').value = c.value || '';
    document.getElementById('cp-min').value = c.minOrder || 0;
    document.getElementById('cp-maxuses').value = c.maxUses || 0;
    document.getElementById('cp-expiry').value = c.expiry || '';
    document.getElementById('cp-active').checked = c.active !== false;
    updateCouponValueLabel();
    document.getElementById('coupon-modal').classList.remove('hidden');
}

window.saveCoupon = async function() {
    const oldCode = document.getElementById('edit-coupon-code').value;
    const codeInput = document.getElementById('cp-code').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const code = oldCode || codeInput;
    const description = document.getElementById('cp-desc').value.trim();
    const type = document.getElementById('cp-type').value;
    const value = parseFloat(document.getElementById('cp-value').value);
    const minOrder = parseFloat(document.getElementById('cp-min').value) || 0;
    const maxUses = parseInt(document.getElementById('cp-maxuses').value) || 0;
    const expiry = document.getElementById('cp-expiry').value || '';
    const active = document.getElementById('cp-active').checked;

    if (!code || code.length < 3) return toast('Code কমপক্ষে ৩ অক্ষর', 'error');
    if (!value || value <= 0) return toast('Discount value দিন', 'error');
    if (type === 'percentage' && value > 90) return toast('Percentage ৯০% এর বেশি হতে পারবে না', 'error');
    if (!oldCode && allCouponsList.some(c => c.code === code)) return toast('এই code আগে থেকেই আছে', 'error');

    const btn = document.getElementById('coupon-save-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';

    try {
        const existing = allCouponsList.find(c => c.code === code);
        const data = {
            description, type, value, minOrder,
            maxUses, expiry, active,
            usedCount: existing?.usedCount || 0,
            updatedAt: new Date().toISOString()
        };
        if (!existing) data.createdAt = new Date().toISOString();
        await setDoc(doc(db, "coupons", code), data, { merge: true });
        toast('Coupon saved!');
        closeCouponModal();
        await loadCoupons();
    } catch (e) {
        toast("Error: " + e.message, 'error');
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i> SAVE COUPON';
    }
}

window.deleteCoupon = async function(code) {
    if (!confirm(`"${code}" coupon ডিলিট করবেন?`)) return;
    try {
        await deleteDoc(doc(db, "coupons", code));
        toast('Coupon deleted', 'warn');
        await loadCoupons();
    } catch (e) { toast("Error: " + e.message, 'error'); }
}

// ============ HERO BANNERS ============
function renderHeroBannersList() {
    const list = document.getElementById('hero-banners-list-admin');
    if (!list) return;
    if (heroBanners.length === 0) { list.innerHTML = '<p class="text-center text-gray-400 text-xs py-6">No banners yet</p>'; return; }
    let html = '';
    heroBanners.forEach((b, i) => {
        let bg = '';
        if (b.image) bg = `background-image:url('${b.image}');background-size:cover;background-position:center;`;
        else if (b.bg === 'gold') bg = 'background:linear-gradient(135deg,#B8860B,#E8C77B);';
        else if (b.bg === 'teal') bg = 'background:linear-gradient(135deg,#0F4C5C,#2C8B9E);';
        else bg = 'background:linear-gradient(135deg,#0A1628,#152238);';
        html += `<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="w-16 h-12 rounded-lg flex-shrink-0" style="${bg}"></div>
            <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-navy truncate">${safeHeroTitle(b.title)}</p><p class="text-[11px] text-gray-500 truncate">${escapeHtml(b.badge || '')}</p></div>
            <button onclick="editHeroBanner(${i})" class="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><i class="fas fa-edit text-xs"></i></button>
            <button onclick="deleteHeroBanner(${i})" class="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
        </div>`;
    });
    list.innerHTML = html;
}

window.openHeroModal = function() {
    document.getElementById('hero-modal-title').innerText = 'Add Hero Banner';
    document.getElementById('edit-hero-idx').value = '';
    ['hero-badge','hero-title-input','hero-subtitle-input','hero-link'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('hero-bg').value = 'navy';
    document.getElementById('hero-image-file').value = '';
    document.getElementById('hero-file-name').innerText = '';
    document.getElementById('hero-image-preview').classList.add('hidden');
    pendingHeroImage = null; removeHeroImage = false;
    document.getElementById('hero-modal').classList.remove('hidden');
}
window.closeHeroModal = function() { document.getElementById('hero-modal').classList.add('hidden'); }

window.editHeroBanner = function(i) {
    const b = heroBanners[i];
    document.getElementById('hero-modal-title').innerText = 'Edit Hero Banner';
    document.getElementById('edit-hero-idx').value = i;
    document.getElementById('hero-badge').value = b.badge || '';
    document.getElementById('hero-title-input').value = b.title || '';
    document.getElementById('hero-subtitle-input').value = b.subtitle || '';
    document.getElementById('hero-bg').value = b.bg || 'navy';
    document.getElementById('hero-link').value = b.link || '';
    pendingHeroImage = null; removeHeroImage = false;
    document.getElementById('hero-image-file').value = '';
    document.getElementById('hero-file-name').innerText = '';
    if (b.image) { document.getElementById('hero-preview-img').src = b.image; document.getElementById('hero-image-preview').classList.remove('hidden'); }
    else document.getElementById('hero-image-preview').classList.add('hidden');
    document.getElementById('hero-modal').classList.remove('hidden');
}

window.clearHeroImage = function() {
    pendingHeroImage = null; removeHeroImage = true;
    document.getElementById('hero-image-file').value = '';
    document.getElementById('hero-file-name').innerText = '';
    document.getElementById('hero-image-preview').classList.add('hidden');
}

window.saveHeroBanner = async function() {
    const idx = document.getElementById('edit-hero-idx').value;
    const badge = document.getElementById('hero-badge').value.trim();
    const title = document.getElementById('hero-title-input').value.trim();
    const subtitle = document.getElementById('hero-subtitle-input').value.trim();
    const bg = document.getElementById('hero-bg').value;
    const link = document.getElementById('hero-link').value.trim();
    if (!title) return toast("Title required!", 'error');
    const btn = document.getElementById('hero-save-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
    try {
        let image = null;
        if (pendingHeroImage) { image = await uploadToImgBB(pendingHeroImage.file); }
        else if (idx !== '' && heroBanners[parseInt(idx)].image && !removeHeroImage) image = heroBanners[parseInt(idx)].image;
        const b = { badge, title, subtitle, bg, link, image };
        if (idx !== '') heroBanners[parseInt(idx)] = b; else heroBanners.push(b);
        await setDoc(doc(db, "settings", "main"), { heroBanners }, { merge: true });
        closeHeroModal(); renderHeroBannersList(); toast('Saved!');
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i> SAVE'; }
}

window.deleteHeroBanner = async function(i) {
    if (!confirm("Delete?")) return;
    heroBanners.splice(i, 1);
    await setDoc(doc(db, "settings", "main"), { heroBanners }, { merge: true });
    renderHeroBannersList(); toast('Deleted', 'warn');
}

// ============ CATEGORIES ============
window.renderAdminCategories = function() {
    const list = document.getElementById('category-list-admin');
    if (!list) return;
    if (allCategories.length === 0) { list.innerHTML = '<div class="bg-white rounded-2xl p-12 text-center premium-shadow"><i class="fas fa-th-large text-4xl text-gray-200 mb-3"></i><p class="text-sm text-gray-500">No categories</p></div>'; return; }
    let html = '';
    allCategories.forEach((c, i) => {
        const isImg = c.icon && (c.icon.startsWith('http') || c.icon.startsWith('data:'));
        const iconHtml = isImg ? `<img src="${c.icon}" class="w-full h-full object-contain p-1">` : `<span class="emoji">${c.icon || '📦'}</span>`;
        html += `<div onclick="editCategory(${i})" class="cat-card bg-white rounded-2xl p-4 premium-shadow flex items-center gap-3 cursor-pointer">
            <div class="cat-preview">${iconHtml}</div>
            <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-navy truncate">${escapeHtml(c.label)}</p>
                <p class="text-xs text-gray-500 truncate">${escapeHtml(c.key)}</p>
                <p class="text-[10px] text-gold font-semibold mt-1"><i class="fas fa-hand-pointer mr-1"></i>Tap to edit</p>
            </div>
            <div class="flex flex-col gap-2 flex-shrink-0" onclick="event.stopPropagation()">
                <button onclick="editCategory(${i})" class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><i class="fas fa-pen text-sm"></i></button>
                <button onclick="deleteCategory(${i})" class="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><i class="fas fa-trash text-sm"></i></button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

window.openCategoryModal = function() {
    document.getElementById('cat-modal-title').innerText = 'Add Category';
    document.getElementById('edit-category-key').value = '';
    ['cat-key','cat-label','cat-icon-emoji'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('cat-image-file').value = '';
    document.getElementById('cat-file-name').innerText = '';
    document.getElementById('cat-image-preview').classList.add('hidden');
    pendingCategoryImage = null; existingCategoryImage = null; removeExistingCategoryImage = false;
    document.getElementById('category-modal').classList.remove('hidden');
}
window.closeCategoryModal = function() { document.getElementById('category-modal').classList.add('hidden'); }

window.editCategory = function(index) {
    const c = allCategories[index]; if (!c) return;
    document.getElementById('cat-modal-title').innerText = 'Edit Category';
    document.getElementById('edit-category-key').value = c.key;
    document.getElementById('cat-key').value = c.key;
    document.getElementById('cat-label').value = c.label;
    const isImg = c.icon && (c.icon.startsWith('http') || c.icon.startsWith('data:'));
    document.getElementById('cat-icon-emoji').value = isImg ? '' : (c.icon || '');
    pendingCategoryImage = null; existingCategoryImage = isImg ? c.icon : null; removeExistingCategoryImage = false;
    document.getElementById('cat-image-file').value = '';
    document.getElementById('cat-file-name').innerText = '';
    if (isImg) { document.getElementById('cat-image-preview-img').src = c.icon; document.getElementById('cat-image-preview').classList.remove('hidden'); }
    else document.getElementById('cat-image-preview').classList.add('hidden');
    document.getElementById('category-modal').classList.remove('hidden');
}

window.clearCategoryImage = function() {
    pendingCategoryImage = null; existingCategoryImage = null; removeExistingCategoryImage = true;
    document.getElementById('cat-image-file').value = '';
    document.getElementById('cat-file-name').innerText = '';
    document.getElementById('cat-image-preview').classList.add('hidden');
}

async function updateProductsCategory(oldKey, newKey) {
    const snap = await getDocs(collection(db, "products"));
    const batch = writeBatch(db);
    let count = 0;
    snap.forEach(d => {
        const data = d.data();
        let changed = false;
        const update = {};
        if (data.category === oldKey) { update.category = newKey; changed = true; }
        if (Array.isArray(data.categories) && data.categories.includes(oldKey)) {
            update.categories = data.categories.map(k => k === oldKey ? newKey : k);
            changed = true;
        }
        if (changed) { batch.update(d.ref, update); count++; }
    });
    if (count > 0) await batch.commit();
    return count;
}

window.saveCategory = async function() {
    const oldKey = document.getElementById('edit-category-key').value;
    const key = document.getElementById('cat-key').value.trim().replace(/\s+/g, '');
    const label = document.getElementById('cat-label').value.trim();
    const emoji = document.getElementById('cat-icon-emoji').value.trim();
    if (!key || !label) return toast("Key and Name required!", 'error');
    if (key !== oldKey && allCategories.some(c => c.key === key)) return toast("Key exists!", 'error');
    const btn = document.getElementById('cat-save-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
    try {
        let finalIcon = '📦';
        if (pendingCategoryImage) finalIcon = await uploadToImgBB(pendingCategoryImage.file);
        else if (emoji) finalIcon = emoji;
        else if (existingCategoryImage && !removeExistingCategoryImage) finalIcon = existingCategoryImage;
        const newCategory = { key, label, icon: finalIcon };
        if (oldKey) { const idx = allCategories.findIndex(c => c.key === oldKey); if (idx > -1) allCategories[idx] = newCategory; }
        else allCategories.push(newCategory);
        await setDoc(doc(db, "settings", "main"), { categories: allCategories }, { merge: true });
        if (oldKey && oldKey !== key) {
            const updated = await updateProductsCategory(oldKey, key);
            toast(`Saved! ${updated} products updated.`);
        } else toast('Saved!');
        closeCategoryModal(); renderAdminCategories(); populateSectionDropdown(); populateCategoryCheckboxes(); await loadProducts();
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i> SAVE'; }
}

window.deleteCategory = async function(index) {
    const cat = allCategories[index]; if (!cat) return;
    let productCount = 0;
    try {
        const snap = await getDocs(collection(db, "products"));
        snap.forEach(d => {
            const data = d.data();
            const cats = Array.isArray(data.categories) ? data.categories : (data.category ? [data.category] : []);
            if (cats.includes(cat.key)) productCount++;
        });
    } catch (e) {}
    let msg = `"${cat.label}" ক্যাটেগরি ডিলিট করবেন?`;
    if (productCount > 0) {
        msg = `⚠️ "${cat.label}" ক্যাটেগরিতে ${productCount} টি প্রোডাক্ট আছে।\n\nডিলিট করলে ওই প্রোডাক্ট থেকে এটা সরিয়ে দেওয়া হবে।\n\nডিলিট করবেন?`;
    }
    if (!confirm(msg)) return;
    allCategories.splice(index, 1);
    await setDoc(doc(db, "settings", "main"), { categories: allCategories }, { merge: true });
    if (productCount > 0) {
        try {
            const snap = await getDocs(collection(db, "products"));
            const batch = writeBatch(db);
            snap.forEach(d => {
                const data = d.data();
                let changed = false;
                const update = {};
                const cats = Array.isArray(data.categories) ? data.categories : (data.category ? [data.category] : []);
                const newCats = cats.filter(k => k !== cat.key);
                if (newCats.length !== cats.length) {
                    update.categories = newCats;
                    update.category = newCats[0] || '';
                    changed = true;
                }
                if (data.category === cat.key && (!data.categories || data.categories.length === 0)) {
                    update.category = '';
                }
                if (changed) batch.update(d.ref, update);
            });
            await batch.commit();
        } catch (e) { console.warn('Bulk update failed:', e); }
    }
    renderAdminCategories(); populateSectionDropdown(); populateCategoryCheckboxes(); await loadProducts();
    toast('Deleted', 'warn');
}

// ============ SECTIONS ============
function renderSectionsList() {
    const list = document.getElementById('sections-list-admin'); if (!list) return;
    if (customSections.length === 0) { list.innerHTML = '<p class="text-center text-gray-400 text-xs py-6">No sections</p>'; return; }
    let html = '';
    customSections.forEach((s, i) => {
        const cat = allCategories.find(c => c.key === s.categoryKey);
        html += `<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-navy">${escapeHtml(s.title)}</p><p class="text-[11px] text-gray-500">${cat ? escapeHtml(cat.label) : escapeHtml(s.categoryKey)}</p></div>
            <button onclick="editSection(${i})" class="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><i class="fas fa-edit text-xs"></i></button>
            <button onclick="deleteSection(${i})" class="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
        </div>`;
    });
    list.innerHTML = html;
}

window.openSectionModal = function() {
    document.getElementById('section-modal-title').innerText = 'Add Section';
    document.getElementById('edit-section-idx').value = '';
    document.getElementById('section-title-input').value = '';
    if (allCategories.length > 0) document.getElementById('section-category').value = allCategories[0].key;
    document.getElementById('section-modal').classList.remove('hidden');
}
window.closeSectionModal = function() { document.getElementById('section-modal').classList.add('hidden'); }

window.editSection = function(i) {
    const s = customSections[i];
    document.getElementById('section-modal-title').innerText = 'Edit Section';
    document.getElementById('edit-section-idx').value = i;
    document.getElementById('section-title-input').value = s.title;
    document.getElementById('section-category').value = s.categoryKey;
    document.getElementById('section-modal').classList.remove('hidden');
}

window.saveSection = async function() {
    const idx = document.getElementById('edit-section-idx').value;
    const title = document.getElementById('section-title-input').value.trim();
    const categoryKey = document.getElementById('section-category').value;
    if (!title || !categoryKey) return toast("All fields required!", 'error');
    const sec = { title, categoryKey };
    if (idx !== '') customSections[parseInt(idx)] = sec; else customSections.push(sec);
    await setDoc(doc(db, "settings", "main"), { customSections }, { merge: true });
    closeSectionModal(); renderSectionsList(); toast('Saved!');
}

window.deleteSection = async function(i) {
    if (!confirm("Delete?")) return;
    customSections.splice(i, 1);
    await setDoc(doc(db, "settings", "main"), { customSections }, { merge: true });
    renderSectionsList(); toast('Deleted', 'warn');
}

// ============ MIDDLE BANNERS ============
function renderBannersList() {
    const list = document.getElementById('banners-list-admin'); if (!list) return;
    if (middleBanners.length === 0) { list.innerHTML = '<p class="text-center text-gray-400 text-xs py-6">No banners</p>'; return; }
    let html = '';
    middleBanners.forEach((b, i) => {
        html += `<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <img src="${b.image}" class="w-16 h-12 object-contain rounded-lg flex-shrink-0 bg-white">
            <div class="flex-1 min-w-0"><p class="text-[11px] text-gray-500 truncate">${escapeHtml(b.link || 'No link')}</p></div>
            <button onclick="editBanner(${i})" class="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><i class="fas fa-edit text-xs"></i></button>
            <button onclick="deleteBanner(${i})" class="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
        </div>`;
    });
    list.innerHTML = html;
}

window.openBannerModal = function() {
    document.getElementById('banner-modal-title').innerText = 'Add Banner';
    document.getElementById('edit-banner-idx').value = '';
    document.getElementById('banner-link').value = '';
    document.getElementById('banner-image-file').value = '';
    document.getElementById('banner-file-name').innerText = '';
    document.getElementById('banner-image-preview').classList.add('hidden');
    document.getElementById('banner-upload-hint').innerText = 'Upload Banner';
    pendingBannerImage = null;
    document.getElementById('banner-modal').classList.remove('hidden');
}

window.editBanner = function(i) {
    const b = middleBanners[i];
    document.getElementById('banner-modal-title').innerText = 'Edit Banner';
    document.getElementById('edit-banner-idx').value = i;
    document.getElementById('banner-link').value = b.link || '';
    document.getElementById('banner-image-file').value = '';
    document.getElementById('banner-file-name').innerText = '';
    document.getElementById('banner-preview-img').src = b.image;
    document.getElementById('banner-image-preview').classList.remove('hidden');
    document.getElementById('banner-upload-hint').innerText = 'নতুন ছবি দিলে replace হবে';
    pendingBannerImage = null;
    document.getElementById('banner-modal').classList.remove('hidden');
}

window.closeBannerModal = function() { document.getElementById('banner-modal').classList.add('hidden'); }

window.saveBanner = async function() {
    const idx = document.getElementById('edit-banner-idx').value;
    const isEdit = idx !== '';
    if (!isEdit && !pendingBannerImage) return toast("Select an image!", 'error');
    const btn = document.getElementById('banner-save-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
    try {
        let image = isEdit ? middleBanners[parseInt(idx)].image : null;
        if (pendingBannerImage) image = await uploadToImgBB(pendingBannerImage.file);
        const link = document.getElementById('banner-link').value.trim();
        const banner = { image, link };
        if (isEdit) middleBanners[parseInt(idx)] = banner; else middleBanners.push(banner);
        await setDoc(doc(db, "settings", "main"), { middleBanners }, { merge: true });
        closeBannerModal(); renderBannersList(); toast('Saved!');
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i> SAVE'; }
}

window.deleteBanner = async function(i) {
    if (!confirm("Delete?")) return;
    middleBanners.splice(i, 1);
    await setDoc(doc(db, "settings", "main"), { middleBanners }, { merge: true });
    renderBannersList(); toast('Deleted', 'warn');
}

// ============ TESTIMONIALS ============
function renderTestimonialsList() {
    const list = document.getElementById('testimonials-list-admin'); if (!list) return;
    if (testimonials.length === 0) { list.innerHTML = '<p class="text-center text-gray-400 text-xs py-6">No reviews</p>'; return; }
    let html = '';
    testimonials.forEach((t, i) => {
        html += `<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            ${t.image ? `<img src="${t.image}" class="w-10 h-10 rounded-full object-cover flex-shrink-0">` : `<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><i class="fas fa-user text-gray-400"></i></div>`}
            <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-navy">${escapeHtml(t.name)}</p><p class="text-[11px] text-yellow-500">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</p></div>
            <button onclick="editTestimonial(${i})" class="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><i class="fas fa-edit text-xs"></i></button>
            <button onclick="deleteTestimonial(${i})" class="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
        </div>`;
    });
    list.innerHTML = html;
}

window.openTestimonialModal = function() {
    document.getElementById('testimonial-modal-title').innerText = 'Add Review';
    document.getElementById('edit-testimonial-idx').value = '';
    ['test-name','test-role','test-text'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('test-rating').value = '5';
    document.getElementById('test-image-file').value = '';
    document.getElementById('test-file-name').innerText = '';
    document.getElementById('test-image-preview').classList.add('hidden');
    pendingTestImage = null;
    document.getElementById('testimonial-modal').classList.remove('hidden');
}
window.closeTestimonialModal = function() { document.getElementById('testimonial-modal').classList.add('hidden'); }

window.editTestimonial = function(i) {
    const t = testimonials[i];
    document.getElementById('testimonial-modal-title').innerText = 'Edit Review';
    document.getElementById('edit-testimonial-idx').value = i;
    document.getElementById('test-name').value = t.name;
    document.getElementById('test-role').value = t.role || '';
    document.getElementById('test-text').value = t.text;
    document.getElementById('test-rating').value = t.rating;
    pendingTestImage = null;
    document.getElementById('test-image-file').value = '';
    document.getElementById('test-file-name').innerText = '';
    if (t.image) { document.getElementById('test-preview-img').src = t.image; document.getElementById('test-image-preview').classList.remove('hidden'); }
    else document.getElementById('test-image-preview').classList.add('hidden');
    document.getElementById('testimonial-modal').classList.remove('hidden');
}

window.saveTestimonial = async function() {
    const idx = document.getElementById('edit-testimonial-idx').value;
    const name = document.getElementById('test-name').value.trim();
    const role = document.getElementById('test-role').value.trim();
    const text = document.getElementById('test-text').value.trim();
    const rating = parseInt(document.getElementById('test-rating').value);
    if (!name || !text) return toast("Name and Review required!", 'error');
    const btn = document.getElementById('test-save-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
    try {
        let image = null;
        if (pendingTestImage) image = await uploadToImgBB(pendingTestImage.file);
        else if (idx !== '' && testimonials[parseInt(idx)].image) image = testimonials[parseInt(idx)].image;
        const t = { name, role, text, rating, image };
        if (idx !== '') testimonials[parseInt(idx)] = t; else testimonials.push(t);
        await setDoc(doc(db, "settings", "main"), { testimonials }, { merge: true });
        closeTestimonialModal(); renderTestimonialsList(); toast('Saved!');
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i> SAVE'; }
}

window.deleteTestimonial = async function(i) {
    if (!confirm("Delete?")) return;
    testimonials.splice(i, 1);
    await setDoc(doc(db, "settings", "main"), { testimonials }, { merge: true });
    renderTestimonialsList(); toast('Deleted', 'warn');
}

// ============ PRODUCTS ============
async function loadProducts() {
    try {
        const snap = await getDocs(collection(db, "products"));
        allProductsList = [];
        snap.forEach(d => allProductsList.push({ id: d.id, ...d.data() }));
        renderAdminProducts();
    } catch (e) {}
}

// Helper: get categories array from product (backward compatible)
function getProductCategories(p) {
    if (Array.isArray(p.categories) && p.categories.length > 0) return p.categories;
    if (p.category) return [p.category];
    return [];
}

window.renderAdminProducts = function() {
    const list = document.getElementById('product-list-admin'); if (!list) return;
    const search = (document.getElementById('product-search')?.value || '').toLowerCase();
    let filtered = allProductsList;
    if (search) filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(search));
    if (filtered.length === 0) { list.innerHTML = '<div class="bg-white rounded-2xl p-12 text-center premium-shadow"><i class="fas fa-box-open text-4xl text-gray-200 mb-3"></i><p class="text-sm text-gray-500">No products</p></div>'; return; }
    let html = '';
    filtered.forEach(p => {
        const stock = Number(p.stock) || 0;
        const badge = stock <= 0 ? '<span class="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">OUT</span>' :
            (stock < 5 ? `<span class="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">${stock} left</span>` : `<span class="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">${stock} in stock</span>`);
        const cats = getProductCategories(p);
        const catText = cats.length > 0 ? cats.join(', ') : 'Uncategorized';
        html += `<div class="bg-white rounded-2xl p-3 premium-shadow flex items-center gap-3">
            <img src="${p.image || 'https://via.placeholder.com/100x100?text=?'}" class="w-16 h-16 object-contain bg-gray-50 rounded-xl flex-shrink-0" onerror="this.src='https://via.placeholder.com/100x100?text=?'">
            <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-navy truncate">${escapeHtml(p.name)}</p>
                <div class="flex items-center gap-2 mt-1 flex-wrap"><p class="text-[11px] text-gray-500 font-medium truncate">${escapeHtml(catText)}</p>${badge}</div>
                <p class="text-sm font-bold gold-text mt-0.5">৳ ${fmt(p.price)}</p>
            </div>
            <div class="flex flex-col gap-1.5 flex-shrink-0">
                <button onclick="editProduct('${p.id}')" class="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><i class="fas fa-edit text-sm"></i></button>
                <button onclick="deleteProduct('${p.id}')" class="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><i class="fas fa-trash text-sm"></i></button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

window.openAddModal = function() {
    document.getElementById('modal-title').innerText = 'Add Product';
    document.getElementById('edit-product-id').value = '';
    ['p-name','p-price','p-oldprice','p-brand','p-description'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('p-stock').value = '10';
    document.getElementById('p-image-file').value = '';
    pendingImages = []; existing