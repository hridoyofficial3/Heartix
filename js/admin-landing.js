// ============================================================
// HEARTIX ADMIN — Landing Pages Management
// ============================================================
import { db } from './firebase.js';
import { escapeHtml, formatPrice as fmt, showToast as toast } from './common.js';
import { logActivity } from './staff-activity.js';
import {
    collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = "ju2w6e9r";
const CLOUDINARY_UPLOAD_PRESET = "heartix_unsigned";

// ============ STATE ============
let allLandings = [];
let allProducts = [];
let editingId = null;
let selectedProductIds = [];
let pendingBanner = null;
let existingBanner = null;
let productPickerSelected = [];

// ============ UPLOAD ============
async function uploadImage(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST', body: fd
    });
    const result = await res.json();
    if (!result.secure_url) throw new Error(result.error?.message || 'Upload failed');
    return result.secure_url;
}

// ============ LOAD DATA ============
async function loadAll() {
    try {
        const [landSnap, prodSnap] = await Promise.all([
            getDocs(collection(db, 'landing_pages')).catch(() => null),
            getDocs(collection(db, 'products')).catch(() => null)
        ]);

        allLandings = [];
        if (landSnap) {
            landSnap.forEach(d => allLandings.push({ id: d.id, ...d.data() }));
            allLandings.sort((a, b) => {
                const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tb - ta;
            });
        }

        allProducts = [];
        if (prodSnap) prodSnap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));

        renderLandingList();
    } catch (e) {
        console.error('Load landings:', e);
        toast('লোড করা যায়নি', 'error');
    }
}

// ============ RENDER LIST ============
function renderLandingList() {
    const list = document.getElementById('landing-list-admin');
    if (!list) return;

    if (allLandings.length === 0) {
        list.innerHTML = `
            <div class="bg-white rounded-2xl p-12 text-center premium-shadow">
                <i class="fas fa-window-maximize text-4xl text-gray-200 mb-3"></i>
                <p class="text-sm text-gray-500 mb-2">এখনো কোনো landing page নেই</p>
                <p class="text-xs text-gray-400">"New Landing Page" tap করে প্রথম page বানান</p>
            </div>
        `;
        return;
    }

    const baseUrl = window.location.origin + window.location.pathname.replace(/\/admin\.html.*$/, '') + '/landing.html?slug=';

    let html = '';
    allLandings.forEach(l => {
        const isActive = l.active !== false;
        const productCount = Array.isArray(l.productIds) ? l.productIds.length : 0;
        const hasCountdown = !!l.countdownEnd;
        const badge = isActive
            ? '<span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>'
            : '<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">INACTIVE</span>';

        const previewBg = l.banner
            ? `background-image:url('${l.banner}');background-size:cover;background-position:center;`
            : `background:linear-gradient(135deg,#0A1628,#152238);`;

        html += `
            <div class="bg-white rounded-2xl premium-shadow overflow-hidden border-l-4 ${isActive ? 'border-gold' : 'border-gray-300'}">
                <div class="flex items-start gap-3 p-3">
                    <div class="w-16 h-16 rounded-xl flex-shrink-0" style="${previewBg}"></div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                            <p class="font-bold text-navy text-sm truncate">${escapeHtml(l.title || 'Untitled')}</p>
                            ${badge}
                        </div>
                        <p class="text-[11px] text-gray-500 truncate font-mono">/landing.html?slug=${escapeHtml(l.slug || '')}</p>
                        <div class="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                            <span><i class="fas fa-box mr-1"></i>${productCount} product</span>
                            ${hasCountdown ? `<span class="text-red-500"><i class="fas fa-clock mr-1"></i>Countdown</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-1.5 px-3 pb-3">
                    <button onclick="copyLandingLink('${escapeHtml(l.slug)}')" class="py-2 bg-blue-50 active:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                    <button onclick="openLandingPreview('${escapeHtml(l.slug)}')" class="py-2 bg-purple-50 active:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                        <i class="fas fa-external-link-alt"></i> Preview
                    </button>
                    <button onclick="editLanding('${l.id}')" class="py-2 bg-amber-50 active:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                        <i class="fas fa-pen"></i> Edit
                    </button>
                </div>
                <div class="grid grid-cols-1 gap-1.5 px-3 pb-3">
                    <button onclick="deleteLanding('${l.id}')" class="py-2 bg-red-50 active:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// ============ COPY LINK ============
window.copyLandingLink = function(slug) {
    const url = window.location.origin + window.location.pathname.replace(/\/admin\.html.*$/, '') + '/landing.html?slug=' + slug;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            toast('Link copy হয়েছে ✅');
        }).catch(() => {
            toast('Copy করা যায়নি', 'error');
        });
    } else {
        toast('Link: ' + url, 'info');
    }
};

// ============ PREVIEW ============
window.openLandingPreview = function(slug) {
    const url = 'landing.html?slug=' + encodeURIComponent(slug);
    window.open(url, '_blank', 'noopener');
};

