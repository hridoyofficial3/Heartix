// ============================================================
// HEARTIX ADMIN — Staff Management + Activity Log
// ============================================================
import { db, auth } from './firebase.js';
import { escapeHtml, showToast as toast } from './common.js';

import {
    collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc,
    query, orderBy, limit, serverTimestamp, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Secondary Firebase app for creating users without admin logout
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth as getSecondaryAuth,
    createUserWithEmailAndPassword as createSecondaryUser,
    signOut as secondarySignOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDMJMggVKtyP6c9qtb7rYE_3jh01l4me4w",
    authDomain: "heartix.firebaseapp.com",
    projectId: "heartix",
    storageBucket: "heartix.firebasestorage.app",
    messagingSenderId: "551204402338",
    appId: "1:551204402338:web:169555975c0bbb97f113fb"
};

// ============ ROLE DEFINITIONS ============
const ROLES = {
    owner:     { label: 'Owner',     color: 'purple', icon: 'crown',        desc: 'Full access + Staff management' },
    admin:     { label: 'Admin',     color: 'amber',  icon: 'user-shield',  desc: 'সব কিছু (Owner management ছাড়া)' },
    manager:   { label: 'Manager',   color: 'blue',   icon: 'briefcase',    desc: 'Products, Orders, Coupons' },
    moderator: { label: 'Moderator', color: 'green',  icon: 'user-tie',     desc: 'Orders + Messages' },
    delivery:  { label: 'Delivery',  color: 'orange', icon: 'truck',        desc: 'Assigned orders only' }
};

const ROLE_COLORS = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' }
};

// ============ STATE ============
let allStaffList = [];
let allActivityList = [];
let currentStaffFilter = 'all';
let currentActivityDate = 'today';
let currentActivityStaff = 'all';
let currentActivityAction = 'all';
let activityCurrentUser = null;

// ============ IP HELPER (cached) ============
let cachedIP = '';
async function getIP() {
    if (cachedIP) return cachedIP;
    try {
        const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
        const data = await res.json();
        cachedIP = data.ip || '';
    } catch (e) { cachedIP = ''; }
    return cachedIP;
}

// ============ INIT ============
function initStaffModule() {
    // Hook into showTab
    if (typeof window.showTab === 'function' && !window._staffHooked) {
        const orig = window.showTab;
        window.showTab = function(tab) {
            orig.apply(this, arguments);
            if (tab === 'staff') setTimeout(initStaffTab, 100);
            if (tab === 'activity') setTimeout(initActivityTab, 100);
        };
        window._staffHooked = true;
    }

    // Watch for auth state
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js").then(({ onAuthStateChanged }) => {
        onAuthStateChanged(auth, (user) => {
            activityCurrentUser = user;
        });
    });

    console.log('✅ Staff module hooked');
}

// Wait for admin.js to load showTab
setTimeout(initStaffModule, 500);
setTimeout(initStaffModule, 1500);
setTimeout(initStaffModule, 3000);

// ============ STAFF TAB INIT ============
async function initStaffTab() {
    await loadStaffList();
    renderStaffList();
}

window.initStaffTab = initStaffTab;

// ============ LOAD STAFF LIST ============
async function loadStaffList() {
    try {
        const snap = await getDocs(collection(db, "staff"));
        allStaffList = [];
        snap.forEach(d => allStaffList.push({ uid: d.id, ...d.data() }));
        // Sort by role priority
        const order = ['owner', 'admin', 'manager', 'moderator', 'delivery'];
        allStaffList.sort((a, b) => {
            const ai = order.indexOf(a.role);
            const bi = order.indexOf(b.role);
            if (ai !== bi) return ai - bi;
            return (a.name || '').localeCompare(b.name || '');
        });
    } catch (e) {
        console.error('Load staff:', e);
        allStaffList = [];
    }
}

