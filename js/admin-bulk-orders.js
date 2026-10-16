// ============================================================
// HEARTIX ADMIN — Bulk Order Update (self-injecting)
// v1 — Select multiple orders, change status at once
// ============================================================
import { db } from './firebase.js';
import { showToast as toast } from './common.js';
import { logActivity } from './staff-activity.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let selectMode = false;
const selectedIds = new Set();
let observer = null;

// ============ INJECT TOGGLE BUTTON ============
function injectToggleButton() {
    if (document.getElementById('bulk-select-btn')) return true;

    const csvBtn = document.querySelector('button[onclick="exportOrdersCSV()"]');
    if (!csvBtn) return false;

    const parent = csvBtn.parentElement;
    if (!parent) return false;

    const btn = document.createElement('button');
    btn.id = 'bulk-select-btn';
    btn.type = 'button';
    btn.onclick = toggleSelectMode;
    btn.className = 'bg-blue-50 border-2 border-blue-200 px-4 py-3 rounded-xl text-xs font-bold text-blue-700 hover:border-blue-300 transition whitespace-nowrap flex items-center gap-2 flex-shrink-0';
    btn.innerHTML = '<i class="fas fa-check-square"></i> <span>Select</span>';

    parent.appendChild(btn);
    return true;
}

// ============ TOGGLE SELECT MODE ============
function toggleSelectMode() {
    selectMode = !selectMode;
    selectedIds.clear();

    const btn = document.getElementById('bulk-select-btn');
    if (btn) {
        if (selectMode) {
            btn.className = 'bg-red-50 border-2 border-red-200 px-4 py-3 rounded-xl text-xs font-bold text-red-700 hover:border-red-300 transition whitespace-nowrap flex items-center gap-2 flex-shrink-0';
            btn.innerHTML = '<i class="fas fa-times"></i> <span>Cancel</span>';
        } else {
            btn.className = 'bg-blue-50 border-2 border-blue-200 px-4 py-3 rounded-xl text-xs font-bold text-blue-700 hover:border-blue-300 transition whitespace-nowrap flex items-center gap-2 flex-shrink-0';
            btn.innerHTML = '<i class="fas fa-check-square"></i> <span>Select</span>';
        }
    }

    // Update all cards
    document.querySelectorAll('#order-list-admin [data-bulk-order-id]').forEach(card => {
        updateCardCheckbox(card);
    });

    updateFloatingBar();
}

// ============ UPDATE CARD CHECKBOX ============
function updateCardCheckbox(card) {
    const orderId = card.dataset.bulkOrderId;
    if (!orderId) return;

    let checkbox = card.querySelector('.bulk-checkbox');
    const summary = card.querySelector('.order-summary');

    if (selectMode) {
        if (!checkbox) {
            checkbox = document.createElement('div');
            checkbox.className = 'bulk-checkbox absolute top-3 left-3 w-6 h-6 rounded-md border-2 border-gray-300 bg-white flex items-center justify-center z-20 cursor-pointer transition-all';
            checkbox.innerHTML = '<i class="fas fa-check text-white text-xs opacity-0 pointer-events-none"></i>';
            checkbox.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleOrderSelection(orderId, card);
            };
            card.style.position = 'relative';
            if (summary) summary.appendChild(checkbox);
        }

        const isChecked = selectedIds.has(orderId);
        if (isChecked) {
            checkbox.classList.add('bg-blue-500', 'border-blue-500');
            checkbox.classList.remove('bg-white', 'border-gray-300');
            const icon = checkbox.querySelector('i');
            if (icon) icon.style.opacity = '1';
        } else {
            checkbox.classList.remove('bg-blue-500', 'border-blue-500');
            checkbox.classList.add('bg-white', 'border-gray-300');
            const icon = checkbox.querySelector('i');
            if (icon) icon.style.opacity = '0';
        }
        if (summary) summary.style.paddingLeft = '48px';
    } else {
        if (checkbox) checkbox.remove();
        if (summary) summary.style.paddingLeft = '';
    }
}

// ============ TOGGLE SELECTION ============
function toggleOrderSelection(orderId, card) {
    if (selectedIds.has(orderId)) selectedIds.delete(orderId);
    else selectedIds.add(orderId);

    updateCardCheckbox(card);
    updateFloatingBar();
}