// ============ OPEN NEW ============
window.openNewLanding = function() {
    editingId = null;
    selectedProductIds = [];
    pendingBanner = null;
    existingBanner = null;

    document.getElementById('landing-modal-title').textContent = 'New Landing Page';
    document.getElementById('landing-edit-id').value = '';
    document.getElementById('land-title').value = '';
    document.getElementById('land-slug').value = '';
    document.getElementById('land-badge').value = '';
    document.getElementById('land-subtitle').value = '';
    document.getElementById('land-description').value = '';
    document.getElementById('land-theme').value = 'navy';
    document.getElementById('land-countdown').value = '';
    document.getElementById('land-active').checked = true;
    document.getElementById('land-banner-file').value = '';
    document.getElementById('land-banner-name').textContent = '';
    document.getElementById('land-banner-preview').classList.add('hidden');
    document.getElementById('land-slug').disabled = false;

    renderSelectedProducts();
    document.getElementById('landing-modal').classList.remove('hidden');
};

// ============ EDIT ============
window.editLanding = async function(id) {
    const l = allLandings.find(x => x.id === id);
    if (!l) return;

    editingId = id;
    selectedProductIds = Array.isArray(l.productIds) ? [...l.productIds] : [];
    pendingBanner = null;
    existingBanner = l.banner || null;

    document.getElementById('landing-modal-title').textContent = 'Edit Landing Page';
    document.getElementById('landing-edit-id').value = id;
    document.getElementById('land-title').value = l.title || '';
    document.getElementById('land-slug').value = l.slug || '';
    document.getElementById('land-slug').disabled = true; // don't change slug on edit
    document.getElementById('land-badge').value = l.badge || '';
    document.getElementById('land-subtitle').value = l.subtitle || '';
    document.getElementById('land-description').value = l.description || '';
    document.getElementById('land-theme').value = l.theme || 'navy';
    document.getElementById('land-active').checked = l.active !== false;
    document.getElementById('land-banner-file').value = '';
    document.getElementById('land-banner-name').textContent = '';

    // Countdown date
    if (l.countdownEnd) {
        const d = new Date(l.countdownEnd);
        if (!isNaN(d.getTime())) {
            const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('land-countdown').value = iso;
        } else {
            document.getElementById('land-countdown').value = '';
        }
    } else {
        document.getElementById('land-countdown').value = '';
    }

    if (l.banner) {
        document.getElementById('land-banner-preview-img').src = l.banner;
        document.getElementById('land-banner-preview').classList.remove('hidden');
    } else {
        document.getElementById('land-banner-preview').classList.add('hidden');
    }

    renderSelectedProducts();
    document.getElementById('landing-modal').classList.remove('hidden');
};

// ============ CLOSE MODAL ============
window.closeLandingModal = function() {
    document.getElementById('landing-modal').classList.add('hidden');
    editingId = null;
    selectedProductIds = [];
    pendingBanner = null;
    existingBanner = null;
};

// ============ BANNER UPLOAD ============
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'land-banner-file') {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) {
            toast('ছবি ৫MB-র বেশি বড়', 'error');
            e.target.value = '';
            return;
        }
        const r = new FileReader();
        r.onload = evt => {
            pendingBanner = { file: f, dataUrl: evt.target.result };
            document.getElementById('land-banner-preview-img').src = evt.target.result;
            document.getElementById('land-banner-preview').classList.remove('hidden');
            document.getElementById('land-banner-name').textContent = '✔ ' + f.name;
        };
        r.readAsDataURL(f);
    }
});

window.clearLandingBanner = function() {
    pendingBanner = null;
    existingBanner = null;
    document.getElementById('land-banner-file').value = '';
    document.getElementById('land-banner-name').textContent = '';
    document.getElementById('land-banner-preview').classList.add('hidden');
};

// ============ PRODUCTS ============
function renderSelectedProducts() {
    const wrap = document.getElementById('land-selected-products');
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
}

window.removeSelectedProduct = function(idx) {
    selectedProductIds.splice(idx, 1);
    renderSelectedProducts();
};

window.openProductPickerLanding = function() {
    productPickerSelected = [...selectedProductIds];
    const search = document.getElementById('land-picker-search');
    if (search) search.value = '';
    renderPickerList();
    document.getElementById('land-picker-modal').classList.remove('hidden');
};

window.closeProductPickerLanding = function() {
    document.getElementById('land-picker-modal').classList.add('hidden');
};

