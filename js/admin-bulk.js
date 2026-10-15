// ============================================================
// HEARTIX ADMIN — Bulk CSV Upload (self-injecting module)
// ============================================================
import { db } from './firebase.js';
import { escapeHtml, showToast as toast } from './common.js';
import {
    collection, getDocs, doc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let parsedData = [];
let validRows = [];
let invalidRows = [];
let papaLoaded = false;

// ============ LOAD PAPAPARSE ============
async function loadPapaParse() {
    if (papaLoaded && typeof window.Papa !== 'undefined') return;
    return new Promise((resolve, reject) => {
        if (window.Papa) { papaLoaded = true; resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
        s.onload = () => { papaLoaded = true; resolve(); };
        s.onerror = () => reject(new Error('PapaParse load failed'));
        document.head.appendChild(s);
    });
}

// ============ INJECT BUTTON ============
function injectBulkButton() {
    const addBtn = document.querySelector('button[onclick="openAddModal()"]');
    if (!addBtn) return false;
    if (document.getElementById('bulk-upload-btn')) return true;
    const parent = addBtn.parentElement;
    if (!parent) return false;
    const btn = document.createElement('button');
    btn.id = 'bulk-upload-btn';
    btn.setAttribute('onclick', 'openBulkUpload()');
    btn.className = 'bg-purple-50 text-purple-700 border-2 border-purple-200 px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:bg-purple-100';
    btn.innerHTML = '<i class="fas fa-file-csv"></i> Bulk Upload';
    parent.insertBefore(btn, addBtn);
    return true;
}

// ============ INJECT MODAL ============
function injectModal() {
    if (document.getElementById('bulk-upload-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'bulk-upload-modal';
    modal.className = 'hidden fixed inset-0 modal-bg z-[85] flex items-end md:items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-2xl max-h-[95vh] flex flex-col">
            <div class="navy-gradient p-5 rounded-t-3xl flex justify-between items-center flex-shrink-0">
                <div>
                    <h3 class="text-white font-bold text-lg">Bulk Upload Products</h3>
                    <p class="text-gold text-[11px] mt-0.5">CSV file থেকে একসাথে অনেক product</p>
                </div>
                <button onclick="closeBulkUpload()" class="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-3">
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p class="text-xs font-bold text-blue-800 mb-1"><i class="fas fa-info-circle mr-1"></i> CSV Format</p>
                    <p class="text-[11px] text-blue-700 leading-relaxed">Columns: <code class="bg-white px-1 rounded">name, price, oldPrice, stock, category, image, brand, description</code></p>
                    <button onclick="downloadBulkTemplate()" class="mt-2 text-[11px] text-blue-700 font-bold underline">
                        <i class="fas fa-download mr-1"></i>Download Template
                    </button>
                </div>
                <div id="bulk-upload-options">
                    <label class="block cursor-pointer mb-2">
                        <div class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                            <i class="fas fa-cloud-upload-alt text-3xl text-gray-300 mb-2"></i>
                            <p class="text-xs text-gray-500 font-semibold">Click to select CSV file</p>
                            <p class="text-[10px] text-gray-400 mt-1">.csv file (max 5MB)</p>
                        </div>
                        <input type="file" id="bulk-csv-file" accept=".csv,text/csv" class="hidden">
                    </label>
                    <div class="text-center text-[10px] text-gray-400 font-bold py-1">— OR —</div>
                    <textarea id="bulk-csv-paste" placeholder="Paste CSV text here..." rows="3" class="w-full border-2 border-gray-100 rounded-xl px-3 py-2 outline-none text-xs font-mono"></textarea>
                    <button onclick="parsePastedCSV()" class="w-full mt-2 bg-gray-100 active:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold text-xs">
                        Parse Pasted CSV
                    </button>
                </div>
                <div id="bulk-preview-section" class="hidden">
                    <div class="flex justify-between items-center mb-2">
                        <p class="text-sm font-bold text-navy">Preview</p>
                        <button onclick="clearBulkPreview()" class="text-[11px] text-red-500 font-bold">
                            <i class="fas fa-times mr-1"></i>Clear
                        </button>
                    </div>
                    <div id="bulk-summary" class="mb-2"></div>
                    <div id="bulk-preview-table" class="border-2 border-gray-100 rounded-xl overflow-hidden max-h-[40vh] overflow-y-auto"></div>
                </div>
            </div>
            <div class="border-t border-gray-100 p-4 flex-shrink-0 grid grid-cols-2 gap-3">
                <button onclick="closeBulkUpload()" class="py-3 bg-gray-100 active:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm">
                    Cancel
                </button>
                <button onclick="processBulkUpload()" id="bulk-upload-process-btn" disabled class="btn-gold py-3 rounded-xl font-bold text-sm opacity-50 cursor-not-allowed">
                    <i class="fas fa-upload mr-1"></i> Upload Products
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
        const fi = document.getElementById('bulk-csv-file');
        if (fi) fi.addEventListener('change', handleBulkFile);
    }, 100);
}

// ============ WRAP showTab ============
function wrapShowTabForBulk() {
    if (typeof window.showTab === 'function' && !window._bulkWrapped) {
        const orig = window.showTab;
        window.showTab = function(tab) {
            orig.apply(this, arguments);
            if (tab === 'products') {
                setTimeout(injectBulkButton, 100);
                setTimeout(injectBulkButton, 500);
            }
        };
        window._bulkWrapped = true;
    }
}

// ============ MAIN ============
window.openBulkUpload = function() {
    injectModal();
    clearBulkPreview();
    document.getElementById('bulk-upload-modal').classList.remove('hidden');
};

window.closeBulkUpload = function() {
    const m = document.getElementById('bulk-upload-modal');
    if (m) m.classList.add('hidden');
};

window.clearBulkPreview = function() {
    parsedData = [];
    validRows = [];
    invalidRows = [];
    const s = document.getElementById('bulk-preview-section');
    const o = document.getElementById('bulk-upload-options');
    if (s) s.classList.add('hidden');
    if (o) o.classList.remove('hidden');
    const t = document.getElementById('bulk-csv-paste');
    if (t) t.value = '';
    const f = document.getElementById('bulk-csv-file');
    if (f) f.value = '';
    const btn = document.getElementById('bulk-upload-process-btn');
    if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.innerHTML = '<i class="fas fa-upload mr-1"></i> Upload Products';
    }
};

function handleBulkFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast('File too large (max 5MB)', 'error');
    parseCSVInput(file);
    e.target.value = '';
}

