const CART_KEY = 'cart';
const WISHLIST_KEY = 'craftora_wishlist';
const CUSTOM_PREFIX = 'designData_';

const state = {
    product: null,
    products: [],
    qty: 1,
    customization: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const escapeHTML = str => String(str ?? '').replace(/[&<>"']/g, match =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[match]);
const formatMoney = num => `₹${Number(num || 0).toLocaleString('en-IN')}`;

// --- IMAGE OPTIMIZATION HELPER ---
const getOptImg = (src, width) => {
    try {
        const url = new URL(src);
        url.searchParams.set('w', width);
        url.searchParams.set('fm', 'webp');
        url.searchParams.set('q', '75');
        url.searchParams.set('fit', 'crop');
        return url.toString();
    } catch (e) {
        return src;
    }
};

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

function initProductPage() {
    let mountNode = $('#product');
    if (!mountNode) return;

    let productId = new URLSearchParams(location.search).get('id');
    if (!productId) { mountNode.innerHTML = renderError('No product specified.'); mountNode.setAttribute('aria-busy', 'false'); return; }

    mountNode.innerHTML = renderSkeleton();

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
                preload.href = getOptImg(mainImgSrc, 800);
                preload.fetchPriority = 'high';
                document.head.appendChild(preload);
            }

            document.title = `${state.product.name} — Craftora`;
            state.customization = loadCustomization(productId);

            mountNode.innerHTML = renderPage(state.product);
            mountNode.setAttribute('aria-busy', 'false');
            bindEvents();
            updateCustomizationUI();
            initDesignPreviewBtn(productId);
        })
        .catch(err => {
            console.error(err);
            mountNode.innerHTML = renderError('Failed to load product. Please refresh.');
            mountNode.setAttribute('aria-busy', 'false');
        });
}

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
                <li class="breadcrumb__item"><a class="breadcrumb__link" href="./index.html">Home</a><span class="breadcrumb__sep" aria-hidden="true">/</span></li>
                <li class="breadcrumb__item"><a class="breadcrumb__link" href="./products.html">Shop</a><span class="breadcrumb__sep" aria-hidden="true">/</span></li>
                <li class="breadcrumb__item"><a class="breadcrumb__link" href="./products.html?category=${encodeURIComponent(product.category)}">${escapeHTML(product.category)}</a><span class="breadcrumb__sep" aria-hidden="true">/</span></li>
                <li class="breadcrumb__item breadcrumb__item--current" aria-current="page">${escapeHTML(product.name)}</li>
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
                     src="${getOptImg(images[0], 800)}"
                     srcset="${getOptImg(images[0], 400)} 400w, 
                             ${getOptImg(images[0], 800)} 800w, 
                             ${getOptImg(images[0], 1200)} 1200w"
                     sizes="(max-width: 960px) 100vw, 52vw"
                     alt="${escapeHTML(product.name)}" 
                     width="800" height="1000" 
                     fetchpriority="high"
                     decoding="sync">
            </div>

            ${images.length > 1 ? `
                <ul class="product__thumbs" aria-label="Product images">
                    ${images.map((src, idx) => `
                        <li><button class="product__thumb${idx === 0 ? ' product__thumb--active' : ''}"
                                    type="button" data-src="${getOptImg(src, 800)}"
                                    aria-label="View image ${idx + 1}" aria-pressed="${idx === 0}">
                            <img class="product__thumb-img" 
                                 src="${getOptImg(src, 128)}" 
                                 alt="" loading="lazy" width="64" height="64">
                        </button></li>`).join('')}
                </ul>` : ''}
        </div>`;
}

function renderProductInfo(product) {
    let outOfStock = Number(product.stock) <= 0;
    let colors = Array.isArray(product.colors) ? product.colors : [];
    let colorNames = Array.isArray(product.colorNames) ? product.colorNames : [];
    let sizes = Array.isArray(product.sizes) ? product.sizes : [];

    return `
        <div class="product__info">

            <div class="product__header">
                <span class="product__category">${escapeHTML(product.category)}</span>
                <h1 class="product__name">${escapeHTML(product.name)}</h1>
            </div>

            <div class="product__pricing">
                <span class="product__price">${formatMoney(product.basePrice)}</span>
                <span class="product__price-note">base price</span>
            </div>

            <p class="product__description">${escapeHTML(product.description)}</p>

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
                        <button class="product__qty-btn" id="qtyPlus"  type="button" aria-label="Increase">+</button>
                    </div>
                </div>
            </div>

            
            <p>Product available in Multiple Colors</p>
            
            <div class="product__customization-card missing" id="custCard">
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
                
            </div>

            <div class="product__actions">
                <button class="product__customize-btn" id="customizeProductBtn" ${outOfStock ? 'disabled' : ''}>
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

