// ============================================================
// HEARTIX ADMIN — Inventory Alert + Backup (static buttons)
// ============================================================
import { db } from './firebase.js';
import { showToast as toast } from './common.js';
import { notifyLowStockAlert } from './email-notify.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LOW_STOCK_THRESHOLD = 5;

// ============ SEND LOW STOCK ALERT ============
async function handleSendAlert() {
    const btn = document.getElementById('send-alert-btn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Loading products...';

    try {
        const snap = await getDocs(collection(db, "products"));
        const lowStock = [];
        snap.forEach(d => {
            const p = { id: d.id, ...d.data() };
            const stock = Number(p.stock) || 0;
            if (stock < LOW_STOCK_THRESHOLD) lowStock.push(p);
        });

        if (lowStock.length === 0) {
            toast('কোনো low stock product নেই ✅', 'success');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-bell"></i> Send Low Stock Alert Email';
            return;
        }

        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Sending ${lowStock.length} alert...`;

        lowStock.sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0));

        const result = await notifyLowStockAlert(lowStock);

        if (result.ok) {
            toast(`✅ ${lowStock.length}টি product-এর alert email পাঠানো হয়েছে`);
            try {
                const mod = await import('./staff-activity.js');
                if (mod && mod.logActivity) {
                    mod.logActivity('settings_update', {
                        description: `Low stock alert email sent (${lowStock.length} items)`,
                        meta: { count: lowStock.length }
                    });
                }
            } catch (e) {}
        } else {
            let msg = 'Email পাঠানো যায়নি';
            if (result.reason === 'not_configured') msg = 'Email Notifications enable করা নেই';
            else if (result.reason === 'no_admin_email') msg = 'Admin Email সেট করা নেই';
            else if (result.reason === 'no_template') msg = 'Email template সেট করা নেই';
            toast(msg, 'error');
        }
    } catch (e) {
        console.error('Send alert failed:', e);
        toast('Error: ' + (e.message || 'unknown'), 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-bell"></i> Send Low Stock Alert Email';
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

// ============ ATTACH HANDLERS ============
function attachHandlers() {
    const alertBtn = document.getElementById('send-alert-btn');
    const backupBtn = document.getElementById('backup-btn');

    if (alertBtn && !alertBtn._bound) {
        alertBtn.onclick = handleSendAlert;
        alertBtn._bound = true;
    }
    if (backupBtn && !backupBtn._bound) {
        backupBtn.onclick = handleBackup;
        backupBtn._bound = true;
    }
}

// ============ INIT (retry-based) ============
let attempts = 0;
function init() {
    function tryAttach() {
        attachHandlers();
        attempts++;
        if (attempts < 30) setTimeout(tryAttach, 500);
    }
    setTimeout(tryAttach, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ inventory-alert.js loaded (static buttons)');