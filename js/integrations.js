// ============================================================
// HEARTIX — Integrations (Google Analytics + Facebook Pixel)
// ============================================================
import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let initialized = false;
let integrationsConfig = null;

// ============ LOAD CONFIG ============
async function fetchIntegrationsConfig() {
    if (integrationsConfig) return integrationsConfig;
    try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (snap.exists()) {
            integrationsConfig = snap.data().integrations || {};
        } else {
            integrationsConfig = {};
        }
    } catch (e) {
        console.warn('Integrations config fetch failed:', e);
        integrationsConfig = {};
    }
    return integrationsConfig;
}

// ============ GOOGLE ANALYTICS (GA4) ============
function loadGoogleAnalytics(measurementId) {
    if (!measurementId || typeof measurementId !== 'string') return;
    if (measurementId.length < 5) return;
    if (document.getElementById('ga-script')) return;

    // gtag.js
    const script1 = document.createElement('script');
    script1.id = 'ga-script';
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(script1);

    // inline config
    const script2 = document.createElement('script');
    script2.id = 'ga-config';
    script2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId.replace(/'/g, '')}');
    `;
    document.head.appendChild(script2);

    console.log('✅ Google Analytics loaded:', measurementId);
}

// ============ FACEBOOK PIXEL ============
function loadFacebookPixel(pixelId) {
    if (!pixelId || typeof pixelId !== 'string') return;
    if (pixelId.length < 5) return;
    if (window._fbq) return; // already loaded

    /* eslint-disable */
    !function(f,b,e,v,n,t,s){
        if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
        t=b.createElement(e);t.async=!0;t.src=v;
        s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', pixelId.replace(/'/g, ''));
    window.fbq('track', 'PageView');

    // noscript fallback
    if (!document.getElementById('fb-pixel-noscript')) {
        const noscript = document.createElement('noscript');
        noscript.id = 'fb-pixel-noscript';
        const img = document.createElement('img');
        img.height = 1;
        img.width = 1;
        img.style.display = 'none';
        img.src = 'https://www.facebook.com/tr?id=' + encodeURIComponent(pixelId) + '&ev=PageView&noscript=1';
        noscript.appendChild(img);
        document.body.appendChild(noscript);
    }

    console.log('✅ Facebook Pixel loaded:', pixelId);
}

// ============ PUBLIC: TRACK EVENT ============
export function trackEvent(eventName, params) {
    if (!eventName) return;
    try {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params || {});
        }
        if (typeof window.fbq === 'function') {
            window.fbq('track', eventName, params || {});
        }
    } catch (e) {
        console.warn('trackEvent failed:', e);
    }
}

export function trackPurchase(orderData) {
    if (!orderData) return;
    try {
        // GA4
        if (typeof window.gtag === 'function') {
            window.gtag('event', 'purchase', {
                transaction_id: orderData.orderNumber || '',
                value: Number(orderData.total) || 0,
                currency: 'BDT',
                items: (orderData.items || []).map(i => ({
                    item_id: i.id,
                    item_name: i.name,
                    price: Number(i.price) || 0,
                    quantity: Number(i.quantity) || 1
                }))
            });
        }
        // FB Pixel
        if (typeof window.fbq === 'function') {
            window.fbq('track', 'Purchase', {
                value: Number(orderData.total) || 0,
                currency: 'BDT',
                content_ids: (orderData.items || []).map(i => i.id),
                content_type: 'product'
            });
        }
    } catch (e) {
        console.warn('trackPurchase failed:', e);
    }
}

// ============ INIT ============
export async function initIntegrations() {
    if (initialized) return;
    initialized = true;

    try {
        const config = await fetchIntegrationsConfig();
        if (!config || typeof config !== 'object') return;

        // Google Analytics
        if (config.googleAnalytics && config.googleAnalytics.enabled && config.googleAnalytics.measurementId) {
            loadGoogleAnalytics(String(config.googleAnalytics.measurementId).trim());
        }

        // Facebook Pixel
        if (config.facebookPixel && config.facebookPixel.enabled && config.facebookPixel.pixelId) {
            loadFacebookPixel(String(config.facebookPixel.pixelId).trim());
        }

        console.log('✅ Integrations initialized');
    } catch (e) {
        console.warn('Integrations init failed:', e);
    }
}