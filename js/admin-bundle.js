// ============================================================
// HEARTIX ADMIN — Product Bundles (with Image Upload)
// ============================================================
import { db } from './firebase.js';
import { escapeHtml, formatPrice as fmt, showToast as toast } from './common.js';
import { logActivity } from './staff-activity.js';
import {
    collection, getDocs, doc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = "ju2w6e9r";
const CLOUDINARY_UPLOAD_PRESET = "heartix_unsigned";

let allBundles = [];
let allProducts = [];
let editingId = null;
let selectedProductIds = [];
let pickerSelected = [];
let pendingBundleImage = null;
let existingBundleImage = null;

async function uploadImage(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
    const result = await res.json();
    if (!result.secure_url) throw new Error(result.error?.message || 'Upload failed');
    return result.secure_url;
}

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
        list.innerHTML = `<div class="bg-white rounded-2xl p-12 text-center premium-shadow"><i class="fas fa-box-open text-4xl text-gray-200 mb-3"></i><p class="text-sm text-gray-500">এখনো কোনো bundle নেই</p></div>`;
        return;
    }

    let html = '';
    allBundles.forEach(b => {
        const isActive = b.active !== false;
        const previewBg = b.image ? `background-image:url('${b.image}');background-size:cover;background-position:center;` : `background:linear-gradient(135deg,#0A1628,#152238);`;
        html += `
            <div class="bg-white rounded-2xl premium-shadow overflow-hidden border-l-4 ${isActive ? 'border-gold' : 'border-gray-300'}">
                <div class="flex items-start gap-3 p-3">
                    <div class="w-16 h-16 rounded-xl flex-shrink-0 bg-gray-100" style="${previewBg}"></div>
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-navy text-sm truncate">${escapeHtml(b.title)}</p>
                        <div class="flex items-center gap-2 mt-1 text-[11px]">
                            <span class="text-gray-400 line-through">৳${fmt(b.originalPrice)}</span>
                            <span class="font-bold text-gold">৳${fmt(b.bundlePrice)}</span>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-1.5 px-3 pb-3">
                    <button onclick="editBundle('${b.id}')" class="py-2 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold"><i class="fas fa-pen"></i> Edit</button>
                    <button onclick="toggleBundle('${b.id}')" class="py-2 ${isActive ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'} rounded-lg text-[10px] font-bold"><i class="fas fa-${isActive ? 'pause' : 'play'}"></i> ${isActive ? 'Disable' : 'Enable'}</button>
                    <button onclick="deleteBundle('${b.id}')" class="py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// ============ OPEN / EDIT ============
window.openNewBundle = function() {
    editingId = null; selectedProductIds = []; pickerSelected = []; pendingBundleImage = null; existingBundleImage = null;
    document.getElementById('bundle-modal-title').textContent = 'New Bundle';
    document.getElementById('bundle-edit-id').value = '';
    document.getElementById('bundle-title').value = '';
    document.getElementById('bundle-discount-type').value = 'fixed';
    document.getElementById('bundle-discount-value').value = '';
    document.getElementById('bundle-active').checked = true;
    document.getElementById('bundle-image-file').value = '';
    document.getElementById('bundle-file-name').textContent = '';
    document.getElementById('bundle-image-preview').classList.add('hidden');
    renderSelectedProducts(); updateBundleCalculations();
    document.getElementById('bundle-modal').classList.remove('hidden');
};

window.editBundle = function(id) {
    const b = allBundles.find(x => x.id === id); if (!b) return;
    editingId = id; selectedProductIds = [...(b.productIds || [])]; pickerSelected = []; pendingBundleImage = null; existingBundleImage = b.image || null;
    document.getElementById('bundle-modal-title').textContent = 'Edit Bundle';
    document.getElementById('bundle-edit-id').value = id;
    document.getElementById('bundle-title').value = b.title || '';
    document.getElementById('bundle-discount-type').value = b.discountType || 'fixed';
    document.getElementById('bundle-discount-value').value = b.discountValue || '';
    document.getElementById('bundle-active').checked = b.active !== false;
    document.getElementById('bundle-image-file').value = '';
    document.getElementById('bundle-file-name').textContent = '';
    if (b.image) { document.getElementById('bundle-preview-img').src = b.image; document.getElementById('bundle-image-preview').classList.remove('hidden'); }
    else { document.getElementById('bundle-image-preview').classList.add('hidden'); }
    renderSelectedProducts(); updateBundleCalculations();
    document.getElementById('bundle-modal').classList.remove('hidden');
};

window.closeBundleModal = function() { document.getElementById('bundle-modal').classList.add('hidden'); };
window.clearBundleImage = function() { pendingBundleImage = null; existingBundleImage = null; document.getElementById('bundle-image-file').value = ''; document.getElementById('bundle-file-name').textContent = ''; document.getElementById('bundle-image-preview').classList.add('hidden'); };

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'bundle-image-file') {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = evt => { pendingBundleImage = { file: f, dataUrl: evt.target.result }; document.getElementById('bundle-preview-img').src = evt.target.result; document.getElementById('bundle-image-preview').classList.remove('hidden'); document.getElementById('bundle-file-name').textContent = '✔ ' + f.name; };
        r.readAsDataURL(f);
    }
});

// ============ CALCULATIONS & PRODUCTS ============
function updateBundleCalculations() {
    let originalPrice = 0;
    selectedProductIds.forEach(pid => { const p = allProducts.find(x => x.id === pid); if (p) originalPrice += (Number(p.price) || 0); });
    const discountType = document.getElementById('bundle-discount-type').value;
    const discountVal = parseFloat(document.getElementById('bundle-discount-value').value) || 0;
    let bundlePrice = discountType === 'percentage' ? originalPrice - (originalPrice * (discountVal / 100)) : originalPrice - discountVal;
    if (bundlePrice < 0) bundlePrice = 0;
    document.getElementById('bundle-original-price').textContent = `৳${fmt(originalPrice)}`;
    document.getElementById('bundle-final-price').textContent = `৳${fmt(Math.round(bundlePrice))}`;
}
document.addEventListener('input', e => { if (e.target && (e.target.id === 'bundle-discount-value' || e.target.id === 'bundle-discount-type')) updateBundleCalculations(); });

function renderSelectedProducts() {
    const wrap = document.getElementById('bundle-selected-products');
    if (selectedProductIds.length === 0) { wrap.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">কোনো product select করা হয়নি</p>'; return; }
    let html = '';
    selectedProductIds.forEach((pid, idx) => {
        const p = allProducts.find(x => x.id === pid); if (!p) return;
        html += `<div class="flex items-center gap-2 bg-gray-50 rounded-lg p-2 mb-1.5"><img src="${p.image || ''}" class="w-10 h-10 object-contain bg-white rounded-md flex-shrink-0"><div class="flex-1 min-w-0"><p class="text-[11px] font-semibold text-navy truncate">${escapeHtml(p.name)}</p><p class="text-[10px] text-gray-500">৳${fmt(p.price)}</p></div><button onclick="removeSelectedProduct(${idx})" class="w-7 h-7 bg-red-50 text-red-500 rounded-md flex items-center justify-center"><i class="fas fa-times text-[10px]"></i></button></div>`;
    });
    wrap.innerHTML = html; updateBundleCalculations();
}
window.removeSelectedProduct = function(idx) { selectedProductIds.splice(idx, 1); renderSelectedProducts(); };
window.openBundleProductPicker = function() { pickerSelected = [...selectedProductIds]; document.getElementById('bundle-picker-search').value = ''; renderBundlePicker(); document.getElementById('bundle-picker-modal').classList.remove('hidden'); };
window.closeBundleProductPicker = function() { document.getElementById('bundle-picker-modal').classList.add('hidden'); };
window.renderBundlePicker = function() {
    const list = document.getElementById('bundle-picker-list'); if (!list) return;
    const q = (document.getElementById('bundle-picker-search').value || '').toLowerCase();
    let items = allProducts.slice(); if (q) items = items.filter(p => (p.name || '').toLowerCase().includes(q));
    if (items.length === 0) { list.innerHTML = '<p class="text-center text-gray-400 text-xs py-6">No products</p>'; return; }
    list.innerHTML = items.map(p => {
        const checked = pickerSelected.includes(p.id);
        return `<label class="flex items-center gap-3 p-3 rounded-xl cursor-pointer ${checked ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border-2 border-transparent'}"><input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleBundlePicker('${p.id}', this.checked)" class="w-5 h-5 accent-[#D4A84B]"><img src="${p.image || ''}" class="w-12 h-12 object-contain bg-white rounded-lg"><div class="flex-1 min-w-0"><p class="text-xs font-semibold text-navy truncate">${escapeHtml(p.name)}</p><p class="text-[11px] text-gold font-bold">৳${fmt(p.price)}</p></div></label>`;
    }).join('');
};
window.toggleBundlePicker = function(id, checked) { if (checked) { if (!pickerSelected.includes(id)) pickerSelected.push(id); } else { pickerSelected = pickerSelected.filter(x => x !== id); } renderBundlePicker(); };
window.confirmBundlePicker = function() { selectedProductIds = [...pickerSelected]; renderSelectedProducts(); closeBundleProductPicker(); };

