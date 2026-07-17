import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getDesignFee, calculateItemPrice } from '../legacy/pricing.js';
import { updateCartBadges } from '../legacy/layout.js';
import DesignPreview from '../legacy/designPreview.js';
import '../styles/product.css';

const CART_KEY = 'cart';
const WISHLIST_KEY = 'craftora_wishlist';
const CUSTOM_PREFIX = 'designData_';

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
const DEFAULT_COLOR = COLOR_PALETTE[PALETTE_KEYS[0]];

const DETAIL_LABELS = {
    material: 'Material', capacity: 'Capacity', finish: 'Finish',
    microwaveSafe: 'Microwave Safe', dishwasherSafe: 'Dishwasher Safe',
    washCare: 'Wash Care', dimensions: 'Dimensions', weight: 'Weight',
    warranty: 'Warranty', countryOfOrigin: 'Origin',
};

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

const formatMoney = num => `₹${Number(num || 0).toLocaleString('en-IN')}`;

const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } };
const getWishlist = () => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; } };
const isWishlisted = id => getWishlist().some(item => item.id === id);

function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadges();
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

function isLoggedIn() {
    try {
        const raw = localStorage.getItem('craftora_user');
        if (!raw) return false;
        const user = JSON.parse(raw);
        return !!(user && user.phone);
    } catch {
        return false;
    }
}

