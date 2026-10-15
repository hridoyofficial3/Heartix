# 📖 Heartix — Master Guide v6.0

**Version:** 6.0
**Last Updated:** 15 October 2025, 10:30 PM
**Live Site:** heartix.vercel.app
**Status:** Phase 0 ✅ + Phase 1 ✅ + Staff System ✅ | Phase 2 পরবর্তী
**Maintainer:** Developer + Claude AI
**Purpose:** Single source of truth — যেকোনো AI সাথে সাথে কাজ বুঝতে পারবে

---

# 📋 PART 1: এই Guide কীভাবে পড়বেন

## এই Guide পড়ার Order
1. **Part 2** — Project পরিচিতি (কী সাইট, tech stack)
2. **Part 3** — বর্তমান অবস্থা (কী হয়েছে, কী বাকি)
3. **Part 4** — File Structure + Identification
4. **Part 5** — Firebase Structure
5. **Part 5.5** — Staff + Activity System ⭐
6. **Part 5.6** — Firebase Rules (Full Text) ⭐
7. **Part 6** — বাকি কাজের Plan
8. **Part 7-9** — Rules, Security, Recovery
9. **Part 10** — Quick Reference

## যদি আপনি নতুন AI হন
- **File এলোমেলো হলে** → Part 4-এর "File Identification"
- **User কিছু চাইলে** → Part 6 দেখে priority
- **Error হলে** → Part 9
- **Function খুঁজলে** → Part 10
- **Staff/Activity নিয়ে প্রশ্ন** → Part 5.5
- **Firestore Rules update করতে** → Part 5.6

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
- **Numbers (Price/Total):** **Inter Bold** — Playfair NEVER!

## Firebase Config
- Project ID: `heartix`
- Auth domain: `heartix.firebaseapp.com`
- Support email: `twhob71122@gmail.com`
- Cloudinary cloud: `ju2w6e9r`
- Upload preset: `heartix_unsigned`

## Admin Credentials
- **Primary Admin Email:** `admin@heartix.com`
- **Primary Admin UID:** `IeE3IFsCrmSE5hfzhXWbtes32To2` (Owner)
- **Staff Collection:** `staff/{uid}` doc with role field
- **Legacy Backup:** `settings/admins.uids[]`

---

# 📊 PART 3: বর্তমান অবস্থা

## ✅ সম্পূর্ণ ফেজ

### Phase 0: Modular File Structure — সম্পূর্ণ ✅
সব page-এর inline CSS/JS আলাদা ফাইলে।

### Phase 1: Reorder System — সম্পূর্ণ ✅
- Category Reorder, Section Reorder, Product Reorder
- Featured + Pin to Top

### Phase 1.5: Staff + Activity System — সম্পূর্ণ ✅

**Components:**

1. **Firestore Rules v5** — `staff` + `activity_log` collection
2. **Staff Management** — Add/Edit/Disable/Remove staff with roles
3. **Role-Based Access** — Owner, Admin, Manager, Moderator, Delivery
4. **Activity Log** — সব action automatic tracked
5. **Moderator Panel** — Restricted access, status update + logging
6. **Last Login Tracker** — `staff/{uid}.lastLogin` field
7. **Secondary Firebase App** — Staff create without admin logout

---

## 🆕 নতুন Features (v6.0)

### ১. Staff Management System
- ৫টা role: Owner, Admin, Manager, Moderator, Delivery
- Add Staff (secondary Firebase app দিয়ে — admin logout হয় না)
- Edit Staff (name, phone, role)
- Enable/Disable staff (temporary block)
- Remove staff (permanent delete)
- Role-based permission check

### ২. Activity Log System
- Auto-track: Login, Logout, Order status change, Product CRUD, Coupon CRUD, Category CRUD, Settings update, Staff CRUD, Message read/delete
- Filters: Date (আজ/গতকাল/৭ দিন/সব) + Staff + Action type
- Relative time display ("এইমাত্র", "5 মিনিট আগে")
- Grouped by date
- Color-coded badges (LOGIN, ORDER, STAFF_ADD, etc.)

### ৩. Last Login Tracker
- `staff/{uid}.lastLogin` — `serverTimestamp()` দিয়ে update হয় login-এ
- Staff card-এ display: "2 মিনিট আগে", "1 ঘণ্টা আগে"

