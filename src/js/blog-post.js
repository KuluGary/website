document.addEventListener("DOMContentLoaded", function () {
  const splideElement = document.querySelector(".splide");

  if (!splideElement) return;

  var splide = new Splide(".splide", {
    type: "tab",
    perPage: 1.5,
    focus: "center",
    gap: 20,
    fixedWidth: true,

    // Responsive breakpoint
    breakpoints: {
      768: {
        perPage: 1,
        snap: true,
        fixedWidth: false,
      },
    },
  });
  splide.mount();
});

function mastodonShare(e) {
  let title = e.getAttribute("data-title");
  let tags = e
    .getAttribute("data-tags")
    ?.split(",")
    .map((e) => `#${e}`)
    .join(" ");
  let preferredInstance = localStorage.getItem("preferredInstance") ?? "mastodon.social";

  const pageUrl = window.location.href;

  let domain = prompt("Enter your Mastodon instance", preferredInstance);

  if (domain == "" || domain == null) {
    return;
  }

  if (preferredInstance !== domain) {
    localStorage.setItem("preferredInstance", domain);
  }

  let url = `https://${domain}/share?title=${title}&url=${pageUrl}&text=${encodeURIComponent(tags)}`;

  window.open(url, "_blank");
}
