# 📖 Heartix — Master Guide v3.0 (Complete Reference)

**Version:** 3.0
**Last Updated:** 15 October 2025
**Live Site:** heartix.vercel.app
**Status:** Phase 0 ✅ + Phase 1 ✅ সম্পূর্ণ | Phase 2 পরবর্তী
**Maintainer:** Developer + Claude AI
**Purpose:** Single source of truth — যেকোনো AI সাথে সাথে কাজ বুঝতে পারবে

---

# 🎯 PART 1: Project পরিচিতি

## Heartix কী?
বাংলাদেশের প্রিমিয়াম স্মার্ট অ্যাপ্লায়েন্স ই-কমার্স সাইট। Full stack: HTML + Tailwind CSS + Vanilla JS + Firebase (Firestore + Auth) + Cloudinary (images) + Vercel (hosting)।

## Core Stack
| Component | Technology | Cost |
|-----------|-----------|------|
| Frontend | HTML5, Tailwind CSS (CDN), Vanilla JS (ES Modules) | ফ্রি |
| Backend | Firebase Firestore + Auth | ফ্রি (Spark) |
| Images | Cloudinary (unsigned upload) | ফ্রি |
| Hosting | Vercel | ফ্রি |
| Icons | Font Awesome 6 (CDN) | ফ্রি |
| Fonts | Inter + Playfair Display (Google) | ফ্রি |

## Brand Colors
```
Navy:  #0A1628 (primary dark)
Gold:  #D4A84B (accent)
Cream: #FBF8F3 (background)
Green: #16a34a (success)
Red:   #dc2626 (danger)
```

## Font Rules (গুরুত্বপূর্ণ!)
- **Body/UI:** Inter
- **Headings/Titles:** Playfair Display (font-display class)
- **Numbers (Price/Total):** **Inter Bold (কখনো Playfair নয়!)** — এটা critical। `css/cart.css`, `css/checkout.css`-এ `#subtotal`, `#total`, `.price-per-item` ইত্যাদিতে `font-family: 'Inter' !important` দেওয়া আছে।

## Firebase Config
- Project ID: `heartix`
- Auth domain: `heartix.firebaseapp.com`
- Support email: `twhob71122@gmail.com`
- Cloudinary cloud: `ju2w6e9r`
- Upload preset: `heartix_unsigned`

---

# 📊 PART 2: বর্তমান অবস্থা

## ✅ Phase 0: Modular File Structure — সম্পূর্ণ
সব page-এর inline CSS/JS সরিয়ে আলাদা ফাইলে। **৪৩টা ফাইল** (১৭ HTML, ১২ CSS, ১৪ JS)।

## ✅ Phase 1: Reorder System — সম্পূর্ণ
- Category Reorder (↑↓ buttons, modal)
- Section Reorder (↑↓ buttons, modal)
- Product Reorder within category
- Featured Selection (toggle in product modal)
- Pin to Top (toggle in product modal)

## 🆕 নতুন Features (Phase 0-এ যোগ হয়েছে)

### 1. Multi-Category Support
- Product-এ একাধিক category: `categories: ["TV", "Gadget"]`
- Backward compatible: পুরনো `category: "TV"` ও কাজ করে
- Admin checkbox list, home filter multi-cat অনুযায়ী

### 2. Inline Category Creation
Product modal-এ **"+ New"** → quick add, auto-checked হয়ে যায়

### 3. Repeat Customer System
- ২য় order-এ profile থেকে auto-fill popup
- Popup: last order info + tracking link + history link
- Admin-এ **"Repeat (N)"** badge
- `customer.isRepeat`, `customer.orderCount`, `customer.previousOrderNumbers`

### 4. IP Tracking (Flag only — block না)
- Order-এ `customer.ipAddress` save
- Same IP different phone → `customer.flagged: true`, `flagReason: "same_ip_recent"`
- Admin-এ **"Same IP"** (কমলা) badge
- CG-NAT সমস্যা এড়াতে block করা হয় না

### 5. 10-Minute Warning
- ১০ মিনিটের ভেতরে ২য় order → warning popup
- Customer Continue করতে পারে (hard block না)
- **Back button trap**: modal খোলা থাকলে back চাপলে re-push state → bypass impossible
- "বাতিল" চাপলে phone field clear → আবার লিখতে হয়

### 6. Account Address Save
- Name, Phone, Address, District, Thana save
- View/Edit mode toggle (professional card design)
- Empty field: "Add your address" (italic ধূসর)
- Filled: bold text

### 7. Checkout Auto-fill
- Logged-in customer checkout-এ গেলে profile থেকে সব field auto-fill
- Toast: "আপনার saved তথ্য অটো-ফিল করা হয়েছে ✅"

### 8. Google Sign-in
- Firebase Console-এ enabled
- Account page-এ ৪-রঙের G logo button
- First-time user: Firestore `customers/{uid}` auto-create

### 9. Remember Me + Password Eye
- Login-এ Remember me checkbox → localStorage
- Password field-এ eye toggle

### 10. Phone-based Login
- Email বা Phone দুটোই
- Phone দিলে Firestore query করে email বের করে

