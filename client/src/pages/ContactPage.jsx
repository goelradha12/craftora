import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/contact.html?raw';
import { initContactPage } from '../legacy/contactPage.js';
import '../styles/contact.css';

export default function ContactPage() {
    return <FragmentMount html={html} init={initContactPage} />;
}
