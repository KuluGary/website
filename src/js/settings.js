document.addEventListener("DOMContentLoaded", () => {
  const cachedTheme = localStorage.getItem("theme");
  const cachedFontStack = localStorage.getItem("font-stack");
  const cachedContentWidth = localStorage.getItem("content-width");
  const cachedFontSize = localStorage.getItem("font-size");

  const themePicker = document.querySelector("#theme-select");
  const fontPicker = document.querySelector("#font-select");
  const contentWidthPicker = document.querySelector("#content-width");
  const fontSizePicker = document.querySelector("#font-size");
  const resetButton = document.querySelector("#reset-button");

  setDefaultTheme();
  setDefaultContentWidth();
  setDefaultFontSize();
  if (cachedFontStack) fontPicker.value = cachedFontStack;
  if (cachedContentWidth) contentWidthPicker.value = cachedContentWidth;
  if (cachedFontSize) fontSizePicker.value = cachedFontSize;

  resetButton.addEventListener("click", handleResetForm);
  themePicker.addEventListener("change", (e) => handleChangeTheme(e.target.value));
  fontPicker.addEventListener("change", (e) => handleChangeFontStack(e.target.value));
  contentWidthPicker.addEventListener("change", (e) => handleChangeContentWidth(e.target.value));
  fontSizePicker.addEventListener("change", (e) => handleChangeFontSize(e.target.value));

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

  function setDefaultFontSize() {
    if (cachedFontSize) {
      const fontSizeRadio = fontSizePicker.querySelector(`[value=${cachedFontSize}]`);
      fontSizeRadio.checked = true;
    }
  }

  function setDefaultContentWidth() {
    if (cachedContentWidth) {
      const contentWidthRadio = contentWidthPicker.querySelector(`[value=${cachedContentWidth}]`);
      contentWidthRadio.checked = true;
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

  function handleChangeContentWidth(newWidth) {
    localStorage.setItem("content-width", newWidth);
    document.documentElement.setAttribute("data-content-width", newWidth);
  }

  function handleChangeFontSize(newSize) {
    localStorage.setItem("font-size", newSize);
    document.documentElement.setAttribute("data-font-size", newSize);
  }

  function handleResetForm(e) {
    e.preventDefault();
    e.stopPropagation();
    localStorage.removeItem("theme");
    localStorage.removeItem("font-stack");

    window.location.reload(true);
  }
});
