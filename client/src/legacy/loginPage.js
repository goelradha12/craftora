/* ============================================================
   loginPage.js — Craftora Login Page
   Ported from src/pages/fragments/login.inline.js (originally the
   inline <script> in client/login.html), exported as ESM.
   ============================================================ */

import { isValidPhone, attemptLogin } from './auth.js';

export function initLoginPage() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || '/';

    const signupLink = document.querySelector('a[href="/signup"]');
    if (signupLink && params.get('redirect')) {
        signupLink.href = `/signup?redirect=${encodeURIComponent(params.get('redirect'))}`;
    }

    const toggleBtn = document.getElementById('togglePassword');
    const onToggle = () => {
        const input = document.getElementById('password');
        const icon = document.getElementById('eyeIcon');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        icon.innerHTML = show
            ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>'
            : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        toggleBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    };
    toggleBtn?.addEventListener('click', onToggle);

    const form = document.getElementById('loginForm');
    const onSubmit = (e) => {
        e.preventDefault();

        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        const errorMsg = document.getElementById('loginErrorMsg');
        const btn = document.getElementById('loginBtn');

        errorDiv.hidden = true;
        document.getElementById('phoneError').textContent = '';
        document.getElementById('passwordError').textContent = '';

        let valid = true;
        if (!phone) {
            document.getElementById('phoneError').textContent = 'Phone number is required.';
            valid = false;
        } else if (!isValidPhone(phone)) {
            document.getElementById('phoneError').textContent = 'Enter a valid 10-digit mobile number.';
            valid = false;
        }
        if (!password) {
            document.getElementById('passwordError').textContent = 'Password is required.';
            valid = false;
        }
        if (!valid) return;

        btn.classList.add('loading');
        btn.disabled = true;

        setTimeout(() => {
            const result = attemptLogin(phone, password);
            btn.classList.remove('loading');
            btn.disabled = false;

            if (result.ok) {
                window.location.href = redirect;
            } else {
                errorMsg.textContent = result.error;
                errorDiv.hidden = false;
            }
        }, 400);
    };
    form?.addEventListener('submit', onSubmit);

    return () => {
        toggleBtn?.removeEventListener('click', onToggle);
        form?.removeEventListener('submit', onSubmit);
    };
}
