// ============================================================
// HEARTIX INDEX (Home) + Premium Bundles
// ============================================================
import { db } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getCart, saveCart, getQtyInCart,
    getWishlist, saveWishlist, isInWishlist,
    getRecentlyViewed, addToRecentlyViewed,
    updateCartBadges, updateWishlistBadges
} from './common.js';

import {
    collection, getDocs, doc, getDoc, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allProducts = [];
let allReviews = [];
let allBundles = [];
let allSettings = {};
let currentFilter = 'all';
let currentSearch = '';
let categories = [];
let customSections = [];
let middleBanners = [];
let testimonials = [];
let heroBanners = [];
let isDataLoaded = false;
let displayedCount = 0;
const PAGE_SIZE = 12;
let currentBundleId = null; // For bundle modal

function getCategories(p) { if (Array.isArray(p.categories) && p.categories.length > 0) return p.categories; if (p.category) return [p.category]; return []; }
function sortProducts(list) {
    return list.sort((a, b) => {
        const aPinned = a.pinned === true ? 1 : 0; const bPinned = b.pinned === true ? 1 : 0; if (aPinned !== bPinned) return bPinned - aPinned;
        const aOrder = Number(a.sortOrder); const bOrder = Number(b.sortOrder); const aHas = !isNaN(aOrder) && aOrder > 0; const bHas = !isNaN(bOrder) && bOrder > 0;
        if (aHas && bHas) return aOrder - bOrder; if (aHas) return -1; if (bHas) return 1; return 0;
    });
}

window.openSidebar = function() { document.getElementById('sidebar').style.transform = 'translateX(0)'; document.getElementById('overlay').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
window.closeSidebar = function() { document.getElementById('sidebar').style.transform = 'translateX(-100%)'; document.getElementById('overlay').classList.add('hidden'); document.body.style.overflow = ''; }

let searchTimer = null;
window.toggleSearch = function() { const w = document.getElementById('search-bar-wrapper'); w.classList.toggle('open'); if (w.classList.contains('open')) setTimeout(() => document.getElementById('search-input').focus(), 350); else { document.getElementById('search-input').value = ''; currentSearch = ''; displayedCount = 0; hideSuggestions(); renderProducts(); } }
window.closeSearch = function() { document.getElementById('search-bar-wrapper').classList.remove('open'); document.getElementById('search-input').value = ''; document.getElementById('search-input').blur(); currentSearch = ''; displayedCount = 0; hideSuggestions(); renderProducts(); }
window.searchProducts = function() { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(() => { currentSearch = (document.getElementById('search-input').value || '').toLowerCase().trim(); displayedCount = 0; renderProducts(); showSuggestions(); }, 200); }
window.showSuggestions = function() {
    const q = (document.getElementById('search-input').value || '').toLowerCase().trim(); const box = document.getElementById('search-suggestions'); if (!q || q.length < 1) { hideSuggestions(); return; }
    const matches = allProducts.filter(p => (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || getCategories(p).some(c => c.toLowerCase().includes(q))).slice(0, 6);
    if (matches.length === 0) { hideSuggestions(); return; }
    box.innerHTML = matches.map(p => `<div class="suggestion-item" onclick="selectSuggestion('${p.id}')"><img src="${p.image || ''}" class="w-10 h-10 object-contain rounded-lg bg-gray-50"><div class="flex-1 min-w-0"><p class="text-xs font-semibold text-navy truncate">${escapeHtml(p.name)}</p><p class="text-[10px] text-gold font-bold">৳${formatPrice(p.price)}</p></div></div>`).join('');
    box.classList.add('show');
}
window.hideSuggestions = function() { const box = document.getElementById('search-suggestions'); if (box) box.classList.remove('show'); }
window.selectSuggestion = function(id) { window.location.href = 'product.html?id=' + encodeURIComponent(id); }
document.addEventListener('click', function(e) { const box = document.getElementById('search-suggestions'); const input = document.getElementById('search-input'); if (box && input && !box.contains(e.target) && e.target !== input) hideSuggestions(); });

window.filterByCategory = function(cat) {
    currentFilter = cat; displayedCount = 0; const input = document.getElementById('search-input'); if (input) input.value = ''; currentSearch = '';
    document.getElementById('search-bar-wrapper').classList.remove('open'); hideSuggestions();
    const found = categories.find(c => c.key === cat); document.getElementById('section-title').innerText = cat === 'all' ? 'Top Selling Products' : (found ? found.label : cat); renderProducts();
}

window.addToCart = function(id) {
    const p = allProducts.find(x => x.id === id); if (!p) return; const stock = p.stock !== undefined ? Number(p.stock) : 999; const isPreorder = stock <= 0;
    let cart = getCart(); const idx = cart.findIndex(i => i.id === id); const currentQty = idx > -1 ? (Number(cart[idx].quantity) || 0) : 0;
    if (!isPreorder && stock !== 999 && currentQty + 1 > stock) { showToast(`স্টকে মাত্র ${stock} টি`, 'error'); return; }
    if (idx > -1) { cart[idx].quantity = currentQty + 1; if (isPreorder) cart[idx].isPreorder = true; } 
    else { cart.push({ id, name: p.name, price: Number(p.price) || 0, image: p.image, quantity: 1, isPreorder }); }
    saveCart(cart); updateCartBadges(); showToast(isPreorder ? 'Pre-order কার্টে যোগ' : (p.name || '').substring(0, 30) + ' added', 'success'); renderProducts(); renderRecentlyViewed(); renderDynamicContent();
}

window.removeFromCart = function(id) { let cart = getCart(); const idx = cart.findIndex(i => i.id === id); if (idx > -1) { if (cart[idx].quantity > 1) cart[idx].quantity--; else cart.splice(idx, 1); saveCart(cart); updateCartBadges(); renderProducts(); renderRecentlyViewed(); renderDynamicContent(); } }

window.toggleWishlist = function(id, e) { if (e) { e.preventDefault(); e.stopPropagation(); } let w = getWishlist(); const idx = w.indexOf(id); const p = allProducts.find(x => x.id === id); if (idx > -1) { w.splice(idx, 1); showToast('Wishlist থেকে সরানো', 'warn'); } else { w.push(id); showToast('Wishlist-এ যোগ', 'success'); } saveWishlist(w); updateWishlistBadges(); renderProducts(); renderRecentlyViewed(); renderDynamicContent(); }

// ============ BUNDLE LOGIC ============
window.addBundleToCart = function(bundleId) {
    const b = allBundles.find(x => x.id === bundleId); if (!b) return;
    let cart = getCart(); const bundleItemId = 'bundle_' + b.id;
    if (cart.some(i => i.id === bundleItemId)) return showToast('Bundle আগেই কার্টে আছে', 'warn');
    cart.push({ id: bundleItemId, name: b.title, price: Number(b.bundlePrice) || 0, image: b.image || '', quantity: 1, isBundle: true, bundleItems: b.productIds, originalPrice: b.originalPrice });
    saveCart(cart); updateCartBadges(); showToast('✅ Bundle কার্টে যোগ হয়েছে', 'success'); renderDynamicContent();
}

window.openBundleDetail = function(id) {
    const b = allBundles.find(x => x.id === id); if (!b) return;
    currentBundleId = id;
    document.getElementById('bd-image').src = b.image || 'https://via.placeholder.com/600x400?text=Combo+Bundle';
    document.getElementById('bd-title').textContent = b.title;
    document.getElementById('bd-price').textContent = '৳' + formatPrice(b.bundlePrice);
    document.getElementById('bd-original').textContent = '৳' + formatPrice(b.originalPrice);
    document.getElementById('bd-save').textContent = 'Save ৳' + formatPrice(b.originalPrice - b.bundlePrice);
    let itemsHtml = '';
    b.productIds.forEach(pid => {
        const p = allProducts.find(x => x.id === pid);
        if (p) itemsHtml += `<a href="product.html?id=${p.id}" class="flex items-center gap-3 bg-gray-50 rounded-xl p-2 active:bg-gray-100 transition"><img src="${p.image || ''}" class="w-12 h-12 object-contain bg-white rounded-lg border border-gray-100 flex-shrink-0"><div class="flex-1 min-w-0"><p class="text-xs font-semibold text-navy line-clamp-2">${escapeHtml(p.name)}</p><p class="text-[10px] text-gray-500 mt-0.5">৳${formatPrice(p.price)}</p></div><i class="fas fa-chevron-right text-gray-300 text-[10px]"></i></a>`;
    });
    document.getElementById('bd-items').innerHTML = itemsHtml;
    document.getElementById('bundle-detail-modal').classList.remove('hidden');
}
window.closeBundleDetail = function() { document.getElementById('bundle-detail-modal').classList.add('hidden'); currentBundleId = null; }
window.addBundleToCartFromModal = function() { if (currentBundleId) { addBundleToCart(currentBundleId); closeBundleDetail(); } }

// ============ HERO & CATEGORIES ============
let slideIndex = 0, totalSlides = 0, heroTimer = null;
function getDefaultHeroBanners() { return [{ badge: '✨ Premium', title: 'Smart Living<br>Starts Here', subtitle: 'Premium appliances for modern homes', bg: 'navy' }]; }
function getHeroBgStyle(b) { if (b.image) return `background-image: url('${b.image}'); background-size: cover; background-position: center;`; if (b.bg === 'gold') return 'background: linear-gradient(135deg, #B8860B, #D4A84B, #E8C77B);'; if (b.bg === 'teal') return 'background: linear-gradient(135deg, #0F4C5C, #1A6B7C, #2C8B9E);'; return 'background: linear-gradient(135deg, #0A1628, #152238);'; }
function safeHeroTitle(t) { if (!t) return ''; return escapeHtml(t).replace(/&lt;br\s*\/?&gt;/gi, '<br>'); }
function renderHeroBanners() {
    const track = document.getElementById('slider-track'); const skeleton = document.getElementById('slider-skeleton'); const dotsContainer = document.getElementById('slider-dots'); if (!track || !dotsContainer) return;
    const banners = (Array.isArray(heroBanners) && heroBanners.length > 0) ? heroBanners : getDefaultHeroBanners(); totalSlides = banners.length;
    track.innerHTML = banners.map(b => { const bgStyle = getHeroBgStyle(b); const isGold = b.bg === 'gold' && !b.image; const textColor = isGold ? 'text-navy' : 'text-white'; const subColor = isGold ? 'text-navy/70' : 'text-white/70'; const badgeColor = isGold ? 'text-navy' : 'text-gold'; const content = `<div class="hero-content">${b.badge ? `<p class="${badgeColor} text-xs tracking-widest uppercase mb-2">${escapeHtml(b.badge)}</p>` : ''}<h2 class="${textColor} font-display text-2xl leading-tight mb-2">${safeHeroTitle(b.title)}</h2>${b.subtitle ? `<p class="${subColor} text-sm">${escapeHtml(b.subtitle)}</p>` : ''}</div>`; const wrapped = b.link ? `<a href="${escapeHtml(b.link)}" class="block" style="height:100%;">${content}</a>` : content; return `<div class="slider-slide" style="${bgStyle}">${wrapped}</div>`; }).join('');
    dotsContainer.innerHTML = banners.map((_, i) => `<button onclick="goSlide(${i})" class="slider-dot ${i === 0 ? 'active' : 'inactive'} h-1.5 rounded-full"></button>`).join('');
    slideIndex = 0; updateSlide(); if (skeleton) { skeleton.style.opacity = '0'; setTimeout(() => skeleton.style.display = 'none', 300); } track.classList.remove('opacity-0');
    if (heroTimer) clearInterval(heroTimer); if (totalSlides > 1) heroTimer = setInterval(() => { slideIndex = (slideIndex + 1) % totalSlides; updateSlide(); }, 4000);
}
window.goSlide = function(i) { slideIndex = i; updateSlide(); if (heroTimer) { clearInterval(heroTimer); if (totalSlides > 1) heroTimer = setInterval(() => { slideIndex = (slideIndex + 1) % totalSlides; updateSlide(); }, 4000); } }
function updateSlide() { const track = document.getElementById('slider-track'); if (track) track.style.transform = `translateX(-${slideIndex * 100}%)`; document.querySelectorAll('.slider-dot').forEach((d, i) => { d.className = i === slideIndex ? 'slider-dot active h-1.5 rounded-full' : 'slider-dot inactive h-1.5 rounded-full'; }); }

function renderCategories() {
    const list = document.getElementById('category-scroll-container'); const sidebarList = document.getElementById('sidebar-categories'); if (!list) return; if (!isDataLoaded || categories.length === 0) return;
    list.innerHTML = categories.map(c => { const isImg = c.icon && (c.icon.startsWith('http') || c.icon.startsWith('data:')); const iconHtml = isImg ? `<img src="${c.icon}" class="category-img" loading="lazy">` : `<span class="category-icon">${c.icon || '📦'}</span>`; return `<div onclick="filterByCategory('${c.key}')" class="cat-item flex flex-col items-center cursor-pointer" style="min-width:78px; flex-shrink:0;"><div class="category-card">${iconHtml}</div><span class="text-[11px] mt-1.5 text-navy text-center font-medium" style="max-width:78px;line-height:1.2;">${escapeHtml(c.label)}</span></div>`; }).join('');
    if (sidebarList) sidebarList.innerHTML = categories.map(c => `<a href="#" onclick="filterByCategory('${c.key}'); closeSidebar(); return false;" class="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[#FBF8F3] active:bg-[#F5EEDF] transition"><span class="w-9 h-9 rounded-lg bg-[#FBF8F3] flex items-center justify-center">${c.icon || '📦'}</span><span class="flex-1 text-[13px] font-semibold text-[#0A1628]">${escapeHtml(c.label)}</span></a>`).join('');
    startAutoScroll();
}
let catTimer = null, catIdx = 0, catPaused = false;
function startAutoScroll() {
    if (catTimer) clearInterval(catTimer); catIdx = 0; catPaused = false; const container = document.getElementById('category-scroll-container'); if (!container) return;
    if (!container._listenersAttached) { container.addEventListener('touchstart', () => catPaused = true, { passive: true }); container.addEventListener('touchend', () => setTimeout(() => catPaused = false, 3000), { passive: true }); container._listenersAttached = true; }
    catTimer = setInterval(() => { if (catPaused) return; const c = document.getElementById('category-scroll-container'); if (!c) return; const items = c.querySelectorAll('.cat-item'); if (items.length === 0) return; catIdx++; if (catIdx >= items.length) { catIdx = 0; c.scrollTo({ left: 0, behavior: 'smooth' }); } else { c.scrollTo({ left: items[catIdx].offsetLeft - 20, behavior: 'smooth' }); } }, 2000);
}

// ============ PRODUCT CARD ============
function getRating(pid) { const r = allReviews.filter(x => x.productId === pid); if (r.length === 0) return { avg: 0, count: 0 }; return { avg: r.reduce((s, x) => s + (Number(x.rating) || 0), 0) / r.length, count: r.length }; }
function renderProductCard(p) {
    const hasDiscount = p.oldPrice && p.oldPrice > p.price; const discountPct = hasDiscount ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0; const rating = getRating(p.id); const starsHtml = rating.count > 0 ? `⭐ ${rating.avg.toFixed(1)} <span class="text-gray-400">(${rating.count})</span>` : '<span class="text-[9px] text-gray-400">No reviews yet</span>'; const isOut = p.stock !== undefined && Number(p.stock) <= 0; const qty = getQtyInCart(p.id); const inWishlist = isInWishlist(p.id);
    let actionHtml = ''; if (isOut) { actionHtml = `<button onclick="event.preventDefault(); event.stopPropagation(); addToCart('${p.id}')" class="w-full mt-2 add-cart-btn bg-purple-50 border-purple-500 text-purple-700"><i class="fas fa-clock"></i> Pre-order</button>`; } else if (qty === 0) { actionHtml = `<button onclick="event.preventDefault(); event.stopPropagation(); addToCart('${p.id}')" class="w-full mt-2 add-cart-btn"><i class="fas fa-shopping-bag"></i> Add To Cart</button>`; } else { actionHtml = `<div class="mt-2 qty-control w-full"><button onclick="event.preventDefault(); event.stopPropagation(); removeFromCart('${p.id}')">−</button><span class="qty-num flex-1">${qty}</span><button onclick="event.preventDefault(); event.stopPropagation(); addToCart('${p.id}')">+</button></div>`; }
    const isPinned = p.pinned === true; const isLowStock = !isOut && p.stock !== undefined && Number(p.stock) < 5;
    return `<div class="product-card bg-white rounded-2xl p-2.5 premium-shadow relative flex flex-col"><button onclick="toggleWishlist('${p.id}', event)" class="wishlist-btn ${inWishlist ? 'active' : ''}"><i class="fas fa-heart text-[14px]"></i></button><a href="product.html?id=${p.id}" class="block flex-1"><div class="relative mb-2"><img src="${p.image || 'https://via.placeholder.com/200x200'}" class="product-img w-full h-28 rounded-lg" loading="lazy">${hasDiscount ? `<span class="absolute top-1.5 left-1.5 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">-${discountPct}%</span>` : ''}${isPinned ? `<span class="absolute bottom-1.5 left-1.5 bg-purple-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full"><i class="fas fa-thumbtack mr-0.5"></i>Top</span>` : ''}${isLowStock ? `<span class="absolute top-9 left-1.5 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"><i class="fas fa-fire mr-0.5"></i>Only ${p.stock} left</span>` : ''}</div><h4 class="text-[12px] font-semibold text-navy leading-tight mb-1 line-clamp-2" style="min-height:32px;">${escapeHtml(p.name)}</h4><div class="text-[9px] text-gray-500 mb-1.5">${starsHtml}</div><div class="mb-1.5"><p class="text-[15px] font-bold text-navy leading-tight">৳${formatPrice(p.price)}</p>${hasDiscount ? `<p class="text-[10px] text-gray-400 line-through mt-0.5">৳${formatPrice(p.oldPrice)}</p>` : ''}</div></a>${actionHtml}</div>`;
}

function getFilteredProducts() { let filtered = allProducts.slice(); if (currentFilter !== 'all') filtered = filtered.filter(p => getCategories(p).includes(currentFilter)); if (currentSearch) { filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(currentSearch) || (p.brand || '').toLowerCase().includes(currentSearch) || (p.description || '').toLowerCase().includes(currentSearch) || getCategories(p).map(c => c.toLowerCase()).join(' ').includes(currentSearch)); } return sortProducts(filtered); }
window.renderProducts = function() { const listDiv = document.getElementById('product-list'); const noMsg = document.getElementById('no-product-msg'); const loadMoreWrap = document.getElementById('load-more-wrap'); if (!listDiv || !isDataLoaded) return; const filtered = getFilteredProducts(); if (filtered.length === 0) { listDiv.innerHTML = ''; if (noMsg) noMsg.classList.remove('hidden'); if (loadMoreWrap) loadMoreWrap.classList.add('hidden'); return; } if (noMsg) noMsg.classList.add('hidden'); if (displayedCount === 0) displayedCount = PAGE_SIZE; listDiv.innerHTML = filtered.slice(0, displayedCount).map(p => renderProductCard(p)).join(''); if (loadMoreWrap) { if (displayedCount < filtered.length) loadMoreWrap.classList.remove('hidden'); else loadMoreWrap.classList.add('hidden'); } }
window.loadMoreProducts = function() { displayedCount += PAGE_SIZE; renderProducts(); }

function renderRecentlyViewed() { const section = document.getElementById('recently-viewed-section'); const list = document.getElementById('recently-viewed-list'); if (!section || !list) return; const recentProducts = getRecentlyViewed().map(id => allProducts.find(p => p.id === id)).filter(Boolean).slice(0, 6); if (recentProducts.length === 0) { section.classList.add('hidden'); return; } section.classList.remove('hidden'); list.innerHTML = recentProducts.map(p => { const hasDiscount = p.oldPrice && p.oldPrice > p.price; return `<a href="product.html?id=${p.id}" class="bg-white rounded-2xl p-2.5 premium-shadow" style="width: 130px; flex-shrink: 0;"><img src="${p.image || ''}" class="product-img w-full h-24 rounded-lg mb-1.5" loading="lazy"><h4 class="text-[11px] font-semibold text-navy leading-tight mb-1 line-clamp-2" style="min-height: 28px;">${escapeHtml(p.name)}</h4><p class="text-[15px] font-bold text-navy leading-tight">৳${formatPrice(p.price)}</p>${hasDiscount ? `<p class="text-[10px] text-gray-400 line-through mt-0.5">৳${formatPrice(p.oldPrice)}</p>` : ''}</a>`; }).join(''); }

// ============ DYNAMIC CONTENT (Bundles & Sections) ============
function renderDynamicContent() {
    const container = document.getElementById('dynamic-content'); if (!container) return; let html = '';

    if (allBundles.length > 0) {
        html += `<div class="mt-8 px-5">
            <div class="flex justify-between items-baseline mb-4">
                <h3 class="font-display text-xl text-navy font-bold flex items-center gap-2"><i class="fas fa-gift gold-text text-base"></i> Special Combo Offers</h3>
            </div>
            <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                ${allBundles.map(b => `
                    <div onclick="openBundleDetail('${b.id}')" class="bg-white rounded-2xl min-w-[210px] max-w-[220px] premium-shadow flex flex-col border border-gray-100 cursor-pointer active:scale-95 transition-transform" style="scroll-snap-align: start; overflow:hidden;">
                        <div class="relative w-full h-32 bg-gray-50">
                            <img src="${b.image || 'https://via.placeholder.com/300x200?text=Combo'}" class="w-full h-full object-cover">
                            <span class="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">COMBO</span>
                        </div>
                        <div class="p-3 flex-1 flex flex-col">
                            <h4 class="font-bold text-navy text-sm leading-tight line-clamp-2 mb-1">${escapeHtml(b.title)}</h4>
                            <p class="text-[10px] text-gray-500 mb-2">${b.productIds.length} items included</p>
                            <div class="flex items-baseline gap-1.5 mt-auto">
                                <span class="text-base font-bold text-gold">৳${formatPrice(b.bundlePrice)}</span>
                                <span class="text-[10px] text-gray-400 line-through">৳${formatPrice(b.originalPrice)}</span>
                            </div>
                            <button class="w-full mt-2 navy-gradient text-white py-2 rounded-lg font-bold text-[11px] pointer-events-none">View Details</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    const featuredProducts = allProducts.filter(p => p.featured === true);
    if (featuredProducts.length > 0) { html += `<div class="mt-8 px-5"><div class="flex justify-between items-baseline mb-4"><h3 class="font-display text-xl text-navy font-bold flex items-center gap-2"><i class="fas fa-star gold-text text-base"></i> Featured Products</h3></div><div class="grid grid-cols-2 md:grid-cols-4 gap-3">${featuredProducts.slice(0, 4).map(p => renderProductCard(p)).join('')}</div></div>`; }

    let bannerIdx = 0;
    (customSections || []).forEach((section) => {
        if (!section || !section.categoryKey) return; let secProducts = allProducts.filter(p => getCategories(p).includes(section.categoryKey)); if (secProducts.length === 0) return; secProducts = sortProducts(secProducts);
        html += `<div class="mt-8 px-5"><div class="flex justify-between items-baseline mb-4"><h3 class="font-display text-xl text-navy font-bold">${escapeHtml(section.title)}</h3><button onclick="filterByCategory('${section.categoryKey}')" class="text-[11px] text-gold font-semibold">VIEW ALL →</button></div><div class="grid grid-cols-2 md:grid-cols-4 gap-3">${secProducts.slice(0, 4).map(p => renderProductCard(p)).join('')}</div></div>`;
        if (middleBanners && middleBanners[bannerIdx]) { const banner = middleBanners[bannerIdx]; html += `<div class="mt-6 px-5">${banner.link ? `<a href="${escapeHtml(banner.link)}">` : ''}<img src="${banner.image}" class="w-full rounded-2xl premium-shadow" loading="lazy">${banner.link ? `</a>` : ''}</div>`; bannerIdx++; }
    });

    if (testimonials && testimonials.length > 0) { html += `<div class="mt-10 px-5"><h3 class="section-title">What Our Customers Say</h3><div class="overflow-x-auto hide-scrollbar pb-2"><div class="flex gap-3" style="width: max-content;">${testimonials.map(t => `<div class="bg-white rounded-2xl premium-shadow p-5" style="width: 280px; flex-shrink: 0;"><div class="text-gold text-sm mb-2">${'★'.repeat(t.rating || 5)}${'☆'.repeat(5 - (t.rating || 5))}</div><p class="text-gray-700 text-sm leading-relaxed mb-4">"${escapeHtml(t.text)}"</p><div class="flex items-center gap-3">${t.image ? `<img src="${t.image}" class="w-12 h-12 rounded-full object-cover">` : `<div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><i class="fas fa-user text-gray-400"></i></div>`}<div><p class="font-semibold text-navy text-sm">${escapeHtml(t.name)}</p><p class="text-[11px] text-gray-500">${escapeHtml(t.role || 'Customer')}</p></div></div></div>`).join('')}</div></div></div>`; }
    container.innerHTML = html;
}

function applySettings() { const s = allSettings; try { if (s.contactPhone) document.getElementById('footer-phone').textContent = s.contactPhone; if (s.contactEmail) document.getElementById('footer-email').textContent = s.contactEmail; if (s.contactAddress) document.getElementById('footer-address').textContent = s.contactAddress; if (s.whatsapp) document.getElementById('social-whatsapp').href = 'https://wa.me/' + s.whatsapp; if (s.facebook) document.getElementById('social-facebook').href = s.facebook; if (s.instagram) document.getElementById('social-instagram').href = s.instagram; } catch (e) {} }

async function loadAll() {
    if (!db) { isDataLoaded = true; renderHeroBanners(); renderCategories(); renderProducts(); return; }
    try {
        const productsPromise = getDocs(collection(db, "products")).catch(() => null);
        const settingsPromise = getDoc(doc(db, "settings", "main")).catch(() => null);
        const bundlesPromise = getDocs(collection(db, "bundles")).catch(() => null);
        const reviewsPromise = (async () => { try { return await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(500))); } catch (e) { try { return await getDocs(collection(db, "reviews")); } catch (e2) { return null; } } })();
        const [prodSnap, setSnap, revSnap, bundleSnap] = await Promise.all([productsPromise, settingsPromise, reviewsPromise, bundlesPromise]);

        if (prodSnap) { allProducts = []; prodSnap.forEach(d => allProducts.push({ id: d.id, ...d.data() })); }
        if (revSnap) { allReviews = []; revSnap.forEach(d => allReviews.push({ id: d.id, ...d.data() })); }
        if (bundleSnap) { allBundles = []; bundleSnap.forEach(d => { const data = d.data(); if (data.active !== false) allBundles.push({ id: d.id, ...data }); }); }
        if (setSnap && setSnap.exists()) { allSettings = setSnap.data(); if (Array.isArray(allSettings.categories) && allSettings.categories.length > 0) categories = allSettings.categories; if (Array.isArray(allSettings.customSections)) customSections = allSettings.customSections; if (Array.isArray(allSettings.middleBanners)) middleBanners = allSettings.middleBanners; if (Array.isArray(allSettings.testimonials)) testimonials = allSettings.testimonials; if (Array.isArray(allSettings.heroBanners) && allSettings.heroBanners.length > 0) heroBanners = allSettings.heroBanners; applySettings(); }

        isDataLoaded = true;
        renderHeroBanners(); renderCategories(); renderProducts(); renderRecentlyViewed(); renderDynamicContent(); updateCartBadges(); updateWishlistBadges();
    } catch (e) { console.error('Load error:', e); isDataLoaded = true; renderHeroBanners(); renderCategories(); renderProducts(); }
}

(function() { try { const cart = JSON.parse(localStorage.getItem('heartix_cart') || '[]'); const count = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0); ['cart-count-header', 'cart-count-bottom', 'cart-count-sidebar'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = count; }); const wl = JSON.parse(localStorage.getItem('heartix_wishlist') || '[]'); const wc = Array.isArray(wl) ? wl.length : 0; if (wc > 0) { ['wishlist-count-header', 'wishlist-count-sidebar'].forEach(id => { const el = document.getElementById(id); if (el) { el.textContent = wc; el.classList.remove('hidden'); } }); } } catch (e) {} })();
updateCartBadges(); updateWishlistBadges(); loadAll();