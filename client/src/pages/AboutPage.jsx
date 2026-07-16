import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/about.html?raw';
import '../styles/about.css';

export default function AboutPage() {
    return <FragmentMount html={html} />;
}
