// ============================================================
// HEARTIX MODERATOR PANEL — Read-only + Status Update
// ============================================================
import { db, auth } from './firebase.js';
import { escapeHtml, formatPrice as fmt, showToast as toast } from './common.js';

import {
    collection, getDocs, doc, getDoc, updateDoc,
    query, orderBy, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============ STATE ============
let allOrdersList = [];
let allMessagesList = [];
let allProductsList = [];
let currentOrderFilter = 'all';
let currentMessageFilter = 'all';
let currentUser = null;
let statusPickerOrderId = null;
let pendingStatusChange = null;

// ============ HELPERS ============
function showSection(id) {
    ['loading-section', 'login-section', 'not-moderator-section', 'dashboard-section'].forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
}

async function verifyModerator(uid) {
    try {
        // Check moderator list
        const mSnap = await getDoc(doc(db, "settings", "moderators"));
        if (mSnap.exists()) {
            const uids = mSnap.data().uids || [];
            if (Array.isArray(uids) && uids.includes(uid)) return true;
        }
        // Also allow admins
        const aSnap = await getDoc(doc(db, "settings", "admins"));
        if (aSnap.exists()) {
            const uids = aSnap.data().uids || [];
            if (Array.isArray(uids) && uids.includes(uid)) return true;
        }
    } catch (e) {}
    return false;
}

// ============ AUTH ============
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const ok = await verifyModerator(user.uid);
        if (ok) {
            const ed = document.getElementById('moderator-email-display');
            if (ed) ed.textContent = user.email || '';
            showSection('dashboard-section');
            loadAllData();
        } else {
            await signOut(auth);
            showSection('not-moderator-section');
        }
    } else {
        currentUser = null;
        showSection('login-section');
    }
});

window.login = async function() {
    const email = (document.getElementById('mod-email').value || '').trim();
    const password = document.getElementById('mod-password').value || '';
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');
    if (!email || !password) {
        errEl.textContent = 'ইমেইল ও পাসওয়ার্ড দিন';
        errEl.classList.remove('hidden');
        return;
    }
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing in...';
    try {
        await signInWithEmailAndPassword(auth, email, password);
        document.getElementById('mod-password').value = '';
    } catch (e) {
        let msg = 'লগইন ব্যর্থ';
        if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'ইমেইল বা পাসওয়ার্ড ভুল';
        else if (e.code === 'auth/user-not-found') msg = 'এই ইমেইলে ইউজার নেই';
        else if (e.code === 'auth/invalid-email') msg = 'সঠিক ইমেইল দিন';
        else if (e.code === 'auth/too-many-requests') msg = 'অনেকবার ভুল — কিছুক্ষণ পর চেষ্টা';
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> SIGN IN';
    }
};

window.logout = async function() {
    try { await signOut(auth); } catch (e) {}
    location.reload();
};

window.showTab = function(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const c = document.getElementById('content-' + tab);
    if (c) {
        c.classList.remove('hidden');
        c.classList.add('animate-fade-in');
    }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============ LOAD ALL DATA ============
async function loadAllData() {
    await Promise.all([
        loadOrders(),
        loadMessages(),
        loadProducts()
    ]);
    updateStats();
}

// ============ ORDERS ============
async function loadOrders() {
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        allOrdersList = [];
        snap.forEach(d => allOrdersList.push({ id: d.id, ...d.data() }));
        renderAdminOrders();
        renderRecentOrders();
        updateOrderBadge();
    } catch (e) {
        console.error('Load orders:', e);
    }
}

function updateOrderBadge() {
    const pending = allOrdersList.filter(o => o.status === 'pending').length;
    const b1 = document.getElementById('orders-badge');
    const b2 = document.getElementById('orders-badge-mob');
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
        b.classList.remove('bg-navy', 'text-white');
        b.classList.add('bg-white', 'text-gray-600');
    });
    btn.classList.add('bg-navy', 'text-white');
    btn.classList.remove('bg-white', 'text-gray-600');
    renderAdminOrders();
};

