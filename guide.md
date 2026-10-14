# 📖 Heartix — Master Guide v4.0

**Version:** 4.0
**Last Updated:** 15 October 2025, 5:00 AM
**Live Site:** heartix.vercel.app
**Status:** Phase 0 ✅ + Phase 1 ✅ | Phase 2 পরবর্তী
**Maintainer:** Developer + Claude AI
**Purpose:** Single source of truth — যেকোনো AI সাথে সাথে কাজ বুঝতে পারবে

---

# 📋 PART 1: এই Guide কীভাবে পড়বেন

## এই Guide পড়ার Order
1. **Part 2** — Project পরিচিতি (কী সাইট, tech stack)
2. **Part 3** — বর্তমান অবস্থা (কী হয়েছে, কী বাকি)
3. **Part 4** — File Structure + Identification (কোন file কোথায়)
4. **Part 5** — Firebase Structure
5. **Part 6** — বাকি কাজের Plan
6. **Part 7-9** — Rules, Security, Recovery
7. **Part 10** — Quick Reference

## যদি আপনি নতুন AI হন
- **File এলোমেলো হলে** → Part 4-এর "File Identification" দেখুন
- **User কিছু চাইলে** → Part 6 দেখে priority বুঝুন
- **Error হলে** → Part 9 দেখুন
- **কোনো function খুঁজলে** → Part 10 দেখুন

---

# 🎯 PART 2: Project পরিচিতি

## Heartix কী?
বাংলাদেশের প্রিমিয়াম স্মার্ট অ্যাপ্লায়েন্স ই-কমার্স সাইট।

## Tech Stack (সব ফ্রি)
| Component | Tech |
|-----------|------|
| Frontend | HTML5 + Tailwind CSS (CDN) + Vanilla JS (ES Modules) |
| Backend | Firebase Firestore + Auth |
| Images | Cloudinary (unsigned upload) |
| Hosting | Vercel |
| Icons | Font Awesome 6 (CDN) |
| Fonts | Inter + Playfair Display (Google) |

## Colors
- Navy: `#0A1628` (primary)
- Gold: `#D4A84B` (accent)
- Cream: `#FBF8F3` (background)
- Green: `#16a34a` (success)
- Red: `#dc2626` (danger)

## Font Rules (গুরুত্বপূর্ণ!)
- **Body/UI:** Inter
- **Headings:** Playfair Display (`font-display` class)
- **Numbers (Price/Total):** **Inter Bold** — **Playfair NEVER!**
  - এই rule `css/cart.css`, `css/checkout.css`, `css/account.css`-এ force করা আছে `!important` দিয়ে

## Firebase Config
- Project ID: `heartix`
- Auth domain: `heartix.firebaseapp.com`
- Support email: `twhob71122@gmail.com`
- Cloudinary cloud: `ju2w6e9r`
- Upload preset: `heartix_unsigned`

---

# 📊 PART 3: বর্তমান অবস্থা

## ✅ সম্পূর্ণ ফেজ

### Phase 0: Modular File Structure — সম্পূর্ণ ✅
সব page-এর inline CSS/JS সরিয়ে আলাদা ফাইলে নেওয়া। **৪৮টা ফাইল** (১৮ HTML, ১২ CSS, ১৬ JS, 2 MD)।

### Phase 1: Reorder System — সম্পূর্ণ ✅
- Category Reorder (↑↓ modal)
- Section Reorder (↑↓ modal)
- Product Reorder within category
- Featured Selection (product modal-এ toggle)
- Pin to Top (product modal-এ toggle)

---

## 🆕 নতুন Features (সবচেয়ে সাম্প্রতিক)

### ১. Multi-Category Products
- একটি প্রোডাক্টে একাধিক category
- `categories: ["TV", "Gadget"]` array
- Backward compatible: পুরনো `category: "TV"` string-ও কাজ করে
- Admin checkbox list, Home filter multi-cat

### ২. Inline Category Creation
Product modal-এ **"+ New"** → popup → save → auto-checked

### ৩. Repeat Customer System
- ২য় order-এ profile থেকে auto-fill popup
- Popup: last order + tracking + history link
- Admin-এ **"Repeat (N)"** badge

