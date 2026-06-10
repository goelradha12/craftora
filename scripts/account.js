const AUTH_KEY = 'craftora_user';
const CART_KEY = 'cart';
const ORDERS_KEY = 'craftora_orders';

function getJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function getUser() {
    return getJSON(AUTH_KEY, null);
}

function getCartCount() {
    return getJSON(CART_KEY, []).reduce((sum, item) => sum + (item.qty ?? item.quantity ?? 1), 0);
}

function getOrdersForUser(email) {
    if (!email) return [];
    return getJSON(ORDERS_KEY, []).filter(order => order.customer?.email === email);
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[match]);
}

function formatDate(value) {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function money(value) {
    return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}

function emptyValue(value) {
    return value
        ? `<span>${escapeHTML(value)}</span>`
        : '<span class="info-value--empty">Not provided</span>';
}

function runWhenIdle(callback) {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(callback, { timeout: 1200 });
        return;
    }
    window.setTimeout(callback, 120);
}

function setCartBadge(id, count) {
    const badge = document.getElementById(id);
    if (!badge) return;
    if (count > 0) {
        badge.hidden = false;
        badge.textContent = count > 99 ? '99+' : String(count);
        return;
    }
    badge.hidden = true;
}

function initShell(user) {
    const cartCount = getCartCount();
    setCartBadge('desktopCartBadge', cartCount);
    setCartBadge('mobileCartBadge', cartCount);

    const desktopAuth = document.getElementById('desktopAuth');
    const desktopAccount = document.getElementById('desktopAccount');
    const mobileGuestLinks = document.getElementById('mobileGuestLinks');
    const mobileGuestSignup = document.getElementById('mobileGuestSignup');

    if (user) {
        if (desktopAuth) desktopAuth.hidden = true;
        if (desktopAccount) {
            desktopAccount.hidden = false;
            desktopAccount.textContent = user.name ? user.name.split(' ')[0] : 'My Account';
        }
        if (mobileGuestLinks) mobileGuestLinks.hidden = true;
        if (mobileGuestSignup) mobileGuestSignup.hidden = true;
    }

    document.querySelectorAll('.site-nav__link').forEach(link => {
        if (link.getAttribute('href') === './account.html') link.classList.add('is-active');
    });

    const menu = document.getElementById('mobileMenu');
    const toggle = document.getElementById('mobileMenuToggle');
    if (menu && toggle) {
        const closeMenu = () => {
            menu.hidden = true;
            menu.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        };

        toggle.addEventListener('click', () => {
            const isOpen = menu.classList.toggle('is-open');
            menu.hidden = !isOpen;
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        menu.addEventListener('click', event => {
            if (event.target.closest('a')) closeMenu();
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && menu.classList.contains('is-open')) {
                closeMenu();
                toggle.focus();
            }
        });
    }

    document.querySelectorAll('.js-logout-btn').forEach(button => {
        button.addEventListener('click', () => {
            localStorage.removeItem(AUTH_KEY);
            window.location.href = './index.html';
        });
    });
}

function renderOrders(orders) {
    const root = document.getElementById('ordersState');
    if (!root) return;

    if (!orders.length) {
        root.innerHTML = `
            <div class="orders-empty">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 12h6"></path><path d="M9 16h6"></path><path d="M9 8h6"></path><rect x="4" y="3" width="16" height="18" rx="2"></rect></svg>
                <h3>No orders yet</h3>
                <p>Once you place an order, you'll see its status, items, total, and delivery details here.</p>
                <a href="./products.html" class="btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }

    const cards = orders.map(order => `
        <article class="order-card">
            <div class="order-card__top">
                <div>
                    <p class="order-card__id">Order ${escapeHTML(order.id)}</p>
                    <p class="order-card__meta">Placed on ${formatDate(order.date)}</p>
                </div>
                <span class="order-status">${escapeHTML(order.status || 'Processing')}</span>
            </div>
            <div class="order-card__grid">
                <div class="order-items">
                    ${(order.items || []).map(item => `
                        <div class="order-item">
                            <div>
                                <p class="order-item__name">${escapeHTML(item.name)}</p>
                                <p class="order-item__meta">
                                    Qty: ${item.qty}
                                    ${item.size ? ` · Size: ${escapeHTML(item.size)}` : ''}
                                    ${item.color ? ` · Color: ${escapeHTML(item.color)}` : ''}
                                </p>
                            </div>
                            <div class="order-item__price">${money((item.price || 0) * (item.qty || 0))}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-side">
                    <div class="order-summary">
                        <h3>Price breakdown</h3>
                        <div class="order-summary__row"><span>Items</span><span>${order.summary?.items || 0}</span></div>
                        <div class="order-summary__row"><span>Subtotal</span><span>${money(order.summary?.subtotal || 0)}</span></div>
                        <div class="order-summary__row"><span>Shipping</span><span>${money(order.summary?.shipping || 0)}</span></div>
                        <div class="order-summary__row"><span>Total</span><span>${money(order.summary?.total || 0)}</span></div>
                    </div>
                    <div class="delivery-card">
                        <h3>Delivery information</h3>
                        <p>${escapeHTML(order.delivery?.address || 'Address not available')}</p>
                        <p>Phone: ${escapeHTML(order.delivery?.phone || 'Not available')}</p>
                        ${order.customer?.name ? `<p>Recipient: ${escapeHTML(order.customer.name)}</p>` : ''}
                    </div>
                </div>
            </div>
        </article>
    `).join('');

    root.innerHTML = `<div class="orders-list">${cards}</div>`;
}

function initAccountPage() {
    const user = getUser();
    initShell(user);

    if (!user) {
        const guestState = document.getElementById('guestState');
        if (guestState) guestState.hidden = false;
        return;
    }

    document.getElementById('accountState').hidden = false;

    const initials = (user.name || user.email || '?')
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    document.getElementById('sidebarAvatar').textContent = initials;
    document.getElementById('sidebarName').textContent = user.name || '—';
    document.getElementById('sidebarEmail').textContent = user.email || '—';
    document.getElementById('infoName').innerHTML = emptyValue(user.name);
    document.getElementById('infoEmail').innerHTML = emptyValue(user.email);
    document.getElementById('infoPhone').innerHTML = emptyValue(user.phone);
    document.getElementById('infoAddress').innerHTML = emptyValue(user.address);
    document.getElementById('infoJoined').innerHTML = `<span>${formatDate(user.joinedAt)}</span>`;

    const orders = getOrdersForUser(user.email);
    runWhenIdle(() => renderOrders(orders));
}

document.addEventListener('DOMContentLoaded', initAccountPage);
