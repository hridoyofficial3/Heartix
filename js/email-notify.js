// ============================================================
// HEARTIX EMAIL NOTIFICATIONS — EmailJS Integration
// ============================================================
import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let emailJSLoaded = false;
let emailJSConfig = null;

// ============ LOAD CONFIG FROM FIRESTORE ============
async function loadConfig() {
    if (emailJSConfig) return emailJSConfig;
    try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (snap.exists()) {
            const int = snap.data().integrations || {};
            emailJSConfig = int.emailjs || null;
        }
    } catch (e) {
        console.warn('EmailJS config load failed:', e);
    }
    return emailJSConfig;
}

// ============ LOAD EMAILJS SDK DYNAMICALLY ============
async function loadEmailJSSDK() {
    if (emailJSLoaded && window.emailjs) return;
    return new Promise((resolve, reject) => {
        if (window.emailjs) { emailJSLoaded = true; resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        s.onload = () => { emailJSLoaded = true; resolve(); };
        s.onerror = () => reject(new Error('EmailJS SDK load failed'));
        document.head.appendChild(s);
    });
}

// ============ ENSURE READY (config + SDK) ============
async function ensureReady() {
    const config = await loadConfig();
    if (!config || !config.enabled) return null;
    if (!config.publicKey || !config.serviceId) return null;
    try {
        await loadEmailJSSDK();
        if (window.emailjs && window.emailjs.init) {
            window.emailjs.init({ publicKey: config.publicKey });
        }
        return config;
    } catch (e) {
        console.warn('EmailJS init failed:', e);
        return null;
    }
}

// ============ SEND ADMIN ALERT ============
export async function sendAdminAlert(orderData) {
    try {
        const config = await ensureReady();
        if (!config || !config.adminTemplateId) return;

        await window.emailjs.send(config.serviceId, config.adminTemplateId, {
            order_number: orderData.orderNumber || '',
            customer_name: orderData.customerName || '',
            customer_phone: orderData.customerPhone || '',
            customer_address: orderData.customerAddress || '',
            total: orderData.total || 0,
            to_email: config.adminEmail || ''
        });
        console.log('✅ Admin alert email sent');
    } catch (e) {
        console.warn('Admin email failed:', e);
    }
}

// ============ SEND CUSTOMER EMAIL ============
export async function sendCustomerEmail(orderData) {
    try {
        const config = await ensureReady();
        if (!config || !config.customerTemplateId) return;
        if (!orderData.customerEmail) return;

        await window.emailjs.send(config.serviceId, config.customerTemplateId, {
            to_email: orderData.customerEmail,
            custom_subject: orderData.customSubject || '',
            status_message: orderData.statusMessage || '',
            status_description: orderData.statusDescription || '',
            customer_name: orderData.customerName || '',
            order_number: orderData.orderNumber || '',
            total: orderData.total || 0
        });
        console.log('✅ Customer email sent');
    } catch (e) {
        console.warn('Customer email failed:', e);
    }
}

// ============ WRAPPER: ORDER PLACED ============
export async function notifyOrderPlaced(orderData) {
    await Promise.all([
        sendAdminAlert(orderData),
        sendCustomerEmail({
            ...orderData,
            customSubject: `Your order received — Heartix ${orderData.orderNumber}`,
            statusMessage: '✅ Order Placed Successfully!',
            statusDescription: 'We have received your order. Our team will call you shortly to confirm.'
        })
    ]);
}

// ============ WRAPPER: STATUS CHANGE ============
export async function notifyStatusChange(orderData) {
    const statusMap = {
        'pending':    { msg: '⏳ Order Pending',      desc: 'Your order is pending confirmation.' },
        'confirmed':  { msg: '✅ Order Confirmed!',   desc: 'Your order is confirmed. Delivery in 2-3 days.' },
        'shipped':    { msg: '🚚 Order Shipped!',     desc: 'Your order has been shipped and is on the way.' },
        'delivered':  { msg: '📦 Order Delivered!',   desc: 'Your order has been delivered successfully. Thank you!' },
        'cancelled':  { msg: '❌ Order Cancelled',    desc: 'Your order has been cancelled. Contact us for more info.' }
    };
    const info = statusMap[orderData.newStatus] || statusMap.pending;

    await sendCustomerEmail({
        ...orderData,
        customSubject: `Order ${(orderData.newStatus || '').toUpperCase()} — Heartix ${orderData.orderNumber}`,
        statusMessage: info.msg,
        statusDescription: info.desc
    });
}

// ============ PUBLIC: Reset cache ============
export function resetEmailConfigCache() {
    emailJSConfig = null;
}

console.log('✅ email-notify.js loaded');