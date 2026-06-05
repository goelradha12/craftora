/* ============================================================
   product.js  —  Craftora Product Detail Page
   ============================================================ */

const CART_KEY = 'cart';
const WISHLIST_KEY = 'craftora_wishlist';
const CUSTOMIZATION_PREFIX = 'designData_';

const state = {
    product: null,
    products: [],
    qty: 1,
    customization: null,
};

/* ── Utils ── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const esc = s => String(s ?? '').replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } };
const getWishlist = () => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; } };
const isWishlisted = id => getWishlist().some(i => i.id === id);

function setCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (typeof updateCartBadges === 'function') updateCartBadges();
}

function toggleWish(p) {
    const list = getWishlist();
    const idx = list.findIndex(i => i.id === p.id);
    if (idx >= 0) { list.splice(idx, 1); }
    else { list.push({ id: p.id, name: p.name, category: p.category, price: p.basePrice, image: p.images?.default || '' }); }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    return idx < 0; // true = now wishlisted
}

function loadCustomization(id) {
    try {
        const raw = localStorage.getItem(`${CUSTOMIZATION_PREFIX}${id}`);
        if (!raw) return null;
        const d = JSON.parse(raw);
        return String(d?.productId ?? '') === String(id) ? d : null;
    } catch { return null; }
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
function init() {
    const mount = $('#product');
    if (!mount) return;

    const id = new URLSearchParams(location.search).get('id');
    if (!id) { mount.innerHTML = errHTML('No product specified.'); mount.setAttribute('aria-busy', 'false'); return; }

    mount.innerHTML = skeletonHTML();

    fetch('./content/products.json')
        .then(r => r.json())
        .then(data => {
            state.products = data.products || [];
            state.product = state.products.find(p => p.id === id) || null;

            if (!state.product) {
                mount.innerHTML = errHTML('Product not found.');
                mount.setAttribute('aria-busy', 'false');
                return;
            }

            document.title = `${state.product.name} — Craftora`;
            state.customization = loadCustomization(id);

            mount.innerHTML = renderPage(state.product);
            mount.setAttribute('aria-busy', 'false');
            bindEvents();
            updateCustomizationUI();
        })
        .catch(err => {
            console.error(err);
            mount.innerHTML = errHTML('Failed to load product. Please refresh.');
            mount.setAttribute('aria-busy', 'false');
        });
}

/* ══════════════════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════════════════ */
function renderPage(p) {
    return `
        ${breadcrumbHTML(p)}
        <section class="product" aria-label="${esc(p.name)}">
            ${galleryHTML(p)}
            ${infoHTML(p)}
        </section>
        ${relatedHTML(p)}
    `;
}

/* ── Breadcrumb ── */
function breadcrumbHTML(p) {
    return `
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <ol class="breadcrumb__list">
                <li class="breadcrumb__item"><a class="breadcrumb__link" href="./index.html">Home</a><span class="breadcrumb__sep" aria-hidden="true">/</span></li>
                <li class="breadcrumb__item"><a class="breadcrumb__link" href="./products.html">Shop</a><span class="breadcrumb__sep" aria-hidden="true">/</span></li>
                <li class="breadcrumb__item"><a class="breadcrumb__link" href="./products.html?category=${encodeURIComponent(p.category)}">${esc(p.category)}</a><span class="breadcrumb__sep" aria-hidden="true">/</span></li>
                <li class="breadcrumb__item breadcrumb__item--current" aria-current="page">${esc(p.name)}</li>
            </ol>
        </nav>`;
}

/* ── Gallery ── */
function galleryHTML(p) {
    const imgs = [p.images?.default, ...(p.images?.others || [])].filter(Boolean);
    const badges = Array.isArray(p.badges) ? p.badges : [];
    const wishlisted = isWishlisted(p.id);

    return `
        <div class="product__gallery">
            <div class="product__main-wrap">
                ${badges.length ? `
                    <div class="product__badges">
                        ${badges.map((b, i) => `<span class="product__badge${i > 0 ? ' product__badge--accent' : ''}">${esc(b)}</span>`).join('')}
                    </div>` : ''}

                <button class="product__wishlist-btn${wishlisted ? ' wishlisted' : ''}"
                        id="wishlistBtn"
                        aria-label="${wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${wishlisted ? '#e11d48' : 'none'}"
                         stroke="${wishlisted ? '#e11d48' : 'currentColor'}" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>

                <img class="product__main-img" id="productMainImg"
                     src="${esc(imgs[0] || '')}" alt="${esc(p.name)}">
            </div>

            ${imgs.length > 1 ? `
                <ul class="product__thumbs" aria-label="Product images">
                    ${imgs.map((src, i) => `
                        <li><button class="product__thumb${i === 0 ? ' product__thumb--active' : ''}"
                                    type="button" data-src="${esc(src)}"
                                    aria-label="View image ${i + 1}" aria-pressed="${i === 0}">
                            <img class="product__thumb-img" src="${esc(src)}" alt="" loading="lazy">
                        </button></li>`).join('')}
                </ul>` : ''}
        </div>`;
}

