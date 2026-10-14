# 📖 Heartix — Master Guide (Complete Reference)

**Version:** 2.0
**Last Updated:** 15 October 2025
**Live Site:** heartix.vercel.app
**Status:** Phase 0 সম্পূর্ণ ✅ | Phase 1 পরবর্তী
**Maintainer:** Developer + Claude AI

---

# 🎯 PART 1: প্রজেক্ট পরিচিতি

## Heartix কী?
Heartix বাংলাদেশের একটি প্রিমিয়াম স্মার্ট অ্যাপ্লায়েন্স ই-কমার্স সাইট। Full stack: HTML + Tailwind CSS + Vanilla JS + Firebase (Firestore + Auth) + Cloudinary (images) + Vercel (hosting)।

## Core Stack
| Component | Technology | Cost |
|-----------|-----------|------|
| Frontend | HTML5, Tailwind CSS (CDN), Vanilla JS (ES Modules) | ফ্রি |
| Backend | Firebase Firestore + Auth | ফ্রি (Spark plan) |
| Images | Cloudinary (unsigned upload) | ফ্রি |
| Hosting | Vercel | ফ্রি |
| Icons | Font Awesome 6 (CDN) | ফ্রি |
| Fonts | Google Fonts (Inter + Playfair Display) | ফ্রি |

## Brand Colors
```
Navy:  #0A1628 (primary dark)
Gold:  #D4A84B (accent)
Cream: #FBF8F3 (background)
Green: #16a34a (success)
Red:   #dc2626 (danger)
```

## Fonts
- **Body:** Inter (400, 500, 600, 700, 800)
- **Display/Headings:** Playfair Display (600, 700, 800)
- **Numbers:** Inter (bold, no serif) — important!

---

# 📊 PART 2: বর্তমান অবস্থা (Phase 0 সম্পূর্ণ)

## ✅ যা যা শেষ হয়েছে

### Phase 0: Modular File Structure — সম্পূর্ণ
সব page-এর inline CSS ও JS সরিয়ে আলাদা ফাইলে নেওয়া হয়েছে। ১৭টা HTML, ১২টা CSS, ১৪টা JS — মোট **৪৩টা ফাইল**।

### Features (১২টি প্রধান)
1. ✅ Full e-commerce flow (browse → cart → checkout → track)
2. ✅ Multi-category products
3. ✅ Repeat customer detection + auto-fill
4. ✅ IP-based fraud flagging (block না, শুধু flag)
5. ✅ Google Sign-in
6. ✅ Phone-based login (Firestore lookup)
7. ✅ Remember me + Password eye toggle
8. ✅ Account address save (Name, Phone, Address, District, Thana)
9. ✅ Checkout auto-fill from profile
10. ✅ Wishlist auto-cleanup
11. ✅ Atomic order transaction (server-side pricing)
12. ✅ Back button trap in warning modal

### Bug Fixes (৮টি)
- Image undefined issue
- Star rating half-star logic
- Copy order number (clipboard fallback)
- Cart tampering (server pricing)
- XSS in hero banners
- Category scroll pause
- Status badge override
- Cart price exploit

### Security (৭টি)
- Firestore rules deployed
- Admin UID check
- Vercel domain authorized
- Email/Password + Google Auth enabled
- Server-side price validation
- XSS protection (escapeHtml)
- Back trap (bypass prevention)

---

# 📁 PART 3: সম্পূর্ণ File Map

## Root Level (HTML Files)

