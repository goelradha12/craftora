/* ============================================================
   checkout.js — Craftora Checkout Page
   Ported from client/scripts/checkout.js, exported as ESM.
   Reads from sessionStorage checkout session (supports both
   "buy-now" and "cart" flows).
   ============================================================ */

import { updateCartBadges } from './layout.js';

const CART_KEY = 'cart';
const ORDERS_KEY = 'craftora_orders';
const CHECKOUT_SESSION_KEY = 'craftora_checkout';

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const esc = s => String(s != null ? s : '').replace(/[&<>"']/g, m => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
));

function generateOrderId() {
  return 'CRF-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
}

function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch (e) { return []; }
}

function addOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function isLoggedIn() {
  try {
    const raw = localStorage.getItem('craftora_user');
    if (!raw) return false;
    const user = JSON.parse(raw);
    return !!(user && user.phone);
  } catch (e) {
    return false;
  }
}

function getCheckoutSession() {
  try {
    return JSON.parse(sessionStorage.getItem(CHECKOUT_SESSION_KEY) || 'null');
  } catch (e) {
    return null;
  }
}

function renderSummary(items) {
  const itemsEl = $('#summaryItems');
  let subtotal = 0;

  itemsEl.innerHTML = items.map(item => {
    const lineTotal = (item.price || 0) * (item.qty || 1);
    subtotal += lineTotal;

    const meta = [];
    if (item.size) meta.push('Size ' + esc(item.size));
    if (item.colorName) meta.push(esc(item.colorName));
    if (item.customized) meta.push('Custom');
    meta.push('Qty: ' + (item.qty || 1));

    return '<div class="checkout-summary__item">' +
      '<img class="checkout-summary__item-img" src="' + esc(item.image) + '" alt="' + esc(item.name) + '">' +
      '<div class="checkout-summary__item-info">' +
        '<p class="checkout-summary__item-name">' + esc(item.name) + '</p>' +
        '<p class="checkout-summary__item-meta">' + meta.join(' &middot; ') + '</p>' +
      '</div>' +
      '<span class="checkout-summary__item-price">' + money(lineTotal) + '</span>' +
    '</div>';
  }).join('');

  $('#coSubtotal').textContent = money(subtotal);
  $('#coTotal').textContent = money(subtotal);
}

function bindPaymentOptions() {
  const options = $$('.checkout-payment__option');
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input[type="radio"]').checked = true;
      $('#co-payment-err').textContent = '';
    });
  });
}

function validateCheckout() {
  let valid = true;

  const fields = [
    { id: 'co-name', err: 'co-name-err', msg: 'Full name is required.' },
    {
      id: 'co-phone', err: 'co-phone-err', msg: 'Phone number is required.', extra: (v) => {
        if (v && v.replace(/\D/g, '').length < 10) return 'Enter a valid 10-digit phone number.';
        return '';
      }
    },
    { id: 'co-addr1', err: 'co-addr1-err', msg: 'Address is required.' },
    { id: 'co-city', err: 'co-city-err', msg: 'City is required.' },
    { id: 'co-state', err: 'co-state-err', msg: 'State is required.' },
    {
      id: 'co-pin', err: 'co-pin-err', msg: 'PIN code is required.', extra: (v) => {
        if (v && !/^\d{6}$/.test(v)) return 'Enter a valid 6-digit PIN code.';
        return '';
      }
    },
  ];

  fields.forEach(f => {
    const el = $('#' + f.id);
    const errEl = $('#' + f.err);
    const val = el ? el.value.trim() : '';
    let msg = '';

    if (!val) {
      msg = f.msg;
    } else if (f.extra) {
      msg = f.extra(val);
    }

    if (errEl) errEl.textContent = msg;
    if (el) el.classList.toggle('is-invalid', !!msg);
    if (msg) valid = false;
  });

  const paymentSelected = document.querySelector('input[name="payment"]:checked');
  if (!paymentSelected) {
    $('#co-payment-err').textContent = 'Please select a payment method.';
    valid = false;
  }

  return valid;
}

