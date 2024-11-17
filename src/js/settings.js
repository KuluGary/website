document.addEventListener("DOMContentLoaded", () => {
  const cachedTheme = localStorage.getItem("theme");
  const cachedFontStack = localStorage.getItem("font-stack");

  const themePicker = document.querySelector("#theme-select");
  const fontPicker = document.querySelector("#font-select");
  const resetButton = document.querySelector("#reset-button");

  setDefaultTheme();
  if (cachedFontStack) fontPicker.value = cachedFontStack;

  resetButton.addEventListener("click", handleResetForm);
  themePicker.addEventListener("change", (e) =>
    handleChangeTheme(e.target.value)
  );
  fontPicker.addEventListener("change", (e) =>
    handleChangeFontStack(e.target.value)
  );

  function setDefaultTheme() {
    if (cachedTheme) {
      themePicker.value = cachedTheme;
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)")) {
        themePicker.value = "dark-blue";
      } else {
        themePicker.value = "grayscale";
      }
    }
  }

  function handleChangeTheme(newTheme) {
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }

  function handleChangeFontStack(newFont) {
    localStorage.setItem("font-stack", newFont);
    document.documentElement.setAttribute("data-font-stack", newFont);
  }

  function handleResetForm(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("AAA");
    localStorage.removeItem("theme");
    localStorage.removeItem("font-stack");

    window.location.reload(true);
  }
});