// ============ FLOATING BAR ============
function updateFloatingBar() {
    let bar = document.getElementById('bulk-action-bar');

    if (!selectMode || selectedIds.size === 0) {
        if (bar) bar.remove();
        return;
    }

    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'bulk-action-bar';
        bar.className = 'fixed left-4 right-4 bottom-24 md:bottom-6 z-40 max-w-md mx-auto animate-slide-up';
        document.body.appendChild(bar);
    }

    bar.innerHTML = `
        <div class="navy-gradient rounded-2xl shadow-2xl p-3.5 flex items-center gap-2">
            <div class="flex-1 min-w-0">
                <p class="text-white font-bold text-sm">${selectedIds.size} order selected</p>
                <p class="text-gold text-[11px] mt-0.5">একসাথে status পরিবর্তন করুন</p>
            </div>
            <button onclick="openBulkStatusPicker()" class="bg-white/10 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-white/20 active:bg-white/20 flex-shrink-0">
                <i class="fas fa-exchange-alt text-[11px]"></i> Status
            </button>
            <button onclick="cancelBulkSelection()" class="bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center active:bg-red-600 flex-shrink-0">
                <i class="fas fa-times text-sm"></i>
            </button>
        </div>
    `;
}

window.cancelBulkSelection = function() {
    if (selectMode) toggleSelectMode();
};

