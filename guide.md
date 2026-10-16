# 📖 Heartix — Master Guide v8.0

**Version:** 8.0
**Last Updated:** 16 October 2025
**Live Site:** heartix.vercel.app
**Status:** Phase 0 ✅ + Phase 1 ✅ + Staff ✅ + Email ✅ + WhatsApp ✅ | Phase 2 complete
**Maintainer:** Developer + Claude AI
**Purpose:** Single source of truth

---

# 📋 PART 1: এই Guide কীভাবে পড়বেন

## Order
1. **Part 2** — Project পরিচিতি
2. **Part 3** — বর্তমান অবস্থা
3. **Part 4** — File Structure
4. **Part 5** — Firebase Structure
5. **Part 5.5** — Staff + Activity System
6. **Part 5.6** — Firebase Rules (Full Text)
7. **Part 5.7** — Email Notifications (EmailJS)
8. **Part 5.8** — WhatsApp Integration
9. **Part 6** — বাকি কাজ
10. **Part 7-9** — Rules, Security, Recovery
11. **Part 10** — Quick Reference

---

# 🎯 PART 2: Project পরিচিতি

## Heartix কী?
বাংলাদেশের প্রিমিয়াম স্মার্ট অ্যাপ্লায়েন্স ই-কমার্স সাইট।

## Tech Stack
| Component | Tech |
|-----------|------|
| Frontend | HTML5 + Tailwind CSS (CDN) + Vanilla JS (ES Modules) |
| Backend | Firebase Firestore + Auth |
| Images | Cloudinary (unsigned upload) |
| Email | EmailJS (client-side, free tier) |
| WhatsApp | wa.me deep link (manual, free) |
| Hosting | Vercel |
| Icons | Font Awesome 6 |
| Fonts | Inter + Playfair Display |

## Colors
- Navy: `#0A1628`
- Gold: `#D4A84B`
- Cream: `#FBF8F3`
- WhatsApp Green: `#25D366`
- Green: `#16a34a`
- Red: `#dc2626`

## Font Rules
- **Body/UI:** Inter
- **Headings:** Playfair Display (`font-display`)
- **Numbers:** **Inter Bold** — Playfair NEVER!

## Firebase Config
- Project ID: `heartix`
- Auth domain: `heartix.firebaseapp.com`
- Support email: `twhob71122@gmail.com`
- Cloudinary cloud: `ju2w6e9r`
- Upload preset: `heartix_unsigned`

## EmailJS Config
- Account: `twhob71122@gmail.com`
- Public Key: `UOTXJmNFXydPMnWDP`
- Service ID: `Heartix`
- Template Admin: `template_yd1wxrt`
- Template Customer: `template_2utpxqd`

## Admin Credentials
- Owner Email: `admin@heartix.com`
- Owner UID: `IeE3IFsCrmSE5hfzhXWbtes32To2`
- Legacy: `settings/admins.uids[]`

---

# 📊 PART 3: বর্তমান অবস্থা

## ✅ সম্পূর্ণ ফেজ

### Phase 0: Modular File Structure ✅
সব page থেকে inline CSS/JS সরিয়ে আলাদা ফাইলে।

### Phase 1: Reorder System ✅
Category, Section, Product reorder + Featured + Pin to Top।

### Phase 1.5: Staff + Activity System ✅
৫টা role, `staff/{uid}`, `activity_log`, Moderator panel।

### Phase 2: Integrations ✅ (সম্পূর্ণ)

| # | Integration | Status |
|---|-------------|--------|
| ১ | Google Analytics (GA4) | ✅ |
| ২ | Facebook Pixel | ✅ |
| ৩ | EmailJS (Email) | ✅ |
| ৪ | WhatsApp (manual wa.me) | ✅ |

**Note:** এই ৪টাই final integration list। ভবিষ্যতে SMS gateway, bKash gateway, Nagad gateway যোগ করা হবে না।

**Manual Payment Numbers:** bKash/Nagad শুধু manual payment number হিসাবে `settings/main`-এ থাকবে — checkout-এ customer-কে দেখানোর জন্য (auto gateway নেই)।

---

## 🆕 v8.0-এ নতুন

### WhatsApp Integration (Manual)

