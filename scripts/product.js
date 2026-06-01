const CART_KEY = 'cart';

const state = {
  product: null,
  products: [],
  qty: 1,
  colorIdx: 0,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const esc = s =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const cap = s => String(s ?? '').charAt(0).toUpperCase() + String(s ?? '').slice(1);
const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');

const setCart = items => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadges();
  window.Layout?.refreshCartCount?.();
};

function getImages(p) {
  return [p?.images?.default, ...(p?.images?.others || [])].filter(Boolean);
}

function init() {
  const mount = $('#product');
  if (!mount) return;

  const id = new URLSearchParams(location.search).get('id');

  if (!id) {
    mount.innerHTML = errorState('No product specified.');
    mount.setAttribute('aria-busy', 'false');
    return;
  }

  fetch('./content/products.json')
    .then(res => res.json())
    .then(data => {
      state.products = data.products || [];
      state.product = state.products.find(p => p.id === id);

      if (!state.product) {
        mount.innerHTML = errorState('Product not found.');
        mount.setAttribute('aria-busy', 'false');
        return;
      }

      document.title = `${state.product.name} — Craftora`;

      mount.innerHTML = renderPage(state.product);
      mount.setAttribute('aria-busy', 'false');

      bindEvents();
    })
    .catch(err => {
      console.error(err);
      mount.innerHTML = errorState('Failed to load product. Please refresh.');
      mount.setAttribute('aria-busy', 'false');
    });
}

function renderPage(p) {
  return `
    ${renderBreadcrumb(p)}

    <section class="product" aria-label="${esc(p.name)}">
      ${renderGallery(p)}
      ${renderInfo(p)}
    </section>

    ${renderRelated(p)}
  `;
}