### ৪. Moderator Panel (Staff-based)
- `staff/{uid}` collection থেকে verify
- Restricted access: Orders + Messages (read-only + status change)
- Status change → automatically logged
- Admin activity-তে দেখা যায়

---

## 🐛 Bug Fixes (v6.0)
1. Activity Log conflict (দুইটা system একসাথে চলত) → single source
2. `admin-staff.js` duplicate `logActivity` → removed
3. `lastLogin` field update → `staff-activity.js`-এ যোগ
4. Moderator login → `staff` collection verify

---

# 📁 PART 4: সম্পূর্ণ File Structure

## Root HTML Files

| File | Purpose | CSS | JS |
|------|---------|-----|-----|
| `index.html` | Home | common.css, index.css | index.js |
| `product.html` | Product detail | common.css, product.css | product.js |
| `cart.html` | Cart | common.css, cart.css | cart.js |
| `checkout.html` | Checkout | common.css, checkout.css | checkout.js |
| `account.html` | Auth + Profile | common.css, account.css | account.js |
| `wishlist.html` | Wishlist | common.css, wishlist.css | wishlist.js |
| `contact.html` | Contact | common.css, contact.css | contact.js |
| `order-success.html` | Post-order | common.css, order-success.css | order-success.js |
| `track-order.html` | Tracking | common.css, track-order.css | track-order.js |
| `admin.html` | Admin panel (9 tabs) | common.css, admin.css | admin-reorder.js, admin.js, admin-integrations.js, staff-activity.js, admin-activity.js, admin-staff.js |
| `messages.html` | Admin inbox | common.css, messages.css | messages.js |
| `moderator.html` | Moderator panel | common.css, moderator.css | moderator.js |
| `about.html` | Static | common.css | inline |
| `faq.html` | Static | common.css | inline |
| `terms.html` | Static | common.css | inline |
| `privacy.html` | Static | common.css | inline |
| `return-policy.html` | Static | common.css | inline |

## CSS Files (`css/`)

| File | Used by |
|------|---------|
| `common.css` | সব page |
| `index.css` | index.html |
| `product.css` | product.html |
| `cart.css` | cart.html |
| `checkout.css` | checkout.html |
| `account.css` | account.html |
| `wishlist.css` | wishlist.html |
| `contact.css` | contact.html |
| `order-success.css` | order-success.html |
| `track-order.css` | track-order.html |
| `admin.css` | admin.html |
| `messages.css` | messages.html |
| `moderator.css` | moderator.html |

## JS Files (`js/`)

| File | Used by | Unique Functions |
|------|---------|------------------|
| `firebase.js` | সব | exports `db`, `auth` |
| `common.js` | সব | `showToast`, `escapeHtml`, `formatPrice`, cart/wishlist helpers, `initIntegrations` auto-call |
| `districts.js` | checkout, account, admin | `DISTRICTS` |
| `integrations.js` | common.js | GA4 + FB Pixel auto-loader |
| `staff-activity.js` ⭐ | admin.js, messages.js, moderator.js | `logActivity(action, {description, meta})` + lastLogin tracker |
| `admin-activity.js` ⭐ | admin.html | Activity tab UI + filters |
| `admin-staff.js` ⭐ | admin.html | Staff CRUD (secondary Firebase app) |
| `admin.js` | admin.html | সব admin logic + activity logs |
| `admin-reorder.js` | admin.html | Category/Section/Product reorder |
| `admin-integrations.js` | admin.html | GA + FB settings UI |
| `admin-back-trap.js` | admin-integrations.js | Back button trap |
| `admin-bulk.js` | admin-integrations.js | CSV bulk upload |
| `index.js` | index.html | Home logic |
| `product.js` | product.html | Product detail |
| `cart.js` | cart.html | Cart |
| `checkout.js` | checkout.html | Checkout + IP + repeat |
| `account.js` | account.html | Auth + Profile |
| `wishlist.js` | wishlist.html | Wishlist |
| `contact.js` | contact.html | Contact form |
| `order-success.js` | order-success.html | Post-order |
| `track-order.js` | track-order.html | Order tracking |
| `messages.js` | messages.html | Admin inbox |
| `moderator.js` ⭐ | moderator.html | Moderator panel + status log |

## File Identification Guide ⭐

