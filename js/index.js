// ============================================================
// HEARTIX INDEX (Home) — Featured + Pinned + SortOrder + Low Stock
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
    collection, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ STATE ============
let allProducts = [];
let allReviews = [];
let allSettings = {};
let currentFilter = 'all';
let currentSearch = '';
let categories = [
    { key: 'TV', label: 'Televisions', icon: '📺' },
    { key: 'Fridge', label: 'Refrigerators', icon: '❄️' },
    { key: 'Fan', label: 'Fans', icon: '🌀' },
    { key: 'Gadget', label: 'Smart Gadgets', icon: '🔌' }
];
let customSections = [];
let middleBanners = [];
let testimonials = [];
let heroBanners = [];
let isDataLoaded = false;
let displayedCount = 0;
const PAGE_SIZE = 12;

// ============ MULTI-CATEGORY HELPER ============
function getCategories(p) {
    if (Array.isArray(p.categories) && p.categories.length > 0) return p.categories;
    if (p.category) return [p.category];
    return [];
}

// ============ SORT HELPER ============
function sortProducts(list) {
    return list.sort((a, b) => {
        const aPinned = a.pinned === true ? 1 : 0;
        const bPinned = b.pinned === true ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        const aOrder = Number(a.sortOrder);
        const bOrder = Number(b.sortOrder);
        const aHas = !isNaN(aOrder) && aOrder > 0;
        const bHas = !isNaN(bOrder) && bOrder > 0;
        if (aHas && bHas) return aOrder - bOrder;
        if (aHas) return -1;
        if (bHas) return 1;
        return 0;
    });
}

// ============ SIDEBAR ============
window.openSidebar = function() {
    document.getElementById('sidebar').style.transform = 'translateX(0)';
    document.getElementById('overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
window.closeSidebar = function() {
    document.getElementById('sidebar').style.transform = 'translateX(-100%)';
    document.getElementById('overlay').classList.add('hidden');
    document.body.style.overflow = '';
}

// ============ SEARCH ============
let searchTimer = null;

window.toggleSearch = function() {
    const w = document.getElementById('search-bar-wrapper');
    w.classList.toggle('open');
    if (w.classList.contains('open')) setTimeout(() => document.getElementById('search-input').focus(), 350);
    else {
        document.getElementById('search-input').value = '';
        currentSearch = '';
        hideSuggestions();
        renderProducts();
    }
}
window.closeSearch = function() {
    document.getElementById('search-bar-wrapper').classList.remove('open');
    document.getElementById('search-input').value = '';
    document.getElementById('search-input').blur();
    currentSearch = '';
    hideSuggestions();
    renderProducts();
}

window.searchProducts = function() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        currentSearch = (document.getElementById('search-input').value || '').toLowerCase().trim();
        renderProducts();
        showSuggestions();
    }, 200);
}

window.showSuggestions = function() {
    const q = (document.getElementById('search-input').value || '').toLowerCase().trim();
    const box = document.getElementById('search-suggestions');
    if (!q || q.length < 1) { hideSuggestions(); return; }

    const matches = allProducts.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        getCategories(p).some(c => c.toLowerCase().includes(q))
    ).slice(0, 6);

    if (matches.length === 0) { hideSuggestions(); return; }

    let html = '';
    matches.forEach(p => {
        html += `<div class="suggestion-item" onclick="selectSuggestion('${p.id}')">
            <img src="${p.image || 'https://via.placeholder.com/40x40?text=?'}" class="w-10 h-10 object-contain rounded-lg bg-gray-50 flex-shrink-0" onerror="this.src='https://via.placeholder.com/40x40?text=?'">
            <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-navy truncate">${escapeHtml(p.name)}</p>
                <p class="text-[10px] text-gold font-bold">৳${formatPrice(p.price)}</p>
            </div>
            <i class="fas fa-arrow-right text-gray-300 text-xs"></i>
        </div>`;
    });
    box.innerHTML = html;
    box.classList.add('show');
}

