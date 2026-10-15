// ============================================================
// HEARTIX ADMIN — Staff Management (Activity handled by admin-activity.js)
// ============================================================
import { db, auth } from './firebase.js';
import { escapeHtml, showToast as toast } from './common.js';
import { logActivity } from './staff-activity.js';

import {
    collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Secondary Firebase app for creating users without logging out admin
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth as getSecondaryAuth,
    createUserWithEmailAndPassword as createSecondaryUser,
    signOut as secondarySignOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
let currentUser = null;

// ============ AUTH REFERENCE ============
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    // Update dashboard staff count once we know user is logged in
    if (user) setTimeout(loadStaffListSilently, 500);
});

// ============ GET CURRENT USER ROLE ============
async function getCurrentUserRole() {
    if (!currentUser) return null;
    try {
        const snap = await getDoc(doc(db, "staff", currentUser.uid));
        if (snap.exists()) return snap.data().role || null;
    } catch (e) {}
    return null;
}

// ============ SILENT LOAD (for stats) ============
async function loadStaffListSilently() {
    try {
        const snap = await getDocs(collection(db, "staff"));
        allStaffList = [];
        snap.forEach(d => allStaffList.push({ uid: d.id, ...d.data() }));
        updateDashboardStats();
    } catch (e) { /* silent */ }
}

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
    updateDashboardStats();
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
            await logActivity('staff_edit', {
                description: `Staff update: ${name} (${role})`,
                meta: { uid: editUid, name, role }
            });
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
            await logActivity('staff_add', {
                description: `নতুন staff: ${name} (${role})`,
                meta: { uid: newUser.uid, name, email, role }
            });
        }

        closeStaffModal();
        await loadStaffList();
        renderStaffList();
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
        await logActivity(isActive ? 'staff_disable' : 'staff_edit', {
            description: `${isActive ? 'Disable' : 'Enable'} staff: ${s.name}`,
            meta: { uid, name: s.name, action: isActive ? 'disable' : 'enable' }
        });
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
        await logActivity('staff_remove', {
            description: `Staff remove: ${s.name} (${s.email})`,
            meta: { uid, name: s.name, email: s.email }
        });
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
    document.getElementById('staff-detail-today').textContent = '—';

    // UID (for reference)
    document.getElementById('staff-detail-uid').textContent = s.uid.substring(0, 16) + '...';

    document.getElementById('staff-detail-edit-btn').setAttribute('onclick', `closeStaffDetail(); openEditStaff('${uid}')`);
    document.getElementById('staff-detail-modal').classList.remove('hidden');
};

window.closeStaffDetail = function() {
    document.getElementById('staff-detail-modal').classList.add('hidden');
};

// ============ UPDATE DASHBOARD STATS ============
function updateDashboardStats() {
    const el = document.getElementById('stat-staff');
    if (el) el.textContent = allStaffList.length;
    const badge = document.getElementById('staff-count-badge');
    if (badge) badge.textContent = allStaffList.length;
}

// ============ WRAP showTab ============
function initStaffModule() {
    if (typeof window.showTab === 'function' && !window._staffHooked) {
        const orig = window.showTab;
        window.showTab = function(tab) {
            orig.apply(this, arguments);
            if (tab === 'staff') setTimeout(initStaffTab, 100);
        };
        window._staffHooked = true;
    }
}

// Retry wrapping showTab since admin.js loads first but module init order can vary
setTimeout(initStaffModule, 300);
setTimeout(initStaffModule, 1000);
setTimeout(initStaffModule, 2500);

console.log('✅ admin-staff.js loaded (Staff only — activity via admin-activity.js)');