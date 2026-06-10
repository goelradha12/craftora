/* ============================================================
   layout.js  —  Craftora shared nav + footer
   ============================================================ */


/* ── Auth helpers (inline so layout.js is self-contained) ── */

const AUTH_KEY = 'craftora_user';

function getUser() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = './index.html';
}


/* ── Cart helpers ── */

function getCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        return cart.reduce((sum, item) => sum + (item.qty ?? item.quantity ?? 1), 0);
    } catch { return 0; }
}


/* ── Profile menu HTML builders ── */

function buildProfileMenuHTML(user) {
    const initials = (user.name || user.email || '?')
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const displayName = user.name || user.email || 'My Account';

    return /* html */`
        <div class="dropdown" id="profileDropdown">
            <button class="dropdown__trigger" id="profileTrigger" aria-haspopup="true" aria-expanded="false">
                <span class="dropdown__avatar" aria-hidden="true">${initials}</span>
                <span class="dropdown__label">${displayName.split(' ')[0]}</span>
                <svg class="dropdown__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </button>
            <ul class="dropdown__menu" id="profileMenu" role="menu">
                <li class="dropdown__user-info" role="none">
                    <span class="dropdown__user-name">${escHTML(displayName)}</span>
                    <span class="dropdown__user-email">${escHTML(user.email || '')}</span>
                </li>
                <li class="dropdown__divider" role="none"></li>
                <li role="none">
                    <a href="./account.html" role="menuitem">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                        My Account
                    </a>
                </li>
                <li role="none">
                    <a href="./account.html#my-orders" role="menuitem">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 12h6"/><path d="M9 16h6"/><path d="M9 8h6"/><rect x="4" y="3" width="16" height="18" rx="2"/></svg>
                        My Orders
                    </a>
                </li>
                <li role="none">
                    <a href="./wishlist.html" role="menuitem">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        Wishlist
                    </a>
                </li>
                <li class="dropdown__divider" role="none"></li>
                <li role="none">
                    <a href="./cart.html" role="menuitem">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3H5L5.4 5M5.4 5H21L19 14H7.2M5.4 5L7.2 14M7.2 14L6 16.5C5.6 17.3 6.2 18 7 18H19M9 21C9 21.5523 8.55228 22 8 22C7.44772 22 7 21.5523 7 21C7 20.4477 7.44772 20 8 20C8.55228 20 9 20.4477 9 21ZM19 21C19 21.5523 18.5523 22 18 22C17.4477 22 17 21.5523 17 21C17 20.4477 17.4477 20 18 20C18.5523 20 19 20.4477 19 21Z" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Cart
                    </a>
                </li>
                <li class="dropdown__divider" role="none"></li>
                <li role="none">
                    <button class="dropdown__logout js-logout-btn" role="menuitem">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Sign Out
                    </button>
                </li>
            </ul>
        </div>
    `;
}

function buildGuestHTML() {
    return /* html */`
        <div class="nav__auth-links">
            <a class="nav__btn-ghost" href="./login.html">Sign In</a>
            <a class="nav__btn-solid" href="./signup.html">Sign Up</a>
        </div>
    `;
}

/** Mobile profile list items */
function buildMobileProfileHTML(user) {
    if (user) {
        const displayName = user.name || user.email || 'My Account';
        return /* html */`
            <li>
                <div class="dropdown" id="profileDropdownMobile">
                    <button class="dropdown--toggle-mobile" aria-haspopup="true" aria-expanded="false">
                        <span>${escHTML(displayName.split(' ')[0])}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <ul class="dropdown__menu" id="profileMenuMobile" role="menu">
                        <li class="dropdown__user-info" role="none">
                            <span class="dropdown__user-name">${escHTML(displayName)}</span>
                            <span class="dropdown__user-email">${escHTML(user.email || '')}</span>
                        </li>
                        <li class="dropdown__divider" role="none"></li>
                        <li><a href="./account.html" role="menuitem">My Account</a></li>
                        <li><a href="./account.html#my-orders" role="menuitem">My Orders</a></li>
                        <li><a href="./wishlist.html" role="menuitem">Wishlist</a></li>
                        <li><a href="./cart.html" role="menuitem">Cart</a></li>
                        <li class="dropdown__divider" role="none"></li>
                        <li><button class="dropdown__logout js-logout-btn" role="menuitem">Sign Out</button></li>
                    </ul>
                </div>
            </li>
        `;
    }
    return /* html */`
        <li><a class="nav--link" href="./login.html">Sign In</a></li>
        <li><a class="nav--link" href="./signup.html">Sign Up</a></li>
    `;
}


/* ── Utility ── */

function escHTML(str) {
    return String(str ?? '').replace(/[&<>"']/g, m =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]
    );
}

function markActiveLink() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav--link').forEach(link => {
        const href = (link.getAttribute('href') || '').split('/').pop();
        link.classList.toggle('active', href === path);
    });
}


