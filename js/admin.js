// ============================================================
// HEARTIX ADMIN — JS (with Activity Log + Email Notification)
// ============================================================
import { db, auth } from './firebase.js';
import { escapeHtml, formatPrice as fmt } from './common.js';
import { DISTRICTS } from './districts.js';
import { logActivity } from './staff-activity.js';
import { notifyStatusChange } from './email-notify.js';

import {
    collection, getDocs, addDoc, updateDoc, deleteDoc,
    doc, setDoc, getDoc, query, orderBy, increment, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============ CSS INJECTION ============
(function() {
    const css = document.createElement('style');
    css.textContent = `
        summary.order-summary { list-style: none; }
        summary.order-summary::-webkit-details-marker { display: none; }
        summary.order-summary::-moz-list-bullet { list-style: none; }
        details.order-details[open] .order-chevron { transform: rotate(180deg); }
        .order-chevron { transition: transform 0.25s ease; }
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalScaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .del-modal-overlay { animation: modalFadeIn 0.2s ease; }
        .del-modal-card { animation: modalScaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
    `;
    document.head.appendChild(css);
})();

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
let oeHistoryPushed = false;

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
        const staffSnap = await getDoc(doc(db, "staff", uid));
        if (staffSnap.exists()) {
            const d = staffSnap.data();
            if (d.active === true && (d.role === 'owner' || d.role === 'admin')) return true;
        }
    } catch (e) {}
    try {
        const snap = await getDoc(doc(db, "settings", "admins"));
        if (snap.exists()) {
            const uids = snap.data().uids || [];
            return Array.isArray(uids) && uids.includes(uid);
        }
    } catch (e) {}
    return false;
}

function validatePhone(p) { return /^01[3-9]\d{8}$/.test(p); }

// ============ MORE MENU ============
window.openMoreMenu = function() { document.getElementById('more-menu-modal').classList.remove('hidden'); }
window.closeMoreMenu = function() { document.getElementById('more-menu-modal').classList.add('hidden'); }

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
            setTimeout(() => {
                logActivity('login', { description: 'Admin panel-এ login করেছেন' });
            }, 1200);
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
    try { await logActivity('logout', { description: 'Admin panel থেকে logout করেছেন' }); } catch (e) {}
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
    populateOeDistrictDropdown();
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

function populateOeDistrictDropdown() {
    const sel = document.getElementById('oe-edit-district');
    if (!sel) return;
    const cv = sel.value;
    sel.innerHTML = '<option value="">Select District</option>';
    const sorted = [...new Set(DISTRICTS)].sort();
    sorted.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        sel.appendChild(opt);
    });
    if (cv) sel.value = cv;
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

// ============ INLINE CATEGORY ============
window.openInlineCategoryModal = function() {
    document.getElementById('inline-cat-key').value = '';
    document.getElementById('inline-cat-label').value = '';
    document.getElementById('inline-cat-icon').value = '';
    document.getElementById('inline-cat-modal').classList.remove('hidden');
}
window.closeInlineCategoryModal = function() { document.getElementById('inline-cat-modal').classList.add('hidden'); }

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
        populateCategoryCheckboxes();
        const newCb = document.querySelector(`#p-categories-list .cat-checkbox[value="${key}"]`);
        if (newCb) newCb.checked = true;
        populateSectionDropdown();
        renderAdminCategories();
        closeInlineCategoryModal();
        toast('Category যোগ হয়েছে!');
        logActivity('category_add', { description: `নতুন category: "${label}" (${key})`, meta: { key, label } });
    } catch (e) { toast('Error: ' + e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'SAVE'; }
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
                <button onclick="editCoupon('${escapeHtml(c.code)}')" class="py-2.5 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center gap-2 text-xs font-bold"><i class="fas fa-pen"></i> Edit</button>
                <button onclick="deleteCoupon('${escapeHtml(c.code)}')" class="py-2.5 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 text-xs font-bold"><i class="fas fa-trash"></i> Delete</button>
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
        const isEdit = !!existing;
        const data = { description, type, value, minOrder, maxUses, expiry, active, usedCount: existing?.usedCount || 0, updatedAt: new Date().toISOString() };
        if (!existing) data.createdAt = new Date().toISOString();
        await setDoc(doc(db, "coupons", code), data, { merge: true });
        toast('Coupon saved!');
        logActivity(isEdit ? 'coupon_edit' : 'coupon_add', {
            description: `${isEdit ? 'Edit' : 'নতুন'} coupon: "${code}" (${type === 'percentage' ? value + '%' : '৳' + value})`,
            meta: { code, type, value }
        });
        closeCouponModal();
        await loadCoupons();
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i> SAVE COUPON'; }
}

window.deleteCoupon = async function(code) {
    if (!confirm(`"${code}" coupon ডিলিট করবেন?`)) return;
    try {
        await deleteDoc(doc(db, "coupons", code));
        toast('Coupon deleted', 'warn');
        logActivity('coupon_delete', { description: `Coupon delete: "${code}"`, meta: { code } });
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
        logActivity('settings_update', { description: `Hero banner ${idx !== '' ? 'update' : 'যোগ'} করা হয়েছে`, meta: { idx } });
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i> SAVE'; }
}

window.deleteHeroBanner = async function(i) {
    if (!confirm("Delete?")) return;
    heroBanners.splice(i, 1);
    await setDoc(doc(db, "settings", "main"), { heroBanners }, { merge: true });
    renderHeroBannersList(); toast('Deleted', 'warn');
    logActivity('settings_update', { description: 'Hero banner delete করা হয়েছে' });
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
        const isEdit = !!oldKey;
        if (oldKey) { const idx = allCategories.findIndex(c => c.key === oldKey); if (idx > -1) allCategories[idx] = newCategory; }
        else allCategories.push(newCategory);
        await setDoc(doc(db, "settings", "main"), { categories: allCategories }, { merge: true });
        if (oldKey && oldKey !== key) {
            const updated = await updateProductsCategory(oldKey, key);
            toast(`Saved! ${updated} products updated.`);
        } else toast('Saved!');
        logActivity(isEdit ? 'category_edit' : 'category_add', {
            description: `${isEdit ? 'Edit' : 'নতুন'} category: "${label}"`,
            meta: { key, label }
        });
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
    if (productCount > 0) msg = `⚠️ "${cat.label}" ক্যাটেগরিতে ${productCount} টি প্রোডাক্ট আছে।\n\nডিলিট করলে ওই প্রোডাক্ট থেকে এটা সরিয়ে দেওয়া হবে।\n\nডিলিট করবেন?`;
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
                if (data.category === cat.key && (!data.categories || data.categories.length === 0)) update.category = '';
                if (changed) batch.update(d.ref, update);
            });
            await batch.commit();
        } catch (e) { console.warn('Bulk update failed:', e); }
    }
    renderAdminCategories(); populateSectionDropdown(); populateCategoryCheckboxes(); await loadProducts();
    toast('Deleted', 'warn');
    logActivity('category_delete', { description: `Category delete: "${cat.label}"`, meta: { key: cat.key } });
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
    logActivity('settings_update', { description: `Section ${idx !== '' ? 'update' : 'যোগ'}: "${title}"` });
}

