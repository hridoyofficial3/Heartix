// ============================================================
// HEARTIX CHECKOUT — WhatsApp Order Alternative
// ============================================================
import { db } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getCart, validatePhone
} from './common.js';

import {
    doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let waConfig = { enabled: false, number: '' };

// ============ LOAD CONFIG ============
async function loadWhatsAppConfig() {
    if (!db) {
        toggleButton();
        return;
    }
    try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (snap.exists()) {
            const int = snap.data().integrations || {};
            const wa = int.whatsapp || {};
            waConfig.enabled = !!wa.enabled;
            waConfig.number = String(wa.number || '').replace(/\D/g, '');
        }
    } catch (e) {
        console.warn('WhatsApp config load failed:', e);
    }
    toggleButton();
}

function toggleButton() {
    const btn = document.getElementById('order-wa-btn');
    if (!btn) return;
    const shouldShow = waConfig.enabled && waConfig.number && /^88\d{10,13}$/.test(waConfig.number);
    if (shouldShow) {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
}

// ============ VALIDATION ============
function getFormData() {
    return {
        name: (document.getElementById('customer-name').value || '').trim(),
        phone: (document.getElementById('customer-phone').value || '').trim(),
        email: (document.getElementById('customer-email').value || '').trim(),
        address: (document.getElementById('customer-address').value || '').trim(),
        district: document.getElementById('customer-district').value || '',
        thana: (document.getElementById('customer-thana').value || '').trim(),
        paymentMethod: document.querySelector('input[name="payment"]:checked')?.value || 'full-cod'
    };
}

function validateForm(data) {
    if (!data.name || data.name.length < 2) {
        showToast('সঠিক নাম দিন', 'error');
        return false;
    }
    if (!validatePhone(data.phone)) {
        showToast('সঠিক ফোন নাম্বার দিন (01XXXXXXXXX)', 'error');
        return false;
    }
    if (!data.address || data.address.length < 5) {
        showToast('সম্পূর্ণ ঠিকানা দিন', 'error');
        return false;
    }
    return true;
}

// ============ BUILD MESSAGE ============
function buildMessage(form, cart) {
    const methodMap = {
        'full-cod': 'ক্যাশ অন ডেলিভারি',
        'delivery-advance': 'শুধু ডেলিভারি চার্জ অগ্রিম',
        'full-online': 'সম্পূর্ণ অনলাইন পেমেন্ট'
    };

    let msg = `🛍️ *Heartix Order Request*\n`;
    msg += `━━━━━━━━━━━━━━━━━\n\n`;

    // Customer info
    msg += `👤 *Customer Info:*\n`;
    msg += `নাম: ${form.name}\n`;
    msg += `📱 ফোন: ${form.phone}\n`;
    if (form.email) msg += `✉️ ইমেইল: ${form.email}\n`;
    msg += `📍 ঠিকানা: ${form.address}`;
    if (form.thana) msg += `, ${form.thana}`;
    if (form.district) msg += `, ${form.district}`;
    msg += `\n\n`;

    // Items
    msg += `🛒 *Order Items:*\n`;
    let subtotal = 0;
    cart.forEach((item, i) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.quantity) || 1;
        const lineTotal = price * qty;
        subtotal += lineTotal;
        msg += `${i + 1}. ${item.name}\n`;
        msg += `   ৳${price} × ${qty} = ৳${lineTotal}\n`;
    });
    msg += `\n`;

    // Totals
    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Subtotal:* ৳${formatPrice(subtotal)}\n`;

    // Delivery info (read from page if possible)
    const deliveryEl = document.getElementById('checkout-delivery');
    const totalEl = document.getElementById('checkout-total');
    const discountRow = document.getElementById('checkout-discount-row');
    const discountEl = document.getElementById('checkout-discount');
    const couponBadge = document.getElementById('checkout-coupon-badge');

    if (discountRow && !discountRow.classList.contains('hidden') && discountEl) {
        msg += `🎟️ *Discount${couponBadge ? ' (' + couponBadge.textContent + ')' : ''}:* ${discountEl.textContent}\n`;
    }

    if (deliveryEl) {
        msg += `🚚 *Delivery:* ${deliveryEl.textContent}\n`;
    }

    if (totalEl) {
        msg += `\n✨ *Total:* ${totalEl.textContent}\n`;
    }

    msg += `\n`;

    // Payment
    msg += `💳 *Payment Method:* ${methodMap[form.paymentMethod] || form.paymentMethod}\n\n`;

    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `দয়া করে আমার অর্ডারটি কনফার্ম করুন।\nধন্যবাদ! 🙏`;

    return msg;
}

// ============ PUBLIC: ORDER VIA WHATSAPP ============
window.orderViaWhatsApp = function() {
    if (!waConfig.enabled || !waConfig.number) {
        return showToast('WhatsApp order বন্ধ আছে', 'warn');
    }

    const cart = getCart();
    if (cart.length === 0) {
        return showToast('আপনার কার্ট খালি!', 'error');
    }

    const form = getFormData();
    if (!validateForm(form)) return;

    const message = buildMessage(form, cart);
    const url = `https://wa.me/${waConfig.number}?text=${encodeURIComponent(message)}`;

    try {
        window.open(url, '_blank', 'noopener,noreferrer');
        showToast('WhatsApp-এ নিয়ে যাওয়া হচ্ছে...', 'success');
    } catch (e) {
        console.error('WhatsApp open failed:', e);
        showToast('WhatsApp খোলা যায়নি', 'error');
    }
};

// ============ INIT ============
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWhatsAppConfig);
} else {
    loadWhatsAppConfig();
}

console.log('✅ checkout-whatsapp.js loaded');