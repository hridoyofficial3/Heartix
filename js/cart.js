/* ========== CART PAGE STYLES ========== */

body {
    font-family: 'Inter', sans-serif;
    background: #FBF8F3;
    overflow-x: hidden;
}

/* Product image */
.prod-img {
    object-fit: contain;
    background: #f9fafb;
}

/* Coupon input focus */
.coupon-input:focus {
    border-color: #D4A84B !important;
    box-shadow: 0 0 0 3px rgba(212,168,75,0.12);
}

/* ========== FORCE PLAYFAIR ON ALL PRICES ========== */
.price-number,
#subtotal,
#discount-amount,
#delivery-charge,
#total,
#free-delivery-amount,
.price-per-item,
.price-line-total {
    font-family: 'Playfair Display', serif !important;
    font-weight: 700 !important;
    letter-spacing: -0.02em;
}

/* Line item price (৳ 250 - per item) */
.price-per-item {
    font-size: 18px;
    color: #0A1628;
}

/* Line total (৳ 1400 - right side) */
.price-line-total {
    font-size: 18px;
    color: #0A1628;
}

/* Summary numbers */
#subtotal,
#discount-amount,
#delivery-charge {
    font-size: 18px;
}

#total {
    font-size: 26px;
}