// ============ STATUS PICKER MODAL ============
window.openBulkStatusPicker = function() {
    if (selectedIds.size === 0) return;

    const existing = document.getElementById('bulk-status-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'bulk-status-modal';
    modal.className = 'fixed inset-0 modal-bg z-[80] flex items-end md:items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div class="navy-gradient p-5 rounded-t-3xl flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h3 class="text-white font-bold text-lg">Bulk Status Change</h3>
                    <p class="text-gold text-[11px] font-mono mt-0.5">${selectedIds.size} order selected</p>
                </div>
                <button onclick="closeBulkStatusPicker()" class="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-4 space-y-2">
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                    <p class="text-[11px] text-amber-900 leading-relaxed">
                        <i class="fas fa-info-circle mr-1"></i>
                        <strong>Note:</strong> Bulk change শুধু status পরিবর্তন করবে। Stock auto-adjust হবে না। Email পাঠানো হবে না।
                    </p>
                </div>
                <button onclick="applyBulkStatus('pending')" class="w-full flex items-center gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl active:scale-[0.98] transition text-left">
                    <div class="w-11 h-11 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-hourglass-half text-yellow-700"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-sm text-navy">Pending</p>
                        <p class="text-[11px] text-gray-500 mt-0.5">অর্ডার অপেক্ষায় আছে</p>
                    </div>
                </button>
                <button onclick="applyBulkStatus('confirmed')" class="w-full flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl active:scale-[0.98] transition text-left">
                    <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-circle-check text-blue-700"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-sm text-navy">Confirmed</p>
                        <p class="text-[11px] text-gray-500 mt-0.5">গ্রাহককে কনফার্ম করা হয়েছে</p>
                    </div>
                </button>
                <button onclick="applyBulkStatus('shipped')" class="w-full flex items-center gap-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl active:scale-[0.98] transition text-left">
                    <div class="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-truck-fast text-purple-700"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-sm text-navy">Shipped</p>
                        <p class="text-[11px] text-gray-500 mt-0.5">ডেলিভারির জন্য পাঠানো হয়েছে</p>
                    </div>
                </button>
                <button onclick="applyBulkStatus('delivered')" class="w-full flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-2xl active:scale-[0.98] transition text-left">
                    <div class="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-box-open text-green-700"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-sm text-navy">Delivered</p>
                        <p class="text-[11px] text-gray-500 mt-0.5">সফলভাবে ডেলিভারি হয়েছে</p>
                    </div>
                </button>
                <button onclick="applyBulkStatus('cancelled')" class="w-full flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl active:scale-[0.98] transition text-left">
                    <div class="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-circle-xmark text-red-700"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-sm text-navy">Cancelled</p>
                        <p class="text-[11px] text-gray-500 mt-0.5">অর্ডার বাতিল করা হয়েছে</p>
                    </div>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.closeBulkStatusPicker = function() {
    const m = document.getElementById('bulk-status-modal');
    if (m) m.remove();
};

// ============ APPLY BULK STATUS ============
window.applyBulkStatus = async function(newStatus) {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;

    if (!confirm(`${count}টি order-এর status "${newStatus}"-এ পরিবর্তন করবেন?`)) return;

    closeBulkStatusPicker();

    // Show loading state
    let bar = document.getElementById('bulk-action-bar');
    if (bar) {
        bar.innerHTML = `
            <div class="navy-gradient rounded-2xl shadow-2xl p-4 flex items-center gap-3">
                <div class="flex-1">
                    <p class="text-white font-bold text-sm">Updating...</p>
                    <p class="text-gold text-[11px] mt-0.5"><span id="bulk-progress">0</span> / ${count}</p>
                </div>
                <i class="fas fa-spinner fa-spin text-white text-lg"></i>
            </div>
        `;
    }

    let success = 0;
    let failed = 0;
    const progressEl = document.getElementById('bulk-progress');
    const ids = Array.from(selectedIds);

    for (const orderId of ids) {
        try {
            await updateDoc(doc(db, "orders", orderId), { status: newStatus });
            success++;
            if (progressEl) progressEl.textContent = success;
        } catch (e) {
            console.warn('Bulk update failed:', orderId, e);
            failed++;
        }
    }

    // Log activity
    try {
        await logActivity('order_status', {
            description: `Bulk update: ${success} order → "${newStatus}"${failed > 0 ? ` (${failed} failed)` : ''}`,
            meta: { count: success, newStatus, orderIds: ids.slice(0, 20) }
        });
    } catch (e) { /* silent */ }

    // Result toast
    if (failed === 0) {
        toast(`✅ ${success}টি order "${newStatus}" হয়েছে`);
    } else {
        toast(`⚠️ ${success} সফল, ${failed} ব্যর্থ`, 'warn');
    }

    // Reset & reload
    selectedIds.clear();
    selectMode = false;

    setTimeout(() => location.reload(), 1200);
};

// ============ OBSERVER: Detect new cards ============
function setupObserver() {
    const list = document.getElementById('order-list-admin');
    if (!list) return false;

    if (observer) observer.disconnect();

    observer = new MutationObserver(() => {
        scanOrderCards();
    });
    observer.observe(list, { childList: true, subtree: true });
    scanOrderCards();
    return true;
}

function scanOrderCards() {
    document.querySelectorAll('#order-list-admin .order-details').forEach(card => {
        if (card.dataset.bulkOrderId) {
            if (selectMode) updateCardCheckbox(card);
            return;
        }
        const editBtn = card.querySelector('[onclick*="openOrderEdit"]');
        if (editBtn) {
            const onclick = editBtn.getAttribute('onclick') || '';
            const match = onclick.match(/openOrderEdit\(['"]([^'"]+)['"]\)/);
            if (match && match[1]) {
                card.dataset.bulkOrderId = match[1];
                if (selectMode) updateCardCheckbox(card);
            }
        }
    });
}

// ============ WRAP showTab ============
function wrapShowTab() {
    if (typeof window.showTab === 'function' && !window._bulkOrdersWrapped) {
        const orig = window.showTab;
        window.showTab = function(tab) {
            orig.apply(this, arguments);
            if (tab === 'orders') {
                setTimeout(() => {
                    injectToggleButton();
                    setupObserver();
                    updateFloatingBar();
                }, 150);
            } else {
                if (selectMode) {
                    selectMode = false;
                    selectedIds.clear();
                    updateFloatingBar();
                }
            }
        };
        window._bulkOrdersWrapped = true;
    }
}

// ============ INIT ============
let injectAttempts = 0;
function tryInit() {
    if (injectToggleButton() || injectAttempts++ > 30) {
        setupObserver();
        return;
    }
    setTimeout(tryInit, 500);
}

function init() {
    setTimeout(() => {
        wrapShowTab();
        const ordersTab = document.getElementById('content-orders');
        if (ordersTab && !ordersTab.classList.contains('hidden')) {
            tryInit();
        }
    }, 800);
    setTimeout(wrapShowTab, 1500);
    setTimeout(wrapShowTab, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ admin-bulk-orders.js loaded');