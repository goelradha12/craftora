const homeShopBtn = document.querySelector('.hero--btn');


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

function bindHeroButton() {
    if (!homeShopBtn) return;
    homeShopBtn.addEventListener('click', () => {
        window.location.href = './products.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    bindHeroButton();
    initHowItWorks();
    initReviewsCarousel();
    initFeaturedProducts();
    initHeroSearch();
});

/* ══════════════════════════════════════════════════════════
   HOW IT WORKS — Interactive Tabs
══════════════════════════════════════════════════════════ */
function initHowItWorks() {
    const steps = document.querySelectorAll('.hiw-step');
    const mainImg = document.getElementById('hiw-active-img');
    const dots = document.querySelectorAll('.hiw-dot');
    if (!steps.length || !mainImg) return;

    steps.forEach((step, index) => {
        step.addEventListener('click', () => {
            // Remove active classes
            steps.forEach(s => {
                s.classList.remove('hiw-step--active');
                s.setAttribute('aria-selected', 'false');
            });
            dots.forEach(d => d.classList.remove('hiw-dot--active'));

            // Set current active
            step.classList.add('hiw-step--active');
            step.setAttribute('aria-selected', 'true');
            if (dots[index]) dots[index].classList.add('hiw-dot--active');

            // Crossfade image
            const newSrc = step.getAttribute('data-img');
            const newAlt = step.getAttribute('data-img-alt');

            mainImg.classList.add('hiw-img--fade');

            setTimeout(() => {
                mainImg.src = newSrc;
                mainImg.alt = newAlt;
                mainImg.classList.remove('hiw-img--fade');
            }, 150); // Matches half of CSS transition time
        });
    });
}

/* ══════════════════════════════════════════════════════════
   REVIEWS CAROUSEL
══════════════════════════════════════════════════════════ */
const mockReviews = [
    {
        name: "Sarah Jenkins",
        location: "London, UK",
        text: "The print quality on my custom diary exceeded all expectations. Crisp colors, premium paper, and it arrived three days early!",
        rating: 5,
        avatar: "SJ",
        color: "#10B981"
    },
    {
        name: "Marcus Chen",
        location: "Toronto, CA",
        text: "I've ordered team t-shirts from three different companies before finding Craftora. These are by far the softest shirts and the most durable prints.",
        rating: 5,
        avatar: "MC",
        color: "#3B82F6"
    },
    {
        name: "Elena Rodriguez",
        location: "Madrid, ES",
        text: "The design studio was so easy to use on my phone. I created a custom coffee cup for my mom's birthday while riding the train.",
        rating: 5,
        avatar: "ER",
        color: "#8B5CF6"
    },
    {
        name: "David Smith",
        location: "Sydney, AU",
        text: "Excellent customer service. When my first design was slightly off-center, they caught it before printing and helped me fix it.",
        rating: 4,
        avatar: "DS",
        color: "#F59E0B"
    },
    {
        name: "Aisha Patel",
        location: "New York, USA",
        text: "Beautiful water bottles! The matte finish feels incredibly premium. I'm definitely ordering more for my bridesmaids.",
        rating: 5,
        avatar: "AP",
        color: "#EC4899"
    }
];

function initReviewsCarousel() {
    const track = document.getElementById('reviewsTrack');
    const dotsContainer = document.getElementById('reviewsDots');

    if (!track) return;

    // Render reviews
    track.innerHTML = mockReviews.map(r => `
        <div class="review" role="group" aria-roledescription="slide">
            <div class="review__stars" aria-label="Rating: ${r.rating} out of 5 stars">
                ${'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'.repeat(r.rating)}
            </div>
            <p class="review__text info-text">"${escapeHTML(r.text)}"</p>
            <div class="review__author-row">
                <div class="review__avatar" style="background-color: ${r.color}" aria-hidden="true">${r.avatar}</div>
                <div>
                    <div class="review__name">${escapeHTML(r.name)}</div>
                    <div class="review__location">${escapeHTML(r.location)}</div>
                </div>
            </div>
        </div>
    `).join('');

    let currentIndex = 0;
    const cards = track.querySelectorAll('.review');
    const totalCards = cards.length;

    // Calculate visible cards based on screen width
    function getVisibleCards() {
        if (window.innerWidth <= 600) return 1;
        if (window.innerWidth <= 960) return 2;
        return 3;
    }

    // Render pagination dots
    function updateDots() {
        const visible = getVisibleCards();
        const numDots = Math.max(1, totalCards - visible + 1);

        dotsContainer.innerHTML = Array.from({ length: numDots }).map((_, i) => `
            <button class="reviews-nav__dot ${i === currentIndex ? 'reviews-nav__dot--active' : ''}"
                    aria-label="Go to slide ${i + 1}"
                    data-index="${i}">
            </button>
        `).join('');

        // Bind dot clicks
        dotsContainer.querySelectorAll('.reviews-nav__dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                currentIndex = parseInt(e.target.getAttribute('data-index'));
                updateCarousel();
            });
        });
    }

    function updateCarousel() {
        const visible = getVisibleCards();
        const maxIndex = Math.max(0, totalCards - visible);

        // Clamp index
        currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));

        // Calculate offset (card width + gap)
        if (totalCards > 0) {
            const cardWidth = cards[0].offsetWidth;
            // Gap is 24px (var(--space-6))
            const gap = 24;
            const offset = currentIndex * (cardWidth + gap);
            track.style.transform = `translateX(-${offset}px)`;
        }

        // Update active dot
        const allDots = dotsContainer.querySelectorAll('.reviews-nav__dot');
        allDots.forEach((dot, i) => {
            dot.classList.toggle('reviews-nav__dot--active', i === currentIndex);
        });
    }

    // Handle resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateDots();
            updateCarousel();
        }, 100);
    });

    // Handle touch/swipe for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    // Initialize
    updateDots();
    updateCarousel();
}