**কোথায় কোথায় WhatsApp button আছে:**
1. **Order Success page** — "Confirm on WhatsApp" (pre-filled order message)
2. **Checkout page** — "Order via WhatsApp" (alternative to place order)
3. **Product page** — compact WhatsApp/Call/Share row
4. **Admin order card** — "WhatsApp" button (customer-কে message)

**Features:**
- Admin panel থেকে toggle ON/OFF
- wa.me link (কোনো API নেই, 100% free)
- Pre-filled message auto-build
- Number: `8801712345678` format

## 🐛 Recent Fixes (v8.0)
1. Product page WhatsApp — `integrations.whatsapp.number` থেকে পড়ে (পুরনো `settings.whatsapp` নয়)
2. WhatsApp button styling — professional design
3. Order-success dead code removed

---

# 📁 PART 4: সম্পূর্ণ File Structure

## Root HTML Files

| File | Purpose | CSS | JS |
|------|---------|-----|-----|
| `index.html` | Home | common.css, index.css | index.js |
| `product.html` | Product detail | common.css, product.css | product.js |
| `cart.html` | Cart | common.css, cart.css | cart.js |
| `checkout.html` | Checkout | common.css, checkout.css | checkout.js, checkout-whatsapp.js |
| `account.html` | Auth + Profile | common.css, account.css | account.js |
| `wishlist.html` | Wishlist | common.css, wishlist.css | wishlist.js |
| `contact.html` | Contact | common.css, contact.css | contact.js |
| `order-success.html` | Post-order | common.css, order-success.css | order-success.js |
| `track-order.html` | Tracking | common.css, track-order.css | track-order.js |
| `admin.html` | Admin (9 tabs) | common.css, admin.css | admin-reorder.js, admin.js, admin-integrations.js, staff-activity.js, admin-activity.js, admin-staff.js |
| `messages.html` | Inbox | common.css, messages.css | messages.js |
| `moderator.html` | Moderator panel | common.css, moderator.css | moderator.js |
| `about.html`, `faq.html`, `terms.html`, `privacy.html`, `return-policy.html` | Static | common.css | inline |

## CSS Files (`css/`)
`common.css`, `index.css`, `product.css`, `cart.css`, `checkout.css`, `account.css`, `wishlist.css`, `contact.css`, `order-success.css`, `track-order.css`, `admin.css`, `messages.css`, `moderator.css`

## JS Files (`js/`)

| File | Used by | Purpose |
|------|---------|---------|
| `firebase.js` | সব | exports `db`, `auth` |
| `common.js` | সব | helpers + `initIntegrations` auto-call |
| `districts.js` | checkout, account, admin | ৬৪ districts |
| `integrations.js` | common.js | GA4 + FB Pixel auto-loader |
| `email-notify.js` | checkout.js, admin.js, moderator.js | `notifyOrderPlaced`, `notifyStatusChange` |
| `checkout-whatsapp.js` | checkout.html | "Order via WhatsApp" button |
| `staff-activity.js` | admin.js, messages.js, moderator.js | `logActivity` + lastLogin |
| `admin-activity.js` | admin.html | Activity tab UI |
| `admin-staff.js` | admin.html | Staff CRUD |
| `admin.js` | admin.html | Admin logic + activity + email + WhatsApp order card |
| `admin-reorder.js` | admin.html | Reorder system |
| `admin-integrations.js` | admin.html | GA + FB + EmailJS + WhatsApp settings |
| `admin-back-trap.js` | admin-integrations.js | Back button trap |
| `admin-bulk.js` | admin-integrations.js | CSV bulk upload |
| `index.js`, `product.js`, `cart.js` | respective | Page logic |
| `checkout.js` | checkout.html | Order + IP + repeat + email |
| `account.js`, `wishlist.js`, `contact.js` | respective | Page logic |
| `order-success.js` | order-success.html | WhatsApp confirm link auto-build |
| `track-order.js` | track-order.html | Post-order lookup |
| `messages.js` | messages.html | Admin inbox + log |
| `moderator.js` | moderator.html | Moderator + status log + email |

## File Identification