### HTML চেনার সহজ নিয়ম

**Title tag দেখুন:**

| Title | File |
|-------|------|
| Heartix — Premium Smart Appliances | index.html |
| Admin Control - Heartix | admin.html |
| Messages - Heartix Admin | messages.html |
| Moderator Panel - Heartix | moderator.html |
| (বাকি) | Title = filename |

**শেষের `<script>` দেখুন:**
- `admin-reorder.js + admin.js + admin-integrations.js + staff-activity.js + admin-activity.js + admin-staff.js` → **admin.html**
- `moderator.js` → **moderator.html**
- `index.js` → **index.html**
- ইত্যাদি

**Unique HTML element:**
- `id="content-activity"` → admin.html (Activity tab)
- `id="staff-modal"` → admin.html (Staff modal)
- `id="activity-list"` → admin.html

### JS চেনার সহজ নিয়ম

**Unique function:**

| Function | File |
|----------|------|
| `logActivity` | staff-activity.js |
| `loadActivity`, `filterActivity`, `refreshActivity` | admin-activity.js |
| `openAddStaffModal`, `saveStaff`, `removeStaff` | admin-staff.js |
| `renderAdminOrders`, `confirmStatusChange` | admin.js, moderator.js |
| `renderAdminProducts`, `executeDelete` | admin.js |
| `placeOrder` | checkout.js |

---

# 🗄️ PART 5: Firebase Structure

## Collections

### `products`
```js
{
  id, name, price, oldPrice,
  category, categories: [],
  stock, brand, description,
  image, images: [],
  sortOrder, featured, pinned,
  createdAt
}
```

### `orders`
```js
{
  id, orderNumber,
  customer: {
    name, phone, email, address, district, thana,
    ipAddress, isRepeat, orderCount,
    previousOrderNumbers, flagged, flagReason
  },
  items: [{ id, name, price, quantity, image }],
  subtotal, discount, couponCode,
  deliveryCharge, total,
  paymentMethod, advancePaid, dueAmount,
  status, stockDeducted, adminNote,
  createdAt
}
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

### `coupons`
```js
{ code(docID), description, type, value, minOrder, maxUses, usedCount, expiry, active, createdAt, updatedAt }
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
  heroBanners: [{ badge, title, subtitle, bg, link, image }],
  integrations: {
    googleAnalytics: { enabled, measurementId },
    facebookPixel: { enabled, pixelId }
  }
}
```

### `settings/admins` (Legacy backup)
```js
{ uids: string[] }
```

### `staff` ⭐
```js
{
  uid,          // = doc ID (Firebase Auth UID)
  name,
  email,
  phone,
  role,         // 'owner' | 'admin' | 'manager' | 'moderator' | 'delivery'
  active,       // boolean
  lastLogin,    // serverTimestamp
  createdAt,    // ISO string
  createdBy,    // UID of creator
  updatedAt,    // ISO string (on edit)
  updatedBy     // UID of updater
}
```

### `activity_log` ⭐
```js
{
  uid,          // staff UID
  name,         // staff name
  email,        // staff email
  role,         // staff role
  action,       // 'login' | 'logout' | 'order_status' | ... (see PART 10)
  description,  // Human readable Bengali/English
  meta,         // { orderId, oldStatus, newStatus, ... }
  createdAt     // serverTimestamp
}
```

## Firestore Indexes (Required)
- `orders`: `orderNumber` ASC
- `orders`: `customer.phone` ASC + `createdAt` DESC
- `orders`: `customer.ipAddress` ASC + `createdAt` DESC
- `orders`: `createdAt` DESC
- `reviews`: `createdAt` DESC
- `activity_log`: `createdAt` DESC

---

# 🎭 PART 5.5: Staff + Activity System ⭐

## Overview

Staff + Activity system ২টা main collection:
- `staff` — কারা কাজ করতে পারবে + role
- `activity_log` — কে কী করেছে

## Role Hierarchy

```
Owner     → সব কিছু + Staff management
Admin     → সব কিছু (Owner ছাড়া)
Manager   → Products, Orders, Coupons, Categories
Moderator → Orders, Messages (status change only)
Delivery  → Only assigned orders (future)
```

## Role Permissions Matrix

| Action | Owner | Admin | Manager | Moderator | Delivery |
|--------|-------|-------|---------|-----------|----------|
| Add Staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove Staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| Products | ✅ | ✅ | ✅ | read | ❌ |
| Orders (edit) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Orders (status change) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Messages | ✅ | ✅ | ✅ | ✅ | ❌ |
| Coupons | ✅ | ✅ | ✅ | read | ❌ |
| Categories | ✅ | ✅ | ✅ | read | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ | ❌ |

## Activity Log Flow

```
Staff/Moderator action
    ↓
