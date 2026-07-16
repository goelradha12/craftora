import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/wishlist.html?raw';
import { renderWishlistPage } from '../legacy/wishlist.js';
import '../styles/wishlist.css';

export default function WishlistPage() {
    return <FragmentMount html={html} init={renderWishlistPage} />;
}