/* ── Info panel ── */
function infoHTML(p) {
    const oos = Number(p.stock) <= 0;
    const colors = Array.isArray(p.colors) ? p.colors : [];
    const cNames = Array.isArray(p.colorNames) ? p.colorNames : [];
    const sizes = Array.isArray(p.sizes) ? p.sizes : [];

    return `
        <div class="product__info">

            <div class="product__header">
                <span class="product__category">${esc(p.category)}</span>
                <h1 class="product__name">${esc(p.name)}</h1>
            </div>

            <div class="product__pricing">
                <span class="product__price">${money(p.basePrice)}</span>
                <span class="product__price-note">base price</span>
            </div>

            <p class="product__description">${esc(p.description)}</p>

            ${colors.length ? `
                <div class="product__option">
                    <span class="product__option-label">Available Colors</span>
                    <div class="product__colors">
                        ${colors.map((hex, i) => `
                            <span class="product__color-swatch"
                                  style="background:${esc(hex)}"
                                  title="${esc(cNames[i] || hex)}"></span>`).join('')}
                    </div>
                    <p class="product__color-note">Choose your exact color inside the Design Studio</p>
                </div>` : ''}

            ${sizes.length ? `
                <fieldset class="product__option">
                    <legend class="product__option-label">Size</legend>
                    <div class="product__sizes">
                        ${sizes.map((s, i) => `
                            <label class="product__size-label">
                                <input class="product__size-input" type="radio"
                                       name="product-size" value="${esc(s)}" ${i === 0 ? 'checked' : ''}>
                                <span class="product__size-btn">${esc(s)}</span>
                            </label>`).join('')}
                    </div>
                </fieldset>` : ''}

            <div class="product__meta-row">
                <span class="product__stock ${oos ? 'product__stock--out' : 'product__stock--in'}">
                    ${oos ? 'Out of stock' : `${p.stock} in stock`}
                </span>
                <div class="product__option" style="margin:0">
                    <div class="product__qty" role="group" aria-label="Quantity">
                        <button class="product__qty-btn" id="qtyMinus" type="button" aria-label="Decrease" disabled>−</button>
                        <output class="product__qty-val" id="qtyVal">1</output>
                        <button class="product__qty-btn" id="qtyPlus"  type="button" aria-label="Increase">+</button>
                    </div>
                </div>
            </div>

            <!-- Customization status -->
            <div class="product__customization-card missing" id="custCard">
                <div class="product__cust-icon" id="custIcon">🎨</div>
                <div class="product__cust-text">
                    <p class="product__cust-title" id="custTitle">Design required</p>
                    <p class="product__cust-desc"  id="custDesc">Open the studio and save your design to enable checkout.</p>
                </div>
            </div>

            <!-- Actions -->
            <div class="product__actions">
                <button class="product__customize-btn" id="customizeProductBtn" ${oos ? 'disabled' : ''}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                    <span id="custBtnLabel">Open Design Studio</span>
                </button>

                <div class="product__btn-row">
                    <button class="product__add-btn" id="addToCartBtn" disabled>Add to Cart</button>
                    <button class="product__buy-btn" id="buyNowBtn"    disabled>Buy Now</button>
                </div>
            </div>

            <!-- Trust strip -->
            <div class="product__trust">
                <div class="product__trust-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    <span>Free Shipping</span>
                </div>
                <div class="product__trust-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.34"/></svg>
                    <span>Easy Returns</span>
                </div>
                <div class="product__trust-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span>Secure Payment</span>
                </div>
            </div>
            ${productDetailsHTML(p)}

        </div>`;
}
/* ── Product Details ── */
function productDetailsHTML(p) {
    const details = Array.isArray(p.productDetails) ? p.productDetails : [];
    if (!details.length) return '';

    const labelMap = {
        material: 'Material',
        capacity: 'Capacity',
        finish: 'Finish',
        microwaveSafe: 'Microwave Safe',
        dishwasherSafe: 'Dishwasher Safe',
        washCare: 'Wash Care',
        dimensions: 'Dimensions',
        weight: 'Weight',
        warranty: 'Warranty',
        countryOfOrigin: 'Origin',
    };

    return `
        <div class="product__details">
            <button class="product__details-toggle" id="detailsToggle" aria-expanded="true" aria-controls="detailsBody" type="button">
                <span>Product Details</span>
                <svg class="product__details-chevron" width="16" height="16" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>
            <div class="product__details-body" id="detailsBody">
                <dl class="product__details-list">
                    ${details.map(d => `
                        <div class="product__details-row">
                            <dt class="product__details-key">${esc(labelMap[d.label] || d.label)}</dt>
                            <dd class="product__details-val">${esc(d.value)}</dd>
                        </div>`).join('')}
                </dl>
            </div>
        </div>`;
}
/* ── Related ── */
function relatedHTML(p) {
    const related = state.products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
    if (!related.length) return '';

    return `
        <section class="related" aria-labelledby="relatedHeading">
            <h2 class="related__heading" id="relatedHeading">You May Also Like</h2>
            <ul class="related__grid">
                ${related.map(item => `
                    <li>
                        <a class="related__card" href="./product.html?id=${encodeURIComponent(item.id)}">
                            <div class="related__img-wrap">
                                <img class="related__img" src="${esc(item.images?.default || '')}"
                                     alt="${esc(item.name)}" loading="lazy">
                            </div>
                            <div class="related__body">
                                <span class="related__cat">${esc(item.category)}</span>
                                <h3 class="related__name">${esc(item.name)}</h3>
                                <span class="related__price">${money(item.basePrice)}</span>
                            </div>
                        </a>
                    </li>`).join('')}
            </ul>
        </section>`;
}

