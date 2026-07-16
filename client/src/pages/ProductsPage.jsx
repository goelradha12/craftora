import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/products.html?raw';
import { initProducts } from '../legacy/products.js';
import '../styles/products.css';

export default function ProductsPage() {
    return <FragmentMount html={html} init={initProducts} />;
}