| File | Purpose | Links to CSS | Links to JS |
|------|---------|--------------|-------------|
| `index.html` | Home page — hero slider, categories, products, dynamic sections | common.css, index.css | index.js |
| `product.html` | Product detail — images, reviews, add to cart, related | common.css, product.css | product.js |
| `cart.html` | Cart — items, coupon, summary, checkout link | common.css, cart.css | cart.js |
| `checkout.html` | Checkout — address form, payment, order place | common.css, checkout.css | checkout.js |
| `account.html` | Login / Register / Profile / My Orders | common.css, account.css | account.js |
| `wishlist.html` | Saved products grid | common.css, wishlist.css | wishlist.js |
| `contact.html` | Contact form + quick contact cards | common.css, contact.css | contact.js |
| `order-success.html` | Post-order confirmation page | common.css, order-success.css | order-success.js |
| `track-order.html` | Order tracking with timeline | common.css, track-order.css | track-order.js |
| `admin.html` | Admin panel (products, orders, coupons, categories, content, settings) | common.css, admin.css | admin.js |
| `messages.html` | Admin inbox for contact messages | common.css, messages.css | messages.js |
| `about.html` | Static — company info | common.css | inline |
| `faq.html` | Static — FAQ accordion | common.css | inline |
| `terms.html` | Static — terms | common.css | inline |
| `privacy.html` | Static — privacy | common.css | inline |
| `return-policy.html` | Static — return policy | common.css | inline |
| `landing.html` | ⏳ TODO — Facebook landing page | — | — |
| `moderator.html` | ⏳ TODO — moderator panel | — | — |

## CSS Files (`css/` folder)

| File | Loaded by | Contains |
|------|-----------|----------|
| `common.css` | **সব page** | body, navy-gradient, gold-gradient, gold-text, navy-text, glass, premium-shadow, hide-scrollbar, toast, shimmer, animations, input focus |
| `index.css` | index.html | search bar, qty-control, add-cart-btn, category-card, slider, product-card, floating-cart, wishlist-btn, search-suggestions |
| `product.css` | product.html | thumb-item, qty-control, action-btn, prod-img, wishlist-btn-lg |
| `cart.css` | cart.html | prod-img, coupon-input, **price font overrides (Inter bold)** |
| `checkout.css` | checkout.html | payment-option, check-circle, field-error, **checkout number fonts** |
| `account.css` | account.html | tab-btn, input-wrap, eye-btn, or-divider, btn-primary-lg, btn-gold-lg, social-btn, remember-row, register-prompt, status badges, info-view-item, info-edit-input |
| `wishlist.css` | wishlist.html | prod-img, add-cart-btn, qty-control |
| `contact.css` | contact.html | contact-item, input focus |
| `order-success.css` | order-success.html | pop, fade-up, delay classes |
| `track-order.css` | track-order.html | timeline-step, dot, status badges |
| `admin.css` | admin.html | modal-bg, img-thumb, cat-preview, nav-item, admin toast, order-status, buttons, sidebar/mobile layout |
| `messages.css` | messages.html | msg-card, unread-dot |

## JS Files (`js/` folder)

| File | Type | Loaded by | Contains |
|------|------|-----------|----------|
| `firebase.js` | module | সব JS file (import) | firebaseConfig, initializeApp, db, auth exports |
| `common.js` | module | সব JS file (import) | showToast, escapeHtml, formatPrice, getCart, saveCart, getQtyInCart, getWishlist, saveWishlist, isInWishlist, getRecentlyViewed, addToRecentlyViewed, updateCartBadges, updateWishlistBadges, validatePhone, generateOrderNumber |
| `districts.js` | module | checkout.js, account.js | DISTRICTS array (64 districts) |
| `index.js` | module | index.html | Home page logic, hero slider, categories, product render, search, wishlist, cart |
| `product.js` | module | product.html | Product detail, image gallery, reviews, related, cart/wishlist |
| `cart.js` | module | cart.html | Cart render, coupon apply, stock check, qty change |
| `checkout.js` | module | checkout.html | Order placement (transaction), repeat customer popup, IP tracking, auto-fill, payment info, back trap |
| `account.js` | module | account.html | Login, register, Google sign-in, profile view/edit, orders list, district dropdown |
| `wishlist.js` | module | wishlist.html | Wishlist render, cart integration, invalid ID cleanup |
| `contact.js` | module | contact.html | Contact form submit, settings load |
| `order-success.js` | module | order-success.html | Copy order number, WhatsApp link |
| `track-order.js` | module | track-order.html | Order lookup, timeline, payment breakdown |
| `admin.js` | module | admin.html | Auth, products CRUD, orders, coupons, categories, content, settings, multi-category, inline category |
| `messages.js` | module | messages.html | Admin auth, messages list, filters, detail, delete, mark read |