window.parsePastedCSV = function() {
    const text = (document.getElementById('bulk-csv-paste').value || '').trim();
    if (!text) return toast('CSV text দিন', 'warn');
    parseCSVInput(text);
};

async function parseCSVInput(input) {
    try {
        await loadPapaParse();
    } catch (e) {
        return toast('Parser load failed', 'error');
    }
    let result;
    if (typeof input === 'string') {
        result = window.Papa.parse(input, { header: true, skipEmptyLines: true });
    } else {
        result = await new Promise((resolve) => {
            window.Papa.parse(input, { header: true, skipEmptyLines: true, complete: resolve });
        });
    }
    if (!result.data || result.data.length === 0) {
        return toast('CSV-এ কোনো data নেই', 'warn');
    }
    parsedData = result.data;
    validateRows();
    renderBulkPreview();
}

function validateRows() {
    validRows = [];
    invalidRows = [];
    parsedData.forEach((row, idx) => {
        const errors = [];
        const name = String(row.name || '').trim();
        const price = parseFloat(row.price);
        const oldPrice = row.oldPrice ? parseFloat(row.oldPrice) : 0;
        const stock = row.stock ? parseInt(row.stock) : 10;
        const category = String(row.category || '').trim();
        const image = String(row.image || '').trim();
        const brand = String(row.brand || '').trim();
        const description = String(row.description || '').trim();

        if (!name || name.length < 2) errors.push('Name খালি/ছোট');
        if (isNaN(price) || price < 0) errors.push('Price ভুল');
        if (price > 10000000) errors.push('Price বেশি');
        if (row.oldPrice && (isNaN(oldPrice) || oldPrice < price)) errors.push('Old price < price');
        if (isNaN(stock) || stock < 0) errors.push('Stock ভুল');

        const rowObj = { rowNum: idx + 2, name, price, oldPrice, stock, category, image, brand, description };
        if (errors.length > 0) invalidRows.push({ ...rowObj, errors });
        else validRows.push(rowObj);
    });
}

