// ============================================================
// HEARTIX ADMIN — Activity Tab (list + filters)
// ============================================================
import { db } from './firebase.js';
import { escapeHtml } from './common.js';
import {
    collection, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let allActivities = [];
let filteredActivities = [];
let filterDate = 'all';
let filterStaff = 'all';
let filterAction = 'all';
let staffList = [];

// ============ ACTION META ============
const ACTION_META = {
    'login':        { icon: 'sign-in-alt',      color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Login' },
    'logout':       { icon: 'sign-out-alt',     color: 'text-gray-600',    bg: 'bg-gray-100',   label: 'Logout' },
    'order_status': { icon: 'exchange-alt',     color: 'text-purple-600',  bg: 'bg-purple-50',  label: 'Order' },
    'order_delete': { icon: 'trash-alt',        color: 'text-red-600',     bg: 'bg-red-50',     label: 'Order Delete' },
    'order_edit':   { icon: 'pen',              color: 'text-amber-600',   bg: 'bg-amber-50',   label: 'Order Edit' },
    'product_add':  { icon: 'plus-circle',      color: 'text-green-600',   bg: 'bg-green-50',   label: 'Product Add' },
    'product_edit': { icon: 'edit',             color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Product Edit' },
    'product_delete': { icon: 'trash-alt',      color: 'text-red-600',     bg: 'bg-red-50',     label: 'Product Delete' },
    'message_read': { icon: 'envelope-open',    color: 'text-indigo-600',  bg: 'bg-indigo-50',  label: 'Message' },
    'message_delete': { icon: 'envelope',       color: 'text-red-600',     bg: 'bg-red-50',     label: 'Message' },
    'staff_add':    { icon: 'user-plus',        color: 'text-green-600',   bg: 'bg-green-50',   label: 'Staff Add' },
    'staff_edit':   { icon: 'user-edit',        color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Staff Edit' },
    'staff_disable': { icon: 'user-slash',      color: 'text-amber-600',   bg: 'bg-amber-50',   label: 'Staff Disable' },
    'staff_remove': { icon: 'user-times',       color: 'text-red-600',     bg: 'bg-red-50',     label: 'Staff Remove' },
    'settings_update': { icon: 'cog',           color: 'text-gray-600',    bg: 'bg-gray-100',   label: 'Settings' },
    'coupon_add':   { icon: 'ticket-alt',       color: 'text-green-600',   bg: 'bg-green-50',   label: 'Coupon' },
    'coupon_edit':  { icon: 'ticket-alt',       color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Coupon' },
    'coupon_delete': { icon: 'ticket-alt',      color: 'text-red-600',     bg: 'bg-red-50',     label: 'Coupon' },
    'category_add': { icon: 'th-large',         color: 'text-green-600',   bg: 'bg-green-50',   label: 'Category' },
    'category_edit': { icon: 'th-large',        color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Category' },
    'category_delete': { icon: 'th-large',      color: 'text-red-600',     bg: 'bg-red-50',     label: 'Category' }
};

function getActionMeta(action) {
    return ACTION_META[action] || { icon: 'circle-info', color: 'text-gray-600', bg: 'bg-gray-100', label: 'Action' };
}

// ============ HELPERS ============
function formatTime(ts) {
    if (!ts || !ts.toDate) return '';
    try {
        const d = ts.toDate();
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffMin < 1) return 'এইমাত্র';
        if (diffMin < 60) return `${diffMin} মিনিট আগে`;
        if (diffHr < 24) return `${diffHr} ঘণ্টা আগে`;
        if (diffDay < 7) return `${diffDay} দিন আগে`;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
}

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

// ============ LOAD ============
export async function loadActivity() {
    const list = document.getElementById('activity-list');
    if (list) list.innerHTML = '<p class="text-center text-gray-400 text-sm py-8"><i class="fas fa-spinner fa-spin mr-1"></i> Loading...</p>';

    try {
        // Try ordered query first
        let snap;
        try {
            const q = query(collection(db, "activity_log"), orderBy("createdAt", "desc"), limit(500));
            snap = await getDocs(q);
        } catch (e) {
            // Fallback without index
            snap = await getDocs(collection(db, "activity_log"));
        }

        allActivities = [];
        snap.forEach(d => allActivities.push({ id: d.id, ...d.data() }));

        // Sort by createdAt desc
        allActivities.sort((a, b) => {
            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta;
        });

        // Build staff list for filter dropdown
        buildStaffList();

        applyFilters();
    } catch (e) {
        console.error('Activity load failed:', e);
        if (list) list.innerHTML = '<p class="text-center text-red-500 text-sm py-8">লোড করা যায়নি</p>';
    }
}

function buildStaffList() {
    const map = new Map();
    allActivities.forEach(a => {
        if (a.uid && a.name) map.set(a.uid, a.name);
    });
    staffList = Array.from(map.entries()).map(([uid, name]) => ({ uid, name }));

    const sel = document.getElementById('activity-staff-filter');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="all">All Staff</option>';
    staffList.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.uid;
        opt.textContent = s.name;
        sel.appendChild(opt);
    });
    if (currentVal) sel.value = currentVal;
}

// ============ FILTER ============
window.filterActivity = function(type, value) {
    if (type === 'date') filterDate = value;
    if (type === 'staff') filterStaff = value;
    if (type === 'action') filterAction = value;
    applyFilters();
};

function applyFilters() {
    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

    filteredActivities = allActivities.filter(a => {
        // Date filter
        const ts = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        if (filterDate === 'today' && ts < todayStart) return false;
        if (filterDate === 'yesterday' && (ts < yesterdayStart || ts >= todayStart)) return false;
        if (filterDate === 'week' && ts < weekStart) return false;

        // Staff filter
        if (filterStaff !== 'all' && a.uid !== filterStaff) return false;

        // Action filter
        if (filterAction !== 'all') {
            const actionGroup = (a.action || '').split('_')[0];
            if (actionGroup !== filterAction) return false;
        }

        return true;
    });

    renderActivity();
}

// ============ RENDER ============
function renderActivity() {
    const list = document.getElementById('activity-list');
    if (!list) return;

    if (filteredActivities.length === 0) {
        list.innerHTML = `
            <div class="bg-white rounded-2xl p-12 text-center premium-shadow">
                <i class="fas fa-history text-4xl text-gray-200 mb-3"></i>
                <p class="text-sm text-gray-500 mb-1">কোনো activity নেই</p>
                <p class="text-xs text-gray-400">Admin panel-এ কাজ করলে এখানে দেখাবে</p>
            </div>`;
        return;
    }

    let html = '';
    let lastDateLabel = '';

    filteredActivities.forEach(a => {
        const meta = getActionMeta(a.action);
        const timeStr = formatTime(a.createdAt);
        const dateLabel = a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

        if (dateLabel && dateLabel !== lastDateLabel) {
            html += `<p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mt-4 mb-2 first:mt-0">${dateLabel}</p>`;
            lastDateLabel = dateLabel;
        }

        const desc = a.description || a.action || '';

        html += `
            <div class="bg-white rounded-2xl p-3.5 premium-shadow flex items-start gap-3 mb-2">
                <div class="w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-${meta.icon} ${meta.color} text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-baseline justify-between gap-2 mb-0.5">
                        <p class="text-xs font-bold text-navy truncate">${escapeHtml(a.name || 'Unknown')}</p>
                        <span class="text-[10px] text-gray-400 flex-shrink-0">${timeStr}</span>
                    </div>
                    <p class="text-[11px] text-gray-600 leading-relaxed">${escapeHtml(desc)}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color} uppercase">${meta.label}</span>
                        ${a.role ? `<span class="text-[9px] text-gray-400 uppercase">${escapeHtml(a.role)}</span>` : ''}
                    </div>
                </div>
            </div>`;
    });

    list.innerHTML = html;
}

// ============ REFRESH ============
window.refreshActivity = function() {
    loadActivity();
};

// ============ AUTO-LOAD WHEN TAB SHOWN ============
// Wrap showTab to load activity when 'activity' tab is opened
(function() {
    function wrapShowTab() {
        if (typeof window.showTab === 'function' && !window._activityWrapped) {
            const orig = window.showTab;
            window.showTab = function(tab) {
                orig.apply(this, arguments);
                if (tab === 'activity') {
                    setTimeout(loadActivity, 100);
                }
            };
            window._activityWrapped = true;
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(wrapShowTab, 300);
            setTimeout(wrapShowTab, 1000);
        });
    } else {
        setTimeout(wrapShowTab, 300);
        setTimeout(wrapShowTab, 1000);
    }
})();

console.log('✅ admin-activity.js loaded');