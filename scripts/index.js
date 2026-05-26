
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


// ------------ Hero - Reviews ---------------

const reviewsTrack = document.querySelector(".js_reviews_track");

let scrollAmount = 0;

async function loadReviews() {

    const response = await fetch("../content/reviews.json");

    const reviews = await response.json();

    // duplicate reviews for infinite effect
    const duplicatedReviews = [...reviews, ...reviews];

    duplicatedReviews.forEach((item) => {

        const card = document.createElement("div");

        card.classList.add("review");

        card.innerHTML = `
            <p>"${item.review}"</p>
            <span>— ${item.author}</span>
        `;

        reviewsTrack.appendChild(card);

    });

}

function autoScroll() {

    scrollAmount += 0.5;

    if (scrollAmount >= reviewsTrack.scrollWidth / 2) {
        scrollAmount = 0;
    }

    reviewsTrack.style.transform =
        `translateX(-${scrollAmount}px)`;

    requestAnimationFrame(autoScroll);

}

loadReviews().then(() => {
    autoScroll();
});