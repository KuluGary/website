document.onreadystatechange = () => {
  if (document.readyState == "complete") {
    gameOfTheDay();
  }
};

async function gameOfTheDay() {
  const seed = new Date().getDay() + new Date().getMonth();

  const gameOfTheDayContainer = document.querySelector("#game-of-the-day");
  const imageElement = gameOfTheDayContainer.querySelector("img");
  const textElement = gameOfTheDayContainer.querySelector("div");

  const data = await fetch("/assets/data/games.json").then((res) => res.json());
  const selectedGame = data.completed[seed % data.completed.length];

  imageElement.src = selectedGame.image;

  const linkElement = document.createElement("a");
  linkElement.href = selectedGame.link;
  linkElement.innerText = selectedGame.title;

  const authorElement = document.createElement("p");
  authorElement.innerText = `- ${selectedGame.platform}`;

  textElement.appendChild(linkElement);
  textElement.appendChild(authorElement);
}