function renderBreadcrumb(p) {
  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol class="breadcrumb__list">
        <li class="breadcrumb__item">
          <a class="breadcrumb__link" href="./index.html">Home</a>
          <span class="breadcrumb__sep" aria-hidden="true">/</span>
        </li>
        <li class="breadcrumb__item">
          <a class="breadcrumb__link" href="./products.html">Shop</a>
          <span class="breadcrumb__sep" aria-hidden="true">/</span>
        </li>
        <li class="breadcrumb__item">
          <a class="breadcrumb__link" href="./products.html?category=${encodeURIComponent(p.category)}">
            ${esc(cap(p.category))}
          </a>
          <span class="breadcrumb__sep" aria-hidden="true">/</span>
        </li>
        <li class="breadcrumb__item breadcrumb__item--current" aria-current="page">
          ${esc(p.name)}
        </li>
      </ol>
    </nav>
  `;
}

function renderGallery(p) {
  const images = getImages(p);
  const main = images[0] || '';
  const badges = Array.isArray(p.badges) ? p.badges : [];

  return `
    <div class="product__gallery">
      <div class="product__main-wrap">
        ${badges.length ? `
          <div class="product__badges">
            ${badges.map(b => `<span class="product__badge">${esc(b)}</span>`).join('')}
          </div>
        ` : ''}
        <img
          class="product__main-img"
          id="productMainImg"
          src="${esc(main)}"
          alt="${esc(p.name)}"
        >
      </div>

      <ul class="product__thumbs" aria-label="Product images">
        ${images.map((src, i) => `
          <li class="product__thumb-item">
            <button
              class="product__thumb${i === 0 ? ' product__thumb--active' : ''}"
              type="button"
              data-src="${esc(src)}"
              aria-label="Show image ${i + 1}"
              aria-pressed="${i === 0 ? 'true' : 'false'}"
            >
              <img class="product__thumb-img" src="${esc(src)}" alt="" loading="lazy">
            </button>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function renderInfo(p) {
  const outOfStock = Number(p.stock) <= 0;
  const colors = Array.isArray(p.colors) ? p.colors : [];
  const colorNames = Array.isArray(p.colorNames) ? p.colorNames : []; 
  const sizes = Array.isArray(p.sizes) ? p.sizes : [];

  return `
    <div class="product__info">
      <div class="product__header">
        <span class="product__category">${esc(cap(p.category))}</span>
        <h1 class="product__name">${esc(p.name)}</h1>
      </div>

      <div class="product__pricing">
        <span class="product__price">${money(p.basePrice)}</span>
        <span class="product__price-note">base price</span>
      </div>
      <div class="product__description">
        ${esc(p.description)}
      </div>
      

      ${renderColors(colors, colorNames)}
      ${renderSizes(sizes)}
      ${renderQty()}
      <span class="product__stock ${outOfStock ? 'product__stock--out' : 'product__stock--in'}">
        ${outOfStock ? 'Out of stock' : `${p.stock} in stock`}
      </span>
      <div class="product__actions">
        <button
          class="product__add-btn"
          id="addToCartBtn"
          ${outOfStock ? 'disabled aria-disabled="true"' : ''}
        >
          ${outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>

        <button
          class="product__buy-btn"
          id="buyNowBtn"
          ${outOfStock ? 'disabled aria-disabled="true"' : ''}
        >
          Buy Now
        </button>
      </div>
    </div>
  `;
}

function renderColors(colors, colorNames) {
  if (!colors.length) return '';

  const getName = (i) => colorNames[i] || colors[i];

  return `
    <fieldset class="product__option">
      <legend class="product__option-label">Color</legend>
      <div class="product__colors">
        ${colors.map((hex, i) => `
          <label class="product__color-label" title="${esc(getName(i))}">
            <input
              class="product__color-input"
              type="radio"
              name="product-color"
              value="${i}"
              data-color-name="${esc(getName(i))}"
              ${i === 0 ? 'checked' : ''}
            >
            <span class="product__color-swatch" style="background:${esc(hex)}" aria-hidden="true"></span>
          </label>
        `).join('')}
      </div>
      <p class="product__color-name" id="selectedColorName">${esc(getName(0))}</p>
    </fieldset>
  `;
}

function renderSizes(sizes) {
  if (!sizes.length) return '';

  return `
    <fieldset class="product__option">
      <legend class="product__option-label">Size</legend>
      <div class="product__sizes">
        ${sizes.map((size, i) => `
          <label class="product__size-label">
            <input
              class="product__size-input"
              type="radio"
              name="product-size"
              value="${esc(size)}"
              ${i === 0 ? 'checked' : ''}
            >
            <span class="product__size-btn">${esc(size)}</span>
          </label>
        `).join('')}
      </div>
    </fieldset>
  `;
}

function renderQty() {
  return `
    <div class="product__option">
      <span class="product__option-label" id="qtyLabel">Quantity</span>
      <div class="product__qty" role="group" aria-labelledby="qtyLabel">
        <button class="product__qty-btn" id="qtyMinus" type="button" aria-label="Decrease quantity" disabled>−</button>
        <output class="product__qty-val" id="qtyVal" for="qtyMinus qtyPlus">1</output>
        <button class="product__qty-btn" id="qtyPlus" type="button" aria-label="Increase quantity">+</button>
      </div>
    </div>
  `;
}

function renderRelated(p) {
  const related = state.products
    .filter(item => item.category === p.category && item.id !== p.id)
    .slice(0, 4);

  if (!related.length) return '';

  return `
    <section class="related" aria-labelledby="relatedHeading">
      <h2 class="related__heading" id="relatedHeading">You May Also Like</h2>
      <ul class="related__grid">
        ${related.map(item => `
          <li class="related__item">
            <a class="related__card" href="./product.html?id=${encodeURIComponent(item.id)}">
              <div class="related__img-wrap">
                <img
                  class="related__img"
                  src="${esc(item.images?.default || '')}"
                  alt="${esc(item.name)}"
                  loading="lazy"
                >
              </div>
              <div class="related__body">
                <h3 class="related__name">${esc(item.name)}</h3>
                <span class="related__price">${money(item.basePrice)}</span>
              </div>
            </a>
          </li>
        `).join('')}
      </ul>
    </section>
  `;
}

function errorState(msg) {
  return `
    <div class="product-error">
      <p class="product-error__msg">${esc(msg)}</p>
      <a class="product-error__link" href="./products.html">Back to Shop</a>
    </div>
  `;
}

function bindEvents() {
  bindGallery();
  bindColors();
  bindQty();
  $('#addToCartBtn')?.addEventListener('click', () => addToCart(false));
  $('#buyNowBtn')?.addEventListener('click', () => addToCart(true));
}

function bindGallery() {
  const mainImg = $('#productMainImg');

  $$('.product__thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.src || '';
      if (mainImg) mainImg.src = src;

      $$('.product__thumb').forEach(b => {
        b.classList.remove('product__thumb--active');
        b.setAttribute('aria-pressed', 'false');
      });

      btn.classList.add('product__thumb--active');
      btn.setAttribute('aria-pressed', 'true');
    });
  });
}

function bindColors() {
  $$('.product__color-input').forEach(input => {
    input.addEventListener('change', () => {
      const nameEl = $('#selectedColorName');
      if (nameEl) nameEl.textContent = input.dataset.colorName || input.value;
      state.colorIdx = Number(input.value);
    });
  });
}

function bindQty() {
  const valEl = $('#qtyVal');
  const minusBtn = $('#qtyMinus');
  const plusBtn = $('#qtyPlus');

  if (!valEl || !minusBtn || !plusBtn) return;

  minusBtn.addEventListener('click', () => {
    if (state.qty <= 1) return;
    state.qty -= 1;
    valEl.textContent = state.qty;
    minusBtn.disabled = state.qty <= 1;
  });

  plusBtn.addEventListener('click', () => {
    if (state.qty >= 99) return;
    state.qty += 1;
    valEl.textContent = state.qty;
    minusBtn.disabled = false;
  });
}

function addToCart(redirect) {
  const p = state.product;
  if (!p) return;

  const color = p.colorNames?.[state.colorIdx] || p.colors?.[state.colorIdx] || '';
  const size = $('.product__size-input:checked')?.value || p.sizes?.[0] || '';
  const key = `${p.id}__${color}__${size}`;

  const cart = getCart();
  const existing = cart.find(item => item.key === key);

  if (existing) {
    existing.qty += state.qty;
  } else {
    cart.push({
      key,
      id: p.id,
      name: p.name,
      image: p.images?.default || '',
      category: p.category,
      price: p.basePrice,
      color,
      size,
      qty: state.qty,
    });
  }

  setCart(cart);

  if (redirect) {
    location.href = './cart.html';
    return;
  }

  const btn = $('#addToCartBtn');
  if (!btn) return;

  const original = btn.textContent;
  btn.textContent = 'Added ✓';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 1200);
}

init();