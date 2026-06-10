const CART_KEY = 'cart';

const $ = (sel, root = document) => root.querySelector(sel);
const money = n => `Rs ${Number(n || 0).toLocaleString('en-IN')}`;
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

function showCheckoutPopup(user, onConfirm) {
  const userData = typeof user === 'string' ? JSON.parse(user) : user;

  const overlay = document.createElement('div');
  overlay.id = 'checkoutOverlay';
  overlay.className = 'checkout-modal';
  overlay.innerHTML = `
    <div class="checkout-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="popupTitle">
      <div class="checkout-modal__header">
        <div class="checkout-modal__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
        </div>
        <div>
          <p id="popupTitle" class="checkout-modal__title">Confirm delivery details</p>
          <p class="checkout-modal__subtitle">Review your address and phone number before placing the order.</p>
        </div>
        <button id="popupClose" class="checkout-modal__close" type="button" aria-label="Close">&times;</button>
      </div>

      <div class="checkout-modal__field">
        <label class="checkout-modal__label" for="popupAddress">Delivery address</label>
        <input id="popupAddress" class="checkout-modal__input" type="text" value="${esc(userData.address || '')}"
          placeholder="Enter your full delivery address" autocomplete="street-address">
        <p class="checkout-modal__error" id="popupAddressError" aria-live="polite"></p>
      </div>

      <div class="checkout-modal__field">
        <label class="checkout-modal__label" for="popupPhone">Phone number</label>
        <input id="popupPhone" class="checkout-modal__input" type="tel" value="${esc(userData.phone || '')}"
          placeholder="Enter your phone number" inputmode="numeric" maxlength="10" autocomplete="tel">
        <p class="checkout-modal__error" id="popupPhoneError" aria-live="polite"></p>
      </div>

      <div class="checkout-modal__user">
        <div class="checkout-modal__avatar" aria-hidden="true">${esc(userData.name?.charAt(0).toUpperCase() || '?')}</div>
        <div>
          <p>${esc(userData.name || '')}</p>
          <p>${esc(userData.email || '')}</p>
        </div>
      </div>

      <div class="checkout-modal__actions">
        <button id="popupConfirm" class="checkout-btn" type="button">Place order</button>
        <button id="popupCancel" class="checkout-modal__secondary" type="button">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const addressEl = $('#popupAddress', overlay);
  const phoneEl = $('#popupPhone', overlay);
  const addressErrorEl = $('#popupAddressError', overlay);
  const phoneErrorEl = $('#popupPhoneError', overlay);

  function setFieldError(input, errorNode, message) {
    input.classList.toggle('is-invalid', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    errorNode.textContent = message || '';
    errorNode.classList.toggle('is-visible', Boolean(message));
  }

  function close() {
    document.removeEventListener('keydown', handleEsc);
    overlay.remove();
    document.body.style.overflow = '';
  }

  function handleEsc(event) {
    if (event.key === 'Escape') close();
  }

  addressEl.addEventListener('input', () => setFieldError(addressEl, addressErrorEl, ''));
  phoneEl.addEventListener('input', () => {
    phoneEl.value = window.CraftoraUI?.normalizePhoneInput(phoneEl.value) || phoneEl.value;
    setFieldError(phoneEl, phoneErrorEl, '');
  });

  overlay.addEventListener('click', event => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', handleEsc);

  $('#popupClose', overlay).addEventListener('click', close);
  $('#popupCancel', overlay).addEventListener('click', close);
  window.CraftoraUI?.bindPhoneInput(phoneEl);
  addressEl.focus();

  $('#popupConfirm', overlay).addEventListener('click', () => {
    const address = addressEl.value.trim();
    const phone = phoneEl.value.trim();
    const phoneValidation = window.CraftoraUI?.validatePhoneNumber(phone) || {
      valid: !!phone,
      error: phone ? '' : 'Phone number is required.',
      digits: phone
    };

    let valid = true;

    if (!address) {
      setFieldError(addressEl, addressErrorEl, 'Delivery address is required.');
      valid = false;
    } else {
      setFieldError(addressEl, addressErrorEl, '');
    }

    if (!phoneValidation.valid) {
      setFieldError(phoneEl, phoneErrorEl, phoneValidation.error);
      valid = false;
    } else {
      setFieldError(phoneEl, phoneErrorEl, '');
    }

    if (!valid) {
      (addressErrorEl.textContent ? addressEl : phoneEl).focus();
      return;
    }

    const updated = { ...userData, address, phone: phoneValidation.digits };
    localStorage.setItem('craftora_user', JSON.stringify(updated));
    try {
      const accounts = JSON.parse(localStorage.getItem('craftora_accounts') || '[]');
      const nextAccounts = accounts.map(account => account.email === updated.email
        ? { ...account, address, phone: phoneValidation.digits }
        : account);
      localStorage.setItem('craftora_accounts', JSON.stringify(nextAccounts));
    } catch { }

    close();
    onConfirm({ address, phone: phoneValidation.digits });
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
      window.CraftoraUI?.showToast({
        id: 'checkout-auth',
        variant: 'warning',
        title: 'Sign in required',
        message: 'Please log in first to place your order.'
      });
      window.location.href = './login.html';
      return;
    }

    showCheckoutPopup(raw, ({ address, phone }) => {
      const orderId = generateOrderId();
      const user = JSON.parse(raw);
      const subtotal = cartData.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const itemsCount = cartData.reduce((sum, item) => sum + item.qty, 0);

      window.CraftoraUI?.addOrder({
        id: orderId,
        date: new Date().toISOString(),
        status: 'Processing',
        items: cartData.map(item => ({
          id: item.id,
          key: item.key,
          name: item.name,
          image: item.image,
          price: item.price,
          qty: item.qty,
          size: item.size || '',
          color: item.color || '',
          customized: !!item.customized
        })),
        summary: {
          items: itemsCount,
          subtotal,
          shipping: 0,
          total: subtotal
        },
        delivery: {
          address,
          phone
        },
        customer: {
          name: user.name || '',
          email: user.email || ''
        }
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
          <img class="cart-item__img" src="${esc(item.image)}" alt="${esc(item.name)}">
        </div>

        <div class="cart-item__details">
          <div class="cart-item__header">
            <div>
              <h3 class="cart-item__name" onclick="window.location.href='./product.html?id=${item.id}'">${esc(item.name)}</h3>
              <div class="cart-item__meta">
                ${item.color ? `
                  <span>
                    Color
                    <span
                      style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${esc(item.color)};border:1px solid #d1d5db;"
                      title="${esc(item.color)}"
                    ></span>
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
            </div>
            <span class="cart-item__price">${money(item.price * item.qty)}</span>
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
              <span aria-hidden="true">&times;</span>
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

document.addEventListener('DOMContentLoaded', initCart);
