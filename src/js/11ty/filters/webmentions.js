/**
 * Filters a list of webmentions to return only the ones by post
 * @param {object} webmentions list of all webmentions
 * @param {string} url url of the post
 * @returns list of webmentions filtered by post
 */
export function getWebmentionsByUrl(webmentions, url) {
  return webmentions.filter((entry) => entry["wm-target"].includes(url));
}

/**
 * Filters a list of webmentions to exclude ones made by owner
 * @param {object} webmentions list of webmentions
 * @returns list of webmentions without the owned owns
 */
export function filterOwnWebmentions(webmentions) {
  function isOwnWebmention(webmention) {
    const urls = [
      "https://kulugary.neocities.org",
      "https://gary.place",
      "https://bsky.app/profile/kulugary.itch.io",
      "https://kulugary.tumblr.com/",
      "https://indiepocalypse.social/@kulugary",
      "https://tilde.zone/@gary",
      "https://github.com/KuluGary",
      "https://www.reddit.com/user/KuluGary/",
    ];

    const authorUrl = webmention.author ? webmention.author.url : false;

    return authorUrl && urls.includes(authorUrl);
  }

  return webmentions.filter((webmention) => !!webmention.author.url && !isOwnWebmention(webmention));
}

/**
 * Filters a list of webmentions to return only the ones with specified type
 * @param {object} mentions list of all webmentions
 * @param {string} mentionType type of webmention
 * @returns list of webmentions by type
 */
export function webmentionsByType(webmentions, mentionType) {
  return webmentions.filter((entry) => entry["wm-property"] === mentionType);
}