### ৪. IP Tracking (Flag only)
- `customer.ipAddress` save
- Same IP + different phone → `flagged: true`
- Admin-এ **"Same IP"** (কমলা) badge

### ৫. ১০ মিনিট Warning + Back Trap
- ১০ মিনিটে ২য় order → popup (block না)
- **Back button trap** — modal খোলা থাকলে back কাজ করে না

### ৬. Account Address Save
- Name, Phone, Address, District, Thana
- View/Edit toggle (professional card design)

### ৭. Checkout Auto-fill
- Logged-in user checkout-এ গেলে profile থেকে auto-fill

### ৮. Google Sign-in
- Firebase Console-এ enabled
- ৪-রঙের Google logo

### ৯. Remember Me + Password Eye
- localStorage-এ identifier
- Password দেখার toggle

### ১০. Phone-based Login
- Email বা Phone দুটোই
- Phone → Firestore lookup → email

### ১১. Wishlist Auto-Cleanup
- Delete হওয়া product auto-remove

### ১২. District/Thana Optional
- Checkout-এ mandatory না

### ১৩. Atomic Order Transaction
- Server-side price validation
- Stock check + deduct এক transaction-এ

### ১৪. Compact Collapsible Order Cards
- `<details>`/`<summary>` দিয়ে
- Compact view → expanded on tap

### ১৫. Custom Delete Modal + Smart Stock Restore
- Navy/Red branded design
- Status অনুযায়ী:
  - `pending`/`confirmed`/`shipped` → **Stock restore** ✅
  - `delivered`/`cancelled` → **No restore** ❌

### ১৬. Editable Order Edit Panel
- Customer info editable (Name, Phone, Address, District, Thana)
- Discount/Delivery/Advance **real-time total update**
- Original values দেখা যায় ("Orig: ৳X")
- Collapsible sections (Compact design)
- Sticky footer summary
- Back button trap

### ১৭. Featured + Pin to Top
- `featured: bool` → Home-এ Featured section
- `pinned: bool` → Top Selling-এ সবার আগে
- Sort order: `pinned → sortOrder → name`

---

## 🐛 Bug Fixes (Phase 0-তে)
1-12 (আগের guide থেকে)
13. Google logo broken SVG (fixed)
14. Playfair font on numbers → Inter force
15. Apply button overflow in cart
16. Cart badge wrong count (wishlist cleanup)
17. Delete stock restore issue → Smart restore
18. Order edit real-time total update
19. Back button → Messages navigation trap

---

# 📁 PART 4: সম্পূর্ণ File Structure

## Root HTML Files

| File | Purpose | CSS | JS |
|------|---------|-----|-----|
| `index.html` | Home — hero, categories, products, featured | common.css, index.css | index.js |
| `product.html` | Product detail — gallery, reviews, related | common.css, product.css | product.js |
| `cart.html` | Cart — items, coupon, summary | common.css, cart.css | cart.js |
| `checkout.html` | Checkout — address, payment, order | common.css, checkout.css | checkout.js |
| `account.html` | Auth + Profile + Orders | common.css, account.css | account.js |
| `wishlist.html` | Saved products | common.css, wishlist.css | wishlist.js |
| `contact.html` | Contact form | common.css, contact.css | contact.js |
| `order-success.html` | Post-order | common.css, order-success.css | order-success.js |
| `track-order.html` | Order tracking | common.css, track-order.css | track-order.js |
| `admin.html` | Admin panel (8 tabs) | common.css, admin.css | admin-reorder.js + admin.js |
| `messages.html` | Admin inbox | common.css, messages.css | messages.js |
| `about.html` | Static | common.css | inline |
| `faq.html` | Static | common.css | inline |
| `terms.html` | Static | common.css | inline |
| `privacy.html` | Static | common.css | inline |
| `return-policy.html` | Static | common.css | inline |
| `landing.html` | ⏳ TODO | — | — |
| `moderator.html` | ⏳ TODO | — | — |

## CSS Files (`css/`)

