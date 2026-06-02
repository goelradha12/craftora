/* ============================================================
   wishlist.js  —  Craftora wishlist functionality
   
   Wishlist item shape stored in localStorage ('craftora_wishlist'):
   [{ id, name, category, price, image }]
   ============================================================ */

const WISHLIST_KEY = 'craftora_wishlist';

/* ── Helpers ── */

function getWishlist() {
    try {
        return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    } catch { return []; }
}

function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

/** Add a product to the wishlist. No-op if already present. */
function addToWishlist(item) {
    const list = getWishlist();
    if (!list.find(i => i.id === item.id)) {
        list.push(item);
        saveWishlist(list);
    }
}

/** Remove a product from the wishlist by id. */
function removeFromWishlist(id) {
    saveWishlist(getWishlist().filter(i => i.id !== id));
}

/** Toggle: add if absent, remove if present. Returns true if now in wishlist. */
function toggleWishlist(item) {
    const list = getWishlist();
    const idx  = list.findIndex(i => i.id === item.id);
    if (idx >= 0) {
        list.splice(idx, 1);
        saveWishlist(list);
        return false;
    } else {
        list.push(item);
        saveWishlist(list);
        return true;
    }
}

/** Returns true if the product id is in the wishlist. */
function isWishlisted(id) {
    return getWishlist().some(i => i.id === id);
}

/* ── Escape HTML ── */
function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]
    );
}

/* ══════════════════════════════════════════════════════════
   Wishlist PAGE renderer  (only runs on wishlist.html)
══════════════════════════════════════════════════════════ */

function renderWishlistPage() {
    const grid       = document.getElementById('wishlistGrid');
    const countEl    = document.getElementById('wishlistCount');
    const clearBtn   = document.getElementById('clearAllBtn');
    if (!grid) return; // not on the wishlist page

    const user = (() => {
        try { return JSON.parse(localStorage.getItem('craftora_user') || 'null'); } catch { return null; }
    })();

    if (!user) {
        document.getElementById('guestState').hidden  = false;
        document.getElementById('wishlistState').hidden = true;
        return;
    }

    document.getElementById('guestState').hidden  = true;
    document.getElementById('wishlistState').hidden = false;

    function render() {
        const list = getWishlist();
        countEl.textContent = list.length ? `(${list.length})` : '';
        clearBtn.style.display = list.length ? '' : 'none';

        if (list.length === 0) {
            grid.innerHTML = `
                <div class="wishlist-empty">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <h2>Your wishlist is empty</h2>
                    <p>Browse our products and save your favourites here.</p>
                    <a href="./products.html" class="btn-primary">Browse Products</a>
                </div>`;
            return;
        }

        grid.innerHTML = list.map(item => `
            <div class="wishlist-card" data-id="${esc(item.id)}">
                <img class="wishlist-card__img"
                     src="${esc(item.image)}"
                     alt="${esc(item.name)}"
                     onerror="this.src='./assets/products (3).png'">

                <button class="wishlist-card__remove"
                        data-id="${esc(item.id)}"
                        aria-label="Remove ${esc(item.name)} from wishlist">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6"  y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                <div class="wishlist-card__body">
                    <span class="wishlist-card__category">${esc(item.category)}</span>
                    <p class="wishlist-card__name">${esc(item.name)}</p>
                    <p class="wishlist-card__price">₹${Number(item.price).toLocaleString('en-IN')}</p>
                    <div class="wishlist-card__actions">
                        <a href="./product.html?id=${esc(item.id)}"
                           class="wishlist-card__btn-customize">Customize</a>
                    </div>
                </div>
            </div>
        `).join('');

        // Wire remove buttons
        grid.querySelectorAll('.wishlist-card__remove').forEach(btn => {
            btn.addEventListener('click', () => {
                removeFromWishlist(btn.dataset.id);
                render();
            });
        });
    }

    // Clear all
    clearBtn.addEventListener('click', () => {
        if (confirm('Remove all items from your wishlist?')) {
            saveWishlist([]);
            render();
        }
    });

    render();

    // Re-render if wishlist changes in another tab
    window.addEventListener('storage', (e) => {
        if (e.key === WISHLIST_KEY) render();
    });
}

/* ── Run on page load ── */
document.addEventListener('DOMContentLoaded', renderWishlistPage);
