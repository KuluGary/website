setUpSettings();

document.onreadystatechange = () => {
  if (document.readyState == "complete") {
    setUpThemeSwitcher();
  }
};

function setUpSettings() {
  const selectedTheme = localStorage.getItem("theme");

  if (selectedTheme) {
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }
}

function setUpThemeSwitcher() {
  const themeSwitcher = document.getElementById("theme-select");

  themeSwitcher?.addEventListener("change", (e) => {
    document.documentElement.setAttribute("data-theme", e.target.value);
    localStorage.setItem("theme", e.target.value);
  });
}
