const CART_KEY = 'cart';

const $ = (sel, root = document) => root.querySelector(sel);
const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[m]);

let cartData = [];

function isUserLoggedIn() {
  const raw = localStorage.getItem('craftora_user');
  try { return raw ? !!JSON.parse(raw) : false; }
  catch { return false; }
}

function generateOrderId() {
  return `CRF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function showCheckoutPopup(user, onConfirm) {
  const userData = typeof user === 'string' ? JSON.parse(user) : user;

  const overlay = document.createElement('div');
  overlay.id = 'checkoutOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
  `;

  overlay.innerHTML = `
    <div style="
      background: #fff; border-radius: 14px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      padding: 1.75rem; width: 100%; max-width: 420px;
    " role="dialog" aria-modal="true" aria-labelledby="popupTitle">

      <div style="display:flex; align-items:center; gap:10px; margin-bottom:1.25rem;">
        <div style="
          width:36px; height:36px; border-radius:50%;
          background:#e6f9f1; display:flex; align-items:center;
          justify-content:center; flex-shrink:0; font-size:18px;
        ">📦</div>
        <div>
          <p id="popupTitle" style="margin:0; font-size:16px; font-weight:600; color:#1a1a1a;">Confirm delivery details</p>
          <p style="margin:2px 0 0; font-size:13px; color:#666;">Edit if anything has changed</p>
        </div>
        <button id="popupClose" style="
          margin-left:auto; background:none; border:none;
          font-size:22px; cursor:pointer; color:#aaa; line-height:1; padding:0 4px;
        " aria-label="Close">&times;</button>
      </div>

      <label style="display:block; font-size:11px; font-weight:600; color:#888;
        letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px;">
        Delivery address
      </label>
      <input id="popupAddress" type="text" value="${esc(userData.address || '')}"
        placeholder="Enter your full delivery address"
        style="width:100%; box-sizing:border-box; font-size:14px; padding:9px 12px;
          border:1px solid #ddd; border-radius:8px; margin-bottom:1rem;
          background:#f9f9f9; color:#1a1a1a; outline:none;" />

      <label style="display:block; font-size:11px; font-weight:600; color:#888;
        letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px;">
        Phone number
      </label>
      <input id="popupPhone" type="tel" value="${esc(userData.phone || '')}"
        placeholder="Enter your phone number"
        style="width:100%; box-sizing:border-box; font-size:14px; padding:9px 12px;
          border:1px solid #ddd; border-radius:8px; margin-bottom:1.25rem;
          background:#f9f9f9; color:#1a1a1a; outline:none;" />

      <div style="border-top:1px solid #f0f0f0; padding-top:1rem; margin-bottom:1.25rem;
        display:flex; align-items:center; gap:10px;">
        <div style="
          width:34px; height:34px; border-radius:50%; background:#eee;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:600; color:#555; flex-shrink:0;
        ">${esc(userData.name?.charAt(0).toUpperCase() || '?')}</div>
        <div>
          <p style="margin:0; font-size:13px; font-weight:500; color:#1a1a1a;">${esc(userData.name || '')}</p>
          <p style="margin:0; font-size:12px; color:#888;">${esc(userData.email || '')}</p>
        </div>
      </div>

      <button id="popupConfirm" style="
        width:100%; padding:11px; border-radius:8px;
        background:#1a1a1a; color:#fff; border:none;
        font-size:14px; font-weight:600; cursor:pointer; margin-bottom:8px;
      ">Place order</button>

      <button id="popupCancel" style="
        width:100%; padding:11px; border-radius:8px;
        background:transparent; color:#888;
        border:1px solid #e0e0e0; font-size:13px; cursor:pointer;
      ">Cancel</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    document.body.removeChild(overlay);
    document.body.style.overflow = '';
  };

  overlay.querySelector('#popupClose').onclick = close;
  overlay.querySelector('#popupCancel').onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };

  // Focus ring on inputs when interacted with
  ['popupAddress', 'popupPhone'].forEach(id => {
    const el = overlay.querySelector(`#${id}`);
    el.onfocus = () => { el.style.borderColor = '#1a1a1a'; el.style.background = '#fff'; };
    el.oninput = () => { el.style.borderColor = '#ddd'; };
  });

  overlay.querySelector('#popupConfirm').onclick = () => {
    const addressEl = overlay.querySelector('#popupAddress');
    const phoneEl = overlay.querySelector('#popupPhone');
    const address = addressEl.value.trim();
    const phone = phoneEl.value.trim();

    let valid = true;

    if (!address) {
      addressEl.style.borderColor = '#e53e3e';
      addressEl.style.background = '#fff5f5';
      addressEl.focus();
      valid = false;
    }

    if (!phone) {
      phoneEl.style.borderColor = '#e53e3e';
      phoneEl.style.background = '#fff5f5';
      if (valid) phoneEl.focus();
      valid = false;
    }

    if (!valid) return;

    // Persist updated details back to localStorage
    const updated = { ...userData, address, phone };
    localStorage.setItem('craftora_user', JSON.stringify(updated));

    close();
    onConfirm({ address, phone });
  };
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
      alert('Your cart is empty.');
      return;
    }

    const raw = localStorage.getItem('craftora_user');
    if (!raw) {
      alert('Please log in first to place your order.');
      window.location.href = './login.html';
      return;
    }

    showCheckoutPopup(raw, ({ address, phone }) => {
      const orderId = generateOrderId();

      localStorage.setItem('lastOrderId', orderId);
      localStorage.setItem('lastOrderTotal', JSON.stringify({
        items: cartData.reduce((sum, item) => sum + item.qty, 0),
        subtotal: cartData.reduce((sum, item) => sum + (item.price * item.qty), 0),
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
            <h3 class="cart-item__name" onclick="window.location.href='./product.html?id=${item.id}'">${esc(item.name)}</h3>
            <span class="cart-item__price">${money(item.price * item.qty)}</span>
          </div>

          <div class="cart-item__meta">
            ${item.color ? `
              <span class="cart-meta-color">
                Color:
                <span
                  style="
                    display:inline-block;
                    width:14px;
                    height:14px;
                    border-radius:50%;
                    background:${esc(item.color)};
                    border:1px solid #d1d5db;
                    vertical-align:middle;
                    margin-left:4px;
                  "
                  title="${esc(item.color)}"
                ></span>,
              </span>
            ` : ''}

            ${item.size ? `<span>Size: ${esc(item.size)},</span>` : ''}

            ${item.customized && item.customization?.generatedAt ? `
              <span>
                Designed on:
                ${new Date(item.customization.generatedAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
              </span>
            ` : ''}
          </div>

          <div class="cart-item__actions">
            <div class="product__qty">
              <button class="product__qty-btn" onclick="updateQuantity('${esc(item.key)}', -1)">−</button>
              <output class="product__qty-val">${item.qty}</output>
              <button class="product__qty-btn" onclick="updateQuantity('${esc(item.key)}', 1)">+</button>
            </div>

            <button class="cart-item__remove" onclick="removeItem('${esc(item.key)}')">Remove</button>
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
  const totEl = $('#summaryTotal');

  if (countEl) countEl.textContent = totalItems;
  if (subEl) subEl.textContent = money(subtotal);
  if (totEl) totEl.textContent = money(subtotal);
}

document.addEventListener('DOMContentLoaded', initCart);