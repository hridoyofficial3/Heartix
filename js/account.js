// ============================================================
// HEARTIX ACCOUNT PAGE — Firebase Auth + Profile + Orders
// ============================================================
import { db, auth } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getCart, getWishlist, updateCartBadges, updateWishlistBadges
} from './common.js';

import {
    collection, getDocs, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============ STATE ============
let currentUser = null;

// ============ FALLBACK (in case module fails) ============
window.switchTab = function(tab) {
    const loginTab = document.getElementById('tab-login');
    const regTab = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    if (tab === 'login') {
        if (loginTab) loginTab.classList.add('active');
        if (regTab) regTab.classList.remove('active');
        if (loginForm) loginForm.classList.remove('hidden');
        if (regForm) regForm.classList.add('hidden');
    } else {
        if (regTab) regTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (regForm) regForm.classList.remove('hidden');
        if (loginForm) loginForm.classList.add('hidden');
    }
};

// ============ HELPERS ============
function showSection(id) {
    const loading = document.getElementById('loading');
    const auth = document.getElementById('auth-section');
    const logged = document.getElementById('logged-section');
    if (loading) loading.classList.add('hidden');
    if (id === 'auth') {
        if (auth) auth.classList.remove('hidden');
        if (logged) logged.classList.add('hidden');
    } else {
        if (logged) logged.classList.remove('hidden');
        if (auth) auth.classList.add('hidden');
    }
}

function validatePhone(p) {
    return /^01[3-9]\d{8}$/.test(p);
}

function setFieldError(id, hasError) {
    const el = document.getElementById(id);
    if (!el) return;
    if (hasError) el.classList.add('field-error');
    else el.classList.remove('field-error');
}

// ============ AUTH STATE ============
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        showSection('logged');
        try {
            await loadProfile();
            loadMyOrders();
            updateBadges();
        } catch (e) { console.error('Profile load error:', e); }
    } else {
        currentUser = null;
        showSection('auth');
    }
});

