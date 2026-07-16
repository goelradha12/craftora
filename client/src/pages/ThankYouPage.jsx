import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/thank-you.html?raw';
import { initThankYouPage } from '../legacy/thankYouPage.js';
import '../styles/thank-you.css';

export default function ThankYouPage() {
    return <FragmentMount html={html} init={initThankYouPage} />;
}