window.hideSuggestions = function() {
    const box = document.getElementById('search-suggestions');
    if (box) box.classList.remove('show');
}

window.selectSuggestion = function(id) {
    window.location.href = 'product.html?id=' + encodeURIComponent(id);
}

document.addEventListener('click', function(e) {
    const box = document.getElementById('search-suggestions');
    const input = document.getElementById('search-input');
    if (box && input && !box.contains(e.target) && e.target !== input) hideSuggestions();
});

// ============ FILTER ============
window.filterByCategory = function(cat) {
    currentFilter = cat;
    displayedCount = 0;
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    document.getElementById('search-bar-wrapper').classList.remove('open');
    hideSuggestions();
    const found = categories.find(c => c.key === cat);
    document.getElementById('section-title').innerText = cat === 'all' ? 'Top Selling Products' : (found ? found.label : cat);
    renderProducts();
}

// ============ CART ACTIONS ============
window.addToCart = function(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    const stock = p.stock !== undefined ? Number(p.stock) : 999;
    if (stock <= 0) { showToast('প্রোডাক্টটি স্টকে নেই', 'error'); return; }
    let cart = getCart();
    const idx = cart.findIndex(i => i.id === id);
    const currentQty = idx > -1 ? (Number(cart[idx].quantity) || 0) : 0;
    if (stock !== 999 && currentQty + 1 > stock) {
        showToast(`স্টকে মাত্র ${stock} টি আছে`, 'error');
        return;
    }
    if (idx > -1) cart[idx].quantity = currentQty + 1;
    else cart.push({ id, name: p.name, price: Number(p.price) || 0, image: p.image, quantity: 1 });
    saveCart(cart);
    updateCartBadges();
    showToast((p.name || '').substring(0, 30) + ' added to Cart', 'success');
    renderProducts();
    renderRecentlyViewed();
    renderDynamicContent();
}

window.removeFromCart = function(id) {
    let cart = getCart();
    const idx = cart.findIndex(i => i.id === id);
    if (idx > -1) {
        if (cart[idx].quantity > 1) cart[idx].quantity--;
        else cart.splice(idx, 1);
        saveCart(cart);
        updateCartBadges();
        renderProducts();
        renderRecentlyViewed();
        renderDynamicContent();
    }
}

// ============ WISHLIST ============
window.toggleWishlist = function(id, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    let w = getWishlist();
    const idx = w.indexOf(id);
    const p = allProducts.find(x => x.id === id);
    if (idx > -1) {
        w.splice(idx, 1);
        showToast('Wishlist থেকে সরানো হয়েছে', 'warn');
    } else {
        w.push(id);
        showToast((p?.name || 'Product').substring(0, 25) + ' wishlist-এ যোগ', 'success');
    }
    saveWishlist(w);
    updateWishlistBadges();
    renderProducts();
    renderRecentlyViewed();
    renderDynamicContent();
}

// ============ HERO SLIDER ============
let slideIndex = 0, totalSlides = 0, heroTimer = null;

function getDefaultHeroBanners() {
    return [
        { badge: '✨ Premium', title: 'Smart Living<br>Starts Here', subtitle: 'Premium appliances for modern homes', bg: 'navy' },
        { badge: '🔥 Limited Offer', title: 'Up to 30% Off<br>Smart TVs', subtitle: 'Premium quality at special price', bg: 'gold' },
        { badge: '🚚 Free Delivery', title: 'On Orders<br>Above ৳ 5,000', subtitle: 'Fast delivery all over Bangladesh', bg: 'teal' }
    ];
}

function getHeroBgStyle(b) {
    if (b.image) return `background-image: url('${b.image}'); background-size: cover; background-position: center;`;
    if (b.bg === 'gold') return 'background: linear-gradient(135deg, #B8860B, #D4A84B, #E8C77B);';
    if (b.bg === 'teal') return 'background: linear-gradient(135deg, #0F4C5C, #1A6B7C, #2C8B9E);';
    return 'background: linear-gradient(135deg, #0A1628, #152238);';
}

