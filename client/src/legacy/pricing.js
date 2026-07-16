/* ============================================================
   pricing.js — Craftora Centralized Pricing (ported from
   client/scripts/pricing.js almost verbatim, exported as ESM)
   ============================================================ */

export const DESIGN_FEES = {
    Tshirt: 199,
    Diary: 149,
    Bottle: 149,
    Cup: 99
};

export function getDesignFee(category) {
    return DESIGN_FEES[category] || 0;
}

export function calculateItemPrice(basePrice, category, designRequired) {
    return basePrice + (designRequired ? getDesignFee(category) : 0);
}
