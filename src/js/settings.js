window.onload = () => {
  setUpSettingsForm();
};

setUpDefaultSettings();

function setUpDefaultSettings() {
  const theme = localStorage.getItem("theme");
  const fontStack = localStorage.getItem("font-stack");

  if (!theme) {
    if (window.matchMedia("(prefers-color-scheme: dark)")) {
      applyTheme("dark-blue");
    } else {
      applyTheme("grayscale");
    }
  } else {
    applyTheme(theme);
  }

  document.documentElement.setAttribute("data-font-stack", fontStack);
}

function getPreferredTheme() {
  const prefersDarkScheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const preferredTheme = prefersDarkScheme ? "dark" : "light";

  localStorage.setItem("theme", preferredTheme);

  return preferredTheme;
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  const themeSelectorElement = document.querySelector("#theme-select");

  if (themeSelectorElement != null) {
    themeSelectorElement.value = theme;
  }
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

/** Settings Form */
function setUpSettingsForm() {
  const themeSelectorElement = document.querySelector("#theme-select");
  const fontSelectorElement = document.querySelector("#font-select");
  const resetButton = document.querySelector("#reset-button");

  if (themeSelectorElement && fontSelectorElement && resetButton) {
    themeSelectorElement.onchange = (e) => {
      const theme = e.target.value;

      localStorage.setItem("theme", theme);

      applyTheme(theme);
    };

    fontSelectorElement.onchange = (e) => {
      const fontStack = e.target.value;

      localStorage.setItem("font-stack", fontStack);

      document.documentElement.setAttribute("data-font-stack", fontStack);
    };

    resetButton.onclick = (e) => {
      e.preventDefault();

      document.documentElement.setAttribute("data-font-stack", "system-ui");
      fontSelectorElement.value = "system-ui";

      if (window.matchMedia("(prefers-color-scheme: dark)")) {
        applyTheme("dark-blue");
      } else {
        applyTheme("grayscale");
      }
    };
  }
}
