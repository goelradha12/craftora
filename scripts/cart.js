const CART_KEY = 'cart';
const ORDERS_KEY = 'craftora_orders';

const $ = (sel, root = document) => root.querySelector(sel);
const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[m]);

let cartData = [];

function generateOrderId() {
  return `CRF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function openDesignPreview(event, productKey) {
  event.stopPropagation();
  if (typeof DesignPreview !== 'undefined') {
    DesignPreview.showCartCustomization(productKey);
  }
}


function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function addOrder(order) {
  const orders = getOrders();

  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function showCheckoutPopup(user, onConfirm) {
  const userData = typeof user === 'string' ? JSON.parse(user) : user;
  const addr = typeof userData.addressObj === 'object' ? userData.addressObj : {};

  const overlay = document.createElement('div');
  overlay.id = 'checkoutOverlay';
  overlay.className = 'checkout-modal';
  overlay.innerHTML = `
    <div class="checkout-modal__dialog checkout-modal__dialog--large" role="dialog" aria-modal="true" aria-labelledby="popupTitle">
      <div class="checkout-modal__header">
        <div class="checkout-modal__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
        </div>
        <div>
          <p id="popupTitle" class="checkout-modal__title">Delivery Details</p>
          <p class="checkout-modal__subtitle">Please fill in your delivery address and contact details.</p>
        </div>
        <button id="popupClose" class="checkout-modal__close cart-item__remove" type="button" aria-label="Close">
        <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 16L12 12M12 12L8 8M12 12L16 8M12 12L8 16" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg></button>
      </div>

      <div class="checkout-modal__section">
        <h3 class="checkout-modal__section-title">Contact Information</h3>
        <div class="checkout-modal__grid">
          <div class="checkout-modal__field">
            <label class="checkout-modal__label" for="popupName">Full Name *</label>
            <input id="popupName" class="checkout-modal__input" type="text" value="${esc(userData.name || '')}" placeholder="John Doe" autocomplete="name">
            <p class="checkout-modal__error" id="popupNameError" aria-live="polite"></p>
          </div>
          <div class="checkout-modal__field">
            <label class="checkout-modal__label" for="popupPhone">Phone Number *</label>
            <input id="popupPhone" class="checkout-modal__input" type="tel" value="${esc(userData.phone || '')}" placeholder="10-digit number" inputmode="numeric" maxlength="10" autocomplete="tel">
            <p class="checkout-modal__error" id="popupPhoneError" aria-live="polite"></p>
          </div>
        </div>
      </div>

      <div class="checkout-modal__section">
        <h3 class="checkout-modal__section-title">Delivery Address</h3>
        <div class="checkout-modal__grid">
          <div class="checkout-modal__field">
            <label class="checkout-modal__label" for="popupHouse">Apartment / House Number *</label>
            <input id="popupHouse" class="checkout-modal__input" type="text" value="${esc(addr.house || '')}" placeholder="Flat 101, Building Name">
            <p class="checkout-modal__error" id="popupHouseError" aria-live="polite"></p>
          </div>
          <div class="checkout-modal__field">
            <label class="checkout-modal__label" for="popupStreet">Street / Area / Locality *</label>
            <input id="popupStreet" class="checkout-modal__input" type="text" value="${esc(addr.street || '')}" placeholder="Main Street, Area">
            <p class="checkout-modal__error" id="popupStreetError" aria-live="polite"></p>
          </div>
        </div>
        <div class="checkout-modal__field">
          <label class="checkout-modal__label" for="popupLandmark">Landmark (Optional)</label>
          <input id="popupLandmark" class="checkout-modal__input" type="text" value="${esc(addr.landmark || '')}" placeholder="Near park, Behind school">
        </div>
      </div>

      <div class="checkout-modal__section">
        <h3 class="checkout-modal__section-title">Location Details</h3>
        <div class="checkout-modal__grid checkout-modal__grid-3">
          <div class="checkout-modal__field">
            <label class="checkout-modal__label" for="popupCity">City *</label>
            <input id="popupCity" class="checkout-modal__input" type="text" value="${esc(addr.city || '')}" placeholder="City name">
            <p class="checkout-modal__error" id="popupCityError" aria-live="polite"></p>
          </div>
          <div class="checkout-modal__field">
            <label class="checkout-modal__label" for="popupState">State *</label>
            <input id="popupState" class="checkout-modal__input" type="text" value="${esc(addr.state || '')}" placeholder="State name">
            <p class="checkout-modal__error" id="popupStateError" aria-live="polite"></p>
          </div>
          <div class="checkout-modal__field">
            <label class="checkout-modal__label" for="popupPincode">Pincode *</label>
            <input id="popupPincode" class="checkout-modal__input" type="text" value="${esc(addr.pincode || '')}" placeholder="6-digit pincode" inputmode="numeric" maxlength="6">
            <p class="checkout-modal__error" id="popupPincodeError" aria-live="polite"></p>
          </div>
        </div>
      </div>

      <div class="checkout-modal__actions" style="margin-top: var(--space-4);">
        <button id="popupConfirm" class="checkout-btn" type="button" disabled style="margin-top: 0;">Place order</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const fields = {
    name: { el: $('#popupName', overlay), err: $('#popupNameError', overlay), req: true },
    phone: { el: $('#popupPhone', overlay), err: $('#popupPhoneError', overlay), req: true },
    house: { el: $('#popupHouse', overlay), err: $('#popupHouseError', overlay), req: true },
    street: { el: $('#popupStreet', overlay), err: $('#popupStreetError', overlay), req: true },
    city: { el: $('#popupCity', overlay), err: $('#popupCityError', overlay), req: true },
    state: { el: $('#popupState', overlay), err: $('#popupStateError', overlay), req: true },
    pincode: { el: $('#popupPincode', overlay), err: $('#popupPincodeError', overlay), req: true },
    landmark: { el: $('#popupLandmark', overlay), err: null, req: false },
  };

  const confirmBtn = $('#popupConfirm', overlay);

  function setFieldError(input, errorNode, message) {
    input.classList.toggle('is-invalid', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorNode) {
        errorNode.textContent = message || '';
        errorNode.classList.toggle('is-visible', Boolean(message));
    }
  }

  function validateField(key) {
    const f = fields[key];
    const val = f.el.value.trim();
    let error = '';

    if (f.req && !val) {
      error = 'This field is required.';
    } else if (key === 'phone') {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 10) error = 'Enter a valid 10-digit phone number.';
    } else if (key === 'pincode') {
      if (!/^\d{6}$/.test(val)) error = 'Please enter a valid 6-digit pincode.';
    }

    setFieldError(f.el, f.err, error);
    return error === '';
  }

  function checkAllValid() {
    let allValid = true;
    for (const key in fields) {
      if (fields[key].req) {
        const val = fields[key].el.value.trim();
        if (!val) allValid = false;
        if (key === 'phone' && val.replace(/\D/g, '').length < 10) allValid = false;
        if (key === 'pincode' && !/^\d{6}$/.test(val)) allValid = false;
      }
    }
    confirmBtn.disabled = !allValid;
  }

  // Bind events
  for (const key in fields) {
    fields[key].el.addEventListener('input', () => {
      if (key === 'phone') fields[key].el.value = fields[key].el.value.replace(/\D/g, '').slice(0, 10);
      if (key === 'pincode') fields[key].el.value = fields[key].el.value.replace(/\D/g, '').slice(0, 6);
      
      // Clear error on type, but check overall validity
      setFieldError(fields[key].el, fields[key].err, '');
      checkAllValid();
    });

    fields[key].el.addEventListener('blur', () => {
      validateField(key);
      checkAllValid();
    });
  }

  function close() {
    document.removeEventListener('keydown', handleEsc);
    overlay.remove();
    document.body.style.overflow = '';
  }

  function handleEsc(event) {
    if (event.key === 'Escape') close();
  }

  overlay.addEventListener('click', event => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', handleEsc);

  $('#popupClose', overlay).addEventListener('click', close);
  
  checkAllValid();
  fields.name.el.focus();

  confirmBtn.addEventListener('click', () => {
    let valid = true;
    let firstInvalid = null;

    for (const key in fields) {
      if (!validateField(key)) {
        valid = false;
        if (!firstInvalid) firstInvalid = fields[key].el;
      }
    }

    if (!valid) {
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const addressObj = {
      house: fields.house.el.value.trim(),
      street: fields.street.el.value.trim(),
      landmark: fields.landmark.el.value.trim(),
      city: fields.city.el.value.trim(),
      state: fields.state.el.value.trim(),
      pincode: fields.pincode.el.value.trim()
    };

    const landmarkStr = addressObj.landmark ? `${addressObj.landmark}, ` : '';
    const formattedAddress = `${addressObj.house}, ${addressObj.street}, ${landmarkStr}${addressObj.city}, ${addressObj.state} - ${addressObj.pincode}`;
    const phoneDigits = fields.phone.el.value.trim();
    const updatedName = fields.name.el.value.trim();

    const updated = { ...userData, name: updatedName, address: formattedAddress, addressObj, phone: phoneDigits };
    localStorage.setItem('craftora_user', JSON.stringify(updated));
    try {
      const accounts = JSON.parse(localStorage.getItem('craftora_accounts') || '[]');
      const nextAccounts = accounts.map(account => account.email === updated.email
        ? { ...account, name: updatedName, address: formattedAddress, addressObj, phone: phoneDigits }
        : account);
      localStorage.setItem('craftora_accounts', JSON.stringify(nextAccounts));
    } catch { }

    close();
    onConfirm({ address: addressObj, phone: phoneDigits, name: updatedName });
  });
}

function initCart() {
  cartData = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  renderCart();
  bindCheckoutButton();
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cartData));
  if (typeof updateCartBadges === 'function') updateCartBadges();
  renderCart();
}

