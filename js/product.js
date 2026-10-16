// ============================================================
// HEARTIX PRODUCT DETAIL PAGE
// v3 — Reviews with Images
// ============================================================
import { db } from './firebase.js';
import {
    escapeHtml, formatPrice, showToast,
    getCart, saveCart, getQtyInCart,
    getWishlist, saveWishlist, isInWishlist,
    addToRecentlyViewed, updateCartBadges, updateWishlistBadges
} from './common.js';

import {
    collection, getDocs, doc, getDoc, addDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============ CLOUDINARY ============
const CLOUDINARY_CLOUD_NAME = "ju2w6e9r";
const CLOUDINARY_UPLOAD_PRESET = "heartix_unsigned";

async function uploadToCloudinary(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
    const result = await res.json();
    if (!result.secure_url) throw new Error(result.error?.message || 'Upload failed');
    return result.secure_url;
}

// ============ STATE ============
let currentProduct = null;
let productId = null;
let quantity = 1;
let currentImageIndex = 0;
let allImages = [];
let settings = { whatsapp: '', contactPhone: '', waEnabled: false };
let allProducts = [];
let allReviews = [];
let pendingReviewImage = null;

// ============ GET PRODUCT ID FROM URL ============
const urlParams = new URLSearchParams(window.location.search);
productId = urlParams.get('id');

// ============ INITIAL BADGES ============
(function() {
    try {
        const cart = JSON.parse(localStorage.getItem('heartix_cart') || '[]');
        const cCount = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
        const el = document.getElementById('cart-count-header');
        if (el) el.textContent = cCount;

        const wl = JSON.parse(localStorage.getItem('heartix_wishlist') || '[]');
        if (Array.isArray(wl) && wl.length > 0) {
            const wh = document.getElementById('wishlist-count-header');
            if (wh) { wh.textContent = wl.length; wh.classList.remove('hidden'); }
        }
    } catch (e) {}
})();

// ============ HELPERS ============
function updateCartUI() {
    const cart = getCart();
    const items = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const el = document.getElementById('cart-count-header');
    if (el) el.innerText = items;
}

function updateWishlistUI() {
    const w = getWishlist();
    const h = document.getElementById('wishlist-count-header');
    if (w.length > 0) {
        if (h) { h.textContent = w.length; h.classList.remove('hidden'); }
    } else {
        if (h) h.classList.add('hidden');
    }
    const btn = document.getElementById('wishlist-toggle');
    if (btn && currentProduct) {
        if (isInWishlist(currentProduct.id)) btn.classList.add('active');
        else btn.classList.remove('active');
    }
}

window.goBack = function() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = 'index.html';
}

// ============ CART ACTIONS ============
window.addToCart = function() {
    if (!currentProduct) return;
    if (currentProduct.stock !== undefined && currentProduct.stock <= 0) {
        showToast('স্টকে নেই', 'error');
        return;
    }
    const stock = currentProduct.stock !== undefined ? currentProduct.stock : 999;
    let cart = getCart();
    const idx = cart.findIndex(i => i.id === productId);
    const currentQty = idx > -1 ? cart[idx].quantity : 0;
    const newQty = currentQty + quantity;
    if (stock !== 999 && newQty > stock) {
        showToast(`স্টকে মাত্র ${stock} টি`, 'error');
        return;
    }
    if (idx > -1) cart[idx].quantity = newQty;
    else cart.push({ id: productId, name: currentProduct.name, price: currentProduct.price, image: currentProduct.image, quantity });
    saveCart(cart);
    updateCartUI();
    showToast((currentProduct.name || '').substring(0, 25) + ' কার্টে যোগ', 'success');
    updateCartButton();
}

window.removeFromCart = function() {
    let cart = getCart();
    const idx = cart.findIndex(i => i.id === productId);
    if (idx > -1) {
        cart.splice(idx, 1);
        saveCart(cart);
        updateCartUI();
        showToast('কার্ট থেকে সরানো', 'warn');
        updateCartButton();
    }
}

window.toggleCart = function() {
    const inCart = getQtyInCart(productId) > 0;
    if (inCart) removeFromCart();
    else addToCart();
}

