/* ============================================================
   cart.js — Craftora Cart Page
   Ported from client/scripts/cart.js, exported as ESM.

   The rendered cart markup uses inline onclick="" attribute
   strings (updateQuantity(...), removeItem(...), openDesignPreview(...))
   which are set via innerHTML — the browser resolves those handlers
   against the GLOBAL scope, so the three functions are attached to
   `window` at the bottom of initCart(), same as the original script
   effectively behaved as global functions.
   ============================================================ */

import { updateCartBadges } from './layout.js';
import { DesignPreview } from './designPreview.js';

const CART_KEY = 'cart';
const ORDERS_KEY = 'craftora_orders';

const $ = (sel, root = document) => root.querySelector(sel);
const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[m]);

let cartData = [];

function openDesignPreview(event, productKey) {
  event.stopPropagation();
  DesignPreview.showCartCustomization(productKey);
}

function isLoggedIn() {
    try {
        const raw = localStorage.getItem('craftora_user');
        if (!raw) return false;
        const user = JSON.parse(raw);
        return !!(user && user.phone);
    } catch {
        return false;
    }
}

function bindCheckoutButton() {
  const checkoutBtn = $('#checkoutBtn');
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener('click', () => {
    if (cartData.length === 0) return;

    if (!isLoggedIn()) {
      alert('Login to checkout.');
      window.location.href = '/login?redirect=checkout';
      return;
    }

    sessionStorage.setItem('craftora_checkout', JSON.stringify({
      source: 'cart',
      items: cartData
    }));
    window.location.href = '/checkout';
  });
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cartData));
  updateCartBadges();
  renderCart();
}

function updateQuantity(key, delta) {
  const item = cartData.find(i => i.key === key);
  if (!item) return;

  const newQty = item.qty + delta;
  if (newQty < 1) return;

  item.qty = newQty;
  saveCart();
}

function removeItem(key) {
  cartData = cartData.filter(i => i.key !== key);
  saveCart();
}

function renderCart() {
  const container = $('#cartItemsContainer');
  const checkoutBtn = $('#checkoutBtn');
  if (!container) return;

  if (cartData.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <a href="/products">Continue Shopping</a>
      </div>
    `;
    updateSummary(0, 0);
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;

  let totalItems = 0;
  let subtotal = 0;

  container.innerHTML = cartData.map(item => {
    totalItems += item.qty;
    subtotal += (item.price * item.qty);

    return `
      <article class="cart-item">
        <div class="cart-item__img-wrap${item.customized && item.customization?.previewImage ? ' cart-item__img-wrap--design' : ''}">
          <img class="cart-item__img" src="${esc(item.image)}" alt="${esc(item.name)}" width="120" height="120" fetchpriority="high">
        </div>

        <div class="cart-item__details">
          <div class="cart-item__header">
            <div>
              <h3 class="cart-item__name cart-item__text" onclick="window.location.href='/product?id=${item.id}'">${esc(item.name)}</h3>
              <div class="cart-item__meta">
                ${item.color ? `
                  <span class="cart-item__color-tag">
                    <span class="cart-item__color-dot" style="background:${esc(item.color)}" title="${esc(item.colorName || item.color)}"></span>
                    ${esc(item.colorName || '')}
                  </span>
                ` : ''}
                ${item.size ? `<span>Size ${esc(item.size)}</span>` : ''}
                ${item.customized && item.customization?.previewImage ? `
                <button class="cart-item__preview-btn" type="button"
                        aria-label="View saved design for ${esc(item.name)}"
                        onclick="openDesignPreview(event, '${esc(item.key)}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View design
                </button>` : ''}
              </div>
              ${item.designFee ? `<p class="cart-item__design-fee">Incl. design fee ${money(item.designFee)}</p>` : ''}
            </div>
            <span class="cart-item__price cart-item__text">${money(item.price * item.qty)}</span>
          </div>

          <div class="cart-item__actions">
            <div class="cart-item__controls">
              <div class="product__qty" role="group" aria-label="Quantity selector for ${esc(item.name)}">
                <button class="product__qty-btn" type="button" aria-label="Decrease quantity" onclick="updateQuantity('${esc(item.key)}', -1)" ${item.qty <= 1 ? 'disabled' : ''}>−</button>
                <output class="product__qty-val">${item.qty}</output>
                <button class="product__qty-btn" type="button" aria-label="Increase quantity" onclick="updateQuantity('${esc(item.key)}', 1)">+</button>
              </div>
              <p class="cart-item__line-total">Unit price ${money(item.price)}</p>
            </div>

            <button class="cart-item__remove" type="button" aria-label="Remove ${esc(item.name)} from cart" onclick="removeItem('${esc(item.key)}')">
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="Menu / Close_SM">
              <path id="Vector" d="M16 16L12 12M12 12L8 8M12 12L16 8M12 12L8 16" stroke="#383838" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  updateSummary(totalItems, subtotal);
}

function updateSummary(totalItems, subtotal) {
  const countEl = $('#summaryItemCount');
  const subEl = $('#summarySubtotal');
  const discountEl = $('#summaryDiscount');
  const totEl = $('#summaryTotal');
  const noteEl = $('#checkoutNote');

  if (countEl) countEl.textContent = totalItems;
  if (subEl) subEl.textContent = money(subtotal);
  if (discountEl) discountEl.textContent = money(0);
  if (totEl) totEl.textContent = money(subtotal);
  if (noteEl) {
    noteEl.textContent = totalItems
      ? 'Secure checkout with free shipping on every order.'
      : 'Add products to continue to checkout.';
  }
}

export function initCart() {
  window.updateQuantity = updateQuantity;
  window.removeItem = removeItem;
  window.openDesignPreview = openDesignPreview;

  cartData = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  cartData.reverse();
  renderCart();
  bindCheckoutButton();
}