| File | Used by | Unique Classes |
|------|---------|----------------|
| `common.css` | **সব page** | `.navy-gradient`, `.gold-gradient`, `.glass`, `.premium-shadow`, `.toast-bar`, `.shimmer`, `#toast-container` |
| `index.css` | index.html | `#search-bar-wrapper`, `.slider-viewport`, `.category-card`, `.product-card`, `#floating-cart`, `.wishlist-btn`, `#search-suggestions`, `.qty-control`, `.add-cart-btn` |
| `product.css` | product.html | `.thumb-item`, `.wishlist-btn-lg`, `.action-btn`, `.prod-img` |
| `cart.css` | cart.html | `.price-per-item`, `.price-line-total`, `.coupon-input` + number font forces |
| `checkout.css` | checkout.html | `.payment-option`, `.check-circle`, `.field-error` |
| `account.css` | account.html | `.tab-btn`, `.input-wrap`, `.input-icon`, `.eye-btn`, `.or-divider`, `.social-btn`, `.info-view-item`, `.info-edit-input` |
| `wishlist.css` | wishlist.html | `.add-cart-btn`, `.qty-control` |
| `contact.css` | contact.html | `.contact-item` |
| `order-success.css` | order-success.html | `.pop`, `.fade-up`, `.delay-1/2/3/4` |
| `track-order.css` | track-order.html | `.timeline-step`, `.timeline-step.done`, `.timeline-step.active`, `.dot` |
| `admin.css` | admin.html | `.modal-bg`, `.img-thumb`, `.cat-preview`, `.nav-item`, `.order-status`, `.cat-card`, `.order-item-row`, `.coupon-card`, `.btn-primary/gold/danger/success`, `.toast` variants |
| `messages.css` | messages.html | `.msg-card`, `.unread-dot` |

## JS Files (`js/`)

| File | Used by | Unique Functions |
|------|---------|------------------|
| `firebase.js` | সব JS (import) | exports: `db`, `auth` |
| `common.js` | সব JS (import) | `showToast`, `escapeHtml`, `formatPrice`, `getCart`, `saveCart`, `getWishlist`, `saveWishlist`, `updateCartBadges`, `updateWishlistBadges`, `validatePhone`, `generateOrderNumber` |
| `districts.js` | checkout.js, account.js, admin.js | exports: `DISTRICTS` (64) |
| `index.js` | index.html | `renderHeroBanners`, `renderCategories`, `renderProducts`, `renderDynamicContent`, `renderRecentlyViewed`, `filterByCategory`, `toggleSearch`, `addToCart`, `toggleWishlist`, `goSlide` |
| `product.js` | product.html | `renderProduct`, `renderReviews`, `submitReview`, `renderRelated`, `setMainImage`, `nextImage`, `prevImage`, `buyNow`, `shareProduct` |
| `cart.js` | cart.html | `renderCart`, `applyCoupon`, `removeCoupon`, `changeQty`, `removeItem`, `clearCart`, `moveToWishlist`, `proceedToCheckout` |
| `checkout.js` | checkout.html | `placeOrder`, `showRepeatModal`, `showWarningModal`, `showHistoryModal`, `cancelFromWarning`, `continueFromWarning`, `autoFillFromOrder`, `handlePopState` |
| `account.js` | account.html | `loginUser`, `registerUser`, `googleSignIn`, `forgotPassword`, `logoutUser`, `saveProfile`, `loadMyOrders`, `openAddressEdit`, `cancelAddressEdit`, `togglePassword` |
| `wishlist.js` | wishlist.html | `renderWishlist`, `cleanupInvalidWishlist`, `addToCart`, `removeFromWishlist` |
| `contact.js` | contact.html | `submitContactForm`, `loadSettings`, `applySettings` |
| `order-success.js` | order-success.html | `copyOrderNumber`, `loadSettings` |
| `track-order.js` | track-order.html | `trackOrder`, `renderOrder`, `copyOrderNumber` |
| `admin.js` | admin.html | `renderAdminOrders`, `renderAdminProducts`, `openAddModal`, `saveProduct`, `openOrderEdit`, `saveOrderEdit`, `confirmDeleteOrder`, `executeDelete`, `openCategoryModal`, `saveCategory`, `openInlineCategoryModal`, `openCouponModal`, `saveCoupon`, `openHeroModal`, `openSectionModal`, `openBannerModal`, `openTestimonialModal`, `saveSettings`, `exportOrdersCSV`, `filterOrders`, `openStatusPicker`, `selectStatus`, `confirmStatusChange`, `recalcOrderEdit`, `validatePhone`, `populateOeDistrictDropdown` |
| `admin-reorder.js` | admin.html | `openCategoryReorder`, `moveCategoryUp`, `moveCategoryDown`, `openSectionReorder`, `moveSectionUp`, `moveSectionDown`, `openProductReorder`, `changeReorderCategory`, `moveProductUp`, `moveProductDown`, `saveProductSortOrder` |
| `messages.js` | messages.html | `loadMessages`, `filterMessages`, `openDetail`, `closeDetail`, `deleteCurrentMessage` |

