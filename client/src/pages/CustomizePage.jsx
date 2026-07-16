import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/customize.html?raw';
import { initCustomize } from '../legacy/customize.js';
import '../styles/customize.css';

export default function CustomizePage() {
    return <FragmentMount html={html} init={initCustomize} />;
}
