export const DEFAULT_LANG = "en";

function getPathParts(page) {
  return (page.inputPath || "").replace(/\\/g, "/").split("/");
}

export function getPostSlug(page, category = "blog") {
  const parts = getPathParts(page);
  const blogIndex = parts.indexOf(category);

  return blogIndex >= 0 ? parts[blogIndex + 1] : page.fileSlug;
}

export function getLang(page, lang) {
  if (lang) return lang;

  const fileName = getPathParts(page).at(-1) || "";
  const fileSlug = fileName.replace(/\.[^.]+$/, "");

  return fileSlug === "index" ? DEFAULT_LANG : fileSlug;
}
