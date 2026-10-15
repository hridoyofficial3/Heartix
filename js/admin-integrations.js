// ============================================================
// HEARTIX ADMIN — Integrations (GA + FB + EmailJS + WhatsApp + SMS + bKash + Nagad)
// ============================================================
import { db } from './firebase.js';
import { showToast as toast } from './common.js';
import {
    doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import './admin-back-trap.js';
import './admin-bulk.js';

function wrapShowTab() {
    if (typeof window.showTab === 'function' && !window._integrationsWrapped) {
        const orig = window.showTab;
        window.showTab = function(tab) {
            orig.apply(this, arguments);
            if (tab === 'settings') setTimeout(loadIntegrationsUI, 80);
        };
        window._integrationsWrapped = true;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(wrapShowTab, 100);
        setTimeout(wrapShowTab, 500);
        setTimeout(wrapShowTab, 1500);
    });
} else {
    setTimeout(wrapShowTab, 100);
    setTimeout(wrapShowTab, 500);
    setTimeout(wrapShowTab, 1500);
}

function setBadge(id, enabled) {
    const el = document.getElementById(id);
    if (!el) return;
    if (enabled) {
        el.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700';
        el.textContent = 'ON';
    } else {
        el.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600';
        el.textContent = 'OFF';
    }
}

async function loadIntegrationsUI() {
    try {
        const snap = await getDoc(doc(db, "settings", "main"));
        const int = snap.exists() ? (snap.data().integrations || {}) : {};

        const ga = int.googleAnalytics || {};
        if (document.getElementById('int-ga-enabled')) document.getElementById('int-ga-enabled').checked = !!ga.enabled;
        if (document.getElementById('int-ga-id')) document.getElementById('int-ga-id').value = ga.measurementId || '';
        setBadge('ga-status', !!ga.enabled);

        const fb = int.facebookPixel || {};
        if (document.getElementById('int-fb-enabled')) document.getElementById('int-fb-enabled').checked = !!fb.enabled;
        if (document.getElementById('int-fb-id')) document.getElementById('int-fb-id').value = fb.pixelId || '';
        setBadge('fb-status', !!fb.enabled);

        const em = int.emailjs || {};
        if (document.getElementById('int-em-enabled')) document.getElementById('int-em-enabled').checked = !!em.enabled;
        if (document.getElementById('int-em-publickey')) document.getElementById('int-em-publickey').value = em.publicKey || '';
        if (document.getElementById('int-em-serviceid')) document.getElementById('int-em-serviceid').value = em.serviceId || '';
        if (document.getElementById('int-em-customertpl')) document.getElementById('int-em-customertpl').value = em.customerTemplateId || '';
        if (document.getElementById('int-em-admintpl')) document.getElementById('int-em-admintpl').value = em.adminTemplateId || '';
        if (document.getElementById('int-em-adminemail')) document.getElementById('int-em-adminemail').value = em.adminEmail || '';
        setBadge('em-status', !!em.enabled);

        const wa = int.whatsapp || {};
        if (document.getElementById('int-wa-enabled')) document.getElementById('int-wa-enabled').checked = !!wa.enabled;
        if (document.getElementById('int-wa-number')) document.getElementById('int-wa-number').value = wa.number || '';
        setBadge('wa-status', !!wa.enabled);

        const sms = int.sms || {};
        if (document.getElementById('int-sms-enabled')) document.getElementById('int-sms-enabled').checked = !!sms.enabled;
        if (document.getElementById('int-sms-apikey')) document.getElementById('int-sms-apikey').value = sms.apiKey || '';
        if (document.getElementById('int-sms-senderid')) document.getElementById('int-sms-senderid').value = sms.senderId || '';
        setBadge('sms-status', !!sms.enabled);

        const bkash = int.bkash || {};
        if (document.getElementById('int-bkash-enabled')) document.getElementById('int-bkash-enabled').checked = !!bkash.enabled;
        if (document.getElementById('int-bkash-merchant')) document.getElementById('int-bkash-merchant').value = bkash.merchantNumber || '';
        if (document.getElementById('int-bkash-apikey')) document.getElementById('int-bkash-apikey').value = bkash.apiKey || '';
        if (document.getElementById('int-bkash-secret')) document.getElementById('int-bkash-secret').value = bkash.apiSecret || '';
        setBadge('bkash-status', !!bkash.enabled);

        const nagad = int.nagad || {};
        if (document.getElementById('int-nagad-enabled')) document.getElementById('int-nagad-enabled').checked = !!nagad.enabled;
        if (document.getElementById('int-nagad-merchant')) document.getElementById('int-nagad-merchant').value = nagad.merchantNumber || '';
        if (document.getElementById('int-nagad-apikey')) document.getElementById('int-nagad-apikey').value = nagad.apiKey || '';
        if (document.getElementById('int-nagad-secret')) document.getElementById('int-nagad-secret').value = nagad.apiSecret || '';
        setBadge('nagad-status', !!nagad.enabled);

    } catch (e) { console.warn('Load integrations failed:', e); }
}
window.loadIntegrationsUI = loadIntegrationsUI;

document.addEventListener('change', function(e) {
    if (!e.target) return;
    const id = e.target.id;
    if (id === 'int-ga-enabled') setBadge('ga-status', e.target.checked);
    if (id === 'int-fb-enabled') setBadge('fb-status', e.target.checked);
    if (id === 'int-em-enabled') setBadge('em-status', e.target.checked);
    if (id === 'int-wa-enabled') setBadge('wa-status', e.target.checked);
    if (id === 'int-sms-enabled') setBadge('sms-status', e.target.checked);
    if (id === 'int-bkash-enabled') setBadge('bkash-status', e.target.checked);
    if (id === 'int-nagad-enabled') setBadge('nagad-status', e.target.checked);
});