function renderAdminOrders() {
    const list = document.getElementById('order-list-admin');
    if (!list) return;
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
        const fullAddress = [o.customer?.address, o.customer?.thana, o.customer?.district].filter(Boolean).join(', ');

        let badges = '';
        if (o.customer?.isRepeat) badges += `<span class="inline-flex items-center gap-1 text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full"><i class="fas fa-repeat text-[8px]"></i> Repeat (${o.customer.orderCount || '?'})</span>`;
        else badges += `<span class="inline-flex items-center gap-1 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full"><i class="fas fa-star text-[8px]"></i> New</span>`;
        if (o.customer?.flagged) badges += `<span class="inline-flex items-center gap-1 text-[9px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full"><i class="fas fa-exclamation-triangle text-[8px]"></i> Same IP</span>`;

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
                    <button onclick="openStatusPicker('${o.id}')" class="w-full border-2 border-gray-100 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between hover:border-gold transition"><span class="flex items-center gap-2 text-gray-700"><i class="fas fa-exchange-alt"></i> Change Status</span><i class="fas fa-chevron-right text-gray-400 text-[10px]"></i></button>
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

function renderRecentOrders() {
    const list = document.getElementById('recent-orders');
    if (!list) return;
    const recent = allOrdersList.slice(0, 3);
    if (recent.length === 0) {
        list.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No orders yet</p>';
        return;
    }
    let html = '';
    recent.forEach(o => {
        const sc = 'status-' + (o.status || 'pending');
        html += `<div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"><div class="min-w-0 flex-1"><p class="text-sm font-semibold text-navy truncate">${escapeHtml(o.customer?.name || '')}</p><p class="text-[11px] text-gray-500">${(o.items || []).length} item(s) • ৳${fmt(o.total)}</p></div><span class="order-status ${sc} ml-2">${o.status || 'pending'}</span></div>`;
    });
    list.innerHTML = html;
}

// ============ STATUS PICKER ============
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
    const colorMap = {
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' }
    };
    let html = '';
    statuses.forEach(s => {
        const isActive = s.key === current;
        const c = colorMap[s.color];
        html += `<button onclick="selectStatus('${s.key}')" class="w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ${isActive ? `${c.bg} ${c.border}` : 'bg-white border-gray-100 hover:border-gray-200'}"><div class="w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0"><i class="fas fa-${s.icon} ${c.text}"></i></div><div class="flex-1 min-w-0"><p class="font-bold text-sm text-navy">${s.label}</p><p class="text-[11px] text-gray-500 mt-0.5">${s.desc}</p></div>${isActive ? `<i class="fas fa-circle-check ${c.text} text-lg"></i>` : `<i class="far fa-circle text-gray-300 text-lg"></i>`}</button>`;
    });
    document.getElementById('status-options-list').innerHTML = html;
    document.getElementById('status-picker-modal').classList.remove('hidden');
};

window.closeStatusPicker = function() {
    document.getElementById('status-picker-modal').classList.add('hidden');
    statusPickerOrderId = null;
};

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
};

window.closeStatusConfirm = function() {
    document.getElementById('status-confirm-modal').classList.add('hidden');
    pendingStatusChange = null;
};

