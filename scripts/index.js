const reviewsTrack = document.querySelector('.js_reviews_track');
const featuredProductsRoot = document.getElementById('featuredProducts');
const homeShopBtn = document.querySelector('.hero--btn');

let reviewsScrollAmount = 0;

function money(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[match]);
}

async function loadReviews() {
    if (!reviewsTrack) return;

    const response = await fetch('./content/reviews.json');
    const reviews = await response.json();
    const duplicatedReviews = [...reviews, ...reviews];

    duplicatedReviews.forEach(item => {
        const card = document.createElement('div');
        card.className = 'review';
        card.innerHTML = `
            <p class="review--text">"${escapeHTML(item.review)}"</p>
            <span class="review--author">- ${escapeHTML(item.author)}</span>
        `;
        reviewsTrack.appendChild(card);
    });
}

function autoScrollReviews() {
    if (!reviewsTrack || !reviewsTrack.children.length) return;

    reviewsScrollAmount += 0.5;
    if (reviewsScrollAmount >= reviewsTrack.scrollWidth / 2) {
        reviewsScrollAmount = 0;
    }

    reviewsTrack.style.transform = `translateX(-${reviewsScrollAmount}px)`;
    requestAnimationFrame(autoScrollReviews);
}

function createFeaturedCard(product) {
    const wishlisted = typeof isWishlisted === 'function' && isWishlisted(product.id);

    return `
        <article class="product-card featured-products__card">
            <div class="product-card__badge">${escapeHTML(product.badges?.[0] || 'Featured')}</div>
            <div class="product-card__image-wrapper" style="background-image: url('${escapeHTML(product.images?.default || '')}')"></div>
            <div class="product-card__content">
                <div class="product-card__category">${escapeHTML(product.category)}</div>
                <h4 class="product-card__title">${escapeHTML(product.name)}</h4>
                <p class="product-card__description">${escapeHTML(product.description)}</p>
                <div class="product-card__footer">
                    <span class="product-card__price">${money(product.basePrice)}</span>
                    <div class="product-card__actions">
                        <button class="product-card__button" type="button" data-product-link="${escapeHTML(product.id)}">
                            <span>Customize</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                <path d="M18 2l.5 1.5L20 4l-1.5.5L18 6l-.5-1.5L16 4l1.5-.5Z" />
                                <path d="M5 3l.4 1.1L6.5 4.5l-1.1.4L5 6l-.4-1.1L3.5 4.5l1.1-.4Z" />
                            </svg>
                        </button>
                        <button class="product-card__wishlist${wishlisted ? ' wishlisted' : ''}" type="button" aria-label="Add ${escapeHTML(product.name)} to wishlist" data-product-wishlist="${escapeHTML(product.id)}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function bindFeaturedProductInteractions(products) {
    if (!featuredProductsRoot) return;

    featuredProductsRoot.querySelectorAll('[data-product-link]').forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = `./product.html?id=${encodeURIComponent(button.dataset.productLink)}`;
        });
    });

    featuredProductsRoot.querySelectorAll('[data-product-wishlist]').forEach(button => {
        button.addEventListener('click', event => {
            event.stopPropagation();

            const product = products.find(item => item.id === button.dataset.productWishlist);
            if (!product || typeof toggleWishlist !== 'function') {
                window.location.href = './login.html';
                return;
            }

            const user = (() => {
                try { return JSON.parse(localStorage.getItem('craftora_user') || 'null'); } catch { return null; }
            })();

            if (!user) {
                window.location.href = './login.html';
                return;
            }

            const nowWishlisted = toggleWishlist({
                id: product.id,
                name: product.name,
                category: product.category,
                price: product.basePrice,
                image: product.images?.default || ''
            });

            button.classList.toggle('wishlisted', nowWishlisted);
        });
    });
}

/* Returns the width of one card + gap to use as the scroll step */
function getFeaturedCardWidth() {
    const card = featuredProductsRoot?.querySelector('.product-card');
    if (!card) return 300;
    const gap = parseFloat(getComputedStyle(featuredProductsRoot).gap) || 24;
    return card.getBoundingClientRect().width + gap;
}

function scrollFeaturedProducts(direction) {
    if (!featuredProductsRoot) return;
    featuredProductsRoot.scrollBy({ left: getFeaturedCardWidth() * direction, behavior: 'smooth' });
}

function renderFeaturedProducts(products) {
    if (!featuredProductsRoot) return;

    const featured = products.filter(product => product.featured).slice(0, 8);
    if (!featured.length) {
        featuredProductsRoot.innerHTML = '<p class="featured-products__placeholder">Featured products will appear here soon.</p>';
        return;
    }

    // Render cards directly into the flex scroll container — no carousel wrapper needed.
    // Desktop: overflow hidden, cards fill the row equally.
    // Mobile/tablet: container scrolls horizontally with snap.
    featuredProductsRoot.innerHTML = featured.map(createFeaturedCard).join('');

    bindFeaturedProductInteractions(featured);
}

async function loadFeaturedProducts() {
    if (!featuredProductsRoot) return;

    try {
        const response = await fetch('./content/products.json');
        const data = await response.json();
        renderFeaturedProducts(data.products || []);
    } catch {
        featuredProductsRoot.innerHTML = '<p class="featured-products__placeholder">Unable to load featured products right now.</p>';
    }
}

function bindHeroButton() {
    if (!homeShopBtn) return;
    homeShopBtn.addEventListener('click', () => {
        window.location.href = './products.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    bindHeroButton();
    loadReviews().then(autoScrollReviews);
    loadFeaturedProducts();

    // Wire nav arrow buttons (defined in HTML, outside the JS-rendered card strip)
    document.getElementById('featuredPrev')?.addEventListener('click', () => scrollFeaturedProducts(-1));
    document.getElementById('featuredNext')?.addEventListener('click', () => scrollFeaturedProducts(1));
});
