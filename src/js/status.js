document.addEventListener("DOMContentLoaded", () => {
  const feedUrl = "https://status.cafe/users/kulugary.atom";
  const NUMBER_OF_CHARACTERS = 12;

  fetch(feedUrl)
    .then((response) => response.text())
    .then((string) => new window.DOMParser().parseFromString(string, "text/xml"))
    .then((data) => {
      const entries = data.querySelectorAll("entry");
      let html = ``;

      entries.forEach((entry) => {
        let title = entry.querySelector("title").innerHTML.slice(0, NUMBER_OF_CHARACTERS).trim();
        let content = entry.querySelector("content").textContent.trim();
        let dateString = entry.querySelector("published").innerHTML.slice(0, 10);
        html += `
          <li>
            <article>
              <header>
                <h2>${title}</h2>
                <time datetime="${dateString}">${dateString}</date>
              </header>

              <p>${content}</p>
            </article>
          </li>
      `;
      });

      document.getElementById("status-list").innerHTML = html;
    });
});