### Unique Function → File
| Unique Function | File |
|-----------------|------|
| `logActivity` | staff-activity.js |
| `notifyOrderPlaced`, `notifyStatusChange` | email-notify.js |
| `orderViaWhatsApp` | checkout-whatsapp.js |
| `openAddStaffModal`, `saveStaff`, `removeStaff` | admin-staff.js |
| `renderAdminOrders`, `confirmStatusChange` | admin.js, moderator.js |
| `placeOrder` | checkout.js |
| `loadActivity`, `refreshActivity` | admin-activity.js |
| `loadWhatsAppConfirm` | order-success.js |

---

# 🗄️ PART 5: Firebase Structure

## Collections

### `products`
```js
{ id, name, price, oldPrice, category, categories: [], stock, brand, description, image, images: [], sortOrder, featured, pinned, createdAt }
```

### `orders`
```js
{
  id, orderNumber,
  customer: { name, phone, email, address, district, thana, ipAddress, isRepeat, orderCount, previousOrderNumbers, flagged, flagReason },
  items: [{ id, name, price, quantity, image }],
  subtotal, discount, couponCode, deliveryCharge, total,
  paymentMethod, advancePaid, dueAmount,
  status, stockDeducted, adminNote, createdAt
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
{ code, description, type, value, minOrder, maxUses, usedCount, expiry, active, createdAt, updatedAt }
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
    facebookPixel: { enabled, pixelId },
    emailjs: { enabled, publicKey, serviceId, customerTemplateId, adminTemplateId, adminEmail },
    whatsapp: { enabled, number }
  }
}
```

**Note:** `settings.whatsapp` field (পুরনো) এখনো আছে footer/social link-এর জন্য। কিন্তু product page WhatsApp button `integrations.whatsapp.number` ব্যবহার করে।

`bkashNumber` + `nagadNumber` — শুধু manual payment info (checkout-এ customer-কে দেখায়), gateway নয়।

### `staff`
```js
{ uid, name, email, phone, role, active, lastLogin, createdAt, createdBy, updatedAt, updatedBy }
```

### `activity_log`
```js
{ uid, name, email, role, action, description, meta, createdAt }
```

## Firestore Indexes
- `orders`: `createdAt` DESC
- `orders`: `orderNumber` ASC
- `orders`: `customer.phone` ASC + `createdAt` DESC
- `orders`: `customer.ipAddress` ASC + `createdAt` DESC
- `reviews`: `createdAt` DESC
- `activity_log`: `createdAt` DESC

---

# 🎭 PART 5.5: Staff + Activity System

## Role Hierarchy
```
Owner     → সব কিছু + Staff management
Admin     → সব কিছু (Owner ছাড়া)
Manager   → Products, Orders, Coupons, Categories
Moderator → Orders, Messages (status change only)
Delivery  → Assigned orders only
```

## Adding Staff Flow
```
Admin clicks "Add Staff"
    ↓
Secondary Firebase app create (admin logout হয় না)
    ↓
staff/{newUser.uid} doc create
    ↓
logActivity('staff_add')
    ↓
Staff list refresh
```

## Activity Log Actions
- `login`, `logout`
- `order_status`, `order_edit`, `order_delete`
- `product_add`, `product_edit`, `product_delete`
- `message_read`, `message_delete`
- `staff_add`, `staff_edit`, `staff_disable`, `staff_remove`
- `coupon_add`, `coupon_edit`, `coupon_delete`
- `category_add`, `category_edit`, `category_delete`
- `settings_update`

---

# 🔐 PART 5.6: Firebase Rules (Full Text)

## Deploy Procedure
1. `console.firebase.google.com` → heartix → Firestore → **Rules**
2. Select all → Delete
3. নিচের rules paste
4. **Publish**