## Other Files
- `logo.png` — Heartix logo (used in header of every page)
- `README.md` — project summary
- `guide.md` — এই ফাইল

---

# 🔍 PART 4: File Identification Guide (যদি এলোমেলো হয়)

## HTML file চেনার উপায় (title ট্যাগ দেখুন)
| Title | File |
|-------|------|
| Heartix — Premium Smart Appliances | index.html |
| Product - Heartix | product.html |
| Cart - Heartix | cart.html |
| Checkout - Heartix | checkout.html |
| My Account - Heartix | account.html |
| Wishlist - Heartix | wishlist.html |
| Contact Us - Heartix | contact.html |
| Order Success - Heartix | order-success.html |
| Track Order - Heartix | track-order.html |
| Admin Control - Heartix | admin.html |
| Messages - Heartix Admin | messages.html |
| About Us - Heartix | about.html |
| FAQ - Heartix | faq.html |
| Terms & Conditions - Heartix | terms.html |
| Privacy Policy - Heartix | privacy.html |
| Return Policy - Heartix | return-policy.html |

## JS file চেনার উপায় (প্রথম import লাইন দেখুন)
- `import { db, auth } from './firebase.js'` → Firebase ব্যবহার করে
- `import { ... } from './common.js'` → common helpers
- `import { DISTRICTS } from './districts.js'` → district list দরকার
- শেষ লাইনে `<script type="module" src="js/XXX.js">` → এই JS টা XX.html-এ belong করে

## CSS file চেনার উপায়
- প্রথমে `@import` নেই, কিন্তু body selector দেখুন
- `body { background: #FBF8F3 }` → সব common
- `#search-bar-wrapper`, `.slider-viewport` → index.css
- `.thumb-item`, `.wishlist-btn-lg` → product.css
- `.timeline-step` → track-order.css
- `.info-view-item`, `.input-wrap` → account.css
- `.nav-item`, `.modal-bg` → admin.css
- `#checkout-subtotal` → checkout.css

## কোন Page কোন File Reference করে
প্রতিটা HTML file-এর `<head>`-এ দেখুন:
```html
<link rel="stylesheet" href="css/common.css">
<link rel="stylesheet" href="css/[PAGE-NAME].css">
```
এবং শেষে:
```html
<script type="module" src="js/[PAGE-NAME].js"></script>
```
এই [PAGE-NAME] টাই ফাইলের পরিচয়।

---

# 🗄️ PART 5: Firebase Structure

## Firestore Collections

### `products`
```js
{
  id: auto,
  name: string,
  price: number,
  oldPrice: number (optional),
  category: string,        // legacy (first category)
  categories: string[],    // new multi-category
  stock: number,
  brand: string,
  description: string,
  image: string,           // main image URL
  images: string[],        // all images
  createdAt: timestamp     // auto
}
```

### `orders`
```js
{
  id: auto,
  orderNumber: string,     // e.g. "HX261015ABCD12"
  customer: {
    name, phone, email, address, district, thana,
    ipAddress: string,
    isRepeat: boolean,
    orderCount: number,
    previousOrderNumbers: string[],
    flagged: boolean,           // same IP detected
    flagReason: string
  },
  items: [{ id, name, price, quantity, image }],
  subtotal, discount, couponCode,
  deliveryCharge, total,
  paymentMethod,               // 'full-cod' | 'delivery-advance' | 'full-online'
  advancePaid, dueAmount,
  status,                      // 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  stockDeducted: boolean,
  adminNote: string,
  createdAt: timestamp
}
```

### `coupons`
```js
{
  code: string (doc ID),
  description, type,           // 'percentage' | 'fixed'
  value, minOrder, maxUses,
  usedCount, expiry, active,
  createdAt, updatedAt
}
```

### `customers` (customer profiles)
```js
{
  uid, name, phone, email,
  address, district, thana,
  photoURL, provider,          // 'email' | 'google'
  createdAt, updatedAt
}
```