function v(id) { return (document.getElementById(id)?.value || '').trim(); }
function checked(id) { return document.getElementById(id)?.checked || false; }
function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

window.saveIntegrations = async function() {
    const gaEnabled = checked('int-ga-enabled');
    const gaId = v('int-ga-id');
    const fbEnabled = checked('int-fb-enabled');
    const fbId = v('int-fb-id');
    const emEnabled = checked('int-em-enabled');
    const emPublicKey = v('int-em-publickey');
    const emServiceId = v('int-em-serviceid');
    const emCustomerTpl = v('int-em-customertpl');
    const emAdminTpl = v('int-em-admintpl');
    const emAdminEmail = v('int-em-adminemail');
    const waEnabled = checked('int-wa-enabled');
    const waNumber = v('int-wa-number');
    const smsEnabled = checked('int-sms-enabled');
    const smsApiKey = v('int-sms-apikey');
    const smsSenderId = v('int-sms-senderid');
    const bkashEnabled = checked('int-bkash-enabled');
    const bkashMerchant = v('int-bkash-merchant');
    const bkashApiKey = v('int-bkash-apikey');
    const bkashSecret = v('int-bkash-secret');
    const nagadEnabled = checked('int-nagad-enabled');
    const nagadMerchant = v('int-nagad-merchant');
    const nagadApiKey = v('int-nagad-apikey');
    const nagadSecret = v('int-nagad-secret');

    if (gaEnabled && !gaId) return toast('Google Analytics ID দিন', 'error');
    if (gaEnabled && !/^G-[A-Z0-9]+$/i.test(gaId)) return toast('GA ID সঠিক নয় (G- দিয়ে শুরু)', 'error');
    if (fbEnabled && !fbId) return toast('Facebook Pixel ID দিন', 'error');
    if (fbEnabled && !/^\d{10,20}$/.test(fbId)) return toast('Facebook Pixel ID শুধু ১০-২০ ডিজিট', 'error');
    if (emEnabled && !emPublicKey) return toast('EmailJS Public Key দিন', 'error');
    if (emEnabled && !emServiceId) return toast('EmailJS Service ID দিন', 'error');
    if (emEnabled && !emCustomerTpl) return toast('EmailJS Customer Template ID দিন', 'error');
    if (emEnabled && !emAdminTpl) return toast('EmailJS Admin Template ID দিন', 'error');
    if (emEnabled && !emAdminEmail) return toast('Admin Email দিন', 'error');
    if (emEnabled && !isEmail(emAdminEmail)) return toast('Admin Email সঠিক নয়', 'error');
    if (waEnabled && !waNumber) return toast('WhatsApp Number দিন', 'error');
    if (waEnabled && !/^88\d{10,13}$/.test(waNumber)) return toast('WhatsApp Number ৮৮ দিয়ে শুরু, space ছাড়া', 'error');
    if (smsEnabled && !smsApiKey) return toast('SMS API Key দিন', 'error');
    if (smsEnabled && !smsSenderId) return toast('SMS Sender ID দিন', 'error');
    if (bkashEnabled && !bkashMerchant) return toast('bKash Merchant Number দিন', 'error');
    if (bkashEnabled && !bkashApiKey) return toast('bKash API Key দিন', 'error');
    if (bkashEnabled && !bkashSecret) return toast('bKash API Secret দিন', 'error');
    if (nagadEnabled && !nagadMerchant) return toast('Nagad Merchant Number দিন', 'error');
    if (nagadEnabled && !nagadApiKey) return toast('Nagad API Key দিন', 'error');
    if (nagadEnabled && !nagadSecret) return toast('Nagad API Secret দিন', 'error');

    const btn = document.getElementById('save-integrations-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';

    try {
        await setDoc(doc(db, "settings", "main"), {
            integrations: {
                googleAnalytics: { enabled: gaEnabled, measurementId: gaId },
                facebookPixel: { enabled: fbEnabled, pixelId: fbId },
                emailjs: {
                    enabled: emEnabled,
                    publicKey: emPublicKey,
                    serviceId: emServiceId,
                    customerTemplateId: emCustomerTpl,
                    adminTemplateId: emAdminTpl,
                    adminEmail: emAdminEmail
                },
                whatsapp: { enabled: waEnabled, number: waNumber },
                sms: { enabled: smsEnabled, apiKey: smsApiKey, senderId: smsSenderId },
                bkash: { enabled: bkashEnabled, merchantNumber: bkashMerchant, apiKey: bkashApiKey, apiSecret: bkashSecret },
                nagad: { enabled: nagadEnabled, merchantNumber: nagadMerchant, apiKey: nagadApiKey, apiSecret: nagadSecret }
            }
        }, { merge: true });
        toast('Integrations saved! Page reload হচ্ছে...', 'success');
        setTimeout(() => location.reload(), 1500);
    } catch (e) {
        toast('Error: ' + e.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plug mr-2"></i> SAVE INTEGRATIONS';
    }
};

setTimeout(() => {
    const settingsTab = document.getElementById('content-settings');
    if (settingsTab && !settingsTab.classList.contains('hidden')) loadIntegrationsUI();
}, 2000);

console.log('✅ admin-integrations.js loaded (7 integrations)');