// ============ RENDER STAFF LIST ============
function renderStaffList() {
    const list = document.getElementById('staff-list');
    if (!list) return;

    if (allStaffList.length === 0) {
        list.innerHTML = `<div class="bg-white rounded-2xl p-12 text-center premium-shadow">
            <i class="fas fa-users text-4xl text-gray-200 mb-3"></i>
            <p class="text-sm text-gray-500 mb-2">এখনো কোনো staff নেই</p>
            <p class="text-xs text-gray-400">"Add Staff" ক্লিক করে প্রথম staff তৈরি করুন</p>
        </div>`;
        return;
    }

    let html = '';
    allStaffList.forEach(s => {
        const role = ROLES[s.role] || ROLES.moderator;
        const colors = ROLE_COLORS[role.color];
        const initials = (s.name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const isActive = s.active !== false;

        let lastLoginText = 'কখনো login করেনি';
        if (s.lastLogin) {
            try {
                const d = s.lastLogin.toDate ? s.lastLogin.toDate() : new Date(s.lastLogin);
                const mins = Math.floor((Date.now() - d.getTime()) / 60000);
                if (mins < 1) lastLoginText = 'এখন online';
                else if (mins < 60) lastLoginText = mins + ' মিনিট আগে';
                else if (mins < 1440) lastLoginText = Math.floor(mins / 60) + ' ঘণ্টা আগে';
                else lastLoginText = Math.floor(mins / 1440) + ' দিন আগে';
            } catch (e) {}
        }

        html += `<div class="bg-white rounded-2xl p-4 premium-shadow border-l-4 ${isActive ? 'border-green-500' : 'border-gray-300'}">
            <div class="flex items-start gap-3 mb-3">
                <div class="w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0">
                    <span class="${colors.text} text-base font-bold">${initials}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-bold text-navy text-sm">${escapeHtml(s.name || 'Unknown')}</p>
                        <span class="inline-flex items-center gap-1 text-[9px] font-bold ${colors.bg} ${colors.text} px-2 py-0.5 rounded-full">
                            <i class="fas fa-${role.icon} text-[8px]"></i> ${role.label}
                        </span>
                        ${!isActive ? '<span class="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">INACTIVE</span>' : ''}
                    </div>
                    <p class="text-[11px] text-gray-500 mt-1 truncate">${escapeHtml(s.email || '')}</p>
                    ${s.phone ? `<p class="text-[11px] text-gray-500 mt-0.5"><i class="fas fa-phone text-[9px] mr-1"></i>${escapeHtml(s.phone)}</p>` : ''}
                    <p class="text-[10px] text-gray-400 mt-1.5"><i class="fas fa-clock text-[9px] mr-1"></i>Last login: ${lastLoginText}</p>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                <button onclick="openStaffDetail('${s.uid}')" class="py-2 bg-blue-50 active:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold">
                    <i class="fas fa-eye mr-1"></i>View
                </button>
                <button onclick="toggleStaffActive('${s.uid}')" class="py-2 ${isActive ? 'bg-orange-50 active:bg-orange-100 text-orange-700' : 'bg-green-50 active:bg-green-100 text-green-700'} rounded-lg text-[10px] font-bold">
                    <i class="fas fa-${isActive ? 'pause' : 'play'} mr-1"></i>${isActive ? 'Disable' : 'Enable'}
                </button>
                <button onclick="removeStaff('${s.uid}')" class="py-2 bg-red-50 active:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold">
                    <i class="fas fa-trash mr-1"></i>Remove
                </button>
            </div>
        </div>`;
    });
    list.innerHTML = html;

    // Update staff count
    const countEl = document.getElementById('staff-count');
    if (countEl) countEl.textContent = allStaffList.length;
}

// ============ ADD STAFF ============
window.openAddStaffModal = function() {
    document.getElementById('staff-modal-title').textContent = 'Add New Staff';
    document.getElementById('edit-staff-uid').value = '';
    document.getElementById('staff-name').value = '';
    document.getElementById('staff-email').value = '';
    document.getElementById('staff-phone').value = '';
    document.getElementById('staff-password').value = '';
    document.getElementById('staff-role').value = 'moderator';
    document.getElementById('staff-email').disabled = false;
    document.getElementById('staff-password-field').style.display = 'block';
    document.getElementById('staff-modal').classList.remove('hidden');
};

window.closeStaffModal = function() {
    document.getElementById('staff-modal').classList.add('hidden');
};

window.saveStaff = async function() {
    const editUid = document.getElementById('edit-staff-uid').value;
    const name = (document.getElementById('staff-name').value || '').trim();
    const email = (document.getElementById('staff-email').value || '').trim().toLowerCase();
    const phone = (document.getElementById('staff-phone').value || '').trim();
    const password = document.getElementById('staff-password').value || '';
    const role = document.getElementById('staff-role').value;

    // Validation
    if (!name || name.length < 2) return toast('সঠিক নাম দিন', 'error');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('সঠিক ইমেইল দিন', 'error');
    if (phone && !/^01[3-9]\d{8}$/.test(phone)) return toast('সঠিক ফোন নাম্বার দিন', 'error');
    if (!ROLES[role]) return toast('Role সিলেক্ট করুন', 'error');

    // Check role permission
    const currentRole = await getCurrentUserRole();
    if (!['owner', 'admin'].includes(currentRole)) {
        return toast('আপনার staff add করার permission নেই', 'error');
    }
    if (currentRole === 'admin' && ['owner', 'admin'].includes(role)) {
        return toast('Admin শুধু Moderator/Manager/Delivery বানাতে পারবে', 'error');
    }

    const btn = document.getElementById('staff-save-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';

    try {
        if (editUid) {
            // EDIT mode
            const updateData = {
                name, phone, role,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser?.uid || ''
            };
            await updateDoc(doc(db, "staff", editUid), updateData);
            toast('Staff updated ✅');
            await logActivity('staff_edited', 'staff', editUid, name, { role });
        } else {
            // CREATE mode
            if (!password || password.length < 8) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check mr-2"></i> CREATE STAFF';
                return toast('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর', 'error');
            }

            // Use secondary app to avoid logging out admin
            const secondaryApp = initializeApp(firebaseConfig, "secondary-" + Date.now());
            const secondaryAuth = getSecondaryAuth(secondaryApp);

            let newUser;
            try {
                const cred = await createSecondaryUser(secondaryAuth, email, password);
                newUser = cred.user;
            } finally {
                try { await secondarySignOut(secondaryAuth); } catch (e) {}
                try { await deleteApp(secondaryApp); } catch (e) {}
            }

            // Save staff profile
            await setDoc(doc(db, "staff", newUser.uid), {
                uid: newUser.uid,
                name, email, phone, role,
                active: true,
                createdAt: new Date().toISOString(),
                createdBy: currentUser?.uid || '',
                lastLogin: null
            });

            toast('Staff account তৈরি ✅');
            await logActivity('staff_created', 'staff', newUser.uid, name, { role, email });
        }

        closeStaffModal();
        await loadStaffList();
        renderStaffList();
        updateDashboardStats();
    } catch (e) {
        console.error('Save staff:', e);
        let msg = 'Save করা যায়নি';
        if (e.code === 'auth/email-already-in-use') msg = 'এই ইমেইল দিয়ে আগেই account আছে';
        else if (e.code === 'auth/weak-password') msg = 'পাসওয়ার্ড দুর্বল';
        else if (e.code === 'auth/invalid-email') msg = 'সঠিক ইমেইল দিন';
        toast(msg, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = editUid ? '<i class="fas fa-check mr-2"></i> UPDATE' : '<i class="fas fa-check mr-2"></i> CREATE STAFF';
    }
};

// ============ EDIT STAFF ============
window.openEditStaff = function(uid) {
    const s = allStaffList.find(x => x.uid === uid);
    if (!s) return;
    document.getElementById('staff-modal-title').textContent = 'Edit Staff';
    document.getElementById('edit-staff-uid').value = uid;
    document.getElementById('staff-name').value = s.name || '';
    document.getElementById('staff-email').value = s.email || '';
    document.getElementById('staff-email').disabled = true;
    document.getElementById('staff-phone').value = s.phone || '';
    document.getElementById('staff-password-field').style.display = 'none';
    document.getElementById('staff-role').value = s.role || 'moderator';
    document.getElementById('staff-modal').classList.remove('hidden');
};

// ============ TOGGLE ACTIVE ============
window.toggleStaffActive = async function(uid) {
    const s = allStaffList.find(x => x.uid === uid);
    if (!s) return;
    if (s.role === 'owner') return toast('Owner-কে disable করা যাবে না', 'error');
    const isActive = s.active !== false;
    if (!confirm(`${s.name}-কে ${isActive ? 'disable' : 'enable'} করবেন?`)) return;
    try {
        await updateDoc(doc(db, "staff", uid), { active: !isActive });
        toast(`Staff ${isActive ? 'disabled' : 'enabled'} ✅`);
        await logActivity(isActive ? 'staff_disabled' : 'staff_enabled', 'staff', uid, s.name, {});
        await loadStaffList();
        renderStaffList();
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

// ============ REMOVE STAFF ============
window.removeStaff = async function(uid) {
    const s = allStaffList.find(x => x.uid === uid);
    if (!s) return;
    if (s.role === 'owner') return toast('Owner-কে remove করা যাবে না', 'error');
    if (!confirm(`${s.name} (${s.email})-কে staff list থেকে remove করবেন?\n\nসে আর login করতে পারবে না। Activity log intact থাকবে।`)) return;
    try {
        await deleteDoc(doc(db, "staff", uid));
        toast('Staff removed ✅', 'warn');
        await logActivity('staff_removed', 'staff', uid, s.name, { email: s.email });
        await loadStaffList();
        renderStaffList();
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

// ============ STAFF DETAIL MODAL ============
window.openStaffDetail = function(uid) {
    const s = allStaffList.find(x => x.uid === uid);
    if (!s) return;
    const role = ROLES[s.role] || ROLES.moderator;
    const colors = ROLE_COLORS[role.color];
    const initials = (s.name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    document.getElementById('staff-detail-avatar').textContent = initials;
    document.getElementById('staff-detail-avatar').className = `w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center text-2xl font-bold ${colors.text}`;
    document.getElementById('staff-detail-name').textContent = s.name || 'Unknown';
    document.getElementById('staff-detail-email').textContent = s.email || '';
    document.getElementById('staff-detail-phone').textContent = s.phone || '—';
    document.getElementById('staff-detail-role').innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] font-bold ${colors.bg} ${colors.text} px-2 py-0.5 rounded-full"><i class="fas fa-${role.icon} text-[9px]"></i> ${role.label}</span>`;
    document.getElementById('staff-detail-desc').textContent = role.desc;

    // Today's activity count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = allActivityList.filter(a => {
        if (a.userId !== uid) return false;
        const t = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        return t >= today;
    }).length;
    document.getElementById('staff-detail-today').textContent = todayCount + ' actions';

    // UID (for reference)
    document.getElementById('staff-detail-uid').textContent = s.uid.substring(0, 16) + '...';

    document.getElementById('staff-detail-edit-btn').setAttribute('onclick', `closeStaffDetail(); openEditStaff('${uid}')`);
    document.getElementById('staff-detail-modal').classList.remove('hidden');
};

window.closeStaffDetail = function() {
    document.getElementById('staff-detail-modal').classList.add('hidden');
};

// ============ ACTIVITY LOG ============
async function initActivityTab() {
    await loadActivity();
    renderActivity();
    populateActivityStaffFilter();
}

window.initActivityTab = initActivityTab;

async function loadActivity() {
    try {
        const q = query(collection(db, "activity_log"), orderBy("timestamp", "desc"), limit(500));
        const snap = await getDocs(q);
        allActivityList = [];
        snap.forEach(d => allActivityList.push({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error('Load activity:', e);
        allActivityList = [];
    }
}

function populateActivityStaffFilter() {
    const sel = document.getElementById('activity-staff-filter');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="all">All Staff</option>';
    allStaffList.forEach(s => {
        const o = document.createElement('option');
        o.value = s.uid;
        o.textContent = s.name + ' (' + (ROLES[s.role]?.label || s.role) + ')';
        sel.appendChild(o);
    });
    if (current) sel.value = current;
}

window.filterActivity = function(type, val) {
    if (type === 'date') currentActivityDate = val;
    if (type === 'staff') currentActivityStaff = val;
    if (type === 'action') currentActivityAction = val;
    renderActivity();
};

window.refreshActivity = async function() {
    await loadActivity();
    renderActivity();
    toast('Activity refreshed');
};

function getFilteredActivity() {
    let filtered = allActivityList.slice();

    // Date filter
    if (currentActivityDate !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(a => {
            const t = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            if (currentActivityDate === 'today') return t >= today;
            if (currentActivityDate === 'yesterday') {
                const yest = new Date(today);
                yest.setDate(yest.getDate() - 1);
                return t >= yest && t < today;
            }
            if (currentActivityDate === 'week') {
                const week = new Date(today);
                week.setDate(week.getDate() - 7);
                return t >= week;
            }
            return true;
        });
    }

    // Staff filter
    if (currentActivityStaff !== 'all') {
        filtered = filtered.filter(a => a.userId === currentActivityStaff);
    }

    // Action filter
    if (currentActivityAction !== 'all') {
        filtered = filtered.filter(a => (a.action || '').startsWith(currentActivityAction));
    }

    return filtered;
}

function getActionMeta(action) {
    const map = {
        login: { icon: 'sign-in-alt', color: 'blue', text: 'Logged in' },
        logout: { icon: 'sign-out-alt', color: 'gray', text: 'Logged out' },
        order_status_changed: { icon: 'exchange-alt', color: 'purple', text: 'Order status changed' },
        order_created: { icon: 'plus-circle', color: 'green', text: 'Order created' },
        order_deleted: { icon: 'trash', color: 'red', text: 'Order deleted' },
        product_created: { icon: 'box', color: 'green', text: 'Product created' },
        product_edited: { icon: 'pen', color: 'blue', text: 'Product edited' },
        product_deleted: { icon: 'trash', color: 'red', text: 'Product deleted' },
        message_replied: { icon: 'reply', color: 'green', text: 'Message replied' },
        staff_created: { icon: 'user-plus', color: 'green', text: 'Staff created' },
        staff_edited: { icon: 'user-edit', color: 'blue', text: 'Staff edited' },
        staff_removed: { icon: 'user-minus', color: 'red', text: 'Staff removed' },
        staff_enabled: { icon: 'user-check', color: 'green', text: 'Staff enabled' },
        staff_disabled: { icon: 'user-slash', color: 'orange', text: 'Staff disabled' },
        settings_changed: { icon: 'cog', color: 'blue', text: 'Settings changed' },
        coupon_created: { icon: 'ticket-alt', color: 'green', text: 'Coupon created' },
        coupon_deleted: { icon: 'ticket-alt', color: 'red', text: 'Coupon deleted' },
        category_created: { icon: 'th-large', color: 'green', text: 'Category created' },
        category_edited: { icon: 'th-large', color: 'blue', text: 'Category edited' },
        category_deleted: { icon: 'th-large', color: 'red', text: 'Category deleted' }
    };
    return map[action] || { icon: 'circle', color: 'gray', text: action || 'Action' };
}

function formatActivityTime(ts) {
    if (!ts) return '';
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        const now = new Date();
        const diffMs = now - d;
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'এইমাত্র';
        if (mins < 60) return mins + ' মিনিট আগে';
        if (mins < 1440) return Math.floor(mins / 60) + ' ঘণ্টা আগে';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
}

function renderActivity() {
    const list = document.getElementById('activity-list');
    if (!list) return;
    const filtered = getFilteredActivity();

    if (filtered.length === 0) {
        list.innerHTML = `<div class="bg-white rounded-2xl p-12 text-center premium-shadow">
            <i class="fas fa-history text-4xl text-gray-200 mb-3"></i>
            <p class="text-sm text-gray-500 mb-2">কোনো activity নেই</p>
            <p class="text-xs text-gray-400">এই filter-এ কোনো record পাওয়া যায়নি</p>
        </div>`;
        return;
    }

    // Group by date
    const grouped = {};
    filtered.forEach(a => {
        const t = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateKey = t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(a);
    });

    let html = '';
    Object.entries(grouped).forEach(([date, items]) => {
        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const yest = new Date(Date.now() - 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        let header = date;
        if (date === today) header = 'আজ (' + date + ')';
        else if (date === yest) header = 'গতকাল (' + date + ')';

        html += `<div class="mb-4">
            <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1 mb-2">${header}</p>
            <div class="bg-white rounded-2xl premium-shadow overflow-hidden divide-y divide-gray-50">`;

        items.forEach(a => {
            const meta = getActionMeta(a.action);
            const colors = {
                blue: 'bg-blue-50 text-blue-600',
                green: 'bg-green-50 text-green-600',
                red: 'bg-red-50 text-red-600',
                orange: 'bg-orange-50 text-orange-600',
                purple: 'bg-purple-50 text-purple-600',
                gray: 'bg-gray-100 text-gray-600'
            };
            const cls = colors[meta.color] || colors.gray;

            let detailText = meta.text;
            if (a.details && typeof a.details === 'object') {
                if (a.details.from && a.details.to) {
                    detailText = `${a.details.from} → ${a.details.to}`;
                } else if (a.details.role) {
                    detailText += ` (${a.details.role})`;
                }
            }

            html += `<div class="flex items-start gap-3 p-3">
                <div class="w-9 h-9 rounded-xl ${cls} flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-${meta.icon} text-xs"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline gap-2 mb-0.5">
                        <p class="text-xs font-bold text-navy truncate">${escapeHtml(a.userName || 'Unknown')}</p>
                        <p class="text-[9px] text-gray-400 flex-shrink-0">${formatActivityTime(a.timestamp)}</p>
                    </div>
                    <p class="text-[11px] text-gray-700">${escapeHtml(detailText)}</p>
                    ${a.targetName ? `<p class="text-[10px] text-gray-500 mt-0.5 truncate"><i class="fas fa-tag text-[8px] mr-1"></i>${escapeHtml(a.targetName)}</p>` : ''}
                </div>
            </div>`;
        });

        html += `</div></div>`;
    });

    list.innerHTML = html;
}

// ============ LOG ACTIVITY HELPER (exported) ============
export async function logActivity(action, targetType, targetId, targetName, details) {
    try {
        if (!activityCurrentUser) return;
        const staffDoc = await getDoc(doc(db, "staff", activityCurrentUser.uid));
        const staffData = staffDoc.exists() ? staffDoc.data() : {};
        const ip = await getIP();

        await addDoc(collection(db, "activity_log"), {
            userId: activityCurrentUser.uid,
            userName: staffData.name || activityCurrentUser.email || 'Unknown',
            userRole: staffData.role || 'unknown',
            action,
            targetType: targetType || '',
            targetId: targetId || '',
            targetName: targetName || '',
            details: details || {},
            ipAddress: ip,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.warn('Log activity failed:', e);
    }
}

// Expose globally too
window.logActivity = logActivity;

// ============ GET CURRENT USER ROLE ============
async function getCurrentUserRole() {
    if (!activityCurrentUser) return null;
    try {
        const snap = await getDoc(doc(db, "staff", activityCurrentUser.uid));
        if (snap.exists()) return snap.data().role || null;
    } catch (e) {}
    return null;
}

// ============ UPDATE DASHBOARD STAFF STATS ============
async function updateDashboardStats() {
    const el = document.getElementById('stat-staff');
    if (el) el.textContent = allStaffList.length;
}

// ============ AUTO-LOG LOGIN ON PAGE LOAD ============
let loginLogged = false;
setTimeout(async () => {
    if (activityCurrentUser && !loginLogged) {
        loginLogged = true;
        await logActivity('login', 'auth', activityCurrentUser.uid, activityCurrentUser.email, {});
    }
}, 2000);

// Also detect login
import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js").then(({ onAuthStateChanged }) => {
    let prev = null;
    onAuthStateChanged(auth, async (user) => {
        if (user && !prev && !loginLogged) {
            loginLogged = true;
            activityCurrentUser = user;
            await logActivity('login', 'auth', user.uid, user.email, {});
        }
        prev = user;
    });
});

console.log('✅ admin-staff.js loaded');