// ============================================================
// HEARTIX ADMIN — Reorder Module (Category + Section)
// ============================================================
import { db } from './firebase.js';
import { escapeHtml, showToast as toast } from './common.js';

import {
    doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let localCategories = [];
let localSections = [];
let categoriesChanged = false;
let sectionsChanged = false;

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

console.log('✅ admin-reorder.js loaded');