window.deleteSection = async function(i) {
    if (!confirm("Delete?")) return;
    customSections.splice(i, 1);
    await setDoc(doc(db, "settings", "main"), { customSections }, { merge: true });
    renderSectionsList(); toast('Deleted', 'warn');
    logActivity('settings_update', { description: 'Section delete করা হয়েছে' });
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
        logActivity('settings_update', { description: `Middle banner ${isEdit ? 'update' : 'যোগ'} করা হয়েছে` });
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i> SAVE'; }
}

window.deleteBanner = async function(i) {
    if (!confirm("Delete?")) return;
    middleBanners.splice(i, 1);
    await setDoc(doc(db, "settings", "main"), { middleBanners }, { merge: true });
    renderBannersList(); toast('Deleted', 'warn');
    logActivity('settings_update', { description: 'Middle banner delete করা হয়েছে' });
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
        logActivity('settings_update', { description: `Testimonial ${idx !== '' ? 'update' : 'যোগ'}: "${name}"` });
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i> SAVE'; }
}

window.deleteTestimonial = async function(i) {
    if (!confirm("Delete?")) return;
    testimonials.splice(i, 1);
    await setDoc(doc(db, "settings", "main"), { testimonials }, { merge: true });
    renderTestimonialsList(); toast('Deleted', 'warn');
    logActivity('settings_update', { description: 'Testimonial delete করা হয়েছে' });
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
        let badges = badge;
        if (p.featured === true) badges += ' <span class="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"><i class="fas fa-star text-[8px] mr-0.5"></i>Featured</span>';
        if (p.pinned === true) badges += ' <span class="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"><i class="fas fa-thumbtack text-[8px] mr-0.5"></i>Pinned</span>';
        const cats = getProductCategories(p);
        const catText = cats.length > 0 ? cats.join(', ') : 'Uncategorized';
        html += `<div class="bg-white rounded-2xl p-3 premium-shadow flex items-center gap-3">
            <img src="${p.image || 'https://via.placeholder.com/100x100?text=?'}" class="w-16 h-16 object-contain bg-gray-50 rounded-xl flex-shrink-0" onerror="this.src='https://via.placeholder.com/100x100?text=?'">
            <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-navy truncate">${escapeHtml(p.name)}</p>
                <div class="flex items-center gap-2 mt-1 flex-wrap"><p class="text-[11px] text-gray-500 font-medium truncate">${escapeHtml(catText)}</p></div>
                <div class="flex items-center gap-1 mt-1 flex-wrap">${badges}</div>
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
    document.getElementById('p-featured').checked = false;
    document.getElementById('p-pinned').checked = false;
    pendingImages = []; existingImages = [];
    populateCategoryCheckboxes();
    renderImagePreview();
    document.getElementById('product-modal').classList.remove('hidden');
}
window.closeModal = function() { document.getElementById('product-modal').classList.add('hidden'); }

window.editProduct = function(id) {
    const p = allProductsList.find(x => x.id === id); if (!p) return;
    document.getElementById('modal-title').innerText = 'Edit Product';
    document.getElementById('edit-product-id').value = id;
    document.getElementById('p-name').value = p.name || '';
    document.getElementById('p-price').value = p.price || '';
    document.getElementById('p-oldprice').value = p.oldPrice || '';
    document.getElementById('p-stock').value = p.stock || 0;
    document.getElementById('p-brand').value = p.brand || '';
    document.getElementById('p-description').value = p.description || '';
    document.getElementById('p-featured').checked = p.featured === true;
    document.getElementById('p-pinned').checked = p.pinned === true;
    pendingImages = [];
    const imgs = Array.isArray(p.images) ? p.images.filter(u => typeof u === 'string' && u.length > 0) : [];
    if (imgs.length > 0) existingImages = [...imgs];
    else if (p.image && typeof p.image === 'string') existingImages = [p.image];
    else existingImages = [];
    populateCategoryCheckboxes();
    const productCats = getProductCategories(p);
    document.querySelectorAll('#p-categories-list .cat-checkbox').forEach(cb => { cb.checked = productCats.includes(cb.value); });
    renderImagePreview();
    document.getElementById('product-modal').classList.remove('hidden');
}

function renderImagePreview() {
    const grid = document.getElementById('image-preview-grid');
    let html = '';
    existingImages.forEach((url, i) => {
        html += `<div class="img-thumb"><img src="${url}" class="w-full h-16 object-contain bg-gray-50 rounded-lg border-2 ${i === 0 && pendingImages.length === 0 ? 'border-gold' : 'border-gray-200'}"><button onclick="removeExistingImage(${i})" class="remove-btn">×</button></div>`;
    });
    pendingImages.forEach((item, i) => {
        const isMain = existingImages.length === 0 && i === 0;
        html += `<div class="img-thumb"><img src="${item.dataUrl}" class="w-full h-16 object-contain bg-gray-50 rounded-lg border-2 ${isMain ? 'border-gold' : 'border-gray-200'}"><button onclick="removePendingImage(${i})" class="remove-btn">×</button></div>`;
    });
    grid.innerHTML = html;
}
window.removeExistingImage = function(i) { existingImages.splice(i, 1); renderImagePreview(); }
window.removePendingImage = function(i) { pendingImages.splice(i, 1); renderImagePreview(); }

document.getElementById('p-image-file')?.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    if (existingImages.length + pendingImages.length + files.length > 5) return toast("Max 5 images!", 'error');
    files.forEach(file => {
        const r = new FileReader();
        r.onload = evt => { pendingImages.push({ file, dataUrl: evt.target.result }); renderImagePreview(); };
        r.readAsDataURL(file);
    });
    e.target.value = '';
});

window.saveProduct = async function() {
    const id = document.getElementById('edit-product-id').value;
    const name = document.getElementById('p-name').value.trim();
    const priceRaw = document.getElementById('p-price').value;
    const oldPriceRaw = document.getElementById('p-oldprice').value;
    const stockRaw = document.getElementById('p-stock').value;
    const brand = document.getElementById('p-brand').value.trim();
    const description = document.getElementById('p-description').value.trim();
    const featured = document.getElementById('p-featured').checked;
    const pinned = document.getElementById('p-pinned').checked;
    const price = parseFloat(priceRaw);
    const oldPrice = oldPriceRaw ? parseFloat(oldPriceRaw) : 0;
    const stock = stockRaw ? parseInt(stockRaw) : 0;
    const categories = Array.from(document.querySelectorAll('#p-categories-list .cat-checkbox:checked')).map(cb => cb.value);

    if (!name || name.length < 2) return toast("সঠিক নাম দিন", 'error');
    if (!priceRaw || isNaN(price) || price < 0) return toast("সঠিক দাম দিন", 'error');
    if (price > 10000000) return toast("দাম অনেক বেশি", 'error');
    if (oldPriceRaw && (isNaN(oldPrice) || oldPrice < 0)) return toast("Old price সঠিক নয়", 'error');
    if (oldPrice > 0 && oldPrice < price) return toast("Old price, price এর চেয়ে কম হতে পারে না", 'error');
    if (isNaN(stock) || stock < 0) return toast("Stock সঠিক নয়", 'error');
    if (categories.length === 0) return toast("কমপক্ষে একটা category সিলেক্ট করুন", 'error');
    if (existingImages.length === 0 && pendingImages.length === 0) return toast("কমপক্ষে একটা image দিন", 'error');

    const btn = document.getElementById('save-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Uploading...';
    try {
        const newUrls = [];
        for (let i = 0; i < pendingImages.length; i++) {
            btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Uploading ${i + 1}/${pendingImages.length}...`;
            newUrls.push(await uploadToImgBB(pendingImages[i].file));
        }
        const allImages = [...existingImages, ...newUrls].filter(u => typeof u === 'string' && u.length > 0);
        if (allImages.length === 0) throw new Error('No valid images');
        const data = { name, price, oldPrice, category: categories[0], categories, stock, brand, description, featured, pinned, image: allImages[0], images: allImages };
        const isEdit = !!id;
        if (id) {
            const existing = allProductsList.find(x => x.id === id);
            if (existing && typeof existing.sortOrder === 'number') data.sortOrder = existing.sortOrder;
            await updateDoc(doc(db, "products", id), data);
        } else {
            try {
                const snap = await getDocs(collection(db, "products"));
                let maxOrder = -1;
                snap.forEach(d => {
                    const pd = d.data();
                    const cats = Array.isArray(pd.categories) ? pd.categories : (pd.category ? [pd.category] : []);
                    if (cats.includes(categories[0])) {
                        const so = Number(pd.sortOrder);
                        if (!isNaN(so) && so > maxOrder) maxOrder = so;
                    }
                });
                data.sortOrder = maxOrder + 1;
            } catch (e) { data.sortOrder = 0; }
            await addDoc(collection(db, "products"), data);
        }
        toast('Saved!'); closeModal(); await loadProducts(); updateStats();
        logActivity(isEdit ? 'product_edit' : 'product_add', {
            description: `${isEdit ? 'Edit' : 'নতুন'} product: "${name}" (৳${price})`,
            meta: { productId: id || 'new', name, price }
        });
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i> SAVE PRODUCT'; }
}

