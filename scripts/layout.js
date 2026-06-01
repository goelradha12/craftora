const FOOTER_CODE = `
<footer class="footer">

    <!-- Top Footer -->
    <div class="footer-top">

        <!-- Brand -->
        <div class="footer-brand">
            <a href="./index.html">
                <img src="./assets/dark_logo.png" alt="Craftora Logo" class="footer-logo">
            </a>
            <p class="footer-tagline">
                Modern custom merchandise designed to bring your ideas to life.
            </p>
        </div>

        <!-- Quick Links -->
        <div class="footer-links">
            <h3>Quick Links</h3>
            <ul>
                <li><a href="./index.html">Home</a></li>
                <li><a href="./products.html">Shop</a></li>
                <li><a href="./about.html">About</a></li>
                <li><a href="./contact.html">Contact</a></li>
            </ul>
        </div>

        <!-- Shop Categories -->
        <div class="footer-links">
            <h3>Shop Categories</h3>
            <ul>
                <li><a href="./products.html?category=Diary">Diary</a></li>
                <li><a href="./products.html?category=Bottle">Bottle</a></li>
                <li><a href="./products.html?category=Tshirt">T-shirt</a></li>
                <li><a href="./products.html?category=Cup">Cup</a></li>
            </ul>
        </div>

    </div>

    <!-- Bottom Footer -->
    <div class="footer-bottom">
        <p>© 2026 Craftora. All rights reserved.</p>
        <div class="footer-bottom-links">
            <a href="./return-policy.html">Return Policy</a>
            <a href="./privacy-policy.html">Privacy Policy</a>
            <a href="./terms.html">Terms &amp; Conditions</a>
        </div>
    </div>

</footer>`;


const HEADER_CODE = `
<nav class="nav">
    <div class="nav__phone">
        <div class="logo">
            <a href="./index.html"><img src="./assets/logo.png" alt="Craftora logo. Click for home."></a>
        </div>
        <div class="nav__phone-actions">
            <!-- Mobile cart -->
            <a href="./cart.html" class="nav--link nav__cart" aria-label="View cart">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M3 3H5L5.4 5M5.4 5H21L19 14H7.2M5.4 5L7.2 14M7.2 14L6 16.5C5.6 17.3 6.2 18 7 18H19M9 21C9 21.5523 8.55228 22 8 22C7.44772 22 7 21.5523 7 21C7 20.4477 7.44772 20 8 20C8.55228 20 9 20.4477 9 21ZM19 21C19 21.5523 18.5523 22 18 22C17.4477 22 17 21.5523 17 21C17 20.4477 17.4477 20 18 20C18.5523 20 19 20.4477 19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="cart-badge cart-badge--hidden" aria-live="polite">0</span>
            </a>
            <!-- Hamburger open -->
            <button class="nav__toggle nav__phone--open js_open_btn" aria-label="Open Navigation">
                <svg width="50px" height="50px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 7H19" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M5 12L19 12" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M5 17L19 17" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
            <!-- Close -->
            <button class="nav__toggle nav__phone--close js_close_btn" aria-label="Close Navigation">
                <svg width="50px" height="50px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#000000" d="M195.2 195.2a64 64 0 0 1 90.496 0L512 421.504 738.304 195.2a64 64 0 0 1 90.496 90.496L602.496 512 828.8 738.304a64 64 0 0 1-90.496 90.496L512 602.496 285.696 828.8a64 64 0 0 1-90.496-90.496L421.504 512 195.2 285.696a64 64 0 0 1 0-90.496z" />
                </svg>
            </button>
        </div>
    </div>

    <!-- Desktop: 3-column nav -->
    <div class="nav--desktop container">

        <!-- Left links -->
        <div class="nav--left">
            <a class="nav--link" href="./index.html">Home</a>
            <a class="nav--link" href="./about.html">About</a>
            <a class="nav--link" href="./products.html">Shop</a>
        </div>

        <!-- Center logo -->
        <div class="nav--center logo">
            <a href="./index.html"><img src="./assets/logo.png" alt="Craftora logo. Click for home."></a>
        </div>

        <!-- Right links -->
        <div class="nav--right">
            <a class="nav--link" href="./contact.html">Contact</a>

            <!-- Profile dropdown -->
            <div class="nav--item dropdown" id="profile-dropdown">
                <a class="nav--link dropdown--toggle" href="#" aria-haspopup="true" aria-expanded="false">
                    <span class="profile-label">Profile</span>
                    <svg aria-hidden="true" width="20px" height="20px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                        <path d="M169.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 306.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
                    </svg>
                </a>
                <ul class="dropdown--menu" id="profile-menu"></ul>
            </div>

            <!-- Cart -->
            <a href="./cart.html" class="nav--link nav__cart" aria-label="View cart">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M3 3H5L5.4 5M5.4 5H21L19 14H7.2M5.4 5L7.2 14M7.2 14L6 16.5C5.6 17.3 6.2 18 7 18H19M9 21C9 21.5523 8.55228 22 8 22C7.44772 22 7 21.5523 7 21C7 20.4477 7.44772 20 8 20C8.55228 20 9 20.4477 9 21ZM19 21C19 21.5523 18.5523 22 18 22C17.4477 22 17 21.5523 17 21C17 20.4477 17.4477 20 18 20C18.5523 20 19 20.4477 19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="cart-badge cart-badge--hidden" aria-live="polite">0</span>
            </a>
        </div>
    </div>

    <!-- Mobile: slide-down menu -->
    <ul class="nav--list js_nav_list">
        <li><a class="nav--link" href="./about.html">About</a></li>
        <li><a class="nav--link" href="./products.html">Shop</a></li>
        <li><a class="nav--link" href="./contact.html">Contact</a></li>
        <li class="nav--item dropdown" id="profile-dropdown-mobile">
            <a class="nav--link dropdown--toggle-mobile" href="#" aria-haspopup="true" aria-expanded="false">
                <span class="profile-label-mobile">Profile</span>
                <svg aria-hidden="true" width="20px" height="20px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path d="M169.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 306.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
                </svg>
            </a>
            <ul class="dropdown--menu" id="profile-menu-mobile"></ul>
        </li>
    </ul>
</nav>`;


