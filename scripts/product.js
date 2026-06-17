/* ============================================================
   product.js — Craftora Product Detail Page
   Requires: pricing.js (loaded before this script)
   ============================================================ */

const CART_KEY = 'cart';
const WISHLIST_KEY = 'craftora_wishlist';
const CUSTOM_PREFIX = 'designData_';

/* ── Color Palette (same as customize.html) ── */
const COLOR_PALETTE = {
    pacificBlue: "#B0DDF7", angelBlue: "#A7BFE5", brightBlue: "#50C6F6",
    turquoiseBlue: "#22B1C2", happyBlue: "#2C91BF", royalBlue: "#0055B8",
    blueberry: "#2D2877", navyBlue: "#190850", iceBlue: "#C8E1E6",
    robinsBlue: "#92D6D3", happySky: "#7ACDE7", aquaBlue: "#54C1C4",
    aquaMint: "#4EBBAD", teal: "#1FAAAD", mediumTeal: "#2D8E95",
    darkTeal: "#237C7C", pastelGreen: "#CBE5BE", celeryGreen: "#B0D69A",
    pistachio: "#A5D49E", seafoam: "#ABC5C1", freshGreen: "#ACC636",
    greenGrass: "#8ECB3F", emerald: "#6EA864", forestGreen: "#4B7A47",
    pastelLilac: "#D0CFE7", lilac: "#BFBDE6", lavender: "#C7A2D0",
    plum: "#7B6AB0", violet: "#6D2B76", orchidPurple: "#94307D",
    blueViolet: "#4B2C76", eggplant: "#602058", pastelPink: "#F7D8E7",
    cottonCandy: "#F2B8D1", dustyRose: "#E599AC", sweetPink: "#F49ABB",
    rose: "#F1719B", hotPink: "#EE4791", mameyPink: "#F05778",
    fuschia: "#DC126B", palePeach: "#FDE0DA", peach: "#F7BCA4",
    lightCoral: "#F47B7D", honeysuckle: "#F07761", prettyRed: "#E12D3A",
    wineRed: "#A91E3E", burgundy: "#8E2D30", happyOrange: "#F79854",
    tangerine: "#F47F25", tango: "#F15B24", burntOrange: "#DC8720",
    pumpkin: "#DA5C29", rust: "#BF6227", leather: "#9B5B51",
    chocolate: "#644245", buttercup: "#FFF546", vanilla: "#FFF481",
    honey: "#F5E47D", brightYellow: "#FEF200", sunnyYellow: "#FDEB3F",
    mustardYellow: "#E3C34D", camel: "#D7C15F", sand: "#E1CF85",
    tan: "#D7CDB4", softTaupe: "#B3A99D", taupe: "#8B7D7D",
    darkBrown: "#4B3735", softGray: "#D0D2D4", slateGray: "#9A9C9F",
    charcoal: "#58585A", black: "#231F20"
};

const PALETTE_KEYS = Object.keys(COLOR_PALETTE);
const INITIAL_COLORS_SHOWN = 14;

function getColorName(hex) {
    const h = String(hex).toLowerCase();
    const key = PALETTE_KEYS.find(k => COLOR_PALETTE[k].toLowerCase() === h);
    if (!key) return hex;
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

function isLightColor(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}

/* ── State ── */
const state = {
    product: null,
    products: [],
    qty: 1,
    customization: null,
    designRequired: false,
    selectedColor: null,
    colorsExpanded: false,
};

/* ── Utilities ── */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = str => String(str ?? '').replace(/[&<>"']/g, match =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[match]);
const formatMoney = num => `₹${Number(num || 0).toLocaleString('en-IN')}`;

const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } };
const getWishlist = () => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; } };
const isWishlisted = id => getWishlist().some(item => item.id === id);

function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (typeof updateCartBadges === 'function') updateCartBadges();
}

function toggleWishlist(product) {
    let list = getWishlist();
    let index = list.findIndex(item => item.id === product.id);
    if (index >= 0) { list.splice(index, 1); }
    else { list.push({ id: product.id, name: product.name, category: product.category, price: product.basePrice, image: product.images?.default || '' }); }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    return index < 0;
}

