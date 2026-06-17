/* ============================================================
   auth.js  —  Craftora localStorage auth helpers
   Primary identity: phone number (10-digit Indian mobile)
   ============================================================ */

const AUTH_KEY = 'craftora_user';

/* ══════════════════════════════════════════════════════════
   PASSWORD VALIDATION (reusable utility)
══════════════════════════════════════════════════════════ */

const PASSWORD_RULES = [
    { id: 'length',  label: 'Minimum 8 characters',          test: pw => pw.length >= 8 },
    { id: 'upper',   label: 'At least one uppercase letter',  test: pw => /[A-Z]/.test(pw) },
    { id: 'lower',   label: 'At least one lowercase letter',  test: pw => /[a-z]/.test(pw) },
    { id: 'number',  label: 'At least one number',            test: pw => /\d/.test(pw) },
    { id: 'special', label: 'At least one special character',  test: pw => /[^A-Za-z0-9]/.test(pw) },
];

/** Returns { valid: boolean, results: [{id, label, passed}] } */
function validatePassword(password) {
    const results = PASSWORD_RULES.map(rule => ({
        id: rule.id,
        label: rule.label,
        passed: rule.test(password),
    }));
    return { valid: results.every(r => r.passed), results };
}

/* ══════════════════════════════════════════════════════════
   PHONE VALIDATION
══════════════════════════════════════════════════════════ */

/** Normalizes phone: strips non-digits, takes last 10. */
function normalizePhone(raw) {
    return String(raw ?? '').replace(/\D/g, '').slice(-10);
}

/** Returns true if phone is a valid 10-digit Indian mobile (starts 6-9). */
function isValidPhone(phone) {
    const digits = normalizePhone(phone);
    return /^[6-9]\d{9}$/.test(digits);
}

/* ══════════════════════════════════════════════════════════
   USER CRUD
══════════════════════════════════════════════════════════ */

function getUser() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function getAccounts() {
    try {
        const raw = localStorage.getItem('craftora_accounts');
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveAccount(user) {
    const accounts = getAccounts();
    const idx = accounts.findIndex(a => a.phone === user.phone);
    if (idx >= 0) {
        accounts[idx] = user;
    } else {
        accounts.push(user);
    }
    localStorage.setItem('craftora_accounts', JSON.stringify(accounts));
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = './index.html';
}

/* ══════════════════════════════════════════════════════════
   LOGIN (by phone number)
══════════════════════════════════════════════════════════ */

function attemptLogin(phone, password) {
    const normalized = normalizePhone(phone);
    const accounts = getAccounts();
    const account = accounts.find(a => a.phone === normalized);

    if (!account) return { ok: false, error: 'No account found with this phone number.' };
    if (account.password !== password) return { ok: false, error: 'Incorrect password.' };

    const { password: _pw, ...session } = account;
    saveUser(session);
    return { ok: true };
}

/* ══════════════════════════════════════════════════════════
   SIGNUP
══════════════════════════════════════════════════════════ */

function attemptSignup({ name, phone, email, address, addressObj, password }) {
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

    // Auto-login
    const { password: _pw, ...session } = user;
    saveUser(session);
    return { ok: true };
}
