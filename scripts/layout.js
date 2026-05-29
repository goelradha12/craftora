const FOOTER_CODE = `
<footer class="footer">

        <!-- Top Footer -->
        <div class="footer-top">

            <!-- Brand -->
            <div class="footer-brand">
                <a href="./index.html">
                    <img src="./assets/dark_logo.png" alt="Craftora Logo" class="footer-logo">
                </a>

                <p class="footer-tagline">
                    Modern custom merchandise designed to bring your ideas to life.
                </p>
            </div>

            <!-- Quick Links -->
            <div class="footer-links">
                <h3>Quick Links</h3>

                <ul>
                    <li><a href="./index.html">Home</a></li>
                    <li><a href="./products.html">Shop</a></li>
                    <li><a href="./about.html">About</a></li>
                    <li><a href="./contact.html">Contact</a></li>
                    <li><a href="./login.html">Login</a></li>
                </ul>
            </div>

            <!-- Shop Categories -->
            <div class="footer-links">
                <h3>Shop Categories</h3>

                <ul>
                    <li><a href="./products.html?category=Diary">Diary</a></li>
                    <li><a href="./products.html?category=Bottle">Bottle</a></li>
                    <li><a href="./products.html?category=Tshirt">T-shirt</a></li>
                    <li><a href="./products.html?category=Cup">Cup</a></li>
                </ul>
            </div>

        </div>

        <!-- Bottom Footer -->
        <div class="footer-bottom">

            <p>
                © 2026 Craftora. All rights reserved.
            </p>

            <div class="footer-bottom-links">
                <a href="./return-policy.html">Return Policy</a>
                <a href="./privacy-policy.html">Privacy Policy</a>
                <a href="./terms.html">Terms & Conditions</a>
            </div>

        </div>

    </footer>`;

const HEADER_CODE = `<nav class="nav">
            <div class="nav__phone">
                <div class="logo">
                    <a href="./index.html"><img src="./assets/logo.png" alt="Craftora logo. Click for home."></a>
                </div>
                <button class="nav__toggle nav__phone--open js_open_btn" aria-label="Toggle Navigation">

                    <!-- hamburger -->
                    <?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
                    <svg width="50px" height="50px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 7H19" stroke="#000000" stroke-width="3" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M5 12L19 12" stroke="#000000" stroke-width="3" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M5 17L19 17" stroke="#000000" stroke-width="3" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </button>
                <!-- close icon -->
                <button class="nav__toggle nav__phone--close js_close_btn" aria-label="Toggle Navigation">
                    <?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
                    <svg width="50px" height="50px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#000000"
                            d="M195.2 195.2a64 64 0 0 1 90.496 0L512 421.504 738.304 195.2a64 64 0 0 1 90.496 90.496L602.496 512 828.8 738.304a64 64 0 0 1-90.496 90.496L512 602.496 285.696 828.8a64 64 0 0 1-90.496-90.496L421.504 512 195.2 285.696a64 64 0 0 1 0-90.496z" />
                    </svg>
                </button>
            </div>

            <ul class="nav--list container js_nav_list">
                <li><a class="nav--link" href="#">About</a></li>
                <li><a class="nav--link" href="./products.html">Shop</a></li>
                <li class="logo">
                    <a href="./index.html"><img src="./assets/logo.png" alt="Craftora logo. Click for home."></a>
                </li>
                <li><a class="nav--link" href="#">Contact</a></li>
                <li class="nav--item dropdown">

                    <a class="nav--link dropdown--toggle" href="#">
                        Profile
                        <svg aria-hidden="true" width="20px" height="20px" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 384 512"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
                            <path
                                d="M169.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 306.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
                        </svg>
                    </a>

                    <ul class="dropdown--menu" aria-haspopup="true">
                        <li><a href="./login.html">Login</a></li>
                        <li><a href="./signup.html">Signup</a></li>
                        <li><a href="#">Wishlist</a></li>
                    </ul>

                </li>
            </ul>
        </nav>`;

document.addEventListener("DOMContentLoaded", () => {
    const footer = document.querySelector("#footer");
    const header = document.querySelector("#header");

    if (footer) footer.innerHTML = FOOTER_CODE;
    if (header) header.innerHTML = HEADER_CODE;

    if (header) {

        const nav_close_btn = document.querySelector(".js_close_btn");
        const nav_open_btn = document.querySelector(".js_open_btn");
        const nav_list = document.querySelector(".js_nav_list");
        nav_open_btn.addEventListener("click", () => {
            nav_list.classList.add("active");

            nav_open_btn.style.display = "none";
            nav_close_btn.style.display = "block";
        });

        nav_close_btn.addEventListener("click", () => {
            nav_list.classList.remove("active");

            nav_open_btn.style.display = "block";
            nav_close_btn.style.display = "none";
        });

        const dropdownToggle = document.querySelector(".dropdown--toggle");
        const dropdown = document.querySelector(".dropdown");

        dropdownToggle.addEventListener("click", (e) => {
            e.preventDefault();
            dropdown.classList.toggle("active");
        });


    }
});