## File Identification Guide ⭐ (সবচেয়ে গুরুত্বপূর্ণ!)

### HTML চেনার সহজ নিয়ম

**১. Title tag দেখুন:**
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

**২. শেষের `<script>` দেখুন:**
- `<script type="module" src="js/admin-reorder.js">` + `js/admin.js` → **admin.html**
- `<script type="module" src="js/index.js">` → **index.html**
- `<script type="module" src="js/checkout.js">` → **checkout.html**
- ইত্যাদি

**৩. Unique HTML element দেখুন:**
- `id="order-number"` → order-success.html
- `id="timeline"` → track-order.html
- `id="category-reorder-modal"` → admin.html
- `id="my-orders-list"` → account.html
- `id="cart-items"` → cart.html
- `id="search-bar-wrapper"` → index.html

### CSS চেনার সহজ নিয়ম

**Unique class/id:**
| Class/ID | CSS file |
|----------|----------|
| `#search-bar-wrapper`, `.slider-viewport` | index.css |
| `.wishlist-btn-lg`, `.thumb-item` | product.css |
| `.price-per-item`, `.price-line-total` | cart.css |
| `.payment-option`, `.check-circle` | checkout.css |
| `.info-view-item`, `.input-wrap` | account.css |
| `.timeline-step` | track-order.css |
| `.nav-item`, `.modal-bg`, `.cat-preview` | admin.css |
| `.msg-card`, `.unread-dot` | messages.css |
| `.contact-item` | contact.css |
| `.pop`, `.fade-up` | order-success.css |
| `.navy-gradient`, `.gold-gradient`, `.toast-bar` | **common.css** |

### JS চেনার সহজ নিয়ম

**First import দেখুন:**
- `import { db, auth } from './firebase.js'` → Firebase use করে
- `import { DISTRICTS } from './districts.js'` → district list দরকার
- `import { getCart, saveCart } from './common.js'` → common helpers

**Unique function নাম:**
| Function | JS file |
|----------|---------|
| `renderHeroBanners` + `renderDynamicContent` | index.js |
| `renderProduct` + `submitReview` | product.js |
| `applyCoupon` + `proceedToCheckout` | cart.js |
| `placeOrder` + `showWarningModal` | checkout.js |
| `loginUser` + `googleSignIn` + `openAddressEdit` | account.js |
| `trackOrder` + `renderOrder` | track-order.js |
| `copyOrderNumber` | order-success.js |
| `openCategoryReorder` + `moveCategoryUp` | admin-reorder.js |
| `renderAdminOrders` + `executeDelete` | admin.js |
| `loadMessages` + `openDetail` | messages.js |
| `submitContactForm` | contact.js |
| `cleanupInvalidWishlist` | wishlist.js |

### User Confused হলে কী জিজ্ঞেস করবেন
1. "File-এর প্রথম লাইন কী?" (title/import)
2. "File-এর শেষে কোন script tag আছে?"
3. "কোনো unique button/function-এর নাম দেখতে পাচ্ছেন?"
4. "File-টা কী কাজ করে বলে মনে হচ্ছে?"

---

# 🗄️ PART 5: Firebase Structure

## Collections

### `products`
```js
{
  id, name, price, oldPrice,
  category: string,          // legacy
  categories: string[],      // new multi
  stock, brand, description,
  image, images: string[],
  sortOrder: number,         // reorder
  featured: boolean,         // home-এ দেখাবে
  pinned: boolean,           // top-এ দেখাবে
  createdAt
}
```

