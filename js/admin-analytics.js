// ============================================================
// HEARTIX ADMIN — Analytics (Chart.js)
// ============================================================
import { db } from './firebase.js';
import { formatPrice as fmt } from './common.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Auto-load modules
import './admin-backup.js';
import './admin-preorder-badge.js';

let allOrders = [];
let charts = {};
let chartJSLoaded = false;
let currentPeriod = '30';

// ---------- LOAD CHART.JS ----------
async function loadChartJS() {
    if (chartJSLoaded && window.Chart) return;
    return new Promise((resolve, reject) => {
        if (window.Chart) { chartJSLoaded = true; resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        s.onload = () => { chartJSLoaded = true; resolve(); };
        s.onerror = () => reject(new Error('Chart.js load failed'));
        document.head.appendChild(s);
    });
}

// ---------- FETCH ----------
async function fetchOrders() {
    try {
        let snap;
        try {
            snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(2000)));
        } catch (e) {
            snap = await getDocs(collection(db, "orders"));
        }
        allOrders = [];
        snap.forEach(d => allOrders.push({ id: d.id, ...d.data() }));
        allOrders.sort((a, b) => {
            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta;
        });
    } catch (e) { allOrders = []; }
}

// ---------- FILTER ----------
function filteredOrders() {
    if (currentPeriod === 'all') return allOrders;
    const days = parseInt(currentPeriod) || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return allOrders.filter(o => {
        const ts = o.createdAt?.toMillis ? o.createdAt.toMillis() : 0;
        return ts >= cutoff;
    });
}

// ---------- METRICS ----------
function metrics(orders) {
    const valid = orders.filter(o => o.status !== 'cancelled');
    const delivered = valid.filter(o => o.status === 'delivered');
    const revenue = delivered.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const aov = delivered.length > 0 ? Math.round(revenue / delivered.length) : 0;
    const repeat = orders.filter(o => o.customer?.isRepeat === true).length;
    const repeatPct = orders.length > 0 ? Math.round((repeat / orders.length) * 100) : 0;
    const pending = orders.filter(o => o.status === 'pending').length;
    return { revenue, totalOrders: orders.length, aov, repeatPct, deliveredCount: delivered.length, pending };
}

// ---------- REVENUE BY DAY ----------
function revenueByDay(orders) {
    const days = currentPeriod === 'all' ? 30 : Math.min(parseInt(currentPeriod) || 30, 90);
    const map = new Map();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        map.set(d.toISOString().slice(0, 10), 0);
    }
    orders.forEach(o => {
        if (o.status !== 'delivered') return;
        const ts = o.createdAt?.toMillis ? o.createdAt.toMillis() : 0;
        if (!ts) return;
        const d = new Date(ts);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        if (map.has(key)) map.set(key, map.get(key) + (Number(o.total) || 0));
    });
    const labels = [], data = [];
    map.forEach((v, k) => {
        const d = new Date(k + 'T00:00:00');
        labels.push(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
        data.push(v);
    });
    return { labels, data };
}

// ---------- STATUS ----------
function statusDist(orders) {
    const keys = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const labels = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    const colors = ['#FBBF24', '#3B82F6', '#A855F7', '#10B981', '#EF4444'];
    const counts = keys.map(k => orders.filter(o => o.status === k).length);
    return { labels, colors, counts };
}

// ---------- TOP PRODUCTS ----------
function topProducts(orders) {
    const map = new Map();
    orders.forEach(o => {
        if (o.status === 'cancelled') return;
        (o.items || []).forEach(it => {
            const n = it.name || 'Unknown';
            const q = Number(it.quantity) || 0;
            const r = (Number(it.price) || 0) * q;
            if (map.has(n)) { const c = map.get(n); c.qty += q; c.rev += r; }
            else map.set(n, { qty: q, rev: r });
        });
    });
    const sorted = Array.from(map.entries()).map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.qty - a.qty).slice(0, 5);
    return {
        labels: sorted.map(s => s.name.length > 20 ? s.name.slice(0, 18) + '…' : s.name),
        qty: sorted.map(s => s.qty),
        rev: sorted.map(s => s.rev)
    };
}

// ---------- DESTROY ----------
function destroyCharts() {
    Object.values(charts).forEach(c => { try { c.destroy(); } catch (e) {} });
    charts = {};
}

