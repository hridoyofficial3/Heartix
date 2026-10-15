# 📖 Heartix — Master Guide v7.0

**Version:** 7.0
**Last Updated:** 16 October 2025, 4:30 AM
**Live Site:** heartix.vercel.app
**Status:** Phase 0 ✅ + Phase 1 ✅ + Staff ✅ + Email ✅ | Phase 2 চলছে
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
7. **Part 5.7** — Email Notifications (EmailJS) ⭐ নতুন
8. **Part 6** — বাকি কাজ
9. **Part 7-9** — Rules, Security, Recovery
10. **Part 10** — Quick Reference

## নতুন AI-এর জন্য
- **File এলোমেলো** → Part 4-এর File Identification
- **Error** → Part 9
- **Function খুঁজলে** → Part 10
- **Staff/Activity** → Part 5.5
- **Firestore Rules** → Part 5.6
- **Email যোগ করতে** → Part 5.7

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
| Hosting | Vercel |
| Icons | Font Awesome 6 |
| Fonts | Inter + Playfair Display |

## Colors
- Navy: `#0A1628`
- Gold: `#D4A84B`
- Cream: `#FBF8F3`
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

## EmailJS Config ⭐
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
সব page-এর inline CSS/JS আলাদা ফাইলে।

### Phase 1: Reorder System ✅
- Category, Section, Product reorder
- Featured + Pin to Top

### Phase 1.5: Staff + Activity System ✅
- Firestore Rules v5
- ৫টা role: Owner, Admin, Manager, Moderator, Delivery
- Staff CRUD (secondary Firebase app)
- Full activity audit trail
- Last login tracker
- Moderator panel

### Phase 2: Integrations (চলছে) ✅
- **Google Analytics** ✅
- **Facebook Pixel** ✅
- **Email Notifications (EmailJS)** ✅ ⭐ নতুন
- SMS (BulkSMSBD) — pending
- WhatsApp API — pending
- bKash Gateway — pending
- Nagad Gateway — pending

---

## 🆕 নতুন Features (v7.0)

### Email Notification System ⭐

**কী কী email যায়:**
1. **Order Placed** → Admin Alert (new order) + Customer Confirmation
2. **Status Change** → Customer Update (pending/confirmed/shipped/delivered/cancelled)

**Features:**
- Toggle-based (Admin panel থেকে ON/OFF)
- Default OFF — keys paste করলে ON
- Non-blocking (email fail হলেও order place হয়)
- 5-সেকেন্ড timeout (user বেশি wait করে না)
- Auto-trigger from checkout + status change

**Templates:**
- **Template 1** (`template_yd1wxrt`) — Admin new order alert
- **Template 2** (`template_2utpxqd`) — Universal customer (order + status)

---

## 🐛 Recent Fixes (v7.0)
1. Firestore Rules — Guest checkout-এ stock decrement allow
2. Coupon usedCount — Guest increment allowed (only +1)
3. Email await before navigation — email send হওয়ার আগে page navigate বন্ধ

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
| `email-notify.js` ⭐ | checkout.js, admin.js, moderator.js | `notifyOrderPlaced`, `notifyStatusChange` |
| `staff-activity.js` | admin.js, messages.js, moderator.js | `logActivity` + lastLogin |
| `admin-activity.js` | admin.html | Activity tab UI |
| `admin-staff.js` | admin.html | Staff CRUD |
| `admin.js` | admin.html | Admin logic + activity logs + email |
| `admin-reorder.js` | admin.html | Reorder system |
| `admin-integrations.js` | admin.html | GA + FB + EmailJS settings UI |
| `admin-back-trap.js` | admin-integrations.js | Back button trap |
| `admin-bulk.js` | admin-integrations.js | CSV bulk upload |
| `index.js`, `product.js`, `cart.js` | respective | Page logic |
| `checkout.js` | checkout.html | Order + IP + repeat + **email** |
| `account.js`, `wishlist.js`, `contact.js` | respective | Page logic |
| `order-success.js`, `track-order.js` | respective | Post-order logic |
| `messages.js` | messages.html | Admin inbox + log |
| `moderator.js` | moderator.html | Moderator + status log + **email** |

## File Identification Guide

### HTML চেনার নিয়ম
- **Title tag দেখুন** — যেমন "Admin Control - Heartix" = `admin.html`
- **শেষের script দেখুন** — `admin-reorder.js` + `admin.js` + `admin-integrations.js` + `staff-activity.js` + `admin-activity.js` + `admin-staff.js` = `admin.html`

