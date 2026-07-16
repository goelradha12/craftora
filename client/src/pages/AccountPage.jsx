import FragmentMount from '../components/FragmentMount.jsx';
import html from './fragments/account.html?raw';
import { initAcct } from '../legacy/account.js';
import '../styles/account.css';

export default function AccountPage() {
    return <FragmentMount html={html} init={initAcct} />;
}
