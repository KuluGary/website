import { getFromCache, setIntoCache } from "../js/cache.js";

export default async function () {
  const cached = getFromCache("webmentions");

  if (cached) return cached;

  const response = await fetch(
    `https://webmention.io/api/mentions.jf2?token=${process.env.WEBMENTIONS_TOKEN}&per-page=1000`
  );

  const body = await response.json();
  const webmentions = body.children;

  setIntoCache("webmentions", webmentions);
  return webmentions;
}
