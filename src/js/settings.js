setUpSettings();
document.onreadystatechange = () => {
  if (document.readyState == "complete") {
    setUpThemeSwitcher();
  }
};

function setUpSettings() {
  const theme = localStorage.getItem("theme");

  if (theme) {
    if (theme === "theme-dark") {
      document.documentElement.classList.add("darkmode");
    } else {
      document.documentElement.classList.remove("darkmode");
    }
  } else if (window.matchMedia) {
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (prefersDarkMode) {
      document.documentElement.className = "darkmode";
    }
  }
}

function setUpThemeSwitcher() {
  const themeSwitcher = document.getElementById("theme-switch");

  themeSwitcher.addEventListener("change", () => {
    document.documentElement.classList.toggle("darkmode");

    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("darkmode") ? "theme-dark" : "theme-light"
    );
  });
}
