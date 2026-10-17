📖 guide.md — Full File (v10.0)

নিচের পুরো কোডটা কপি করে আপনার guide.md ফাইলে পেস্ট করুন। কোনো অংশ বাদ যায়নি, সব একসাথে দেওয়া হলো।

```markdown
# Heartix Master Guide v10.0

Version: 10.0 | Updated: 17 Oct 2025 | Live: heartix.vercel.app
Status: Phase 0-3 ✅ | Phase 4 (Partial) ✅

## PROJECT INFO
Heartix — বাংলাদেশের প্রিমিয়াম স্মার্ট অ্যাপ্লায়েন্স ই-কমার্স সাইট।

Tech Stack:
- Frontend: HTML5 + Tailwind CDN + Vanilla JS (ES Modules)
- Backend: Firebase Firestore + Auth
- Images: Cloudinary (ju2w6e9r / heartix_unsigned)
- Email: EmailJS (UOTXJmNFXydPMnWDP / Heartix)
- WhatsApp: wa.me deep link
- Hosting: Vercel
- Charts: Chart.js 4.x
- PWA: Service Worker + Manifest

Colors: Navy #0A1628 | Gold #D4A84B | Cream #FBF8F3 | WhatsApp #25D366 | Purple #A855F7

Admin: admin@heartix.com | Owner UID: IeE3IFsCrmSE5hfzhXWbtes32To2

## CURRENT STATUS
সম্পূর্ণ (Phase 0-3):
1. Modular structure
2. Reorder system (admin-reorder.js)
3. Staff + Activity (admin-staff.js, staff-activity.js)
4. GA4 + FB Pixel (integrations.js)
5. EmailJS (email-notify.js)
6. WhatsApp manual (checkout-whatsapp.js)
7. Phone login (account.js + phone_lookup)
8. WhatsApp checkout button
9. Integration Help Panel
10. Contact WhatsApp sync
11. Messages bottom nav
12. Admin parallel loading (4x faster)
13. Homepage optimization
14. Price font Inter Bold
15. Inventory Alert Email (inventory-alert.js)
16. Bulk Order Update (admin-bulk-orders.js)
17. Reviews with Images (product.js)
18. Pre-order System (product/cart/checkout.js + admin-preorder-badge.js)
19. Analytics Dashboard (admin-analytics.js)
20. Backup & Export (inventory-alert.js)
21. PWA (manifest.json + sw.js)
22. Landing Pages (landing.html/js + admin-landing.js)
23. Product Bundles (admin-bundle.js)

Pending (Phase 4-6):
Advanced Profit Calculator, Flash Sale, Abandoned Cart, Refer & Earn, Loyalty, Spin Wheel, Push Notifications, Dark Mode.

## FILE STRUCTURE
Root HTML:
index.html (index.css, index.js)
product.html (product.css, product.js)
cart.html (cart.css, cart.js)
checkout.html (checkout.css, checkout.js)
account.html (account.css, account.js)
wishlist.html (wishlist.css, wishlist.js)
contact.html (contact.css, contact.js)
order-success.html (order-success.css, order-success.js)
track-order.html (track-order.css, track-order.js)
admin.html (admin.css + 10 JS files)
messages.html (messages.css, messages.js)
moderator.html (moderator.css, moderator.js)
landing.html (landing.css, landing.js)
about/faq/terms/privacy/return-policy.html (inline)
manifest.json, sw.js

JS Files:
firebase.js — exports db, auth
common.js — helpers + initIntegrations
districts.js — 64 districts
integrations.js — GA4 + FB Pixel
email-notify.js — notifyOrderPlaced, notifyStatusChange, notifyLowStockAlert
staff-activity.js — logActivity + lastLogin
admin-activity.js — Activity tab
admin-staff.js — Staff CRUD
admin.js — Admin logic (parallel)
admin-reorder.js — Reorder
admin-integrations.js — GA/FB/EmailJS/WhatsApp
admin-back-trap.js — Back trap
admin-bulk.js — CSV upload
admin-bulk-orders.js — Bulk order update
admin-analytics.js — Chart.js analytics + Customer Segments
admin-backup.js — Stub (backup moved)
admin-preorder-badge.js — Purple badge
admin-landing.js — Landing CRUD
admin-bundle.js — Bundle CRUD
inventory-alert.js — Low stock + backup
index.js, product.js, cart.js, checkout.js, account.js, wishlist.js, contact.js
order-success.js, track-order.js, messages.js, moderator.js, landing.js

## FIREBASE COLLECTIONS
products: {id, name, price, oldPrice, category, categories[], stock, brand, description, image, images[], sortOrder, featured, pinned, createdAt}
orders: {id, orderNumber, customer{name,phone,email,address,district,thana,ipAddress,isRepeat,orderCount,previousOrderNumbers,flagged,flagReason}, items[{id,name,price,quantity,image,isPreorder}], subtotal, discount, couponCode, deliveryCharge, total, paymentMethod, advancePaid, dueAmount, status, stockDeducted, hasPreorder, adminNote, source, landingSlug, landingTitle, createdAt}
customers: {uid, name, phone, email, address, district, thana, photoURL, provider, createdAt, updatedAt}
phone_lookup: {uid, email, updatedAt} — path: phone_lookup/{phone}
landing_pages: {id, title, slug, badge, subtitle, description, theme, banner, countdownEnd, productIds[], active, createdAt, updatedAt}
bundles: {id, title, productIds[], originalPrice, bundlePrice, discountType, discountValue, image, active, createdAt, updatedAt}
messages: {name, contact, subject, message, read, createdAt}
reviews: {productId, name, rating, text, image, createdAt}
coupons: {code, description, type, value, minOrder, maxUses, usedCount, expiry, active, createdAt, updatedAt}
settings/main: {deliveryCharge, freeDeliveryAbove, contactAddress, contactPhone, contactEmail, whatsapp, bkashNumber, nagadNumber, facebook, instagram, categories[], customSections[], middleBanners[], testimonials[], heroBanners[], integrations{googleAnalytics, facebookPixel, emailjs, whatsapp}}
staff: {uid, name, email, phone, role, active, lastLogin, createdAt, createdBy, updatedAt, updatedBy}
activity_log: {uid, name, email, role, action, description, meta, createdAt}

Indexes: orders(createdAt DESC, orderNumber ASC, customer.phone+createdAt, customer.ipAddress+createdAt, customer.email+createdAt), reviews(createdAt DESC), activity_log(createdAt DESC), landing_pages(slug ASC, createdAt DESC), bundles(createdAt DESC)

## FIRESTORE RULES v11
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function staffDoc() { return get(/databases/$(database)/documents/staff/$(request.auth.uid)).data; }
    function isStaff() { return isSignedIn() && exists(/databases/$(database)/documents/staff/$(request.auth.uid)) && staffDoc().active == true; }
    function role() { return isStaff() ? staffDoc().role : null; }
    function isOwner() { return role() == 'owner'; }
    function isAdmin() { return role() in ['owner', 'admin']; }
    function isManager() { return role() in ['owner', 'admin', 'manager']; }
    function isModerator() { return role() in ['owner', 'admin', 'manager', 'moderator']; }
    function isDelivery() { return role() in ['owner', 'admin', 'manager', 'moderator', 'delivery']; }

    match /products/{doc} {
      allow read: if true;
      allow create: if isManager();
      allow update: if isManager() || (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['stock']) && request.resource.data.stock is number && resource.data.stock is number && request.resource.data.stock < resource.data.stock && resource.data.stock > 0);
      allow delete: if isAdmin();
    }
    match /orders/{doc} {
      allow read: if true;
      allow create: if true;
      allow update: if isModerator();
      allow delete: if isAdmin();
    }
    match /bundles/{doc} {
      allow read: if true;
      allow create, update, delete: if isAdmin() || isManager();
    }
    match /coupons/{doc} {
      allow read: if true;
      allow create, delete: if isManager();
      allow update: if isManager() || (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['usedCount']) && request.resource.data.usedCount is number && resource.data.usedCount is number && request.resource.data.usedCount == resource.data.usedCount + 1);
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
    match /phone_lookup/{phone} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.uid == request.auth.uid && request.resource.data.email is string && request.resource.data.email.size() < 120;
      allow update: if isSignedIn() && resource.data.uid == request.auth.uid && request.resource.data.uid == request.auth.uid;
      allow delete: if isSignedIn() && resource.data.uid == request.auth.uid;
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
    match /landing_pages/{doc} {
      allow read: if true;
      allow create, update, delete: if isAdmin() || isManager();
    }
  }
}

## KEY FUNCTIONS
Email: notifyOrderPlaced(data), notifyStatusChange(data), notifyLowStockAlert(products)
WhatsApp: orderViaWhatsApp(), loadWhatsAppConfirm()
Staff: openAddStaffModal(), saveStaff(), openEditStaff(uid), toggleStaffActive(uid), removeStaff(uid), openStaffDetail(uid)
Activity: logActivity(action, {description, meta}), loadActivity(), filterActivity(type, value), refreshActivity()
Auth: loginUser(), registerUser(), googleSignIn(), forgotPassword(), logoutUser()
Cart: addToCart(id), removeFromCart(id), applyCoupon(), removeCoupon(), changeQty(), removeItem(), clearCart(), moveToWishlist(), proceedToCheckout()
Checkout: placeOrder(), showRepeatModal(), showWarningModal(), showHistoryModal()
Admin: showTab(tab), openAddModal(), editProduct(), saveProduct(), deleteProduct(), openOrderEdit(), saveOrderEdit(), confirmDeleteOrder(), executeDelete(), openStatusPicker(), selectStatus(), confirmStatusChange(), filterOrders(), exportOrdersCSV(), recalcOrderEdit(), openCategoryModal(), saveCategory(), openCouponModal(), saveCoupon(), openHeroModal(), openSectionModal(), openBannerModal(), openTestimonialModal(), saveSettings(), saveIntegrations()
Analytics: setAnalyticsPeriod(period)
Landing Admin: openNewLanding(), editLanding(id), saveLanding(), deleteLanding(id), copyLandingLink(slug), openLandingPreview(slug), openProductPickerLanding(), renderPickerList(), togglePickerProduct(id, checked), confirmProductPicker(), removeSelectedProduct(idx)
Landing Customer: selectProduct(pid), submitOrder(), scrollToOrderForm(), toggleWishlistLanding(id, event), copyOrderNum(num)
Bundle Admin: openNewBundle(), editBundle(id), saveBundle(), deleteBundle(id), toggleBundle(id), openBundleProductPicker(), renderBundlePicker(), toggleBundlePicker(id, checked), confirmBundlePicker(), removeSelectedProduct(idx)
Bundle Customer: openBundleDetail(id), closeBundleDetail(), addBundleToCartFromModal(), addBundleToCart(bundleId)
Backup: handleBackup(), handleSendAlert()

## LOCALSTORAGE KEYS
heartix_cart, heartix_wishlist, heartix_recent, heartix_coupon, heartix_remember, heartix_last_order

## STATUS VALUES
Order: pending, confirmed, shipped, delivered, cancelled
Payment: full-cod, delivery-advance, full-online
Coupon: percentage, fixed
Staff Roles: owner, admin, manager, moderator, delivery
Landing Theme: navy, gold, red, purple
Activity Actions: login, logout, order_status, order_edit, order_delete, product_add, product_edit, product_delete, message_read, message_delete, staff_add, staff_edit, staff_disable, staff_remove, coupon_add, coupon_edit, coupon_delete, category_add, category_edit, category_delete, settings_update

## RULES
সবসময়:
1. escapeHtml() — user input
2. serverTimestamp() — Firestore
3. Transaction — price calc
4. Relative paths — ./firebase.js
5. type="module" — script tag
6. Cache bypass — ?v=X
7. Console.log — file শেষে
8. বাংলা message — user-facing
9. Number font → Inter Bold
10. logActivity() — significant actions
11. await before navigation
12. WhatsApp: 88 দিয়ে শুরু, space ছাড়া
13. Script tag order admin.html-এ maintain

কখনো না:
1. common.css direct edit
2. API keys client-side (EmailJS Public Key ছাড়া)
3. escapeHtml() skip
4. eval()
5. allow if true in rules
6. Admin UID manual remove
7. common.css/firebase.js delete
8. ৫+ images
9. Stock 0-এ order (except pre-order)
10. Duplicate logActivity
11. Fire-and-forget async before redirect
12. Duplicate script tag

## RECOVERY
White screen → Console import error
404 on css/js → Path check
Permission denied → Rules check
Index error → Error link → Create Index
Staff tab খালি → staff/{uid} doc
Activity log খালি → Console errors
Email না আসা → await + EmailJS history
WhatsApp button নেই → integrations.whatsapp.enabled
WhatsApp ভুল নাম্বার → integrations.whatsapp.number
Landing save fail → landing_pages rules
Bundle save fail → bundles rules
Countdown ভুল → Future date check
Chart দেখাচ্ছে না → Chart.js CDN

## STATISTICS
Progress: Phase 0-3: 100% ✅ | Phase 4: 25% ⏳ | Overall: ~70%
File Counts: HTML: 19 | CSS: 14 | JS: 33 | MD: 2 | JSON: 1
Cost: ৳0 (all free tier)

## CHANGELOG
v10.0 (17 Oct 2025): Product Bundles, Customer Segmentation, Landing Pages bug fixes, Bundles Image Upload, Premium Bundle UI, Firestore Rules v11
v9.0 (17 Oct 2025): Phone Login, WhatsApp Checkout, Integration Help Panel, Contact WhatsApp Sync, Messages Bottom Nav, Admin Parallel Loading, Homepage Optimization, Price Font Inter Bold, Inventory Alert Email, Bulk Order Update, Reviews with Images, Pre-order System, Analytics Dashboard, Backup & Export JSON, PWA Setup, Landing Pages, Firestore Rules v10
v8.0 (16 Oct 2025): WhatsApp manual wa.me link, checkout-whatsapp.js new, SMS/bKash/Nagad gateways removed
v7.0 (16 Oct 2025): EmailJS integration, Admin + Customer templates
v5.0 (15 Oct 2025): Staff + Activity System, Moderator panel

## NEXT SESSION
Priority: Phase 4 → Profit Calculator, Flash Sale, Abandoned Cart, Refer & Earn, Loyalty, Spin Wheel.

Golden Rules for AI:
1. এই guide.md আগে পড়ুন
2. সবসময় full file দিন — user mobile-এ edit করতে পারেন না
3. Cache bypass (?v=X) mention
4. Deploy wait (2 min)
5. Staff = staff/{uid}
6. Activity = staff-activity.js
7. Email = settings.main.integrations.emailjs
8. WhatsApp = settings.main.integrations.whatsapp
9. Landing = landing_pages collection
10. Bundle = bundles collection

Contact:
Firebase: heartix
Cloudinary: ju2w6e9r
Support: twhob71122@gmail.com
Owner UID: IeE3IFsCrmSE5hfzhXWbtes32To2

Last Updated: 17 Oct 2025 | Version: 10.0
```