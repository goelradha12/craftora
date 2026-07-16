/* ============================================================
   contactPage.js — Craftora Contact Page
   Ported from src/pages/fragments/contact.inline.js (originally the
   inline <script> in client/contact.html), exported as ESM.
   ============================================================ */

export function initContactPage() {
    const form = document.getElementById('contactForm');
    const onSubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('cf-name').value.trim();
        const email = document.getElementById('cf-email').value.trim();
        const subject = document.getElementById('cf-subject').value;
        const message = document.getElementById('cf-message').value.trim();
        const errDiv = document.getElementById('cfError');
        const btn = document.getElementById('contactSubmit');

        errDiv.style.display = 'none';

        if (!name || !email || !subject || !message) {
            errDiv.textContent = 'Please fill in all required fields.';
            errDiv.style.display = 'block';
            return;
        }

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(email)) {
            errDiv.textContent = 'Please enter a valid email address.';
            errDiv.style.display = 'block';
            return;
        }

        btn.classList.add('loading');
        btn.disabled = true;

        setTimeout(() => {
            btn.classList.remove('loading');
            btn.disabled = false;
            document.getElementById('formWrap').style.display = 'none';
            document.getElementById('formSuccess').style.display = 'flex';
        }, 900);
    };
    form?.addEventListener('submit', onSubmit);

    const sendAnotherBtn = document.getElementById('sendAnother');
    const onSendAnother = (e) => {
        e.preventDefault();
        form.reset();
        document.getElementById('cfError').style.display = 'none';
        document.getElementById('formSuccess').style.display = 'none';
        document.getElementById('formWrap').style.display = 'block';
    };
    sendAnotherBtn?.addEventListener('click', onSendAnother);

    return () => {
        form?.removeEventListener('submit', onSubmit);
        sendAnotherBtn?.removeEventListener('click', onSendAnother);
    };
}