## Full Rules Text

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function staffDoc() {
      return get(/databases/$(database)/documents/staff/$(request.auth.uid)).data;
    }
    function isStaff() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/staff/$(request.auth.uid)) &&
        staffDoc().active == true;
    }
    function role() { return isStaff() ? staffDoc().role : null; }
    function isOwner() { return role() == 'owner'; }
    function isAdmin() { return role() in ['owner', 'admin']; }
    function isManager() { return role() in ['owner', 'admin', 'manager']; }
    function isModerator() { return role() in ['owner', 'admin', 'manager', 'moderator']; }
    function isDelivery() { return role() in ['owner', 'admin', 'manager', 'moderator', 'delivery']; }

    match /products/{doc} {
      allow read: if true;
      allow create: if isManager();
      allow update: if isManager() || (
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['stock']) &&
        request.resource.data.stock is number &&
        resource.data.stock is number &&
        request.resource.data.stock < resource.data.stock &&
        resource.data.stock > 0
      );
      allow delete: if isAdmin();
    }

    match /orders/{doc} {
      allow read: if true;
      allow create: if true;
      allow update: if isModerator();
      allow delete: if isAdmin();
    }

    match /coupons/{doc} {
      allow read: if true;
      allow create, delete: if isManager();
      allow update: if isManager() || (
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['usedCount']) &&
        request.resource.data.usedCount is number &&
        resource.data.usedCount is number &&
        request.resource.data.usedCount == resource.data.usedCount + 1
      );
    }

    match /reviews/{doc} {
      allow read: if true;
      allow create: if true;
      allow delete: if isAdmin();
    }

    match /messages/{doc} {
      allow create: if true;
      allow read, update: if isModerator();
      allow delete: if isAdmin();
    }

    match /customers/{uid} {
      allow read: if isSignedIn() && (request.auth.uid == uid || isAdmin());
      allow create, update: if isSignedIn() && request.auth.uid == uid;
      allow delete: if isAdmin();
    }

    match /settings/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /staff/{uid} {
      allow read: if isStaff() || isAdmin() || (isSignedIn() && request.auth.uid == uid);
      allow create, update, delete: if isAdmin();
    }

    match /activity_log/{doc} {
      allow read: if isAdmin();
      allow create: if isStaff();
      allow update, delete: if false;
    }
  }
}
```

## Critical Notes
- **Guest stock decrement** — order place-এ stock কমাতে পারে
- **Guest coupon usedCount** — exact +1 allowed
- **Owner UID:** `IeE3IFsCrmSE5hfzhXWbtes32To2`

---

# 📧 PART 5.7: Email Notifications (EmailJS)

## Config Registry

| Item | Value |
|------|-------|
| Account Email | `twhob71122@gmail.com` |
| Public Key | `UOTXJmNFXydPMnWDP` |
| Service ID | `Heartix` |
| Admin Template ID | `template_yd1wxrt` |
| Customer Template ID | `template_2utpxqd` |
| Admin Email | `twhob71122@gmail.com` |

## Key Functions

### `notifyOrderPlaced(orderData)`
Order placed → Admin alert + Customer confirmation.

### `notifyStatusChange(orderData)`
Status change → Customer email only.

## Trigger Points

| Trigger | Function | Where |
|---------|----------|-------|
| Order placed | `notifyOrderPlaced()` | `checkout.js` → `placeOrder()` |
| Status change (admin) | `notifyStatusChange()` | `admin.js` → `confirmStatusChange()` |
| Status change (moderator) | `notifyStatusChange()` | `moderator.js` → `confirmStatusChange()` |

## Status Messages

| Status | Message |
|--------|---------|
| pending | ⏳ Order Pending |
| confirmed | ✅ Order Confirmed! |
| shipped | 🚚 Order Shipped! |
| delivered | 📦 Order Delivered! |
| cancelled | ❌ Order Cancelled |

## Free Tier Limits

| Provider | Free |
|----------|------|
| EmailJS | 200/month |
| Brevo | 300/day (~9000/month) |
| Resend | 3000/month |

---

# 📱 PART 5.8: WhatsApp Integration

## Overview

WhatsApp = **wa.me deep link** — কোনো API নেই, 100% free। Admin panel থেকে ON/OFF।

## Config (Firestore)

```js
// settings/main
integrations: {
  whatsapp: {
    enabled: true,
    number: "8801712345678"
  }
}
```

**Number format:** `88` + `01XXXXXXXXX` থেকে `0` বাদ = `8801712345678`

## Admin Panel Setup

```
📱 WhatsApp Orders    [ON]
   ✅ Enable WhatsApp Order Buttons
   Number: 8801712345678
   ⓘ Country code সহ (88 দিয়ে শুরু, space ছাড়া)
   ✓ 100% Free — wa.me link ব্যবহার হবে