window.deleteProduct = async function(id) {
    const p = allProductsList.find(x => x.id === id);
    if (!confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
    await loadProducts(); updateStats(); toast('Deleted', 'warn');
    logActivity('product_delete', {
        description: `Product delete: "${p?.name || id}"`,
        meta: { productId: id, name: p?.name || '' }
    });
}

// ============ ORDERS ============
async function loadOrders() {
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        allOrdersList = [];
        snap.forEach(d => allOrdersList.push({ id: d.id, ...d.data() }));
        renderAdminOrders(); renderRecentOrders(); updateOrderBadge();
    } catch (e) {}
}

function updateOrderBadge() {
    const pending = allOrdersList.filter(o => o.status === 'pending').length;
    const b1 = document.getElementById('orders-badge'), b2 = document.getElementById('orders-badge-mob');
    if (pending > 0) {
        if (b1) { b1.textContent = pending; b1.classList.remove('hidden'); }
        if (b2) { b2.textContent = pending; b2.classList.remove('hidden'); }
    } else {
        if (b1) b1.classList.add('hidden');
        if (b2) b2.classList.add('hidden');
    }
}

window.filterOrders = function(filter, btn) {
    currentOrderFilter = filter;
    document.querySelectorAll('.order-filter-btn').forEach(b => {
        b.classList.remove('bg-navy', 'text-white'); b.classList.add('bg-white', 'text-gray-600');
    });
    btn.classList.add('bg-navy', 'text-white'); btn.classList.remove('bg-white', 'text-gray-600');
    renderAdminOrders();
}