// ---------- RENDER METRIC CARDS ----------
function metricCards(m) {
    return `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
            <div class="bg-white rounded-2xl p-4 premium-shadow border-l-4 border-green-500">
                <div class="flex items-center justify-between mb-2">
                    <div class="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center"><i class="fas fa-money-bill-wave text-green-600 text-sm"></i></div>
                    <span class="text-[10px] font-bold text-green-600 uppercase">Revenue</span>
                </div>
                <p class="text-xl md:text-2xl font-bold text-navy break-words">৳${fmt(m.revenue)}</p>
                <p class="text-[10px] text-gray-500 mt-1">${m.deliveredCount} delivered</p>
            </div>
            <div class="bg-white rounded-2xl p-4 premium-shadow border-l-4 border-purple-500">
                <div class="flex items-center justify-between mb-2">
                    <div class="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center"><i class="fas fa-receipt text-purple-600 text-sm"></i></div>
                    <span class="text-[10px] font-bold text-purple-600 uppercase">Orders</span>
                </div>
                <p class="text-xl md:text-2xl font-bold text-navy">${m.totalOrders}</p>
                <p class="text-[10px] text-gray-500 mt-1">${m.pending} pending</p>
            </div>
            <div class="bg-white rounded-2xl p-4 premium-shadow border-l-4 border-blue-500">
                <div class="flex items-center justify-between mb-2">
                    <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><i class="fas fa-chart-line text-blue-600 text-sm"></i></div>
                    <span class="text-[10px] font-bold text-blue-600 uppercase">AOV</span>
                </div>
                <p class="text-xl md:text-2xl font-bold text-navy break-words">৳${fmt(m.aov)}</p>
                <p class="text-[10px] text-gray-500 mt-1">Avg order value</p>
            </div>
            <div class="bg-white rounded-2xl p-4 premium-shadow border-l-4 border-amber-500">
                <div class="flex items-center justify-between mb-2">
                    <div class="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><i class="fas fa-repeat text-amber-600 text-sm"></i></div>
                    <span class="text-[10px] font-bold text-amber-600 uppercase">Repeat</span>
                </div>
                <p class="text-xl md:text-2xl font-bold text-navy">${m.repeatPct}%</p>
                <p class="text-[10px] text-gray-500 mt-1">Returning customers</p>
            </div>
        </div>
    `;
}

// ---------- RENDER UI ----------
function renderUI() {
    const c = document.getElementById('analytics-container');
    if (!c) return;

    if (allOrders.length === 0) {
        c.innerHTML = `<div class="bg-white rounded-2xl p-12 text-center premium-shadow">
            <i class="fas fa-chart-line text-4xl text-gray-200 mb-3"></i>
            <p class="text-sm text-gray-500">এখনো কোনো order নেই</p>
        </div>`;
        return;
    }

    const filtered = filteredOrders();
    const m = metrics(filtered);
    const rev = revenueByDay(filtered);
    const st = statusDist(filtered);
    const tp = topProducts(filtered);

    const periods = [
        { k: '7', label: '7 Days' },
        { k: '30', label: '30 Days' },
        { k: '90', label: '90 Days' },
        { k: 'all', label: 'All Time' }
    ];

    c.innerHTML = `
        <div class="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
            ${periods.map(p => `<button onclick="window.setAnalyticsPeriod('${p.k}')" class="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${currentPeriod === p.k ? 'bg-navy text-white shadow-md' : 'bg-white text-gray-600 border-2 border-gray-100 hover:border-gold'}">${p.label}</button>`).join('')}
        </div>
        ${metricCards(m)}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="md:col-span-2 bg-white rounded-2xl premium-shadow p-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-display text-base font-bold text-navy flex items-center gap-2"><i class="fas fa-chart-area text-green-600"></i> Revenue Trend</h3>
                    <span class="text-[10px] text-gray-400 uppercase font-bold">Daily (BDT)</span>
                </div>
                <div style="height:240px;position:relative;"><canvas id="revenueChart"></canvas></div>
            </div>
            <div class="bg-white rounded-2xl premium-shadow p-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-display text-base font-bold text-navy flex items-center gap-2"><i class="fas fa-chart-pie text-purple-600"></i> Status</h3>
                </div>
                <div style="height:240px;position:relative;"><canvas id="statusChart"></canvas></div>
            </div>
        </div>
        <div class="bg-white rounded-2xl premium-shadow p-4 mb-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-display text-base font-bold text-navy flex items-center gap-2"><i class="fas fa-trophy text-amber-500"></i> Top 5 Products</h3>
                <span class="text-[10px] text-gray-400 uppercase font-bold">By Units Sold</span>
            </div>
            <div style="height:280px;position:relative;"><canvas id="topProductsChart"></canvas></div>
        </div>
    `;

    setTimeout(() => {
        destroyCharts();
        renderRevenue(rev);
        renderStatus(st);
        renderTop(tp);
    }, 50);
}

