import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/product.html?raw';
import { initProductPage } from '../legacy/product.js';
import '../styles/product.css';

export default function ProductPage() {
    const location = useLocation();

    // initProductPage() reads ?id= off location.search itself; re-run
    // it whenever the query string changes (e.g. navigating between
    // related products) since FragmentMount only runs init on mount.
    useEffect(() => {
        const cleanup = initProductPage();
        return () => { if (typeof cleanup === 'function') cleanup(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