function updateQuantity(key, delta) {
  const item = cartData.find(i => i.key === key);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    removeItem(key);
  } else {
    saveCart();
  }
}

function removeItem(key) {
  cartData = cartData.filter(i => i.key !== key);
  saveCart();
}

function bindCheckoutButton() {
  const checkoutBtn = $('#checkoutBtn');
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener('click', () => {
    if (cartData.length === 0) {
      window.CraftoraUI?.showToast({
        id: 'cart-empty',
        variant: 'warning',
        title: 'Your cart is empty',
        message: 'Add a product before proceeding to checkout.'
      });
      return;
    }

    const raw = localStorage.getItem('craftora_user');
    if (!raw) {
      showGuestLoginPrompt();
      return;
    }

    showCheckoutPopup(raw, ({ address, phone, name }) => {
      const orderId = generateOrderId();
      const user = JSON.parse(raw);
      const subtotal = cartData.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const designFeesTotal = cartData.reduce((sum, item) => sum + ((item.designFee || 0) * item.qty), 0);
      const itemsCount = cartData.reduce((sum, item) => sum + item.qty, 0);

      addOrder({
        id: orderId,
        date: new Date().toISOString(),
        status: 'Processing',
        version: 2,
        customer: {
          name: name || user.name || '',
          phone: phone,
          email: user.email || ''
        },
        shipping: {
          ...address,
          formatted: `${address.house}, ${address.street}${address.landmark ? ', ' + address.landmark : ''}, ${address.city}, ${address.state} - ${address.pincode}`
        },
        items: cartData.map(item => ({
          id: item.id,
          key: item.key,
          name: item.name,
          image: item.image,
          category: item.category || '',
          basePrice: item.basePrice || item.price || 0,
          designFee: item.designFee || 0,
          price: item.price || 0,
          qty: item.qty,
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
        // Legacy compatibility fields
        delivery: { address, phone },
        payment: 'Cash on Delivery'
      });

      localStorage.setItem('lastOrderId', orderId);
      localStorage.setItem('lastOrderTotal', JSON.stringify({
        items: itemsCount,
        subtotal,
        address,
        phone
      }));

      cartData = [];
      localStorage.removeItem(CART_KEY);
      if (typeof updateCartBadges === 'function') updateCartBadges();

      window.location.href = `./thank-you.html?status=success&orderId=${encodeURIComponent(orderId)}`;
    });
  });
}

function renderCart() {
  const container = $('#cartItemsContainer');
  const checkoutBtn = $('#checkoutBtn');

  if (cartData.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <a href="./products.html">Continue Shopping</a>
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
        <div class="cart-item__img-wrap">
          <img class="cart-item__img" src="${esc(item.image)}" alt="${esc(item.name)}" width="120" height="120" fetchpriority="high">
        </div>

        <div class="cart-item__details">
          <div class="cart-item__header">
            <div>
              <h3 class="cart-item__name cart-item__text" onclick="window.location.href='./product.html?id=${item.id}'">${esc(item.name)}</h3>
              <div class="cart-item__meta">
                ${item.color ? `
                  <span class="cart-item__color-tag">
                    <span class="cart-item__color-dot" style="background:${esc(item.color)}" title="${esc(item.colorName || item.color)}"></span>
                    ${esc(item.colorName || '')}
                  </span>
                ` : ''}
                ${item.size ? `<span>Size ${esc(item.size)}</span>` : ''}
                ${item.customized ? `<span class="cart-item__badge-custom">Designed</span>` : ''}
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
                <button class="product__qty-btn" type="button" aria-label="Decrease quantity" onclick="updateQuantity('${esc(item.key)}', -1)">−</button>
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

function showGuestLoginPrompt() {
  const overlay = document.createElement('div');
  overlay.className = 'checkout-modal';
  overlay.innerHTML = `
    <div class="checkout-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="guestTitle">
      <div class="checkout-modal__header">
        <div class="checkout-modal__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </div>
        <div>
          <p id="guestTitle" class="checkout-modal__title">Sign in required</p>
          <p class="checkout-modal__subtitle">You need to sign in before placing an order. Would you like to continue to the login page?</p>
        </div>
        <button class="checkout-modal__close cart-item__remove" type="button" aria-label="Close" id="guestClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 16L12 12M12 12L8 8M12 12L16 8M12 12L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="checkout-modal__actions" style="display:flex;gap:var(--space-3);margin-top:var(--space-5);">
        <button class="checkout-btn checkout-btn--secondary" type="button" id="guestCancel">Cancel</button>
        <button class="checkout-btn" type="button" id="guestConfirm">Sign In</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  function close() {
    overlay.remove();
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  $('#guestClose', overlay).addEventListener('click', close);
  $('#guestCancel', overlay).addEventListener('click', close);
  $('#guestConfirm', overlay).addEventListener('click', () => {
    close();
    window.location.href = './login.html';
  });

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
  });
}

document.addEventListener('DOMContentLoaded', initCart);
