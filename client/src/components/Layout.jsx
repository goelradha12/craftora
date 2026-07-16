import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { initLayout, markActiveLink, updateCartBadges } from '../legacy/layout.js';

/**
 * App shell: renders the #header/#footer mount points that
 * legacy/layout.js fills with markup (buildHeader/buildFooterHTML),
 * plus the routed page content via <Outlet/>.
 *
 * initLayout() is only run once for the lifetime of the app (it
 * builds the header/footer DOM and wires up nav/search/dropdown
 * listeners). On every route change we just re-run the lightweight
 * per-navigation bits: mark the active nav link and refresh cart
 * badges (mirrors what the original multi-page site got "for free"
 * on every full page load).
 */
export default function Layout() {
    const location = useLocation();

    useEffect(() => {
        initLayout();
    }, []);

    useEffect(() => {
        markActiveLink();
        updateCartBadges();
    }, [location.pathname]);

    return (
        <>
            <div id="header"></div>
            <Outlet />
            <div id="footer"></div>
        </>
    );
}
