// ============================================================
// HEARTIX THEME - Dark Mode Toggle
// ============================================================
(function() {
    'use strict';

    var STORAGE_KEY = 'heartix_theme';

    var CSS = [
        'body.dark-mode { background: #0F1729 !important; color: #E5E7EB !important; }',
        'body.dark-mode .bg-white { background: #1A2235 !important; }',
        'body.dark-mode .bg-gray-50 { background: #1F2A3E !important; }',
        'body.dark-mode .bg-cream { background: #1F2A3E !important; }',
        'body.dark-mode .bg-gray-100 { background: #253048 !important; }',
        'body.dark-mode .text-navy, body.dark-mode .navy-text { color: #E5E7EB !important; }',
        'body.dark-mode .text-gray-500, body.dark-mode .text-gray-600 { color: #9CA3AF !important; }',
        'body.dark-mode .text-gray-400 { color: #6B7280 !important; }',
        'body.dark-mode .text-gray-700 { color: #D1D5DB !important; }',
        'body.dark-mode .border-gray-100 { border-color: #253048 !important; }',
        'body.dark-mode .border-gray-200 { border-color: #2A3548 !important; }',
        'body.dark-mode .border-gray-300 { border-color: #374151 !important; }',
        'body.dark-mode .glass { background: rgba(15,23,41,0.85) !important; border-color: #253048 !important; }',
        'body.dark-mode input, body.dark-mode select, body.dark-mode textarea { background: #1F2A3E !important; color: #E5E7EB !important; border-color: #2A3548 !important; }',
        'body.dark-mode input::placeholder, body.dark-mode textarea::placeholder { color: #6B7280 !important; }',
        'body.dark-mode .shimmer { background: linear-gradient(90deg, #1A2235 25%, #253048 50%, #1A2235 75%); background-size: 1000px 100%; }',
        'body.dark-mode header img[src*="logo"] { background: #FBF8F3; border-radius: 6px; padding: 1px 3px; }',
        '#theme-toggle { position: fixed; right: 12px; bottom: 96px; z-index: 40; width: 44px; height: 44px; border-radius: 50%; background: #0A1628; color: #D4A84B; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.25); cursor: pointer; border: 2px solid rgba(212,168,75,0.3); font-size: 17px; }',
        'body.dark-mode #theme-toggle { background: #D4A84B; color: #0A1628; border-color: rgba(255,255,255,0.2); }'
    ].join('\n');

    function getSaved() {
        try { return localStorage.getItem(STORAGE_KEY) || 'light'; }
        catch (e) { return 'light'; }
    }

    function save(t) {
        try { localStorage.setItem(STORAGE_KEY, t); } catch (e) {}
    }

    function apply(t) {
        if (t === 'dark') {
            document.documentElement.classList.add('dark-mode');
            if (document.body) document.body.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            if (document.body) document.body.classList.remove('dark-mode');
        }
        var btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.innerHTML = t === 'dark'
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        }
    }

    function toggle() {
        var current = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        var next = current === 'dark' ? 'light' : 'dark';
        apply(next);
        save(next);
    }

    function injectCSS() {
        if (document.getElementById('theme-dark-css')) return;
        var style = document.createElement('style');
        style.id = 'theme-dark-css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function injectBtn() {
        if (document.getElementById('theme-toggle')) return;
        var path = window.location.pathname.toLowerCase();
        if (path.indexOf('admin') !== -1 || path.indexOf('moderator') !== -1 || path.indexOf('messages') !== -1) return;

        var btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.setAttribute('aria-label', 'Toggle theme');
        btn.onclick = toggle;
        document.body.appendChild(btn);
    }

    if (document.head) injectCSS();

    var saved = getSaved();
    if (saved === 'dark') document.documentElement.classList.add('dark-mode');

    function init() {
        apply(saved);
        injectBtn();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();