/* ============================================================
   products.js — Craftora Products Listing Page
   Ported from client/scripts/products.js, exported as ESM.
   ============================================================ */

import { isWishlisted, toggleWishlist } from './wishlist.js';

let allProducts = [];
let currentCategory = 'All Category';

function getProducts() {
    const products = fetch('/content/products.json')
        .then(response => response.json())
        .then(data => data.products)
        .catch(error => {
            console.error('Error fetching products:', error);
            return [];
        });

    return products.then(data => data);
}

function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');

    if (categoryParam) {
        currentCategory = categoryParam;

        const categoryBtns = document.querySelectorAll('.category-btn');
        let matched = false;

        categoryBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.trim().toLowerCase() === categoryParam.toLowerCase()) {
                btn.classList.add('active');
                matched = true;
            }
        });

        if (!matched) {
            document.querySelector('.category-btn').classList.add('active');
            currentCategory = 'All Category';
        }

        applyFilters();
    }
}

function setupEventListeners() {
    const categoryBtns = document.querySelectorAll('.category-btn');

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            currentCategory = e.target.textContent.trim();
            applyFilters();
        });
    });
}

function applyFilters() {
    let filteredProducts = allProducts;

    if (currentCategory !== 'All Category') {
        filteredProducts = filteredProducts.filter(product =>
            product.category.toLowerCase() === currentCategory.toLowerCase()
        );
    }

    renderProducts(filteredProducts);
}

function renderProducts(productsToRender) {
    const grid = document.getElementById('productGrid');

    if (!grid) return;

    grid.innerHTML = '';

    if (productsToRender.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No products found matching your criteria.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        card.innerHTML = `
            <div class="product-card__badge">${product.badges[0]}</div>
            <div class="product-card__image-wrapper" style="background-image: url('${product.images.default}')">
            </div>

            <div class="product-card__content">
                <div class="product-card__category">${product.category}</div>

                <h4 class="product-card__title">
                    ${product.name}
                </h4>

                <p class="product-card__description info-text">
                    ${product.description}
                </p>

                <div class="product-card__footer">
                    <span class="product-card__price">₹${product.basePrice}<small style="font-weight:lighter"> base price</small></span>

                    <button class="product-card__wishlist" aria-label="Add to wishlist">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        const wishBtn = card.querySelector('.product-card__wishlist');
        if (wishBtn) {
            const wishlisted = isWishlisted(product.id);
            wishBtn.classList.toggle('wishlisted', wishlisted);

            wishBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const now = toggleWishlist({
                    id: product.id,
                    name: product.name,
                    category: product.category,
                    price: product.basePrice,
                    image: product.images.default,
                });
                wishBtn.classList.toggle('wishlisted', now);
            });
        }

        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            window.location.href = `/product?id=${encodeURIComponent(product.id)}`;
        });

        grid.appendChild(card);
    });
}

export async function initProducts() {
    setupEventListeners();
    handleUrlParams();

    allProducts = await getProducts();

    applyFilters();
}