function loadCustomization(id) {
    try {
        let rawData = localStorage.getItem(`${CUSTOM_PREFIX}${id}`);
        if (!rawData) return null;
        let parsedData = JSON.parse(rawData);
        return String(parsedData?.productId ?? '') === String(id) ? parsedData : null;
    } catch { return null; }
}

/* ── Init ── */
function initProductPage() {
    let mountNode = $('#product');
    if (!mountNode) return;

    let productId = new URLSearchParams(location.search).get('id');
    if (!productId) { mountNode.innerHTML = renderError('No product specified.'); mountNode.setAttribute('aria-busy', 'false'); return; }

    fetch('./content/products.json', { priority: 'high' })
        .then(res => res.json())
        .then(data => {
            state.products = data.products || [];
            state.product = state.products.find(item => item.id === productId) || null;

            if (!state.product) {
                mountNode.innerHTML = renderError('Product not found.');
                mountNode.setAttribute('aria-busy', 'false');
                return;
            }

            const mainImgSrc = state.product.images?.default;
            if (mainImgSrc) {
                const preload = document.createElement('link');
                preload.rel = 'preload';
                preload.as = 'image';
                preload.href = mainImgSrc;
                preload.fetchPriority = 'high';
                document.head.appendChild(preload);
            }

            document.title = `${state.product.name} — Craftora`;
            state.customization = loadCustomization(productId);
            state.selectedColor = state.customization?.shirtColor || COLOR_PALETTE[PALETTE_KEYS[0]];
            state.designRequired = !!state.customization;
            // Check if active color requires expanded palette
            const hiddenKeys = PALETTE_KEYS.slice(INITIAL_COLORS_SHOWN);
            state.colorsExpanded = hiddenKeys.some(k => COLOR_PALETTE[k].toLowerCase() === state.selectedColor.toLowerCase());

            mountNode.innerHTML = renderPage(state.product);
            mountNode.setAttribute('aria-busy', 'false');
            bindEvents();
            if (state.designRequired) setDesignRadio(true);
            updateUI();
            initDesignPreviewBtn(productId);
        })
        .catch(err => {
            console.error(err);
            mountNode.innerHTML = renderError('Failed to load product. Please refresh.');
            mountNode.setAttribute('aria-busy', 'false');
        });
}

/* ── Render: Full Page ── */
function renderPage(product) {
    return `
        ${renderBreadcrumbs(product)}
        <section class="product" aria-label="${escapeHTML(product.name)}">
            ${renderGallery(product)}
            ${renderProductInfo(product)}
        </section>
        ${renderRelatedProducts(product)}
    `;
}

function renderBreadcrumbs(product) {
    return `
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <ol class="breadcrumb__list">
                <li><a class="breadcrumb__link" href="./products.html">Shop</a><span class="breadcrumb__sep" aria-hidden="true">/</span></li>
                <li><a class="breadcrumb__link" href="./products.html?category=${encodeURIComponent(product.category)}">${escapeHTML(product.category)}</a><span class="breadcrumb__sep" aria-hidden="true">/</span></li>
                <li aria-current="page">${escapeHTML(product.name)}</li>
            </ol>
        </nav>`;
}

function renderGallery(product) {
    let images = [product.images?.default, ...(product.images?.others || [])].filter(Boolean);
    let badges = Array.isArray(product.badges) ? product.badges : [];
    let isSaved = isWishlisted(product.id);

    return `
        <div class="product__gallery">
            <div class="product__main-wrap">
                ${badges.length ? `
                    <div class="product__badges">
                        ${badges.map((badge, idx) => `<span class="product__badge${idx > 0 ? ' product__badge--accent' : ''}">${escapeHTML(badge)}</span>`).join('')}
                    </div>` : ''}
                <button class="product__wishlist-btn${isSaved ? ' wishlisted' : ''}"
                        id="wishlistBtn"
                        aria-label="${isSaved ? 'Remove from wishlist' : 'Save to wishlist'}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? '#e11d48' : 'none'}"
                         stroke="${isSaved ? '#e11d48' : 'currentColor'}" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
                <img class="product__main-img" id="productMainImg"
                     src="${images[0]}" alt="${escapeHTML(product.name)}" 
                     width="800" height="1000" fetchpriority="high" decoding="sync">
            </div>
            ${images.length > 1 ? `
                <ul class="product__thumbs" aria-label="Product images">
                    ${images.map((src, idx) => `
                        <li><button class="product__thumb${idx === 0 ? ' product__thumb--active' : ''}"
                                    type="button" data-src="${src}"
                                    aria-label="View image ${idx + 1}" aria-pressed="${idx === 0}">
                            <img class="product__thumb-img" src="${src}" alt="" loading="lazy" width="64" height="64">
                        </button></li>`).join('')}
                </ul>` : ''}
        </div>`;
}

