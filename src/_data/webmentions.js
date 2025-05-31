module.exports = async function getWebmetion() {
  const response = await fetch(
    `https://webmention.io/api/mentions.jf2?token=${process.env.WEBMENTIONS_TOKEN}&per-page=1000`
  );

  const body = await response.json();

  console.log(body);

  return body;
};
