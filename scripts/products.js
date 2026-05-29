// Global variables to store the state
let allProducts = [];
let currentCategory = 'All Category';
let searchQuery = '';

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
    const searchInput = document.getElementById('searchInput');
    const categoryBtns = document.querySelectorAll('.category-btn');

    // Listen for typing in the search bar
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        applyFilters();
    });

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

    // 2. Filter by Search Query
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchQuery) ||
            product.description.toLowerCase().includes(searchQuery) ||
            product.category.toLowerCase().includes(searchQuery)
        );
    }

    renderProducts(filteredProducts);
}

/**
 * Generates the HTML for the product cards and injects it into the grid.
 */
function renderProducts(productsToRender) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = ''; // Clear current products

    if (productsToRender.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No products found matching your criteria.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        // Check if product is marked as new in the JSON
        const badgeHTML = product.isNew ? `<div class="product-card__badge">New Arrival</div>` : '';

        card.innerHTML = `
            <div class="product-card__badge">${product.badges[0]}</div>
            <div class="product-card__image-wrapper" style="background-image: url('${product.images.default}')">
            </div>

            <div class="product-card__content">
                <div class="product-card__category">${product.category}</div>
                
                <h4 class="product-card__title">
                    ${product.name}
                </h4>
                
                <p class="product-card__description">
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
                        <button class="product-card__wishlist">
                            <svg height="20px" width="20px" viewBox="0 0 13.066 13.066" xml:space="preserve">
                                <path style="fill:#030104;" d="M6.555,12.558c-0.098,0-0.195-0.034-0.273-0.103c-0.233-0.2-5.718-4.954-6.199-7.885 C-0.133,3.243,0.071,2.201,0.69,1.474C1.22,0.85,2.034,0.507,2.982,0.507c0.082,0,0.165,0.002,0.247,0.008 c0.058-0.003,0.115-0.004,0.172-0.004c1.048,0,2.343,0.461,3.109,2.421c0.43-1.196,1.311-2.417,3.328-2.417 c1.135,0,2.023,0.342,2.571,0.987c0.597,0.701,0.787,1.733,0.569,3.068c-0.479,2.929-5.918,7.684-6.149,7.884 C6.751,12.524,6.653,12.558,6.555,12.558z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
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