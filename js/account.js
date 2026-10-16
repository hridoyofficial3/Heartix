// ============================================================
// HEARTIX ACCOUNT — Auth + Profile (view/edit) + Address
// v2 — Phone login via phone_lookup collection
// ============================================================
import { db, auth } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getCart, getWishlist, updateCartBadges, updateWishlistBadges
} from './common.js';
import { DISTRICTS } from './districts.js';

import {
    collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where, limit
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
let currentProfile = {};
let activeTab = 'login';

// ============ FALLBACK ============
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
window.openAddressEdit = window.openAddressEdit || function() {};
window.cancelAddressEdit = window.cancelAddressEdit || function() {};

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
    }
}

// ============ PHONE LOOKUP HELPERS (new) ============
// phone_lookup/{phone} = { uid, email, updatedAt }
// Firestore rule: public read, owner write — see guide

async function findEmailByPhone(phone) {
    try {
        const snap = await getDoc(doc(db, "phone_lookup", phone));
        if (snap.exists()) {
            const d = snap.data();
            return d.email || null;
        }
    } catch (e) {
        console.warn('phone_lookup read failed:', e);
    }
    return null;
}

async function registerPhoneLookup(phone, uid, email) {
    try {
        await setDoc(doc(db, "phone_lookup", phone), {
            uid,
            email,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (e) {
        console.warn('phone_lookup write failed:', e);
        return false;
    }
}

async function removePhoneLookup(phone, uid) {
    try {
        const snap = await getDoc(doc(db, "phone_lookup", phone));
        if (snap.exists() && snap.data().uid === uid) {
            await deleteDoc(doc(db, "phone_lookup", phone));
        }
        return true;
    } catch (e) {
        console.warn('phone_lookup delete failed:', e);
        return false;
    }
}

// Populate district dropdown
function populateDistrictDropdown() {
    const sel = document.getElementById('profile-district');
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

// ============ AUTH STATE ============
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        showSection('logged');
        populateDistrictDropdown();
        try {
            await loadProfile();
            loadMyOrders();
            updateBadges();
        } catch (e) { console.error('Profile load error:', e); }
    } else {
        currentUser = null;
        currentProfile = {};
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

        // Phone → email lookup via phone_lookup collection
        if (validatePhone(identifier)) {
            const foundEmail = await findEmailByPhone(identifier);
            if (!foundEmail) {
                btn.disabled = false;
                btn.innerHTML = 'Login';
                return showToast('এই ফোন নাম্বারে কোনো account নেই', 'error');
            }
            email = foundEmail;
        }

        await signInWithEmailAndPassword(auth, email, password);

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

        try {
            const snap = await getDoc(doc(db, "customers", user.uid));
            if (!snap.exists()) {
                await setDoc(doc(db, "customers", user.uid), {
                    uid: user.uid,
                    name: user.displayName || '',
                    email: user.email || '',
                    phone: '',
                    address: '',
                    district: '',
                    thana: '',
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
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Checking...';

    try {
        // Pre-check: phone already used?
        const existingEmail = await findEmailByPhone(phone);
        if (existingEmail) {
            btn.disabled = false;
            btn.innerHTML = 'Create Account';
            return showToast('এই ফোন নাম্বার দিয়ে আগেই account আছে', 'error');
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        try { await updateProfile(cred.user, { displayName: name }); } catch (e) {}

        // Save customer doc
        try {
            await setDoc(doc(db, "customers", cred.user.uid), {
                uid: cred.user.uid,
                name, phone, email,
                address: '', district: '', thana: '',
                provider: 'email',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) { console.warn('Customer save failed:', e); }

        // Save phone_lookup (for phone-based login)
        await registerPhoneLookup(phone, cred.user.uid, email);

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
        btn.innerHTML = 'Create Account';
    }
};

// ============ FORGOT PASSWORD ============
window.forgotPassword = async function() {
    const identifier = (document.getElementById('login-email').value || '').trim();
    if (!identifier) return showToast('প্রথমে ইমেইল বা ফোন লিখুন', 'warn');

    let email = identifier;
    try {
        if (validatePhone(identifier)) {
            const foundEmail = await findEmailByPhone(identifier);
            if (!foundEmail) return showToast('এই ফোনে কোনো account নেই', 'error');
            email = foundEmail;
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

// ============ LOAD PROFILE ============
async function loadProfile() {
    if (!currentUser) return;
    const fallbackName = currentUser.displayName || (currentUser.email || '').split('@')[0] || 'User';

    document.getElementById('user-display-name').textContent = fallbackName;
    document.getElementById('user-display-email').textContent = currentUser.email || '-';
    document.getElementById('user-avatar-letter').textContent = (fallbackName[0] || 'U').toUpperCase();

    currentProfile = {
        name: fallbackName,
        phone: '',
        email: currentUser.email || '',
        address: '',
        district: '',
        thana: ''
    };

    try {
        const snap = await getDoc(doc(db, "customers", currentUser.uid));
        if (snap.exists()) {
            const d = snap.data();
            currentProfile = {
                name: d.name || fallbackName,
                phone: d.phone || '',
                email: d.email || currentUser.email || '',
                address: d.address || '',
                district: d.district || '',
                thana: d.thana || ''
            };
            document.getElementById('user-display-name').textContent = currentProfile.name;
            document.getElementById('user-avatar-letter').textContent = (currentProfile.name[0] || 'U').toUpperCase();
        }
    } catch (e) { console.warn('Profile load:', e); }

    renderAccountInfoView();
}

// ============ VIEW MODE ============
function renderAccountInfoView() {
    const p = currentProfile;

    const nameEl = document.getElementById('view-name');
    const phoneEl = document.getElementById('view-phone');
    const emailEl = document.getElementById('view-email');
    const addrEl = document.getElementById('view-address');
    const locEl = document.getElementById('view-district-thana');

    if (!nameEl) return;

    nameEl.textContent = p.name || 'Add your name';
    nameEl.parentElement.parentElement.classList.toggle('empty', !p.name);

    phoneEl.textContent = p.phone || 'Add phone number';
    phoneEl.parentElement.parentElement.classList.toggle('empty', !p.phone);

    emailEl.textContent = p.email || 'No email';
    emailEl.parentElement.parentElement.classList.toggle('empty', !p.email);

    addrEl.textContent = p.address || 'Add your full address';
    addrEl.parentElement.parentElement.classList.toggle('empty', !p.address);

    const locText = [p.thana, p.district].filter(Boolean).join(', ');
    locEl.textContent = locText || 'Add district & thana';
    locEl.parentElement.parentElement.classList.toggle('empty', !locText);
}

// ============ EDIT MODE TOGGLE ============
window.openAddressEdit = function() {
    const view = document.getElementById('account-info-view');
    const edit = document.getElementById('account-info-edit');
    if (!view || !edit) return;

    document.getElementById('profile-name').value = currentProfile.name || '';
    document.getElementById('profile-phone').value = currentProfile.phone || '';
    document.getElementById('profile-address').value = currentProfile.address || '';
    document.getElementById('profile-thana').value = currentProfile.thana || '';

    populateDistrictDropdown();
    document.getElementById('profile-district').value = currentProfile.district || '';

    view.classList.add('hidden');
    edit.classList.remove('hidden');
    edit.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.cancelAddressEdit = function() {
    const view = document.getElementById('account-info-view');
    const edit = document.getElementById('account-info-edit');
    if (view) view.classList.remove('hidden');
    if (edit) edit.classList.add('hidden');
};

// ============ SAVE PROFILE ============
window.saveProfile = async function() {
    if (!currentUser) return;

    const name = (document.getElementById('profile-name').value || '').trim();
    const phone = (document.getElementById('profile-phone').value || '').trim();
    const address = (document.getElementById('profile-address').value || '').trim();
    const district = document.getElementById('profile-district').value || '';
    const thana = (document.getElementById('profile-thana').value || '').trim();

    if (!name || name.length < 2) return showToast('সঠিক নাম দিন', 'error');
    if (!validatePhone(phone)) return showToast('সঠিক ফোন নাম্বার দিন (01XXXXXXXXX)', 'error');
    if (!address || address.length < 5) return showToast('সম্পূর্ণ ঠিকানা দিন', 'error');

    const phoneChanged = phone !== (currentProfile.phone || '');

    // If phone changed, verify it's not taken by someone else
    if (phoneChanged) {
        const existingEmail = await findEmailByPhone(phone);
        if (existingEmail && existingEmail !== currentUser.email) {
            return showToast('এই ফোন নাম্বার অন্য account ব্যবহার করছে', 'error');
        }
    }

    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';

    try {
        await setDoc(doc(db, "customers", currentUser.uid), {
            name, phone,
            email: currentUser.email,
            address, district, thana,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // Handle phone_lookup migration if phone changed
        if (phoneChanged) {
            if (currentProfile.phone) {
                await removePhoneLookup(currentProfile.phone, currentUser.uid);
            }
            await registerPhoneLookup(phone, currentUser.uid, currentUser.email);
        }

        try { await updateProfile(currentUser, { displayName: name }); } catch (e) {}

        currentProfile = { ...currentProfile, name, phone, address, district, thana };
        document.getElementById('user-display-name').textContent = name;
        document.getElementById('user-avatar-letter').textContent = (name[0] || 'U').toUpperCase();

        renderAccountInfoView();
        window.cancelAddressEdit();

        showToast('তথ্য সেভ হয়েছে ✅', 'success');
    } catch (e) {
        console.error(e);
        showToast('সেভ করা যায়নি', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save mr-1"></i> Save';
    }
};

// ============ MY ORDERS ============
window.loadMyOrders = async function() {
    const list = document.getElementById('my-orders-list');
    if (!currentUser || !list) return;
    list.innerHTML = '<p class="text-xs text-gray-400 text-center py-4"><i class="fas fa-spinner fa-spin mr-1"></i> Loading...</p>';

    try {
        // Optimized: query by customer.email instead of loading all
        const q = query(
            collection(db, "orders"),
            where("customer.email", "==", currentUser.email)
        );
        let snap;
        try {
            snap = await getDocs(q);
        } catch (e) {
            // Fallback for missing index — load all and filter client-side
            console.warn('Indexed query failed, using fallback:', e.message);
            snap = await getDocs(collection(db, "orders"));
        }

        let orders = [];
        snap.forEach(d => {
            const data = d.data();
            // Filter client-side to be safe (covers fallback case)
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

// ============ PREFILL REMEMBERED ============
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
populateDistrictDropdown();

console.log('✅ account.js v2 loaded (phone_lookup enabled)');