logActivity(action, {description, meta})   ← staff-activity.js
    ↓
1. activity_log collection-এ entry save
    ↓
2. যদি action === 'login':
   staff/{uid} update { lastLogin: serverTimestamp() }
    ↓
admin-activity.js → loadActivity() → renderActivity()
    ↓
Admin Activity tab-এ দেখা যায়
```

## Adding Staff — Full Flow

```
Admin clicks "Add Staff"
    ↓
Fill: name, email, phone, password, role
    ↓
saveStaff() runs
    ↓
1. Permission check (current role Owner/Admin only)
    ↓
2. Secondary Firebase app create (admin logout হয় না)
    const secondaryApp = initializeApp(config, "secondary-" + Date.now())
    const cred = await createSecondaryUser(secondaryAuth, email, password)
    await deleteApp(secondaryApp)
    ↓
3. staff/{newUser.uid} doc create
    ↓
4. logActivity('staff_add', {...})
    ↓
5. Staff list refresh
```

## Activity Tab Filters

- **Date:** আজ / গতকাল / ৭ দিন / সব
- **Staff:** All Staff / specific staff
- **Action:** All Actions / Login / Orders / Products / Messages / Staff / Settings / Coupons / Categories

## Adding a New Activity Type

**Step ১:** `staff-activity.js`-এ logActivity call যোগ
```javascript
await logActivity('new_action', {
    description: 'বর্ণনা লিখুন',
    meta: { key: 'value' }
});
```

**Step ২:** `admin-activity.js`-এ `ACTION_META`-তে entry যোগ
```javascript
'new_action': { icon: 'icon-name', color: 'text-color', bg: 'bg-color', label: 'New Label' }
```

---

# 🔐 PART 5.6: Firebase Rules (Full Text) ⭐

## How to Deploy

1. `console.firebase.google.com` → heartix → Firestore Database → **Rules** tab
2. পুরনো rules মুছুন (Select all → Delete)
3. নিচের rules paste করুন
4. **Publish** ক্লিক করুন
5. সফল হলে সবুজ toast দেখবেন

## Full Rules Text

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ====== HELPERS ======
    function isSignedIn() {
      return request.auth != null;
    }

    function staffDoc() {
      return get(/databases/$(database)/documents/staff/$(request.auth.uid)).data;
    }

    function isStaff() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/staff/$(request.auth.uid)) &&
        staffDoc().active == true;
    }

    function role() {
      return isStaff() ? staffDoc().role : null;
    }

    function isOwner() {
      return role() == 'owner';
    }

    function isAdmin() {
      return role() in ['owner', 'admin'];
    }

    function isManager() {
      return role() in ['owner', 'admin', 'manager'];
    }

    function isModerator() {
      return role() in ['owner', 'admin', 'manager', 'moderator'];
    }

    function isDelivery() {
      return role() in ['owner', 'admin', 'manager', 'moderator', 'delivery'];
    }

    // ====== PRODUCTS ======
    match /products/{doc} {
      allow read: if true;
      allow create, update: if isManager();
      allow delete: if isAdmin();
    }

    // ====== ORDERS ======
    match /orders/{doc} {
      allow read: if true;
      allow create: if true;  // guest checkout allowed
      allow update: if isModerator();
      allow delete: if isAdmin();
    }

    // ====== COUPONS ======
    match /coupons/{doc} {
      allow read: if true;
      allow write: if isManager();
    }

    // ====== REVIEWS ======
    match /reviews/{doc} {
      allow read: if true;
      allow create: if true;
      allow delete: if isAdmin();
    }

    // ====== MESSAGES (Contact form) ======
    match /messages/{doc} {
      allow create: if true;
      allow read, update: if isModerator();
      allow delete: if isAdmin();
    }

    // ====== CUSTOMERS ======
    match /customers/{uid} {
      allow read: if isSignedIn() && (request.auth.uid == uid || isAdmin());
      allow create, update: if isSignedIn() && request.auth.uid == uid;
      allow delete: if isAdmin();
    }

    // ====== SETTINGS (main, admins) ======
    match /settings/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // ====== STAFF ======
    match /staff/{uid} {
      allow read: if isStaff() || isAdmin() || (isSignedIn() && request.auth.uid == uid);
      allow create, update, delete: if isAdmin();
    }

    // ====== ACTIVITY LOG ======
    match /activity_log/{doc} {
      allow read: if isAdmin();
      allow create: if isStaff();
      allow update, delete: if false;
    }
  }
}
```

