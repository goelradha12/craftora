/* ============================================================
   checkout.js — Craftora Checkout Page
   Reads from sessionStorage checkout session (supports both
   "buy-now" and "cart" flows).
   ============================================================ */

var CART_KEY = 'cart';
var ORDERS_KEY = 'craftora_orders';
var CHECKOUT_SESSION_KEY = 'craftora_checkout';

var $ = function(sel, root) { return (root || document).querySelector(sel); };
var $$ = function(sel, root) { return Array.from((root || document).querySelectorAll(sel)); };
var money = function(n) { return '\u20B9' + Number(n || 0).toLocaleString('en-IN'); };
var esc = function(s) {
  return String(s != null ? s : '').replace(/[&<>"']/g, function(m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
};

function generateOrderId() {
  return 'CRF-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
}

function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch(e) { return []; }
}

function addOrder(order) {
  var orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

/* ── Get Checkout Session ── */
function getCheckoutSession() {
  try {
    return JSON.parse(sessionStorage.getItem(CHECKOUT_SESSION_KEY) || 'null');
  } catch(e) {
    return null;
  }
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', function() {
  var session = getCheckoutSession();

  // If no checkout session, redirect back to cart
  if (!session || !session.items || !session.items.length) {
    window.location.href = './cart.html';
    return;
  }

  var items = session.items;

  // Pre-fill from user data if logged in
  try {
    var user = JSON.parse(localStorage.getItem('craftora_user') || 'null');
    if (user) {
      if (user.name) $('#co-name').value = user.name;
      if (user.phone) $('#co-phone').value = user.phone;
      if (user.email) $('#co-email').value = user.email;
      if (user.addressObj) {
        var a = user.addressObj;
        if (a.house) $('#co-addr1').value = a.house;
        if (a.street) $('#co-addr2').value = a.street;
        if (a.city) $('#co-city').value = a.city;
        if (a.state) $('#co-state').value = a.state;
        if (a.pincode) $('#co-pin').value = a.pincode;
      }
    }
  } catch(e) {}

  renderSummary(items);
  bindPaymentOptions();
  bindPlaceOrder(items, session.source);
});

/* ── Render Order Summary ── */
function renderSummary(items) {
  var itemsEl = $('#summaryItems');
  var subtotal = 0;

  itemsEl.innerHTML = items.map(function(item) {
    var lineTotal = (item.price || 0) * (item.qty || 1);
    subtotal += lineTotal;

    var meta = [];
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

/* ── Payment Selection ── */
function bindPaymentOptions() {
  var options = $$('.checkout-payment__option');
  options.forEach(function(opt) {
    opt.addEventListener('click', function() {
      options.forEach(function(o) { o.classList.remove('selected'); });
      opt.classList.add('selected');
      opt.querySelector('input[type="radio"]').checked = true;
      $('#co-payment-err').textContent = '';
    });
  });
}

/* ── Validation ── */
function validateCheckout() {
  var valid = true;

  var fields = [
    { id: 'co-name', err: 'co-name-err', msg: 'Full name is required.' },
    { id: 'co-phone', err: 'co-phone-err', msg: 'Phone number is required.', extra: function(v) {
      if (v && v.replace(/\D/g, '').length < 10) return 'Enter a valid 10-digit phone number.';
      return '';
    }},
    { id: 'co-addr1', err: 'co-addr1-err', msg: 'Address is required.' },
    { id: 'co-city', err: 'co-city-err', msg: 'City is required.' },
    { id: 'co-state', err: 'co-state-err', msg: 'State is required.' },
    { id: 'co-pin', err: 'co-pin-err', msg: 'PIN code is required.', extra: function(v) {
      if (v && !/^\d{6}$/.test(v)) return 'Enter a valid 6-digit PIN code.';
      return '';
    }},
  ];

  fields.forEach(function(f) {
    var el = $('#' + f.id);
    var errEl = $('#' + f.err);
    var val = el ? el.value.trim() : '';
    var msg = '';

    if (!val) {
      msg = f.msg;
    } else if (f.extra) {
      msg = f.extra(val);
    }

    if (errEl) errEl.textContent = msg;
    if (el) el.classList.toggle('is-invalid', !!msg);
    if (msg) valid = false;
  });

  // Payment validation
  var paymentSelected = document.querySelector('input[name="payment"]:checked');
  if (!paymentSelected) {
    $('#co-payment-err').textContent = 'Please select a payment method.';
    valid = false;
  }

  return valid;
}

/* ── Place Order ── */
function bindPlaceOrder(items, source) {
  $('#placeOrderBtn').addEventListener('click', function() {
    if (!validateCheckout()) return;

    var name = $('#co-name').value.trim();
    var phone = $('#co-phone').value.trim();
    var email = $('#co-email').value.trim();
    var addr1 = $('#co-addr1').value.trim();
    var addr2 = $('#co-addr2').value.trim();
    var city = $('#co-city').value.trim();
    var state = $('#co-state').value.trim();
    var pin = $('#co-pin').value.trim();
    var country = $('#co-country').value.trim();
    var payment = document.querySelector('input[name="payment"]:checked').value;

    var addressObj = {
      house: addr1,
      street: addr2,
      city: city,
      state: state,
      pincode: pin,
      country: country
    };

    var formatted = [addr1, addr2, city, state].filter(Boolean).join(', ') + (pin ? ' - ' + pin : '');

    var orderId = generateOrderId();
    var subtotal = items.reduce(function(sum, item) { return sum + ((item.price || 0) * (item.qty || 1)); }, 0);
    var designFeesTotal = items.reduce(function(sum, item) { return sum + ((item.designFee || 0) * (item.qty || 1)); }, 0);
    var itemsCount = items.reduce(function(sum, item) { return sum + (item.qty || 1); }, 0);

    addOrder({
      id: orderId,
      date: new Date().toISOString(),
      status: 'Processing',
      version: 2,
      customer: { name: name, phone: phone, email: email },
      shipping: {
        house: addr1,
        street: addr2,
        city: city,
        state: state,
        pincode: pin,
        country: country,
        formatted: formatted
      },
      items: items.map(function(item) {
        return {
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
        };
      }),
      summary: {
        items: itemsCount,
        subtotal: subtotal,
        designFees: designFeesTotal,
        shipping: 0,
        total: subtotal
      },
      delivery: { address: addressObj, phone: phone },
      payment: payment
    });

    // Save user address for future use
    try {
      var user = JSON.parse(localStorage.getItem('craftora_user') || 'null');
      if (user) {
        user.name = name;
        user.phone = phone;
        if (email) user.email = email;
        user.address = formatted;
        user.addressObj = addressObj;
        localStorage.setItem('craftora_user', JSON.stringify(user));
      }
    } catch(e) {}

    localStorage.setItem('lastOrderId', orderId);

    // Post-order cleanup based on source
    if (source === 'cart') {
      // Clear the cart
      localStorage.removeItem(CART_KEY);
    }
    // For "buy-now", cart is left untouched

    // Always remove the checkout session
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);

    // Update cart badges if available
    if (typeof updateCartBadges === 'function') updateCartBadges();

    // Redirect to thank you
    window.location.href = './thank-you.html?orderId=' + encodeURIComponent(orderId);
  });
}