/* ── Render: Product Info (right column) ── */
function renderProductInfo(product) {
    let outOfStock = Number(product.stock) <= 0;
    let sizes = Array.isArray(product.sizes) ? product.sizes : [];
    let designFee = getDesignFee(product.category);

    return `
        <div class="product__info">
            <div class="product__header">
                <span class="product__category">${escapeHTML(product.category)}</span>
                <h1 class="product__name">${escapeHTML(product.name)}</h1>
            </div>

            <div class="product__pricing" id="pricingBlock">
                <span class="product__price" id="displayPrice">${formatMoney(product.basePrice)}</span>
                <span class="product__price-note" id="priceNote">base price</span>
            </div>
            <div class="product__fee-breakdown" id="feeBreakdown" hidden>
                <span class="product__fee-line">Base: ${formatMoney(product.basePrice)}</span>
                <span class="product__fee-line product__fee-line--accent">+ Design fee: ${formatMoney(designFee)}</span>
            </div>
            <hr/>
            <p class="product__description">${escapeHTML(product.description)}</p>

            ${renderColorPicker()}

            <div class="product__meta-row">
                ${sizes.length ? `
                <fieldset class="product__option" style="margin:0">
                    <legend class="product__option-label">Size</legend>
                    <div class="product__sizes">
                        ${sizes.map((size, idx) => `
                            <label class="product__size-label">
                                <input class="product__size-input" type="radio"
                                       name="product-size" value="${escapeHTML(size)}" ${idx === 0 ? 'checked' : ''}>
                                <span class="product__size-btn">${escapeHTML(size)}</span>
                            </label>`).join('')}
                    </div>
                </fieldset>` : '<div></div>'}
                <div class="product__option" style="margin:0">
                    <span class="product__option-label">Quantity</span>
                    <div class="product__qty" role="group" aria-label="Quantity">
                        <button class="product__qty-btn" id="qtyMinus" type="button" aria-label="Decrease" disabled>−</button>
                        <output class="product__qty-val" id="qtyVal">1</output>
                        <button class="product__qty-btn" id="qtyPlus" type="button" aria-label="Increase">+</button>
                    </div>
                </div>
            </div>

            ${renderDesignToggle(outOfStock)}
            ${renderCustomizationCard()}

            <div class="product__actions">
                <button class="product__customize-btn" id="customizeProductBtn" ${outOfStock ? 'disabled' : ''}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                    <span id="custBtnLabel">Open Design Studio</span>
                </button>
                <div class="product__btn-row">
                    <button class="product__add-btn" id="addToCartBtn" ${outOfStock ? 'disabled' : ''}>Add to Cart</button>
                    <button class="product__buy-btn" id="buyNowBtn" ${outOfStock ? 'disabled' : ''}>Buy Now</button>
                </div>
            </div>

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
            ${renderProductDetails(product)}
        </div>`;
}