## Rules Explanation

| Collection | Read | Create | Update | Delete |
|-----------|------|--------|--------|--------|
| products | সবাই | Manager+ | Manager+ | Admin+ |
| orders | সবাই | সবাই (guest) | Moderator+ | Admin+ |
| coupons | সবাই | Manager+ | Manager+ | Manager+ |
| reviews | সবাই | সবাই | — | Admin+ |
| messages | Moderator+ | সবাই | Moderator+ | Admin+ |
| customers | Owner/Admin | নিজে | নিজে | Admin+ |
| settings | সবাই | — | Admin+ | — |
| staff | Staff/Admin/নিজে | Admin+ | Admin+ | Admin+ |
| activity_log | Admin+ | Staff+ | কেউ না | কেউ না |

## Critical Notes

- **Legacy fallback:** `settings/admins.uids[]` array-ও কাজ করে (rules-এ `staff` priority)
- **Owner UID:** `IeE3IFsCrmSE5hfzhXWbtes32To2` — এটাই owner
- **Staff doc missing হলে:** Rule fail → login কাজ করবে না
- **Rules update করলে:** সব active session re-auth করবে

---

# ⬜ PART 6: বাকি কাজ (Priority Order)

## 🥇 Phase 2: Plug & Play Settings — পরবর্তী ⏭
**সময়:** ~৪-৫ ঘণ্টা

### Integration List
1. **Google Analytics** — ✅ completed
2. **Facebook Pixel** — ✅ completed
3. **SMS (BulkSMSBD)** — Vercel serverless
4. **Email (SendGrid)** — Vercel serverless
5. **WhatsApp API**
6. **bKash Payment Gateway**
7. **Nagad Payment Gateway**

### Files to Create
- `/api/send-sms.js`, `/api/send-email.js` (Vercel serverless)
- `js/integrations/sms.js`, `js/integrations/email.js`
- `verifyAdmin(uid)` check in serverless

## 🥈 Phase 3: Admin Tools — ~৩-৪ ঘণ্টা
1. Bulk CSV Upload ✅ completed
2. Moderator Tab ✅ completed
3. Landing Pages Tab
4. Inventory Alert (stock < 5)
5. Bulk Order Update

## 🥉 Phase 4: Analytics — ~৪-৫ ঘণ্টা
1. Sales Dashboard (Chart.js)
2. Customer Segmentation
3. Profit Calculator
4. Return Rate Tracking
5. Top Products Report

## 📱 Phase 5: Customer UX — ~৫-৬ ঘণ্টা
1. PWA Setup
2. Push Notification
3. Dark Mode
4. Reviews with Images
5. Pre-order System

## 🎯 Phase 6: Marketing — ~৫-৬ ঘণ্টা
1. Abandoned Cart Recovery
2. Refer & Earn
3. Loyalty Points
4. Spin Wheel
5. Product Bundle

---

# 🚨 PART 7: Rules (কী করবেন, কী করবেন না)

## ✅ সবসময় করুন
1. `escapeHtml()` — সব user input render-এ
2. `serverTimestamp()` — Firestore-এ
3. Transaction — price calculation-এ
4. Relative paths — `./firebase.js`
5. `type="module"` — script tag-এ
6. Cache bypass — test-এ `?v=2`
7. Console.log — file শেষে (`✅ filename loaded`)
8. বাংলা message — user-facing
9. Number font → **Inter Bold**
10. `logActivity()` — সব significant action-এ

