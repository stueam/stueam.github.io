const enterButton = document.getElementById("enterButton");

function enterSite() {
  document.body.classList.add("entered");
  enterButton.textContent = "entered";
  enterButton.setAttribute("aria-pressed", "true");
}

enterButton.addEventListener("click", enterSite);

window.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && !document.body.classList.contains("entered")) {
    enterSite();
  }
});
