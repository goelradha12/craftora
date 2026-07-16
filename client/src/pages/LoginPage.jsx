import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/login.html?raw';
import { initLoginPage } from '../legacy/loginPage.js';
import '../styles/login.css';

export default function LoginPage() {
    return <FragmentMount html={html} init={initLoginPage} />;
}