## ❌ কখনো করবেন না
1. `common.css` direct edit
2. API keys client-side
3. `escapeHtml()` skip
4. `eval()` ব্যবহার
5. Firestore rules-এ `allow if true`
6. Admin UID manual সরানো
7. `common.css`/`firebase.js` delete
8. ৫+ images / product
9. Stock 0-এ order allow
10. দুইটা logActivity system (duplicate)

## File Edit Rules
- একবারে একটাই file
- Commit history check আগে
- Local test না করে push না
- Full file content দিন (patch নয়)

---

# 🔐 PART 8: Security

## ✅ যা আছে
- [x] Firestore rules (staff + activity based)
- [x] Role-based access (Owner/Admin/Manager/Moderator/Delivery)
- [x] Email/Password + Google Auth
- [x] Server-side price (transaction)
- [x] XSS protection (`escapeHtml`)
- [x] Back button trap
- [x] IP flagging
- [x] Cart tampering prevention
- [x] HTTPS (Vercel)
- [x] Coupon double-validation
- [x] Wishlist auto-cleanup
- [x] Activity audit trail
- [x] Staff active/disable
- [x] Secondary Firebase app (no admin logout)

## ⚠️ যা যোগ করা উচিত
- [ ] Rate limiting (serverless)
- [ ] reCAPTCHA on register
- [ ] Email verification
- [ ] Admin 2FA
- [ ] Weekly Firestore export
- [ ] Server-side duplicate order check
- [ ] Activity log retention policy

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
| Permission denied | Rules ভুল | Firestore check |
| Order place fail | Transaction error | Stock/permission check |
| Google login fail | Domain authorized না | Firebase → Auth → Settings |
| Index error | Composite index নেই | Error link → Create Index |
| **Staff tab খালি** | UID ভুল বা rules | `staff/{UID}` doc check |
| **"Last login: কখনো login করেনি"** | `staff-activity.js` পুরনো | Cache clear (`?v=XX`) |
| **Activity tab খালি** | logActivity fail | Console → import error |
| **Moderator login fail** | staff doc-এ role/active ভুল | Firestore-এ fix |
| **Add Staff logout হয়ে যায়** | পুরনো `admin-staff.js` | নতুন version pull |
| **Two activity systems conflict** | পুরনো admin-staff.js | নিশ্চিত করুন একটাই `logActivity` |
| **Password reset দরকার** | Password ভুলে গেছেন | Firebase Console → Auth → Reset |
| Font wrong | Playfair on number | `css/[page].css` force |
| Back button bypass | Trap নেই | `history.pushState` |
| Modal keyboard ঢাকে | CSS issue | `max-height: calc(100vh - 2rem)` |
| Stock wrong | Delete-এ restore হয়নি | Smart delete logic verify |
| Reorder কাজ করে না | `sortOrder` নেই | saveProduct-এ assign |

## Staff/Activity Specific Recovery

### যদি Staff tab-এ "No staff found" দেখায়:
1. Firestore Console → `staff` collection check
2. আপনার UID-তে doc আছে কি?
3. `active: true` আছে কি?
4. `role: owner` বা `admin` আছে কি?

### যদি Activity Log খালি দেখায়:
1. Browser Console (F12) → errors দেখুন
2. `staff-activity.js loaded` print হয়েছে কি?
3. `admin-activity.js loaded` print হয়েছে কি?
4. `activity_log` collection-এ data আছে কি?
5. `staff/{your-uid}` doc-এ name, email সেট করা আছে কি?

### যদি Moderator login না হয়:
1. Firestore → `staff/{moderator-uid}` doc check
2. `active: true` এবং `role: 'moderator'` বা higher আছে কি?
3. Firebase Auth-এ user আছে কি?
4. Password reset-এর জন্য Firebase Console ব্যবহার করুন

### Password Reset Procedure (Firebase Console):
1. `console.firebase.google.com` → heartix → Authentication → Users
2. User-এর row-এ **⋮ (3-dot)** → **Reset password**
3. New password কপি → login

### Rules Publish Procedure:
1. `console.firebase.google.com` → heartix → Firestore Database → Rules
2. Select all (Ctrl+A) → Delete
3. PART 5.6 থেকে rules paste করুন
4. **Publish** ক্লিক
5. সবুজ toast দেখবেন

## Rollback Procedure
1. GitHub → Commits → find last good commit
2. "Revert" click
3. Vercel auto-deploy → wait 2 min
4. Hard refresh browser

