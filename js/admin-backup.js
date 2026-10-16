// ============================================================
// HEARTIX ADMIN — Backup & Export (self-injecting)
// ============================================================
import { db } from './firebase.js';
import { showToast as toast } from './common.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ INJECT BUTTON ============
function injectBackupButton() {
    if (document.getElementById('backup-btn')) return true;

    const alertBtn = document.getElementById('send-alert-btn');
    if (!alertBtn) return false;

    const parent = alertBtn.parentElement;
    if (!parent) return false;

    const btn = document.createElement('button');
    btn.id = 'backup-btn';
    btn.type = 'button';
    btn.className = 'w-full bg-blue-50 border-2 border-blue-200 text-blue-800 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:bg-blue-100 hover:border-blue-300 transition-all mb-4';
    btn.innerHTML = '<i class="fas fa-download"></i> Download Full Backup (JSON)';
    btn.onclick = handleBackup;

    parent.insertBefore(btn, alertBtn.nextSibling);
    return true;
}

// ============ BACKUP ============
async function handleBackup() {
    const btn = document.getElementById('backup-btn');
    if (!btn) return;

    if (!confirm('সম্পূর্ণ ডাটা backup download করবেন?\n\n(Products, Orders, Coupons, Settings, Staff, Reviews)\n\nফাইল সাইজ কয়েক MB হতে পারে।')) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Collecting data...';

    try {
        const collections = ['products', 'orders', 'coupons', 'reviews', 'messages', 'customers'];
        const backup = {
            meta: {
                app: 'Heartix',
                version: '1.0',
                exportedAt: new Date().toISOString(),
                exportedAtLocal: new Date().toLocaleString('en-GB')
            },
            data: {}
        };

        for (let i = 0; i < collections.length; i++) {
            const name = collections[i];
            btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> ${name} (${i + 1}/${collections.length})...`;
            try {
                const snap = await getDocs(collection(db, name));
                backup.data[name] = [];
                snap.forEach(d => backup.data[name].push({ _id: d.id, ...d.data() }));
            } catch (e) {
                backup.data[name] = { error: e.message || 'failed' };
            }
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> settings...';
        try {
            const settingsSnap = await getDoc(doc(db, "settings", "main"));
            backup.data.settings = settingsSnap.exists() ? { main: settingsSnap.data() } : {};
        } catch (e) {
            backup.data.settings = { error: e.message || 'failed' };
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> staff...';
        try {
            const snap = await getDocs(collection(db, 'staff'));
            backup.data.staff = [];
            snap.forEach(d => backup.data.staff.push({ _id: d.id, ...d.data() }));
        } catch (e) {
            backup.data.staff = { error: e.message || 'failed' };
        }

        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        const date = new Date().toISOString().slice(0, 10);
        const time = new Date().toTimeString().slice(0, 5).replace(':', '-');
        a.href = url;
        a.download = `heartix-backup-${date}-${time}.json`;
        a.click();
        URL.revokeObjectURL(url);

        const counts = {
            products: Array.isArray(backup.data.products) ? backup.data.products.length : 0,
            orders: Array.isArray(backup.data.orders) ? backup.data.orders.length : 0,
            coupons: Array.isArray(backup.data.coupons) ? backup.data.coupons.length : 0,
            reviews: Array.isArray(backup.data.reviews) ? backup.data.reviews.length : 0,
            messages: Array.isArray(backup.data.messages) ? backup.data.messages.length : 0,
            customers: Array.isArray(backup.data.customers) ? backup.data.customers.length : 0,
            staff: Array.isArray(backup.data.staff) ? backup.data.staff.length : 0
        };

        toast(`✅ Backup downloaded — ${counts.products}P, ${counts.orders}O, ${counts.customers}C`);
        console.log('Backup counts:', counts);

        try {
            const mod = await import('./staff-activity.js');
            if (mod && mod.logActivity) {
                mod.logActivity('settings_update', {
                    description: `Full backup downloaded (${counts.products} products, ${counts.orders} orders)`,
                    meta: counts
                });
            }
        } catch (e) {}

    } catch (e) {
        console.error('Backup failed:', e);
        toast('Backup ব্যর্থ: ' + (e.message || 'unknown'), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-download"></i> Download Full Backup (JSON)';
    }
}

// ============ INIT ============
let attempts = 0;
function tryInject() {
    if (injectBackupButton()) return;
    attempts++;
    if (attempts < 30) setTimeout(tryInject, 500);
}

function init() { setTimeout(tryInject, 1500); }

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ admin-backup.js loaded');