function safeHeroTitle(t) {
    if (!t) return '';
    return escapeHtml(t).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
}

function renderHeroBanners() {
    const track = document.getElementById('slider-track');
    const skeleton = document.getElementById('slider-skeleton');
    const dotsContainer = document.getElementById('slider-dots');
    if (!track || !dotsContainer) return;

    const banners = (Array.isArray(heroBanners) && heroBanners.length > 0) ? heroBanners : getDefaultHeroBanners();
    totalSlides = banners.length;

    let html = '';
    banners.forEach(b => {
        const bgStyle = getHeroBgStyle(b);
        const isGold = b.bg === 'gold' && !b.image;
        const textColor = isGold ? 'text-navy' : 'text-white';
        const subColor = isGold ? 'text-navy/70' : 'text-white/70';
        const badgeColor = isGold ? 'text-navy' : 'text-gold';
        const content = `<div class="hero-content">
            ${b.badge ? `<p class="${badgeColor} text-xs tracking-widest uppercase mb-2">${escapeHtml(b.badge)}</p>` : ''}
            <h2 class="${textColor} font-display text-2xl leading-tight mb-2">${safeHeroTitle(b.title)}</h2>
            ${b.subtitle ? `<p class="${subColor} text-sm">${escapeHtml(b.subtitle)}</p>` : ''}
        </div>`;
        const wrapped = b.link ? `<a href="${escapeHtml(b.link)}" class="block" style="height:100%;">${content}</a>` : content;
        html += `<div class="slider-slide" style="${bgStyle}">${wrapped}</div>`;
    });
    track.innerHTML = html;

    let dotsHtml = '';
    banners.forEach((_, i) => {
        dotsHtml += `<button onclick="goSlide(${i})" class="slider-dot ${i === 0 ? 'active' : 'inactive'} h-1.5 rounded-full"></button>`;
    });
    dotsContainer.innerHTML = dotsHtml;

    slideIndex = 0; updateSlide();

    if (skeleton) {
        skeleton.style.transition = 'opacity 0.3s';
        skeleton.style.opacity = '0';
        setTimeout(() => { skeleton.style.display = 'none'; }, 300);
    }
    track.classList.remove('opacity-0');

    if (heroTimer) clearInterval(heroTimer);
    if (totalSlides > 1) {
        heroTimer = setInterval(() => {
            slideIndex = (slideIndex + 1) % totalSlides;
            updateSlide();
        }, 4000);
    }
}

window.goSlide = function(i) {
    slideIndex = i; updateSlide();
    if (heroTimer) {
        clearInterval(heroTimer);
        if (totalSlides > 1) heroTimer = setInterval(() => {
            slideIndex = (slideIndex + 1) % totalSlides;
            updateSlide();
        }, 4000);
    }
}

function updateSlide() {
    const track = document.getElementById('slider-track');
    if (track) track.style.transform = `translateX(-${slideIndex * 100}%)`;
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((d, i) => {
        d.className = i === slideIndex ? 'slider-dot active h-1.5 rounded-full' : 'slider-dot inactive h-1.5 rounded-full';
    });
}

