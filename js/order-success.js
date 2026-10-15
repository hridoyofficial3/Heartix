// ============================================================
// HEARTIX ORDER SUCCESS PAGE — with WhatsApp Confirm
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
const waConfirmBtn = document.getElementById('wa-confirm-btn');

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

// ============ LOAD SETTINGS + ORDER + BUILD WHATSAPP LINK ============
async function loadWhatsAppConfirm() {
    if (!db || !orderNum) return;

    try {
        // Load settings + order in parallel
        const [settingsSnap, orderSnap] = await Promise.all([
            getDoc(doc(db, "settings", "main")).catch(() => null),
            getDoc(doc(db, "orders", "?")).catch(() => null) // placeholder
        ]);

        let waNumber = '';
        let waEnabled = false;
        if (settingsSnap && settingsSnap.exists()) {
            const s = settingsSnap.data();
            const int = s.integrations || {};
            const wa = int.whatsapp || {};
            waEnabled = !!wa.enabled;
            waNumber = (wa.number || '').replace(/\D/g, '');
        }

        if (!waEnabled || !waNumber) return;

        // Try to find the order by orderNumber (query required)
        let orderData = null;
        try {
            const ordersQ = await getOrderByNumber(orderNum);
            if (ordersQ) orderData = ordersQ;
        } catch (e) { /* silent */ }

        // Build WhatsApp message
        let message = `Hi Heartix,\n\nআমি আমার অর্ডার কনফার্ম করতে চাই।\n\n`;
        message += `📦 Order Number: ${orderNum}\n`;

        if (orderData) {
            if (orderData.customer?.name) message += `👤 Name: ${orderData.customer.name}\n`;
            if (orderData.total) message += `💰 Total: ৳${orderData.total}\n`;
            if (orderData.paymentMethod) {
                const methodMap = {
                    'full-cod': 'Cash on Delivery',
                    'delivery-advance': 'Delivery Charge Advance',
                    'full-online': 'Full Online Payment'
                };
                message += `💳 Payment: ${methodMap[orderData.paymentMethod] || orderData.paymentMethod}\n`;
            }
            if (orderData.items && orderData.items.length > 0) {
                message += `\n🛒 Items (${orderData.items.length}):\n`;
                orderData.items.slice(0, 5).forEach(it => {
                    message += `  • ${it.name} × ${it.quantity}\n`;
                });
                if (orderData.items.length > 5) {
                    message += `  ...এবং আরো ${orderData.items.length - 5} টি\n`;
                }
            }
        }

        message += `\nদয়া করে আমার অর্ডার কনফার্ম করুন। ধন্যবাদ!`;

        const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
        if (waConfirmBtn) {
            waConfirmBtn.href = waLink;
            waConfirmBtn.classList.remove('hidden');
        }
    } catch (e) {
        console.warn('WhatsApp confirm setup failed:', e);
    }
}

// Helper to find order by orderNumber
async function getOrderByNumber(num) {
    try {
        const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
        const q = query(collection(db, "orders"), where("orderNumber", "==", num));
        const snap = await getDocs(q);
        if (!snap.empty) {
            return { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
    } catch (e) {
        console.warn('Order lookup failed:', e);
    }
    return null;
}

// ============ INIT ============
loadWhatsAppConfirm();

console.log('✅ order-success.js loaded (with WhatsApp confirm)');