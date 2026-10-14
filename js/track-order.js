// ============================================================
// HEARTIX TRACK ORDER PAGE
// ============================================================
import { db } from './firebase.js';
import { escapeHtml, formatPrice, showToast } from './common.js';

import {
    collection, query, where, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let settings = { whatsapp: '', contactPhone: '' };
let lastOrderNumber = '';

// ============ STATUS STEPS ============
const STATUS_STEPS = [
    { key: 'pending', label: 'Pending', icon: 'clock', desc: 'আপনার অর্ডার পাওয়া গেছে' },
    { key: 'confirmed', label: 'Confirmed', icon: 'check', desc: 'অর্ডার কনফার্ম হয়েছে' },
    { key: 'shipped', label: 'Shipped', icon: 'truck', desc: 'ডেলিভারির জন্য পাঠানো হয়েছে' },
    { key: 'delivered', label: 'Delivered', icon: 'home', desc: 'ডেলিভারি সম্পন্ন' }
];

const STATUS_COLORS = {
    'pending': 'bg-yellow-100 text-yellow-700',
    'confirmed': 'bg-blue-100 text-blue-700',
    'shipped': 'bg-purple-100 text-purple-700',
    'delivered': 'bg-green-100 text-green-700',
    'cancelled': 'bg-red-100 text-red-700'
};

// ============ HELPERS ============
function formatDate(ts) {
    if (!ts) return '';
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
}

function formatDateShort(ts) {
    if (!ts) return '';
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
}

// ============ TRACK ORDER ============
window.trackOrder = async function() {
    const rawInput = (document.getElementById('order-input').value || '').trim();
    const input = rawInput.toUpperCase();

    if (!input) { showToast('অর্ডার নাম্বার দিন', 'error'); return; }
    if (input.length < 6) { showToast('অর্ডার নাম্বার খুব ছোট', 'warn'); return; }

    document.getElementById('result').classList.add('hidden');
    document.getElementById('not-found').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');

    const btn = document.getElementById('track-btn');
    btn.disabled = true;

    if (!db) {
        document.getElementById('loading').classList.add('hidden');
        showToast('সার্ভার সংযোগ নেই', 'error');
        btn.disabled = false;
        return;
    }

    try {
        const q = query(collection(db, "orders"), where("orderNumber", "==", input));
        const orderSnap = await getDocs(q);

        document.getElementById('loading').classList.add('hidden');

        if (orderSnap.empty) {
            document.getElementById('not-found').classList.remove('hidden');
            return;
        }

        let orders = [];
        orderSnap.forEach(d => orders.push({ id: d.id, ...d.data() }));
        orders.sort((a, b) => {
            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta;
        });

        lastOrderNumber = orders[0].orderNumber || input;
        renderOrder(orders[0]);
    } catch (e) {
        console.error('Track error:', e);
        document.getElementById('loading').classList.add('hidden');
        if ((e.message || '').toLowerCase().includes('index')) {
            showToast('সার্ভার index তৈরি হচ্ছে, কিছুক্ষণ পর চেষ্টা করুন', 'warn');
        } else {
            showToast('খুঁজতে সমস্যা হয়েছে', 'error');
        }
    } finally {
        btn.disabled = false;
    }
};

// ============ COPY ORDER NUMBER ============
window.copyOrderNumber = function(e) {
    const text = lastOrderNumber || document.getElementById('res-order-num').textContent;
    if (!text || text === '-') return;
    const doCopy = (ok) => {
        if (ok) showToast('অর্ডার নাম্বার কপি হয়েছে', 'success');
        else showToast('কপি করা যায়নি', 'error');
    };
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => doCopy(true)).catch(() => doCopy(false));
    } else {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            doCopy(true);
        } catch (err) { doCopy(false); }
    }
};