window.renderPickerList = function() {
    const list = document.getElementById('land-picker-list');
    if (!list) return;
    const q = (document.getElementById('land-picker-search').value || '').toLowerCase();

    let items = allProducts.slice();
    if (q) items = items.filter(p => (p.name || '').toLowerCase().includes(q));

    if (items.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 text-xs py-6">No products</p>';
        return;
    }

    let html = '';
    items.forEach(p => {
        const checked = productPickerSelected.includes(p.id);
        html += `
            <label class="flex items-center gap-3 p-3 rounded-xl cursor-pointer active:bg-gray-100 ${checked ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border-2 border-transparent'}">
                <input type="checkbox" ${checked ? 'checked' : ''} onchange="togglePickerProduct('${p.id}', this.checked)" class="w-5 h-5 accent-[#D4A84B]">
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

window.togglePickerProduct = function(id, checked) {
    if (checked) {
        if (!productPickerSelected.includes(id)) productPickerSelected.push(id);
    } else {
        productPickerSelected = productPickerSelected.filter(x => x !== id);
    }
    renderPickerList();
};

window.confirmProductPicker = function() {
    selectedProductIds = [...productPickerSelected];
    renderSelectedProducts();
    closeProductPickerLanding();
};

// ============ AUTO SLUG ============
document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'land-title' && !editingId) {
        const slugInput = document.getElementById('land-slug');
        if (slugInput && !slugInput.dataset.touched) {
            const slug = e.target.value
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .slice(0, 60);
            slugInput.value = slug;
        }
    }
    if (e.target && e.target.id === 'land-slug') {
        e.target.dataset.touched = '1';
        e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }
});

// ============ SAVE ============
window.saveLanding = async function() {
    const title = (document.getElementById('land-title').value || '').trim();
    const slugRaw = (document.getElementById('land-slug').value || '').trim().toLowerCase();
    const badge = (document.getElementById('land-badge').value || '').trim();
    const subtitle = (document.getElementById('land-subtitle').value || '').trim();
    const description = (document.getElementById('land-description').value || '').trim();
    const theme = document.getElementById('land-theme').value;
    const countdownVal = document.getElementById('land-countdown').value;
    const isActive = document.getElementById('land-active').checked;

    if (!title || title.length < 2) return toast('Title দিন', 'error');
    if (!slugRaw || slugRaw.length < 2) return toast('Slug দিন', 'error');
    if (!/^[a-z0-9-]+$/.test(slugRaw)) return toast('Slug শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও ড্যাশ', 'error');
    if (selectedProductIds.length === 0) return toast('কমপক্ষে একটা product select করুন', 'error');

    // Check duplicate slug (only on new)
    if (!editingId && allLandings.some(l => l.slug === slugRaw)) {
        return toast('এই slug আগে থেকেই আছে', 'error');
    }

    const btn = document.getElementById('land-save-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';

    try {
        let bannerUrl = existingBanner;
        if (pendingBanner) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Uploading banner...';
            bannerUrl = await uploadImage(pendingBanner.file);
        }

        const countdownEnd = countdownVal ? new Date(countdownVal).toISOString() : '';

        const data = {
            title,
            slug: slugRaw,
            badge,
            subtitle,
            description,
            theme,
            banner: bannerUrl || '',
            countdownEnd,
            productIds: [...selectedProductIds],
            active: isActive,
            updatedAt: new Date().toISOString()
        };

        if (editingId) {
            await setDoc(doc(db, 'landing_pages', editingId), data, { merge: true });
            toast('Landing page update হয়েছে ✅');
            logActivity('settings_update', {
                description: `Landing page update: ${title} (/lp/${slugRaw})`,
                meta: { id: editingId, slug: slugRaw }
            });
        } else {
            data.createdAt = new Date().toISOString();
            const newRef = doc(collection(db, 'landing_pages'));
            await setDoc(newRef, data);
            toast('Landing page তৈরি হয়েছে ✅');
            logActivity('settings_update', {
                description: `নতুন Landing page: ${title} (/lp/${slugRaw})`,
                meta: { id: newRef.id, slug: slugRaw }
            });
        }

        closeLandingModal();
        await loadAll();
    } catch (e) {
        console.error('Save landing:', e);
        toast('Save করা যায়নি: ' + (e.message || 'unknown'), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check mr-1"></i> SAVE';
    }
};

// ============ DELETE ============
window.deleteLanding = async function(id) {
    const l = allLandings.find(x => x.id === id);
    if (!l) return;
    if (!confirm(`"${l.title}" landing page ডিলিট করবেন?\n\nএই link আর কাজ করবে না।`)) return;

    try {
        await deleteDoc(doc(db, 'landing_pages', id));
        toast('Landing page delete হয়েছে', 'warn');
        logActivity('settings_update', {
            description: `Landing page delete: ${l.title} (${l.slug})`,
            meta: { id, slug: l.slug }
        });
        await loadAll();
    } catch (e) {
        toast('Delete করা যায়নি', 'error');
    }
};

// ============ WRAP showTab ============
function wrapShowTab() {
    if (typeof window.showTab === 'function' && !window._landingWrapped) {
        const orig = window.showTab;
        window.showTab = function(tab) {
            orig.apply(this, arguments);
            if (tab === 'landing') setTimeout(loadAll, 100);
        };
        window._landingWrapped = true;
    }
}

setTimeout(wrapShowTab, 500);
setTimeout(wrapShowTab, 1500);
setTimeout(wrapShowTab, 2500);

console.log('✅ admin-landing.js loaded');