// ============ CATEGORIES ============
function renderCategories() {
    const list = document.getElementById('category-scroll-container');
    const sidebarList = document.getElementById('sidebar-categories');
    if (!list) return;
    if (!isDataLoaded) return;
    if (categories.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 text-xs py-4 w-full">No categories</p>';
        return;
    }
    let html = '', sideHtml = '';
    categories.forEach(c => {
        const isImg = c.icon && (c.icon.startsWith('http') || c.icon.startsWith('data:'));
        const iconHtml = isImg ? `<img src="${c.icon}" alt="${escapeHtml(c.label)}" class="category-img" loading="lazy">` : `<span class="category-icon">${c.icon || '📦'}</span>`;
        html += `<div onclick="filterByCategory('${c.key}')" class="cat-item flex flex-col items-center cursor-pointer" style="min-width:78px; flex-shrink:0;">
            <div class="category-card">${iconHtml}</div>
            <span class="text-[11px] mt-1.5 text-navy text-center font-medium" style="max-width:78px;line-height:1.2;">${escapeHtml(c.label)}</span>
        </div>`;
        const sideIcon = isImg ? '📦' : (c.icon || '📦');
        sideHtml += `<a href="#" onclick="filterByCategory('${c.key}'); closeSidebar(); return false;" class="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[#FBF8F3] active:bg-[#F5EEDF] transition group">
            <span class="w-9 h-9 rounded-lg bg-[#FBF8F3] group-hover:bg-[#D4A84B]/15 flex items-center justify-center flex-shrink-0 transition text-base">${sideIcon}</span>
            <span class="flex-1 text-[13px] font-semibold text-[#0A1628]">${escapeHtml(c.label)}</span>
            <i class="fas fa-chevron-right text-[9px] text-gray-300 group-hover:text-[#D4A84B] transition"></i>
        </a>`;
    });
    list.innerHTML = html;
    if (sidebarList) sidebarList.innerHTML = sideHtml;
    startAutoScroll();
}

let catTimer = null, catIdx = 0, catPaused = false;
function startAutoScroll() {
    if (catTimer) clearInterval(catTimer);
    catIdx = 0; catPaused = false;
    const container = document.getElementById('category-scroll-container');
    if (!container) return;
    if (!container._listenersAttached) {
        container.addEventListener('touchstart', () => { catPaused = true; }, { passive: true });
        container.addEventListener('mousedown', () => { catPaused = true; });
        container.addEventListener('mouseenter', () => { catPaused = true; });
        container.addEventListener('touchend', () => { setTimeout(() => { catPaused = false; }, 3000); }, { passive: true });
        container.addEventListener('mouseup', () => { setTimeout(() => { catPaused = false; }, 1500); });
        container.addEventListener('mouseleave', () => { setTimeout(() => { catPaused = false; }, 1000); });
        container._listenersAttached = true;
    }
    catTimer = setInterval(() => {
        if (catPaused) return;
        const c = document.getElementById('category-scroll-container');
        if (!c) return;
        const items = c.querySelectorAll('.cat-item');
        if (items.length === 0) return;
        catIdx++;
        if (catIdx >= items.length) { catIdx = 0; c.scrollTo({ left: 0, behavior: 'smooth' }); }
        else { c.scrollTo({ left: items[catIdx].offsetLeft - 20, behavior: 'smooth' }); }
    }, 2000);
}

// ============ PRODUCT CARD ============
function getRating(pid) {
    const r = allReviews.filter(x => x.productId === pid);
    if (r.length === 0) return { avg: 0, count: 0 };
    return { avg: r.reduce((s, x) => s + (Number(x.rating) || 0), 0) / r.length, count: r.length };
}