export default function ProductPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const productId = new URLSearchParams(location.search).get('id');

    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState('loading'); // loading | ready | error
    const [errorMsg, setErrorMsg] = useState('');

    const [qty, setQty] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
    const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
    const [activeImage, setActiveImage] = useState('');
    const [designRequired, setDesignRequired] = useState(false);
    const [customization, setCustomization] = useState(null);
    const [wishlisted, setWishlisted] = useState(false);
    const [wishlistPulse, setWishlistPulse] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [shippingOpen, setShippingOpen] = useState(true);
    const [previewExists, setPreviewExists] = useState(false);
    const [toast, setToast] = useState(false);

    // Fetch product catalog once.
    useEffect(() => {
        let cancelled = false;
        fetch('/content/products.json', { priority: 'high' })
            .then(res => res.json())
            .then(data => { if (!cancelled) setProducts(data.products || []); })
            .catch(err => {
                console.error(err);
                if (!cancelled) { setStatus('error'); setErrorMsg('Failed to load product. Please refresh.'); }
            });
        return () => { cancelled = true; };
    }, []);

    const product = useMemo(
        () => products.find(item => item.id === productId) || null,
        [products, productId]
    );

    // Resolve the current product + its saved local state whenever the id or catalog changes.
    useEffect(() => {
        if (!productId) { setStatus('error'); setErrorMsg('No product specified.'); return; }
        if (!products.length) return; // still loading
        if (!product) { setStatus('error'); setErrorMsg('Product not found.'); return; }

        document.title = `${product.name} — Craftora`;

        const saved = loadCustomization(productId);
        setCustomization(saved);
        setSelectedColor(saved?.shirtColor || DEFAULT_COLOR);
        setDesignRequired(!!saved);
        setSelectedSize(product.sizes?.[0] || '');
        setActiveImage(product.images?.default || '');
        setWishlisted(isWishlisted(product.id));
        setQty(1);
        setPreviewExists(!!(DesignPreview?.exists && DesignPreview.exists(productId)));
        setStatus('ready');

        const mainImgSrc = product.images?.default;
        let preloadLink;
        if (mainImgSrc) {
            preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = mainImgSrc;
            preloadLink.fetchPriority = 'high';
            document.head.appendChild(preloadLink);
        }
        return () => { preloadLink?.remove(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, products]);

    // Pick up design updates made elsewhere (customizer tab, cart, etc).
    useEffect(() => {
        if (!productId) return;
        const refresh = () => {
            const saved = loadCustomization(productId);
            setCustomization(saved);
            if (saved) setDesignRequired(true);
            setPreviewExists(!!(DesignPreview?.exists && DesignPreview.exists(productId)));
        };
        const onStorage = event => { if (event.key === `${CUSTOM_PREFIX}${productId}`) refresh(); };
        const onDesignUpdated = event => { if (String(event.detail?.productId) === String(productId)) refresh(); };

        window.addEventListener('pageshow', refresh);
        window.addEventListener('storage', onStorage);
        window.addEventListener('craftora-design-updated', onDesignUpdated);
        return () => {
            window.removeEventListener('pageshow', refresh);
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('craftora-design-updated', onDesignUpdated);
        };
    }, [productId]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(false), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    if (status === 'loading') {
        return <div id="product" aria-live="polite" aria-busy="true" aria-label="Product details" />;
    }

    if (status === 'error') {
        return (
            <div id="product" aria-live="polite" aria-busy="false" aria-label="Product details">
                <div className="product-error">
                    <p className="product-error__msg">{errorMsg}</p>
                    <Link className="product-error__link" to="/products">Back to Shop</Link>
                </div>
            </div>
        );
    }

    const outOfStock = Number(product.stock) <= 0;
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const badges = Array.isArray(product.badges) ? product.badges : [];
    const images = [product.images?.default, ...(product.images?.others || [])].filter(Boolean);
    const designFee = getDesignFee(product.category);
    const total = calculateItemPrice(product.basePrice, product.category, designRequired);
    const hasDesign = !!customization;
    const relatedProducts = products
        .filter(item => item.category === product.category && item.id !== product.id)
        .slice(0, 4);

    function handleWishlistClick() {
        const nowSaved = toggleWishlist(product);
        setWishlisted(nowSaved);
        setWishlistPulse(true);
        setTimeout(() => setWishlistPulse(false), 200);
    }

    function handleColorSelect(hex) {
        setSelectedColor(hex);
        setColorDropdownOpen(false);
    }

    function handleCustomizeClick() {
        navigate(`/customize?id=${encodeURIComponent(product.id)}&size=${encodeURIComponent(selectedSize || product.sizes?.[0] || '')}`);
    }

    function handleAddToCart(shouldRedirect) {
        if (designRequired && !customization) return;

        if (shouldRedirect && !isLoggedIn()) {
            alert('You are not logged in. Please log in to continue.');
            navigate('/login?redirect=' + encodeURIComponent(location.pathname + location.search));
            return;
        }

        const size = selectedSize || product.sizes?.[0] || '';
        const colorName = getColorName(selectedColor);
        const itemDesignFee = designRequired ? getDesignFee(product.category) : 0;
        const totalPrice = calculateItemPrice(product.basePrice, product.category, designRequired);

        let uniqueKey;
        if (designRequired && customization) {
            const { previewImage, generatedAt, ...designData } = customization;
            const customString = JSON.stringify(designData);
            let hash = 0;
            for (let i = 0; i < customString.length; i++) { hash = ((hash << 5) - hash) + customString.charCodeAt(i); hash |= 0; }
            uniqueKey = `${product.id}__${size}__${selectedColor}__${hash}`;
        } else {
            uniqueKey = `${product.id}__${size}__${selectedColor}__plain`;
        }

        const itemData = {
            key: uniqueKey,
            id: product.id,
            name: product.name,
            image: (designRequired && customization?.previewImage) ? customization.previewImage : (product.images?.default || ''),
            category: product.category,
            basePrice: product.basePrice,
            designFee: itemDesignFee,
            price: totalPrice,
            color: selectedColor,
            colorName,
            size,
            qty,
            customized: designRequired,
            designRequired,
            customization: designRequired ? customization : null,
        };

        if (shouldRedirect) {
            sessionStorage.setItem('craftora_checkout', JSON.stringify({ source: 'buy-now', items: [itemData] }));
            navigate('/checkout');
            return;
        }

        const currentCart = getCart();
        const existingItem = currentCart.find(item => item.key === uniqueKey);
        if (existingItem) {
            existingItem.qty += qty;
            if (designRequired) { existingItem.customization = customization; existingItem.image = itemData.image; }
        } else {
            currentCart.push(itemData);
        }
        saveCart(currentCart);

        window.scrollTo({ top: 0, behavior: 'smooth' });
        setToast(true);
    }

    return (
        <div id="product" aria-live="polite" aria-busy="false" aria-label="Product details">
            <nav className="breadcrumb" aria-label="Breadcrumb">
                <ol className="breadcrumb__list">
                    <li><Link className="breadcrumb__link" to="/products">Shop</Link><span className="breadcrumb__sep" aria-hidden="true">/</span></li>
                    <li><Link className="breadcrumb__link" to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link><span className="breadcrumb__sep" aria-hidden="true">/</span></li>
                    <li aria-current="page">{product.name}</li>
                </ol>
            </nav>

            <section className="product" aria-label={product.name}>
                <div className="product__gallery">
                    <div className="product__main-wrap">
                        {badges.length > 0 && (
                            <div className="product__badges">
                                {badges.map((badge, idx) => (
                                    <span key={badge} className={`product__badge${idx > 0 ? ' product__badge--accent' : ''}`}>{badge}</span>
                                ))}
                            </div>
                        )}
                        <button
                            className={`product__wishlist-btn${wishlisted ? ' wishlisted' : ''}`}
                            type="button"
                            onClick={handleWishlistClick}
                            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                            style={wishlistPulse ? { transform: 'scale(1.3)' } : undefined}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? '#e11d48' : 'none'}
                                stroke={wishlisted ? '#e11d48' : 'currentColor'} strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </button>
                        <img className="product__main-img" src={activeImage} alt={product.name}
                            width="800" height="1000" fetchpriority="high" decoding="sync" />
                    </div>
                    {images.length > 1 && (
                        <ul className="product__thumbs" aria-label="Product images">
                            {images.map((src, idx) => (
                                <li key={src}>
                                    <button
                                        className={`product__thumb${src === activeImage ? ' product__thumb--active' : ''}`}
                                        type="button"
                                        onClick={() => setActiveImage(src)}
                                        aria-label={`View image ${idx + 1}`}
                                        aria-pressed={src === activeImage}
                                    >
                                        <img className="product__thumb-img" src={src} alt="" loading="lazy" width="64" height="64" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="product__info">
                    <div className="product__header">
                        <span className="product__category">{product.category}</span>
                        <h1 className="product__name">{product.name}</h1>
                    </div>

                    <div className="product__pricing">
                        <span className="product__price">{formatMoney(total)}</span>
                        <span className="product__price-note">{designRequired ? 'incl. design fee' : 'base price'}</span>
                        <span className="product__fee-pill">+ {formatMoney(designFee)} Custom Design</span>
                    </div>
                    <hr />
                    <p className="product__description">{product.description}</p>

                    <div className="product__color-section">
                        <span className="product__option-label">Color</span>
                        <button
                            className="product__color-dropdown-trigger"
                            type="button"
                            aria-expanded={colorDropdownOpen}
                            aria-controls="colorDropdownPanel"
                            onClick={() => setColorDropdownOpen(open => !open)}
                        >
                            <span className="product__color-dropdown-preview">
                                <span className="product__color-dropdown-dot" style={{ background: selectedColor }} />
                                <span className="product__color-dropdown-name">{getColorName(selectedColor)}</span>
                            </span>
                            <svg className="product__color-dropdown-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                        <div className="product__color-dropdown-panel" id="colorDropdownPanel" hidden={!colorDropdownOpen}>
                            <div className="product__color-swatches">
                                {PALETTE_KEYS.map(key => {
                                    const hex = COLOR_PALETTE[key];
                                    const isSelected = hex.toLowerCase() === selectedColor.toLowerCase();
                                    const name = getColorName(hex);
                                    return (
                                        <button
                                            key={key}
                                            className={`product__color-swatch${isSelected ? ' selected' : ''}${isLightColor(hex) ? ' light' : ''}`}
                                            type="button"
                                            title={name}
                                            aria-label={`Select color ${name}`}
                                            style={{ background: hex }}
                                            onClick={() => handleColorSelect(hex)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="product__meta-row">
                        {sizes.length ? (
                            <fieldset className="product__option" style={{ margin: 0 }}>
                                <legend className="product__option-label">Size</legend>
                                <div className="product__sizes">
                                    {sizes.map(size => (
                                        <label key={size} className="product__size-label">
                                            <input
                                                className="product__size-input"
                                                type="radio"
                                                name="product-size"
                                                value={size}
                                                checked={selectedSize === size}
                                                onChange={() => setSelectedSize(size)}
                                            />
                                            <span className="product__size-btn">{size}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        ) : <div />}
                        <div className="product__option" style={{ margin: 0 }}>
                            <span className="product__option-label">Quantity</span>
                            <div className="product__qty" role="group" aria-label="Quantity">
                                <button className="product__qty-btn" type="button" aria-label="Decrease" disabled={qty <= 1}
                                    onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                                <output className="product__qty-val">{qty}</output>
                                <button className="product__qty-btn" type="button" aria-label="Increase"
                                    onClick={() => setQty(q => Math.min(99, q + 1))}>+</button>
                            </div>
                        </div>
                    </div>

                    <div className="product__design-toggle">
                        <span className="product__option-label">Apply Custom Design</span>
                        <label className="product__toggle-switch">
                            <input type="checkbox" disabled={outOfStock} checked={designRequired}
                                onChange={e => setDesignRequired(e.target.checked)} />
                            <span className="product__toggle-slider" aria-hidden="true" />
                        </label>
                    </div>

                    {designRequired && (
                        <CustomizationCard
                            outOfStock={outOfStock}
                            hasDesign={hasDesign}
                            customization={customization}
                            previewExists={previewExists}
                            onCreateOrEdit={handleCustomizeClick}
                            onViewDesign={() => DesignPreview.show(productId)}
                        />
                    )}

                    <div className="product__actions">
                        <div className="product__btn-row">
                            <button className="product__add-btn" disabled={outOfStock || (designRequired && !hasDesign)} onClick={() => handleAddToCart(false)}>
                                Add to Cart <span className="product__btn-price">{formatMoney(total)}</span>
                            </button>
                            <button className="product__buy-btn" disabled={outOfStock || (designRequired && !hasDesign)} onClick={() => handleAddToCart(true)}>
                                Buy Now <span className="product__btn-price">{formatMoney(total)}</span>
                            </button>
                        </div>
                    </div>

                    <div className="product__accordion-group">
                        {Array.isArray(product.productDetails) && product.productDetails.length > 0 && (
                            <div className="product__details">
                                <button className="product__details-toggle" aria-expanded={detailsOpen} aria-controls="detailsBody" type="button"
                                    onClick={() => setDetailsOpen(open => !open)}>
                                    <span>Product Details</span>
                                    <svg className="product__details-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                                </button>
                                <div className="product__details-body" id="detailsBody" hidden={!detailsOpen}>
                                    <dl className="product__details-list">
                                        {product.productDetails.map(detail => (
                                            <div className="product__details-row" key={detail.label}>
                                                <dt className="product__details-key">{DETAIL_LABELS[detail.label] || detail.label}</dt>
                                                <dd className="product__details-val">{detail.value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            </div>
                        )}

                        <div className="product__details">
                            <button className="product__details-toggle" aria-expanded={shippingOpen} aria-controls="shippingBody" type="button"
                                onClick={() => setShippingOpen(open => !open)}>
                                <span>Shipping &amp; Returns</span>
                                <svg className="product__details-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                            </button>
                            <div className="product__details-body" id="shippingBody" hidden={!shippingOpen}>
                                <ul className="product__shipping-list">
                                    <li>Standard orders ship in 3–5 business days.</li>
                                    <li>Customized products require approximately 5 additional business days.</li>
                                    <li>Returns are accepted within 7 days for non-customized products only.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {relatedProducts.length > 0 && (
                <section className="related" aria-labelledby="relatedHeading">
                    <h2 className="related__heading" id="relatedHeading">You May Also Like</h2>
                    <ul className="related__grid">
                        {relatedProducts.map(item => (
                            <li key={item.id}>
                                <Link className="related__card" to={`/product?id=${encodeURIComponent(item.id)}`}>
                                    <div className="related__img-wrap">
                                        <img className="related__img" src={item.images?.default} alt={item.name} loading="lazy" width="273" height="273" />
                                    </div>
                                    <div className="related__body">
                                        <span className="related__cat">{item.category}</span>
                                        <h3 className="related__name">{item.name}</h3>
                                        <span className="related__price">{formatMoney(item.basePrice)}</span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {toast && (
                <div id="atc-toast" className="show" role="status" aria-live="polite">
                    <div className="atc-toast__content">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                        <span className="atc-toast__msg">Added to cart</span>
                        <Link to="/cart" className="atc-toast__cta">Go to Cart</Link>
                        <button className="atc-toast__close" type="button" aria-label="Dismiss notification" onClick={() => setToast(false)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function CustomizationCard({ outOfStock, hasDesign, customization, previewExists, onCreateOrEdit, onViewDesign }) {
    if (outOfStock) {
        return (
            <div className="product__customization-card missing">
                <div className="product__cust-preview-wrap">
                    <div className="product__cust-icon">✗</div>
                </div>
                <div className="product__cust-text">
                    <span className="product__cust-badge">Unavailable</span>
                    <p className="product__cust-title">Out of stock</p>
                    <p className="product__cust-desc">This product is currently unavailable.</p>
                </div>
            </div>
        );
    }

    if (hasDesign) {
        const colorName = getColorName(customization?.shirtColor);
        const hasBack = !!customization?.previewImageBack;
        return (
            <div className="product__customization-card ready">
                {customization?.previewImage ? (
                    <div className={`product__cust-preview-wrap${hasBack ? ' product__cust-preview-wrap--split' : ''}`}>
                        <img className="product__cust-preview" src={customization.previewImage} alt="Saved design preview — front" />
                        {hasBack && (
                            <img className="product__cust-preview" src={customization.previewImageBack} alt="Saved design preview — back" />
                        )}
                    </div>
                ) : (
                    <div className="product__cust-preview-wrap">
                        <div className="product__cust-icon">✓</div>
                    </div>
                )}
                <div className="product__cust-text">
                    <span className="product__cust-badge">Active Customization</span>
                    <p className="product__cust-title">Color: {colorName || 'custom'}</p>
                    {previewExists && (
                        <button className="product__preview-btn" style={{ display: 'inline-flex' }} type="button" onClick={onViewDesign}>
                            View Design
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    )}
                </div>
                <button className="product__cust-create-btn" type="button" onClick={onCreateOrEdit}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    <span>Edit</span>
                </button>
            </div>
        );
    }

    return (
        <div className="product__customization-card missing">
            <div className="product__cust-preview-wrap">
                <div className="product__cust-icon">🎨</div>
            </div>
            <div className="product__cust-text">
                <span className="product__cust-badge">No design selected</span>
                <p className="product__cust-title">Design required</p>
                <p className="product__cust-desc">Create your design to personalize this product.</p>
            </div>
            <button className="product__cust-create-btn" type="button" onClick={onCreateOrEdit}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                <span>Create</span>
            </button>
        </div>
    );
}
