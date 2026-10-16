// ============================================================
// HEARTIX THEME — Dark Mode Toggle (self-injecting)
// ============================================================
(function() {
    'use strict';

    const STORAGE_KEY = 'heartix_theme';

    // ---------- DARK MODE CSS ----------
    const DARK_CSS = `
        body.dark-mode {
            background: #0F1729 !important;
            color: #E5E7EB !important;
        }

        body.dark-mode .bg-white { background: #1A2235 !important; }
        body.dark-mode .bg-gray-50 { background: #1F2A3E !important; }
        body.dark-mode .bg-cream { background: #1F2A3E !important; }
        body.dark-mode .bg-gray-100 { background: #253048 !important; }

        body.dark-mode .text-navy,
        body.dark-mode .navy-text { color: #E5E7EB !important; }
        body.dark-mode .text-gray-500,
        body.dark-mode .text-gray-600 { color: #9CA3AF !important; }
        body.dark-mode .text-gray-400 { color: #6B7280 !important; }
        body.dark-mode .text-gray-700 { color: #D1D5DB !important; }

        body.dark-mode .border-gray-100 { border-color: #253048 !important; }
        body.dark-mode .border-gray-200 { border-color: #2A3548 !important; }
        body.dark-mode .border-gray-300 { border-color: #374151 !important; }

        body.dark-mode .premium-shadow {
            box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        body.dark-mode .premium-shadow-lg {
            box-shadow: 0 12px 40px rgba(0,0,0,0.6) !important;
        }

        body.dark-mode .glass {
            background: rgba(15,23,41,0.85) !important;
            border-color: #253048 !important;
        }

        body.dark-mode input,
        body.dark-mode select,
        body.dark-mode textarea {
            background: #1F2A3E !important;
            color: #E5E7EB !important;
            border-color: #2A3548 !important;
        }
        body.dark-mode input::placeholder,
        body.dark-mode textarea::placeholder {
            color: #6B7280 !important;
        }

        body.dark-mode .shimmer {
            background: linear-gradient(90deg, #1A2235 25%, #253048 50%, #1A2235 75%);
            background-size: 1000px 100%;
        }

        body.dark-mode header img[src*="logo"],
        body.dark-mode .logo-protect {
            background: #FBF8F3;
            border-radius: 6px;
            padding: 1px 3px;
        }

        #theme-toggle {
            position: fixed;
            right: 12px;
            bottom: 96px;
            z-index: 40;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0A1628, #152238);
            color: #D4A84B;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.25);
            cursor: pointer;
            border: 2px solid rgba(212,168,75,0.3);
            transition: all 0.25s ease;
            font-size: 17px;
        }
        #theme-toggle:active { transform: scale(0.92); }

        body.dark-mode #theme-toggle {
            background: linear-gradient(135deg, #E8C77B, #D4A84B);
            color: #0A1628;
            border-color: rgba(255,255,255,0.2);
        }

        body.no-theme-toggle #theme-toggle { display: none !important; }
    `;

    // ---------- Helpers ----------
    function getSavedTheme() {
        try { return localStorage.getItem(STORAGE_KEY) || 'light'; }
        catch (e) { return 'light'; }
    }

    function saveTheme(theme) {
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-mode');
            if (document.body) document.body.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            if (document.body) document.body.classList.remove('dark-mode');
        }
        updateIcon(theme);
    }

    function updateIcon(theme) {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        btn.innerHTML = theme === 'dark'
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
        btn.title = theme === 'dark' ? 'Light mode' : 'Dark mode';
    }

    function toggleTheme() {
        const current = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        saveTheme(next);
    }

    // ---------- Inject CSS ----------
    function injectCSS() {
        if (document.getElementById('theme-dark-css')) return;
        const style = document.createElement('style');
        style.id = 'theme-dark-css';
        style.textContent = DARK_CSS;
        document.head.appendChild(style);
    }

    // ---------- Inject Toggle Button ----------
    function injectToggle() {
        if (document.getElementById('theme-toggle')) return;

        const path = window.location.pathname.toLowerCase();
        if (path.includes('admin') || path.includes('moderator') || path.includes('messages')) return;

        const btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.setAttribute('aria-label', 'Toggle theme');
        btn.onclick = toggleTheme;
        document.body.appendChild(btn);
        updateIcon(getSavedTheme());
    }

    // ---------- Init ----------
    if (document.head) injectCSS();

    const saved = getSavedTheme();
    if (saved === 'dark') document.documentElement.classList.add('dark-mode');

    function init() {
        applyTheme(saved);
        injectToggle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('✅ theme.js loaded');
})();