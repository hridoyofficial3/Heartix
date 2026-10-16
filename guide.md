# 📖 Heartix — Master Guide v9.0

**Version:** 9.0
**Last Updated:** 17 October 2025
**Live Site:** heartix.vercel.app
**Status:** Phase 0-3 ✅ | Phase 4-6 ⏳
**Maintainer:** Developer + Claude AI
**Purpose:** Single source of truth

---

# 📋 PART 1: এই Guide কীভাবে পড়বেন

## Order
1. **Part 2** — Project পরিচিতি
2. **Part 3** — বর্তমান অবস্থা
3. **Part 4** — File Structure
4. **Part 5** — Firebase Structure
5. **Part 5.5** — Firestore Rules (Full Text)
6. **Part 5.6** — Features Detail
7. **Part 6** — বাকি কাজ
8. **Part 7-9** — Rules, Security, Recovery
9. **Part 10** — Quick Reference

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
| Charts | Chart.js 4.x (CDN) |
| PWA | Service Worker + Manifest |
| Icons | Font Awesome 6 |
| Fonts | Inter + Playfair Display |

## Colors
- Navy: `#0A1628`
- Gold: `#D4A84B`
- Cream: `#FBF8F3`
- WhatsApp Green: `#25D366`
- Purple (Pre-order): `#A855F7`

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

---

# 📊 PART 3: বর্তমান অবস্থা

## ✅ সম্পূর্ণ Features

### Phase 0: Modular File Structure ✅
সব page থেকে inline CSS/JS সরিয়ে আলাদা ফাইলে।

### Phase 1: Reorder System ✅
Category, Section, Product reorder + Featured + Pin to Top।

### Phase 1.5: Staff + Activity System ✅
৫টা role, `staff/{uid}`, `activity_log`, Moderator panel।

### Phase 2: Integrations ✅
| # | Integration | Status |
|---|-------------|--------|
| ১ | Google Analytics (GA4) | ✅ |
| ২ | Facebook Pixel | ✅ |
| ৩ | EmailJS (Email) | ✅ |
| ৪ | WhatsApp (manual wa.me) | ✅ |

### Phase 3: Admin Tools ✅
| # | Feature | Status |
|---|---------|--------|
| ১ | Phone Login (phone_lookup) | ✅ |
| ২ | WhatsApp Checkout Button | ✅ |
| ৩ | Integration Help Panel | ✅ |
| ৪ | Contact WhatsApp Auto-Sync | ✅ |
| ৫ | Messages Bottom Nav | ✅ |
| ৬ | Admin Parallel Loading | ✅ |
| ৭ | Homepage Optimization | ✅ |
| ৮ | Price Font Standardized | ✅ |
| ৯ | Inventory Alert Email | ✅ |
| ১০ | Bulk Order Update | ✅ |
| ১১ | Reviews with Images | ✅ |
| ১২ | Pre-order System | ✅ |
| ১৩ | Analytics Dashboard (Charts) | ✅ |
| ১৪ | Backup & Export JSON | ✅ |
| ১৫ | PWA Setup | ✅ |
| ১৬ | Landing Pages | ✅ |

### Pending (Phase 4-6)
- Sales Dashboard Advanced
- Customer Segmentation
- Profit Calculator
- Product Bundle
- Loyalty Points
- Flash Sale
- Push Notifications
- Abandoned Cart Recovery
- Refer & Earn

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
| `admin.html` | Admin (11 tabs) | common.css, admin.css | 9 JS files |
| `messages.html` | Inbox | common.css, messages.css | messages.js |
| `moderator.html` | Moderator | common.css, moderator.css | moderator.js |
| `landing.html` | Landing Pages | common.css, landing.css | landing.js |
| `about.html`, `faq.html`, `terms.html`, `privacy.html`, `return-policy.html` | Static | common.css | inline |
| `manifest.json` | PWA Manifest | — | — |
| `sw.js` | Service Worker | — | — |

## CSS Files (`css/`)
`common.css`, `index.css`, `product.css`, `cart.css`, `checkout.css`, `account.css`, `wishlist.css`, `contact.css`, `order-success.css`, `track-order.css`, `admin.css`, `messages.css`, `moderator.css`, `landing.css`

## JS Files (`js/`)

| File | Used by | Purpose |
|------|---------|---------|
| `firebase.js` | সব | exports `db`, `auth` |
| `common.js` | সব | helpers + `initIntegrations` |
| `districts.js` | checkout, account, admin | ৬৪ districts |
| `integrations.js` | common.js | GA4 + FB Pixel auto-loader |
| `email-notify.js` | checkout.js, admin.js, moderator.js | `notifyOrderPlaced`, `notifyStatusChange`, `notifyLowStockAlert` |
| `staff-activity.js` | admin.js, messages.js, moderator.js | `logActivity` + lastLogin |
| `admin-activity.js` | admin.html | Activity tab UI |
| `admin-staff.js` | admin.html | Staff CRUD |
| `admin.js` | admin.html | Admin logic (parallel loading) |
| `admin-reorder.js` | admin.html | Reorder system |
| `admin-integrations.js` | admin.html | GA + FB + EmailJS + WhatsApp |
| `admin-back-trap.js` | admin-integrations.js | Back button trap |
| `admin-bulk.js` | admin-integrations.js | CSV bulk upload |
| `admin-bulk-orders.js` | admin.html | Bulk order status update |
| `admin-analytics.js` | admin.html | Chart.js analytics |
| `admin-backup.js` | admin-analytics.js | Stub (backup moved) |
| `admin-preorder-badge.js` | admin-analytics.js | Pre-order badge injection |
| `admin-landing.js` | admin.html | Landing pages CRUD |
| `inventory-alert.js` | admin.html | Low stock email + backup buttons |
| `index.js` | index.html | Homepage |
| `product.js` | product.html | Product page (pre-order + reviews images) |
| `cart.js` | cart.html | Cart (pre-order support) |
| `checkout.js` | checkout.html | Order + email |
| `account.js` | account.html | Auth + phone lookup |
| `wishlist.js` | wishlist.html | Wishlist (pre-order) |
| `contact.js` | contact.html | Contact form |
| `order-success.js` | order-success.html | WhatsApp confirm |
| `track-order.js` | track-order.html | Order lookup |
| `messages.js` | messages.html | Admin inbox |
| `moderator.js` | moderator.html | Moderator panel |
| `landing.js` | landing.html | Customer landing view |

---

# 🗄️ PART 5: Firebase Structure

## Collections

### `products`
```js
{ id, name, price, oldPrice, category, categories: [], stock, brand, description, image, images: [], sortOrder, featured, pinned, createdAt }