### `messages` (contact form)
```js
{
  name, contact, subject, message,
  read: boolean, createdAt: timestamp
}
```

### `reviews`
```js
{
  productId, name, rating, text,
  createdAt: timestamp
}
```

### `settings/main` (single document)
```js
{
  deliveryCharge: number,
  freeDeliveryAbove: number,
  contactAddress, contactPhone, contactEmail, whatsapp,
  bkashNumber, nagadNumber,
  categories: [{ key, label, icon }],
  customSections: [{ title, categoryKey }],
  middleBanners: [{ image, link }],
  testimonials: [{ name, role, text, rating, image }],
  heroBanners: [{ badge, title, subtitle, bg, link, image }]
}
```

### `settings/admins` (admin UIDs)
```js
{
  uids: string[]   // admin Firebase Auth UIDs
}
```

## Firestore Indexes (তৈরি করা আছে)
- `orders`: `orderNumber` ASC
- `orders`: `customer.phone` ASC + `createdAt` DESC
- `orders`: `customer.ipAddress` ASC + `createdAt` DESC
- `reviews`: `createdAt` DESC
- `reviews`: `productId` + `createdAt` (optional)

## Firebase Console Setup (সম্পন্ন)
- ✅ Email/Password Auth enabled
- ✅ Google Sign-in enabled (public name: Heartix, support: twhob71122@gmail.com)
- ✅ Authorized domain: heartix.vercel.app

---

# 🎯 PART 6: যে কাজ বাকি (Remaining Work)

## Priority Order (কোনটা আগে, কেন)

### 🥇 Phase 1: Reorder System — **পরের কাজ** (~২-৩ ঘণ্টা)
**কেন আগে:** Admin-এর জন্য সবচেয়ে জরুরি। Category/Product order পরিবর্তন করতে পারলে homepage control বাড়ে।

**কি করতে হবে:**
1. Category Reorder (drag & drop) — `js/admin.js` + `admin.html`
2. Product Reorder within category
3. Section Reorder (home page custom sections)
4. Featured Selection (hand-pick products)
5. Pin to Top (specific product শীর্ষে)

**সম্ভাব্য ভুল:**
- Firestore-এ `order` field যোগ করতে হবে প্রতিটা item-এ
- Drag & drop library (SortableJS) CDN যোগ করতে হবে
- Vercel deploy-এ memory issue হতে পারে (সাধারণত হয় না)

**সিকিউরিটি:** Admin-only (Firebase Auth check already আছে)

---

### 🥈 Phase 2: Plug & Play Settings — (~৪-৫ ঘণ্টা)
**কেন দ্বিতীয়:** SMS/Email/Payment integration সহজে on/off করা যাবে।

**কি করতে হবে:**
1. `settings/main`-এ `integrations` object তৈরি
2. Admin → Settings tab-এ toggle buttons
3. প্রতিটা integration:
   - SMS (BulkSMSBD) — API key + sender ID
   - Email (SendGrid) — API key
   - Facebook Pixel — Pixel ID
   - bKash Payment — Merchant creds
   - Nagad Payment — Merchant creds
   - WhatsApp API — Token
   - Google Analytics — Measurement ID

**সমস্যা এড়াতে:**
- **প্রতিটা integration-এর জন্য আলাদা file বানাবেন** (`js/integrations/sms.js` ইত্যাদি)
- Server-side API calls লাগবে → **Vercel Serverless Function** ব্যবহার করবেন
- API keys **Firestore-এ save করবেন না** — Vercel Environment Variables-এ দেবেন

**সিকিউরিটি:**
- API keys কখনো client-side code-এ expose করবেন না
- Serverless function-এ admin UID verify করবেন

---

### 🥉 Phase 3: Admin Tools — (~৩-৪ ঘণ্টা)

1. **Bulk CSV Upload** — products একসাথে upload (Cloudinary-এর সাথে integration)
2. **Moderator Tab** — read-only admin access
3. **Landing Pages Tab** — landing.html track
4. **Landing Stats** — Facebook campaign tracking
5. **Bulk Order Update** — multiple orders status পরিবর্তন
6. **Inventory Alert** — low stock (৫ এর কম)