/* ── Skeleton ── */
function skeletonHTML() {
    return `
        <div class="product__skeleton">
            <div class="skeleton-block" style="aspect-ratio:4/5;border-radius:1.5rem"></div>
            <div style="display:flex;flex-direction:column;gap:1rem;padding-top:0.5rem">
                <div class="skeleton-block" style="height:0.8rem;width:30%;border-radius:4px"></div>
                <div class="skeleton-block" style="height:2.4rem;width:72%;border-radius:6px"></div>
                <div class="skeleton-block" style="height:2rem;width:26%;border-radius:4px;margin-top:0.5rem"></div>
                <div class="skeleton-block" style="height:4.5rem;border-radius:10px;margin-top:0.75rem"></div>
                <div class="skeleton-block" style="height:2.4rem;border-radius:8px"></div>
                <div class="skeleton-block" style="height:3.5rem;border-radius:10px"></div>
                <div class="skeleton-block" style="height:2.8rem;border-radius:8px"></div>
                <div class="skeleton-block" style="height:2.8rem;border-radius:8px"></div>
            </div>
        </div>`;
}

function errHTML(msg) {
    return `
        <div class="product-error">
            <p class="product-error__msg">${esc(msg)}</p>
            <a class="product-error__link" href="./products.html">Back to Shop</a>
        </div>`;
}

/* ══════════════════════════════════════════════════════════
   UI STATE
══════════════════════════════════════════════════════════ */
function updateCustomizationUI() {
    const p = state.product;
    const hasDes = !!state.customization;
    const oos = Number(p?.stock ?? 0) <= 0;

    const card = $('#custCard');
    const icon = $('#custIcon');
    const title = $('#custTitle');
    const desc = $('#custDesc');
    const addBtn = $('#addToCartBtn');
    const buyBtn = $('#buyNowBtn');
    const custBtn = $('#customizeProductBtn');
    const custLbl = $('#custBtnLabel');
    if (!card) return;

    if (oos) {
        card.className = 'product__customization-card missing';
        if (icon) icon.textContent = '✗';
        if (title) title.textContent = 'Out of stock';
        if (desc) desc.textContent = 'This product is currently unavailable.';
        if (addBtn) addBtn.disabled = true;
        if (buyBtn) buyBtn.disabled = true;
        if (custBtn) custBtn.disabled = true;
        return;
    }

    if (hasDes) {
        const color = state.customization?.shirtColor || '';
        card.className = 'product__customization-card ready';
        if (icon) icon.textContent = '✓';
        if (title) title.textContent = 'Design saved — ready to order';
        if (desc) desc.textContent = `Color: ${color || 'custom'}  ·  Click "Edit Design" to make changes`;
        if (addBtn) addBtn.disabled = false;
        if (buyBtn) buyBtn.disabled = false;
        if (custLbl) custLbl.textContent = 'Edit Design';
    } else {
        card.className = 'product__customization-card missing';
        if (icon) icon.textContent = '🎨';
        if (title) title.textContent = 'Design required';
        if (desc) desc.textContent = 'Open the studio and save your design to enable checkout.';
        if (addBtn) addBtn.disabled = true;
        if (buyBtn) buyBtn.disabled = true;
        if (custLbl) custLbl.textContent = 'Open Design Studio';
    }
}