window.buyNow = function() {
    if (!currentProduct) return;
    if (getQtyInCart(productId) === 0) addToCart();
    setTimeout(() => { window.location.href = 'checkout.html'; }, 250);
}

// ============ WISHLIST ============
window.toggleWishlist = function(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!currentProduct) return;
    let w = getWishlist();
    const idx = w.indexOf(currentProduct.id);
    if (idx > -1) {
        w.splice(idx, 1);
        showToast('Wishlist থেকে সরানো হয়েছে', 'warn');
    } else {
        w.push(currentProduct.id);
        showToast('Wishlist-এ যোগ হয়েছে', 'success');
    }
    saveWishlist(w);
    updateWishlistUI();
}

function updateCartButton() {
    const btn = document.getElementById('main-cart-btn');
    if (!btn) return;
    const qty = getQtyInCart(productId);
    if (qty > 0) {
        btn.className = 'action-btn bg-orange-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs';
        btn.innerHTML = '<i class="fas fa-check text-[11px]"></i> IN CART (' + qty + ')';
    } else {
        btn.className = 'action-btn gold-gradient text-navy font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs';
        btn.innerHTML = '<i class="fas fa-shopping-bag text-[11px]"></i> ADD TO CART';
    }
}

window.changeQty = function(delta) {
    const stock = currentProduct && currentProduct.stock !== undefined ? currentProduct.stock : 999;
    const newQty = quantity + delta;
    if (newQty < 1) return;
    if (stock !== 999 && newQty > stock) {
        showToast(`স্টকে মাত্র ${stock} টি`, 'error');
        return;
    }
    quantity = newQty;
    const el = document.getElementById('qty-display');
    if (el) el.innerText = quantity;
}

// ============ SHARE ============
window.shareProduct = function(e) {
    if (e) e.preventDefault();
    if (!currentProduct) return;
    const shareData = {
        title: currentProduct.name,
        text: `Heartix-এ দেখুন: ${currentProduct.name} — ৳${formatPrice(currentProduct.price)}`,
        url: window.location.href
    };
    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('Link কপি হয়েছে', 'success');
        }).catch(() => showToast('কপি করা যায়নি', 'error'));
    } else {
        showToast('শেয়ার করা যাচ্ছে না', 'warn');
    }
}

// ============ IMAGE GALLERY ============
window.setMainImage = function(idx) {
    if (idx < 0 || idx >= allImages.length) return;
    currentImageIndex = idx;
    const mainImg = document.getElementById('main-image');
    if (mainImg) mainImg.src = allImages[idx];
    document.querySelectorAll('.thumb-item').forEach((el, i) => {
        if (i === idx) el.classList.add('active');
        else el.classList.remove('active');
    });
}
window.nextImage = function() {
    if (allImages.length <= 1) return;
    currentImageIndex = (currentImageIndex + 1) % allImages.length;
    setMainImage(currentImageIndex);
}
window.prevImage = function() {
    if (allImages.length <= 1) return;
    currentImageIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
    setMainImage(currentImageIndex);
}

// ============ STARS ============
function renderStarsHtml(rating) {
    let html = '';
    const full = Math.floor(rating);
    const hasHalf = (rating - full) >= 0.5 && (rating - full) < 1;
    for (let i = 1; i <= 5; i++) {
        if (i <= full) html += '<i class="fas fa-star gold-text text-[10px]"></i>';
        else if (i === full + 1 && hasHalf) html += '<i class="fas fa-star-half-alt gold-text text-[10px]"></i>';
        else html += '<i class="far fa-star text-gray-300 text-[10px]"></i>';
    }
    return html;
}

// ============ CONTACT LINKS ============
function handleWhatsApp(e) {
    if (!settings.whatsapp) { e.preventDefault(); showToast('WhatsApp নম্বর সেট হয়নি', 'warn'); }
}
function handleCall(e) {
    if (!settings.contactPhone) { e.preventDefault(); showToast('ফোন নম্বর সেট হয়নি', 'warn'); }
}
window.handleWhatsApp = handleWhatsApp;
window.handleCall = handleCall;

