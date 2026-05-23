
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