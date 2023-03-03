
const scrollTop = function () {
    const scrollBtn = document.createElement("button");
    scrollBtn.innerHTML = "&uarr;";
    scrollBtn.setAttribute("id", "scroll-btn");
    document.body.appendChild(scrollBtn);
  };

scrollTop();

const scrollBtnDisplay = function () {
    window.scrollY
      ? scrollBtn.classList.add("show")
      : scrollBtn.classList.remove("show");
};
window.addEventListener("scroll", scrollBtnDisplay);

const scrollWindow = function () {  
    if (window.scrollY) {
      setTimeout(function () {
        window.scrollTo(0, window.scrollY - 50);
        scrollWindow();
      }, 10);
    }
  };
const scrollBtn = document.getElementById("scroll-btn");
scrollBtn.addEventListener("click", scrollWindow);