```

## Where Buttons Appear

### 1. Order Success Page
**File:** `order-success.js` + `order-success.html`
- Button: "Confirm on WhatsApp" (full-width, সবুজ)
- Auto-build message: order number, name, total, payment, items

### 2. Checkout Page
**File:** `checkout-whatsapp.js` + `checkout.html`
- Button: "Order via WhatsApp" (PLACE ORDER-এর নিচে)
- Reads customer form + cart items

### 3. Product Page
**File:** `product.js` + `product.html`
- ৩টা compact button: **WhatsApp | Call | Share**
- Integration বন্ধ থাকলে WhatsApp button hide
- Reads `integrations.whatsapp.number`

### 4. Admin Order Card
**File:** `admin.js` → `renderAdminOrders()`
- ২টা button: **Call** (navy) + **WhatsApp** (green)
- WhatsApp message: `Order HX... — Heartix`

## Validation

```js
if (waEnabled && !waNumber) return toast('WhatsApp Number দিন', 'error');
if (waEnabled && !/^88\d{10,13}$/.test(waNumber)) return toast('WhatsApp Number ৮৮ দিয়ে শুরু, space ছাড়া', 'error');
```

## Firestore Key IDs
- `#int-wa-enabled` — checkbox
- `#int-wa-number` — text input
- `#wa-status` — badge

## Common Issues

| সমস্যা | কারণ | সমাধান |
|--------|------|--------|
| Product page-এ ভুল নাম্বার | `settings.whatsapp` পড়ছে | `product.js` — `integrations.whatsapp.number` |
| Button দেখাচ্ছে না | `enabled: false` বা number খালি | Admin → Settings |
| "Number isn't on WhatsApp" | Customer-এর WhatsApp নেই | Manual call |

---

# ⬜ PART 6: বাকি কাজ

## 🥇 Phase 3: Admin Tools
1. Landing Pages Tab
2. Inventory Alert (stock < 5 email)
3. Bulk Order Update

## 🥉 Phase 4: Analytics
1. Sales Dashboard (Chart.js)
2. Customer Segmentation
3. Profit Calculator
4. Return Rate Tracking

## 📱 Phase 5: Customer UX
1. PWA Setup
2. Push Notification
3. Dark Mode
4. Reviews with Images
5. Pre-order System

## 🎯 Phase 6: Marketing
1. Abandoned Cart Recovery
2. Refer & Earn
3. Loyalty Points
4. Spin Wheel
5. Product Bundle

---

**❌ কখনো করব না:**
- SMS gateway (BulkSMSBD)
- bKash gateway (auto payment)
- Nagad gateway (auto payment)
- Facebook/Instagram auto-API

শুধু manual bKash/Nagad number রাখা আছে checkout-এ customer-কে দেখানোর জন্য — এটা gateway নয়, শুধু text info।

---

# 🚨 PART 7: Rules (কী করবেন, কী করবেন না)

## ✅ সবসময়
1. `escapeHtml()` — user input render
2. `serverTimestamp()` — Firestore
3. Transaction — price calc
4. Relative paths — `./firebase.js`
5. `type="module"` — script tag
6. Cache bypass — test-এ `?v=X`
7. Console.log — file শেষে
8. বাংলা message — user-facing
9. Number font → Inter Bold
10. `logActivity()` — significant actions
11. `await` before navigation — email/async
12. WhatsApp number: `88` দিয়ে শুরু, space ছাড়া

## ❌ কখনো না
1. `common.css` direct edit
2. API keys client-side (EmailJS Public Key ছাড়া)
3. `escapeHtml()` skip
4. `eval()`
5. `allow if true` in rules
6. Admin UID manual remove
7. `common.css`/`firebase.js` delete
8. ৫+ images
9. Stock 0-এ order allow
10. Duplicate `logActivity` system
11. Fire-and-forget async before redirect

---

# 🔐 PART 8: Security

## ✅ যা আছে
- Firestore rules (role-based)
- XSS protection (`escapeHtml`)
- Server-side price (transaction)
- Back button trap
- IP flagging
- Coupon double-validation
- Activity audit trail
- Secondary Firebase app
- EmailJS Public Key (safe for client)
- Email config in Firestore (protected by rules)

## 🚫 কখনো না
- Firestore-এ `allow if true`
- EmailJS Private Key client-side
- Admin credentials hardcode
- `eval()`
- Password plain text