### JS চেনার নিয়ম
| Unique Function | File |
|-----------------|------|
| `logActivity` | staff-activity.js |
| `notifyOrderPlaced`, `notifyStatusChange` | email-notify.js |
| `openAddStaffModal`, `saveStaff`, `removeStaff` | admin-staff.js |
| `renderAdminOrders`, `confirmStatusChange` | admin.js, moderator.js |
| `placeOrder` | checkout.js |
| `loadActivity`, `refreshActivity` | admin-activity.js |

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
    emailjs: { enabled, publicKey, serviceId, customerTemplateId, adminTemplateId, adminEmail }
  }
}
```

### `staff` ⭐
```js
{ uid, name, email, phone, role, active, lastLogin, createdAt, createdBy, updatedAt, updatedBy }
```

### `activity_log` ⭐
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

    // ====== HELPERS ======
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

    // ====== PRODUCTS ======
    match /products/{doc} {
      allow read: if true;
      allow create: if isManager();
      // Manager+ full edit, OR guest can ONLY decrease stock (guest checkout)
      allow update: if isManager() || (
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['stock']) &&
        request.resource.data.stock is number &&
        resource.data.stock is number &&
        request.resource.data.stock < resource.data.stock &&
        resource.data.stock > 0
      );
      allow delete: if isAdmin();
    }

    // ====== ORDERS ======
    match /orders/{doc} {
      allow read: if true;
      allow create: if true;
      allow update: if isModerator();
      allow delete: if isAdmin();
    }

    // ====== COUPONS ======
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

    // ====== REVIEWS ======
    match /reviews/{doc} {
      allow read: if true;
      allow create: if true;
      allow delete: if isAdmin();
    }

    // ====== MESSAGES ======
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

    // ====== SETTINGS ======
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

## Critical Notes
- **Guest stock decrement** — order place-এ stock কমাতে পারে
- **Guest coupon usedCount** — exact +1 allowed
- **Other updates** — শুধু Manager+
- **Owner UID:** `IeE3IFsCrmSE5hfzhXWbtes32To2`

---

# 📧 PART 5.7: Email Notifications (EmailJS) ⭐ নতুন

## Overview

EmailJS = third-party email service। Client-side থেকে email পাঠায়, কোনো backend লাগে না।

**Features:**
- Free tier: **200 emails/month**
- Paid: $7/month = 1000 emails
- Alternative: **Brevo** (free 300/day = 9000/month)

## Config Registry

| Item | Value |
|------|-------|
| Account Email | `twhob71122@gmail.com` |
| Account Password | `Heartix2025!Admin` |
| Public Key | `UOTXJmNFXydPMnWDP` |
| Service ID | `Heartix` |
| Admin Template ID | `template_yd1wxrt` |
| Customer Template ID | `template_2utpxqd` |
| Admin Email (recipient) | `twhob71122@gmail.com` |
| From Name | `Heartix` |
| Reply To | `twhob71122@gmail.com` |

## Architecture

```
Order Placed / Status Changed
    ↓
notifyOrderPlaced() / notifyStatusChange()
    ↓
email-notify.js — checks config from Firestore
    ↓
If enabled: Load EmailJS SDK → Send 2 emails
    ↓
Template substitution:
  - Admin:    {{order_number}}, {{customer_name}}, {{customer_phone}}, {{customer_address}}, {{total}}
  - Customer: {{to_email}}, {{custom_subject}}, {{status_message}}, {{status_description}}, {{customer_name}}, {{order_number}}, {{total}}
```

## Key Functions (`email-notify.js`)

### `notifyOrderPlaced(orderData)`
```javascript
await notifyOrderPlaced({
  orderNumber: 'HX251016ABC',
  customerName: 'Imran',
  customerPhone: '01712345678',
  customerEmail: 'customer@gmail.com',
  customerAddress: 'Dhaka',
  total: 1440
});
// Sends: Admin alert + Customer confirmation
```

### `notifyStatusChange(orderData)`
```javascript
await notifyStatusChange({
  orderNumber: 'HX251016ABC',
  customerName: 'Imran',
  customerEmail: 'customer@gmail.com',
  newStatus: 'confirmed',  // pending/confirmed/shipped/delivered/cancelled
  total: 1440
});
// Sends: Customer status update email
```

## Email Trigger Points

| Trigger | Function | Where |
|---------|----------|-------|
| Order placed | `notifyOrderPlaced()` | `checkout.js` → `placeOrder()` |
| Status change (admin) | `notifyStatusChange()` | `admin.js` → `confirmStatusChange()` |
| Status change (moderator) | `notifyStatusChange()` | `moderator.js` → `confirmStatusChange()` |

## Status Messages

| Status | Message | Description |
|--------|---------|-------------|
| pending | ⏳ Order Pending | Your order is pending confirmation. |
| confirmed | ✅ Order Confirmed! | Your order is confirmed. Delivery in 2-3 days. |
| shipped | 🚚 Order Shipped! | Your order has been shipped and is on the way. |
| delivered | 📦 Order Delivered! | Your order has been delivered successfully. Thank you! |
| cancelled | ❌ Order Cancelled | Your order has been cancelled. Contact us for more info. |

## Admin Panel Setup (Settings → Integrations)

```
📧 Email Notifications     [ON]
   ✅ Enable Email Notifications
   Public Key: UOTXJmNFXydPMnWDP
   Service ID: Heartix
   Customer Template ID: template_2utpxqd
   Admin Template ID: template_yd1wxrt
   Admin Email: twhob71122@gmail.com
