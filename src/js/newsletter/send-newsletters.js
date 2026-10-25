import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import dotenv from "dotenv";
import Eleventy from "@11ty/eleventy";
import { optimizeRssImages } from "../11ty/filters/image.js";

dotenv.config();

const API_BASE = "https://api.kit.com/v4";
const SITE_URL = "https://gary.place";
const NEWSLETTER_DIR = path.resolve("src/newsletter");
const API_KEY = process.env.KIT_API_KEY;

if (!API_KEY) {
  throw new Error("Missing KIT_API_KEY environment variable.");
}

async function kitRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "X-Kit-Api-Key": API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Kit returned invalid JSON (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(`Kit API error ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function absoluteUrls(html) {
  return html.replace(/\b(href|src)=(["'])(.*?)\2/gi, (match, attribute, quote, value) => {
    if (!value || value.startsWith("#") || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(value)) {
      return match;
    }

    const absolute = new URL(value, SITE_URL).href;
    return `${attribute}=${quote}${absolute}${quote}`;
  });
}

async function renderNewsletterHtml(slug, language) {
  const outputPath = path.join(
    process.cwd(),
    "_site",
    "newsletter",
    slug,
    ...(language === "es" ? ["es", "index.html"] : ["index.html"]),
  );

  const pageHtml = await fs.readFile(outputPath, "utf8");

  const article = pageHtml.match(/<article\b(?=[^>]*\bid=["']content["'])[^>]*>([\s\S]*?)<\/article>/i);

  if (!article) {
    throw new Error(`Could not find the rendered newsletter article in ${outputPath}`);
  }

  return absoluteUrls(optimizeRssImages(article[1], SITE_URL));
}

async function findTagId(tagName) {
  const data = await kitRequest("/tags?per_page=100");
  const tags = data.tags ?? [];
  const tag = tags.find((item) => item.name.toLowerCase() === tagName.toLowerCase());

  if (!tag) {
    throw new Error(`Kit tag "${tagName}" was not found. Check the tag in your Kit account.`);
  }

  return tag.id;
}

async function getExistingBroadcasts() {
  const broadcasts = [];
  let after;

  // Read every page so older drafts are also checked for duplicates.
  for (let page = 0; page < 100; page++) {
    const query = new URLSearchParams({ per_page: "100" });
    if (after) query.set("after", after);

    const data = await kitRequest(`/broadcasts?${query}`);
    broadcasts.push(...(data.broadcasts ?? []));

    const pagination = data.pagination ?? {};
    const next = pagination.end_cursor ?? pagination.after;

    if (!pagination.has_next_page || !next || next === after) {
      break;
    }

    after = next;
  }

  return broadcasts;
}

async function getNewsletterFolders() {
  const entries = await fs.readdir(NEWSLETTER_DIR, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function readNewsletter(filePath, slug, language) {
  const raw = await fs.readFile(filePath, "utf8");
  const { data } = matter(raw);

  if (data.draft) {
    console.log(`Skipping draft newsletter: ${filePath}`);
    return null;
  }

  if (!data.title || !data.description || !data.date) {
    throw new Error(`${filePath} must include title, description, and date in its front matter.`);
  }

  const rawDate = data.date;

  let date;

  if (rawDate instanceof Date) {
    date = rawDate;
  } else {
    date = new Date(`${String(rawDate).slice(0, 10)}T00:00:00.000Z`);
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date in ${filePath}: ${rawDate}`);
  }

  return {
    title: String(data.title),
    description: String(data.description),
    date: date.toISOString(),
    html: await renderNewsletterHtml(slug, language),
  };
}

async function createDraft({ slug, language, tagId, newsletter, existingBroadcasts }) {
  const marker = `gary.place-newsletter:${slug}:${language}`;

  if (existingBroadcasts.some((broadcast) => (broadcast.description ?? "").includes(marker))) {
    console.log(`Skipping existing draft: ${marker}`);
    return;
  }

  const payload = {
    subject: newsletter.title,
    preview_text: newsletter.description,
    content: newsletter.html,
    description: marker,
    public: false,
    published_at: newsletter.date,
    send_at: null,
    subscriber_filter: [
      {
        all: [{ type: "tag", ids: [tagId] }],
      },
    ],
  };

  const result = await kitRequest("/broadcasts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const broadcast = result.broadcast;
  console.log(`Created ${language} draft: "${newsletter.title}" (ID ${broadcast?.id ?? "unknown"})`);
}

async function main() {
  await new Eleventy(".", "_site", {
    configPath: ".eleventy.js",
    quietMode: true,
  }).write();

  const [englishTagId, spanishTagId, existingBroadcasts] = await Promise.all([
    findTagId("language-en"),
    findTagId("language-es"),
    getExistingBroadcasts(),
  ]);

  const folders = await getNewsletterFolders();

  for (const slug of folders) {
    const folder = path.join(NEWSLETTER_DIR, slug);
    const englishPath = path.join(folder, "index.md");
    const spanishPath = path.join(folder, "es.md");

    // Only process folders containing both language versions.
    const files = await fs.readdir(folder);
    if (!files.includes("index.md") || !files.includes("es.md")) {
      console.log(`Skipping ${slug}: both language files are required.`);
      continue;
    }

    const [english, spanish] = await Promise.all([
      readNewsletter(englishPath, slug, "en"),
      readNewsletter(spanishPath, slug, "es"),
    ]);

    if (!english || !spanish) {
      console.log(`Skipping ${slug}: at least one language version is a draft.`);
      continue;
    }

    await createDraft({
      slug,
      language: "en",
      tagId: englishTagId,
      newsletter: english,
      existingBroadcasts,
    });

    await createDraft({
      slug,
      language: "es",
      tagId: spanishTagId,
      newsletter: spanish,
      existingBroadcasts,
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
