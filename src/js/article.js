document.onreadystatechange = () => {
  if (document.readyState == "complete") {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }
};

function mastodonShare(e) {
  let title = e.getAttribute("data-title");
  let preferredInstance = localStorage.getItem("preferredInstance") ?? "mastodon.social";

  const pageUrl = window.location.href;

  let domain = prompt("Enter your Mastodon instance", preferredInstance);

  if (domain == "" || domain == null) {
    return;
  }

  if (preferredInstance !== domain) {
    localStorage.setItem("preferredInstance", domain);
  }

  let url = `https://${domain}/share?title=${title}&url=${pageUrl}`;

  window.open(url, "_blank");
}