/* ── Render: Color Picker ── */
function renderColorPicker() {
    const visibleKeys = PALETTE_KEYS.slice(0, INITIAL_COLORS_SHOWN);
    const hiddenKeys = PALETTE_KEYS.slice(INITIAL_COLORS_SHOWN);
    const activeColor = state.selectedColor || COLOR_PALETTE[PALETTE_KEYS[0]];

    // Check if activeColor is in hidden set (need to auto-expand)
    const activeInHidden = hiddenKeys.some(k => COLOR_PALETTE[k].toLowerCase() === activeColor.toLowerCase());

    return `
        <div class="product__color-section">
            <div class="product__color-header">
                <span class="product__option-label">Color</span>
                <span class="product__color-selected" id="colorSelectedName">${getColorName(activeColor)}</span>
            </div>
            <div class="product__color-swatches" id="colorSwatches">
                ${visibleKeys.map(key => {
                    const hex = COLOR_PALETTE[key];
                    const isSelected = hex.toLowerCase() === activeColor.toLowerCase();
                    return `<button class="product__color-swatch${isSelected ? ' selected' : ''}${isLightColor(hex) ? ' light' : ''}" 
                            type="button" data-color="${hex}" data-name="${getColorName(hex)}"
                            title="${getColorName(hex)}" aria-label="Select color ${getColorName(hex)}"
                            style="background:${hex}"></button>`;
                }).join('')}
                ${hiddenKeys.map(key => {
                    const hex = COLOR_PALETTE[key];
                    const isSelected = hex.toLowerCase() === activeColor.toLowerCase();
                    return `<button class="product__color-swatch product__color-swatch--hidden${isSelected ? ' selected' : ''}${isLightColor(hex) ? ' light' : ''}" 
                            type="button" data-color="${hex}" data-name="${getColorName(hex)}"
                            title="${getColorName(hex)}" aria-label="Select color ${getColorName(hex)}"
                            style="background:${hex}" ${activeInHidden ? '' : 'hidden'}></button>`;
                }).join('')}
            </div>
            ${hiddenKeys.length ? `<button class="product__color-toggle" id="colorToggleBtn" type="button">${activeInHidden ? 'Show fewer colors' : 'Show more colors'}</button>` : ''}
        </div>`;
}

/* ── Render: Design Toggle ── */
function renderDesignToggle(outOfStock) {
    return `
        <div class="product__design-toggle" id="designToggleSection">
            <span class="product__option-label">Custom Design?</span>
            <div class="product__design-options">
                <label class="product__design-option">
                    <input type="radio" name="design-required" value="no" checked ${outOfStock ? 'disabled' : ''}>
                    <span class="product__design-option-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                        No, plain product
                    </span>
                </label>
                <label class="product__design-option">
                    <input type="radio" name="design-required" value="yes" ${outOfStock ? 'disabled' : ''}>
                    <span class="product__design-option-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        Yes, customize
                    </span>
                </label>
            </div>
        </div>`;
}

/* ── Render: Customization Card ── */
function renderCustomizationCard() {
    return `
        <div class="product__customization-card missing" id="custCard" hidden>
            <div class="product__cust-preview-wrap">
                <img id="custPreviewImg" class="product__cust-preview" alt="Saved design preview" style="display:none;">
                <div class="product__cust-icon" id="custIcon">🎨</div>
            </div>
            <div class="product__cust-text">
                <button class="product__preview-btn" id="viewDesignPreviewBtn" style="display:none;" type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    Preview
                </button>
                <p class="product__cust-title" id="custTitle">Design required</p>
                <p class="product__cust-desc" id="custDesc">Open the studio and save your design to enable checkout.</p>
            </div>
        </div>`;
}

