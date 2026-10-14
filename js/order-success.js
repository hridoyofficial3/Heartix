// ============================================================
// HEARTIX ORDER SUCCESS PAGE
// ============================================================
import { db } from './firebase.js';
import { showToast } from './common.js';

import {
    doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ GET ORDER NUMBER FROM URL ============
const params = new URLSearchParams(window.location.search);
const orderNum = (params.get('order') || '').trim().toUpperCase();

const orderEl = document.getElementById('order-number');
const trackBtn = document.getElementById('track-btn');

if (orderNum) {
    if (orderEl) orderEl.textContent = orderNum;
    if (trackBtn) trackBtn.href = 'track-order.html?order=' + encodeURIComponent(orderNum);
} else {
    if (orderEl) orderEl.textContent = 'HX--------';
    if (trackBtn) trackBtn.href = 'track-order.html';
}

// ============ COPY ORDER NUMBER ============
window.copyOrderNumber = function(e) {
    const text = orderEl ? orderEl.textContent : '';
    if (!text || text === 'HX--------') return;

    const doCopy = (success) => {
        const btn = e && e.target ? e.target.closest('button') : null;
        if (!btn) return;
        const orig = btn.innerHTML;
        if (success) {
            btn.innerHTML = '<i class="fas fa-check mr-1"></i> কপি হয়েছে!';
            showToast('অর্ডার নাম্বার কপি হয়েছে', 'success');
        } else {
            btn.innerHTML = '<i class="fas fa-times mr-1"></i> ব্যর্থ';
            showToast('কপি করা যায়নি', 'error');
        }
        setTimeout(() => { btn.innerHTML = orig; }, 1500);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => doCopy(true)).catch(() => doCopy(false));
    } else {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            doCopy(true);
        } catch (err) {
            doCopy(false);
        }
    }
};

// ============ LOAD SETTINGS (WhatsApp) ============
async function loadSettings() {
    if (!db) return;
    try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (snap.exists()) {
            const s = snap.data();
            if (s.whatsapp) {
                document.getElementById('wa-line').classList.remove('hidden');
                const waMsg = encodeURIComponent(`Hi, my order number is: ${orderNum || '(unknown)'}`);
                document.getElementById('wa-link').href = `https://wa.me/${s.whatsapp}?text=${waMsg}`;
            }
        }
    } catch (e) { console.warn('Settings fetch:', e); }
}

// ============ INIT ============
loadSettings();