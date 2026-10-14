// ============================================================
// HEARTIX ADMIN — Reorder Module (Category + Section + Product)
// ============================================================
import { db } from './firebase.js';
import { escapeHtml, showToast as toast } from './common.js';

import {
    doc, getDoc, setDoc, collection, getDocs, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let localCategories = [];
let localSections = [];
let localProducts = [];
let categoriesChanged = false;
let sectionsChanged = false;
let productsChanged = false;
let currentReorderCategory = '';

// ============ FETCH ============
async function fetchSettings() {
    const snap = await getDoc(doc(db, "settings", "main"));
    return snap.exists() ? snap.data() : {};
}

// ============================================================
// CATEGORY REORDER
// ============================================================
window.openCategoryReorder = async function() {
    try {
        const settings = await fetchSettings();
        localCategories = Array.isArray(settings.categories) ? JSON.parse(JSON.stringify(settings.categories)) : [];
        categoriesChanged = false;
        renderCategoryReorderList();
        document.getElementById('category-reorder-modal').classList.remove('hidden');
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

window.closeCategoryReorder = function() {
    document.getElementById('category-reorder-modal').classList.add('hidden');
    if (categoriesChanged) {
        toast('ক্রম সংরক্ষিত হয়েছে ✅', 'success');
        setTimeout(() => location.reload(), 500);
    }
};

function renderCategoryReorderList() {
    const list = document.getElementById('category-reorder-list');
    if (!list) return;
    if (localCategories.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 text-sm py-8">No categories</p>';
        return;
    }
    let html = '';
    localCategories.forEach((c, i) => {
        const isFirst = i === 0;
        const isLast = i === localCategories.length - 1;
        const isImg = c.icon && (c.icon.startsWith('http') || c.icon.startsWith('data:'));
        const iconHtml = isImg
            ? `<img src="${c.icon}" class="w-full h-full object-contain">`
            : `<span class="text-xl">${c.icon || '📦'}</span>`;
        html += `<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
            <div class="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-gray-100">
                ${iconHtml}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-navy truncate">${escapeHtml(c.label)}</p>
                <p class="text-[10px] text-gray-500">${escapeHtml(c.key)}</p>
            </div>
            <div class="flex flex-col gap-1 flex-shrink-0">
                <button onclick="moveCategoryUp(${i})" ${isFirst ? 'disabled' : ''} class="w-8 h-8 rounded-lg flex items-center justify-center ${isFirst ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 active:bg-blue-100'}">
                    <i class="fas fa-chevron-up text-xs"></i>
                </button>
                <button onclick="moveCategoryDown(${i})" ${isLast ? 'disabled' : ''} class="w-8 h-8 rounded-lg flex items-center justify-center ${isLast ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 active:bg-blue-100'}">
                    <i class="fas fa-chevron-down text-xs"></i>
                </button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

window.moveCategoryUp = async function(idx) {
    if (idx <= 0 || idx >= localCategories.length) return;
    [localCategories[idx - 1], localCategories[idx]] = [localCategories[idx], localCategories[idx - 1]];
    categoriesChanged = true;
    renderCategoryReorderList();
    try {
        await setDoc(doc(db, "settings", "main"), { categories: localCategories }, { merge: true });
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

window.moveCategoryDown = async function(idx) {
    if (idx < 0 || idx >= localCategories.length - 1) return;
    [localCategories[idx], localCategories[idx + 1]] = [localCategories[idx + 1], localCategories[idx]];
    categoriesChanged = true;
    renderCategoryReorderList();
    try {
        await setDoc(doc(db, "settings", "main"), { categories: localCategories }, { merge: true });
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

// ============================================================
// SECTION REORDER
// ============================================================
window.openSectionReorder = async function() {
    try {
        const settings = await fetchSettings();
        localSections = Array.isArray(settings.customSections) ? JSON.parse(JSON.stringify(settings.customSections)) : [];
        sectionsChanged = false;
        renderSectionReorderList();
        document.getElementById('section-reorder-modal').classList.remove('hidden');
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

window.closeSectionReorder = function() {
    document.getElementById('section-reorder-modal').classList.add('hidden');
    if (sectionsChanged) {
        toast('ক্রম সংরক্ষিত হয়েছে ✅', 'success');
        setTimeout(() => location.reload(), 500);
    }
};

function renderSectionReorderList() {
    const list = document.getElementById('section-reorder-list');
    if (!list) return;
    if (localSections.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 text-sm py-8">No sections</p>';
        return;
    }
    let html = '';
    localSections.forEach((s, i) => {
        const isFirst = i === 0;
        const isLast = i === localSections.length - 1;
        html += `<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
            <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-layer-group text-purple-600 text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-navy truncate">${escapeHtml(s.title || '')}</p>
                <p class="text-[10px] text-gray-500">${escapeHtml(s.categoryKey || '')}</p>
            </div>
            <div class="flex flex-col gap-1 flex-shrink-0">
                <button onclick="moveSectionUp(${i})" ${isFirst ? 'disabled' : ''} class="w-8 h-8 rounded-lg flex items-center justify-center ${isFirst ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 active:bg-blue-100'}">
                    <i class="fas fa-chevron-up text-xs"></i>
                </button>
                <button onclick="moveSectionDown(${i})" ${isLast ? 'disabled' : ''} class="w-8 h-8 rounded-lg flex items-center justify-center ${isLast ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 active:bg-blue-100'}">
                    <i class="fas fa-chevron-down text-xs"></i>
                </button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

window.moveSectionUp = async function(idx) {
    if (idx <= 0 || idx >= localSections.length) return;
    [localSections[idx - 1], localSections[idx]] = [localSections[idx], localSections[idx - 1]];
    sectionsChanged = true;
    renderSectionReorderList();
    try {
        await setDoc(doc(db, "settings", "main"), { customSections: localSections }, { merge: true });
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

window.moveSectionDown = async function(idx) {
    if (idx < 0 || idx >= localSections.length - 1) return;
    [localSections[idx], localSections[idx + 1]] = [localSections[idx + 1], localSections[idx]];
    sectionsChanged = true;
    renderSectionReorderList();
    try {
        await setDoc(doc(db, "settings", "main"), { customSections: localSections }, { merge: true });
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

// ============================================================
// PRODUCT REORDER
// ============================================================
window.openProductReorder = async function() {
    try {
        const settings = await fetchSettings();
        const cats = Array.isArray(settings.categories) ? settings.categories : [];
        if (cats.length === 0) {
            return toast('প্রথমে ক্যাটেগরি তৈরি করুন', 'warn');
        }

        // Fetch all products
        const snap = await getDocs(collection(db, "products"));
        localProducts = [];
        snap.forEach(d => localProducts.push({ id: d.id, ...d.data() }));

        // Populate category dropdown
        const sel = document.getElementById('product-reorder-category');
        sel.innerHTML = '';
        cats.forEach(c => {
            const o = document.createElement('option');
            o.value = c.key;
            o.textContent = c.label;
            sel.appendChild(o);
        });

        currentReorderCategory = cats[0].key;
        sel.value = currentReorderCategory;
        productsChanged = false;

        renderProductReorderList();
        document.getElementById('product-reorder-modal').classList.remove('hidden');
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

window.closeProductReorder = function() {
    document.getElementById('product-reorder-modal').classList.add('hidden');
    if (productsChanged) {
        toast('ক্রম সংরক্ষিত হয়েছে ✅', 'success');
        setTimeout(() => location.reload(), 500);
    }
};

window.changeReorderCategory = function() {
    currentReorderCategory = document.getElementById('product-reorder-category').value;
    renderProductReorderList();
};

function getProductCategoriesLocal(p) {
    if (Array.isArray(p.categories) && p.categories.length > 0) return p.categories;
    if (p.category) return [p.category];
    return [];
}

function getProductsInCategory(catKey) {
    let filtered = localProducts.filter(p => getProductCategoriesLocal(p).includes(catKey));

    // Sort by sortOrder asc, then by name for fallback
    filtered.sort((a, b) => {
        const aOrder = Number(a.sortOrder);
        const bOrder = Number(b.sortOrder);
        const aHas = !isNaN(aOrder) && aOrder > 0;
        const bHas = !isNaN(bOrder) && bOrder > 0;
        if (aHas && bHas) return aOrder - bOrder;
        if (aHas) return -1;
        if (bHas) return 1;
        return (a.name || '').localeCompare(b.name || '');
    });

    return filtered;
}

function renderProductReorderList() {
    const list = document.getElementById('product-reorder-list');
    if (!list) return;

    const items = getProductsInCategory(currentReorderCategory);

    if (items.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 text-sm py-8">এই ক্যাটেগরিতে কোনো প্রোডাক্ট নেই</p>';
        return;
    }

    let html = '';
    items.forEach((p, i) => {
        const isFirst = i === 0;
        const isLast = i === items.length - 1;
        html += `<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
            <img src="${p.image || 'https://via.placeholder.com/40x40?text=?'}" class="w-10 h-10 object-contain bg-white rounded-lg flex-shrink-0 border border-gray-100" onerror="this.src='https://via.placeholder.com/40x40?text=?'">
            <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-navy truncate">${escapeHtml(p.name || '')}</p>
                <p class="text-[10px] text-gray-500">৳${Number(p.price || 0).toLocaleString('en-IN')}</p>
            </div>
            <div class="flex flex-col gap-1 flex-shrink-0">
                <button onclick="moveProductUp('${p.id}', ${i})" ${isFirst ? 'disabled' : ''} class="w-8 h-8 rounded-lg flex items-center justify-center ${isFirst ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 active:bg-blue-100'}">
                    <i class="fas fa-chevron-up text-xs"></i>
                </button>
                <button onclick="moveProductDown('${p.id}', ${i})" ${isLast ? 'disabled' : ''} class="w-8 h-8 rounded-lg flex items-center justify-center ${isLast ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 active:bg-blue-100'}">
                    <i class="fas fa-chevron-down text-xs"></i>
                </button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

async function saveProductSortOrder() {
    // Get products of current category in new order, assign sortOrder = index
    const items = getProductsInCategory(currentReorderCategory);
    if (items.length === 0) return;

    const batch = writeBatch(db);
    items.forEach((p, idx) => {
        batch.update(doc(db, "products", p.id), { sortOrder: idx });
    });
    await batch.commit();

    // Update local cache
    items.forEach((p, idx) => {
        const local = localProducts.find(x => x.id === p.id);
        if (local) local.sortOrder = idx;
    });

    productsChanged = true;
}

window.moveProductUp = async function(pid, idx) {
    if (idx <= 0) return;
    const items = getProductsInCategory(currentReorderCategory);
    if (idx >= items.length) return;

    const currentId = items[idx].id;
    const prevId = items[idx - 1].id;

    // Swap sortOrder values locally
    const currentP = localProducts.find(x => x.id === currentId);
    const prevP = localProducts.find(x => x.id === prevId);
    if (!currentP || !prevP) return;

    const currentOrder = Number(currentP.sortOrder);
    const prevOrder = Number(prevP.sortOrder);
    currentP.sortOrder = isNaN(prevOrder) ? (idx - 1) : prevOrder;
    prevP.sortOrder = isNaN(currentOrder) ? idx : currentOrder;

    renderProductReorderList();
    try {
        await saveProductSortOrder();
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

window.moveProductDown = async function(pid, idx) {
    const items = getProductsInCategory(currentReorderCategory);
    if (idx < 0 || idx >= items.length - 1) return;

    const currentId = items[idx].id;
    const nextId = items[idx + 1].id;

    const currentP = localProducts.find(x => x.id === currentId);
    const nextP = localProducts.find(x => x.id === nextId);
    if (!currentP || !nextP) return;

    const currentOrder = Number(currentP.sortOrder);
    const nextOrder = Number(nextP.sortOrder);
    currentP.sortOrder = isNaN(nextOrder) ? (idx + 1) : nextOrder;
    nextP.sortOrder = isNaN(currentOrder) ? idx : currentOrder;

    renderProductReorderList();
    try {
        await saveProductSortOrder();
    } catch (e) {
        toast('Error: ' + e.message, 'error');
    }
};

console.log('✅ admin-reorder.js loaded (with product reorder)');