/* ============================================================
   pricing.js — Craftora Centralized Pricing
   ============================================================ */

/**
 * Design fees by product category.
 * Update values here — they propagate to product page, cart, and orders.
 */
const DESIGN_FEES = {
    Tshirt: 199,
    Diary: 149,
    Bottle: 149,
    Cup: 99
};

function getDesignFee(category) {
    return DESIGN_FEES[category] || 0;
}

function calculateItemPrice(basePrice, category, designRequired) {
    return basePrice + (designRequired ? getDesignFee(category) : 0);
}