---

# 📋 PART 10: Quick Reference

## Global Functions (window.xxx)

### Auth
- `login()`, `logout()` — admin.js, messages.js, moderator.js
- `loginUser()`, `registerUser()`, `googleSignIn()`, `forgotPassword()`, `logoutUser()` — account.js

### Staff ⭐
- `openAddStaffModal()` — admin-staff.js
- `saveStaff()` — Create or update staff
- `openEditStaff(uid)` — Edit form
- `toggleStaffActive(uid)` — Enable/Disable
- `removeStaff(uid)` — Permanent remove
- `openStaffDetail(uid)` — Detail modal
- `closeStaffModal()`, `closeStaffDetail()` — Close modals

### Activity ⭐
- `logActivity(action, {description, meta})` — staff-activity.js
- `loadActivity()` — admin-activity.js
- `filterActivity(type, value)` — Filter change
- `refreshActivity()` — Reload button

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
- `openAddModal()`, `editProduct()`, `saveProduct()`, `deleteProduct()` — admin.js
- `openOrderEdit()`, `saveOrderEdit()`, `confirmDeleteOrder()`, `executeDelete()` — admin.js
- `openStatusPicker()`, `selectStatus()`, `confirmStatusChange()` — admin.js, moderator.js
- `filterOrders()`, `exportOrdersCSV()`, `recalcOrderEdit()` — admin.js
- `openCategoryModal()`, `saveCategory()`, `editCategory()`, `deleteCategory()` — admin.js
- `openCouponModal()`, `saveCoupon()`, `editCoupon()`, `deleteCoupon()` — admin.js
- `saveSettings()` — admin.js
- `openCategoryReorder()`, `moveCategoryUp()` — admin-reorder.js
- `loadMessages()`, `filterMessages()`, `openDetail()`, `closeDetail()` — messages.js

### Moderator
- `login()`, `logout()` — moderator.js
- `showTab(tab)` — moderator.js
- `filterOrders()`, `filterMessages()` — moderator.js
- `openStatusPicker()`, `selectStatus()`, `confirmStatusChange()` — moderator.js (log-enabled)

## Key IDs

### Staff Modal
- `#staff-modal`, `#staff-modal-title`
- `#edit-staff-uid`, `#staff-name`, `#staff-email`, `#staff-phone`, `#staff-password`, `#staff-role`
- `#staff-save-btn`, `#staff-password-field`
- `#staff-list`, `#staff-count`, `#staff-count-badge`

### Staff Detail Modal
- `#staff-detail-modal`, `#staff-detail-avatar`, `#staff-detail-name`, `#staff-detail-email`, `#staff-detail-phone`, `#staff-detail-role`, `#staff-detail-desc`, `#staff-detail-today`, `#staff-detail-uid`, `#staff-detail-edit-btn`

### Activity Tab
- `#content-activity`, `#activity-list`
- `#activity-date-filter`, `#activity-staff-filter`, `#activity-action-filter`

### Existing
- **Checkout:** `#customer-name`, `#customer-phone`, `#customer-email`, `#customer-address`, `#customer-district`, `#customer-thana`
- **Login:** `#login-email`, `#login-password`, `#remember-me`
- **Product modal:** `#p-name`, `#p-price`, `#p-stock`, `#p-featured`, `#p-pinned`, etc.
- **Order Edit:** `#oe-edit-name`, `#oe-edit-phone`, etc.

## LocalStorage Keys
- `heartix_cart`, `heartix_wishlist`, `heartix_recent`, `heartix_coupon`, `heartix_remember`

## Status Values
- **Order:** pending, confirmed, shipped, delivered, cancelled
- **Payment:** full-cod, delivery-advance, full-online
- **Coupon:** percentage, fixed
- **Staff Roles:** owner, admin, manager, moderator, delivery
- **Activity Actions:** login, logout, order_status, order_edit, order_delete, product_add, product_edit, product_delete, message_read, message_delete, staff_add, staff_edit, staff_disable, staff_remove, coupon_add, coupon_edit, coupon_delete, category_add, category_edit, category_delete, settings_update

---

# 📊 PART 11: Statistics

