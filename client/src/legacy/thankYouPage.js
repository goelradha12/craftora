/* ============================================================
   thankYouPage.js — Craftora Thank You Page
   Ported from src/pages/fragments/thank-you.inline.js (originally
   the inline <script> in client/thank-you.html), exported as ESM.
   ============================================================ */

export function initThankYouPage() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId') || localStorage.getItem('lastOrderId') || 'N/A';
    const el = document.getElementById('orderIdText');
    if (el) el.textContent = '#' + orderId;
}