window.confirmStatusChange = async function() {
    if (!pendingStatusChange) return;
    const { orderId, newStatus } = pendingStatusChange;
    const btn = document.getElementById('sc-confirm-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Updating...';
    try {
        const order = allOrdersList.find(x => x.id === orderId);
        const oldStatus = order?.status;
        // Handle stock restore on cancel
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
        closeStatusConfirm();
        await loadOrders();
        updateStats();
    } catch (e) {
        toast("Error: " + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Confirm';
    }
};

// ============ PRODUCTS (read-only) ============
async function loadProducts() {
    try {
        const snap = await getDocs(collection(db, "products"));
        allProductsList = [];
        snap.forEach(d => allProductsList.push({ id: d.id, ...d.data() }));
    } catch (e) {}
}

// ============ MESSAGES ============
async function loadMessages() {
    try {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        allMessagesList = [];
        snap.forEach(d => allMessagesList.push({ id: d.id, ...d.data() }));
    } catch (e) {
        try {
            const snap = await getDocs(collection(db, "messages"));
            allMessagesList = [];
            snap.forEach(d => allMessagesList.push({ id: d.id, ...d.data() }));
            allMessagesList.sort((a, b) => {
                const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return tb - ta;
            });
        } catch (e2) {}
    }
    updateMessagesBadge();
    renderMessages();
}

function updateMessagesBadge() {
    const unread = allMessagesList.filter(m => !m.read).length;
    const t1 = document.getElementById('unread-count-text');
    if (t1) t1.textContent = unread + ' unread';
    const b1 = document.getElementById('messages-badge-sidebar');
    const b2 = document.getElementById('messages-badge-mob');
    if (unread > 0) {
        if (b1) { b1.textContent = unread; b1.classList.remove('hidden'); }
        if (b2) { b2.textContent = unread; b2.classList.remove('hidden'); }
    } else {
        if (b1) b1.classList.add('hidden');
        if (b2) b2.classList.add('hidden');
    }
}

window.filterMessages = function(filter) {
    currentMessageFilter = filter;
    ['all', 'unread', 'read'].forEach(f => {
        const btn = document.getElementById('filter-' + f);
        if (!btn) return;
        if (f === filter) {
            btn.classList.remove('bg-white', 'text-gray-600');
            btn.classList.add('bg-navy', 'text-white');
        } else {
            btn.classList.add('bg-white', 'text-gray-600');
            btn.classList.remove('bg-navy', 'text-white');
        }
    });
    renderMessages();
};

function renderMessages() {
    const list = document.getElementById('messages-list');
    const empty = document.getElementById('empty-state');
    if (!list || !empty) return;

    let filtered = allMessagesList;
    if (currentMessageFilter === 'unread') filtered = filtered.filter(m => !m.read);
    if (currentMessageFilter === 'read') filtered = filtered.filter(m => m.read);

    if (filtered.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    let html = '';
    filtered.forEach(m => {
        const date = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
        const unreadCls = !m.read ? 'border-l-4 border-gold bg-yellow-50/40' : 'border-l-4 border-gray-200';
        html += `<div onclick="openDetail('${m.id}')" class="msg-card bg-white rounded-2xl p-4 premium-shadow ${unreadCls} cursor-pointer">
            <div class="flex justify-between items-start mb-2 gap-2">
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        ${!m.read ? '<span class="unread-dot"></span>' : ''}
                        <p class="font-bold text-navy text-sm truncate">${escapeHtml(m.name || 'Unknown')}</p>
                    </div>
                    <p class="text-[11px] text-gray-500 mt-0.5 truncate">${escapeHtml(m.contact || '')}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <span class="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">${escapeHtml(m.subject || 'General')}</span>
                    ${date ? `<p class="text-[10px] text-gray-400 mt-1">${date}</p>` : ''}
                </div>
            </div>
            <p class="text-xs text-gray-600 line-clamp-2">${escapeHtml((m.message || '').substring(0, 120))}${(m.message || '').length > 120 ? '...' : ''}</p>
        </div>`;
    });
    list.innerHTML = html;
}

window.openDetail = async function(id) {
    const m = allMessagesList.find(x => x.id === id);
    if (!m) return;
    // Mark as read
    if (!m.read) {
        try {
            await updateDoc(doc(db, "messages", id), { read: true });
            m.read = true;
            updateMessagesBadge();
            renderMessages();
        } catch (e) {}
    }
    document.getElementById('dm-name').textContent = m.name || 'Unknown';
    document.getElementById('dm-contact').textContent = m.contact || '';
    document.getElementById('dm-subject').textContent = 'Subject: ' + (m.subject || 'General');
    document.getElementById('dm-message').textContent = m.message || '';
    document.getElementById('dm-date').textContent = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString('en-GB') : '';

    const contact = (m.contact || '').trim();
    const isPhone = /^01[3-9]\d{8}$/.test(contact.replace(/\s+/g, ''));
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);

    const callBtn = document.getElementById('dm-call-btn');
    const waBtn = document.getElementById('dm-wa-btn');
    const emailBtn = document.getElementById('dm-email-btn');

    if (isPhone) {
        callBtn.style.display = 'flex';
        callBtn.href = 'tel:' + contact;
        waBtn.style.display = 'flex';
        waBtn.href = 'https://wa.me/88' + contact.replace(/^0/, '') + '?text=' + encodeURIComponent('Hi ' + (m.name || '') + ', thanks for contacting Heartix');
        emailBtn.style.display = 'none';
    } else if (isEmail) {
        callBtn.style.display = 'none';
        waBtn.style.display = 'none';
        emailBtn.style.display = 'flex';
        emailBtn.href = 'mailto:' + contact + '?subject=' + encodeURIComponent('Re: ' + (m.subject || 'Your message'));
    } else {
        callBtn.style.display = 'none';
        waBtn.style.display = 'none';
        emailBtn.style.display = 'none';
    }

    document.getElementById('detail-modal').classList.remove('hidden');
};

window.closeDetail = function() {
    document.getElementById('detail-modal').classList.add('hidden');
};

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

// ============ INITIAL ============
const origRenderAdminOrders = renderAdminOrders;
window.renderAdminOrders = origRenderAdminOrders; // Export for search input

console.log('✅ moderator.js loaded');