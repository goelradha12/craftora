import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/checkout.html?raw';
import { initCheckout } from '../legacy/checkout.js';
import '../styles/checkout.css';

export default function CheckoutPage() {
    return <FragmentMount html={html} init={initCheckout} />;
}