/* ══════════════════════════════════════════════════════════
   EVENTS
══════════════════════════════════════════════════════════ */
function bindEvents() {
    /* Gallery thumbnails */
    const mainImg = $('#productMainImg');
    $$('.product__thumb').forEach(btn => {
        btn.addEventListener('click', () => {
            if (mainImg) mainImg.src = btn.dataset.src || '';
            $$('.product__thumb').forEach(b => { b.classList.remove('product__thumb--active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('product__thumb--active');
            btn.setAttribute('aria-pressed', 'true');
        });
    });

    /* Qty */
    const valEl = $('#qtyVal');
    const minus = $('#qtyMinus');
    const plus = $('#qtyPlus');
    if (valEl && minus && plus) {
        minus.addEventListener('click', () => {
            if (state.qty <= 1) return;
            valEl.textContent = --state.qty;
            minus.disabled = state.qty <= 1;
        });
        plus.addEventListener('click', () => {
            if (state.qty >= 99) return;
            valEl.textContent = ++state.qty;
            minus.disabled = false;
        });
    }

    /* Wishlist */
    $('#wishlistBtn')?.addEventListener('click', () => {
        const p = state.product;
        if (!p) return;
        const now = toggleWish(p);
        const btn = $('#wishlistBtn');
        const path = btn?.querySelector('path');
        btn?.classList.toggle('wishlisted', now);
        btn?.setAttribute('aria-label', now ? 'Remove from wishlist' : 'Save to wishlist');
        if (path) { path.setAttribute('fill', now ? '#e11d48' : 'none'); path.setAttribute('stroke', now ? '#e11d48' : 'currentColor'); }
        if (btn) { btn.style.transform = 'scale(1.3)'; setTimeout(() => { btn.style.transform = ''; }, 200); }
    });

    /* Product details accordion */
    $('#detailsToggle')?.addEventListener('click', () => {
        const toggle = $('#detailsToggle');
        const body = $('#detailsBody');
        if (!toggle || !body) return;
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        if (open) { body.hidden = true; } else { body.hidden = false; }
    });

    /* Studio — require login first */
    $('#customizeProductBtn')?.addEventListener('click', () => {
        if (!state.product) return;

        // Check if user is logged in
        const user = (() => {
            try { return JSON.parse(localStorage.getItem('craftora_user') || 'null'); } catch { return null; }
        })();

        const destination = `./customize.html?id=${encodeURIComponent(state.product.id)}`;

        if (!user) {
            // Not logged in — send to login with a redirect param so they come back here
            const returnTo = encodeURIComponent(destination);
            alert('You must be signed in to open the design studio.');
            location.href = `./login.html?redirect=${returnTo}`;
            return;
        }

        location.href = destination;
    });

    /* Cart / Buy */
    $('#addToCartBtn')?.addEventListener('click', () => doAddToCart(false));
    $('#buyNowBtn')?.addEventListener('click', () => doAddToCart(true));

    /* Refresh after returning from studio */
    window.addEventListener('pageshow', () => {
        if (!state.product) return;
        state.customization = loadCustomization(state.product.id);
        updateCustomizationUI();
    });

    window.addEventListener('storage', evt => {
        if (state.product && evt.key === `${CUSTOMIZATION_PREFIX}${state.product.id}`) {
            state.customization = loadCustomization(state.product.id);
            updateCustomizationUI();
        }
    });
}

/* ══════════════════════════════════════════════════════════
   CART
══════════════════════════════════════════════════════════ */
function doAddToCart(redirect) {
    const p = state.product;
    if (!p || !state.customization) return;

    const size = $('.product__size-input:checked')?.value || p.sizes?.[0] || '';
    const color = state.customization.shirtColor || p.colors?.[0] || '';
    
    const cStr = JSON.stringify(state.customization);
    let h = 0;
    for (let i = 0; i < cStr.length; i++) {
        h = ((h << 5) - h) + cStr.charCodeAt(i);
        h |= 0;
    }

    const key = `${p.id}__${size}__${color}__${h}`;

    const cart = getCart();
    const existing = cart.find(i => i.key === key);

    if (existing) {
        existing.qty += state.qty;
        existing.customization = state.customization;
    } else {
        cart.push({
            key, id: p.id, name: p.name, image: p.images?.default || '',
            category: p.category, price: p.basePrice, color, size,
            qty: state.qty, customized: true, customization: state.customization
        });
    }

    setCart(cart);

    if (redirect) { location.href = './cart.html'; return; }

    const btn = $('#addToCartBtn');
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = 'Added ✓';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1400);
}

init();