```

## Firestore Storage
```js
// settings/main
integrations: {
  emailjs: {
    enabled: true,
    publicKey: "UOTXJmNFXydPMnWDP",
    serviceId: "Heartix",
    customerTemplateId: "template_2utpxqd",
    adminTemplateId: "template_yd1wxrt",
    adminEmail: "twhob71122@gmail.com"
  }
}
```

## How to Update EmailJS Config

### Option A: Admin Panel (সহজ)
```
Settings → Integrations → Email Notifications
→ Change fields → SAVE INTEGRATIONS
```

### Option B: EmailJS Dashboard (Gmail change)
```
dashboard.emailjs.com → Email Services
→ Disconnect → Connect new Gmail
```

### Option C: New Template
```
dashboard.emailjs.com → Email Templates
→ Edit template → Save
```

### Option D: Switch Provider (Brevo/Resend)
```
1. New provider-এ account + keys
2. Admin panel-এ keys paste
3. (Optional) email-notify.js-এ code change — যদি API structure আলাদা হয়
```

## Free Tier Limits

| Provider | Free | Paid Entry |
|----------|------|-----------|
| EmailJS | 200/month | $7/month = 1000 |
| Brevo | 300/day (~9000/month) | $9/month = 5000 |
| Resend | 3000/month | $20/month |
| Mailgun | 100/day | $15/month |

## Common Issues

| সমস্যা | কারণ | সমাধান |
|--------|------|--------|
| Email আসছে না | Page navigation আগেই হয়েছে | `await` before redirect — checkout.js check |
| "Missing permissions" | Rules-এ stock decrement allow নেই | Rules updated (v6) |
| Template variable mismatch | Template-এ variable নেই | EmailJS template edit |
| "Public Key required" | Admin panel-এ key খালি | Settings-এ paste |
| Free tier exceeded | 200/month পার | Paid plan / Provider switch |

---

# ⬜ PART 6: বাকি কাজ

## 🥇 Phase 2 — বাকি (চলছে)
- **SMS (BulkSMSBD)** — Vercel serverless, ২-৩ ঘণ্টা
- **WhatsApp API** — ২ ঘণ্টা
- **bKash Gateway** — ৪-৬ ঘণ্টা
- **Nagad Gateway** — ৪-৬ ঘণ্টা

## 🥈 Phase 3: Admin Tools
1. Bulk CSV Upload ✅ completed
2. Moderator Tab ✅ completed
3. Landing Pages Tab
4. Inventory Alert (stock < 5 email)
5. Bulk Order Update

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
11. **`await` before navigation** — email/async operations

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

## ⚠️ যোগ করা উচিত
- Rate limiting (serverless)
- reCAPTCHA on register
- Email verification
- Admin 2FA
- Weekly Firestore export

## 🚫 কখনো না
- Firestore-এ `allow if true`
- EmailJS Private Key client-side-এ
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
| **Email আসছে না** | `await` before navigation + EmailJS history |
| **"Missing permissions" order place-এ** | Rules update (stock decrement allow) |
| **Password reset** | Firebase Console → Auth → Reset |
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
4. `staff/{your-uid}` doc-এ name, email?

### Email আসছে না
1. Admin panel → Settings → Email Notification card-এ "ON"?
2. EmailJS dashboard → History → status?
3. Gmail Spam folder?
4. Console-এ `Email notification failed` error?
5. `notifyOrderPlaced()` `await` করা আছে? (checkout.js)

### Rules Publish Procedure
1. Console → Firestore → Rules
2. Select all → Delete
3. PART 5.6 থেকে paste
4. **Publish**

---

# 📋 PART 10: Quick Reference

## Global Functions

### Email ⭐
- `notifyOrderPlaced(data)` — email-notify.js
- `notifyStatusChange(data)` — email-notify.js
- `saveIntegrations()` — admin-integrations.js

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
- `showTab(tab)`, `openAddModal()`, `editProduct()`, `saveProduct()`, `deleteProduct()`, `openOrderEdit()`, `saveOrderEdit()`, `confirmDeleteOrder()`, `executeDelete()`, `openStatusPicker()`, `selectStatus()`, `confirmStatusChange()`, `filterOrders()`, `exportOrdersCSV()`, `recalcOrderEdit()`, `openCategoryModal()`, `saveCategory()`, `openCouponModal()`, `saveCoupon()`, `openHeroModal()`, `openSectionModal()`, `openBannerModal()`, `openTestimonialModal()`, `saveSettings()`

### Moderator
- `login()`, `logout()`, `showTab(tab)`, `filterOrders()`, `filterMessages()`, `openStatusPicker()`, `selectStatus()`, `confirmStatusChange()`

## Key IDs

### Email Settings
- `#int-em-enabled`, `#int-em-publickey`, `#int-em-serviceid`, `#int-em-customertpl`, `#int-em-admintpl`, `#int-em-adminemail`
- `#em-status`, `#save-integrations-btn`

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
| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0 | ✅ | 100% |
| Phase 1 | ✅ | 100% |
| Phase 1.5 (Staff) | ✅ | 100% |
| Phase 2 | ⏳ | 50% (GA+FB+Email = 3/7) |
| Phase 3-6 | ⏳ | 0% |

