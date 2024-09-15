window.onload = () => {
  setUpThemeSwitcher();
};
setUpSettings();
function setUpSettings() {
  const themeButton = document.querySelector(".theme-switcher");
  const selectedTheme = localStorage.getItem("theme") || getPreferredTheme();

  applyTheme(selectedTheme);

  if (selectedTheme === "dark" && themeButton) {
    themeButton.checked = true;
  }
}

function getPreferredTheme() {
  const prefersDarkScheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const preferredTheme = prefersDarkScheme ? "dark" : "light";

  localStorage.setItem("theme", preferredTheme);

  return preferredTheme;
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function setUpThemeSwitcher() {
  const themeButton = document.querySelector(".theme-switcher");

  themeButton.addEventListener("click", (e) => {
    if (e.target.checked) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  });
}
