// ============================================================
// HEARTIX ACCOUNT — Email/Phone Login + Google Sign-in
// ============================================================
import { db, auth } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getCart, getWishlist, updateCartBadges, updateWishlistBadges
} from './common.js';

import {
    collection, getDocs, doc, getDoc, setDoc, query, where, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============ STATE ============
let currentUser = null;
let activeTab = 'login';

// ============ FALLBACK (before module loads) ============
window.switchTab = function(tab) {
    activeTab = tab;
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

window.togglePassword = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        if (btn) btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        if (btn) btn.innerHTML = '<i class="fas fa-eye"></i>';
    }
};

window.loginUser = window.loginUser || function() { alert('Firebase লোড হচ্ছে...'); };
window.registerUser = window.registerUser || function() { alert('Firebase লোড হচ্ছে...'); };
window.forgotPassword = window.forgotPassword || function() { alert('Firebase লোড হচ্ছে...'); };
window.googleSignIn = window.googleSignIn || function() { alert('Firebase লোড হচ্ছে...'); };
window.logoutUser = window.logoutUser || function() { location.reload(); };
window.saveProfile = window.saveProfile || function() { alert('Firebase লোড হচ্ছে...'); };
window.loadMyOrders = window.loadMyOrders || function() {};

// ============ HELPERS ============
function showSection(id) {
    const loading = document.getElementById('loading');
    const authSec = document.getElementById('auth-section');
    const loggedSec = document.getElementById('logged-section');
    if (loading) loading.classList.add('hidden');
    if (id === 'auth') {
        if (authSec) authSec.classList.remove('hidden');
        if (loggedSec) loggedSec.classList.add('hidden');
    } else {
        if (loggedSec) loggedSec.classList.remove('hidden');
        if (authSec) authSec.classList.add('hidden');
    }
}

function validatePhone(p) { return /^01[3-9]\d{8}$/.test(p); }
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function setFieldError(id, hasError) {
    const el = document.getElementById(id);
    if (!el) return;
    const wrap = el.closest('.input-wrap');
    if (wrap) {
        if (hasError) wrap.classList.add('field-error');
        else wrap.classList.remove('field-error');
    } else {
        if (hasError) el.classList.add('field-error');
        else el.classList.remove('field-error');
    }
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
    const identifier = (document.getElementById('login-email').value || '').trim();
    const password = document.getElementById('login-password').value || '';
    const remember = document.getElementById('remember-me')?.checked;

    if (!identifier) {
        setFieldError('login-email', true);
        return showToast('ইমেইল বা ফোন নাম্বার দিন', 'error');
    }
    if (!password) {
        setFieldError('login-password', true);
        return showToast('পাসওয়ার্ড দিন', 'error');
    }
    setFieldError('login-email', false);
    setFieldError('login-password', false);

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Logging in...';

    try {
        let email = identifier;

        // If phone number, lookup email from customers collection
        if (validatePhone(identifier)) {
            const q = query(collection(db, "customers"), where("phone", "==", identifier), limit(1));
            const snap = await getDocs(q);
            if (snap.empty) {
                btn.disabled = false;
                btn.innerHTML = 'Login';
                return showToast('এই ফোন নাম্বারে কোনো account নেই', 'error');
            }
            email = snap.docs[0].data().email;
            if (!email) {
                btn.disabled = false;
                btn.innerHTML = 'Login';
                return showToast('এই account-এ email নেই, email দিয়ে login করুন', 'error');
            }
        }

        await signInWithEmailAndPassword(auth, email, password);

        // Remember me → save identifier for prefill next time
        try {
            if (remember) localStorage.setItem('heartix_remember', identifier);
            else localStorage.removeItem('heartix_remember');
        } catch (e) {}

        document.getElementById('login-password').value = '';
        showToast('সফলভাবে লগইন হয়েছেন ✅', 'success');
    } catch (e) {
        let msg = 'লগইন ব্যর্থ';
        if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'পাসওয়ার্ড ভুল';
        else if (e.code === 'auth/user-not-found') msg = 'এই account নেই';
        else if (e.code === 'auth/invalid-email') msg = 'সঠিক ইমেইল দিন';
        else if (e.code === 'auth/too-many-requests') msg = 'অনেকবার ভুল — কিছুক্ষণ পর চেষ্টা';
        showToast(msg, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Login';
    }
};

// ============ GOOGLE SIGN-IN ============
window.googleSignIn = async function() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Save to customers collection if first time
        try {
            const snap = await getDoc(doc(db, "customers", user.uid));
            if (!snap.exists()) {
                await setDoc(doc(db, "customers", user.uid), {
                    uid: user.uid,
                    name: user.displayName || '',
                    email: user.email || '',
                    phone: '',
                    photoURL: user.photoURL || '',
                    provider: 'google',
                    createdAt: new Date().toISOString()
                });
            }
        } catch (e) { console.warn('Customer save failed:', e); }

        showToast('Google দিয়ে লগইন সফল ✅', 'success');
    } catch (e) {
        if (e.code === 'auth/popup-closed-by-user') return;
        if (e.code === 'auth/popup-blocked') return showToast('Popup block হয়েছে — browser settings চেক করুন', 'error');
        if (e.code === 'auth/operation-not-allowed') return showToast('Firebase Console-এ Google Sign-in enable করা হয়নি', 'error');
        if (e.code === 'auth/unauthorized-domain') return showToast('এই domain Firebase-এ authorized নয়', 'error');
        showToast('Google login ব্যর্থ: ' + (e.message || e.code), 'error');
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
    if (!validateEmail(email)) return showToast('সঠিক ইমেইল দিন', 'error');
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
                name, phone, email,
                provider: 'email',
                createdAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) { console.warn('Customer save failed:', e); }

        showToast('Account তৈরি হয়েছে ✅', 'success');
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
        btn.innerHTML = 'Register';
    }
};

// ============ FORGOT PASSWORD ============
window.forgotPassword = async function() {
    const identifier = (document.getElementById('login-email').value || '').trim();
    if (!identifier) return showToast('প্রথমে ইমেইল বা ফোন লিখুন', 'warn');

    let email = identifier;
    try {
        if (validatePhone(identifier)) {
            const q = query(collection(db, "customers"), where("phone", "==", identifier), limit(1));
            const snap = await getDocs(q);
            if (snap.empty) return showToast('এই ফোনে কোনো account নেই', 'error');
            email = snap.docs[0].data().email;
        }
        await sendPasswordResetEmail(auth, email);
        showToast('Reset link ' + email + '-এ পাঠানো হয়েছে ✅', 'success');
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
            name, phone, email: currentUser.email
        }, { merge: true });
        try { await updateProfile(currentUser, { displayName: name }); } catch (e) {}
        document.getElementById('user-display-name').textContent = name;
        document.getElementById('user-avatar-letter').textContent = (name[0] || 'U').toUpperCase();
        showToast('প্রোফাইল সেভ হয়েছে ✅', 'success');
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
            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
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
            const date = o.createdAt?.toDate
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

// ============ PREFILL REMEMBERED IDENTIFIER ============
function prefillRemembered() {
    try {
        const saved = localStorage.getItem('heartix_remember');
        if (saved) {
            const input = document.getElementById('login-email');
            if (input) input.value = saved;
            const cb = document.getElementById('remember-me');
            if (cb) cb.checked = true;
        }
    } catch (e) {}
}

// ============ BULLETPROOF FALLBACK ============
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
prefillRemembered();