function bindPlaceOrder(items, source) {
  $('#placeOrderBtn').addEventListener('click', () => {
    if (!validateCheckout()) return;

    const name = $('#co-name').value.trim();
    const phone = $('#co-phone').value.trim();
    const email = $('#co-email').value.trim();
    const addr1 = $('#co-addr1').value.trim();
    const addr2 = $('#co-addr2').value.trim();
    const city = $('#co-city').value.trim();
    const state = $('#co-state').value.trim();
    const pin = $('#co-pin').value.trim();
    const country = $('#co-country').value.trim();
    const payment = document.querySelector('input[name="payment"]:checked').value;

    const addressObj = { house: addr1, street: addr2, city, state, pincode: pin, country };
    const formatted = [addr1, addr2, city, state].filter(Boolean).join(', ') + (pin ? ' - ' + pin : '');

    const orderId = generateOrderId();
    const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
    const designFeesTotal = items.reduce((sum, item) => sum + ((item.designFee || 0) * (item.qty || 1)), 0);
    const itemsCount = items.reduce((sum, item) => sum + (item.qty || 1), 0);

    addOrder({
      id: orderId,
      date: new Date().toISOString(),
      status: 'Processing',
      version: 2,
      customer: { name, phone, email },
      shipping: { house: addr1, street: addr2, city, state, pincode: pin, country, formatted },
      items: items.map(item => ({
        id: item.id,
        key: item.key,
        name: item.name,
        image: item.image,
        category: item.category || '',
        basePrice: item.basePrice || item.price || 0,
        designFee: item.designFee || 0,
        price: item.price || 0,
        qty: item.qty || 1,
        size: item.size || '',
        color: item.color || '',
        colorName: item.colorName || '',
        customized: !!item.customized,
        designRequired: !!item.designRequired || !!item.customized
      })),
      summary: {
        items: itemsCount,
        subtotal,
        designFees: designFeesTotal,
        shipping: 0,
        total: subtotal
      },
      delivery: { address: addressObj, phone },
      payment
    });

    try {
      const user = JSON.parse(localStorage.getItem('craftora_user') || 'null');
      if (user) {
        user.name = name;
        user.phone = phone;
        if (email) user.email = email;
        user.address = formatted;
        user.addressObj = addressObj;
        localStorage.setItem('craftora_user', JSON.stringify(user));
      }
    } catch (e) { }

    localStorage.setItem('lastOrderId', orderId);

    if (source === 'cart') {
      localStorage.removeItem(CART_KEY);
    }

    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);

    updateCartBadges();

    window.location.href = '/thank-you?orderId=' + encodeURIComponent(orderId);
  });
}

export function initCheckout() {
  if (!isLoggedIn()) {
    const mainEl = document.getElementById('main-content');
    if (mainEl) mainEl.innerHTML = '';
    return;
  }

  const session = getCheckoutSession();

  if (!session || !session.items || !session.items.length) {
    window.location.href = '/cart';
    return;
  }

  const items = session.items;

  try {
    const user = JSON.parse(localStorage.getItem('craftora_user') || 'null');
    if (user) {
      if (user.name) $('#co-name').value = user.name;
      if (user.phone) $('#co-phone').value = user.phone;
      if (user.email) $('#co-email').value = user.email;
      if (user.addressObj) {
        const a = user.addressObj;
        if (a.house) $('#co-addr1').value = a.house;
        if (a.street) $('#co-addr2').value = a.street;
        if (a.city) $('#co-city').value = a.city;
        if (a.state) $('#co-state').value = a.state;
        if (a.pincode) $('#co-pin').value = a.pincode;
      }
    }
  } catch (e) { }

  renderSummary(items);
  bindPaymentOptions();
  bindPlaceOrder(items, session.source);
}
