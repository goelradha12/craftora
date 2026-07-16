/* ============================================================
   account.js — Craftora Account Page
   Ported from client/scripts/account.js, exported as ESM.
   ============================================================ */

import { getUser } from './auth.js';

const ORDERS_KEY = 'craftora_orders';

function getJSON(k, fb) {
    try {
        const r = localStorage.getItem(k);
        return r ? JSON.parse(r) : fb;
    } catch {
        return fb;
    }
}

function getOrdersForUser(u) {
    if (!u || !u.phone) return [];
    const normalizedCurrentUserPhone = String(u.phone).trim();

    return getJSON(ORDERS_KEY, []).filter(o => {
        const v2Phone = String(o.customer?.phone || '').trim();
        const v1Phone = String(o.delivery?.phone || '').trim();
        return v2Phone === normalizedCurrentUserPhone || v1Phone === normalizedCurrentUserPhone;
    });
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
    return `₹${Number(v || 0).toLocaleString('en-IN')}`;
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

function formatAddress(addressObj) {
    if (!addressObj) return '';
    const house = addressObj.house || '';
    const street = addressObj.street || '';
    const landmark = addressObj.landmark || '';
    const city = addressObj.city || '';
    const state = addressObj.state || '';
    const pincode = addressObj.pincode || '';

    const lines = [];
    if (house) lines.push(house);
    if (street) lines.push(street);
    if (landmark) lines.push(landmark);

    const cityState = [city, state].filter(Boolean).join(', ');
    const lastLine = cityState + (pincode ? ` - ${pincode}` : '');
    if (lastLine) lines.push(lastLine);

    return lines.map(l => `<p>${esc(l)}</p>`).join('');
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
                <a href="/products" class="btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }

    ords.sort((a, b) => new Date(b.date) - new Date(a.date));

    const cards = ords.map((o) => {
        const isV2 = o.version === 2;
        const customerName = isV2 ? (o.customer?.name || '') : (o.customer?.name || '');
        const customerPhone = isV2 ? (o.customer?.phone || '') : (o.delivery?.phone || '');
        const customerEmail = isV2 ? (o.customer?.email || '') : (o.customer?.email || '');

        let addressHtml = '';
        if (isV2 && o.shipping) {
            addressHtml = formatAddress(o.shipping);
        } else if (typeof o.delivery?.address === 'object' && o.delivery.address !== null) {
            addressHtml = formatAddress(o.delivery.address);
        } else {
            addressHtml = `<p>${esc(o.delivery?.address || o.shipping?.formatted || 'Address not available')}</p>`;
        }

        const orderStatus = o.status || 'Processing';
        const itemCount = o.summary?.items || 0;
        const totalAmt = money(o.summary?.total || 0);
        const designFeesTotal = o.summary?.designFees || 0;

        return `
        <details class="order-accordion">
            <summary class="order-summary-header">
                <div class="order-summary-content">
                    <div class="order-summary-main">
                        <span class="order-id">Order #${esc(o.id || 'N/A')}</span>
                        <span class="order-date">${fmtDate(o.date)}</span>
                    </div>
                    <div class="order-summary-meta">
                        <span class="order-items-count">${itemCount} Items</span>
                        <span class="order-total-amt">${totalAmt}</span>
                    </div>
                </div>
                <div class="order-summary-status">
                    <span class="order-status-badge">${esc(orderStatus)}</span>
                    <svg class="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </summary>

            <div class="order-accordion-body">
                <div class="order-details-grid">
                    <div class="delivery-card">
                        <h3>Customer</h3>
                        ${customerName ? `<p><strong>${esc(customerName)}</strong></p>` : ''}
                        ${customerPhone ? `<p>${esc(customerPhone)}</p>` : ''}
                        ${customerEmail ? `<p>${esc(customerEmail)}</p>` : ''}
                    </div>

                    <div class="delivery-card">
                        <h3>Delivery Address</h3>
                        ${addressHtml}
                    </div>

                    <div class="order-summary-card">
                        <h3>Order Summary</h3>
                        <div class="order-summary__row"><span>Subtotal</span><span>${money(o.summary?.subtotal || 0)}</span></div>
                        ${designFeesTotal > 0 ? `<div class="order-summary__row"><span>Design Fees</span><span>${money(designFeesTotal)}</span></div>` : ''}
                        <div class="order-summary__row"><span>Shipping</span><span>Free</span></div>
                        <div class="order-summary__row order-summary__row--total"><span>Total</span><span>${totalAmt}</span></div>
                        <div class="order-summary__row"><span>Payment</span><span>${esc(o.payment || 'Cash on Delivery')}</span></div>
                    </div>
                </div>

                <div class="order-items-section">
                    <h3>Products</h3>
                    <div class="order-items-list">
                        ${(o.items || []).map(i => {
                            const itemDesignFee = i.designFee || 0;
                            const itemBasePrice = i.basePrice || i.price || 0;
                            const itemTotal = (i.price || itemBasePrice) * (i.qty || 1);
                            return `
                            <div class="order-item">
                                <img src="${esc(i.image || '/assets/placeholder.webp')}" alt="${esc(i.name)}" class="order-item__img" width="60" height="60" loading="lazy" />
                                <div class="order-item__info">
                                    <p class="order-item__name">${esc(i.name)}</p>
                                    <p class="order-item__meta">
                                        Qty: ${i.qty}
                                        ${i.size ? ` · Size: ${esc(i.size)}` : ''}
                                        ${i.color ? ` · <span class="order-item__color-dot" style="background:${esc(i.color)}"></span> ${esc(i.colorName || '')}` : ''}
                                    </p>
                                    <div class="order-item__tags">
                                        ${i.customized || i.designRequired ? `<span class="order-item__tag order-item__tag--designed">Customized</span>` : `<span class="order-item__tag">Plain</span>`}
                                        ${itemDesignFee > 0 ? `<span class="order-item__tag order-item__tag--fee">+${money(itemDesignFee)} design</span>` : ''}
                                    </div>
                                </div>
                                <div class="order-item__price">${money(itemTotal)}</div>
                            </div>
                        `}).join('')}
                    </div>
                </div>
            </div>
        </details>
    `}).join('');

    root.innerHTML = `<div class="orders-list">${cards}</div>`;
}

export function initAcct() {
    const u = getUser();

    if (!u) {
        const gs = document.getElementById('guestState');
        if (gs) gs.hidden = false;
        return;
    }

    document.getElementById('accountState').hidden = false;

    const init = (u.name || u.phone || '?')
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    document.getElementById('sidebarAvatar').textContent = init;
    document.getElementById('sidebarName').textContent = u.name || '—';
    document.getElementById('sidebarEmail').textContent = u.phone || '—';
    document.getElementById('infoName').innerHTML = empVal(u.name);
    document.getElementById('infoEmail').innerHTML = empVal(u.email);
    document.getElementById('infoPhone').innerHTML = empVal(u.phone);
    document.getElementById('infoAddress').innerHTML = empVal(u.address);
    document.getElementById('infoJoined').innerHTML = `<span>${fmtDate(u.joinedAt)}</span>`;

    const ords = getOrdersForUser(u);
    runIdle(() => renderOrders(ords));
}
