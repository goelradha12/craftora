const CRAFTORA_TOAST_DURATION = 4200;
const CRAFTORA_ORDERS_KEY = 'craftora_orders';
const craftoraToastState = new Map();

function ensureToastContainer() {
    let container = document.getElementById('toastRegion');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'toastRegion';
    container.className = 'toast-region';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
    return container;
}

function dismissToast(toastId) {
    const entry = craftoraToastState.get(toastId);
    if (!entry) return;

    clearTimeout(entry.timeoutId);
    entry.node.classList.add('is-leaving');
    window.setTimeout(() => {
        entry.node.remove();
    }, 220);
    craftoraToastState.delete(toastId);
}

function showToast({
    id,
    message,
    title = '',
    variant = 'info',
    duration = CRAFTORA_TOAST_DURATION
}) {
    if (!message) return null;

    const toastId = id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const container = ensureToastContainer();
    const existing = craftoraToastState.get(toastId);

    if (existing) {
        clearTimeout(existing.timeoutId);
        existing.node.querySelector('.toast__title').textContent = title || variant[0].toUpperCase() + variant.slice(1);
        existing.node.querySelector('.toast__message').textContent = message;
        existing.node.dataset.variant = variant;
        existing.node.classList.remove('is-leaving');
        existing.timeoutId = window.setTimeout(() => dismissToast(toastId), duration);
        craftoraToastState.set(toastId, existing);
        return toastId;
    }

    const toast = document.createElement('section');
    toast.className = 'toast';
    toast.dataset.variant = variant;
    toast.setAttribute('role', variant === 'error' || variant === 'warning' ? 'alert' : 'status');
    toast.innerHTML = `
        <div class="toast__body">
            <p class="toast__title">${title || variant[0].toUpperCase() + variant.slice(1)}</p>
            <p class="toast__message">${message}</p>
        </div>
        <button class="toast__close" type="button" aria-label="Dismiss notification">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    toast.querySelector('.toast__close').addEventListener('click', () => dismissToast(toastId));
    container.appendChild(toast);

    const timeoutId = window.setTimeout(() => dismissToast(toastId), duration);
    craftoraToastState.set(toastId, { node: toast, timeoutId });
    return toastId;
}

function normalizePhoneInput(value) {
    return String(value ?? '').replace(/\D/g, '').slice(0, 10);
}

function validatePhoneNumber(value) {
    const raw = String(value ?? '').trim();
    const digits = normalizePhoneInput(raw);

    if (!raw) {
        return { valid: false, error: 'Phone number is required.', digits };
    }

    if (!/^\d+$/.test(raw)) {
        return { valid: false, error: 'Phone number must contain digits only.', digits };
    }

    if (digits.length !== 10) {
        return { valid: false, error: 'Phone number must be exactly 10 digits.', digits };
    }

    return { valid: true, error: '', digits };
}

function bindPhoneInput(input) {
    if (!input) return;
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('maxlength', '10');
    input.addEventListener('input', () => {
        const digits = normalizePhoneInput(input.value);
        if (input.value !== digits) input.value = digits;
    });
}

function getStoredOrders() {
    try {
        const raw = localStorage.getItem(CRAFTORA_ORDERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveStoredOrders(orders) {
    localStorage.setItem(CRAFTORA_ORDERS_KEY, JSON.stringify(orders));
}

function addOrder(order) {
    const orders = getStoredOrders();
    orders.unshift(order);
    saveStoredOrders(orders);
    return order;
}

function getOrdersForUser(email) {
    if (!email) return [];
    return getStoredOrders().filter(order => order.customer?.email === email);
}

window.CraftoraUI = {
    addOrder,
    bindPhoneInput,
    dismissToast,
    getOrdersForUser,
    getStoredOrders,
    normalizePhoneInput,
    showToast,
    validatePhoneNumber
};
