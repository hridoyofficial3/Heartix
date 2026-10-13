# 📖 Heartix — Complete Guide

**Last Updated:** 2025
**Live Site:** heartix.vercel.app
**Status:** ৫০% Complete

---

# ✅ যা যা সম্পন্ন হয়েছে (আর করতে হবে না)

## Security
- Firestore Rules deploy
- Admin UID setup
- Vercel domain authorize
- Email/Password Auth enable
- Stock update permission
- Coupon usedCount permission
- Messages + Customer profiles rules

## Files তৈরি/আপডেট (১৬টা)
- admin.html — Coupons + Order Search + CSV + Messages Link
- index.html — Wishlist + Search Suggestions + Recently Viewed
- product.html — Wishlist + Share + Star Fix
- cart.html — Coupon + Clear + Save for Later
- checkout.html — Server Pricing + Atomic Transaction
- order-success.html — Copy Fix
- track-order.html — Badge Fix
- account.html — Login/Register
- wishlist.html — Move All to Cart
- contact.html — Contact Form
- messages.html — Admin Inbox
- moderator.html — Basic Panel
- landing.html — Facebook Landing
- firestore.rules
- README.md
- DEPLOYMENT.md

## Working Features (১২টা)
- Product/Category Management
- Order Place + Track + Manage
- Coupon System
- Customer Login/Register
- Wishlist
- Product Reviews
- Contact Form → Messages
- CSV Export
- Secure Transaction
- Search Suggestions
- Recently Viewed
- Landing Page

## Bug Fixes (৮টা)
- Image undefined
- Star rating logic
- Copy order number
- Cart tampering
- XSS in hero
- Category scroll pause
- Status badge override
- Cart price exploit

**Rating: ৫.৫ → ৮.৪**

---

# ⬜ যা যা বাকি

## 🥇 Phase 0: Modular File Structure (সবার আগে)
- ৪টা Common file বানাব (common.css, firebase.js, common.js, districts.js)
- admin.html → ৩ file-এ ভাগ
- moderator.html → ৩ file-এ ভাগ
- landing.html → ৩ file-এ ভাগ
- index.html → ৩ file-এ ভাগ
- product.html → ৩ file-এ ভাগ
- cart.html → ৩ file-এ ভাগ
- checkout.html → ৩ file-এ ভাগ
- account.html → ৩ file-এ ভাগ
- wishlist.html → ৩ file-এ ভাগ
- contact.html → ৩ file-এ ভাগ
- messages.html → ৩ file-এ ভাগ

## 🥈 Phase 1: Reorder
- Category Reorder
- Product Reorder
- Section Reorder
- Featured Selection
- Pin to Top

## 🥉 Phase 2: Plug & Play Settings
- Settings structure
- SMS (BulkSMSBD) - OFF
- Email (SendGrid) - OFF
- Facebook Pixel - OFF
- bKash Payment - OFF
- Nagad Payment - OFF
- WhatsApp API - OFF
- Google Analytics - OFF

## 🏆 Phase 3: Admin Tools
- Bulk CSV Upload
- Admin → Moderator Tab
- Admin → Landing Pages Tab
- Landing Stats
- Bulk Order Update
- Inventory Alert

## 📊 Phase 4: Analytics
- Sales Dashboard
- Customer Segmentation
- Profit Calculator
- Return Rate Tracking
- Top Products Report
- Monthly Report

## 📱 Phase 5: Customer UX
- PWA Setup
- Push Notification
- Dark Mode
- Reviews with Images
- Pre-order System
- Product Variants
- Product Comparison

## 🎯 Phase 6: Marketing
- Facebook Pixel
- Abandoned Cart
- Refer & Earn
- Loyalty Points
- Wishlist Cloud Sync
- Spin Wheel
- Product Bundle

---

# 🚀 কালকের কাজ

## Step 1: ৪টা Common File বানাব
1. `css/common.css` — common styles
2. `js/firebase.js` — Firebase config
3. `js/common.js` — common functions
4. `js/districts.js` — জেলার list

**সময়: ৩০ মিনিট**

## Step 2: admin.html ভাঙা
- admin.html-এর CSS → css/admin.css
- admin.html-এর JS → js/admin.js
- admin.html-এ link যোগ করা
- Test করা

**সময়: ১ ঘণ্টা**

## Step 3: বাকি দিনগুলো
- ২য় দিন: moderator.html, landing.html
- ৩য় দিন: index.html, product.html
- ৪র্থ দিন: cart.html, checkout.html, account.html
- ৫ম দিন: wishlist.html, contact.html, messages.html

---

# 📁 File Structure