### `orders`
```js
{
  id, orderNumber,           // "HX261015ABCD12"
  customer: {
    name, phone, email, address, district, thana,
    ipAddress, isRepeat, orderCount,
    previousOrderNumbers, flagged, flagReason
  },
  items: [{ id, name, price, quantity, image }],
  subtotal, discount, couponCode,
  deliveryCharge, total,
  paymentMethod,             // 'full-cod'|'delivery-advance'|'full-online'
  advancePaid, dueAmount,
  status,                    // 'pending'|'confirmed'|'shipped'|'delivered'|'cancelled'
  stockDeducted, adminNote,
  createdAt
}
```

### `coupons`
```js
{ code (docID), description, type, value, minOrder, maxUses, usedCount, expiry, active, createdAt, updatedAt }
```

### `customers`
```js
{ uid, name, phone, email, address, district, thana, photoURL, provider, createdAt, updatedAt }
```

### `messages`
```js
{ name, contact, subject, message, read, createdAt }
```

### `reviews`
```js
{ productId, name, rating, text, createdAt }
```

### `settings/main`
```js
{
  deliveryCharge, freeDeliveryAbove,
  contactAddress, contactPhone, contactEmail, whatsapp,
  bkashNumber, nagadNumber, facebook, instagram,
  categories: [{ key, label, icon }],
  customSections: [{ title, categoryKey }],
  middleBanners: [{ image, link }],
  testimonials: [{ name, role, text, rating, image }],
  heroBanners: [{ badge, title, subtitle, bg, link, image }]
}
```

### `settings/admins`
```js
{ uids: string[] }
```

## Firestore Indexes (Required)
- `orders`: `orderNumber` ASC
- `orders`: `customer.phone` ASC + `createdAt` DESC
- `orders`: `customer.ipAddress` ASC + `createdAt` DESC
- `orders`: `createdAt` DESC
- `reviews`: `createdAt` DESC

## Rules Summary
- Products: public read, admin write
- Reviews: public read, anyone create, admin delete
- Orders: public read, anyone create, admin update/delete
- Coupons: public read, admin write
- Messages: anyone create, admin read/update/delete
- Customers: owner read/write, admin read
- Settings: public read, admin write

---

# ⬜ PART 6: বাকি কাজ (Priority Order)

## 🥇 Phase 2: Plug & Play Settings — পরবর্তী ⏭
**সময়:** ~৪-৫ ঘণ্টা
**কেন আগে:** Admin চাইবে সহজে on/off করতে

### Integration List (সব OFF default)
1. **Google Analytics** — সবচেয়ে সহজ
2. **Facebook Pixel**
3. **SMS (BulkSMSBD)** — Vercel serverless
4. **Email (SendGrid)** — Vercel serverless
5. **WhatsApp API**
6. **bKash Payment Gateway**
7. **Nagad Payment Gateway**

### Pre-work
- Vercel Environment Variables (API keys)
- `/api/` folder (serverless functions)
- `verifyAdmin(uid)` check in serverless

### Files to Create
- `js/integrations/google-analytics.js`
- `js/integrations/facebook-pixel.js`
- `js/integrations/sms.js`
- `js/integrations/email.js`
- `js/integrations/whatsapp.js`
- `js/integrations/bkash.js`
- `js/integrations/nagad.js`
- `/api/send-sms.js`, `/api/send-email.js`, etc.

## 🥈 Phase 3: Admin Tools — ~৩-৪ ঘণ্টা
1. Bulk CSV Upload (PapaParse)
2. Moderator Tab
3. Landing Pages Tab
4. Landing Stats
5. Bulk Order Update
6. Inventory Alert (stock < 5)

### Files to Create
- `moderator.html` + `js/moderator.js`
- `landing.html` + `js/landing.js`
- `js/csv-parser.js`

## 🥉 Phase 4: Analytics — ~৪-৫ ঘণ্টা
1. Sales Dashboard (Chart.js)
2. Customer Segmentation
3. Profit Calculator
4. Return Rate Tracking
5. Top Products Report
6. Monthly Report

## 📱 Phase 5: Customer UX — ~৫-৬ ঘণ্টা
1. PWA Setup
2. Push Notification
3. Dark Mode
4. Reviews with Images
5. Pre-order System
6. Product Variants
7. Product Comparison