**সমস্যা:**
- CSV parse করার জন্য PapaParse library লাগবে
- Cloudinary bulk upload-এ rate limit

---

### 📊 Phase 4: Analytics — (~৪-৫ ঘণ্টা)

1. Sales Dashboard (Chart.js দিয়ে graph)
2. Customer Segmentation (Repeat vs New)
3. Profit Calculator (product-এ cost field যোগ)
4. Return Rate Tracking
5. Top Products Report
6. Monthly Report

**সমস্যা:**
- Chart.js CDN যোগ করতে হবে
- বড় dataset-এ Firestore query slow — aggregation করতে হবে

---

### 📱 Phase 5: Customer UX — (~৫-৬ ঘণ্টা)

1. PWA Setup (manifest.json + service worker)
2. Push Notification (Firebase Cloud Messaging)
3. Dark Mode (CSS variables)
4. Reviews with Images (Cloudinary upload)
5. Pre-order System (out of stock-এও order)
6. Product Variants (color, size)
7. Product Comparison

**সমস্যা:**
- Dark mode-এ সব hardcoded color পরিবর্তন করতে হবে
- PWA install prompt কাজ নাও করতে পারে কিছু browser-এ

---

### 🎯 Phase 6: Marketing — (~৫-৬ ঘণ্টা)

1. Facebook Pixel (Phase 2-এ করা থাকবে)
2. Abandoned Cart Recovery (email)
3. Refer & Earn (referral code system)
4. Loyalty Points (point earning/redemption)
5. Wishlist Cloud Sync (logged-in user-এর wishlist Firestore-এ)
6. Spin Wheel (discount wheel)
7. Product Bundle (multi-product discount)

**সমস্যা:**
- Referral code uniqueness ensure করতে হবে
- Loyalty points spend/earn calculation সাবধানে করতে হবে

---

# 🚨 PART 7: ভুল এড়ানোর Rules

## General Rules
1. **কখনো `common.css` edit করবেন না directly** — সব page affect করবে
2. **কখনো `firebase.js`-এ config ছাড়া অন্য কিছু রাখবেন না**
3. **সব number-এ `font-family: Inter` force করবেন** (Playfair নয়) — `css/cart.css`-এ দেখুন
4. **সব user input-এ `escapeHtml()` ব্যবহার করবেন** — XSS prevention
5. **Firestore-এ `serverTimestamp()` ব্যবহার করবেন** — `new Date()` নয়
6. **সব price calculation server-side transaction-এ করবেন** — client থেকে বিশ্বাস করবেন না
7. **File path সবসময় relative রাখবেন** (`./common.js`, `css/index.css`)

## File Edit করার আগে
1. **GitHub-এ commit history check করুন** — ভুল হলে rollback
2. **একবারে একটাই file edit করবেন**
3. **Local-এ test না করে live-এ push করবেন না** (Vercel preview branch)
4. **console.log() দিয়ে debug করবেন, তারপর সরাবেন**

## Firebase Console-এ যা করবেন না
- ❌ Firestore rules ভাঙবেন না
- ❌ Admin UID নিজে থেকে সরাবেন না
- ❌ Test mode-এ database রাখবেন না (production-এ rules enforce)
- ❌ API keys GitHub-এ commit করবেন না

## Browser Cache
- **Test-এর আগে hard refresh করুন** (`Ctrl+Shift+R`)
- **Vercel deploy-এর পর ২ মিনিট wait করুন**
- **Mobile-এ cache clear করুন** — Settings → Site data → Clear
- URL-এ `?v=2` যোগ করলে cache bypass

---

# 🔐 PART 8: Security Checklist

