// ============================================================
// HEARTIX ADMIN — Inventory Alert (self-injecting)
// Adds "Send Low Stock Alert Email" button to dashboard
// ============================================================
import { db } from './firebase.js';
import { showToast as toast } from './common.js';
import { notifyLowStockAlert } from './email-notify.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LOW_STOCK_THRESHOLD = 5;

// ============ INJECT BUTTON ============
function injectAlertButton() {
    if (document.getElementById('send-alert-btn')) return true;

    // Find the recent-orders card in dashboard
    const recentOrders = document.getElementById('recent-orders');
    if (!recentOrders) return false;

    const card = recentOrders.closest('.bg-white');
    if (!card) return false;

    const parent = card.parentElement;
    if (!parent) return false;

    // Build button
    const btn = document.createElement('button');
    btn.id = 'send-alert-btn';
    btn.type = 'button';
    btn.className = 'w-full bg-amber-50 border-2 border-amber-200 text-amber-800 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:bg-amber-100 hover:border-amber-300 transition-all mb-4';
    btn.innerHTML = '<i class="fas fa-bell"></i> Send Low Stock Alert Email';
    btn.onclick = handleSendAlert;

    parent.insertBefore(btn, card);
    return true;
}

// ============ HANDLE CLICK ============
async function handleSendAlert() {
    const btn = document.getElementById('send-alert-btn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Loading products...';

    try {
        // Fetch products
        const snap = await getDocs(collection(db, "products"));
        const lowStock = [];
        snap.forEach(d => {
            const p = { id: d.id, ...d.data() };
            const stock = Number(p.stock) || 0;
            if (stock < LOW_STOCK_THRESHOLD) lowStock.push(p);
        });

        // No products?
        if (lowStock.length === 0) {
            toast('কোনো low stock product নেই ✅', 'success');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-bell"></i> Send Low Stock Alert Email';
            return;
        }

        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Sending ${lowStock.length} alert...`;

        // Sort: out of stock first, then by stock ascending
        lowStock.sort((a, b) => {
            const sa = Number(a.stock) || 0;
            const sb = Number(b.stock) || 0;
            return sa - sb;
        });

        // Send email
        const result = await notifyLowStockAlert(lowStock);

        if (result.ok) {
            toast(`✅ ${lowStock.length}টি product-এর alert email পাঠানো হয়েছে`);
            // Log activity (non-blocking)
            try {
                const mod = await import('./staff-activity.js');
                if (mod && mod.logActivity) {
                    mod.logActivity('settings_update', {
                        description: `Low stock alert email sent (${lowStock.length} items)`,
                        meta: { count: lowStock.length, products: lowStock.slice(0, 10).map(p => p.name) }
                    });
                }
            } catch (e) { /* silent */ }
        } else {
            let msg = 'Email পাঠানো যায়নি';
            if (result.reason === 'not_configured') msg = 'Email Notifications enable করা নেই (Settings → Integrations)';
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

// ============ INIT (retry-based injection) ============
let attempts = 0;
const MAX_ATTEMPTS = 30; // ~15 seconds max

function tryInject() {
    if (injectAlertButton()) return;
    attempts++;
    if (attempts < MAX_ATTEMPTS) {
        setTimeout(tryInject, 500);
    }
}

function init() {
    // Wait a bit for admin.js to render dashboard
    setTimeout(tryInject, 800);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ inventory-alert.js loaded');