## 🎯 Phase 6: Marketing — ~৫-৬ ঘণ্টা
1. Abandoned Cart Recovery
2. Refer & Earn
3. Loyalty Points
4. Wishlist Cloud Sync
5. Spin Wheel
6. Product Bundle

---

## Priority: কেন এই order?
1. **Phase 2** → Admin-এর daily কাজ সহজ, business-critical
2. **Phase 3** → Bulk operations, moderator
3. **Phase 4** → Data-driven decision
4. **Phase 5** → UX improve
5. **Phase 6** → Marketing (business বাড়লে)

---

# 🚨 PART 7: Rules (কী করবেন, কী করবেন না)

## ✅ সবসময় করুন
1. `escapeHtml()` — সব user input render-এ
2. `serverTimestamp()` — Firestore-এ (new Date() নয়)
3. Transaction — price calculation-এ
4. Relative paths — `./firebase.js`
5. `type="module"` — script tag-এ
6. Cache bypass — test-এ `?v=2`
7. Console.log — file শেষে (`✅ filename loaded`)
8. বাংলা message — user-facing error
9. Number font → **Inter Bold** (Playfair নয়!)

## ❌ কখনো করবেন না
1. `common.css` direct edit (সব page affect)
2. `firebase.js`-এ config ছাড়া কিছু
3. API keys client-side-এ
4. `escapeHtml()` ছাড়া user data render
5. `eval()` ব্যবহার
6. Firestore rules-এ `allow if true`
7. Admin UID manual সরানো
8. `common.css`/`firebase.js` delete
9. ৫+ images / product
10. Stock 0-এ order allow

## File Edit Rules
- একবারে **একটাই file**
- **Commit history** check আগে
- **Local test** না করে push না
- **Full file content** দিন (patch নয়) — User মোবাইলে খোঁজে না

---

# 🔐 PART 8: Security

## ✅ যা আছে
- [x] Firestore rules
- [x] Admin UID verify
- [x] Email/Password + Google Auth
- [x] Server-side price (transaction)
- [x] XSS protection (`escapeHtml`)
- [x] Back button trap
- [x] IP flagging
- [x] Cart tampering prevention
- [x] HTTPS (Vercel)
- [x] Coupon double-validation
- [x] Wishlist auto-cleanup

## ⚠️ যা যোগ করা উচিত
- [ ] Rate limiting (serverless)
- [ ] reCAPTCHA on register
- [ ] Email verification
- [ ] Admin 2FA
- [ ] Audit log
- [ ] Weekly Firestore export
- [ ] Server-side duplicate order check

## 🚫 কখনো না
- `allow read, write: if true`
- Admin credentials hardcode
- User input সরাসরি HTML-এ
- `eval()`
- API keys client
- Password plain text

---

# 🛠️ PART 9: Recovery Guide

## Common Problems & Solutions

| সমস্যা | কারণ | সমাধান |
|--------|------|--------|
| White screen | JS import fail | Console → error দেখুন |
| 404 on css/js | Wrong path | File path check |
| Cart badge ভুল | `updateCartBadges()` কল হয়নি | common.js verify |
| Permission denied | Rules ভুল | Firebase Console check |
| Order place fail | Transaction error | Stock/permission check |
| Google login fail | Domain authorized না | Firebase → Auth → Settings |
| Index error | Composite index নেই | Error link → Create Index |
| Deploy fail | Vercel issue | Logs দেখুন |
| Firebase quota | Free limit | ২৪ ঘণ্টা wait |
| Font wrong | Playfair on number | `css/[page].css`-এ force |
| Back button bypass | Trap নেই | `history.pushState` |
| Modal keyboard ঢাকে | CSS issue | `max-height: calc(100vh - 2rem)` + `overflow-y-auto` |
| Stock wrong | Delete-এ restore হয়নি | Smart delete logic verify |
| Reorder কাজ করে না | `sortOrder` নেই | saveProduct-এ assign verify |
| Real-time total update না | `recalcOrderEdit` not exported | `window.recalcOrderEdit` verify |

## Rollback Procedure
1. GitHub → Commits → find last good commit
2. "Revert" click → new commit
3. Vercel auto-deploy → wait 2 min
4. Hard refresh browser