/* ══════════════════════════════════════════════════════════
   FEATURED PRODUCTS
══════════════════════════════════════════════════════════ */
async function initFeaturedProducts() {
    const track = document.getElementById('featuredTrack');
    const dotsContainer = document.getElementById('featuredDots');
    const emptyState = document.getElementById('featuredEmptyState');

    if (!track || !dotsContainer || !emptyState) return;

    try {
        const response = await fetch('./content/products.json');
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        // Filter only featured products
        const featuredProducts = (data.products || []).filter(p => p.featured === true);

        if (featuredProducts.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        // Render Cards
        track.innerHTML = featuredProducts.map(product => {
            const priceStr = product.basePrice ? money(product.basePrice) : 'Price unavailable';
            const imgUrl = (product.images && product.images.default) ? product.images.default : './assets/placeholder.webp';
            const badgeHtml = product.badges && product.badges.length > 0
                ? `<span class="product-card__badge">${escapeHTML(product.badges[0])}</span>`
                : '';

            return `
                <div class="product-card" role="group" aria-roledescription="slide">
                    ${badgeHtml}
                    <div class="product-card__image-wrapper" style="background-image: url('${imgUrl}')"></div>
                    <div class="product-card__content">
                        <div class="product-card__category">${escapeHTML(product.category || 'Product')}</div>
                        <h3 class="product-card__title">${escapeHTML(product.name || 'Unnamed')}</h3>
                        <p class="info-text">${escapeHTML(product.description || 'No description available.')}</p>
                    </div>
                    <div class="product-card__footer">
                        <div class="product-card__price">${priceStr}</div>
                        <div class="product-card__actions">
                            <a href="./product.html?id=${product.id}" class="shop-btn">
                                Customize Now
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Carousel Logic
        let currentIndex = 0;
        const cards = track.querySelectorAll('.product-card');
        const totalCards = cards.length;

        function getVisibleCards() {
            if (window.innerWidth <= 600) return 1;
            if (window.innerWidth <= 960) return 2;
            return 3;
        }

        function updateDots() {
            const visible = getVisibleCards();
            const numDots = Math.max(1, totalCards - visible + 1);

            dotsContainer.innerHTML = Array.from({ length: numDots }).map((_, i) => `
                <button class="dot ${i === currentIndex ? 'dot--active' : ''}"
                        aria-label="Go to slide ${i + 1}"
                        data-index="${i}">
                </button>
            `).join('');

            dotsContainer.querySelectorAll('.dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    currentIndex = parseInt(e.target.getAttribute('data-index'));
                    updateCarousel();
                });
            });
        }

        function updateCarousel() {
            const visible = getVisibleCards();
            const maxIndex = Math.max(0, totalCards - visible);

            currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));

            if (totalCards > 0) {
                const cardWidth = cards[0].offsetWidth;
                const gap = 24; // var(--space-6)
                const offset = currentIndex * (cardWidth + gap);
                track.style.transform = `translateX(-${offset}px)`;
            }

            const allDots = dotsContainer.querySelectorAll('.dot');
            allDots.forEach((dot, i) => {
                dot.classList.toggle('dot--active', i === currentIndex);
            });
        }

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                updateDots();
                updateCarousel();
            }, 100);
        });

        // Touch Swipe Support
        let touchStartX = 0;
        let touchEndX = 0;

        track.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        track.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const threshold = 50;
            if (touchEndX < touchStartX - threshold) {
                // Swipe left (next)
                currentIndex++;
                updateCarousel();
            } else if (touchEndX > touchStartX + threshold) {
                // Swipe right (prev)
                currentIndex--;
                updateCarousel();
            }
        }

        updateDots();
        updateCarousel();

    } catch (error) {
        console.error('Error loading featured products:', error);
        emptyState.textContent = 'Unable to load products. Please try again later.';
        emptyState.style.display = 'block';
    }
}

/* ══════════════════════════════════════════════════════════
   HERO LIVE SEARCH DROPDOWN
══════════════════════════════════════════════════════════ */
async function initHeroSearch() {
    const input = document.getElementById('homeSearchInput');
    const btn = document.getElementById('homeSearchBtn');
    const dropdown = document.getElementById('homeSearchDropdown');
    if (!input || !dropdown) return;

    let products = [];
    let activeIndex = -1;

    try {
        const response = await fetch('./content/products.json');
        if (response.ok) {
            const data = await response.json();
            products = data.products || [];
        }
    } catch (e) {
        console.error('Error fetching products for search:', e);
    }

    function renderDropdown(query) {
        if (!query) {
            dropdown.style.display = 'none';
            return;
        }

        const filtered = products.filter(p => p.name && p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

        dropdown.innerHTML = '';
        activeIndex = -1;

        if (filtered.length === 0) {
            dropdown.innerHTML = '<div class="search-dropdown-empty">No matching products found.</div>';
        } else {
            filtered.forEach((p, index) => {
                const item = document.createElement('a');
                item.href = `./product.html?id=${p.id}`;
                item.className = 'search-dropdown-item';
                item.dataset.index = index;
                
                const priceStr = p.basePrice ? money(p.basePrice) : '';
                const imgUrl = (p.images && p.images.default) ? p.images.default : './assets/placeholder.webp';

                item.innerHTML = `
                    <img src="${imgUrl}" alt="" class="search-dropdown-img">
                    <div class="search-dropdown-info">
                        <span class="search-dropdown-name">${escapeHTML(p.name)}</span>
                        ${priceStr ? `<span class="search-dropdown-price">Starting at ${priceStr}</span>` : ''}
                    </div>
                `;
                
                // Keep the dropdown open when clicking an item (the link handles navigation)
                dropdown.appendChild(item);
            });
        }
        dropdown.style.display = 'block';
    }

    input.addEventListener('input', (e) => {
        renderDropdown(e.target.value.trim());
    });

    input.addEventListener('focus', (e) => {
        if (e.target.value.trim()) {
            renderDropdown(e.target.value.trim());
        }
    });

    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.search-dropdown-item');
        if (!items.length && e.key !== 'Escape') return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            updateActiveItem(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            updateActiveItem(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < items.length) {
                window.location.href = items[activeIndex].href;
            } else if (items.length > 0) {
                window.location.href = items[0].href;
            }
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
            input.blur();
        }
    });

    function updateActiveItem(items) {
        items.forEach((item, idx) => {
            if (idx === activeIndex) {
                item.classList.add('search-dropdown-item--active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('search-dropdown-item--active');
            }
        });
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Optional: Search button submits the top result if available
    if (btn) {
        btn.addEventListener('click', () => {
            const items = dropdown.querySelectorAll('.search-dropdown-item');
            if (items.length > 0) {
                window.location.href = items[0].href;
            }
        });
    }
}