// ============ RENDER ORDER ============
function renderOrder(o) {
    const customer = o.customer || {};
    const items = o.items || [];

    document.getElementById('res-order-num').textContent = o.orderNumber || o.id.slice(0, 10);
    document.getElementById('res-name').textContent = customer.name || '-';
    document.getElementById('res-phone').textContent = customer.phone || '-';
    document.getElementById('res-address').textContent =
        [customer.address, customer.thana, customer.district].filter(Boolean).join(', ') || '-';

    const dateStr = formatDate(o.createdAt);
    if (dateStr) {
        document.getElementById('res-date').textContent = dateStr;
        document.getElementById('res-date-line').classList.remove('hidden');
    } else {
        document.getElementById('res-date-line').classList.add('hidden');
    }

    // Status badge
    const badge = document.getElementById('res-status-badge');
    badge.textContent = (o.status || 'pending').toUpperCase();
    badge.className = 'text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ' + (STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600');

    // Timeline
    const currentIdx = STATUS_STEPS.findIndex(s => s.key === o.status);
    let timelineHtml = '';
    if (o.status === 'cancelled') {
        timelineHtml = `<div class="timeline-step active">
            <div class="dot" style="background: linear-gradient(135deg,#dc2626,#ef4444); color:white;">
                <i class="fas fa-times text-xs"></i>
            </div>
            <div>
                <p class="font-bold text-red-600 text-sm">Cancelled</p>
                <p class="text-xs text-gray-500 mt-0.5">অর্ডারটি বাতিল করা হয়েছে</p>
            </div>
        </div>`;
    } else {
        STATUS_STEPS.forEach((s, i) => {
            const isDone = i < currentIdx;
            const isActive = i === currentIdx;
            const cls = isDone ? 'done' : (isActive ? 'active' : '');
            timelineHtml += `
                <div class="timeline-step ${cls}">
                    <div class="dot"><i class="fas fa-${isDone ? 'check' : s.icon}"></i></div>
                    <div>
                        <p class="font-bold navy-text text-sm">${s.label}</p>
                        <p class="text-xs text-gray-500 mt-0.5">${s.desc}</p>
                    </div>
                </div>`;
        });
    }
    document.getElementById('timeline').innerHTML = timelineHtml;

    // Items
    const itemsHtml = items.map(item => `
        <div class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
            <img src="${item.image || 'https://via.placeholder.com/50x50?text=?'}" class="w-12 h-12 object-contain rounded-lg bg-gray-50 flex-shrink-0" onerror="this.src='https://via.placeholder.com/50x50?text=?'">
            <div class="flex-1 min-w-0">
                <p class="text-xs font-medium navy-text line-clamp-1">${escapeHtml(item.name)}</p>
                <p class="text-[10px] text-gray-500">৳${formatPrice(item.price)} × ${item.quantity}</p>
            </div>
            <p class="text-xs font-bold navy-text flex-shrink-0">৳${formatPrice((item.price || 0) * (item.quantity || 1))}</p>
        </div>
    `).join('');
    document.getElementById('res-items').innerHTML = itemsHtml || '<p class="text-xs text-gray-400 text-center py-2">No items</p>';

    // Payment
    document.getElementById('res-subtotal').textContent = '৳' + formatPrice(o.subtotal);

    const discountRow = document.getElementById('res-discount-row');
    if (o.discount > 0) {
        discountRow.classList.remove('hidden');
        document.getElementById('res-discount').textContent = '-৳' + formatPrice(o.discount);
    } else {
        discountRow.classList.add('hidden');
    }

    document.getElementById('res-delivery').textContent = Number(o.deliveryCharge) === 0 ? 'ফ্রি' : '৳' + formatPrice(o.deliveryCharge);
    document.getElementById('res-total').textContent = '৳' + formatPrice(o.total);
    document.getElementById('res-advance').textContent = '৳' + formatPrice(o.advancePaid);
    document.getElementById('res-due').textContent = '৳' + formatPrice(o.dueAmount);
    document.getElementById('res-method').textContent =
        o.paymentMethod === 'full-cod' ? 'Cash on Delivery' :
        o.paymentMethod === 'delivery-advance' ? 'Delivery Advance Paid' :
        o.paymentMethod === 'full-online' ? 'Full Online Payment' : (o.paymentMethod || '-');

    // Contact buttons
    const callBtn = document.getElementById('call-help');
    const waBtn = document.getElementById('wa-help');
    if (settings.contactPhone) {
        callBtn.href = `tel:${settings.contactPhone}`;
        callBtn.style.display = '';
    } else {
        callBtn.style.display = 'none';
    }
    if (settings.whatsapp) {
        waBtn.href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent('Order query: ' + (o.orderNumber || o.id))}`;
        waBtn.style.display = '';
    } else {
        waBtn.style.display = 'none';
    }

    document.getElementById('result').classList.remove('hidden');
}

// ============ INIT ============
async function init() {
    if (db) {
        try {
            const snap = await getDoc(doc(db, "settings", "main"));
            if (snap.exists()) {
                const s = snap.data();
                settings.whatsapp = s.whatsapp || '';
                settings.contactPhone = s.contactPhone || '';
            }
        } catch (e) {}
    }

    // Auto-track from URL
    const params = new URLSearchParams(window.location.search);
    const orderNum = params.get('order');
    if (orderNum) {
        document.getElementById('order-input').value = orderNum.toUpperCase();
        setTimeout(() => trackOrder(), 250);
    }

    // Input behavior
    const input = document.getElementById('order-input');
    input.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            trackOrder();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}