setUpSettings();

window.onload = () => {
  setUpThemeSwitcher();
};

function setUpSettings() {
  const selectedTheme = localStorage.getItem("theme");

  if (selectedTheme) {
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }
}

function setUpThemeSwitcher() {
  const themeButtons = document.querySelectorAll(".theme-button");

  themeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const theme = e.target.getAttribute("data-theme");
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    });
  });
}
