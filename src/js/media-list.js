const gridButtons = document.querySelectorAll("#grid-toggle");
const listButtons = document.querySelectorAll("#list-toggle");
const mediaSections = document.querySelectorAll(".media-section");

gridButtons.forEach((gridButton) => {
  gridButton.addEventListener("click", () => {
    localStorage.setItem("media-list-preference", "grid");
    setMediaSectionPreference();
  });

  gridButton.setAttribute("data-javascript", true);
});

listButtons.forEach((listButton) => {
  listButton.addEventListener("click", () => {
    localStorage.setItem("media-list-preference", "list");
    setMediaSectionPreference();
  });

  listButton.setAttribute("data-javascript", true);
});

function setMediaSectionPreference() {
  const preference = localStorage.getItem("media-list-preference") ?? "list";

  if (preference === "grid") {
    mediaSections.forEach((mediaSection) => mediaSection.classList.add("media-grid"));
    mediaSections.forEach((mediaSection) => mediaSection.classList.remove("media-list"));
    gridButtons.forEach((gridButton) => gridButton.setAttribute("disabled", true));
    listButtons.forEach((listButton) => listButton.removeAttribute("disabled"));
  } else if (preference === "list") {
    mediaSections.forEach((mediaSection) => mediaSection.classList.add("media-list"));
    mediaSections.forEach((mediaSection) => mediaSection.classList.remove("media-grid"));
    listButtons.forEach((listButton) => listButton.setAttribute("disabled", true));
    gridButtons.forEach((gridButton) => gridButton.removeAttribute("disabled"));
  }
}

setMediaSectionPreference();