---

# 📋 PART 10: Quick Reference

## Global Functions (window.xxx)

### Auth
- `login()`, `logout()` — admin.js, messages.js
- `loginUser()`, `registerUser()`, `googleSignIn()`, `forgotPassword()`, `logoutUser()` — account.js

### Cart
- `addToCart(id)`, `removeFromCart(id)` — index.js, product.js, wishlist.js
- `applyCoupon()`, `removeCoupon()`, `changeQty()`, `removeItem()`, `clearCart()`, `moveToWishlist()`, `proceedToCheckout()` — cart.js

### Checkout
- `placeOrder()` — checkout.js
- `showRepeatModal()`, `showWarningModal()`, `showHistoryModal()`, `continueFromRepeat()`, `cancelFromWarning()`, `continueFromWarning()` — checkout.js

### Account
- `saveProfile()`, `loadMyOrders()`, `openAddressEdit()`, `cancelAddressEdit()`, `togglePassword()` — account.js

### Admin
- `showTab(tab)`, `openMoreMenu()` — admin.js
- `openAddModal()`, `editProduct()`, `saveProduct()`, `deleteProduct()`, `renderAdminProducts()` — admin.js
- `openOrderEdit()`, `saveOrderEdit()`, `confirmDeleteOrder()`, `executeDelete()`, `openStatusPicker()`, `selectStatus()`, `confirmStatusChange()`, `filterOrders()`, `exportOrdersCSV()`, `recalcOrderEdit()` — admin.js
- `openCategoryModal()`, `saveCategory()`, `editCategory()`, `deleteCategory()`, `openInlineCategoryModal()`, `saveInlineCategory()` — admin.js
- `openCouponModal()`, `saveCoupon()`, `editCoupon()`, `deleteCoupon()` — admin.js
- `openHeroModal()`, `saveHeroBanner()`, `openSectionModal()`, `saveSection()`, `openBannerModal()`, `saveBanner()`, `openTestimonialModal()`, `saveTestimonial()` — admin.js
- `saveSettings()` — admin.js
- `openCategoryReorder()`, `moveCategoryUp()`, `openSectionReorder()`, `moveSectionUp()`, `openProductReorder()`, `moveProductUp()`, `changeReorderCategory()` — admin-reorder.js
- `loadMessages()`, `filterMessages()`, `openDetail()`, `closeDetail()`, `deleteCurrentMessage()` — messages.js

## Key IDs

### Form Fields
- **Checkout:** `#customer-name`, `#customer-phone`, `#customer-email`, `#customer-address`, `#customer-district`, `#customer-thana`
- **Login:** `#login-email`, `#login-password`, `#remember-me`
- **Register:** `#reg-name`, `#reg-phone`, `#reg-email`, `#reg-password`, `#reg-confirm`
- **Profile:** `#profile-name`, `#profile-phone`, `#profile-address`, `#profile-district`, `#profile-thana`
- **Product modal:** `#p-name`, `#p-price`, `#p-oldprice`, `#p-stock`, `#p-brand`, `#p-description`, `#p-featured`, `#p-pinned`, `#p-categories-list`, `#p-image-file`
- **Order Edit:** `#oe-edit-name`, `#oe-edit-phone`, `#oe-edit-address`, `#oe-edit-district`, `#oe-edit-thana`, `#oe-discount`, `#oe-delivery`, `#oe-advance`, `#oe-note`
- **Track:** `#order-input`, `#res-order-num`
- **Success:** `#order-number`, `#track-btn`

### Badge IDs (সব page-এ)
- `#cart-count-header` — header cart badge
- `#wishlist-count-header` — header wishlist badge
- `#cart-count-bottom`, `#cart-count-sidebar` — index.html
- `#orders-badge`, `#orders-badge-mob` — admin.html

### Modal IDs
- `#product-modal`, `#order-edit-modal`, `#category-modal`, `#coupon-modal`, `#hero-modal`, `#section-modal`, `#banner-modal`, `#testimonial-modal`
- `#category-reorder-modal`, `#section-reorder-modal`, `#product-reorder-modal`
- `#more-menu-modal`, `#status-picker-modal`, `#status-confirm-modal`, `#product-picker-modal`
- `#delete-order-modal` (dynamic)