**Overall: ~50%**

## File Counts
| Type | Count |
|------|-------|
| HTML | 18 |
| CSS | 13 |
| JS | 26 |
| MD | 2 |
| PNG | 1 |
| **Total** | **60** |

## Cost
| Service | Free | Usage |
|---------|------|-------|
| Firebase | 50K reads/day | <4K |
| Cloudinary | 25 credits | <10 |
| Vercel | 100GB | <2GB |
| EmailJS | 200/month | <50 |
| **Total** | **৳0** | — |

---

# 🎓 PART 12: অন্যান্য AI-এর জন্য

## Golden Rules
1. এই guide.md আগে পড়ুন
2. একবারে একটাই file edit
3. Full file content দিন
4. Step-by-step বলুন
5. Cache bypass (`?v=X`) mention
6. Deploy wait (2 min)
7. Staff system = `staff/{uid}` (NOT `settings/moderators.uids`)
8. Activity log = ONE system (`staff-activity.js`)
9. Email config = Firestore `settings/main.integrations.emailjs`

## Critical
- কখনো `common.css`/`firebase.js` delete না
- কখনো `escapeHtml()` skip না
- কখনো EmailJS Private Key client-side না
- সবসময় `serverTimestamp()`
- **দুইটা `logActivity` function কখনো না**
- **Async operations-এ `await` before redirect**

## Contact
- Firebase: `heartix`
- Cloudinary: `ju2w6e9r`
- Support: `twhob71122@gmail.com`
- Owner UID: `IeE3IFsCrmSE5hfzhXWbtes32To2`
- EmailJS: `twhob71122@gmail.com`

---

# 📝 PART 13: Changelog

## v7.0 (16 Oct 2025, 4:30 AM)
### 📧 Email Notifications
- ✅ EmailJS integration (Free tier 200/month)
- ✅ Admin + Customer templates
- ✅ Order placed → 2 emails
- ✅ Status change → customer email
- ✅ Admin panel toggle (Settings → Integrations)
- ✅ Firestore Rules v6 (guest stock/coupon update)
- ✅ `email-notify.js` helper
- ✅ Fix: await before navigation

## v6.0 (15 Oct 2025, 10:30 PM)
- Firebase Rules embedded in guide
- Self-contained documentation

## v5.0 (15 Oct 2025, 10 PM)
### Staff + Activity System
- `staff/{uid}` collection
- `activity_log` collection
- `staff-activity.js`, `admin-activity.js`, `admin-staff.js`
- Moderator panel

## v4.0 (15 Oct 2025, 5 AM)
- Editable order customer info
- Real-time total update
- Custom delete modal

## v3.0, v2.0, v1.0
(আগের versions)

---

# 🎯 FINAL NOTES

## এই Guide যেকোনো AI-কে দিলে
1. Project বুঝবে
2. File identify করতে পারবে
3. Priority order জানবে
4. Security maintain করবে
5. Error recovery করতে পারবে
6. Staff + Activity handle করতে পারবে
7. Firestore Rules deploy করতে পারবে
8. **Email system configure করতে পারবে (Part 5.7)** ⭐

## Next Session
**Start with:** `guide.md` খুলে "Phase 2" বলুন

**Priority:** Phase 2 → 3 → 4 → 5 → 6

**Estimated remaining:** ~২০-২৫ ঘণ্টা

## Version History
- **v7.0** — Email Notifications (EmailJS) ⭐
- **v6.0** — Firebase Rules embedded
- **v5.0** — Staff + Activity System
- **v4.0** — Editable orders
- **v3.0** — Reorder system
- **v2.0** — Modular + multi-category
- **v1.0** — Basic e-commerce

---

**Last Updated:** 16 October 2025, 4:30 AM
**Total Sections:** 13 + Part 5.5 + 5.6 + 5.7
**Purpose:** Single source of truth (self-contained)
**Version:** 7.0

*এই guide প্রতিটা commit-এ update করা উচিত।*