// ---------- REVENUE CHART ----------
function renderRevenue(d) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: d.labels,
            datasets: [{
                data: d.data,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16,185,129,0.1)',
                borderWidth: 2.5, fill: true, tension: 0.35,
                pointRadius: d.labels.length > 30 ? 0 : 3,
                pointBackgroundColor: '#10B981', pointBorderColor: '#fff', pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#0A1628', padding: 10, callbacks: { label: (c) => '৳' + Number(c.raw).toLocaleString('en-IN') } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#9CA3AF', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 }, color: '#9CA3AF', callback: v => '৳' + (v >= 1000 ? (v/1000).toFixed(1) + 'k' : v) } }
            }
        }
    });
}

// ---------- STATUS CHART ----------
function renderStatus(d) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: d.labels,
            datasets: [{ data: d.counts, backgroundColor: d.colors, borderColor: '#fff', borderWidth: 2, hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '62%',
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 10, weight: '600' }, color: '#4B5563', padding: 8, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle' } },
                tooltip: { backgroundColor: '#0A1628', padding: 10, callbacks: { label: c => `${c.label}: ${c.raw}` } }
            }
        }
    });
}

// ---------- TOP PRODUCTS CHART ----------
function renderTop(d) {
    const ctx = document.getElementById('topProductsChart');
    if (!ctx) return;
    if (d.labels.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-center text-gray-400 text-xs py-16">কোনো data নেই</p>';
        return;
    }
    charts.top = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: d.labels,
            datasets: [{
                data: d.qty,
                backgroundColor: ['rgba(212,168,75,0.85)','rgba(59,130,246,0.85)','rgba(168,85,247,0.85)','rgba(16,185,129,0.85)','rgba(239,68,68,0.85)'],
                borderColor: ['#D4A84B','#3B82F6','#A855F7','#10B981','#EF4444'],
                borderWidth: 1.5, borderRadius: 8, barPercentage: 0.65
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#0A1628', padding: 10, callbacks: { label: c => `${c.raw} units • ৳${Number(d.rev[c.dataIndex] || 0).toLocaleString('en-IN')}` } }
            },
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 }, color: '#9CA3AF' } },
                y: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' }, color: '#0A1628' } }
            }
        }
    });
}

// ---------- PUBLIC ----------
window.setAnalyticsPeriod = function(p) { currentPeriod = p; renderUI(); };

// ---------- LOAD ----------
async function loadAnalytics() {
    const c = document.getElementById('analytics-container');
    if (!c) return;
    c.innerHTML = `<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-2xl gold-text"></i><p class="text-gray-400 text-sm mt-2">Loading...</p></div>`;

    try { await loadChartJS(); }
    catch (e) {
        c.innerHTML = `<div class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"><i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i><p class="text-sm text-red-700">Chart library load হয়নি</p></div>`;
        return;
    }

    if (allOrders.length === 0) await fetchOrders();
    renderUI();
}

// ---------- WRAP showTab ----------
function wrap() {
    if (typeof window.showTab === 'function' && !window._analyticsWrapped) {
        const orig = window.showTab;
        window.showTab = function(tab) {
            orig.apply(this, arguments);
            if (tab === 'analytics') setTimeout(loadAnalytics, 100);
        };
        window._analyticsWrapped = true;
    }
}
setTimeout(wrap, 300);
setTimeout(wrap, 1200);
setTimeout(wrap, 2500);

console.log('✅ admin-analytics.js loaded (with backup + preorder badge)');