## LocalStorage Keys
- `heartix_cart` — cart items
- `heartix_wishlist` — IDs array
- `heartix_recent` — recently viewed IDs
- `heartix_coupon` — { code, type, value, minOrder }
- `heartix_remember` — login identifier

## Status Values
- **Order:** pending, confirmed, shipped, delivered, cancelled
- **Payment:** full-cod, delivery-advance, full-online
- **Coupon:** percentage, fixed

---

# 📊 PART 11: Statistics

## Progress
| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0 | ✅ | 100% |
| Phase 1 | ✅ | 100% |
| Phase 2 | ⏳ | 0% |
| Phase 3-6 | ⏳ | 0% |

**Overall: ~30%**

## File Counts
| Type | Count |
|------|-------|
| HTML | 18 (2 TODO) |
| CSS | 12 |
| JS | 16 |
| MD | 2 |
| PNG | 1 |
| **Total** | **49** |

## Cost (Monthly)
| Service | Free Tier | Usage |
|---------|-----------|-------|
| Firebase reads | 50K/day | <2K |
| Firebase writes | 20K/day | <200 |
| Cloudinary | 25 credits | <10 |
| Vercel | 100GB | <2GB |
| **Total** | **৳0** | — |

---

# 🎓 PART 12: অন্যান্য AI-এর জন্য

## Golden Rules
1. **এই guide.md আগে পড়ুন** — কাজের আগে
2. **একবারে একটাই file** edit
3. **Full file content** দিন (মোবাইলে patch কষ্ট)
4. **Step-by-step** বলুন (commit → deploy → test)
5. **Cache bypass** mention করুন (`?v=2`)
6. **Deploy wait** বলুন (2 min)
7. **User confused হলে** — file identify করুন

## File Confused হলে জিজ্ঞেস করুন
- Title tag কী?
- শেষে কোন script?
- Unique function কী?
- Content-এ কী দেখা যাচ্ছে?

## Critical
- কখনো `common.css`/`firebase.js` delete না
- কখনো `escapeHtml()` skip না
- কখনো API key client-side না
- সবসময় `serverTimestamp()`

## Contact
- Firebase: `heartix` project
- Cloudinary: `ju2w6e9r`
- Support: `twhob71122@gmail.com`
- Admin UIDs: `settings/admins.uids[]`

## Bangla Notes
- User-facing message বাংলায়
- Code comments বাংলা বা English — okay
- `&lt;br&gt;` শুধু hero title-এ (safeHeroTitle handle করে)

---

# 📝 PART 13: Changelog

## v4.0 (15 Oct 2025, 5 AM)
- ✅ Editable order customer info
- ✅ Real-time total update (bug fix)
- ✅ Compact collapsible order edit
- ✅ Custom delete modal
- ✅ Smart stock restore
- ✅ Back button trap (order edit)
- ✅ Original values display

## v3.0 (15 Oct 2025)
- ✅ Phase 1 complete (Reorder)
- ✅ Featured + Pin
- ✅ Compact order cards
- ✅ Custom delete modal
- ✅ Google logo fix
- ✅ Number fonts fix

## v2.0 (14 Oct 2025)
- ✅ Phase 0 complete (Modular)
- ✅ Multi-category
- ✅ Repeat customer
- ✅ IP tracking
- ✅ Account address save

## v1.0
- Basic e-commerce

---

# 🎯 FINAL NOTES

## এই Guide যেকোনো AI-কে দিলে
1. Project বুঝবে সাথে সাথে
2. File identify করতে পারবে (এলোমেলো হলেও)
3. Priority order জানবে
4. Security maintain করবে
5. Error recovery করতে পারবে

## Next Session
**Start with:** `guide.md` খুলে "Phase 2" বলুন

**Priority:** Phase 2 → 3 → 4 → 5 → 6

**Estimated total:** ~২৫-৩০ ঘণ্টা বাকি

---

**Last Updated:** 15 October 2025, 5:00 AM
**Total Sections:** 13
**Purpose:** Single source of truth
**Maintainer:** Developer + Claude AI
**Version:** 4.0

*এই guide প্রতিটা commit-এ update করা উচিত।*