/* ── Badge updater (exported for cart.js) ── */

function updateCartBadges() {
    const count = getCartCount();
    document.querySelectorAll('.cart-badge').forEach(badge => {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('cart-badge--hidden');
        } else {
            badge.classList.add('cart-badge--hidden');
        }
    });
}


/* ── Cart icon SVG ── */
const CART_SVG = /* html */`
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M3 3H5L5.4 5M5.4 5H21L19 14H7.2M5.4 5L7.2 14M7.2 14L6 16.5C5.6 17.3 6.2 18 7 18H19M9 21C9 21.5523 8.55228 22 8 22C7.44772 22 7 21.5523 7 21C7 20.4477 7.44772 20 8 20C8.55228 20 9 20.4477 9 21ZM19 21C19 21.5523 18.5523 22 18 22C17.4477 22 17 21.5523 17 21C17 20.4477 17.4477 20 18 20C18.5523 20 19 20.4477 19 21Z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;


/* ── HTML templates ── */

function buildHeader(user) {
    return /* html */`
        <a class="skip-link" href="#main-content">Skip to main content</a>

        <nav class="nav" role="navigation" aria-label="Main navigation">
            <div class="nav__overlay js_nav_overlay" hidden></div>

            <div class="nav--desktop container">

                <a class="nav__logo" href="./index.html" aria-label="Craftora – go to homepage">
                    <img width="200" height="40" src="./assets/logo.webp" alt="Craftora">
                </a>

                <ul class="nav__links" role="list">
                    <li><a class="nav--link" href="./index.html">Home</a></li>
                    <li><a class="nav--link" href="./products.html">Shop</a></li>
                    <li><a class="nav--link" href="./about.html">About</a></li>
                    <li><a class="nav--link" href="./contact.html">Contact</a></li>
                </ul>

                <div class="nav__actions">
                    ${user ? buildProfileMenuHTML(user) : buildGuestHTML()}

                    <a href="./cart.html" class="nav__icon-btn" aria-label="View cart">
                        ${CART_SVG}
                        <span class="cart-badge cart-badge--hidden" aria-live="polite" aria-label="items in cart">0</span>
                    </a>
                </div>

            </div>

            <div class="nav__phone">

                <a class="nav__phone-logo" href="./index.html" aria-label="Craftora – go to homepage">
                    <img width="100" height="20" src="./assets/logo.webp" alt="Craftora">
                </a>

                <div class="nav__phone-actions">
                    <a href="./cart.html" class="nav__icon-btn" aria-label="View cart">
                        ${CART_SVG}
                        <span class="cart-badge cart-badge--hidden" aria-live="polite" aria-label="items in cart">0</span>
                    </a>

                    <button class="nav__icon-btn nav__phone--open js_open_btn" aria-label="Open navigation menu" aria-expanded="false">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="nav__drawer js_nav_list" id="mobileNavMenu" aria-label="Mobile navigation" hidden>
                <div class="nav__drawer-header">
                    <div>
                        <p class="nav__drawer-eyebrow">Menu</p>
                        <p class="nav__drawer-title">Explore Craftora</p>
                    </div>
                    <button class="nav__drawer-close js_close_btn" aria-label="Close navigation menu" aria-expanded="false" aria-controls="mobileNavMenu">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <ul class="nav--list" role="list">
                    <li><a class="nav--link" href="./index.html">Home</a></li>
                    <li><a class="nav--link" href="./products.html">Shop</a></li>
                    <li><a class="nav--link" href="./about.html">About</a></li>
                    <li><a class="nav--link" href="./contact.html">Contact</a></li>
                    ${buildMobileProfileHTML(user)}
                </ul>
            </div>

        </nav>
    `;
}

const FOOTER_HTML = /* html */`
<footer class="footer">
    <div class="footer-top">
        <div class="footer-brand">
            <a href="./index.html">
                <img width="100" height="20" src="./assets/dark_logo.webp" alt="Craftora" class="footer-logo">
            </a>
            <p class="footer-tagline">Modern custom merchandise designed to bring your ideas to life.</p>
        </div>
        <div class="footer-links">
            <h3>Quick Links</h3>
            <ul>
                <li><a href="./index.html">Home</a></li>
                <li><a href="./products.html">Shop</a></li>
                <li><a href="./about.html">About</a></li>
                <li><a href="./contact.html">Contact</a></li>
            </ul>
        </div>
        <div class="footer-links">
            <h3>Shop</h3>
            <ul>
                <li><a href="./products.html?category=Diary">Diary</a></li>
                <li><a href="./products.html?category=Bottle">Bottle</a></li>
                <li><a href="./products.html?category=Tshirt">T-shirt</a></li>
                <li><a href="./products.html?category=Cup">Cup</a></li>
            </ul>
        </div>
        <div class="footer-links">
            <h3>Account</h3>
            <ul>
                <li><a href="./login.html">Sign In</a></li>
                <li><a href="./signup.html">Sign Up</a></li>
                <li><a href="./cart.html">Cart</a></li>
                <li><a href="./wishlist.html">Wishlist</a></li>
            </ul>
        </div>
    </div>
    <div class="footer-bottom">
        <p>© 2026 Craftora. All rights reserved.</p>
        <div class="footer-bottom-links">
            <a href="./return-policy.html">Return Policy</a>
            <a href="./privacy-policy.html">Privacy Policy</a>
            <a href="./terms.html">Terms &amp; Conditions</a>
        </div>
    </div>
