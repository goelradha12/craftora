import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import CustomizePage from './pages/CustomizePage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ThankYouPage from './pages/ThankYouPage.jsx';

export default function App() {
    return (
        <Routes>
            {/* The customizer is a full-bleed canvas app (own topbar, no
                site header/footer) so it deliberately sits outside Layout,
                matching the standalone customize.html of the original site. */}
            <Route path="/customize" element={<CustomizePage />} />

            <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/thank-you" element={<ThankYouPage />} />
            </Route>
        </Routes>
    );
}