## Progress
| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0 | ✅ | 100% |
| Phase 1 | ✅ | 100% |
| Phase 1.5 (Staff) | ✅ | 100% |
| Phase 2 | ⏳ | 30% (GA+FB done) |
| Phase 3-6 | ⏳ | 0% |

**Overall: ~45%**

## File Counts (v6.0)
| Type | Count |
|------|-------|
| HTML | 18 (2 TODO) |
| CSS | 13 |
| JS | 25 |
| MD | 2 |
| PNG | 1 |
| **Total** | **59** |

## Cost (Monthly)
| Service | Free Tier | Usage |
|---------|-----------|-------|
| Firebase reads | 50K/day | <3K |
| Firebase writes | 20K/day | <300 |
| Cloudinary | 25 credits | <10 |
| Vercel | 100GB | <2GB |
| **Total** | **৳0** | — |

---

# 🎓 PART 12: অন্যান্য AI-এর জন্য

## Golden Rules
1. এই guide.md আগে পড়ুন
2. একবারে একটাই file edit
3. Full file content দিন
4. Step-by-step বলুন
5. Cache bypass (`?v=2`) mention
6. Deploy wait (2 min)
7. User confused হলে — file identify করুন
8. Staff system = `staff/{uid}` collection
9. Activity log = ONE system (`staff-activity.js`) — duplicate বানাবেন না

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
- **দুইটা `logActivity` function কখনো না**
- **`staff-activity.js` = single source of truth**

## Contact & Credentials
- Firebase: `heartix` project
- Cloudinary: `ju2w6e9r`
- Support: `twhob71122@gmail.com`
- Owner UID: `IeE3IFsCrmSE5hfzhXWbtes32To2`
- Owner Email: `admin@heartix.com`

## Bangla Notes
- User-facing message বাংলায়
- Code comments বাংলা বা English — okay
- `&lt;br&gt;` শুধু hero title-এ (safeHeroTitle handle করে)

---

# 📝 PART 13: Changelog

## v6.0 (15 Oct 2025, 10:30 PM)
### 🔥 Firebase Rules Embedded
- ✅ Full 107-line rules text in PART 5.6
- ✅ Rules explanation table
- ✅ Deploy procedure
- ✅ Complete single-file documentation

## v5.0 (15 Oct 2025, 10 PM)
### ⭐ Staff + Activity System
- ✅ Firestore Rules v5 (staff + activity_log)
- ✅ `staff/{uid}` collection with roles
- ✅ `activity_log` collection with full audit trail
- ✅ `staff-activity.js` — single logActivity helper
- ✅ `admin-activity.js` — Activity tab with filters
- ✅ `admin-staff.js` — Staff CRUD with secondary Firebase app
- ✅ `moderator.js` — Staff-based verify + status change log
- ✅ `admin.js` — Log all significant actions
- ✅ `messages.js` — Message read/delete log
- ✅ Last login tracker
- ✅ Fixed: Activity Log conflict

## v4.0 (15 Oct 2025, 5 AM)
- ✅ Editable order customer info
- ✅ Real-time total update
- ✅ Custom delete modal
- ✅ Smart stock restore
- ✅ Back button trap

## v3.0 (15 Oct 2025)
- ✅ Phase 1 complete (Reorder)
- ✅ Featured + Pin
- ✅ Compact order cards
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
2. File identify করতে পারবে
3. Priority order জানবে
4. Security maintain করবে
5. Error recovery করতে পারবে
6. Staff + Activity system বুঝবে
7. **Firestore Rules deploy করতে পারবে (PART 5.6)** ⭐

## Next Session
**Start with:** `guide.md` খুলে "Phase 2" বলুন

**Priority:** Phase 2 → 3 → 4 → 5 → 6

**Estimated total:** ~২৫-৩০ ঘণ্টা বাকি

## Version History
- **v6.0** — Firebase Rules embedded (single file) ⭐
- **v5.0** — Staff + Activity System
- **v4.0** — Editable orders
- **v3.0** — Reorder system
- **v2.0** — Modular + multi-category
- **v1.0** — Basic e-commerce

---

**Last Updated:** 15 October 2025, 10:30 PM
**Total Sections:** 13 + Part 5.5 + Part 5.6
**Purpose:** Single source of truth (self-contained)
**Maintainer:** Developer + Claude AI
**Version:** 6.0

*এই guide প্রতিটা commit-এ update করা উচিত।*