</footer>`;


/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    const headerEl = document.getElementById('header');
    const footerEl = document.getElementById('footer');

    /* ── Inject footer ── */
    if (footerEl) footerEl.innerHTML = FOOTER_HTML;

    /* ── Inject header ── */
    if (headerEl) {
        const user = getUser();
        headerEl.innerHTML = buildHeader(user);
    }

    /* ── Mark active nav link ── */
    markActiveLink();

    /* ── Cart badges ── */
    updateCartBadges();
    window.addEventListener('storage', updateCartBadges);

    /* ── Desktop profile dropdown ── */
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) {
        const trigger = document.getElementById('profileTrigger');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = profileDropdown.classList.toggle('open');
            trigger.setAttribute('aria-expanded', open);
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && profileDropdown.classList.contains('open')) {
                profileDropdown.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
                trigger.focus();
            }
        });
    }

    /* ── Mobile hamburger ── */
    const openBtn  = document.querySelector('.js_open_btn');
    const closeBtn = document.querySelector('.js_close_btn');
    const navDrawer  = document.querySelector('.js_nav_list');
    const navRoot  = document.querySelector('.nav');
    const navOverlay = document.querySelector('.js_nav_overlay');
    const body = document.body;

    function openMenu() {
        if (!navDrawer || !openBtn || !closeBtn) return;
        navDrawer.hidden = false;
        navOverlay.hidden = false;
        window.requestAnimationFrame(() => {
            navDrawer.classList.add('active');
            navOverlay.classList.add('active');
        });
        navRoot?.classList.add('nav--menu-open');
        openBtn.setAttribute('aria-expanded', 'true');
        closeBtn.setAttribute('aria-expanded', 'true');
        body.classList.add('nav-open');
        navDrawer.querySelector('a, button')?.focus();
    }

    function closeMenu() {
        if (!navDrawer || !openBtn || !closeBtn) return;
        navDrawer.classList.remove('active');
        navOverlay?.classList.remove('active');
        navRoot?.classList.remove('nav--menu-open');
        openBtn.setAttribute('aria-expanded', 'false');
        closeBtn.setAttribute('aria-expanded', 'false');
        body.classList.remove('nav-open');
        // also close any open mobile dropdowns
        document.querySelectorAll('.nav__drawer .dropdown.open').forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.dropdown--toggle-mobile[aria-expanded="true"]').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
        window.setTimeout(() => {
            if (!navDrawer.classList.contains('active')) {
                navDrawer.hidden = true;
                if (navOverlay) navOverlay.hidden = true;
            }
        }, 220);
    }

    openBtn?.setAttribute('aria-controls', 'mobileNavMenu');
    openBtn?.addEventListener('click', openMenu);
    closeBtn?.addEventListener('click', closeMenu);
    navDrawer?.addEventListener('click', (e) => {
        if (e.target.closest('a[href]') && !e.target.closest('.dropdown--toggle-mobile')) closeMenu();
    });
    navOverlay?.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navDrawer?.classList.contains('active')) {
            closeMenu();
            openBtn?.focus();
        }
    });

    /* ── Mobile profile dropdown ── */
    const mobileDd = document.getElementById('profileDropdownMobile');
    const mobileToggle = mobileDd?.querySelector('.dropdown--toggle-mobile');

    mobileToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = mobileDd.classList.toggle('open');
        mobileToggle.setAttribute('aria-expanded', open);
    });

    /* ── Logout buttons (all instances) ── */
    document.addEventListener('click', (e) => {
        if (e.target.closest('.js-logout-btn')) {
            e.preventDefault();
            logout();
        }
    });

    /* ── Scroll To Top Button ── */
    const scrollToTopHTML = /* html */`
        <button id="scrollToTopBtn" aria-label="Scroll to top" style="
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--primary, #111);
            color: #fff;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(15px);
        ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
        </button>
    `;

    document.body.insertAdjacentHTML('beforeend', scrollToTopHTML);
    const scrollBtn = document.getElementById('scrollToTopBtn');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 350) {
            scrollBtn.style.opacity = '1';
            scrollBtn.style.visibility = 'visible';
            scrollBtn.style.transform = 'translateY(0)';
        } else {
            scrollBtn.style.opacity = '0';
            scrollBtn.style.visibility = 'hidden';
            scrollBtn.style.transform = 'translateY(15px)';
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

});
