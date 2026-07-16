/* ============================================================
   signupPage.js — Craftora Signup Page
   Ported from src/pages/fragments/signup.inline.js (originally the
   inline <script> in client/signup.html), exported as ESM.
   ============================================================ */

import { isValidPhone, validatePassword, attemptSignup } from './auth.js';

export function initSignupPage() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || '/';

    const loginLink = document.querySelector('a[href="/login"]');
    if (loginLink && params.get('redirect')) {
        loginLink.href = '/login?redirect=' + encodeURIComponent(params.get('redirect'));
    }

    function validateForm() {
        const name = document.getElementById('fullname').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        ['nameError', 'phoneError', 'passwordError', 'confirmPasswordError'].forEach((id) => {
            document.getElementById(id).textContent = '';
        });

        let valid = true;

        if (!name) {
            document.getElementById('nameError').textContent = 'Full name is required.';
            valid = false;
        }

        if (!phone) {
            document.getElementById('phoneError').textContent = 'Phone number is required.';
            valid = false;
        } else if (!isValidPhone(phone)) {
            document.getElementById('phoneError').textContent = 'Enter a valid 10-digit mobile number starting with 6-9.';
            valid = false;
        }

        if (!password) {
            document.getElementById('passwordError').textContent = 'Password is required.';
            valid = false;
        } else if (password.length < 6) {
            document.getElementById('passwordError').textContent = 'Password must be at least 6 characters.';
            valid = false;
        }

        if (!confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Please confirm your password.';
            valid = false;
        } else if (password !== confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Passwords do not match.';
            valid = false;
        }

        return valid;
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

    const pwInput = document.getElementById('password');
    const confirmPwInput = document.getElementById('confirmPassword');
    const pwReqList = document.getElementById('pwRequirements');
    const pwWrapper = pwInput?.closest('.input-with-icon');

    const onFocusIn = () => pwReqList.classList.add('active');
    const onFocusOut = (e) => {
        if (!pwWrapper.contains(e.relatedTarget)) pwReqList.classList.remove('active');
    };
    pwWrapper?.addEventListener('focusin', onFocusIn);
    pwWrapper?.addEventListener('focusout', onFocusOut);

    const onPwInput = () => {
        const pw = pwInput.value;
        const results = validatePassword(pw).results;

        results.forEach((r) => {
            const li = pwReqList.querySelector('[data-rule="' + r.id + '"]');
            if (!li) return;
            const icon = li.querySelector('.pw-req__icon');
            if (r.passed) {
                li.classList.add('passed');
                icon.textContent = '✓';
            } else {
                li.classList.remove('passed');
                icon.textContent = '○';
            }
        });

        pwReqList.classList.toggle('all-passed', results.every((r) => r.passed));

        if (confirmPwInput.value && confirmPwInput.value === pw) {
            document.getElementById('confirmPasswordError').textContent = '';
        }
    };
    pwInput?.addEventListener('input', onPwInput);

    const onConfirmInput = () => {
        const errEl = document.getElementById('confirmPasswordError');
        if (confirmPwInput.value && confirmPwInput.value !== pwInput.value) {
            errEl.textContent = 'Passwords do not match.';
        } else {
            errEl.textContent = '';
        }
    };
    confirmPwInput?.addEventListener('input', onConfirmInput);

    const form = document.getElementById('signupForm');
    const onSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const name = document.getElementById('fullname').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;

        const errorDiv = document.getElementById('signupError');
        const errorMsg = document.getElementById('signupErrorMsg');
        const btn = document.getElementById('signupBtn');

        errorDiv.hidden = true;
        btn.classList.add('loading');
        btn.disabled = true;

        setTimeout(() => {
            const result = attemptSignup({
                name,
                phone,
                email: '',
                address: '',
                addressObj: {},
                password,
            });

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
        pwWrapper?.removeEventListener('focusin', onFocusIn);
        pwWrapper?.removeEventListener('focusout', onFocusOut);
        pwInput?.removeEventListener('input', onPwInput);
        confirmPwInput?.removeEventListener('input', onConfirmInput);
        form?.removeEventListener('submit', onSubmit);
    };
}