function renderBulkPreview() {
    const summary = document.getElementById('bulk-summary');
    const table = document.getElementById('bulk-preview-table');
    const section = document.getElementById('bulk-preview-section');
    const options = document.getElementById('bulk-upload-options');
    const btn = document.getElementById('bulk-upload-process-btn');
    if (!summary || !table || !section || !options) return;
    options.classList.add('hidden');
    section.classList.remove('hidden');

    summary.innerHTML = `<div class="grid grid-cols-2 gap-2">
        <div class="bg-green-50 border border-green-200 rounded-lg p-2 text-center"><p class="font-bold text-green-700 text-lg">${validRows.length}</p><p class="text-[10px] text-green-600">Valid</p></div>
        <div class="${invalidRows.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-2 text-center"><p class="font-bold ${invalidRows.length > 0 ? 'text-red-700' : 'text-gray-500'} text-lg">${invalidRows.length}</p><p class="text-[10px] ${invalidRows.length > 0 ? 'text-red-600' : 'text-gray-500'}">Invalid</p></div>
    </div>`;

    let html = '<table class="w-full text-[10px]"><thead class="bg-gray-100 sticky top-0"><tr>';
    html += '<th class="p-2 text-left">#</th>';
    html += '<th class="p-2 text-left">Name</th>';
    html += '<th class="p-2 text-right">Price</th>';
    html += '<th class="p-2 text-center">Stock</th>';
    html += '<th class="p-2 text-left">Category</th>';
    html += '<th class="p-2 text-center">Status</th>';
    html += '</tr></thead><tbody>';

    const allRows = [...validRows.map(r => ({ ...r, valid: true })), ...invalidRows.map(r => ({ ...r, valid: false }))].sort((a, b) => a.rowNum - b.rowNum);
    allRows.slice(0, 50).forEach(r => {
        const bg = r.valid ? '' : 'bg-red-50';
        const statusCell = r.valid
            ? '<span class="text-green-600 font-bold"><i class="fas fa-check"></i> OK</span>'
            : `<span class="text-red-600 font-bold"><i class="fas fa-times"></i> ${escapeHtml(r.errors[0])}</span>`;
        html += `<tr class="border-t border-gray-100 ${bg}"><td class="p-2 text-gray-400">${r.rowNum}</td><td class="p-2 font-semibold text-navy max-w-[200px] truncate">${escapeHtml(r.name)}</td><td class="p-2 text-right">${r.price > 0 ? '৳' + r.price.toLocaleString('en-IN') : '-'}</td><td class="p-2 text-center">${r.stock}</td><td class="p-2 text-gray-500 max-w-[100px] truncate">${escapeHtml(r.category || '-')}</td><td class="p-2 text-center">${statusCell}</td></tr>`;
    });
    html += '</tbody></table>';
    if (allRows.length > 50) html += `<p class="text-[10px] text-gray-400 text-center py-2 bg-gray-50">... এবং ${allRows.length - 50} টি আরও</p>`;
    table.innerHTML = html;

    if (btn) {
        if (validRows.length > 0) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = `<i class="fas fa-upload mr-1"></i> Upload ${validRows.length} Products`;
        } else {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = `<i class="fas fa-upload mr-1"></i> No Valid Rows`;
        }
    }
}

