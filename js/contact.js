// ============================================================
// HEARTIX CONTACT PAGE — Form + Settings
// ============================================================
import { db } from './firebase.js';
import { escapeHtml, showToast } from './common.js';

import {
    collection, addDoc, doc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let settings = {};

// ============ INITIAL CART BADGE ============
(function() {
    try {
        const cart = JSON.parse(localStorage.getItem('heartix_cart') || '[]');
        const count = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
        const h = document.getElementById('cart-count-header');
        if (h) h.textContent = count;
    } catch (e) {}
})();

// ============ CHARACTER COUNTER ============
document.addEventListener('DOMContentLoaded', function() {
    const msg = document.getElementById('cf-message');
    const count = document.getElementById('cf-char-count');
    if (msg && count) {
        msg.addEventListener('input', function() {
            count.textContent = this.value.length;
        });
    }
});

// ============ LOAD SETTINGS ============
async function loadSettings() {
    if (!db) return;
    try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (snap.exists()) {
            settings = snap.data();
            applySettings();
        }
    } catch (e) { console.warn('Settings:', e); }
}

function applySettings() {
    // Phone
    if (settings.contactPhone) {
        const phoneText = document.getElementById('phone-text');
        const phoneCard = document.getElementById('phone-card');
        if (phoneText) phoneText.textContent = settings.contactPhone;
        if (phoneCard) phoneCard.href = 'tel:' + settings.contactPhone.replace(/\s+/g, '');
    }

    // WhatsApp
    if (settings.whatsapp) {
        const waText = document.getElementById('wa-text');
        const waCard = document.getElementById('wa-card');
        if (waText) waText.textContent = '+' + settings.whatsapp;
        const waMsg = encodeURIComponent('Hi, I need help with Heartix');
        if (waCard) waCard.href = 'https://wa.me/' + settings.whatsapp + '?text=' + waMsg;
    }

    // Email
    if (settings.contactEmail) {
        const emailText = document.getElementById('email-text');
        const emailCard = document.getElementById('email-card');
        if (emailText) emailText.textContent = settings.contactEmail;
        if (emailCard) emailCard.href = 'mailto:' + settings.contactEmail;
    }

    // Address
    if (settings.contactAddress) {
        const addressText = document.getElementById('address-text');
        if (addressText) addressText.textContent = settings.contactAddress;
    }

    // Facebook
    if (settings.facebook) {
        const fbCard = document.getElementById('fb-card');
        if (fbCard) {
            fbCard.classList.remove('hidden');
            fbCard.classList.add('flex');
            fbCard.href = settings.facebook;
        }
    }
}

// ============ CONTACT FORM SUBMIT ============
window.submitContactForm = async function() {
    const name = (document.getElementById('cf-name').value || '').trim();
    const contact = (document.getElementById('cf-contact').value || '').trim();
    const subject = document.getElementById('cf-subject').value;
    const message = (document.getElementById('cf-message').value || '').trim();

    if (!name || name.length < 2) return showToast('আপনার নাম দিন', 'error');
    if (!contact || contact.length < 5) return showToast('ফোন বা ইমেইল দিন', 'error');
    if (!message || message.length < 5) return showToast('বার্তা লিখুন (কমপক্ষে ৫ অক্ষর)', 'error');
    if (message.length > 1000) return showToast('বার্তা অনেক বড়', 'error');

    if (!db) return showToast('সার্ভার সংযোগ নেই', 'error');

    const btn = document.getElementById('cf-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';

    try {
        await addDoc(collection(db, "messages"), {
            name: name,
            contact: contact,
            subject: subject,
            message: message,
            read: false,
            createdAt: serverTimestamp()
        });

        showToast('বার্তা পাঠানো হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।', 'success');

        // Clear form
        document.getElementById('cf-name').value = '';
        document.getElementById('cf-contact').value = '';
        document.getElementById('cf-subject').value = 'General';
        document.getElementById('cf-message').value = '';
        document.getElementById('cf-char-count').textContent = '0';
    } catch (e) {
        console.error('Contact error:', e);
        showToast('বার্তা পাঠানো যায়নি, আবার চেষ্টা করুন', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> SEND MESSAGE';
    }
};

// ============ FALLBACK (before module fully loads) ============
if (typeof window.submitContactForm !== 'function') {
    window.submitContactForm = function() {
        alert('Firebase লোড হচ্ছে... কিছুক্ষণ পর চেষ্টা করুন');
    };
}

// ============ INIT ============
loadSettings();