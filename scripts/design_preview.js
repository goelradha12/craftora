/**
 * design-preview.js — Craftora Design Preview
 *
 * Reads the saved design snapshot from localStorage and shows it in a modal.
 *
 * Usage:
 *   <script src="./design-preview.js"></script>
 *
 *   // Show preview for a specific product
 *   DesignPreview.show(productId);
 *
 *   // Or auto-detect from URL param ?id=123
 *   DesignPreview.showFromUrl();
 *
 *   // Check if a saved design exists before showing a button
 *   DesignPreview.exists(productId); // returns true/false
 */

const DesignPreview = (() => {

  // ── Inject styles once ──────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('dp-styles')) return;
    const style = document.createElement('style');
    style.id = 'dp-styles';
    style.textContent = `
      #dp-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(13, 13, 13, 0.55);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99000;
        padding: 20px;
        opacity: 0;
        transition: opacity 200ms ease;
      }
      #dp-backdrop.dp-visible {
        opacity: 1;
      }
      #dp-card {
        background: #ffffff;
        border-radius: 20px;
        border: 1px solid #e2e1dc;
        width: min(460px, 100%);
        overflow: hidden;
        transform: scale(0.94) translateY(10px);
        transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: 'Inter', sans-serif;
      }
      #dp-backdrop.dp-visible #dp-card {
        transform: scale(1) translateY(0);
      }
      #dp-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px 14px;
        border-bottom: 1px solid #e2e1dc;
      }
      #dp-header-left {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      #dp-title {
        font-size: 14px;
        font-weight: 700;
        color: #0d0d0d;
        letter-spacing: -0.01em;
      }
      #dp-subtitle {
        font-size: 11px;
        color: #737373;
      }
      #dp-close {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 1px solid #e2e1dc;
        background: #f5f5f3;
        color: #737373;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 160ms ease, color 160ms ease;
      }
      #dp-close:hover {
        background: #0d0d0d;
        color: #ffffff;
        border-color: #0d0d0d;
      }
      #dp-image-wrap {
        background: #f5f5f3;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 28px 40px;
      }
      #dp-image {
        width: 100%;
        max-width: 260px;
        height: auto;
        display: block;
        border-radius: 6px;
      }
      #dp-no-preview {
        text-align: center;
        color: #b0b0b0;
        font-size: 12px;
        line-height: 1.6;
      }
      #dp-no-preview .dp-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      #dp-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 18px;
        border-top: 1px solid #e2e1dc;
        gap: 8px;
      }
      #dp-meta {
        font-size: 11px;
        color: #b0b0b0;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Build modal DOM ──────────────────────────────────────────────────────────
  function buildModal() {
    if (document.getElementById('dp-backdrop')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'dp-backdrop';
    backdrop.innerHTML = `
      <div id="dp-card">
        <div id="dp-header">
          <div id="dp-header-left">
            <span id="dp-title">Your Saved Design</span>
            <span id="dp-subtitle">—</span>
          </div>
          <button id="dp-close" aria-label="Close preview">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div id="dp-image-wrap">
          <div id="dp-no-preview">
            <div class="dp-icon">🎨</div>
            No preview available
          </div>
          <img id="dp-image" alt="Design preview" style="display:none;" />
        </div>
        <div id="dp-footer">
          <span id="dp-meta"></span>
          <div style="display:flex;gap:6px;">
            <button class="dp-btn dp-btn-accent" id="dp-customize-btn" style="display:none;">Customize again</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) close();
    });

    // Close button
    document.getElementById('dp-close').addEventListener('click', close);

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && backdrop.classList.contains('dp-visible')) close();
    });
  }

  // ── Open / close ─────────────────────────────────────────────────────────────
  function open() {
    const backdrop = document.getElementById('dp-backdrop');
    if (!backdrop) return;
    document.body.style.overflow = 'hidden';
    backdrop.style.display = 'flex';
    // trigger transition on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => backdrop.classList.add('dp-visible'));
    });
  }

  function close() {
    const backdrop = document.getElementById('dp-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('dp-visible');
    document.body.style.overflow = '';
    setTimeout(() => { backdrop.style.display = 'none'; }, 220);
  }

  // ── Populate modal with data ──────────────────────────────────────────────────
  function populate(data, productId) {
    const img = document.getElementById('dp-image');
    const noPreview = document.getElementById('dp-no-preview');
    const subtitle = document.getElementById('dp-subtitle');
    const meta = document.getElementById('dp-meta');
    const customizeBtn = document.getElementById('dp-customize-btn');

    // Subtitle: product name + category
    const parts = [];
    if (data.productName) parts.push(data.productName);
    if (data.productCategory) parts.push(data.productCategory.charAt(0).toUpperCase() + data.productCategory.slice(1));
    subtitle.textContent = parts.join(' · ') || 'Custom design';

    // Saved date
    if (data.generatedAt) {
      const d = new Date(data.generatedAt);
      meta.textContent = `Saved ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      meta.textContent = '';
    }

    // Preview image
    if (data.previewImage) {
      img.src = data.previewImage;
      img.style.display = 'block';
      noPreview.style.display = 'none';
    } else {
      img.style.display = 'none';
      img.src = '';
      noPreview.style.display = 'block';
    }

    // Edit button — links to customize.html
    const customizeUrl = `./customize.html${productId ? `?id=${productId}` : ''}`;

    // If no preview image, show a "Customize" button as CTA
    if (!data.previewImage) {
      customizeBtn.style.display = 'inline-flex';
      customizeBtn.onclick = () => { window.location.href = customizeUrl; };
    } else {
      customizeBtn.style.display = 'none';
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  /**
   * Show the design preview for a given product ID.
   * @param {string|number} productId
   */
  function show(productId) {
    injectStyles();
    buildModal();

    const key = productId ? `designData_${productId}` : 'designData';
    const raw = localStorage.getItem(key);

    if (!raw) {
      console.warn(`DesignPreview: no saved design found for key "${key}"`);
      return false;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error('DesignPreview: could not parse saved design data', e);
      return false;
    }

    populate(data, productId);
    open();
    return true;
  }

  function showCartCustomization(cartItemKey) {
    injectStyles();
    buildModal();

    let cart;

    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (e) {
      console.error('Could not parse cart', e);
      return false;
    }

    const item = cart.find(i => i.key === cartItemKey);

    if (!item) {
      console.warn(`Cart item not found: ${cartItemKey}`);
      return false;
    }

    if (!item.customization) {
      console.warn('Cart item has no customization');
      return false;
    }

    const customization = item.customization;

    populate({
      productName: item.name,
      productCategory: item.category,
      generatedAt: customization.generatedAt,
      previewImage: customization.previewImage
    }, item.id);

    open();

    return true;
  }
  /**
   * Auto-detect product ID from ?id= URL param and show preview.
   */
  function showFromUrl() {
    const id = new URLSearchParams(window.location.search).get('id');
    return show(id);
  }

  /**
   * Returns true if a saved design exists for the given product ID.
   * Useful for conditionally showing a "View design" button.
   * @param {string|number} productId
   */
  function exists(productId) {
    const key = productId ? `designData_${productId}` : 'designData';
    return !!localStorage.getItem(key);
  }

  /**
   * Returns the raw saved design data object (or null if not found).
   * @param {string|number} productId
   */
  function getData(productId) {
    const key = productId ? `designData_${productId}` : 'designData';
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  return { show, showFromUrl, exists, getData, close, showCartCustomization };

})();