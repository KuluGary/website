document.addEventListener("DOMContentLoaded", () => {
  const cachedTheme = localStorage.getItem("theme");
  const cachedFontStack = localStorage.getItem("font-stack");

  const themePicker = document.querySelector("#theme-select");
  const fontPicker = document.querySelector("#font-select");

  if (cachedTheme) themePicker.value = cachedTheme;
  if (cachedFontStack) fontPicker.value = cachedFontStack;

  themePicker.addEventListener("change", handleChangeTheme);
  fontPicker.addEventListener("change", handleChangeFontStack);

  function handleChangeTheme(e) {
    const newTheme = e.target.value;

    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }

  function handleChangeFontStack(e) {
    const newFont = e.target.value;

    localStorage.setItem("font-stack", newFont);
    document.documentElement.setAttribute("data-font-stack", newFont);
  }
});
