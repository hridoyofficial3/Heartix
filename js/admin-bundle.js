// ============================================================
// HEARTIX ADMIN — Product Bundles
// ============================================================
import { db } from './firebase.js';
import { escapeHtml, formatPrice as fmt, showToast as toast } from './common.js';
import { logActivity } from './staff-activity.js';
import {
    collection, getDocs, doc, getDoc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allBundles = [];
let allProducts = [];
let editingId = null;
let selectedProductIds = [];
let pickerSelected = [];

// ============ LOAD ============
async function loadAll() {
    try {
        const [bundleSnap, prodSnap] = await Promise.all([
            getDocs(collection(db, 'bundles')).catch(() => null),
            getDocs(collection(db, 'products')).catch(() => null)
        ]);

        allBundles = [];
        if (bundleSnap) {
            bundleSnap.forEach(d => allBundles.push({ id: d.id, ...d.data() }));
            allBundles.sort((a, b) => {
                const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tb - ta;
            });
        }

        allProducts = [];
        if (prodSnap) prodSnap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));

        renderBundleList();
    } catch (e) {
        console.error('Load bundles:', e);
        toast('লোড করা যায়নি', 'error');
    }
}

// ============ RENDER LIST ============
function renderBundleList() {
    const list = document.getElementById('bundle-list-admin');
    if (!list) return;

    if (allBundles.length === 0) {
        list.innerHTML = `
            <div class="bg-white rounded-2xl p-12 text-center premium-shadow">
                <i class="fas fa-box-open text-4xl text-gray-200 mb-3"></i>
                <p class="text-sm text-gray-500 mb-2">এখনো কোনো bundle নেই</p>
                <p class="text-xs text-gray-400">"New Bundle" tap করে প্রথম bundle বানান</p>
            </div>
        `;
        return;
    }

    let html = '';
    allBundles.forEach(b => {
        const isActive = b.active !== false;
        const productCount = Array.isArray(b.productIds) ? b.productIds.length : 0;
        const badge = isActive
            ? '<span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>'
            : '<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">INACTIVE</span>';

        const previewBg = b.image
            ? `background-image:url('${b.image}');background-size:cover;background-position:center;`
            : `background:linear-gradient(135deg,#0A1628,#152238);`;

        html += `
            <div class="bg-white rounded-2xl premium-shadow overflow-hidden border-l-4 ${isActive ? 'border-gold' : 'border-gray-300'}">
                <div class="flex items-start gap-3 p-3">
                    <div class="w-16 h-16 rounded-xl flex-shrink-0" style="${previewBg}"></div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                            <p class="font-bold text-navy text-sm truncate">${escapeHtml(b.title || 'Untitled')}</p>
                            ${badge}
                        </div>
                        <p class="text-[11px] text-gray-500 font-semibold">${productCount}টি প্রোডাক্ট</p>
                        <div class="flex items-center gap-3 mt-1 text-[11px]">
                            <span class="text-gray-400 line-through">৳${fmt(b.originalPrice)}</span>
                            <span class="font-bold text-gold">৳${fmt(b.bundlePrice)}</span>
                            <span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold">SAVE ৳${fmt(b.originalPrice - b.bundlePrice)}</span>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-1.5 px-3 pb-3">
                    <button onclick="editBundle('${b.id}')" class="py-2 bg-amber-50 active:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                        <i class="fas fa-pen"></i> Edit
                    </button>
                    <button onclick="toggleBundle('${b.id}')" class="py-2 ${isActive ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'} rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                        <i class="fas fa-${isActive ? 'pause' : 'play'}"></i> ${isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button onclick="deleteBundle('${b.id}')" class="py-2 bg-red-50 active:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// ============ OPEN NEW ============
window.openNewBundle = function() {
    editingId = null;
    selectedProductIds = [];
    pickerSelected = [];

    document.getElementById('bundle-modal-title').textContent = 'New Bundle';
    document.getElementById('bundle-edit-id').value = '';
    document.getElementById('bundle-title').value = '';
    document.getElementById('bundle-discount-type').value = 'fixed';
    document.getElementById('bundle-discount-value').value = '';
    document.getElementById('bundle-active').checked = true;

    renderSelectedProducts();
    updateBundleCalculations();
    document.getElementById('bundle-modal').classList.remove('hidden');
};

// ============ EDIT ============
window.editBundle = function(id) {
    const b = allBundles.find(x => x.id === id);
    if (!b) return;

    editingId = id;
    selectedProductIds = Array.isArray(b.productIds) ? [...b.productIds] : [];
    pickerSelected = [];

    document.getElementById('bundle-modal-title').textContent = 'Edit Bundle';
    document.getElementById('bundle-edit-id').value = id;
    document.getElementById('bundle-title').value = b.title || '';
    document.getElementById('bundle-discount-type').value = b.discountType || 'fixed';
    document.getElementById('bundle-discount-value').value = b.discountValue || '';
    document.getElementById('bundle-active').checked = b.active !== false;

    renderSelectedProducts();
    updateBundleCalculations();
    document.getElementById('bundle-modal').classList.remove('hidden');
};

// ============ CLOSE ============
window.closeBundleModal = function() {
    document.getElementById('bundle-modal').classList.add('hidden');
    editingId = null;
    selectedProductIds = [];
    pickerSelected = [];
};

// ============ CALCULATIONS ============
function updateBundleCalculations() {
    let originalPrice = 0;
    selectedProductIds.forEach(pid => {
        const p = allProducts.find(x => x.id === pid);
        if (p) originalPrice += (Number(p.price) || 0);
    });

    const discountType = document.getElementById('bundle-discount-type').value;
    const discountVal = parseFloat(document.getElementById('bundle-discount-value').value) || 0;

    let bundlePrice = originalPrice;
    if (discountType === 'percentage') {
        bundlePrice = originalPrice - (originalPrice * (discountVal / 100));
    } else {
        bundlePrice = originalPrice - discountVal;
    }
    if (bundlePrice < 0) bundlePrice = 0;

    document.getElementById('bundle-original-price').textContent = `৳${fmt(originalPrice)}`;
    document.getElementById('bundle-final-price').textContent = `৳${fmt(Math.round(bundlePrice))}`;
}

document.addEventListener('input', function(e) {
    if (e.target && (e.target.id === 'bundle-discount-value' || e.target.id === 'bundle-discount-type')) {
        updateBundleCalculations();
    }
});

// ============ PRODUCTS ============
function renderSelectedProducts() {
    const wrap = document.getElementById('bundle-selected-products');
    if (!wrap) return;

    if (selectedProductIds.length === 0) {
        wrap.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">কোনো product select করা হয়নি</p>';
        return;
    }

    let html = '';
    selectedProductIds.forEach((pid, idx) => {
        const p = allProducts.find(x => x.id === pid);
        if (!p) return;
        html += `
            <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-2 mb-1.5">
                <img src="${p.image || 'https://via.placeholder.com/40x40?text=?'}" class="w-10 h-10 object-contain bg-white rounded-md flex-shrink-0" onerror="this.src='https://via.placeholder.com/40x40?text=?'">
                <div class="flex-1 min-w-0">
                    <p class="text-[11px] font-semibold text-navy truncate">${escapeHtml(p.name)}</p>
                    <p class="text-[10px] text-gray-500">৳${fmt(p.price)}</p>
                </div>
                <button onclick="removeSelectedProduct(${idx})" class="w-7 h-7 bg-red-50 active:bg-red-100 text-red-500 rounded-md flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-times text-[10px]"></i>
                </button>
            </div>
        `;
    });
    wrap.innerHTML = html;
    updateBundleCalculations();
}

window.removeSelectedProduct = function(idx) {
    selectedProductIds.splice(idx, 1);
    renderSelectedProducts();
};

window.openBundleProductPicker = function() {
    pickerSelected = [...selectedProductIds];
    document.getElementById('bundle-picker-search').value = '';
    renderBundlePicker();
    document.getElementById('bundle-picker-modal').classList.remove('hidden');
};

window.closeBundleProductPicker = function() {
    document.getElementById('bundle-picker-modal').classList.add('hidden');
};

window.renderBundlePicker = function() {
    const list = document.getElementById('bundle-picker-list');
    if (!list) return;
    const q = (document.getElementById('bundle-picker-search').value || '').toLowerCase();

    let items = allProducts.slice();
    if (q) items = items.filter(p => (p.name || '').toLowerCase().includes(q));

    if (items.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 text-xs py-6">No products</p>';
        return;
    }

    let html = '';
    items.forEach(p => {
        const checked = pickerSelected.includes(p.id);
        html += `
            <label class="flex items-center gap-3 p-3 rounded-xl cursor-pointer active:bg-gray-100 ${checked ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border-2 border-transparent'}">
                <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleBundlePicker('${p.id}', this.checked)" class="w-5 h-5 accent-[#D4A84B]">
                <img src="${p.image || 'https://via.placeholder.com/50x50?text=?'}" class="w-12 h-12 object-contain bg-white rounded-lg flex-shrink-0" onerror="this.src='https://via.placeholder.com/50x50?text=?'">
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-navy truncate">${escapeHtml(p.name)}</p>
                    <p class="text-[11px] text-gold font-bold">৳${fmt(p.price)}</p>
                </div>
            </label>
        `;
    });
    list.innerHTML = html;
};

window.toggleBundlePicker = function(id, checked) {
    if (checked) {
        if (!pickerSelected.includes(id)) pickerSelected.push(id);
    } else {
        pickerSelected = pickerSelected.filter(x => x !== id);
    }
    renderBundlePicker();
};

window.confirmBundlePicker = function() {
    selectedProductIds = [...pickerSelected];
    renderSelectedProducts();
    closeBundleProductPicker();
};

// ============ SAVE ============
window.saveBundle = async function() {
    const title = (document.getElementById('bundle-title').value || '').trim();
    const discountType = document.getElementById('bundle-discount-type').value;
    const discountVal = parseFloat(document.getElementById('bundle-discount-value').value) || 0;
    const isActive = document.getElementById('bundle-active').checked;

    if (!title || title.length < 2) return toast('Title দিন', 'error');
    if (selectedProductIds.length < 2) return toast('কমপক্ষে ২টা product select করুন', 'error');
    if (discountVal <= 0) return toast('Discount দিন', 'error');
    if (discountType === 'percentage' && discountVal > 90) return toast('Percentage ৯০% এর বেশি হতে পারবে না', 'error');

    const btn = document.getElementById('bundle-save-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';

    try {
        // Calculate prices
        let originalPrice = 0;
        selectedProductIds.forEach(pid => {
            const p = allProducts.find(x => x.id === pid);
            if (p) originalPrice += (Number(p.price) || 0);
        });

        let bundlePrice = originalPrice;
        if (discountType === 'percentage') {
            bundlePrice = originalPrice - (originalPrice * (discountVal / 100));
        } else {
            bundlePrice = originalPrice - discountVal;
        }
        if (bundlePrice < 0) bundlePrice = 0;
        bundlePrice = Math.round(bundlePrice);

        // Get first product image for preview
        const firstProduct = allProducts.find(x => x.id === selectedProductIds[0]);
        const image = firstProduct ? firstProduct.image : '';

        const data = {
            title,
            productIds: [...selectedProductIds],
            originalPrice,
            bundlePrice,
            discountType,
            discountValue: discountVal,
            image,
            active: isActive,
            updatedAt: new Date().toISOString()
        };

        if (editingId) {
            await setDoc(doc(db, 'bundles', editingId), data, { merge: true });
            toast('Bundle update হয়েছে ✅');
            logActivity('settings_update', { description: `Bundle update: ${title}` });
        } else {
            data.createdAt = new Date().toISOString();
            const newRef = doc(collection(db, 'bundles'));
            await setDoc(newRef, data);
            toast('Bundle তৈরি হয়েছে ✅');
            logActivity('settings_update', { description: `নতুন Bundle: ${title}` });
        }

        closeBundleModal();
        await loadAll();
    } catch (e) {
        console.error('Save bundle:', e);
        toast('Save করা যায়নি', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check mr-1"></i> SAVE';
    }
};

// ============ DELETE ============
window.deleteBundle = async function(id) {
    const b = allBundles.find(x => x.id === id);
    if (!b) return;
    if (!confirm(`"${b.title}" bundle ডিলিট করবেন?`)) return;

    try {
        await deleteDoc(doc(db, 'bundles', id));
        toast('Bundle delete হয়েছে', 'warn');
        logActivity('settings_update', { description: `Bundle delete: ${b.title}` });
        await loadAll();
    } catch (e) {
        toast('Delete করা যায়নি', 'error');
    }
};

// ============ TOGGLE ============
window.toggleBundle = async function(id) {
    const b = allBundles.find(x => x.id === id);
    if (!b) return;
    const isActive = b.active !== false;
    try {
        await setDoc(doc(db, 'bundles', id), { active: !isActive }, { merge: true });
        toast(isActive ? 'Bundle disable হয়েছে' : 'Bundle enable হয়েছে');
        await loadAll();
    } catch (e) {
        toast('Error', 'error');
    }
};

// ============ WRAP showTab ============
function wrapShowTab() {
    if (typeof window.showTab === 'function' && !window._bundleWrapped) {
        const orig = window.showTab;
        window.showTab = function(tab) {
            orig.apply(this, arguments);
            if (tab === 'bundles') setTimeout(loadAll, 100);
        };
        window._bundleWrapped = true;
    }
}

setTimeout(wrapShowTab, 500);
setTimeout(wrapShowTab, 1500);
setTimeout(wrapShowTab, 2500);

console.log('✅ admin-bundle.js loaded');