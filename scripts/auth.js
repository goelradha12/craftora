/* ============================================================
   auth.js  —  Craftora localStorage auth helpers
   ============================================================ */

const AUTH_KEY = 'craftora_user';

/**
 * Returns the current user object or null.
 * Shape: { name, email, phone, address, password }
 */
function getUser() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/** Persists a user object to localStorage. */
function saveUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

/** Returns all registered accounts (array). */
function getAccounts() {
    try {
        const raw = localStorage.getItem('craftora_accounts');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** Adds or updates an account in the accounts store. */
function saveAccount(user) {
    const accounts = getAccounts();
    const idx = accounts.findIndex(a => a.email === user.email);
    if (idx >= 0) {
        accounts[idx] = user;
    } else {
        accounts.push(user);
    }
    localStorage.setItem('craftora_accounts', JSON.stringify(accounts));
}

/** Clears the active session and redirects to home. */
function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = './index.html';
}

/**
 * Attempts login. Returns { ok: true } or { ok: false, error: string }.
 */
function attemptLogin(email, password) {
    const accounts = getAccounts();
    const account  = accounts.find(a => a.email === email);

    if (!account)              return { ok: false, error: 'No account found with that email.' };
    if (account.password !== password) return { ok: false, error: 'Incorrect password.' };

    // Save active session (omit password for safety)
    const { password: _pw, ...session } = account;
    saveUser(session);
    return { ok: true };
}

/**
 * Registers a new account. Returns { ok: true } or { ok: false, error: string }.
 */
function attemptSignup({ name, email, phone, address, password }) {
    const accounts = getAccounts();
    if (accounts.find(a => a.email === email)) {
        return { ok: false, error: 'An account with this email already exists.' };
    }
    const user = { name, email, phone, address, password, joinedAt: new Date().toISOString() };
    saveAccount(user);

    // Auto-login
    const { password: _pw, ...session } = user;
    saveUser(session);
    return { ok: true };
}