## ✅ যা করা আছে
- [x] Firestore rules deployed (public read products, admin write)
- [x] Admin UID verify on login
- [x] Email/Password Auth
- [x] Google Sign-in
- [x] Server-side pricing (transaction)
- [x] XSS protection (escapeHtml)
- [x] Back button trap
- [x] IP flagging (not blocking)
- [x] Cart tampering prevention
- [x] Vercel domain authorized
- [x] HTTPS (Vercel auto)
- [x] Coupon double-validation

## ⚠️ যা যুক্ত করতে হবে (Phase 2-3-এ)
- [ ] Rate limiting on order placement (serverless function)
- [ ] SMS verification for phone (Optional)
- [ ] reCAPTCHA on register form
- [ ] Email verification on register
- [ ] Admin 2FA (optional)
- [ ] API key rotation policy
- [ ] Audit log for admin actions
- [ ] Backup strategy (Firestore export weekly)

## 🚫 যা কখনো করবেন না
- Firestore rules-এ `allow read, write: if true` দেবেন না
- Admin credentials hardcode করবেন না
- User input সরাসরি HTML-এ inject করবেন না
- `eval()` ব্যবহার করবেন না
- API keys client-side-এ দেখাবেন না

---

# 🎨 PART 9: UI/UX Patterns

## প্রতিটা Page-এর Structure
```html
<!DOCTYPE html>
<html lang="bn">
<head>
    <!-- Meta tags -->
    <!-- Tailwind CDN -->
    <!-- Font Awesome CDN -->
    <!-- Google Fonts -->
    <!-- Tailwind config -->
    <!-- css/common.css -->
    <!-- css/[page].css -->
</head>
<body>
    <!-- Toast container -->
    <div id="toast-container"></div>
    
    <!-- Header (glass, sticky) -->
    
    <!-- Main content -->
    
    <!-- Footer (optional) -->
    
    <!-- Fallback scripts (if any) -->
    <!-- js/[page].js (module) -->
</body>
</html>
```

## Common CSS Classes
- `.navy-gradient` — ডার্ক নেভি background
- `.gold-gradient` — গোল্ড gradient background
- `.gold-text` — গোল্ড রঙ text
- `.navy-text` — নেভি রঙ text
- `.glass` — frosted glass effect
- `.premium-shadow` — soft shadow
- `.hide-scrollbar` — scrollbar লুকানো
- `.shimmer` — skeleton loading animation
- `.premium-shadow-lg` — larger shadow

## Toast Usage
```js
import { showToast } from './common.js';
showToast('Success message', 'success');  // green
showToast('Error message', 'error');      // red
showToast('Warning', 'warn');             // orange
showToast('Info', 'info');                // navy
```

## Cart Badge IDs (সব page-এ)
- `#cart-count-header` — header badge
- `#cart-count-bottom` — bottom nav (index.html)
- `#cart-count-sidebar` — sidebar (index.html)
- `#wishlist-count-header` — wishlist badge

---

# 📋 PART 10: Quick Reference

## Function Names (global)
| Function | File | Called from |
|----------|------|-------------|
| `login()`, `logout()` | admin.js, messages.js | admin.html, messages.html |
| `loginUser()`, `registerUser()`, `googleSignIn()` | account.js | account.html |
| `addToCart()`, `removeFromCart()` | index.js, product.js, wishlist.js | multiple |
| `toggleWishlist()` | index.js, product.js | multiple |
| `applyCoupon()`, `removeCoupon()` | cart.js | cart.html |
| `placeOrder()` | checkout.js | checkout.html |
| `trackOrder()` | track-order.js | track-order.html |
| `submitContactForm()` | contact.js | contact.html |
| `saveProfile()` | account.js | account.html |
| `openAddressEdit()`, `cancelAddressEdit()` | account.js | account.html |
| `openAddModal()`, `saveProduct()`, `editProduct()`, `deleteProduct()` | admin.js | admin.html |
| `openOrderEdit()`, `saveOrderEdit()`, `openStatusPicker()` | admin.js | admin.html |
| `openCategoryModal()`, `saveCategory()`, `openInlineCategoryModal()` | admin.js | admin.html |
| `openCouponModal()`, `saveCoupon()` | admin.js | admin.html |
| `openHeroModal()`, `openSectionModal()`, `openBannerModal()`, `openTestimonialModal()` | admin.js | admin.html |
| `filterOrders()`, `exportOrdersCSV()` | admin.js | admin.html |
| `loadMessages()`, `filterMessages()`, `openDetail()` | messages.js | messages.html |