window.processBulkUpload = async function() {
    if (validRows.length === 0) return;
    if (!confirm(`${validRows.length} টি product upload করবেন?`)) return;

    const btn = document.getElementById('bulk-upload-process-btn');
    btn.disabled = true;
    btn.classList.add('opacity-80');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Uploading...';

    try {
        const existingSnap = await getDocs(collection(db, "products"));
        const catMaxOrder = {};
        existingSnap.forEach(d => {
            const pd = d.data();
            const cats = Array.isArray(pd.categories) ? pd.categories : (pd.category ? [pd.category] : []);
            cats.forEach(c => {
                const so = Number(pd.sortOrder);
                if (!isNaN(so) && so > (catMaxOrder[c] || -1)) catMaxOrder[c] = so;
            });
        });

        const chunkSize = 400;
        let uploaded = 0;

        for (let i = 0; i < validRows.length; i += chunkSize) {
            const chunk = validRows.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach(row => {
                const cats = row.category ? row.category.split(',').map(s => s.trim()).filter(Boolean) : [];
                const firstCat = cats[0] || 'Gadget';
                const currentMax = catMaxOrder[firstCat] || 0;
                catMaxOrder[firstCat] = currentMax + 1;
                const data = {
                    name: row.name, price: row.price, oldPrice: row.oldPrice || 0,
                    category: firstCat,
                    categories: cats.length > 0 ? cats : [firstCat],
                    stock: row.stock, brand: row.brand, description: row.description,
                    image: row.image, images: row.image ? [row.image] : [],
                    featured: false, pinned: false,
                    sortOrder: catMaxOrder[firstCat],
                    createdAt: new Date().toISOString(),
                    source: 'bulk-upload'
                };
                const newDocRef = doc(collection(db, "products"));
                batch.set(newDocRef, data);
            });
            await batch.commit();
            uploaded += chunk.length;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> ${uploaded}/${validRows.length} uploaded...`;
        }

        toast(`✅ ${uploaded} টি product upload হয়েছে!`, 'success');
        setTimeout(() => {
            closeBulkUpload();
            if (typeof window.loadProducts === 'function') window.loadProducts();
            else location.reload();
        }, 800);
    } catch (e) {
        console.error('Bulk upload failed:', e);
        toast('Upload failed: ' + e.message, 'error');
        btn.disabled = false;
        btn.classList.remove('opacity-80');
        btn.innerHTML = `<i class="fas fa-upload mr-1"></i> Upload ${validRows.length} Products`;
    }
};

window.downloadBulkTemplate = function() {
    const csv = `name,price,oldPrice,stock,category,image,brand,description
Smart LED TV 32",25000,30000,10,TV,https://example.com/tv.jpg,Samsung,Full HD smart television
Refrigerator 250L,45000,0,5,Fridge,https://example.com/fridge.jpg,Walton,Energy efficient
Ceiling Fan 56",3500,4000,20,Fan,https://example.com/fan.jpg,BRB,Rechargeable ceiling fan
Smart Watch,5000,6500,15,Gadget,https://example.com/watch.jpg,Xiaomi,Fitness tracker
Wireless Earbuds,2500,0,30,Gadget,https://example.com/buds.jpg,Realme,Bluetooth 5.0
`;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'heartix-products-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('Template downloaded!');
};

// ============ INIT ============
function initBulk() {
    setTimeout(wrapShowTabForBulk, 300);
    setTimeout(wrapShowTabForBulk, 1000);
    setTimeout(wrapShowTabForBulk, 2500);
    setTimeout(() => {
        const productsTab = document.getElementById('content-products');
        if (productsTab && !productsTab.classList.contains('hidden')) injectBulkButton();
    }, 2000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBulk);
} else {
    initBulk();
}

console.log('✅ admin-bulk.js loaded');