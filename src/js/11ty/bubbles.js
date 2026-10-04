import { getFromCache, setIntoCache } from "../cache.js";

const BUBBLES_API = "https://bubbles.town/api/vote-count";

export async function getBubblesSignal(url) {
  try {
    const encodedUrl = encodeURIComponent(url);
    const cached = getFromCache(`bubbles-url-${encodedUrl}`);

    console.log(url, cached);

    if (cached) return cached;

    const response = await fetch(`${BUBBLES_API}?url=${encodedUrl}`);

    if (!response.ok) {
      return null;
    }

    const { id, count } = await response.json();

    setIntoCache(`bubbles-url-${encodedUrl}`, { id, count });

    return { id, count };
  } catch (err) {
    return null;
  }
}