function updateContactLinks() {
    if (!currentProduct) return;
    const msg = encodeURIComponent(`Hi, I want to order: ${currentProduct.name} (৳${currentProduct.price})`);
    const waBtn = document.getElementById('whatsapp-btn');
    const callBtn = document.getElementById('call-btn');

    if (waBtn) {
        if (settings.waEnabled && settings.whatsapp) {
            waBtn.href = `https://wa.me/${settings.whatsapp}?text=${msg}`;
            waBtn.style.display = '';
        } else {
            waBtn.style.display = 'none';
        }
    }

    if (callBtn) {
        if (settings.contactPhone) {
            callBtn.href = `tel:${settings.contactPhone}`;
            callBtn.style.display = '';
        } else {
            callBtn.style.display = 'none';
        }
    }
}

// ============ RENDER PRODUCT ============
function renderProduct() {
    const p = currentProduct;

    document.getElementById('breadcrumb-category').innerText = p.category || 'Products';
    document.getElementById('breadcrumb-product').innerText = p.name;

    const hasDiscount = p.oldPrice && p.oldPrice > p.price;
    const discountPct = hasDiscount ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
    const isOut = p.stock !== undefined && p.stock <= 0;

    let thumbsHtml = '';
    allImages.forEach((url, i) => {
        thumbsHtml += `<div onclick="setMainImage(${i})" class="thumb-item ${i === 0 ? 'active' : ''} w-12 h-12 rounded-lg bg-white overflow-hidden mb-1.5">
            <img src="${url}" class="w-full h-full object-contain p-0.5" onerror="this.src='https://via.placeholder.com/60x60?text=?'">
        </div>`;
    });
    document.getElementById('thumbs-container').innerHTML = thumbsHtml;

    document.getElementById('main-image').src = allImages[0];
    document.getElementById('main-image').alt = p.name;

    document.getElementById('discount-badge').innerHTML = hasDiscount
        ? `<span class="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Save ${discountPct}%</span>`
        : '';

    document.getElementById('nav-arrows').innerHTML = allImages.length > 1 ? `
        <button onclick="prevImage()" class="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 rounded-full shadow flex items-center justify-center text-navy z-10">
            <i class="fas fa-chevron-left text-[10px]"></i>
        </button>
        <button onclick="nextImage()" class="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 rounded-full shadow flex items-center justify-center text-navy z-10">
            <i class="fas fa-chevron-right text-[10px]"></i>
        </button>` : '';

    document.getElementById('product-name').textContent = p.name;

    const rating = allReviews.length > 0 ? allReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / allReviews.length : 0;
    document.getElementById('product-stars').innerHTML = renderStarsHtml(rating);
    document.getElementById('product-review-count').textContent = allReviews.length;

    document.getElementById('product-price').textContent = '৳' + formatPrice(p.price);
    const oldPriceEl = document.getElementById('product-old-price');
    if (oldPriceEl) {
        oldPriceEl.textContent = hasDiscount ? '৳' + formatPrice(p.oldPrice) : '';
    }

    if (p.stock !== undefined) {
        const stockEl = document.getElementById('stock-info');
        stockEl.innerHTML = isOut
            ? '<span class="text-red-500 font-semibold"><i class="fas fa-times-circle mr-0.5"></i> স্টকে নেই</span>'
            : `<span class="text-green-600 font-semibold"><i class="fas fa-check-circle mr-0.5"></i> স্টকে আছে (${p.stock})</span>`;
    }

    if (p.brand) {
        document.getElementById('brand-info').innerHTML = `<span class="text-gray-500">ব্র্যান্ড: <span class="font-semibold navy-text">${escapeHtml(p.brand)}</span></span>`;
    }

    if (isOut) {
        const qtyRow = document.getElementById('qty-row');
        if (qtyRow) qtyRow.style.display = 'none';
        const btn = document.getElementById('main-cart-btn');
        btn.disabled = true;
        btn.className = 'action-btn bg-gray-300 text-gray-500 font-bold py-2.5 rounded-xl text-xs col-span-2 cursor-not-allowed';
        btn.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Out of Stock';
    }

    updateCartButton();
    updateWishlistUI();

    if (p.description) {
        document.getElementById('description-block').classList.remove('hidden');
        document.getElementById('description-text').textContent = p.description;
    }

    updateContactLinks();
}