/* ── Render: Product Details ── */
function renderProductDetails(product) {
    let detailsArray = Array.isArray(product.productDetails) ? product.productDetails : [];
    if (!detailsArray.length) return '';

    let labelMap = {
        material: 'Material', capacity: 'Capacity', finish: 'Finish',
        microwaveSafe: 'Microwave Safe', dishwasherSafe: 'Dishwasher Safe',
        washCare: 'Wash Care', dimensions: 'Dimensions', weight: 'Weight',
        warranty: 'Warranty', countryOfOrigin: 'Origin',
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
                    ${detailsArray.map(detail => `
                        <div class="product__details-row">
                            <dt class="product__details-key">${escapeHTML(labelMap[detail.label] || detail.label)}</dt>
                            <dd class="product__details-val">${escapeHTML(detail.value)}</dd>
                        </div>`).join('')}
                </dl>
            </div>
        </div>`;
}

/* ── Render: Related Products ── */
function renderRelatedProducts(product) {
    let relatedArray = state.products.filter(item => item.category === product.category && item.id !== product.id).slice(0, 4);
    if (!relatedArray.length) return '';

    return `
        <section class="related" aria-labelledby="relatedHeading">
            <h2 class="related__heading" id="relatedHeading">You May Also Like</h2>
            <ul class="related__grid">
                ${relatedArray.map(item => `
                    <li>
                        <a class="related__card" href="./product.html?id=${encodeURIComponent(item.id)}">
                            <div class="related__img-wrap">
                                <img class="related__img" src="${item.images?.default}"
                                     alt="${escapeHTML(item.name)}" loading="lazy" width="273" height="273">
                            </div>
                            <div class="related__body">
                                <span class="related__cat">${escapeHTML(item.category)}</span>
                                <h3 class="related__name">${escapeHTML(item.name)}</h3>
                                <span class="related__price">${formatMoney(item.basePrice)}</span>
                            </div>
                        </a>
                    </li>`).join('')}
            </ul>
        </section>`;
}

function renderError(message) {
    return `
        <div class="product-error">
            <p class="product-error__msg">${escapeHTML(message)}</p>
            <a class="product-error__link" href="./products.html">Back to Shop</a>
        </div>`;
}

/* ── UI Update Logic ── */
function updateUI() {
    updatePriceDisplay();
    updateDesignSection();
    updateCartButtons();
}

function updatePriceDisplay() {
    let product = state.product;
    if (!product) return;
    let total = calculateItemPrice(product.basePrice, product.category, state.designRequired);
    let priceEl = $('#displayPrice');
    let noteEl = $('#priceNote');
    let breakdownEl = $('#feeBreakdown');

    if (priceEl) priceEl.textContent = formatMoney(total);
    if (state.designRequired) {
        if (noteEl) noteEl.textContent = 'incl. design fee';
        if (breakdownEl) breakdownEl.hidden = false;
    } else {
        if (noteEl) noteEl.textContent = 'base price';
        if (breakdownEl) breakdownEl.hidden = true;
    }
}

function updateDesignSection() {
    let custCard = $('#custCard');
    let custBtn = $('#customizeProductBtn');

    if (state.designRequired) {
        if (custCard) custCard.hidden = false;
        if (custBtn) custBtn.hidden = false;
        updateCustomizationUI();
    } else {
        if (custCard) custCard.hidden = true;
        if (custBtn) custBtn.hidden = true;
    }
}

function updateCartButtons() {
    let product = state.product;
    if (!product) return;
    let outOfStock = Number(product.stock) <= 0;
    let addBtn = $('#addToCartBtn');
    let buyBtn = $('#buyNowBtn');

    if (outOfStock) {
        if (addBtn) addBtn.disabled = true;
        if (buyBtn) buyBtn.disabled = true;
        return;
    }

    if (state.designRequired) {
        let hasDesign = !!state.customization;
        if (addBtn) addBtn.disabled = !hasDesign;
        if (buyBtn) buyBtn.disabled = !hasDesign;
    } else {
        if (addBtn) addBtn.disabled = false;
        if (buyBtn) buyBtn.disabled = false;
    }
}

function updateCustomizationUI() {
    let product = state.product;
    let hasDesign = !!state.customization;
    let outOfStock = Number(product?.stock ?? 0) <= 0;

    let cardNode = $('#custCard');
    let previewNode = $('#custPreviewImg');
    let iconNode = $('#custIcon');
    let titleNode = $('#custTitle');
    let descNode = $('#custDesc');
    let custLabelNode = $('#custBtnLabel');

    if (!cardNode) return;

    if (outOfStock) {
        cardNode.className = 'product__customization-card missing';
        if (previewNode) { previewNode.style.display = 'none'; previewNode.removeAttribute('src'); }
        if (iconNode) iconNode.textContent = '✗';
        if (titleNode) titleNode.textContent = 'Out of stock';
        if (descNode) descNode.textContent = 'This product is currently unavailable.';
        return;
    }

    if (hasDesign) {
        let savedColorHex = state.customization?.shirtColor;
        let displayColorName = getColorName(savedColorHex);

        cardNode.className = 'product__customization-card ready';
        if (previewNode && state.customization?.previewImage) {
            previewNode.src = state.customization.previewImage;
            previewNode.style.display = 'block';
            if (iconNode) iconNode.style.display = 'none';
        } else if (previewNode) {
            previewNode.style.display = 'none';
            if (iconNode) iconNode.style.display = '';
        }
        if (iconNode) iconNode.textContent = '✓';
        if (titleNode) titleNode.textContent = 'Design saved — ready to order';
        if (descNode) descNode.textContent = `Color: ${displayColorName || 'custom'}  ·  Click "Edit Design" to make changes`;
        if (custLabelNode) custLabelNode.textContent = 'Edit Design';
    } else {
        cardNode.className = 'product__customization-card missing';
        if (previewNode) { previewNode.style.display = 'none'; previewNode.removeAttribute('src'); }
        if (iconNode) { iconNode.style.display = ''; iconNode.textContent = '🎨'; }
        if (titleNode) titleNode.textContent = 'Design required';
        if (descNode) descNode.textContent = 'Open the studio and save your design to enable checkout.';
        if (custLabelNode) custLabelNode.textContent = 'Open Design Studio';
    }
}

/* ── Event Binding ── */
function bindEvents() {
    let mainImgNode = $('#productMainImg');
    $$('.product__thumb').forEach(thumbBtn => {
        thumbBtn.addEventListener('click', () => {
            if (mainImgNode) { mainImgNode.removeAttribute('srcset'); mainImgNode.src = thumbBtn.dataset.src || ''; }
            $$('.product__thumb').forEach(btn => { btn.classList.remove('product__thumb--active'); btn.setAttribute('aria-pressed', 'false'); });
            thumbBtn.classList.add('product__thumb--active');
            thumbBtn.setAttribute('aria-pressed', 'true');
        });
    });

    // Quantity
    let valNode = $('#qtyVal'), minusBtn = $('#qtyMinus'), plusBtn = $('#qtyPlus');
    if (valNode && minusBtn && plusBtn) {
        minusBtn.addEventListener('click', () => { if (state.qty <= 1) return; valNode.textContent = --state.qty; minusBtn.disabled = state.qty <= 1; });
        plusBtn.addEventListener('click', () => { if (state.qty >= 99) return; valNode.textContent = ++state.qty; minusBtn.disabled = false; });
    }

    // Wishlist
    $('#wishlistBtn')?.addEventListener('click', () => {
        let product = state.product; if (!product) return;
        let isNowSaved = toggleWishlist(product);
        let wishBtn = $('#wishlistBtn');
        let svgPath = wishBtn?.querySelector('path');
        wishBtn?.classList.toggle('wishlisted', isNowSaved);
        wishBtn?.setAttribute('aria-label', isNowSaved ? 'Remove from wishlist' : 'Save to wishlist');
        if (svgPath) { svgPath.setAttribute('fill', isNowSaved ? '#e11d48' : 'none'); svgPath.setAttribute('stroke', isNowSaved ? '#e11d48' : 'currentColor'); }
        if (wishBtn) { wishBtn.style.transform = 'scale(1.3)'; setTimeout(() => { wishBtn.style.transform = ''; }, 200); }
    });

    // Details toggle
    $('#detailsToggle')?.addEventListener('click', () => {
        let toggleBtn = $('#detailsToggle'), contentBody = $('#detailsBody');
        if (!toggleBtn || !contentBody) return;
        let isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', String(!isOpen));
        if (isOpen) { contentBody.hidden = true; } else { contentBody.hidden = false; }
    });

    // Design toggle (Yes/No)
    $$('input[name="design-required"]').forEach(radio => {
        radio.addEventListener('change', () => {
            state.designRequired = radio.value === 'yes';
            updateUI();
        });
    });

    // Color swatches
    $('#colorSwatches')?.addEventListener('click', (e) => {
        let swatch = e.target.closest('.product__color-swatch');
        if (!swatch) return;
        state.selectedColor = swatch.dataset.color;
        $$('.product__color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        let nameEl = $('#colorSelectedName');
        if (nameEl) nameEl.textContent = swatch.dataset.name;
    });

    // Show more colors
    $('#colorToggleBtn')?.addEventListener('click', () => {
        state.colorsExpanded = !state.colorsExpanded;
        let btn = $('#colorToggleBtn');
        $$('.product__color-swatch--hidden').forEach(s => { s.hidden = !state.colorsExpanded; });
        if (btn) btn.textContent = state.colorsExpanded ? 'Show fewer colors' : 'Show more colors';
    });

    // Customize button
    $('#customizeProductBtn')?.addEventListener('click', () => {
        if (!state.product) return;
        location.href = `./customize.html?id=${encodeURIComponent(state.product.id)}`;
    });

    // Add to cart / Buy now
    $('#addToCartBtn')?.addEventListener('click', () => handleAddToCart(false));
    $('#buyNowBtn')?.addEventListener('click', () => handleAddToCart(true));

    // Listen for design updates
    window.addEventListener('pageshow', () => {
        if (!state.product) return;
        state.customization = loadCustomization(state.product.id);
        if (state.customization) { state.designRequired = true; setDesignRadio(true); }
        updateUI();
        initDesignPreviewBtn(state.product.id);
    });

    window.addEventListener('storage', event => {
        if (state.product && event.key === `${CUSTOM_PREFIX}${state.product.id}`) {
            state.customization = loadCustomization(state.product.id);
            if (state.customization) { state.designRequired = true; setDesignRadio(true); }
            updateUI();
        }
    });

    window.addEventListener('craftora-design-updated', event => {
        if (!state.product) return;
        if (String(event.detail?.productId) !== String(state.product.id)) return;
        state.customization = loadCustomization(state.product.id);
        if (state.customization) { state.designRequired = true; setDesignRadio(true); }
        updateUI();
        initDesignPreviewBtn(state.product.id);
    });
}

function setDesignRadio(yes) {
    const radios = $$('input[name="design-required"]');
    radios.forEach(r => { r.checked = (r.value === (yes ? 'yes' : 'no')); });
}

/* ── Add to Cart ── */
function handleAddToCart(shouldRedirect) {
    let product = state.product;
    if (!product) return;

    if (state.designRequired && !state.customization) return;

    let selectedSize = $('.product__size-input:checked')?.value || product.sizes?.[0] || '';
    let selectedColor = state.selectedColor || COLOR_PALETTE[PALETTE_KEYS[0]];
    let colorName = getColorName(selectedColor);
    let designFee = state.designRequired ? getDesignFee(product.category) : 0;
    let totalPrice = calculateItemPrice(product.basePrice, product.category, state.designRequired);

    let uniqueKey;
    if (state.designRequired && state.customization) {
        let customString = JSON.stringify(state.customization);
        let hash = 0;
        for (let i = 0; i < customString.length; i++) { hash = ((hash << 5) - hash) + customString.charCodeAt(i); hash |= 0; }
        uniqueKey = `${product.id}__${selectedSize}__${selectedColor}__${hash}`;
    } else {
        uniqueKey = `${product.id}__${selectedSize}__${selectedColor}__plain`;
    }

    let currentCart = getCart();
    let existingItem = currentCart.find(item => item.key === uniqueKey);

    if (existingItem) {
        existingItem.qty += state.qty;
        if (state.designRequired) existingItem.customization = state.customization;
    } else {
        currentCart.push({
            key: uniqueKey,
            id: product.id,
            name: product.name,
            image: product.images?.default || '',
            category: product.category,
            basePrice: product.basePrice,
            designFee: designFee,
            price: totalPrice,
            color: selectedColor,
            colorName: colorName,
            size: selectedSize,
            qty: state.qty,
            customized: state.designRequired,
            designRequired: state.designRequired,
            customization: state.designRequired ? state.customization : null
        });
    }

    saveCart(currentCart);

    if (shouldRedirect) { location.href = './cart.html'; return; }

    let addBtnNode = $('#addToCartBtn');
    if (!addBtnNode) return;
    let originalText = addBtnNode.textContent;
    addBtnNode.textContent = 'Added ✓';
    addBtnNode.disabled = true;
    setTimeout(() => { addBtnNode.textContent = originalText; addBtnNode.disabled = false; }, 1400);
}

/* ── Design Preview ── */
function initDesignPreviewBtn(productId) {
    const btn = $('#viewDesignPreviewBtn');
    if (!btn) return;
    if (typeof DesignPreview === 'undefined') return;
    if (DesignPreview.exists(productId)) {
        btn.style.display = 'inline-flex';
        btn.addEventListener('click', () => DesignPreview.show(productId));
    }
}

/* ── Start ── */
initProductPage();
