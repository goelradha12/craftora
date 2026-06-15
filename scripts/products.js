let allProducts = [];
let currentCategory = 'All Category';

/**
 * Fetches products from the local JSON file.
 * Expected JSON structure: { "products": [ { "name": "...", "category": "...", "description": "...", "price": 49.00, "isNew": true, "image": "..." } ] }
 */
function getProducts() {
    const products = fetch("content/products.json")
        .then(response => response.json())
        .then(data => data.products)
        .catch(error => {
            console.error("Error fetching products:", error);
            return [];
        });

    return products.then(data => data);
}

/**
 * Reads URL parameters to set the initial category if ?category=something is present.
 */
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');

    if (categoryParam) {
        currentCategory = categoryParam;

        // Update the active class on the buttons based on the URL parameter
        const categoryBtns = document.querySelectorAll('.category-btn');
        let matched = false;

        categoryBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.trim().toLowerCase() === categoryParam.toLowerCase()) {
                btn.classList.add('active');
                matched = true;
            }
        });

        // Fallback to 'All Category' if the URL param doesn't match any button
        if (!matched) {
            document.querySelector('.category-btn').classList.add('active');
            currentCategory = 'All Category';
        }

        applyFilters();
    }
}

/**
 * Attaches event listeners to the search input and category buttons.
 */
function setupEventListeners() {
    const categoryBtns = document.querySelectorAll('.category-btn');

    // Listen for clicks on category buttons
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update UI
            categoryBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Update state and filter
            currentCategory = e.target.textContent.trim();
            applyFilters();
        });
    });
}

/**
 * Filters the stored products based on category and search query, then triggers a re-render.
 */
function applyFilters() {
    let filteredProducts = allProducts;

    // 1. Filter by Category
    if (currentCategory !== 'All Category') {
        filteredProducts = filteredProducts.filter(product =>
            product.category.toLowerCase() === currentCategory.toLowerCase()
        );
    }

    renderProducts(filteredProducts);
}

/**
 * Generates the HTML for the product cards and injects it into the grid.
 */
function renderProducts(productsToRender) {
    const grid = document.getElementById('productGrid');
    
    if (!grid) return;

    grid.innerHTML = ''; // Clear current products

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
                    <span class="product-card__price">₹${product.basePrice}</span>

                    <div class="product-card__actions">
                        <button class="product-card__button" onclick="window.location.href='product.html?id=${product.id}'">
                            <span>Customize</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                <path d="M18 2l.5 1.5L20 4l-1.5.5L18 6l-.5-1.5L16 4l1.5-.5Z" />
                                <path d="M5 3l.4 1.1L6.5 4.5l-1.1.4L5 6l-.4-1.1L3.5 4.5l1.1-.4Z" />
                            </svg>
                        </button>
                        <button class="product-card__wishlist" aria-label="Add to wishlist">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Wire wishlist button
        const wishBtn = card.querySelector('.product-card__wishlist');
        if (wishBtn) {
            // Set initial filled/unfilled state
            const wishlisted = typeof isWishlisted === 'function' && isWishlisted(product.id);
            wishBtn.classList.toggle('wishlisted', wishlisted);

            wishBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof toggleWishlist !== 'function') {
                    window.location.href = './login.html';
                    return;
                }
                // Check login
                const user = (() => {
                    try { return JSON.parse(localStorage.getItem('craftora_user') || 'null'); } catch { return null; }
                })();
                if (!user) {
                    alert('You must be signed in to add items to your wishlist.');
                    window.location.href = './login.html';
                    return;
                }
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

        grid.appendChild(card);
    });
}

/**
 * Initializes the script when the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Setup events and check URL params first
    setupEventListeners();
    handleUrlParams();

    // 2. Fetch the data
    allProducts = await getProducts();

    // 3. Render items (applies any initial URL filters automatically)
    applyFilters();
});