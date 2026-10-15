// ============================================================
// HEARTIX ADMIN — Integrations (GA + FB Pixel + EmailJS)
// ============================================================
import { db } from './firebase.js';
import { showToast as toast } from './common.js';
import {
    doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Auto-load sub-modules
import './admin-back-trap.js';
import './admin-bulk.js';

// ============ WRAP showTab ============
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

// ============ LOAD UI ============
async function loadIntegrationsUI() {
    try {
        const snap = await getDoc(doc(db, "settings", "main"));
        const int = snap.exists() ? (snap.data().integrations || {}) : {};

        // === Google Analytics ===
        const ga = int.googleAnalytics || {};
        const gaEnabled = document.getElementById('int-ga-enabled');
        const gaId = document.getElementById('int-ga-id');
        if (gaEnabled) gaEnabled.checked = !!ga.enabled;
        if (gaId) gaId.value = ga.measurementId || '';
        updateGaBadge(!!ga.enabled);

        // === Facebook Pixel ===
        const fb = int.facebookPixel || {};
        const fbEnabled = document.getElementById('int-fb-enabled');
        const fbId = document.getElementById('int-fb-id');
        if (fbEnabled) fbEnabled.checked = !!fb.enabled;
        if (fbId) fbId.value = fb.pixelId || '';
        updateFbBadge(!!fb.enabled);

        // === EmailJS ===
        const em = int.emailjs || {};
        const emEnabled = document.getElementById('int-em-enabled');
        const emPublicKey = document.getElementById('int-em-publickey');
        const emServiceId = document.getElementById('int-em-serviceid');
        const emCustomerTpl = document.getElementById('int-em-customertpl');
        const emAdminTpl = document.getElementById('int-em-admintpl');
        const emAdminEmail = document.getElementById('int-em-adminemail');
        if (emEnabled) emEnabled.checked = !!em.enabled;
        if (emPublicKey) emPublicKey.value = em.publicKey || '';
        if (emServiceId) emServiceId.value = em.serviceId || '';
        if (emCustomerTpl) emCustomerTpl.value = em.customerTemplateId || '';
        if (emAdminTpl) emAdminTpl.value = em.adminTemplateId || '';
        if (emAdminEmail) emAdminEmail.value = em.adminEmail || '';
        updateEmBadge(!!em.enabled);
    } catch (e) { console.warn('Load integrations failed:', e); }
}
window.loadIntegrationsUI = loadIntegrationsUI;

// ============ BADGE UPDATERS ============
function updateGaBadge(enabled) {
    const el = document.getElementById('ga-status');
    if (!el) return;
    if (enabled) { el.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700'; el.textContent = 'ON'; }
    else { el.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600'; el.textContent = 'OFF'; }
}

function updateFbBadge(enabled) {
    const el = document.getElementById('fb-status');
    if (!el) return;
    if (enabled) { el.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700'; el.textContent = 'ON'; }
    else { el.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600'; el.textContent = 'OFF'; }
}

function updateEmBadge(enabled) {
    const el = document.getElementById('em-status');
    if (!el) return;
    if (enabled) { el.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700'; el.textContent = 'ON'; }
    else { el.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600'; el.textContent = 'OFF'; }
}

document.addEventListener('change', function(e) {
    if (!e.target) return;
    if (e.target.id === 'int-ga-enabled') updateGaBadge(e.target.checked);
    if (e.target.id === 'int-fb-enabled') updateFbBadge(e.target.checked);
    if (e.target.id === 'int-em-enabled') updateEmBadge(e.target.checked);
});

// ============ SAVE ALL INTEGRATIONS ============
window.saveIntegrations = async function() {
    // === GA ===
    const gaEnabled = document.getElementById('int-ga-enabled')?.checked || false;
    const gaId = (document.getElementById('int-ga-id')?.value || '').trim();
    // === FB ===
    const fbEnabled = document.getElementById('int-fb-enabled')?.checked || false;
    const fbId = (document.getElementById('int-fb-id')?.value || '').trim();
    // === EmailJS ===
    const emEnabled = document.getElementById('int-em-enabled')?.checked || false;
    const emPublicKey = (document.getElementById('int-em-publickey')?.value || '').trim();
    const emServiceId = (document.getElementById('int-em-serviceid')?.value || '').trim();
    const emCustomerTpl = (document.getElementById('int-em-customertpl')?.value || '').trim();
    const emAdminTpl = (document.getElementById('int-em-admintpl')?.value || '').trim();
    const emAdminEmail = (document.getElementById('int-em-adminemail')?.value || '').trim();

    // === Validation ===
    if (gaEnabled && !gaId) return toast('Google Analytics ID দিন', 'error');
    if (gaEnabled && !/^G-[A-Z0-9]+$/i.test(gaId)) return toast('GA ID সঠিক নয় (G- দিয়ে শুরু)', 'error');
    if (fbEnabled && !fbId) return toast('Facebook Pixel ID দিন', 'error');
    if (fbEnabled && !/^\d{10,20}$/.test(fbId)) return toast('Facebook Pixel ID শুধু ১০-২০ ডিজিট', 'error');
    if (emEnabled && !emPublicKey) return toast('EmailJS Public Key দিন', 'error');
    if (emEnabled && !emServiceId) return toast('EmailJS Service ID দিন', 'error');
    if (emEnabled && !emCustomerTpl) return toast('EmailJS Customer Template ID দিন', 'error');
    if (emEnabled && !emAdminTpl) return toast('EmailJS Admin Template ID দিন', 'error');
    if (emEnabled && !emAdminEmail) return toast('Admin Email দিন', 'error');
    if (emEnabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emAdminEmail)) return toast('সঠিক Admin Email দিন', 'error');

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
                }
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

console.log('✅ admin-integrations.js loaded (GA + FB + EmailJS)');