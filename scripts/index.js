
const nav_btn = document.querySelector(".js_close_btn");
const nav_open_btn = document.querySelector(".js_open_btn");
nav_btn.addEventListener("click",()=>{
  document.querySelector(".js_nav_list").style.transform = "translateX(100%)";
})
nav_open_btn.addEventListener("click",()=>{
  document.querySelector(".js_nav_list").style.transform = "translateX(0)";       
})