import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/index.html?raw';
import { initHome } from '../legacy/index.js';
import '../styles/home.css';

export default function HomePage() {
    return <FragmentMount html={html} init={initHome} />;
}