function renderProductCard(p) {
    const hasDiscount = p.oldPrice && p.oldPrice > p.price;
    const discountPct = hasDiscount ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
    const rating = getRating(p.id);
    let starsHtml = rating.count > 0 ? `⭐ ${rating.avg.toFixed(1)} <span class="text-gray-400">(${rating.count})</span>` : '<span class="text-[9px] text-gray-400">No reviews yet</span>';
    const isOut = p.stock !== undefined && Number(p.stock) <= 0;
    const qty = getQtyInCart(p.id);
    const inWishlist = isInWishlist(p.id);

    let actionHtml = '';
    if (isOut) actionHtml = `<button disabled class="w-full mt-2 add-cart-btn opacity-50">Out of Stock</button>`;
    else if (qty === 0) actionHtml = `<button onclick="event.preventDefault(); event.stopPropagation(); addToCart('${p.id}')" class="w-full mt-2 add-cart-btn"><i class="fas fa-shopping-bag"></i> Add To Cart</button>`;
    else actionHtml = `<div class="mt-2 qty-control w-full"><button onclick="event.preventDefault(); event.stopPropagation(); removeFromCart('${p.id}')">−</button><span class="qty-num flex-1">${qty}</span><button onclick="event.preventDefault(); event.stopPropagation(); addToCart('${p.id}')">+</button></div>`;

    const isPinned = p.pinned === true;
    const isLowStock = !isOut && p.stock !== undefined && Number(p.stock) < 5;

    return `<div class="product-card bg-white rounded-2xl p-2.5 premium-shadow relative flex flex-col">
        <button onclick="toggleWishlist('${p.id}', event)" class="wishlist-btn ${inWishlist ? 'active' : ''}" aria-label="Wishlist">
            <i class="fas fa-heart text-[14px]"></i>
        </button>
        <a href="product.html?id=${p.id}" class="block flex-1">
            <div class="relative mb-2">
                <img src="${p.image || 'https://via.placeholder.com/200x200?text=No+Image'}" alt="${escapeHtml(p.name)}" loading="lazy" class="product-img w-full h-28 rounded-lg" onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'">
                ${hasDiscount ? `<span class="absolute top-1.5 left-1.5 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">-${discountPct}%</span>` : ''}
                ${isPinned ? `<span class="absolute bottom-1.5 left-1.5 bg-purple-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full"><i class="fas fa-thumbtack mr-0.5"></i>Top</span>` : ''}
                ${isLowStock ? `<span class="absolute top-9 left-1.5 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"><i class="fas fa-fire mr-0.5"></i>Only ${p.stock} left</span>` : ''}
            </div>
            <h4 class="text-[12px] font-semibold text-navy leading-tight mb-1 line-clamp-2" style="min-height:32px;">${escapeHtml(p.name)}</h4>
            <div class="text-[9px] text-gray-500 mb-1.5">${starsHtml}</div>
            <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                <p class="font-display text-base font-bold text-navy">৳${formatPrice(p.price)}</p>
                ${hasDiscount ? `<p class="text-[9px] text-gray-400 line-through">৳${formatPrice(p.oldPrice)}</p>` : ''}
            </div>
            ${hasDiscount ? `<span class="inline-block bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1">Save ৳${formatPrice(p.oldPrice - p.price)}</span>` : ''}
        </a>
        ${actionHtml}
    </div>`;
}

function getFilteredProducts() {
    let filtered = allProducts.slice();
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => getCategories(p).includes(currentFilter));
    }
    if (currentSearch) {
        filtered = filtered.filter(p => {
            const name = (p.name || '').toLowerCase();
            const brand = (p.brand || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            const cats = getCategories(p).map(c => c.toLowerCase()).join(' ');
            return name.includes(currentSearch) || brand.includes(currentSearch) || desc.includes(currentSearch) || cats.includes(currentSearch);
        });
    }
    return sortProducts(filtered);
}

window.renderProducts = function() {
    const listDiv = document.getElementById('product-list');
    const noMsg = document.getElementById('no-product-msg');
    const loadMoreWrap = document.getElementById('load-more-wrap');
    if (!listDiv) return;

    if (!isDataLoaded) return;
    const filtered = getFilteredProducts();

    if (filtered.length === 0) {
        listDiv.innerHTML = '';
        if (noMsg) noMsg.classList.remove('hidden');
        if (loadMoreWrap) loadMoreWrap.classList.add('hidden');
        return;
    }
    if (noMsg) noMsg.classList.add('hidden');

    if (displayedCount === 0) displayedCount = PAGE_SIZE;
    const visible = filtered.slice(0, displayedCount);
    listDiv.innerHTML = visible.map(p => renderProductCard(p)).join('');

    if (loadMoreWrap) {
        if (displayedCount < filtered.length) loadMoreWrap.classList.remove('hidden');
        else loadMoreWrap.classList.add('hidden');
    }
}

window.loadMoreProducts = function() {
    displayedCount += PAGE_SIZE;
    renderProducts();
}