## Important IDs
- `#toast-container` — সব page-এ
- `#cart-count-header` — header
- `#wishlist-count-header`
- `#customer-name`, `#customer-phone`, `#customer-email`, `#customer-address`, `#customer-district`, `#customer-thana` — checkout
- `#login-email`, `#login-password`, `#remember-me` — account
- `#order-input` — track-order
- `#order-number` — order-success
- `#profile-name`, `#profile-phone`, `#profile-address`, `#profile-district`, `#profile-thana` — account

## Status Values
- Order: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`
- Payment: `full-cod`, `delivery-advance`, `full-online`
- Coupon: `percentage`, `fixed`

## LocalStorage Keys
- `heartix_cart` — cart array
- `heartix_wishlist` — wishlist IDs array
- `heartix_recent` — recently viewed IDs
- `heartix_coupon` — applied coupon data
- `heartix_remember` — remembered login identifier

---

# 🚀 PART 11: পরের সেশনের Action Plan

## Immediate Next Steps (Priority Order)

### Step 1: Test Current State (~৩০ মিনিট)
- [ ] সব page খুলুন → কোনো console error আছে কিনা
- [ ] Full flow test — browse → cart → checkout → order → track
- [ ] Admin সব tab test
- [ ] Repeat customer popup test (একই phone দিয়ে)
- [ ] Google Sign-in test
- [ ] Mobile + Desktop test

### Step 2: Phase 1 — Reorder System (~২-৩ ঘণ্টা)
**কেন আগে:** Admin control বাড়ানো, easy win
**কি লাগবে:** SortableJS library (CDN)
**Files to modify:** admin.html, js/admin.js, index.html, js/index.js, css/admin.css

### Step 3: Phase 2 — Integrations (~৪-৫ ঘণ্টা)
**কেন পরে:** External API setup সময়সাপেক্ষ
**Files to create:** js/integrations/*.js
**Vercel:** Serverless functions API 폴더

### Step 4: Phase 3 — Admin Tools (~৩-৪ ঘণ্টা)
**কেন পরে:** Bulk CSV upload complex
**Files to create:** js/csv-parser.js

### Step 5: Phase 4-6 — Analytics + Marketing
**কেন শেষে:** এসব optional, business বাড়লে জরুরি

---

## যা আগে করলে ভালো
1. **Firestore backup নিন** — Firebase Console → Firestore → Export
2. **Vercel GitHub integration verify করুন** — push মাত্র deploy হবে
3. **Cloudinary account limit check করুন** — ২৫ credit/মাস
4. **Firebase billing dashboard check করুন** — free tier limit এর মধ্যে আছি কিনা
5. **Domain কিনুন** — `heartix.com` (~১২০০ টাকা/বছর) → professional email + no more `heartix.vercel.app`

---

## যা ভুল হলে করবেন
| সমস্যা | সমাধান |
|--------|--------|
| White screen | Console-এ error দেখুন → JS import ঠিক আছে কিনা |
| 404 on css/js | File path check করুন |
| Cart badge ভুল | `updateCartBadges()` কল হচ্ছে কিনা দেখুন |
| Firestore permission denied | Rules check করুন |
| Order place না হলে | Transaction error — stock বা permission issue |
| Google login fail | Authorized domain check |
| Index error | Error link-এ click → Create Index |
| Deploy fail | Vercel → Deployments → Logs দেখুন |
| Firebase quota exceeded | ২৪ ঘণ্টা wait অথবা billing upgrade |

---

# 📊 PART 12: Statistics

## Current Progress
| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0 | ✅ সম্পূর্ণ | 100% |
| Phase 1 | ⏳ পরবর্তী | 0% |
| Phase 2 | ⏳ | 0% |
| Phase 3 | ⏳ | 0% |
| Phase 4 | ⏳ | 0% |
| Phase 5 | ⏳ | 0% |
| Phase 6 | ⏳ | 0% |

**Overall: ~15% সম্পূর্ণ**

## File Counts
| Type | Count |
|------|-------|
| HTML | 18 (2 TODO) |
| CSS | 12 |
| JS | 14 |
| Markdown | 2 |
| Image | 1 |
| **Total** | **47** |

## Lines of Code (approx)
- HTML: ~4,500
- CSS: ~1,800
- JS: ~4,200
- **Total:** ~10,500 lines

## Cost Analysis (Monthly)
| Service | Free Tier | Current Usage |
|---------|-----------|---------------|
| Firebase Firestore reads | 50K/day | <1K/day |
| Firebase Firestore writes | 20K/day | <100/day |
| Firebase Auth | Unlimited | <10 users |
| Cloudinary | 25 credits/month | <5 credits |
| Vercel bandwidth | 100 GB/month | <1 GB |
| **Total cost** | **৳0/month** | Well within limits |

---

# 🎓 PART 13: অন্যান্য AI-এর জন্য নির্দেশনা

## এই Project-এ কাজ করার নিয়ম
1. **সবসময় এই guide.md আগে পড়ুন**
2. **File edit করার আগে commit history check করুন**
3. **একটাই file at a time edit করুন**
4. **প্রতিটা edit-এর পর commit করুন**
5. **User-কে step-by-step নির্দেশনা দিন** (মোবাইলে কাজ করে)
6. **পূর্ণ file content দিন, শুধু patch নয়** — user মোবাইলে খুঁজে পায় না
7. **Commit message বাংলা বা English — যেকোনো চলবে**

## إذا User File Confused
- User যদি file name ভুলে যায় → title/content দেখে identify করুন
- HTML-এর শেষে `<script src="js/X.js">` দেখুন → X.html-এর জন্য
- CSS-এ class name দেখুন → page identify
- User-কে বলুন "এই file-টা যদি XX নাম দিয়ে সেভ করেন, ঠিক হবে"

## Critical Rules
- **কখনো `common.css` delete করবেন না**
- **কখনো `firebase.js` edit করবেন না** (শুধু config আছে)
- **সব file-এ `import` লাইন verify করুন** — relative paths (`./firebase.js`)
- **`escapeHtml()` ছাড়া user data render করবেন না**
- **Firestore-এ `setDoc` vs `updateDoc` vs `addDoc` পার্থক্য জানুন**

## Contact Points (Firebase)
- Project ID: `heartix`
- Firestore region: asia-south1 (assumed)
- Auth domain: `heartix.firebaseapp.com`
- Support email: `twhob71122@gmail.com`
- Cloudinary cloud: `ju2w6e9r`
- Upload preset: `heartix_unsigned`

---

# 📝 PART 14: Changelog

## v2.0 (15 Oct 2025) — Phase 0 Complete
- ✅ Modular file structure (17 HTML, 12 CSS, 14 JS)
- ✅ Multi-category products
- ✅ Repeat customer detection
- ✅ IP flagging
- ✅ Google Sign-in
- ✅ Phone-based login
- ✅ Account address save
- ✅ Checkout auto-fill
- ✅ Wishlist auto-cleanup
- ✅ Back button trap
- ✅ Atomic order transaction

## v1.0 (Initial) — Early development
- Basic e-commerce
- Single-category products
- Email/Password auth
- COD payment
- Simple cart

---

# 🎯 FINAL WORD

**এই guide.md যেকোনো AI-এর জন্য complete reference।** File edit করার আগে এটা পড়ুন। নতুন feature যোগ করার সময় এই file update করুন। 

**Project Status:** ১৫% সম্পূর্ণ, Phase 0 (foundation) সম্পূর্ণ — এখন feature building শুরু হবে।

**Next Session Priority:** Phase 1 — Reorder System।

---

**Last Updated:** 15 October 2025
**Maintainer:** Developer + Claude AI
**Total Pages:** 14 sections
**Purpose:** Single source of truth for entire project