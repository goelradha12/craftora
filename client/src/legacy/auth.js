/* ============================================================
   auth.js  —  Craftora localStorage auth helpers
   Ported from client/scripts/auth.js, exported as ESM.
   Primary identity: phone number (10-digit Indian mobile)
   ============================================================ */

const AUTH_KEY = 'craftora_user';

const PASSWORD_RULES = [
    { id: 'length', label: 'Minimum 6 characters', test: pw => pw.length >= 6 },
];

/** Returns { valid: boolean, results: [{id, label, passed}] } */
export function validatePassword(password) {
    const results = PASSWORD_RULES.map(rule => ({
        id: rule.id,
        label: rule.label,
        passed: rule.test(password),
    }));
    return { valid: results.every(r => r.passed), results };
}

/** Normalizes phone: strips non-digits, takes last 10. */
export function normalizePhone(raw) {
    return String(raw ?? '').replace(/\D/g, '').slice(-10);
}

/** Returns true if phone is a valid 10-digit Indian mobile (starts 6-9). */
export function isValidPhone(phone) {
    const digits = normalizePhone(phone);
    return /^[6-9]\d{9}$/.test(digits);
}

export function getUser() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function saveUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function getAccounts() {
    try {
        const raw = localStorage.getItem('craftora_accounts');
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function saveAccount(user) {
    const accounts = getAccounts();
    const idx = accounts.findIndex(a => a.phone === user.phone);
    if (idx >= 0) {
        accounts[idx] = user;
    } else {
        accounts.push(user);
    }
    localStorage.setItem('craftora_accounts', JSON.stringify(accounts));
}

export function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = '/';
}

export function attemptLogin(phone, password) {
    const normalized = normalizePhone(phone);
    const accounts = getAccounts();
    const account = accounts.find(a => a.phone === normalized);

    if (!account) return { ok: false, error: 'No account found with this phone number.' };
    if (account.password !== password) return { ok: false, error: 'Incorrect password.' };

    const { password: _pw, ...session } = account;
    saveUser(session);
    return { ok: true };
}

export function attemptSignup({ name, phone, email, address, addressObj, password }) {
    const normalized = normalizePhone(phone);
    const accounts = getAccounts();

    if (accounts.find(a => a.phone === normalized)) {
        return { ok: false, error: 'An account with this phone number already exists.' };
    }

    const user = {
        name,
        phone: normalized,
        email: email || '',
        address,
        addressObj,
        password,
        joinedAt: new Date().toISOString(),
    };
    saveAccount(user);

    const { password: _pw, ...session } = user;
    saveUser(session);
    return { ok: true };
}
