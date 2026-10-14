// ============================================================
// HEARTIX MESSAGES — Admin inbox
// ============================================================
import { db, auth } from './firebase.js';
import { escapeHtml, showToast as toast } from './common.js';

import {
    collection, getDocs, doc, getDoc, updateDoc, deleteDoc,
    query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============ STATE ============
let allMessages = [];
let currentFilter = 'all';
let currentMessageId = null;
let currentMessage = null;

// ============ HELPERS ============
function showSection(id) {
    ['loading-section', 'login-section', 'not-admin-section', 'messages-section'].forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
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

// ============ AUTH ============
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const ok = await verifyAdmin(user.uid);
        if (ok) {
            showSection('messages-section');
            loadMessages();
        } else {
            await signOut(auth);
            showSection('not-admin-section');
        }
    } else {
        showSection('login-section');
    }
});

window.login = async function() {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
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
        document.getElementById('admin-password').value = '';
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

// ============ LOAD MESSAGES ============
window.loadMessages = async function() {
    try {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        allMessages = [];
        snap.forEach(d => allMessages.push({ id: d.id, ...d.data() }));
    } catch (e) {
        // Fallback without orderBy (if index issue)
        try {
            const snap = await getDocs(collection(db, "messages"));
            allMessages = [];
            snap.forEach(d => allMessages.push({ id: d.id, ...d.data() }));
            allMessages.sort((a, b) => {
                const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return tb - ta;
            });
        } catch (e2) {
            console.error(e2);
        }
    }
    const unread = allMessages.filter(m => !m.read).length;
    const unreadEl = document.getElementById('unread-count-text');
    if (unreadEl) unreadEl.textContent = unread + ' unread';
    renderMessages();
};

// ============ FILTER ============
window.filterMessages = function(filter) {
    currentFilter = filter;
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

// ============ RENDER ============
function renderMessages() {
    const list = document.getElementById('messages-list');
    const empty = document.getElementById('empty-state');
    if (!list || !empty) return;

    let filtered = allMessages;
    if (currentFilter === 'unread') filtered = filtered.filter(m => !m.read);
    if (currentFilter === 'read') filtered = filtered.filter(m => m.read);

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

// ============ DETAIL MODAL ============
window.openDetail = async function(id) {
    const m = allMessages.find(x => x.id === id);
    if (!m) return;
    currentMessageId = id;
    currentMessage = m;

    // Mark as read
    if (!m.read) {
        try {
            await updateDoc(doc(db, "messages", id), { read: true });
            m.read = true;
            const unread = allMessages.filter(x => !x.read).length;
            const unreadEl = document.getElementById('unread-count-text');
            if (unreadEl) unreadEl.textContent = unread + ' unread';
            renderMessages();
        } catch (e) {}
    }

    document.getElementById('dm-name').textContent = m.name || 'Unknown';
    document.getElementById('dm-contact').textContent = m.contact || '';
    document.getElementById('dm-subject').textContent = 'Subject: ' + (m.subject || 'General');
    document.getElementById('dm-message').textContent = m.message || '';
    document.getElementById('dm-date').textContent = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString('en-GB') : '';

    // Contact buttons
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
    currentMessageId = null;
    currentMessage = null;
};

// ============ DELETE ============
window.deleteCurrentMessage = async function() {
    if (!currentMessageId) return;
    if (!confirm('এই message ডিলিট করবেন?')) return;
    try {
        await deleteDoc(doc(db, "messages", currentMessageId));
        toast('Message deleted', 'warn');
        closeDetail();
        await loadMessages();
    } catch (e) {
        toast('ডিলিট করা যায়নি', 'error');
    }
};