/* ─── Auth helpers ─────────────────────────────────────────────────────────── */

/**
 * Returns the logged-in user object from localStorage, or null.
 * Assumes login stores: localStorage.setItem('user', JSON.stringify({ name, email, ... }))
 */
function getUser() {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function logout() {
    localStorage.removeItem('user');
    // Optionally clear cart too — comment out if you want cart to persist after logout
    // localStorage.removeItem('cart');
    window.location.href = './index.html';
}


/* ─── Profile dropdown renderer ───────────────────────────────────────────── */

function renderProfileDropdown() {
    const user = getUser();

    // populate both desktop (#profile-menu) and mobile (#profile-menu-mobile)
    const menus = [
        { menu: document.getElementById('profile-menu'),        label: document.querySelector('.profile-label') },
        { menu: document.getElementById('profile-menu-mobile'), label: document.querySelector('.profile-label-mobile') },
    ];

    menus.forEach(({ menu, label }) => {
        if (!menu) return;

        if (user) {
            const displayName = user.name || user.email || 'My Account';
            if (label) label.textContent = displayName;

            menu.innerHTML = `
                <li class="dropdown--user-info">
                    <span class="dropdown--user-name">${displayName}</span>
                    <span class="dropdown--user-email">${user.email || ''}</span>
                </li>
                <li class="dropdown--divider"></li>
                <li><a href="./account.html">My Account</a></li>
                <li><a href="./orders.html">My Orders</a></li>
                <li><a href="./wishlist.html">Wishlist</a></li>
                <li class="dropdown--divider"></li>
                <li><a href="#" class="dropdown--logout js-logout-btn">Logout</a></li>
            `;
        } else {
            if (label) label.textContent = 'Profile';

            menu.innerHTML = `
                <li><a href="./login.html">Login</a></li>
                <li><a href="./signup.html">Sign Up</a></li>
                <li class="dropdown--divider"></li>
                <li><a href="./wishlist.html">Wishlist</a></li>
            `;
        }
    });

    // Wire up all logout buttons
    document.querySelectorAll('.js-logout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    });
}


/* ─── Cart badge ───────────────────────────────────────────────────────────── */

function updateCartBadges() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        // Support both array-of-items and array-of-{qty} formats
        const count = cart.reduce((sum, item) => sum + (item.qty ?? item.quantity ?? 1), 0);

        document.querySelectorAll('.cart-badge').forEach(badge => {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('cart-badge--hidden');
            } else {
                badge.classList.add('cart-badge--hidden');
            }
        });
    } catch {
        // cart unreadable — leave badge hidden
    }
}


/* ─── Init ─────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

    /* Inject HTML */
    const footer = document.querySelector('#footer');
    const header = document.querySelector('#header');

    if (footer) footer.innerHTML = FOOTER_CODE;
    if (header) {
        header.innerHTML = HEADER_CODE;

        /* ── Mobile menu toggle ── */
        const nav_open_btn  = document.querySelector('.js_open_btn');
        const nav_close_btn = document.querySelector('.js_close_btn');
        const nav_list      = document.querySelector('.js_nav_list');

        nav_open_btn.addEventListener('click', () => {
            nav_list.classList.add('active');
            nav_open_btn.style.display  = 'none';
            nav_close_btn.style.display = 'block';
        });

        nav_close_btn.addEventListener('click', () => {
            nav_list.classList.remove('active');
            nav_open_btn.style.display  = 'block';
            nav_close_btn.style.display = 'none';
        });

        /* ── Profile dropdown — desktop ── */
        const dropdownDesktop = document.getElementById('profile-dropdown');
        const toggleDesktop   = dropdownDesktop?.querySelector('.dropdown--toggle');

        toggleDesktop?.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = dropdownDesktop.classList.toggle('active');
            toggleDesktop.setAttribute('aria-expanded', isOpen);
        });

        /* ── Profile dropdown — mobile ── */
        const dropdownMobile = document.getElementById('profile-dropdown-mobile');
        const toggleMobile   = dropdownMobile?.querySelector('.dropdown--toggle-mobile');

        toggleMobile?.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = dropdownMobile.classList.toggle('active');
            toggleMobile.setAttribute('aria-expanded', isOpen);
        });

        /* ── Close both dropdowns when clicking outside ── */
        document.addEventListener('click', (e) => {
            [dropdownDesktop, dropdownMobile].forEach(dd => {
                if (dd && !dd.contains(e.target)) {
                    dd.classList.remove('active');
                    dd.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', 'false');
                }
            });
        });

        /* ── Render auth-aware menus (desktop + mobile) ── */
        renderProfileDropdown();

        /* ── Cart badge ── */
        updateCartBadges();

        /* Re-sync badge if cart changes in another tab */
        window.addEventListener('storage', updateCartBadges);
    }
});