// ============ LOGIN ============
window.loginUser = async function() {
    const email = (document.getElementById('login-email').value || '').trim();
    const password = document.getElementById('login-password').value || '';
    if (!email || !password) return showToast('ইমেইল ও পাসওয়ার্ড দিন', 'error');

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Logging in...';

    try {
        await signInWithEmailAndPassword(auth, email, password);
        document.getElementById('login-password').value = '';
        showToast('সফলভাবে লগইন হয়েছেন', 'success');
    } catch (e) {
        let msg = 'লগইন ব্যর্থ';
        if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'ইমেইল বা পাসওয়ার্ড ভুল';
        else if (e.code === 'auth/user-not-found') msg = 'এই ইমেইলে account নেই';
        else if (e.code === 'auth/invalid-email') msg = 'সঠিক ইমেইল দিন';
        else if (e.code === 'auth/too-many-requests') msg = 'অনেকবার ভুল — কিছুক্ষণ পর চেষ্টা';
        showToast(msg, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> LOGIN';
    }
};

// ============ REGISTER ============
window.registerUser = async function() {
    const name = (document.getElementById('reg-name').value || '').trim();
    const phone = (document.getElementById('reg-phone').value || '').trim();
    const email = (document.getElementById('reg-email').value || '').trim();
    const password = document.getElementById('reg-password').value || '';
    const confirm = document.getElementById('reg-confirm').value || '';

    if (!name || name.length < 2) return showToast('সঠিক নাম দিন', 'error');
    if (!validatePhone(phone)) return showToast('সঠিক ফোন নাম্বার (01XXXXXXXXX)', 'error');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('সঠিক ইমেইল দিন', 'error');
    if (!password || password.length < 6) return showToast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর', 'error');
    if (password !== confirm) return showToast('পাসওয়ার্ড দুইটা মিলছে না', 'error');

    const btn = document.getElementById('register-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        try { await updateProfile(cred.user, { displayName: name }); } catch (e) {}
        try {
            await setDoc(doc(db, "customers", cred.user.uid), {
                uid: cred.user.uid,
                name: name, phone: phone, email: email,
                createdAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) { console.warn('Profile save failed:', e); }

        showToast('Account তৈরি হয়েছে!', 'success');
        ['reg-name','reg-phone','reg-email','reg-password','reg-confirm'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    } catch (e) {
        let msg = 'রেজিস্ট্রেশন ব্যর্থ';
        if (e.code === 'auth/email-already-in-use') msg = 'এই ইমেইল আগেই ব্যবহৃত';
        else if (e.code === 'auth/weak-password') msg = 'পাসওয়ার্ড দুর্বল';
        else if (e.code === 'auth/invalid-email') msg = 'সঠিক ইমেইল দিন';
        else if (e.code === 'auth/network-request-failed') msg = 'ইন্টারনেট সমস্যা';
        showToast(msg, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i> REGISTER';
    }
};

// ============ FORGOT PASSWORD ============
window.forgotPassword = async function() {
    const email = (document.getElementById('login-email').value || '').trim();
    if (!email) return showToast('প্রথমে ইমেইল লিখুন', 'warn');
    try {
        await sendPasswordResetEmail(auth, email);
        showToast('Reset link ইমেইলে পাঠানো হয়েছে', 'success');
    } catch (e) {
        showToast('পাঠানো যায়নি — ইমেইল চেক করুন', 'error');
    }
};

// ============ LOGOUT ============
window.logoutUser = async function() {
    if (!confirm('Logout করবেন?')) return;
    try {
        await signOut(auth);
        showToast('Logout হয়েছে', 'warn');
    } catch (e) {}
};

// ============ PROFILE ============
async function loadProfile() {
    if (!currentUser) return;
    const fallbackName = currentUser.displayName || (currentUser.email || '').split('@')[0] || 'User';
    document.getElementById('user-display-name').textContent = fallbackName;
    document.getElementById('user-display-email').textContent = currentUser.email || '-';
    document.getElementById('user-avatar-letter').textContent = (fallbackName[0] || 'U').toUpperCase();
    document.getElementById('profile-name').value = fallbackName;
    document.getElementById('profile-phone').value = '';

    try {
        const snap = await getDoc(doc(db, "customers", currentUser.uid));
        if (snap.exists()) {
            const d = snap.data();
            if (d.name) {
                document.getElementById('user-display-name').textContent = d.name;
                document.getElementById('profile-name').value = d.name;
                document.getElementById('user-avatar-letter').textContent = (d.name[0] || 'U').toUpperCase();
            }
            if (d.phone) document.getElementById('profile-phone').value = d.phone;
        }
    } catch (e) { console.warn('Profile load:', e); }
}

window.saveProfile = async function() {
    if (!currentUser) return;
    const name = (document.getElementById('profile-name').value || '').trim();
    const phone = (document.getElementById('profile-phone').value || '').trim();
    if (!name || name.length < 2) return showToast('সঠিক নাম দিন', 'error');
    if (phone && !validatePhone(phone)) return showToast('সঠিক ফোন নাম্বার দিন', 'error');

    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';

    try {
        await setDoc(doc(db, "customers", currentUser.uid), {
            name: name, phone: phone, email: currentUser.email
        }, { merge: true });
        try { await updateProfile(currentUser, { displayName: name }); } catch (e) {}
        document.getElementById('user-display-name').textContent = name;
        document.getElementById('user-avatar-letter').textContent = (name[0] || 'U').toUpperCase();
        showToast('প্রোফাইল সেভ হয়েছে', 'success');
    } catch (e) {
        showToast('সেভ করা যায়নি', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save mr-1"></i> Save Changes';
    }
};

// ============ MY ORDERS ============
window.loadMyOrders = async function() {
    const list = document.getElementById('my-orders-list');
    if (!currentUser || !list) return;
    list.innerHTML = '<p class="text-xs text-gray-400 text-center py-4"><i class="fas fa-spinner fa-spin mr-1"></i> Loading...</p>';

    try {
        const allSnap = await getDocs(collection(db, "orders"));
        let orders = [];
        allSnap.forEach(d => {
            const data = d.data();
            if (data.customer && data.customer.email === currentUser.email) {
                orders.push({ id: d.id, ...data });
            }
        });
        orders.sort((a, b) => {
            const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta;
        });

        if (orders.length === 0) {
            list.innerHTML = '<div class="text-center py-8">' +
                '<i class="fas fa-receipt text-4xl text-gray-200 mb-3"></i>' +
                '<p class="text-xs text-gray-500">এখনো কোনো অর্ডার নেই</p>' +
                '<a href="index.html" class="inline-block mt-3 navy-gradient text-white px-5 py-2 rounded-lg text-[11px] font-semibold">শপিং করুন</a>' +
                '</div>';
            return;
        }

        let html = '';
        orders.slice(0, 10).forEach(o => {
            const statusClass = 'status-' + (o.status || 'pending');
            const date = o.createdAt && o.createdAt.toDate
                ? o.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : '';
            html += `<a href="track-order.html?order=${encodeURIComponent(o.orderNumber || '')}" class="block bg-gray-50 rounded-xl p-3 active:bg-gray-100">
                <div class="flex justify-between items-start mb-2">
                    <div class="min-w-0">
                        <p class="font-bold text-navy text-xs">${escapeHtml(o.orderNumber || '')}</p>
                        <p class="text-[10px] text-gray-500 mt-0.5">${date} • ${(o.items || []).length} item(s)</p>
                    </div>
                    <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${statusClass}">${o.status || 'pending'}</span>
                </div>
                <div class="flex justify-between items-baseline">
                    <span class="text-[10px] text-gray-500">Total</span>
                    <span class="font-bold text-navy text-sm">৳${formatPrice(o.total)}</span>
                </div>
            </a>`;
        });
        list.innerHTML = html;
    } catch (e) {
        console.error('Orders:', e);
        list.innerHTML = '<p class="text-xs text-red-500 text-center py-4">লোড করা যায়নি</p>';
    }
};

// ============ BADGES ============
function updateBadges() {
    try {
        const cart = getCart();
        const cCount = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
        const el = document.getElementById('cart-count-header');
        if (el) el.textContent = cCount;
        const ct = document.getElementById('cart-count-text');
        if (ct) ct.textContent = cCount;

        const wl = getWishlist();
        const wCount = Array.isArray(wl) ? wl.length : 0;
        const we = document.getElementById('wishlist-count');
        if (we) we.textContent = wCount;
    } catch (e) {}
}

// ============ FORCE SHOW AUTH (bulletproof fallback) ============
setTimeout(function() {
    const loading = document.getElementById('loading');
    const authSec = document.getElementById('auth-section');
    const loggedSec = document.getElementById('logged-section');
    if (loading && !loading.classList.contains('hidden')) {
        loading.classList.add('hidden');
        if (authSec && (!loggedSec || loggedSec.classList.contains('hidden'))) {
            authSec.classList.remove('hidden');
        }
    }
}, 4000);

// ============ INIT ============
updateCartBadges();
updateWishlistBadges();