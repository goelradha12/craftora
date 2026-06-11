const ORDERS_KEY = 'craftora_orders';

function getJSON(k, fb) {
    try {
        const r = localStorage.getItem(k);
        return r ? JSON.parse(r) : fb;
    } catch {
        return fb;
    }
}

function getOrdersForUser(e) {
    if (!e) return [];
    return getJSON(ORDERS_KEY, []).filter(o => o.customer?.email === e);
}

function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[m]);
}

function fmtDate(v) {
    if (!v) return 'Not available';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return 'Not available';
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function money(v) {
    return `Rs ${Number(v || 0).toLocaleString('en-IN')}`;
}

function empVal(v) {
    return v
        ? `<span>${esc(v)}</span>`
        : '<span class="info-value--empty">Not provided</span>';
}

function runIdle(cb) {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(cb, { timeout: 1200 });
        return;
    }
    window.setTimeout(cb, 120);
}

function renderOrders(ords) {
    const root = document.getElementById('ordersState');
    if (!root) return;

    if (!ords.length) {
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

    const cards = ords.map(o => `
        <article class="order-card">
            <div class="order-card__top">
                <div>
                    <p class="order-card__id">Order ${esc(o.id)}</p>
                    <p class="order-card__meta">Placed on ${fmtDate(o.date)}</p>
                </div>
                <span class="order-status">${esc(o.status || 'Processing')}</span>
            </div>
            <div class="order-card__grid">
                <div class="order-items">
                    ${(o.items || []).map(i => `
                        <div class="order-item">
                            <div>
                                <p class="order-item__name">${esc(i.name)}</p>
                                <p class="order-item__meta">
                                    Qty: ${i.qty}
                                    ${i.size ? ` · Size: ${esc(i.size)}` : ''}
                                    ${i.color ? ` · Color: ${esc(i.color)}` : ''}
                                </p>
                            </div>
                            <div class="order-item__price">${money((i.price || 0) * (i.qty || 0))}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-side">
                    <div class="order-summary">
                        <h3>Price breakdown</h3>
                        <div class="order-summary__row"><span>Items</span><span>${o.summary?.items || 0}</span></div>
                        <div class="order-summary__row"><span>Subtotal</span><span>${money(o.summary?.subtotal || 0)}</span></div>
                        <div class="order-summary__row"><span>Shipping</span><span>${money(o.summary?.shipping || 0)}</span></div>
                        <div class="order-summary__row"><span>Total</span><span>${money(o.summary?.total || 0)}</span></div>
                    </div>
                    <div class="delivery-card">
                        <h3>Delivery information</h3>
                        <p>${esc(o.delivery?.address || 'Address not available')}</p>
                        <p>Phone: ${esc(o.delivery?.phone || 'Not available')}</p>
                        ${o.customer?.name ? `<p>Recipient: ${esc(o.customer.name)}</p>` : ''}
                    </div>
                </div>
            </div>
        </article>
    `).join('');

    root.innerHTML = `<div class="orders-list">${cards}</div>`;
}

function initAcct() {
    const u = getUser();

    if (!u) {
        const gs = document.getElementById('guestState');
        if (gs) gs.hidden = false;
        return;
    }

    document.getElementById('accountState').hidden = false;

    const init = (u.name || u.email || '?')
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    document.getElementById('sidebarAvatar').textContent = init;
    document.getElementById('sidebarName').textContent = u.name || '—';
    document.getElementById('sidebarEmail').textContent = u.email || '—';
    document.getElementById('infoName').innerHTML = empVal(u.name);
    document.getElementById('infoEmail').innerHTML = empVal(u.email);
    document.getElementById('infoPhone').innerHTML = empVal(u.phone);
    document.getElementById('infoAddress').innerHTML = empVal(u.address);
    document.getElementById('infoJoined').innerHTML = `<span>${fmtDate(u.joinedAt)}</span>`;

    const ords = getOrdersForUser(u.email);
    runIdle(() => renderOrders(ords));
}

document.addEventListener('DOMContentLoaded', initAcct);