---

# 🛠️ PART 9: Recovery Guide

## Common Problems

| সমস্যা | সমাধান |
|--------|-------|
| White screen | Console → import error |
| 404 on css/js | Path check |
| Permission denied | Rules check |
| Index error | Error link → Create Index |
| Staff tab খালি | `staff/{uid}` doc check |
| Activity log খালি | Console → import error |
| Email আসছে না | `await` before navigation + EmailJS history |
| WhatsApp button নেই | `integrations.whatsapp.enabled` check |
| WhatsApp ভুল নাম্বার | `integrations.whatsapp.number` check |
| Back button bypass | `history.pushState` |

## Staff/Activity Recovery

### Staff tab-এ "No staff found"
1. Firestore → `staff` collection
2. Your UID-তে doc আছে?
3. `active: true` + `role: owner`?

### Activity Log empty
1. Console F12 → errors
2. `staff-activity.js loaded` print?
3. `activity_log` collection-এ data?

### WhatsApp button সমস্যা
1. Admin → Settings → WhatsApp card-এ "ON"?
2. Number format: `8801712345678` (space ছাড়া)
3. Product page-এ `?v=44` reload

---

# 📋 PART 10: Quick Reference

## Global Functions

### Email
- `notifyOrderPlaced(data)` — email-notify.js
- `notifyStatusChange(data)` — email-notify.js

### WhatsApp
- `orderViaWhatsApp()` — checkout-whatsapp.js
- `loadWhatsAppConfirm()` — order-success.js

### Staff
- `openAddStaffModal()`, `saveStaff()`, `openEditStaff(uid)`, `toggleStaffActive(uid)`, `removeStaff(uid)`, `openStaffDetail(uid)`

### Activity
- `logActivity(action, {description, meta})`
- `loadActivity()`, `filterActivity(type, value)`, `refreshActivity()`

### Auth
- `login()`, `logout()`, `loginUser()`, `registerUser()`, `googleSignIn()`, `forgotPassword()`, `logoutUser()`

### Cart
- `addToCart(id)`, `removeFromCart(id)`, `applyCoupon()`, `removeCoupon()`, `changeQty()`, `removeItem()`, `clearCart()`, `moveToWishlist()`, `proceedToCheckout()`

### Checkout
- `placeOrder()`, `showRepeatModal()`, `showWarningModal()`, `showHistoryModal()`

### Admin
- `showTab(tab)`, `openAddModal()`, `editProduct()`, `saveProduct()`, `deleteProduct()`, `openOrderEdit()`, `saveOrderEdit()`, `confirmDeleteOrder()`, `executeDelete()`, `openStatusPicker()`, `selectStatus()`, `confirmStatusChange()`, `filterOrders()`, `exportOrdersCSV()`, `recalcOrderEdit()`, `openCategoryModal()`, `saveCategory()`, `openCouponModal()`, `saveCoupon()`, `openHeroModal()`, `openSectionModal()`, `openBannerModal()`, `openTestimonialModal()`, `saveSettings()`, `saveIntegrations()`

### Moderator
- `login()`, `logout()`, `showTab(tab)`, `filterOrders()`, `filterMessages()`, `openStatusPicker()`, `selectStatus()`, `confirmStatusChange()`

## Key IDs

### Email Settings
- `#int-em-enabled`, `#int-em-publickey`, `#int-em-serviceid`, `#int-em-customertpl`, `#int-em-admintpl`, `#int-em-adminemail`
- `#em-status`

### WhatsApp Settings
- `#int-wa-enabled`, `#int-wa-number`, `#wa-status`
- `#wa-confirm-btn` (order-success)
- `#order-wa-btn` (checkout)
- `#whatsapp-btn` (product)

### Integration Save
- `#save-integrations-btn`

### Staff Modal
- `#staff-modal`, `#staff-name`, `#staff-email`, `#staff-phone`, `#staff-password`, `#staff-role`, `#staff-save-btn`

