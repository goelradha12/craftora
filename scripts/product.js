// <!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <title>Product Customizer</title>
// <style>
//     body { font-family: Arial, sans-serif; text-align: center; }
//     canvas { border: 1px solid #ccc; cursor: grab; }
//     .controls { margin: 10px 0; }
// </style>
// </head>
// <body>

// <h2>Customize Your Product</h2>

// <div class="controls">
//     <label>Product Color: 
//         <input type="color" id="colorPicker" value="#ff0000">
//     </label>
//     <br><br>
//     <label>Add Text: 
//         <input type="text" id="customText" placeholder="Enter text">
//     </label>
//     <br><br>
//     <label>Or Upload Design: 
//         <input type="file" id="designUpload" accept="image/*">
//     </label>
//     <br><br>
//     <button id="downloadBtn">Download Design</button>
// </div>

// <canvas id="productCanvas" width="400" height="400"></canvas>

// <script>
// const canvas = document.getElementById('productCanvas');
// const ctx = canvas.getContext('2d');

// let productColor = document.getElementById('colorPicker').value;

// // Text properties
// let text = '';
// let textX = 200, textY = 200;

// // Image properties
// let designImage = null;
// let imgX = 150, imgY = 150, imgW = 100, imgH = 100;

// // Dragging state
// let isDragging = false;
// let dragTarget = null;

// // Draw product
// function drawProduct() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // Product shape (circle for example)
//     ctx.fillStyle = productColor;
//     ctx.beginPath();
//     ctx.arc(200, 200, 150, 0, Math.PI * 2);
//     ctx.fill();

//     // Draw image if exists
//     if (designImage) {
//         ctx.drawImage(designImage, imgX, imgY, imgW, imgH);
//     }

//     // Draw text if exists
//     if (text) {
//         ctx.fillStyle = 'white';
//         ctx.font = '24px Arial';
//         ctx.textAlign = 'center';
//         ctx.fillText(text, textX, textY);
//     }
// }

// // Color change
// document.getElementById('colorPicker').addEventListener('input', (e) => {
//     productColor = e.target.value;
//     drawProduct();
// });

// // Text change
// document.getElementById('customText').addEventListener('input', (e) => {
//     text = e.target.value;
//     drawProduct();
// });

// // Image upload
// document.getElementById('designUpload').addEventListener('change', (e) => {
//     const file = e.target.files[0];
//     if (file) {
//         const img = new Image();
//         img.onload = () => {
//             designImage = img;
//             drawProduct();
//         };
//         img.src = URL.createObjectURL(file);
//     }
// });

// // Mouse down - check if clicking text or image
// canvas.addEventListener('mousedown', (e) => {
//     const mouseX = e.offsetX;
//     const mouseY = e.offsetY;

//     // Check image
//     if (designImage && mouseX >= imgX && mouseX <= imgX + imgW &&
//         mouseY >= imgY && mouseY <= imgY + imgH) {
//         isDragging = true;
//         dragTarget = 'image';
//         return;
//     }

//     // Check text
//     const textWidth = ctx.measureText(text).width;
//     if (text && mouseX > textX - textWidth/2 && mouseX < textX + textWidth/2 &&
//         mouseY > textY - 20 && mouseY < textY + 10) {
//         isDragging = true;
//         dragTarget = 'text';
//     }
// });

// // Mouse move - drag target
// canvas.addEventListener('mousemove', (e) => {
//     if (isDragging) {
//         if (dragTarget === 'text') {
//             textX = e.offsetX;
//             textY = e.offsetY;
//         } else if (dragTarget === 'image') {
//             imgX = e.offsetX - imgW / 2;
//             imgY = e.offsetY - imgH / 2;
//         }
//         drawProduct();
//     }
// });

// // Mouse up - stop dragging
// canvas.addEventListener('mouseup', () => {
//     isDragging = false;
//     dragTarget = null;
// });

// // Download design
// document.getElementById('downloadBtn').addEventListener('click', () => {
//     const link = document.createElement('a');
//     link.download = 'custom_product.png';
//     link.href = canvas.toDataURL();
//     link.click();
// });

// // Initial draw
// drawProduct();
// </script>

// </body>
// </html>

const CART_KEY = 'cra_cart';

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

    ${renderDescription(p)}
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

  return `
    <div class="product__gallery">
      <div class="product__main-wrap">
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
  const badges = Array.isArray(p.badges) ? p.badges : [];
  const designs = Array.isArray(p.designs) ? p.designs : [];
  const colors = Array.isArray(p.colors) ? p.colors : [];
  const sizes = Array.isArray(p.sizes) ? p.sizes : [];

  return `
    <div class="product__info">
      <div class="product__header">
        ${badges.length ? badges.map(b => `<span class="product__badge">${esc(b)}</span>`).join('') : ''}
        <span class="product__category">${esc(cap(p.category))}</span>
        <h1 class="product__name">${esc(p.name)}</h1>
      </div>

      <div class="product__pricing">
        <span class="product__price">${money(p.basePrice)}</span>
        <span class="product__price-note">base price</span>
      </div>

      <span class="product__stock ${outOfStock ? 'product__stock--out' : 'product__stock--in'}">
        ${outOfStock ? 'Out of stock' : `${p.stock} in stock`}
      </span>

      ${renderColors(colors)}
      ${renderSizes(sizes)}
      ${renderQty()}

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

      <dl class="product__meta">
        <div class="product__meta-row">
          <dt class="product__meta-label">Template</dt>
          <dd class="product__meta-value">${esc(p.template || '-')}</dd>
        </div>

        <div class="product__meta-row">
          <dt class="product__meta-label">Designs</dt>
          <dd class="product__meta-value">${designs.length ? designs.map(esc).join(', ') : 'None'}</dd>
        </div>

        <div class="product__meta-row">
          <dt class="product__meta-label">Featured</dt>
          <dd class="product__meta-value">${p.featured ? 'Yes' : 'No'}</dd>
        </div>

        <div class="product__meta-row">
          <dt class="product__meta-label">Stock</dt>
          <dd class="product__meta-value">${p.stock || 0} units</dd>
        </div>
      </dl>
    </div>
  `;
}

function renderColors(colors) {
  if (!colors.length) return '';

  return `
    <fieldset class="product__option">
      <legend class="product__option-label">Color</legend>
      <div class="product__colors">
        ${colors.map((hex, i) => `
          <label class="product__color-label" title="${esc(hex)}">
            <input
              class="product__color-input"
              type="radio"
              name="product-color"
              value="${i}"
              data-color="${esc(hex)}"
              ${i === 0 ? 'checked' : ''}
            >
            <span class="product__color-swatch" style="background:${esc(hex)}" aria-hidden="true"></span>
          </label>
        `).join('')}
      </div>
      <p class="product__color-name" id="selectedColorName">${esc(colors[0])}</p>
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

function renderDescription(p) {
  return `
    <section class="product__description" aria-labelledby="descHeading">
      <h2 id="descHeading">Description</h2>
      <p>${esc(p.description || '')}</p>
    </section>
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
      if (nameEl) nameEl.textContent = input.dataset.color || input.value;
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

  const color = p.colors?.[state.colorIdx] || p.colors?.[0] || '';
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