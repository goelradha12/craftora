
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