window.exportOrdersCSV = function() {
    if (allOrdersList.length === 0) return toast('কোনো order নেই', 'warn');
    let csv = 'Order Number,Date,Customer,Phone,District,Thana,Items,Subtotal,Delivery,Total,Paid,Due,Status,Payment,Repeat,CustomerOrders,IP,Flagged\n';
    allOrdersList.forEach(o => {
        const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString('en-GB') : '';
        const items = (o.items || []).map(i => `${i.name} x${i.quantity}`).join(' | ');
        const c = o.customer || {};
        const row = [o.orderNumber || o.id, date, c.name || '', c.phone || '', c.district || '', c.thana || '', items, o.subtotal || 0, o.deliveryCharge || 0, o.total || 0, o.advancePaid || 0, o.dueAmount || 0, o.status || 'pending', o.paymentMethod || '', c.isRepeat ? 'Yes' : 'No', c.orderCount || 1, c.ipAddress || '', c.flagged ? 'SameIP' : ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        csv += row + '\n';
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heartix-orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV downloaded!');
}

function renderAdminOrders() {
    const list = document.getElementById('order-list-admin'); if (!list) return;
    const search = (document.getElementById('order-search')?.value || '').toLowerCase().trim();
    let filtered = allOrdersList;
    if (currentOrderFilter !== 'all') filtered = filtered.filter(o => o.status === currentOrderFilter);
    if (search) {
        filtered = filtered.filter(o =>
            (o.orderNumber || '').toLowerCase().includes(search) ||
            (o.customer?.name || '').toLowerCase().includes(search) ||
            (o.customer?.phone || '').toLowerCase().includes(search)
        );
    }
    if (filtered.length === 0) {
        list.innerHTML = '<div class="bg-white rounded-2xl p-12 text-center premium-shadow"><i class="fas fa-receipt text-4xl text-gray-200 mb-3"></i><p class="text-sm text-gray-500">No orders</p></div>';
        return;
    }
    let html = '';
    filtered.forEach(o => {
        const itemsCount = (o.items || []).reduce((s, i) => s + (Number(i.quantity) || 1), 0);
        const statusClass = 'status-' + (o.status || 'pending');
        const orderDate = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';
        const statusMeta = { pending: { icon: 'hourglass-half', label: 'Pending' }, confirmed: { icon: 'circle-check', label: 'Confirmed' }, shipped: { icon: 'truck-fast', label: 'Shipped' }, delivered: { icon: 'box-open', label: 'Delivered' }, cancelled: { icon: 'circle-xmark', label: 'Cancelled' } };
        const current = statusMeta[o.status] || statusMeta.pending;
        let badges = '';
        if (o.customer?.isRepeat) badges += `<span class="inline-flex items-center gap-1 text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full"><i class="fas fa-repeat text-[8px]"></i> Repeat (${o.customer.orderCount || '?'})</span>`;
        else badges += `<span class="inline-flex items-center gap-1 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full"><i class="fas fa-star text-[8px]"></i> New</span>`;
        if (o.customer?.flagged) badges += `<span class="inline-flex items-center gap-1 text-[9px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full"><i class="fas fa-exclamation-triangle text-[8px]"></i> Same IP</span>`;
        const fullAddress = [o.customer?.address, o.customer?.thana, o.customer?.district].filter(Boolean).join(', ');
        html += `
        <details class="order-details bg-white rounded-2xl premium-shadow border-l-4 border-gold overflow-hidden">
            <summary class="order-summary p-3.5 cursor-pointer select-none active:bg-gray-50 transition-colors">
                <div class="flex justify-between items-start gap-2 mb-1.5">
                    <p class="font-bold text-navy text-sm flex-1 min-w-0 truncate">${escapeHtml(o.orderNumber || o.id.slice(0,8))}</p>
                    <span class="order-status ${statusClass} flex-shrink-0">${o.status || 'pending'}</span>
                </div>
                <div class="flex items-center justify-between gap-2 text-[11px] text-gray-500 mb-1.5">
                    <span class="truncate min-w-0">${escapeHtml(o.customer?.name || '')}${o.customer?.phone ? ' • ' + escapeHtml(o.customer.phone) : ''}</span>
                    <span class="flex-shrink-0">${orderDate}</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                    <div class="flex gap-1 flex-wrap min-w-0">${badges}</div>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                        <span class="text-[10px] text-gray-400">${itemsCount} item${itemsCount !== 1 ? 's' : ''}</span>
                        <span class="text-[10px] text-gray-300">•</span>
                        <span class="font-bold text-navy text-sm">৳${fmt(o.total)}</span>
                        <i class="fas fa-chevron-down order-chevron text-gray-400 text-[10px] ml-0.5"></i>
                    </div>
                </div>
            </summary>
            <div class="px-3.5 pb-3.5 pt-3 border-t border-gray-100 space-y-3">
                ${fullAddress ? `<div class="flex items-start gap-2 text-xs text-gray-600"><i class="fas fa-map-marker-alt text-gray-400 mt-0.5 flex-shrink-0"></i><span class="leading-relaxed">${escapeHtml(fullAddress)}</span></div>` : ''}
                <div class="bg-gray-50 rounded-xl p-2.5 space-y-2">
                    ${(o.items || []).map(item => `<div class="flex items-center gap-2.5"><img src="${item.image || 'https://via.placeholder.com/48x48?text=?'}" class="w-11 h-11 object-contain bg-white rounded-lg flex-shrink-0 border border-gray-100" onerror="this.src='https://via.placeholder.com/48x48?text=?'"><div class="flex-1 min-w-0"><p class="text-xs font-semibold text-navy line-clamp-1">${escapeHtml(item.name)}</p><p class="text-[10px] text-gray-500">৳${fmt(item.price)} × ${item.quantity}</p></div><p class="text-xs font-bold text-navy flex-shrink-0">৳${fmt((item.price || 0) * (item.quantity || 1))}</p></div>`).join('')}
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <div class="bg-gray-50 rounded-xl p-2.5 text-center"><p class="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Total</p><p class="text-sm font-bold text-navy mt-0.5">৳${fmt(o.total)}</p></div>
                    <div class="bg-green-50 rounded-xl p-2.5 text-center"><p class="text-[9px] text-green-700 font-bold uppercase tracking-wider">Paid</p><p class="text-sm font-bold text-green-700 mt-0.5">৳${fmt(o.advancePaid)}</p></div>
                    <div class="bg-red-50 rounded-xl p-2.5 text-center"><p class="text-[9px] text-red-700 font-bold uppercase tracking-wider">Due</p><p class="text-sm font-bold text-red-700 mt-0.5">৳${fmt(o.dueAmount)}</p></div>
                </div>
                ${o.discount > 0 ? `<p class="text-[11px] text-amber-600 bg-amber-50 rounded-lg p-2"><i class="fas fa-tag mr-1"></i>Discount: ৳${fmt(o.discount)}${o.couponCode ? ` (${escapeHtml(o.couponCode)})` : ''}</p>` : ''}
                ${o.adminNote ? `<p class="text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2"><i class="fas fa-sticky-note mr-1"></i>${escapeHtml(o.adminNote)}</p>` : ''}
                <div class="space-y-2">
                    <button onclick="openOrderEdit('${o.id}')" class="w-full bg-navy text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"><i class="fas fa-pen"></i> EDIT ORDER</button>
                    <button onclick="openStatusPicker('${o.id}')" class="w-full border-2 border-gray-100 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between hover:border-gold transition"><span class="flex items-center gap-2 text-gray-700"><i class="fas fa-${current.icon}"></i> ${current.label}</span><span class="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Change <i class="fas fa-chevron-down ml-1"></i></span></button>
                    <div class="grid grid-cols-2 gap-2">
                        <a href="tel:${escapeHtml(o.customer?.phone || '')}" class="py-2.5 bg-green-50 text-green-700 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold" onclick="event.stopPropagation()"><i class="fas fa-phone text-[11px]"></i> Call</a>
                        <a href="https://wa.me/88${(o.customer?.phone || '').replace(/^0/, '')}?text=${encodeURIComponent('Order ' + (o.orderNumber || '') + ' — Heartix')}" target="_blank" rel="noopener" class="py-2.5 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold" onclick="event.stopPropagation()"><i class="fab fa-whatsapp text-[11px]"></i> WhatsApp</a>
                    </div>
                </div>
            </div>
        </details>`;
    });
    list.innerHTML = html;
}

// ============ ORDER EDIT ============
window.openOrderEdit = function(id) {
    const o = allOrdersList.find(x => x.id === id); if (!o) return;
    editingOrderId = id;
    editingOrderItems = JSON.parse(JSON.stringify(o.items || []));
    document.getElementById('oe-order-num').textContent = o.orderNumber || id.slice(0, 10);
    const c = o.customer || {};
    document.getElementById('oe-edit-name').value = c.name || '';
    document.getElementById('oe-edit-phone').value = c.phone || '';
    document.getElementById('oe-edit-address').value = c.address || '';
    populateOeDistrictDropdown();
    document.getElementById('oe-edit-district').value = c.district || '';
    document.getElementById('oe-edit-thana').value = c.thana || '';
    document.getElementById('oe-orig-discount').textContent = 'Orig: ৳' + fmt(o.discount || 0);
    document.getElementById('oe-orig-delivery').textContent = 'Orig: ৳' + fmt(o.deliveryCharge || 0);
    document.getElementById('oe-orig-advance').textContent = 'Orig: ৳' + fmt(o.advancePaid || 0);
    document.getElementById('oe-discount').value = o.discount || 0;
    document.getElementById('oe-delivery').value = o.deliveryCharge || 0;
    document.getElementById('oe-advance').value = o.advancePaid || 0;
    document.getElementById('oe-note').value = o.adminNote || '';
    renderOrderEditItems();
    recalcOrderEdit();
    document.getElementById('order-edit-modal').classList.remove('hidden');
    if (!oeHistoryPushed) {
        try { history.pushState({ oeModal: true }, '', location.href); oeHistoryPushed = true; } catch (e) {}
    }
}

window.closeOrderEdit = function() {
    document.getElementById('order-edit-modal').classList.add('hidden');
    editingOrderId = null;
    editingOrderItems = [];
    if (oeHistoryPushed) {
        oeHistoryPushed = false;
        try { history.back(); } catch (e) {}
    }
}

window.addEventListener('popstate', function() {
    const m = document.getElementById('order-edit-modal');
    if (m && !m.classList.contains('hidden')) {
        m.classList.add('hidden');
        editingOrderId = null;
        editingOrderItems = [];
        oeHistoryPushed = false;
        try { history.pushState({ oeModal: true }, '', location.href); oeHistoryPushed = true; } catch (e) {}
    }
});

function renderOrderEditItems() {
    const wrap = document.getElementById('oe-items-list');
    if (editingOrderItems.length === 0) { wrap.innerHTML = '<p class="text-xs text-gray-400 text-center py-3">No items — Add Item</p>'; return; }
    let html = '';
    editingOrderItems.forEach((it, i) => {
        html += `<div class="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-100">
            <img src="${it.image || 'https://via.placeholder.com/32x32?text=?'}" class="w-8 h-8 object-contain bg-gray-50 rounded flex-shrink-0" onerror="this.src='https://via.placeholder.com/32x32?text=?'">
            <div class="flex-1 min-w-0">
                <p class="text-[11px] font-semibold text-navy truncate">${escapeHtml(it.name)}</p>
                <p class="text-[9px] text-gray-500">৳${fmt(it.price)} ×</p>
            </div>
            <div class="flex items-center gap-0.5 bg-gray-50 rounded-md">
                <button onclick="changeItemQty(${i}, -1)" class="w-7 h-7 flex items-center justify-center text-navy font-bold text-sm">−</button>
                <span class="w-5 text-center text-[11px] font-bold">${it.quantity}</span>
                <button onclick="changeItemQty(${i}, 1)" class="w-7 h-7 flex items-center justify-center text-navy font-bold text-sm">+</button>
            </div>
            <button onclick="removeEditItem(${i})" class="w-7 h-7 bg-red-50 text-red-500 rounded-md flex items-center justify-center flex-shrink-0"><i class="fas fa-times text-[10px]"></i></button>
        </div>`;
    });
    wrap.innerHTML = html;
}

window.changeItemQty = function(i, delta) {
    if (!editingOrderItems[i]) return;
    const newQty = (editingOrderItems[i].quantity || 1) + delta;
    if (newQty <= 0) { editingOrderItems.splice(i, 1); }
    else editingOrderItems[i].quantity = newQty;
    renderOrderEditItems(); recalcOrderEdit();
}

window.removeEditItem = function(i) { editingOrderItems.splice(i, 1); renderOrderEditItems(); recalcOrderEdit(); }

window.recalcOrderEdit = function() {
    const subtotal = editingOrderItems.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
    const discount = parseFloat(document.getElementById('oe-discount').value) || 0;
    const delivery = parseFloat(document.getElementById('oe-delivery').value) || 0;
    const advance = parseFloat(document.getElementById('oe-advance').value) || 0;
    const total = Math.max(0, subtotal - discount + delivery);
    const due = Math.max(0, total - advance);
    document.getElementById('oe-subtotal').textContent = '৳' + fmt(subtotal);
    document.getElementById('oe-discount-display').textContent = '-৳' + fmt(discount);
    document.getElementById('oe-delivery-display').textContent = '৳' + fmt(delivery);
    document.getElementById('oe-total').textContent = '৳' + fmt(total);
    document.getElementById('oe-advance-display').textContent = '৳' + fmt(advance);
    document.getElementById('oe-due').textContent = '৳' + fmt(due);
};

['oe-discount', 'oe-delivery', 'oe-advance'].forEach(id => {
    document.addEventListener('input', function(e) {
        if (e.target && e.target.id === id) window.recalcOrderEdit();
    });
});

window.saveOrderEdit = async function() {
    if (!editingOrderId) return;
    if (editingOrderItems.length === 0) return toast('কমপক্ষে একটা item থাকতে হবে!', 'error');
    const order = allOrdersList.find(x => x.id === editingOrderId);
    if (!order) return;

    const newName = (document.getElementById('oe-edit-name').value || '').trim();
    const newPhone = (document.getElementById('oe-edit-phone').value || '').trim();
    const newAddress = (document.getElementById('oe-edit-address').value || '').trim();
    const newDistrict = document.getElementById('oe-edit-district').value || '';
    const newThana = (document.getElementById('oe-edit-thana').value || '').trim();

    if (!newName || newName.length < 2) return toast('সঠিক নাম দিন', 'error');
    if (!validatePhone(newPhone)) return toast('সঠিক ফোন নাম্বার দিন', 'error');

    const discount = parseFloat(document.getElementById('oe-discount').value) || 0;
    const delivery = parseFloat(document.getElementById('oe-delivery').value) || 0;
    const advance = parseFloat(document.getElementById('oe-advance').value) || 0;
    const adminNote = document.getElementById('oe-note').value.trim();
    const subtotal = editingOrderItems.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
    const total = Math.max(0, subtotal - discount + delivery);
    const dueAmount = Math.max(0, total - advance);
    const shouldAdjustStock = order.status !== 'cancelled' && order.stockDeducted !== false;
    const productDeltas = {};
    (order.items || []).forEach(it => { if (!it.id) return; productDeltas[it.id] = (productDeltas[it.id] || 0) - (Number(it.quantity) || 0); });
    editingOrderItems.forEach(it => { if (!it.id) return; productDeltas[it.id] = (productDeltas[it.id] || 0) + (Number(it.quantity) || 0); });

    const btn = document.getElementById('oe-save-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';

    try {
        if (shouldAdjustStock) {
            for (const [pid, delta] of Object.entries(productDeltas)) {
                if (delta === 0) continue;
                try { await updateDoc(doc(db, "products", pid), { stock: increment(-delta) }); }
                catch (e) { console.warn('Stock adjust failed:', pid, e); }
            }
        }
        const updatedCustomer = { ...(order.customer || {}), name: newName, phone: newPhone, address: newAddress, district: newDistrict, thana: newThana };
        await updateDoc(doc(db, "orders", editingOrderId), {
            items: editingOrderItems,
            customer: updatedCustomer,
            subtotal, discount,
            deliveryCharge: delivery,
            total, advancePaid: advance,
            dueAmount, adminNote
        });
        toast('Order updated!');
        logActivity('order_edit', {
            description: `Order ${order.orderNumber || editingOrderId.slice(0,8)} edit করা হয়েছে (total ৳${fmt(total)})`,
            meta: { orderId: editingOrderId, total }
        });
        closeOrderEdit();
        await loadOrders();
        await loadProducts();
        updateStats();
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-1"></i> Save Changes'; }
}

// ============ CUSTOM DELETE MODAL ============
window.confirmDeleteOrder = function() {
    if (!editingOrderId) return;
    const order = allOrdersList.find(x => x.id === editingOrderId);
    if (!order) return;
    const status = order.status || 'pending';
    const itemsCount = (order.items || []).length;
    const stockDeducted = order.stockDeducted !== false;
    let shouldRestore = false;
    let infoType = 'green';
    let infoTitle = '';
    let infoDesc = '';
    let infoIcon = '';
    if (status === 'pending' || status === 'confirmed' || status === 'shipped') {
        if (stockDeducted) {
            shouldRestore = true; infoType = 'green'; infoIcon = 'check';
            infoTitle = 'Stock ফেরত যাবে';
            infoDesc = `${itemsCount}টি প্রোডাক্টের stock automatic restore হবে (order ডেলিভারি হয়নি)`;
        } else {
            infoType = 'gray'; infoIcon = 'info-circle';
            infoTitle = 'Stock আগেই ফেরত';
            infoDesc = 'এখন কোনো stock restore হবে না';
        }
    } else if (status === 'delivered') {
        infoType = 'red'; infoIcon = 'times';
        infoTitle = 'Stock restore হবে না';
        infoDesc = 'Customer already product পেয়েছে, তাই stock কম থাকবে';
    } else if (status === 'cancelled') {
        infoType = 'red'; infoIcon = 'times';
        infoTitle = 'Stock restore হবে না';
        infoDesc = 'Cancel করার সময় already stock ফেরত গেছে';
    }
    const colorMap = {
        green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'bg-green-500', text: 'text-green-700', desc: 'text-green-600' },
        red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-500', text: 'text-red-700', desc: 'text-red-600' },
        gray: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'bg-gray-500', text: 'text-gray-700', desc: 'text-gray-600' }
    };
    const c = colorMap[infoType];
    const statusBadgeClass = 'status-' + status;
    const existing = document.getElementById('delete-order-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'delete-order-modal';
    modal.className = 'fixed inset-0 modal-bg z-[90] flex items-center justify-center p-4 del-modal-overlay';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl del-modal-card">
            <div class="navy-gradient p-6 text-center relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16"></div>
                <div class="absolute bottom-0 left-0 w-24 h-24 bg-red-500/10 rounded-full -ml-12 -mb-12"></div>
                <div class="relative">
                    <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40">
                        <i class="fas fa-trash-alt text-white text-2xl"></i>
                    </div>
                    <h3 class="font-display text-xl text-white font-bold">Delete Order?</h3>
                    <p class="text-gold text-xs font-mono tracking-wider mt-1.5">${escapeHtml(order.orderNumber || order.id.slice(0, 10))}</p>
                </div>
            </div>
            <div class="p-5 space-y-4">
                <div class="flex justify-center"><span class="order-status ${statusBadgeClass} !text-xs">${escapeHtml(status)}</span></div>
                <div class="${c.bg} border ${c.border} rounded-2xl p-4">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0 shadow-sm"><i class="fas fa-${infoIcon} text-white text-sm"></i></div>
                        <div class="flex-1 min-w-0"><p class="font-bold ${c.text} text-sm">${infoTitle}</p><p class="text-xs ${c.desc} mt-1 leading-relaxed">${infoDesc}</p></div>
                    </div>
                </div>
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p class="text-[11px] text-amber-800 leading-relaxed flex items-start gap-2">
                        <i class="fas fa-exclamation-triangle text-amber-600 mt-0.5 flex-shrink-0"></i>
                        <span><strong>Permanent action।</strong> Order record সম্পূর্ণ মুছে যাবে — পরে ফিরিয়ে আনা যাবে না।</span>
                    </p>
                </div>
                <div class="grid grid-cols-2 gap-3 pt-1">
                    <button onclick="closeDeleteModal()" class="py-3.5 bg-gray-100 active:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm"><i class="fas fa-times mr-1"></i> বাতিল</button>
                    <button onclick="executeDelete(${shouldRestore})" id="del-confirm-btn" class="bg-gradient-to-br from-red-500 to-red-600 active:from-red-700 active:to-red-800 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-red-500/30"><i class="fas fa-trash-alt mr-1"></i> Delete</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

window.closeDeleteModal = function() {
    const m = document.getElementById('delete-order-modal');
    if (m) { m.style.opacity = '0'; m.style.transition = 'opacity 0.15s'; setTimeout(() => m.remove(), 150); }
}

window.executeDelete = async function(shouldRestore) {
    if (!editingOrderId) return;
    const order = allOrdersList.find(x => x.id === editingOrderId);
    if (!order) { closeDeleteModal(); return; }
    const btn = document.getElementById('del-confirm-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Deleting...';
        btn.classList.add('opacity-80');
    }
    try {
        if (shouldRestore) {
            for (const item of (order.items || [])) {
                if (!item.id) continue;
                try { await updateDoc(doc(db, "products", item.id), { stock: increment(Number(item.quantity) || 1) }); }
                catch (e) { console.warn('Stock restore failed:', item.id, e); }
            }
        }
        await deleteDoc(doc(db, "orders", editingOrderId));
        toast(shouldRestore ? 'Order deleted + Stock restored ✅' : 'Order deleted', shouldRestore ? 'success' : 'warn');
        logActivity('order_delete', {
            description: `Order delete: ${order.orderNumber || editingOrderId.slice(0,8)} (৳${fmt(order.total)})${shouldRestore ? ' — stock restored' : ''}`,
            meta: { orderId: editingOrderId, restore: shouldRestore }
        });
        closeDeleteModal();
        closeOrderEdit();
        await loadOrders();
        await loadProducts();
        updateStats();
    } catch (e) {
        toast("Error: " + e.message, 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-trash-alt mr-1"></i> Delete';
            btn.classList.remove('opacity-80');
        }
    }
}

window.openProductPicker = function() {
    document.getElementById('picker-search').value = '';
    renderPickerProducts();
    document.getElementById('product-picker-modal').classList.remove('hidden');
}
window.closeProductPicker = function() { document.getElementById('product-picker-modal').classList.add('hidden'); }

window.renderPickerProducts = function() {
    const q = (document.getElementById('picker-search').value || '').toLowerCase();
    const list = document.getElementById('picker-list');
    let products = allProductsList;
    if (q) products = products.filter(p => (p.name || '').toLowerCase().includes(q));
    if (products.length === 0) { list.innerHTML = '<p class="text-center text-gray-400 text-xs py-6">No products</p>'; return; }
    let html = '';
    products.forEach(p => {
        const stock = Number(p.stock) || 0;
        const outOfStock = stock <= 0;
        html += `<div ${outOfStock ? '' : `onclick="addItemToOrder('${p.id}')"`} class="flex items-center gap-3 p-3 rounded-xl cursor-pointer ${outOfStock ? 'bg-red-50 opacity-60 cursor-not-allowed' : 'bg-gray-50 active:bg-gray-100'}"><img src="${p.image || 'https://via.placeholder.com/50x50?text=?'}" class="w-12 h-12 object-contain bg-white rounded-lg flex-shrink-0" onerror="this.src='https://via.placeholder.com/50x50?text=?'"><div class="flex-1 min-w-0"><p class="text-xs font-semibold text-navy truncate">${escapeHtml(p.name)}</p><p class="text-[11px] text-gold font-bold">৳${fmt(p.price)} ${outOfStock ? '<span class="text-red-500 ml-1">• OUT OF STOCK</span>' : `• Stock: ${stock}`}</p></div><i class="fas fa-${outOfStock ? 'ban text-red-500' : 'plus-circle text-gold'} text-lg"></i></div>`;
    });
    list.innerHTML = html;
}

window.addItemToOrder = function(pid) {
    const p = allProductsList.find(x => x.id === pid); if (!p) return;
    const stock = Number(p.stock) || 0;
    if (stock <= 0) return toast('এই product স্টকে নেই!', 'error');
    const existing = editingOrderItems.find(i => i.id === pid);
    const currentQty = existing ? (existing.quantity || 1) : 0;
    if (currentQty + 1 > stock) return toast(`স্টকে মাত্র ${stock} টি আছে`, 'warn');
    if (existing) existing.quantity = currentQty + 1;
    else editingOrderItems.push({ id: p.id, name: p.name, price: Number(p.price) || 0, quantity: 1, image: p.image || '' });
    renderOrderEditItems(); recalcOrderEdit();
    closeProductPicker();
    toast('Item added!');
}

window.openStatusPicker = function(orderId) {
    const o = allOrdersList.find(x => x.id === orderId);
    if (!o) return;
    statusPickerOrderId = orderId;
    document.getElementById('sp-order-num').textContent = o.orderNumber || orderId.slice(0, 10);
    const statuses = [
        { key: 'pending', icon: 'hourglass-half', label: 'Pending', desc: 'অর্ডার অপেক্ষায় আছে', color: 'yellow' },
        { key: 'confirmed', icon: 'circle-check', label: 'Confirmed', desc: 'গ্রাহককে কনফার্ম করা হয়েছে', color: 'blue' },
        { key: 'shipped', icon: 'truck-fast', label: 'Shipped', desc: 'ডেলিভারির জন্য পাঠানো হয়েছে', color: 'purple' },
        { key: 'delivered', icon: 'box-open', label: 'Delivered', desc: 'সফলভাবে ডেলিভারি হয়েছে', color: 'green' },
        { key: 'cancelled', icon: 'circle-xmark', label: 'Cancelled', desc: 'অর্ডার বাতিল করা হয়েছে', color: 'red' }
    ];
    const current = o.status;
    const colorMap = { yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' }, blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' }, purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' }, green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' }, red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' } };
    let html = '';
    statuses.forEach(s => {
        const isActive = s.key === current;
        const c = colorMap[s.color];
        html += `<button onclick="selectStatus('${s.key}')" class="w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ${isActive ? `${c.bg} ${c.border}` : 'bg-white border-gray-100 hover:border-gray-200'}"><div class="w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0"><i class="fas fa-${s.icon} ${c.text}"></i></div><div class="flex-1 min-w-0"><p class="font-bold text-sm text-navy">${s.label}</p><p class="text-[11px] text-gray-500 mt-0.5">${s.desc}</p></div>${isActive ? `<i class="fas fa-circle-check ${c.text} text-lg"></i>` : `<i class="far fa-circle text-gray-300 text-lg"></i>`}</button>`;
    });
    document.getElementById('status-options-list').innerHTML = html;
    document.getElementById('status-picker-modal').classList.remove('hidden');
}

window.closeStatusPicker = function() {
    document.getElementById('status-picker-modal').classList.add('hidden');
    statusPickerOrderId = null;
}

window.selectStatus = function(newStatus) {
    const orderId = statusPickerOrderId;
    if (!orderId) return;
    const o = allOrdersList.find(x => x.id === orderId);
    if (!o) { closeStatusPicker(); return; }
    if (o.status === newStatus) { closeStatusPicker(); return toast('Already ' + newStatus, 'warn'); }
    pendingStatusChange = { orderId, newStatus };
    closeStatusPicker();
    const statusInfo = {
        pending: { icon: 'hourglass-half', color: 'text-yellow-600', bg: 'bg-yellow-50', title: 'Set to Pending?', msg: 'এই order টি আবার Pending status-এ ফিরে যাবে।' },
        confirmed: { icon: 'circle-check', color: 'text-blue-600', bg: 'bg-blue-50', title: 'Confirm Order?', msg: 'গ্রাহককে জানান যে অর্ডার কনফার্ম হয়েছে।' },
        shipped: { icon: 'truck-fast', color: 'text-purple-600', bg: 'bg-purple-50', title: 'Mark as Shipped?', msg: 'অর্ডারটি ডেলিভারির জন্য পাঠানো হচ্ছে।' },
        delivered: { icon: 'box-open', color: 'text-green-600', bg: 'bg-green-50', title: 'Mark as Delivered?', msg: 'ডেলিভারি সম্পন্ন হয়েছে? Revenue-তে যুক্ত হবে।' },
        cancelled: { icon: 'circle-xmark', color: 'text-red-600', bg: 'bg-red-50', title: 'Cancel Order?', msg: 'অর্ডার বাতিল হবে এবং Stock ফিরে যাবে।' }
    };
    const info = statusInfo[newStatus];
    document.getElementById('sc-icon-wrap').className = 'w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ' + info.bg;
    document.getElementById('sc-icon').className = 'fas fa-' + info.icon + ' text-2xl ' + info.color;
    document.getElementById('sc-title').textContent = info.title;
    document.getElementById('sc-message').textContent = info.msg;
    document.getElementById('status-confirm-modal').classList.remove('hidden');
}

window.closeStatusConfirm = function() {
    document.getElementById('status-confirm-modal').classList.add('hidden');
    pendingStatusChange = null;
}

// ============ CONFIRM STATUS CHANGE (with Email) ============
window.confirmStatusChange = async function() {
    if (!pendingStatusChange) return;
    const { orderId, newStatus } = pendingStatusChange;
    const btn = document.getElementById('sc-confirm-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Updating...';
    try {
        const order = allOrdersList.find(x => x.id === orderId);
        const oldStatus = order?.status;
        if (newStatus === 'cancelled' && oldStatus !== 'cancelled' && order?.items && order.stockDeducted !== false) {
            for (const item of order.items) {
                if (!item.id) continue;
                try { await updateDoc(doc(db, "products", item.id), { stock: increment(item.quantity) }); } catch (e) {}
            }
            await updateDoc(doc(db, "orders", orderId), { stockDeducted: false });
        }
        if (oldStatus === 'cancelled' && newStatus !== 'cancelled' && order?.items) {
            for (const item of order.items) {
                if (!item.id) continue;
                try { await updateDoc(doc(db, "products", item.id), { stock: increment(-item.quantity) }); } catch (e) {}
            }
            await updateDoc(doc(db, "orders", orderId), { stockDeducted: true });
        }
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        toast('Status: ' + newStatus);
        logActivity('order_status', {
            description: `Order ${order?.orderNumber || orderId.slice(0,8)} এর status ${oldStatus || 'pending'} → ${newStatus}`,
            meta: { orderId, oldStatus, newStatus }
        });

        // ============ SEND STATUS UPDATE EMAIL ============
        const customerEmail = order?.customer?.email || '';
        if (customerEmail) {
            notifyStatusChange({
                orderNumber: order?.orderNumber || '',
                customerName: order?.customer?.name || '',
                customerEmail: customerEmail,
                newStatus: newStatus,
                total: order?.total || 0
            }).catch(e => console.warn('Status email failed:', e));
        }

        closeStatusConfirm();
        await loadOrders();
        updateStats();
    } catch (e) { toast("Error: " + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = 'Confirm'; }
}

function renderRecentOrders() {
    const list = document.getElementById('recent-orders'); if (!list) return;
    const recent = allOrdersList.slice(0, 3);
    if (recent.length === 0) { list.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No orders yet</p>'; return; }
    let html = '';
    recent.forEach(o => {
        const sc = 'status-' + (o.status || 'pending');
        html += `<div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"><div class="min-w-0 flex-1"><p class="text-sm font-semibold text-navy truncate">${escapeHtml(o.customer?.name || '')}</p><p class="text-[11px] text-gray-500">${(o.items || []).length} item(s) • ৳${fmt(o.total)}</p></div><span class="order-status ${sc} ml-2">${o.status || 'pending'}</span></div>`;
    });
    list.innerHTML = html;
}

// ============ REVIEWS ============
async function loadReviews() {
    try {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        allReviewsList = [];
        snap.forEach(d => allReviewsList.push({ id: d.id, ...d.data() }));
        renderAdminReviews();
    } catch (e) {}
}

function renderAdminReviews() {
    const list = document.getElementById('reviews-list-admin'); if (!list) return;
    if (allReviewsList.length === 0) { list.innerHTML = '<div class="bg-white rounded-2xl p-12 text-center premium-shadow"><i class="fas fa-star text-4xl text-gray-200 mb-3"></i><p class="text-sm text-gray-500">No reviews</p></div>'; return; }
    let html = '';
    allReviewsList.forEach(r => {
        const stars = '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0));
        html += `<div class="bg-white rounded-2xl p-4 premium-shadow"><div class="flex justify-between items-center mb-2"><p class="font-semibold text-navy text-sm">${escapeHtml(r.name)}</p><span class="text-yellow-500 text-sm">${stars}</span></div><p class="text-xs text-gray-600 mb-3">${escapeHtml(r.text)}</p><button onclick="deleteReview('${r.id}')" class="text-red-500 text-xs font-semibold"><i class="fas fa-trash mr-1"></i> Delete</button></div>`;
    });
    list.innerHTML = html;
}

window.deleteReview = async function(id) {
    if (!confirm("Delete?")) return;
    await deleteDoc(doc(db, "reviews", id));
    await loadReviews();
    toast('Review deleted', 'warn');
    logActivity('message_delete', { description: 'একটি product review delete করা হয়েছে', meta: { reviewId: id } });
}

// ============ STATS ============
function updateStats() {
    const products = document.getElementById('stat-products');
    const orders = document.getElementById('stat-orders');
    const pending = document.getElementById('stat-pending');
    const revenue = document.getElementById('stat-revenue');
    if (products) products.innerText = allProductsList.length;
    if (orders) orders.innerText = allOrdersList.length;
    if (pending) pending.innerText = allOrdersList.filter(o => o.status === 'pending').length;
    if (revenue) {
        const rev = allOrdersList.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0);
        revenue.innerText = '৳' + fmt(rev);
    }
}

// ============ SETTINGS ============
async function loadSettings() {
    try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (snap.exists()) {
            const s = snap.data();
            document.getElementById('setting-delivery-charge').value = s.deliveryCharge || 100;
            document.getElementById('setting-free-delivery').value = s.freeDeliveryAbove || '';
            document.getElementById('setting-address').value = s.contactAddress || '';
            document.getElementById('setting-phone').value = s.contactPhone || '';
            document.getElementById('setting-email').value = s.contactEmail || '';
            document.getElementById('setting-whatsapp').value = s.whatsapp || '';
            document.getElementById('setting-bkash').value = s.bkashNumber || '';
            document.getElementById('setting-nagad').value = s.nagadNumber || '';
        }
    } catch (e) {}
}

window.saveSettings = async function() {
    try {
        const dc = parseFloat(document.getElementById('setting-delivery-charge').value);
        const fda = parseFloat(document.getElementById('setting-free-delivery').value);
        if (isNaN(dc) || dc < 0) return toast('Delivery charge সঠিক নয়', 'error');
        if (document.getElementById('setting-free-delivery').value && (isNaN(fda) || fda < 0)) return toast('Free delivery amount সঠিক নয়', 'error');
        const settings = {
            deliveryCharge: dc || 100,
            freeDeliveryAbove: fda || 0,
            contactAddress: document.getElementById('setting-address').value.trim(),
            contactPhone: document.getElementById('setting-phone').value.trim(),
            contactEmail: document.getElementById('setting-email').value.trim(),
            whatsapp: document.getElementById('setting-whatsapp').value.trim(),
            bkashNumber: document.getElementById('setting-bkash').value.trim(),
            nagadNumber: document.getElementById('setting-nagad').value.trim()
        };
        await setDoc(doc(db, "settings", "main"), settings, { merge: true });
        toast('Settings saved!');
        logActivity('settings_update', { description: 'Site settings update করা হয়েছে' });
    } catch (e) { toast("Error: " + e.message, 'error'); }
}

// ============ FILE UPLOAD LISTENERS ============
document.getElementById('hero-image-file')?.addEventListener('change', function(e) {
    const f = e.target.files[0]; if (!f) return;
    document.getElementById('hero-file-name').innerText = '✔ ' + f.name;
    const r = new FileReader();
    r.onload = evt => { pendingHeroImage = { file: f, dataUrl: evt.target.result }; removeHeroImage = false; document.getElementById('hero-preview-img').src = evt.target.result; document.getElementById('hero-image-preview').classList.remove('hidden'); };
    r.readAsDataURL(f);
});

document.getElementById('cat-image-file')?.addEventListener('change', function(e) {
    const f = e.target.files[0]; if (!f) return;
    document.getElementById('cat-file-name').innerText = '✔ ' + f.name;
    const r = new FileReader();
    r.onload = evt => { pendingCategoryImage = { file: f, dataUrl: evt.target.result }; removeExistingCategoryImage = false; document.getElementById('cat-image-preview-img').src = evt.target.result; document.getElementById('cat-image-preview').classList.remove('hidden'); };
    r.readAsDataURL(f);
});

document.getElementById('banner-image-file')?.addEventListener('change', function(e) {
    const f = e.target.files[0]; if (!f) return;
    document.getElementById('banner-file-name').innerText = '✔ ' + f.name;
    const r = new FileReader();
    r.onload = evt => { pendingBannerImage = { file: f, dataUrl: evt.target.result }; document.getElementById('banner-preview-img').src = evt.target.result; document.getElementById('banner-image-preview').classList.remove('hidden'); };
    r.readAsDataURL(f);
});

document.getElementById('test-image-file')?.addEventListener('change', function(e) {
    const f = e.target.files[0]; if (!f) return;
    document.getElementById('test-file-name').innerText = '✔ ' + f.name;
    const r = new FileReader();
    r.onload = evt => { pendingTestImage = { file: f, dataUrl: evt.target.result }; document.getElementById('test-preview-img').src = evt.target.result; document.getElementById('test-image-preview').classList.remove('hidden'); };
    r.readAsDataURL(f);
});

console.log('✅ admin.js loaded (with activity log + email)');