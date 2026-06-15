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
});
