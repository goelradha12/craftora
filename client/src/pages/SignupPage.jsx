import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/signup.html?raw';
import { initSignupPage } from '../legacy/signupPage.js';
import '../styles/login.css';

export default function SignupPage() {
    return <FragmentMount html={html} init={initSignupPage} />;
}
