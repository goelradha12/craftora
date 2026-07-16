import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/cart.html?raw';
import { initCart } from '../legacy/cart.js';
import '../styles/cart.css';

export default function CartPage() {
    return <FragmentMount html={html} init={initCart} />;
}