// ============ REVIEWS WITH IMAGES ============
function renderReviews() {
    const total = allReviews.length;
    const avg = total > 0 ? allReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / total : 0;

    document.getElementById('avg-rating').innerText = avg.toFixed(1);
    document.getElementById('review-count').innerText = total + ' reviews';
    document.getElementById('avg-stars').innerHTML = renderStarsHtml(avg);

    for (let i = 1; i <= 5; i++) {
        const count = allReviews.filter(r => Number(r.rating) === i).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        document.getElementById('bar' + i).style.width = pct + '%';
        document.getElementById('pct' + i).innerText = pct + '%';
    }

    const list = document.getElementById('reviews-list');
    if (allReviews.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 text-[11px] py-2">এখনো রিভিউ নেই।</p>';
        return;
    }

    let html = '';
    allReviews.slice(0, 5).forEach(r => {
        const rating = Number(r.rating) || 0;
        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const imageHtml = r.image ? `
            <div class="mt-1.5">
                <img src="${r.image}" alt="review photo" class="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer" onclick="window.open('${r.image}', '_blank')" onerror="this.style.display='none'">
            </div>
        ` : '';
        html += `<div class="border-b border-gray-100 pb-3 last:border-0">
            <div class="flex justify-between items-center mb-0.5">
                <p class="font-semibold navy-text text-xs">${escapeHtml(r.name)}</p>
                <span class="text-yellow-500 text-[11px]">${stars}</span>
            </div>
            <p class="text-[11px] text-gray-600 leading-relaxed">${escapeHtml(r.text)}</p>
            ${imageHtml}
        </div>`;
    });
    list.innerHTML = html;
}

// ============ REVIEW IMAGE UPLOAD ============
document.getElementById('review-image-file')?.addEventListener('change', function(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
        showToast('ছবি ৫ MB-র বেশি বড়', 'error');
        e.target.value = '';
        return;
    }
    const r = new FileReader();
    r.onload = evt => {
        pendingReviewImage = { file: f, dataUrl: evt.target.result };
        document.getElementById('review-image-preview-img').src = evt.target.result;
        document.getElementById('review-image-preview').classList.remove('hidden');
        document.getElementById('review-file-name').textContent = '✔ ' + f.name;
    };
    r.readAsDataURL(f);
});

window.clearReviewImage = function() {
    pendingReviewImage = null;
    const fileInput = document.getElementById('review-image-file');
    if (fileInput) fileInput.value = '';
    document.getElementById('review-image-preview').classList.add('hidden');
    document.getElementById('review-file-name').textContent = '';
};