// ============ SAVE ============
window.saveBundle = async function() {
    const title = (document.getElementById('bundle-title').value || '').trim();
    const discountType = document.getElementById('bundle-discount-type').value;
    const discountVal = parseFloat(document.getElementById('bundle-discount-value').value) || 0;
    const isActive = document.getElementById('bundle-active').checked;

    if (!title || title.length < 2) return toast('Title দিন', 'error');
    if (selectedProductIds.length < 2) return toast('কমপক্ষে ২টা product select করুন', 'error');
    if (discountVal <= 0) return toast('Discount দিন', 'error');

    const btn = document.getElementById('bundle-save-btn'); btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';

    try {
        let finalImage = existingBundleImage;
        if (pendingBundleImage) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Uploading image...';
            finalImage = await uploadImage(pendingBundleImage.file);
        }

        let originalPrice = 0; selectedProductIds.forEach(pid => { const p = allProducts.find(x => x.id === pid); if (p) originalPrice += (Number(p.price) || 0); });
        let bundlePrice = discountType === 'percentage' ? originalPrice - (originalPrice * (discountVal / 100)) : originalPrice - discountVal;
        if (bundlePrice < 0) bundlePrice = 0; bundlePrice = Math.round(bundlePrice);

        const data = { title, productIds: [...selectedProductIds], originalPrice, bundlePrice, discountType, discountValue: discountVal, image: finalImage || '', active: isActive, updatedAt: new Date().toISOString() };

        if (editingId) { await setDoc(doc(db, 'bundles', editingId), data, { merge: true }); toast('Bundle update হয়েছে ✅'); logActivity('settings_update', { description: `Bundle update: ${title}` }); }
        else { data.createdAt = new Date().toISOString(); await setDoc(doc(collection(db, 'bundles')), data); toast('Bundle তৈরি হয়েছে ✅'); logActivity('settings_update', { description: `নতুন Bundle: ${title}` }); }

        closeBundleModal(); await loadAll();
    } catch (e) { toast('Error: ' + e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-1"></i> SAVE BUNDLE'; }
};

window.deleteBundle = async function(id) { if (!confirm('এই bundle টি ডিলিট করবেন?')) return; await deleteDoc(doc(db, 'bundles', id)); toast('Deleted', 'warn'); await loadAll(); };
window.toggleBundle = async function(id) { const b = allBundles.find(x => x.id === id); if (!b) return; await setDoc(doc(db, 'bundles', id), { active: b.active === false }, { merge: true }); await loadAll(); };

function wrapShowTab() { if (typeof window.showTab === 'function' && !window._bundleWrapped) { const orig = window.showTab; window.showTab = function(tab) { orig.apply(this, arguments); if (tab === 'bundles') setTimeout(loadAll, 100); }; window._bundleWrapped = true; } }
setTimeout(wrapShowTab, 500); setTimeout(wrapShowTab, 1500);