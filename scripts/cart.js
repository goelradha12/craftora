const CART_KEY = 'cart';

const $ = (sel, root = document) => root.querySelector(sel);
const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[m]);

let cartData = [];

function initCart() {
  cartData = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  renderCart();
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cartData));
  // Call your badge updater here if you have it globally accessible
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
            <h3 class="cart-item__name">${esc(item.name)}</h3>
            <span class="cart-item__price">${money(item.price * item.qty)}</span>
          </div>
          
          <div class="cart-item__meta">
            ${item.color ? `<span>Color: ${esc(item.color)}</span>` : ''}
            ${item.size ? `<span>Size: ${esc(item.size)}</span>` : ''}
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
  if (totEl) totEl.textContent = money(subtotal); // Add shipping/taxes here later if needed
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initCart);