window.submitReview = async function() {
    const name = (document.getElementById('review-name').value || '').trim();
    const rating = parseInt(document.getElementById('review-rating').value);
    const text = (document.getElementById('review-text').value || '').trim();
    if (!name || name.length < 2) return showToast('নাম লিখুন (কমপক্ষে ২ অক্ষর)', 'error');
    if (!rating) return showToast('রেটিং দিন', 'error');
    if (!text || text.length < 3) return showToast('রিভিউ লিখুন (কমপক্ষে ৩ অক্ষর)', 'error');
    if (text.length > 300) return showToast('রিভিউ অনেক বড়', 'error');

    const btn = document.getElementById('review-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Submitting...';

    try {
        let imageUrl = '';

        // Upload image if provided
        if (pendingReviewImage) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Uploading photo...';
            try {
                imageUrl = await uploadToCloudinary(pendingReviewImage.file);
            } catch (err) {
                console.warn('Image upload failed:', err);
                showToast('ছবি আপলোড হয়নি, রিভিউ ছবি ছাড়াই পাঠানো হচ্ছে', 'warn');
                imageUrl = '';
            }
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';

        await addDoc(collection(db, "reviews"), {
            productId,
            name,
            rating,
            text,
            image: imageUrl,
            createdAt: serverTimestamp()
        });

        showToast('রিভিউ সাবমিট হয়েছে', 'success');

        // Reset form
        document.getElementById('review-name').value = '';
        document.getElementById('review-rating').value = '';
        document.getElementById('review-text').value = '';
        window.clearReviewImage();

        // Optimistically add to list
        allReviews.unshift({ name, rating, text, image: imageUrl });
        renderReviews();
        document.getElementById('product-review-count').textContent = allReviews.length;

    } catch (e) {
        showToast('সাবমিট করা যায়নি', 'error');
        console.error('Review error:', e);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Submit';
    }
}

// ============ RELATED ============
function renderRelated() {
    const container = document.getElementById('related-products');
    let related = allProducts.filter(p => p.id !== productId);
    if (related.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 text-xs py-4 w-full">কোনো প্রোডাক্ট নেই</p>';
        return;
    }
    const getCats = (p) => Array.isArray(p.categories) && p.categories.length > 0 ? p.categories : (p.category ? [p.category] : []);
    const myCats = getCats(currentProduct);
    const sameCat = related.filter(p => getCats(p).some(c => myCats.includes(c)));
    const others = related.filter(p => !getCats(p).some(c => myCats.includes(c)));
    const prioritized = [...sameCat, ...others].slice(0, 6);

    let html = '';
    prioritized.forEach(p => {
        const hasDiscount = p.oldPrice && p.oldPrice > p.price;
        html += `<a href="product.html?id=${p.id}" class="flex-shrink-0 bg-gray-50 rounded-xl p-2 action-btn" style="width: 130px;">
            <img src="${p.image || 'https://via.placeholder.com/120x120?text=?'}" class="prod-img w-full h-24 rounded-lg mb-1.5" loading="lazy" onerror="this.src='https://via.placeholder.com/120x120?text=?'">
            <h4 class="text-[11px] font-semibold navy-text leading-tight mb-1 line-clamp-2" style="min-height: 28px;">${escapeHtml(p.name)}</h4>
            <div class="mt-1">
                <p class="text-[13px] font-bold text-navy leading-tight">৳${formatPrice(p.price)}</p>
                ${hasDiscount ? `<p class="text-[10px] text-gray-400 line-through mt-0.5">৳${formatPrice(p.oldPrice)}</p>` : ''}
            </div>
        </a>`;
    });
    container.innerHTML = html;
}

// ============ LOAD ============
async function loadProduct() {
    if (!productId) {
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        document.getElementById('error-msg').textContent = 'প্রোডাক্ট আইডি নেই';
        return;
    }
    if (!db) {
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        document.getElementById('error-msg').textContent = 'লোড করা যায়নি';
        return;
    }
    try {
        const [prodSnap, setSnap, revSnap, allProdSnap] = await Promise.all([
            getDoc(doc(db, "products", productId)).catch(() => null),
            getDoc(doc(db, "settings", "main")).catch(() => null),
            getDocs(query(collection(db, "reviews"), where("productId", "==", productId))).catch(() => null),
            getDocs(collection(db, "products")).catch(() => null)
        ]);

        document.getElementById('loading-skeleton').classList.add('hidden');

        if (!prodSnap || !prodSnap.exists()) {
            document.getElementById('error-state').classList.remove('hidden');
            return;
        }

        currentProduct = { id: prodSnap.id, ...prodSnap.data() };
        addToRecentlyViewed(productId);

        if (setSnap && setSnap.exists()) {
            const s = setSnap.data();
            const int = s.integrations || {};
            const wa = int.whatsapp || {};

            if (wa.enabled && wa.number) {
                settings.whatsapp = String(wa.number).replace(/\D/g, '');
                settings.waEnabled = true;
            } else {
                settings.whatsapp = '';
                settings.waEnabled = false;
            }

            settings.contactPhone = s.contactPhone || '';
        }

        allReviews = [];
        if (revSnap) revSnap.forEach(d => allReviews.push(d.data()));

        allProducts = [];
        if (allProdSnap) allProdSnap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));

        allImages = (currentProduct.images && currentProduct.images.length) ? currentProduct.images.filter(u => typeof u === 'string' && u.length > 0).slice() : [];
        if (allImages.length === 0 && currentProduct.image && typeof currentProduct.image === 'string') allImages = [currentProduct.image];
        if (allImages.length === 0) allImages = ['https://via.placeholder.com/400x400?text=No+Image'];
        currentImageIndex = 0;

        document.getElementById('main-content').classList.remove('hidden');
        renderProduct();
        renderReviews();
        renderRelated();
        updateCartUI();
        updateWishlistUI();
    } catch (e) {
        console.error('Load error:', e);
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}

loadProduct();

console.log('✅ product.js v3 loaded (reviews with images)');