// ============ RECENTLY VIEWED ============
function renderRecentlyViewed() {
    const section = document.getElementById('recently-viewed-section');
    const list = document.getElementById('recently-viewed-list');
    if (!section || !list) return;
    const recentIds = getRecentlyViewed();
    const recentProducts = recentIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean).slice(0, 6);
    if (recentProducts.length === 0) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');
    let html = '';
    recentProducts.forEach(p => {
        const hasDiscount = p.oldPrice && p.oldPrice > p.price;
        html += `<a href="product.html?id=${p.id}" class="bg-white rounded-2xl p-2.5 premium-shadow" style="width: 130px; flex-shrink: 0; scroll-snap-align: start;">
            <img src="${p.image || 'https://via.placeholder.com/120x120?text=?'}" class="product-img w-full h-24 rounded-lg mb-1.5" loading="lazy" onerror="this.src='https://via.placeholder.com/120x120?text=?'">
            <h4 class="text-[11px] font-semibold text-navy leading-tight mb-1 line-clamp-2" style="min-height: 28px;">${escapeHtml(p.name)}</h4>
            <p class="text-xs font-bold text-navy">৳${formatPrice(p.price)}</p>
            ${hasDiscount ? `<p class="text-[9px] text-gray-400 line-through">৳${formatPrice(p.oldPrice)}</p>` : ''}
        </a>`;
    });
    list.innerHTML = html;
}