### Activity Tab
- `#content-activity`, `#activity-list`, `#activity-date-filter`, `#activity-staff-filter`, `#activity-action-filter`

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
| Phase | Status | % |
|-------|--------|---|
| Phase 0 | ✅ | 100% |
| Phase 1 | ✅ | 100% |
| Phase 1.5 (Staff) | ✅ | 100% |
| Phase 2 (Integrations) | ✅ | 100% (4/4) |
| Phase 3-6 | ⏳ | 0% |

**Overall: ~55%**

## File Counts
| Type | Count |
|------|-------|
| HTML | 18 |
| CSS | 13 |
| JS | 26 |
| MD | 2 |

## Cost
| Service | Free |
|---------|------|
| Firebase | 50K reads/day |
| Cloudinary | 25 credits |
| Vercel | 100GB |
| EmailJS | 200/month |
| WhatsApp (wa.me) | Unlimited |
| **Total** | **৳0** |

---

# 🎓 PART 12: অন্যান্য AI-এর জন্য

## Golden Rules
1. এই guide.md আগে পড়ুন
2. একবারে একটাই file edit
3. Full file content দিন
4. Step-by-step বলুন
5. Cache bypass (`?v=X`) mention
6. Deploy wait (2 min)
7. Staff system = `staff/{uid}`
8. Activity log = ONE system (`staff-activity.js`)
9. Email config = `settings/main.integrations.emailjs`
10. WhatsApp config = `settings/main.integrations.whatsapp`
11. **এই ৪টাই final integration** — নতুন integration যোগ করার প্রস্তাব দিবেন না (SMS/bKash gateway/Nagad gateway/auto-API)

## Critical
- কখনো `common.css`/`firebase.js` delete না
- কখনো `escapeHtml()` skip না
- সবসময় `serverTimestamp()`
- দুইটা `logActivity` function কখনো না
- Async operations-এ `await` before redirect

## Contact
- Firebase: `heartix`
- Cloudinary: `ju2w6e9r`
- Support: `twhob71122@gmail.com`
- Owner UID: `IeE3IFsCrmSE5hfzhXWbtes32To2`
- EmailJS: `twhob71122@gmail.com`

---

# 📝 PART 13: Changelog

## v8.0 (16 Oct 2025)
### 📱 WhatsApp Integration + Admin Simplified
- ✅ WhatsApp manual wa.me link (all pages)
- ✅ Order success — Confirm on WhatsApp
- ✅ Checkout — Order via WhatsApp
- ✅ Product page — compact WhatsApp/Call/Share row
- ✅ Admin order card — Call + WhatsApp buttons
- ✅ `checkout-whatsapp.js` (new)
- ✅ `integrations.whatsapp` config in Firestore
- ❌ SMS permanently removed
- ❌ bKash gateway permanently removed
- ❌ Nagad gateway permanently removed
- ❌ Help modal removed
- 🐛 Fix: Product WhatsApp reads from `integrations.whatsapp`
- 🐛 Fix: Order-success dead code removed
- 🎨 Redesign: WhatsApp button — professional design

## v7.0 (16 Oct 2025)
### 📧 Email Notifications
- ✅ EmailJS integration
- ✅ Admin + Customer templates
- ✅ Order placed → 2 emails
- ✅ Status change → customer email
- ✅ Firestore Rules v6

## v6.0 (15 Oct 2025)
- Firebase Rules embedded in guide

## v5.0 (15 Oct 2025)
### Staff + Activity System
- `staff/{uid}` collection
- `activity_log` collection
- Moderator panel

## v4.0 (15 Oct 2025)
- Editable order customer info
- Real-time total update

## v3.0, v2.0, v1.0
(আগের versions)

---

# 🎯 FINAL NOTES

## Next Session
**Start with:** `guide.md` খুলে "Phase 3" বলুন

**Priority:** Phase 3 → 4 → 5 → 6

## Version History
- **v8.0** — WhatsApp Integration + Admin simplified ⭐
- **v7.0** — Email Notifications (EmailJS)
- **v6.0** — Firebase Rules embedded
- **v5.0** — Staff + Activity System
- **v4.0** — Editable orders
- **v3.0** — Reorder system
- **v2.0** — Modular + multi-category
- **v1.0** — Basic e-commerce

---

**Last Updated:** 16 October 2025
**Version:** 8.0
**Purpose:** Single source of truth (self-contained)

*এই guide প্রতিটা commit-এ update করা উচিত।*