### 11. Wishlist Auto-Cleanup
- Delete হওয়া product ID auto-remove
- Badge সবসময় accurate

### 12. District/Thana Optional
- Checkout-এ mandatory না
- Account-এ save করলে auto-fill হবে

### 13. Atomic Order Transaction
- Server-authoritative pricing
- Stock check + deduct transaction-এ
- Coupon double-validate

### 14. Compact Collapsible Order Cards (Admin)
- `<details>`/`<summary>` দিয়ে expand/collapse
- Compact view: Order# + Status + Customer + Date + Badges + Items + Total
- Expanded: Address + Items with images + Payment breakdown + Actions
- Chevron rotate animation

### 15. Product Reorder + Featured + Pin
- `sortOrder` field per product
- `featured: bool` → Home-এ Featured section
- `pinned: bool` → Top Selling-এ সবার আগে
- Home sort: pinned → sortOrder → name

---

## 🐛 Bug Fixes (Phase 0-এ)
1. Image undefined issue
2. Star rating half-star logic
3. Copy order number (clipboard fallback)
4. Cart tampering (server pricing)
5. XSS in hero banners (`safeHeroTitle`)
6. Category scroll pause on touch
7. Status badge override
8. Cart price exploit
9. Google logo broken SVG
10. Font mix (Playfair on numbers → Inter force)
11. Apply button overflow in cart
12. Google sign-in enabled + domain authorized

---

# 📁 PART 3: সম্পূর্ণ File Structure

## Root Level HTML Files
```
/index.html               → Home (hero, categories, products, featured, dynamic sections)
/product.html             → Product detail (gallery, reviews, related, cart)
/cart.html                → Cart (items, coupon, summary)
/checkout.html            → Checkout (address, payment, order, repeat popups)
/account.html             → Auth + Profile (login, register, google, view/edit)
/wishlist.html            → Saved products
/contact.html             → Contact form + settings cards
/order-success.html       → Post-order (copy, whatsapp)
/track-order.html         → Order tracking (timeline, payment breakdown)
/admin.html               → Admin panel (8 tabs)
/messages.html            → Admin inbox
/about.html               → Static
/faq.html                 → Static
/terms.html               → Static
/privacy.html             → Static
/return-policy.html       → Static
/landing.html             → ⏳ TODO
/moderator.html           → ⏳ TODO
/logo.png                 → Logo
/README.md                → Summary
/guide.md                 → এই ফাইল
```

## CSS Files (`css/` folder)