// ============ DYNAMIC SECTIONS ============
function renderDynamicContent() {
    const container = document.getElementById('dynamic-content');
    if (!container) return;
    let html = '';

    const featuredProducts = allProducts.filter(p => p.featured === true);
    if (featuredProducts.length > 0) {
        html += `<div class="mt-8 px-5">
            <div class="flex justify-between items-baseline mb-4">
                <h3 class="font-display text-xl text-navy font-bold flex items-center gap-2">
                    <i class="fas fa-star gold-text text-base"></i> Featured Products
                </h3>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                ${featuredProducts.slice(0, 4).map(p => renderProductCard(p)).join('')}
            </div>
        </div>`;
    }

    let bannerIdx = 0;
    (customSections || []).forEach((section) => {
        if (!section || !section.categoryKey) return;
        let secProducts = allProducts.filter(p => getCategories(p).includes(section.categoryKey));
        if (secProducts.length === 0) return;
        secProducts = sortProducts(secProducts);

        html += `<div class="mt-8 px-5">
            <div class="flex justify-between items-baseline mb-4">
                <h3 class="font-display text-xl text-navy font-bold">${escapeHtml(section.title)}</h3>
                <button onclick="filterByCategory('${section.categoryKey}')" class="text-[11px] text-gold font-semibold">VIEW ALL →</button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">${secProducts.slice(0, 4).map(p => renderProductCard(p)).join('')}</div>
        </div>`;

        if (middleBanners && middleBanners[bannerIdx]) {
            const banner = middleBanners[bannerIdx];
            html += `<div class="mt-6 px-5">${banner.link ? `<a href="${escapeHtml(banner.link)}">` : ''}
                <img src="${banner.image}" class="w-full rounded-2xl premium-shadow" loading="lazy" onerror="this.style.display='none'">
                ${banner.link ? `</a>` : ''}</div>`;
            bannerIdx++;
        }
    });

    if (testimonials && testimonials.length > 0) {
        html += `<div class="mt-10 px-5">
            <h3 class="section-title">What Our Customers Say</h3>
            <div class="overflow-x-auto hide-scrollbar pb-2" style="scroll-snap-type: x mandatory;">
                <div class="flex gap-3" style="width: max-content;">
                    ${testimonials.map(t => `<div class="bg-white rounded-2xl premium-shadow p-5" style="width: 280px; flex-shrink: 0; scroll-snap-align: start;">
                        <div class="text-gold text-sm mb-2">${'★'.repeat(t.rating || 5)}${'☆'.repeat(5 - (t.rating || 5))}</div>
                        <p class="text-gray-700 text-sm leading-relaxed mb-4">"${escapeHtml(t.text)}"</p>
                        <div class="flex items-center gap-3">
                            ${t.image ? `<img src="${t.image}" class="w-12 h-12 rounded-full object-cover" loading="lazy">` : `<div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><i class="fas fa-user text-gray-400"></i></div>`}
                            <div><p class="font-semibold text-navy text-sm">${escapeHtml(t.name)}</p><p class="text-[11px] text-gray-500">${escapeHtml(t.role || 'Customer')}</p></div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}

// ============ APPLY SETTINGS ============
function applySettings() {
    const s = allSettings;
    try {
        if (s.contactPhone) { const el = document.getElementById('footer-phone'); if (el) el.textContent = s.contactPhone; }
        if (s.contactEmail) { const el = document.getElementById('footer-email'); if (el) el.textContent = s.contactEmail; }
        if (s.contactAddress) { const el = document.getElementById('footer-address'); if (el) el.textContent = s.contactAddress; }
        if (s.whatsapp) { const waEl = document.getElementById('social-whatsapp'); if (waEl) waEl.href = 'https://wa.me/' + s.whatsapp; }
        if (s.facebook) { const fbEl = document.getElementById('social-facebook'); if (fbEl) fbEl.href = s.facebook; }
        if (s.instagram) { const igEl = document.getElementById('social-instagram'); if (igEl) igEl.href = s.instagram; }
    } catch (e) {}
}

// ============ LOAD ============
async function loadAll() {
    if (!db) {
        isDataLoaded = true;
        renderHeroBanners();
        renderCategories();
        renderProducts();
        return;
    }
    try {
        const [prodSnap, revSnap, setSnap] = await Promise.all([
            getDocs(collection(db, "products")).catch(() => null),
            getDocs(collection(db, "reviews")).catch(() => null),
            getDoc(doc(db, "settings", "main")).catch(() => null)
        ]);

        if (prodSnap) {
            allProducts = [];
            prodSnap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
        }
        if (revSnap) {
            allReviews = [];
            revSnap.forEach(d => allReviews.push({ id: d.id, ...d.data() }));
        }
        if (setSnap && setSnap.exists()) {
            allSettings = setSnap.data();
            if (Array.isArray(allSettings.categories) && allSettings.categories.length > 0) categories = allSettings.categories;
            if (Array.isArray(allSettings.customSections)) customSections = allSettings.customSections;
            if (Array.isArray(allSettings.middleBanners)) middleBanners = allSettings.middleBanners;
            if (Array.isArray(allSettings.testimonials)) testimonials = allSettings.testimonials;
            if (Array.isArray(allSettings.heroBanners) && allSettings.heroBanners.length > 0) heroBanners = allSettings.heroBanners;
            applySettings();
        }
        isDataLoaded = true;
        renderHeroBanners();
        renderCategories();
        renderProducts();
        renderRecentlyViewed();
        renderDynamicContent();
        updateCartBadges();
        updateWishlistBadges();
    } catch (e) {
        console.error('Load error:', e);
        isDataLoaded = true;
        renderHeroBanners();
        renderCategories();
        renderProducts();
    }
}

// ============ INITIAL BADGES ============
(function() {
    try {
        const cart = JSON.parse(localStorage.getItem('heartix_cart') || '[]');
        const count = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
        ['cart-count-header', 'cart-count-bottom', 'cart-count-sidebar'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = count;
        });
        const wl = JSON.parse(localStorage.getItem('heartix_wishlist') || '[]');
        const wc = Array.isArray(wl) ? wl.length : 0;
        if (wc > 0) {
            ['wishlist-count-header', 'wishlist-count-sidebar'].forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.textContent = wc; el.classList.remove('hidden'); }
            });
        }
    } catch (e) {}
})();

updateCartBadges();
updateWishlistBadges();
loadAll();