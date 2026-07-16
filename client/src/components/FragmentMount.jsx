import { useEffect, useRef } from 'react';

/**
 * Mounts a raw HTML fragment (ported from a legacy page's <body>) and
 * runs a legacy init function against it once the markup is in the DOM.
 *
 * The init function may return a cleanup function; it is called on
 * unmount so window/document listeners registered by legacy modules
 * don't accumulate across client-side route changes.
 */
export default function FragmentMount({ html, init }) {
    const ref = useRef(null);

    useEffect(() => {
        let cleanup;
        if (typeof init === 'function') {
            cleanup = init();
        }
        return () => {
            if (typeof cleanup === 'function') cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