| File | Loaded by | Contains |
|------|-----------|----------|
| `common.css` | **সব page** | body, navy-gradient, gold-gradient, gold-text, navy-text, glass, premium-shadow, hide-scrollbar, toast (slideDown animation), shimmer, spin, animate-slide-up, animate-fade-in, input focus |
| `index.css` | index.html | #search-bar-wrapper, .qty-control, .add-cart-btn, .category-card, .slider-viewport, .slider-track, .product-card, #floating-cart, .wishlist-btn, #search-suggestions, .suggestion-item, .error-box |
| `product.css` | product.html | .thumb-item, .qty-control, .action-btn, .prod-img, .wishlist-btn-lg |
| `cart.css` | cart.html | .prod-img, .coupon-input, **number fonts force Inter** (price-per-item, price-line-total, #subtotal, #discount-amount, #delivery-charge, #total, #free-delivery-amount) |
| `checkout.css` | checkout.html | .payment-option, .payment-option.selected, .check-circle, .field-error, number fonts force Inter |
| `account.css` | account.html | .tab-btn, .input-wrap, .input-icon, .eye-btn, .or-divider, .btn-primary-lg, .btn-gold-lg, .social-btn, .remember-row, .register-prompt, .status-* badges, **.info-view-item, .info-view-item.empty, .info-view-item .info-icon, .info-edit-input, .info-edit-label** |
| `wishlist.css` | wishlist.html | .prod-img, .add-cart-btn, .qty-control |
| `contact.css` | contact.html | .contact-item, input focus |
| `order-success.css` | order-success.html | .pop, .fade-up, .delay-1/2/3/4 |
| `track-order.css` | track-order.html | .timeline-step, .timeline-step.done, .timeline-step.active, .dot, status badges |
| `admin.css` | admin.html | .modal-bg, .img-thumb, .cat-preview, .nav-item, .nav-item.active, .toast variants (success/error/warn/info), .order-status, .status-* badges, .btn-primary, .btn-gold, .btn-danger, .btn-success, .cat-card, .order-item-row, .coupon-card, @media (desktop sidebar/mobile bottom) |
| `messages.css` | messages.html | .msg-card, .unread-dot |

## JS Files (`js/` folder)

| File | Type | Contains |
|------|------|----------|
| `firebase.js` | module | firebaseConfig, initializeApp, `db`, `auth` export |
| `common.js` | module | showToast, escapeHtml, formatPrice, getCart, saveCart, getQtyInCart, getWishlist, saveWishlist, isInWishlist, getRecentlyViewed, addToRecentlyViewed, updateCartBadges, updateWishlistBadges, validatePhone, generateOrderNumber |
| `districts.js` | module | `DISTRICTS` array (64 জেলা) |
| `index.js` | module | Home logic: hero slider, categories, products, search, wishlist, cart, recently viewed, **dynamic sections (Featured + Custom + Testimonials)** |
| `product.js` | module | Product detail, image gallery, reviews, related, cart/wishlist |
| `cart.js` | module | Cart render, coupon apply/remove, stock validation, qty change, clear, move to wishlist |
| `checkout.js` | module | Order place (transaction), **repeat customer popup**, **IP tracking**, **auto-fill from profile**, **back trap**, payment info, district dropdown |
| `account.js` | module | Login, register, Google Sign-in, forgot password, profile view/edit (address), My Orders, district dropdown |
| `wishlist.js` | module | Wishlist render, cart integration, **auto-cleanup of invalid IDs**, wishlist badge sync |
| `contact.js` | module | Contact form submit, settings load, char counter |
| `order-success.js` | module | Copy order number, WhatsApp link from settings |
| `track-order.js` | module | Order lookup, timeline, item list, payment breakdown, copy |
| `admin.js` | module | Auth, Products (CRUD + featured + pinned + sortOrder), Orders (compact cards + edit + status), Coupons, Categories, Content (Hero/Sections/Banners/Testimonials), Settings, Messages badge, CSV export, **CSS injection for `<details>` cleanup** |
| `admin-reorder.js` | module | Category Reorder, Section Reorder, **Product Reorder** (all with ↑↓ + Firestore save) |
| `messages.js` | module | Admin auth, message list, filters, detail modal, mark read, delete, reply links |

## File Identification Guide (এলোমেলো হলে)

### HTML চেনার উপায় (`<title>` tag)
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

### HTML-এর শেষ লাইন (script src)
```
<script type="module" src="js/index.js"></script>           → index.html
<script type="module" src="js/product.js"></script>         → product.html
<script type="module" src="js/cart.js"></script>            → cart.html
<script type="module" src="js/checkout.js"></script>        → checkout.html
<script type="module" src="js/account.js"></script>         → account.html
<script type="module" src="js/wishlist.js"></script>        → wishlist.html
<script type="module" src="js/contact.js"></script>         → contact.html
<script type="module" src="js/order-success.js"></script>   → order-success.html
<script type="module" src="js/track-order.js"></script>     → track-order.html
<script type="module" src="js/admin-reorder.js"></script>   → admin.html (first)
<script type="module" src="js/admin.js"></script>           → admin.html (second)
<script type="module" src="js/messages.js"></script>        → messages.html
```

### JS চেনার উপায় (প্রথম import দেখুন)
```js
import { db, auth } from './firebase.js'  → Firebase ব্যবহার করে
import { ... } from './common.js'         → common helpers
import { DISTRICTS } from './districts.js' → district list
```

### JS চেনার সহজ উপায় (unique function)
| Function | JS file |
|----------|---------|
| `renderAdminOrders`, `renderAdminProducts`, `openAddModal` | admin.js |
| `openCategoryReorder`, `openProductReorder` | admin-reorder.js |
| `addToCart` + `renderHeroBanners` + `renderDynamicContent` | index.js |
| `renderProduct` + `submitReview` | product.js |
| `applyCoupon` + `proceedToCheckout` | cart.js |
| `placeOrder` + `showWarningModal` | checkout.js |
| `loginUser` + `googleSignIn` + `saveProfile` + `openAddressEdit` | account.js |
| `trackOrder` + `renderOrder` | track-order.js |
| `copyOrderNumber` | order-success.js |
| `loadMessages` + `openDetail` | messages.js |
| `submitContactForm` | contact.js |

### CSS চেনার উপায় (unique class)
| Class/ID | CSS file |
|----------|----------|
| `#search-bar-wrapper`, `.slider-viewport`, `#floating-cart` | index.css |
| `.thumb-item`, `.wishlist-btn-lg` | product.css |
| `#total`, `.price-per-item` (Inter force) | cart.css |
| `.payment-option`, `#checkout-subtotal` | checkout.css |
| `.info-view-item`, `.input-wrap`, `.social-btn` | account.css |
| `.timeline-step` | track-order.css |
| `.nav-item`, `.modal-bg`, `.order-status`, `.cat-preview` | admin.css |
| `.msg-card` | messages.css |
| `.contact-item` | contact.css |
| `.pop`, `.fade-up` | order-success.css |
| `.tab-btn` (in account) | account.css |

---

# 🗄️ PART 4: Firebase Structure

## Firestore Collections

### `products`
```js
{
  id: auto,
  name: string,
  price: number,
  oldPrice: number | 0,
  category: string,           // legacy — first category
  categories: string[],       // new — multi-category
  stock: number,
  brand: string,
  description: string,
  image: string,              // main image
  images: string[],           // all images (max 5)
  sortOrder: number,          // NEW — for reorder
  featured: boolean,          // NEW — Featured on home
  pinned: boolean,            // NEW — Pin to top
  createdAt: timestamp
}
```

### `orders`
```js
{
  id: auto,
  orderNumber: string,        // "HX261015ABCD12"
  customer: {
    name, phone, email, address, district, thana,
    ipAddress: string,             // NEW
    isRepeat: boolean,             // NEW
    orderCount: number,            // NEW (1 = first time)
    previousOrderNumbers: string[],// NEW (max 5)
    flagged: boolean,              // NEW — same IP detected
    flagReason: string             // "same_ip_recent" | ""
  },
  items: [{ id, name, price, quantity, image }],
  subtotal, discount, couponCode,
  deliveryCharge, total,
  paymentMethod,              // 'full-cod' | 'delivery-advance' | 'full-online'
  advancePaid, dueAmount,
  status,                     // 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  stockDeducted: boolean,
  adminNote: string,
  createdAt: timestamp
}
```

### `coupons`
```js
{
  code: string (doc ID — uppercase),
  description, type,          // 'percentage' | 'fixed'
  value, minOrder, maxUses,
  usedCount, expiry, active,
  createdAt, updatedAt
}
```

### `customers`
```js
{
  uid, name, phone, email,
  address, district, thana,   // NEW — for checkout auto-fill
  photoURL, provider,         // 'email' | 'google'
  createdAt, updatedAt
}
```

### `messages` (Contact form)
```js
{
  name, contact, subject, message,
  read: boolean, createdAt: timestamp
}
```

### `reviews`
```js
{
  productId, name, rating (1-5), text,
  createdAt: timestamp
}
```

### `settings/main` (single doc)
```js
{
  deliveryCharge: number,
  freeDeliveryAbove: number,
  contactAddress, contactPhone, contactEmail, whatsapp,
  bkashNumber, nagadNumber,
  facebook, instagram,
  categories: [{ key, label, icon }],
  customSections: [{ title, categoryKey }],
  middleBanners: [{ image, link }],
  testimonials: [{ name, role, text, rating, image }],
  heroBanners: [{ badge, title, subtitle, bg, link, image }]
}
```

### `settings/admins` (single doc)
```js
{ uids: string[] }   // Admin Firebase Auth UIDs
```

## Firestore Indexes (Required)
- `orders`: `orderNumber` ASC — for track-order query
- `orders`: `customer.phone` ASC + `createdAt` DESC — for repeat customer lookup
- `orders`: `customer.ipAddress` ASC + `createdAt` DESC — for IP flag check
- `reviews`: `createdAt` DESC — for review list
- `orders`: `createdAt` DESC — for admin order list (default query)

**Index তৈরি:** Firebase Console → Firestore → Indexes → Composite → এগুলো create করুন। অথবা first query-তে error link আসবে → click → auto-create।

## Firebase Console Setup (সম্পন্ন)
- ✅ Email/Password Auth enabled
- ✅ Google Sign-in enabled (public: Heartix, support: twhob71122@gmail.com)
- ✅ Authorized domain: `heartix.vercel.app`
- ✅ Firestore rules deployed

## Firestore Rules (public read products, admin write)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/settings/admins).data.uids.hasAny([request.auth.uid]);
    }
    match /products/{doc} { allow read: if true; allow write: if isAdmin(); }
    match /reviews/{doc} { allow read: if true; allow create: if true; allow delete: if isAdmin(); }
    match /orders/{doc} { allow read: if true; allow create: if true; allow update, delete: if isAdmin(); }
    match /coupons/{doc} { allow read: if true; allow write: if isAdmin(); }
    match /messages/{doc} { allow create: if true; allow read, update, delete: if isAdmin(); }
    match /customers/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /settings/{doc} { allow read: if true; allow write: if isAdmin(); }
  }
}
```

---

# ⬜ PART 5: বাকি কাজ (Priority Order)

## 🥇 Phase 2: Plug & Play Settings — পরবর্তী (~৪-৫ ঘণ্টা)
**কেন:** Admin-এর জন্য external integrations সহজে on/off করা

### Integration List (সব OFF default)
1. **SMS (BulkSMSBD)** — Order notification
2. **Email (SendGrid)** — Order confirmation
3. **Facebook Pixel** — Ad tracking
4. **bKash Payment Gateway** — Auto payment
5. **Nagad Payment Gateway** — Auto payment
6. **WhatsApp API** — Auto messaging
7. **Google Analytics** — Site stats

### ⚠️ সতর্কতা
- **API keys কখনো client-side-এ রাখবেন না** — Vercel Environment Variables ব্যবহার করুন
- **Serverless functions লাগবে** — Vercel-এ `/api/` folder
- **প্রতিটা integration-এর জন্য আলাদা file** — `js/integrations/sms.js` ইত্যাদি
- **Toggle structure:** `settings/main.integrations = { sms: false, email: false, ... }`

### Estimated Files
- `admin.html` — Settings tab-এ new section
- `js/admin.js` — toggle handling
- `js/integrations/*.js` — 7টা নতুন file
- `/api/*.js` — Vercel serverless (SMS, Email, Payment)

---

## 🥈 Phase 3: Admin Tools — (~৩-৪ ঘণ্টা)

### Features
1. **Bulk CSV Upload** — Products একসাথে (PapaParse library)
2. **Moderator Tab** — Read-only admin access
3. **Landing Pages Tab** — landing.html track
4. **Landing Stats** — Facebook campaign tracking
5. **Bulk Order Update** — multiple orders status
6. **Inventory Alert** — stock < 5 হলে notification

### Files to Create
- `moderator.html` + `js/moderator.js`
- `landing.html` + `js/landing.js`
- `admin.html`-এ নতুন tab যোগ

### ⚠️ সতর্কতা
- CSV parse-এ encoding issue (UTF-8 BOM)
- Cloudinary bulk upload-এ rate limit (১ সেকেন্ড delay)

---

## 🥉 Phase 4: Analytics — (~৪-৫ ঘণ্টা)

### Features
1. **Sales Dashboard** — Chart.js graph (daily/monthly)
2. **Customer Segmentation** — Repeat vs New
3. **Profit Calculator** — product-এ `cost` field যোগ
4. **Return Rate Tracking** — cancelled/total ratio
5. **Top Products Report** — best sellers
6. **Monthly Report** — auto email

### ⚠️ সতর্কতা
- Chart.js CDN যোগ করতে হবে
- বড় dataset-এ Firestore query slow → aggregation use করুন

---

## 📱 Phase 5: Customer UX — (~৫-৬ ঘণ্টা)

### Features
1. **PWA Setup** — manifest.json + service worker
2. **Push Notification** — Firebase Cloud Messaging
3. **Dark Mode** — CSS variables
4. **Reviews with Images** — Cloudinary upload
5. **Pre-order System** — out of stock-এও order
6. **Product Variants** — color, size
7. **Product Comparison** — side-by-side

### ⚠️ সতর্কতা
- Dark mode-এ সব hardcoded color পরিবর্তন করতে হবে (সবচেয়ে কষ্টের কাজ!)
- PWA install prompt সব browser-এ কাজ করে না

---

## 🎯 Phase 6: Marketing — (~৫-৬ ঘণ্টা)

### Features
1. **Facebook Pixel** (Phase 2-এ করা থাকবে)
2. **Abandoned Cart Recovery** — email automation
3. **Refer & Earn** — referral code system
4. **Loyalty Points** — point earn/redeem
5. **Wishlist Cloud Sync** — logged-in user
6. **Spin Wheel** — discount game
7. **Product Bundle** — multi-product discount

### ⚠️ সতর্কতা
- Referral code uniqueness (Firestore transaction)
- Loyalty points calculation server-side হবে

---

# 🚨 PART 6: ভুল এড়ানোর Rules

## General Rules
1. **কখনো `css/common.css` direct edit করবেন না** — সব page affect করবে
2. **কখনো `js/firebase.js`-এ config ছাড়া কিছু রাখবেন না**
3. **সব number-এ `font-family: Inter` force করবেন** — Playfair নয়
4. **সব user input-এ `escapeHtml()`** — XSS prevention
5. **Firestore-এ `serverTimestamp()`** — `new Date()` নয়
6. **Price calculation server-side transaction-এ** — client বিশ্বাস করবেন না
7. **File paths relative রাখবেন** — `./common.js`, `css/index.css`
8. **`type="module"` script tag always** — ES6 import-এর জন্য
9. **Import order:** Firebase → common → districts → other
10. **প্রতিটা file শেষে `console.log('✅ ...')`** — debug সহজ

## File Edit করার আগে
1. GitHub commit history check করুন — rollback সহজ
2. একবারে একটাই file edit
3. Local test না করে push না (Vercel preview deploy আগে)
4. `console.log()` debug শেষে সরান

## Firestore-এ যা করবেন না
- ❌ Rules-এ `allow read, write: if true`
- ❌ Admin UID manual সরানো
- ❌ Test mode production-এ
- ❌ API keys GitHub-এ commit

## Browser Cache
- **Test-এর আগে hard refresh** (`Ctrl+Shift+R`)
- **Vercel deploy-এর পর ২ মিনিট wait**
- **Mobile-এ cache clear** — Settings → Site data
- **URL-এ `?v=2` যোগ করুন** — cache bypass

---

# 🔐 PART 7: Security Checklist

## ✅ যা আছে
- [x] Firestore rules deployed
- [x] Admin UID verify on login
- [x] Email/Password Auth
- [x] Google Sign-in
- [x] Server-side pricing (transaction)
- [x] XSS protection (`escapeHtml`)
- [x] Back button trap (checkout modal)
- [x] IP flagging (not blocking)
- [x] Cart tampering prevention
- [x] Vercel domain authorized
- [x] HTTPS (Vercel auto)
- [x] Coupon double-validation
- [x] Wishlist auto-cleanup (invalid IDs)
- [x] Phone-based login safe (Firestore lookup)

## ⚠️ যা যোগ করা উচিত (Phase 2-3-এ)
- [ ] Rate limiting (Vercel serverless)
- [ ] reCAPTCHA on register form
- [ ] Email verification on register
- [ ] Admin 2FA (optional)
- [ ] API key rotation policy
- [ ] Audit log for admin actions
- [ ] Firestore export backup (weekly)
- [ ] Order duplicate prevention (server-side)

## 🚫 যা কখনো করবেন না
- `allow read, write: if true` rules-এ
- Admin credentials hardcode
- User input সরাসরি HTML-এ
- `eval()` ব্যবহার
- API keys client-side
- Password plain text Firestore-এ

---

# 🎨 PART 8: UI/UX Patterns

## Page Structure (Standard)
```html
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>[Page] - Heartix</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
    <script>tailwind.config = { theme: { extend: {
        colors: { navy: { DEFAULT: '#0A1628' }, gold: { DEFAULT: '#D4A84B' }, cream: '#FBF8F3' },
        fontFamily: { 'display': ['Playfair Display', 'serif'] }
    }}}</script>
    <link rel="stylesheet" href="css/common.css">
    <link rel="stylesheet" href="css/[page].css">
</head>
<body>
    <div id="toast-container"></div>
    <!-- header, main, footer -->
    <script type="module" src="js/[page].js"></script>
</body>
</html>
```

## Common CSS Classes
- `.navy-gradient` — ডার্ক নেভি background
- `.gold-gradient` — গোল্ড gradient
- `.gold-text`, `.navy-text` — text colors
- `.glass` — frosted glass (header)
- `.premium-shadow` — soft shadow
- `.premium-shadow-lg` — larger shadow
- `.hide-scrollbar` — scrollbar লুকানো
- `.shimmer` — skeleton loading
- `.animate-slide-up`, `.animate-fade-in`

## Common IDs (সব page-এ)
- `#toast-container` — সব page-এ
- `#cart-count-header` — header cart badge
- `#wishlist-count-header` — header wishlist badge
- `#cart-count-bottom`, `#cart-count-sidebar` — index.html only

## Toast Usage
```js
import { showToast } from './common.js';
showToast('Message', 'success');  // green
showToast('Message', 'error');    // red
showToast('Message', 'warn');     // orange
showToast('Message', 'info');     // navy
```

## LocalStorage Keys
- `heartix_cart` — cart items array
- `heartix_wishlist` — wishlist IDs array
- `heartix_recent` — recently viewed IDs
- `heartix_coupon` — applied coupon { code, type, value, minOrder }
- `heartix_remember` — remembered login identifier

## Status Values
- **Order:** `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`
- **Payment:** `full-cod`, `delivery-advance`, `full-online`
- **Coupon:** `percentage`, `fixed`
- **Category icon:** Emoji OR image URL (http startsWith check)

---

# 📋 PART 9: Quick Reference

## Global Functions (window.xxx)
| Function | JS file |
|----------|---------|
| `login`, `logout` | admin.js, messages.js |
| `loginUser`, `registerUser`, `googleSignIn`, `forgotPassword`, `logoutUser` | account.js |
| `openAddressEdit`, `cancelAddressEdit`, `saveProfile` | account.js |
| `loadMyOrders` | account.js |
| `addToCart`, `removeFromCart`, `toggleWishlist` | index.js, product.js, wishlist.js |
| `filterByCategory`, `toggleSearch`, `closeSearch`, `searchProducts`, `selectSuggestion` | index.js |
| `goSlide`, `openSidebar`, `closeSidebar`, `loadMoreProducts` | index.js |
| `applyCoupon`, `removeCoupon`, `proceedToCheckout`, `changeQty`, `removeItem`, `clearCart`, `moveToWishlist` | cart.js |
| `placeOrder`, `showRepeatModal`, `showWarningModal`, `showHistoryModal`, `continueFromRepeat`, `cancelFromWarning`, `continueFromWarning` | checkout.js |
| `trackOrder`, `copyOrderNumber` | track-order.js |
| `submitContactForm` | contact.js |
| `showTab`, `openMoreMenu`, `closeMoreMenu` | admin.js |
| `openAddModal`, `editProduct`, `saveProduct`, `deleteProduct`, `renderAdminProducts` | admin.js |
| `openOrderEdit`, `saveOrderEdit`, `openStatusPicker`, `confirmStatusChange`, `filterOrders`, `exportOrdersCSV` | admin.js |
| `openCategoryModal`, `saveCategory`, `editCategory`, `deleteCategory`, `openInlineCategoryModal`, `saveInlineCategory` | admin.js |
| `openCouponModal`, `saveCoupon`, `editCoupon`, `deleteCoupon`, `updateCouponValueLabel` | admin.js |
| `openHeroModal`, `saveHeroBanner`, `editHeroBanner`, `deleteHeroBanner`, `clearHeroImage` | admin.js |
| `openSectionModal`, `saveSection`, `editSection`, `deleteSection` | admin.js |
| `openBannerModal`, `saveBanner`, `editBanner`, `deleteBanner` | admin.js |
| `openTestimonialModal`, `saveTestimonial`, `editTestimonial`, `deleteTestimonial` | admin.js |
| `deleteReview` | admin.js |
| `saveSettings` | admin.js |
| `openCategoryReorder`, `closeCategoryReorder`, `moveCategoryUp`, `moveCategoryDown` | admin-reorder.js |
| `openSectionReorder`, `closeSectionReorder`, `moveSectionUp`, `moveSectionDown` | admin-reorder.js |
| `openProductReorder`, `closeProductReorder`, `changeReorderCategory`, `moveProductUp`, `moveProductDown` | admin-reorder.js |
| `loadMessages`, `filterMessages`, `openDetail`, `closeDetail`, `deleteCurrentMessage` | messages.js |

## Key IDs (form fields)
- **Checkout:** `#customer-name`, `#customer-phone`, `#customer-email`, `#customer-address`, `#customer-district`, `#customer-thana`
- **Account Login:** `#login-email`, `#login-password`, `#remember-me`
- **Account Register:** `#reg-name`, `#reg-phone`, `#reg-email`, `#reg-password`, `#reg-confirm`
- **Account Profile:** `#profile-name`, `#profile-phone`, `#profile-address`, `#profile-district`, `#profile-thana`
- **Product modal:** `#p-name`, `#p-price`, `#p-oldprice`, `#p-stock`, `#p-brand`, `#p-description`, `#p-featured`, `#p-pinned`, `#p-categories-list`, `#p-image-file`
- **Track:** `#order-input`, `#res-order-num`
- **Order Success:** `#order-number`, `#track-btn`

---

# 🚀 PART 10: পরের সেশনের Action Plan

## Immediate Next (Priority Order)

### Step 1: Test Current State (~৩০ মিনিট)
**কেন:** Phase 0 + 1 deploy হয়েছে — সব verify করুন

**Checklist:**
- [ ] Home → সব section load হচ্ছে (hero, categories, products, featured)
- [ ] Product → add to cart → wishlist → related products
- [ ] Cart → coupon apply → qty → remove → save for later
- [ ] Checkout → logged-in auto-fill → repeat popup → place order
- [ ] Order Success → track → WhatsApp
- [ ] Account → register → login → Google → profile edit → address save
- [ ] Wishlist → cart integration
- [ ] Contact → messages (admin-এ check)
- [ ] Admin → Products CRUD → Featured/Pinned → Reorder
- [ ] Admin → Orders compact cards → Edit → Status change
- [ ] Admin → Categories reorder → Sections reorder
- [ ] Admin → Coupons → Content → Settings
- [ ] Mobile + Desktop দুই view

### Step 2: Phase 2 — Plug & Play Settings (~৪-৫ ঘণ্টা)
**কেন আগে:** Admin-এর daily কাজ সহজ হবে

**Order:**
1. Settings structure + toggle UI
2. Google Analytics (সহজest)
3. Facebook Pixel
4. SMS (BulkSMSBD) — serverless function
5. Email (SendGrid) — serverless function
6. WhatsApp API
7. bKash Payment
8. Nagad Payment

**⚠️ Pre-work:**
- Vercel-এ Environment Variables সেট করুন (API keys)
- `/api/` folder তৈরি করুন
- Serverless functions-এ `verifyAdmin(uid)` check

### Step 3: Phase 3 — Admin Tools (~৩-৪ ঘণ্টা)

### Step 4: Phase 4-6 — Analytics + UX + Marketing

---

## যা আগে করলে ভালো (Pre-work)
1. **Firestore backup নিন** — Console → Firestore → Export → GCS Bucket
2. **Vercel GitHub integration verify** — push করলেই auto-deploy
3. **Cloudinary limit check** — ২৫ credit/মাস
4. **Firebase billing** — Spark plan limit-এ আছি কিনা
5. **Domain কিনুন** — `heartix.com` (~১২০০ টাকা/বছর) → professional email

---

## যা ভুল হলে করবেন (Recovery)

| সমস্যা | সমাধান |
|--------|--------|
| White screen | Console error → JS import চেক |
| 404 on css/js | File path check |
| Cart badge ভুল | `updateCartBadges()` কল হচ্ছে কিনা |
| Firestore permission denied | Rules check |
| Order place fail | Transaction error — stock/permission |
| Google login fail | Firebase authorized domain |
| Index error | Error link → Create Index |
| Deploy fail | Vercel Deployments → Logs |
| Firebase quota exceeded | ২৪ ঘণ্টা wait বা billing upgrade |
| Font wrong | `css/[page].css`-এ `font-family: Inter !important` |
| Google logo broken | সঠিক SVG (4 paths, viewBox 0 0 24 24) |
| Modal keyboard ঢেকে | `max-height: calc(100vh - 2rem)` + `overflow-y-auto` |
| Back button bypass | `history.pushState({trap:true})` + `popstate` listener |
| Reorder কাজ করে না | Firestore save check + reload |

---

# 📊 PART 11: Statistics

## Phase Progress
| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0 — Modular Structure | ✅ সম্পূর্ণ | 100% |
| Phase 1 — Reorder System | ✅ সম্পূর্ণ | 100% |
| Phase 2 — Plug & Play Settings | ⏳ পরবর্তী | 0% |
| Phase 3 — Admin Tools | ⏳ | 0% |
| Phase 4 — Analytics | ⏳ | 0% |
| Phase 5 — Customer UX | ⏳ | 0% |
| Phase 6 — Marketing | ⏳ | 0% |

**Overall: ~30% সম্পূর্ণ**

## File Counts
| Type | Count |
|------|-------|
| HTML | 18 (2 TODO) |
| CSS | 12 |
| JS | 15 |
| Markdown | 2 |
| Image | 1 |
| **Total** | **48** |

## Lines of Code (approx)
- HTML: ~5,000
- CSS: ~2,000
- JS: ~5,000
- **Total:** ~12,000 lines

## Cost Analysis (Monthly)
| Service | Free Tier | Current Usage |
|---------|-----------|---------------|
| Firebase Firestore reads | 50K/day | <2K/day |
| Firebase Firestore writes | 20K/day | <200/day |
| Firebase Auth | Unlimited | <20 users |
| Cloudinary | 25 credits/month | <10 credits |
| Vercel bandwidth | 100 GB/month | <2 GB |
| **Total cost** | **৳0/month** | Well within limits |

---

# 🎓 PART 12: অন্যান্য AI-এর জন্য নির্দেশনা

## এই Project-এ কাজ করার নিয়ম
1. **সবসময় এই guide.md আগে পড়ুন** — যেকোনো কাজের আগে
2. **File edit-এর আগে commit history check** করুন
3. **একবারে একটাই file edit** করুন
4. **User-কে step-by-step নির্দেশনা দিন** (মোবাইলে কাজ করে)
5. **পূর্ণ file content দিন** — শুধু patch নয় (User মোবাইলে খুঁজে পায় না)
6. **User confused হলে জিজ্ঞেস করুন** — "কোন file-এ কাজ করছেন?"
7. **Deploy-এর পর ২ মিনিট wait** বলুন
8. **Cache bypass** বলুন (`?v=2`)

## যদি User File Confused হয়
- File name ভুলে গেলে → **title/content দেখে identify**
- HTML-এর শেষে `<script src="js/X.js">` → **X.html-এর জন্য**
- CSS-এ class name → **page identify**
- JS-এ unique function → **page identify**
- User-কে বলুন: "এই file-টা যদি XX নাম দিয়ে সেভ করেন, ঠিক হবে"

## Critical Rules
- **কখনো `common.css` delete করবেন না**
- **কখনো `firebase.js` edit করবেন না** (শুধু config)
- **সব file-এ `import` verify** — relative paths (`./firebase.js`)
- **`escapeHtml()` ছাড়া user data render করবেন না**
- **Firestore-এ `setDoc` vs `updateDoc` vs `addDoc` সঠিক**:
  - `addDoc` — new doc (auto ID)
  - `setDoc(doc, data, {merge:true})` — create or update
  - `updateDoc(doc, data)` — update existing
- **Transaction-এ read আগে, write পরে** — সব read শেষে write
- **Server Timestamp ব্যবহার** করুন — `new Date()` নয়

## Contact Points
- Firebase Project: `heartix`
- Firebase Auth domain: `heartix.firebaseapp.com`
- Cloudinary cloud: `ju2w6e9r`
- Support email: `twhob71122@gmail.com`
- Admin UIDs: `settings/admins.uids[]` (Firestore)

## Regular Expression Patterns
- Phone: `/^01[3-9]\d{8}$/` (Bangladesh)
- Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Order Number: `HX` + YYMMDD + 6 alphanumeric

## Bangla Text Notes
- সব error/UI message বাংলায়
- কিছু label English (like "Login", "Featured")
- `&lt;br&gt;` শুধু hero title-এ allowed (safeHeroTitle function handle করে)

---

# 📝 PART 13: Changelog

## v3.0 (15 Oct 2025) — Phase 1 Complete
- ✅ Category Reorder (modal + ↑↓)
- ✅ Section Reorder (modal + ↑↓)
- ✅ Product Reorder (category dropdown + ↑↓)
- ✅ Featured Selection (product modal toggle)
- ✅ Pin to Top (product modal toggle)
- ✅ Home-এ Featured Products section
- ✅ Home sort: pinned → sortOrder → name
- ✅ Compact collapsible order cards (admin)
- ✅ Playfair font fix (numbers → Inter)
- ✅ Google logo fixed (correct SVG)
- ✅ Back button trap in warning modal
- ✅ Apply button overflow fixed
- ✅ Wishlist auto-cleanup

## v2.0 (14 Oct 2025) — Phase 0 Complete
- ✅ Modular file structure (17 HTML, 12 CSS, 14 JS)
- ✅ Multi-category products
- ✅ Repeat customer detection
- ✅ IP flagging
- ✅ Google Sign-in
- ✅ Phone-based login
- ✅ Account address save
- ✅ Checkout auto-fill
- ✅ Atomic order transaction

## v1.0 (Initial) — Early development
- Basic e-commerce
- Single-category products
- Email/Password auth
- COD payment

---

# 🎯 FINAL WORD

**এই guide.md যেকোনো AI-এর জন্য complete reference।**
- File edit করার আগে এই guide পড়ুন
- নতুন feature যোগ করলে এই file update করুন
- Commit history-তে রেফারেন্স রাখুন

**Project Status:** ~30% সম্পূর্ণ
**Phase 0 + Phase 1 শেষ** — foundation + reorder system complete
**Next Session:** Phase 2 — Plug & Play Settings

**Priority:** Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

---

**Last Updated:** 15 October 2025
**Total Sections:** 13
**Purpose:** Single source of truth for entire project
**Maintainer:** Developer + Claude AI