function renderProductDetails(product) {
    let detailsArray = Array.isArray(product.productDetails) ? product.productDetails : [];
    if (!detailsArray.length) return '';

    let labelMap = {
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
                    ${detailsArray.map(detail => `
                        <div class="product__details-row">
                            <dt class="product__details-key">${escapeHTML(labelMap[detail.label] || detail.label)}</dt>
                            <dd class="product__details-val">${escapeHTML(detail.value)}</dd>
                        </div>`).join('')}
                </dl>
            </div>
        </div>`;
}

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
                                <img class="related__img" src="${getOptImg(item.images?.default, 400)}"
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

function renderSkeleton() {
    return `
        <nav aria-hidden="true" style="margin-bottom: 2.75rem;">
            <div class="skeleton-block" style="height: 1rem; width: 40%; border-radius: 4px;"></div>
        </nav>
        <div class="product__skeleton">
            <div class="skeleton-block" style="aspect-ratio:4/5;border-radius:1.5rem"></div>
            <div style="display:flex;flex-direction:column;gap:1rem;padding-top:0.5rem;min-height:650px">
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

function renderError(message) {
    return `
        <div class="product-error">
            <p class="product-error__msg">${escapeHTML(message)}</p>
            <a class="product-error__link" href="./products.html">Back to Shop</a>
        </div>`;
}

function initDesignPreviewBtn(productId) {
    const btn = $('#viewDesignPreviewBtn');
    if (!btn) return;
    if (typeof DesignPreview === 'undefined') return;

    if (DesignPreview.exists(productId)) {
        btn.style.display = 'inline-flex';
        btn.addEventListener('click', () => DesignPreview.show(productId));
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
    let addBtnNode = $('#addToCartBtn');
    let buyBtnNode = $('#buyNowBtn');
    let custBtnNode = $('#customizeProductBtn');
    let custLabelNode = $('#custBtnLabel');

    if (!cardNode) return;

    if (outOfStock) {
        cardNode.className = 'product__customization-card missing';
        if (previewNode) {
            previewNode.style.display = 'none';
            previewNode.removeAttribute('src');
        }
        if (iconNode) iconNode.textContent = '✗';
        if (titleNode) titleNode.textContent = 'Out of stock';
        if (descNode) descNode.textContent = 'This product is currently unavailable.';
        if (addBtnNode) addBtnNode.disabled = true;
        if (buyBtnNode) buyBtnNode.disabled = true;
        if (custBtnNode) custBtnNode.disabled = true;
        return;
    }

    if (hasDesign) {
        let savedColorHex = state.customization?.shirtColor;
        let displayColorName = savedColorHex;

        if (product?.colors && product?.colorNames) {
            let colorIndex = product.colors.indexOf(savedColorHex);
            if (colorIndex > -1) displayColorName = product.colorNames[colorIndex];
        }

        cardNode.className = 'product__customization-card ready';

        if (previewNode && state.customization?.previewImage) {
            previewNode.src = state.customization.previewImage;
            previewNode.style.display = 'block';
            if (iconNode) iconNode.style.display = 'none';
        } else if (previewNode) {
            previewNode.style.display = 'none';
            previewNode.removeAttribute('src');
            if (iconNode) iconNode.style.display = '';
        }

        if (iconNode) iconNode.textContent = '✓';
        if (titleNode) titleNode.textContent = 'Design saved — ready to order';
        if (descNode) descNode.textContent = `Color: ${displayColorName || 'custom'}  ·  Click "Edit Design" to make changes`;
        if (addBtnNode) addBtnNode.disabled = false;
        if (buyBtnNode) buyBtnNode.disabled = false;
        if (custLabelNode) custLabelNode.textContent = 'Edit Design';
    } else {
        cardNode.className = 'product__customization-card missing';

        if (previewNode) {
            previewNode.style.display = 'none';
            previewNode.removeAttribute('src');
        }
        if (iconNode) {
            iconNode.style.display = '';
            iconNode.textContent = '🎨';
        }
        if (titleNode) titleNode.textContent = 'Design required';
        if (descNode) descNode.textContent = 'Open the studio and save your design to enable checkout.';
        if (addBtnNode) addBtnNode.disabled = true;
        if (buyBtnNode) buyBtnNode.disabled = true;
        if (custLabelNode) custLabelNode.textContent = 'Open Design Studio';
    }
}

function bindEvents() {
    let mainImgNode = $('#productMainImg');
    $$('.product__thumb').forEach(thumbBtn => {
        thumbBtn.addEventListener('click', () => {
            if (mainImgNode) {
                mainImgNode.removeAttribute('srcset');
                mainImgNode.src = thumbBtn.dataset.src || '';
            }
            $$('.product__thumb').forEach(btn => {
                btn.classList.remove('product__thumb--active');
                btn.setAttribute('aria-pressed', 'false');
            });
            thumbBtn.classList.add('product__thumb--active');
            thumbBtn.setAttribute('aria-pressed', 'true');
        });
    });

    let valNode = $('#qtyVal');
    let minusBtn = $('#qtyMinus');
    let plusBtn = $('#qtyPlus');

    if (valNode && minusBtn && plusBtn) {
        minusBtn.addEventListener('click', () => {
            if (state.qty <= 1) return;
            valNode.textContent = --state.qty;
            minusBtn.disabled = state.qty <= 1;
        });
        plusBtn.addEventListener('click', () => {
            if (state.qty >= 99) return;
            valNode.textContent = ++state.qty;
            minusBtn.disabled = false;
        });
    }

    $('#wishlistBtn')?.addEventListener('click', () => {
        let product = state.product;
        if (!product) return;
        let isNowSaved = toggleWishlist(product);
        let wishBtn = $('#wishlistBtn');
        let svgPath = wishBtn?.querySelector('path');

        wishBtn?.classList.toggle('wishlisted', isNowSaved);
        wishBtn?.setAttribute('aria-label', isNowSaved ? 'Remove from wishlist' : 'Save to wishlist');

        if (svgPath) {
            svgPath.setAttribute('fill', isNowSaved ? '#e11d48' : 'none');
            svgPath.setAttribute('stroke', isNowSaved ? '#e11d48' : 'currentColor');
        }
        if (wishBtn) {
            wishBtn.style.transform = 'scale(1.3)';
            setTimeout(() => { wishBtn.style.transform = ''; }, 200);
        }
    });

    $('#detailsToggle')?.addEventListener('click', () => {
        let toggleBtn = $('#detailsToggle');
        let contentBody = $('#detailsBody');
        if (!toggleBtn || !contentBody) return;
        let isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', String(!isOpen));
        if (isOpen) { contentBody.hidden = true; } else { contentBody.hidden = false; }
    });

    $('#customizeProductBtn')?.addEventListener('click', () => {
        if (!state.product) return;
        let userAuth = (() => {
            try { return JSON.parse(localStorage.getItem('craftora_user') || 'null'); } catch { return null; }
        })();
        let targetUrl = `./customize.html?id=${encodeURIComponent(state.product.id)}`;
        if (!userAuth) {
            let redirectUrl = encodeURIComponent(targetUrl);
            alert('You must be signed in to open the design studio.');
            location.href = `./login.html?redirect=${redirectUrl}`;
            return;
        }
        location.href = targetUrl;
    });

    $('#addToCartBtn')?.addEventListener('click', () => handleAddToCart(false));
    $('#buyNowBtn')?.addEventListener('click', () => handleAddToCart(true));

    window.addEventListener('pageshow', () => {
        if (!state.product) return;
        state.customization = loadCustomization(state.product.id);
        updateCustomizationUI();
        initDesignPreviewBtn(state.product.id);
    });

    window.addEventListener('storage', event => {
        if (state.product && event.key === `${CUSTOM_PREFIX}${state.product.id}`) {
            state.customization = loadCustomization(state.product.id);
            updateCustomizationUI();
        }
    });

    window.addEventListener('craftora-design-updated', event => {
        if (!state.product) return;
        if (String(event.detail?.productId) !== String(state.product.id)) return;
        state.customization = loadCustomization(state.product.id);
        updateCustomizationUI();
        initDesignPreviewBtn(state.product.id);
    });
}

function handleAddToCart(shouldRedirect) {
    let product = state.product;
    if (!product || !state.customization) return;

    let selectedSize = $('.product__size-input:checked')?.value || product.sizes?.[0] || '';
    let selectedColor = state.customization.shirtColor || product.colors?.[0] || '';

    let customString = JSON.stringify(state.customization);
    let hash = 0;
    for (let i = 0; i < customString.length; i++) {
        hash = ((hash << 5) - hash) + customString.charCodeAt(i);
        hash |= 0;
    }

    let uniqueKey = `${product.id}__${selectedSize}__${selectedColor}__${hash}`;

    let currentCart = getCart();
    let existingItem = currentCart.find(item => item.key === uniqueKey);

    if (existingItem) {
        existingItem.qty += state.qty;
        existingItem.customization = state.customization;
    } else {
        currentCart.push({
            key: uniqueKey,
            id: product.id,
            name: product.name,
            image: product.images?.default || '',
            category: product.category,
            price: product.basePrice,
            color: selectedColor,
            size: selectedSize,
            qty: state.qty,
            customized: true,
            customization: state.customization
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

initProductPage();