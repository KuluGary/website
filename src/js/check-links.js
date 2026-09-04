import fs from "node:fs/promises";

const DATA_FILE = "./src/data/links.json";
const CHECK_AFTER_DAYS = 0;
const links = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));

function needsChecking(link) {
  if (!link.lastChecked) return true;

  const age = Date.now() - new Date(link.lastChecked).getTime();

  return age > CHECK_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

async function fetchUrl(url, method) {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": "PersonalWebsiteLinkChecker/1.0",
    },
  });

  return {
    status: response.status,
    finalUrl: response.url,
  };
}

async function checkUrl(url) {
  // Try HEAD first.
  try {
    const result = await fetchUrl(url, "HEAD");

    // Some servers don't support HEAD.
    // Try GET instead.
    if (result.status === 405) {
      console.log(`HEAD returned 405, trying GET: ${url}`);

      try {
        return {
          ...(await fetchUrl(url, "GET")),
          error: null,
        };
      } catch (error) {
        return {
          status: null,
          finalUrl: url,
          error: error.message,
        };
      }
    }

    return {
      ...result,
      error: null,
    };
  } catch (headError) {
    console.log(`HEAD failed, trying GET: ${url}`);

    try {
      return {
        ...(await fetchUrl(url, "GET")),
        error: null,
      };
    } catch (getError) {
      return {
        status: null,
        finalUrl: url,
        error: getError.message,
      };
    }
  }
}

function getResult(status, error) {
  if (error) {
    return "unknown";
  }

  if (status >= 200 && status < 400) {
    return "ok";
  }

  if (status === 404 || status === 410) {
    return "dead";
  }

  if (status >= 400) {
    return "blocked";
  }

  return "unknown";
}

async function getWaybackUrl(url) {
  const endpoint = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) return null;

    const data = await response.json();

    const waybackUrl = data.archived_snapshots?.closest?.url;

    return waybackUrl ? waybackUrl.replace(/^http:/, "https:") : null;
  } catch {
    return null;
  }
}

for (const [url, link] of Object.entries(links)) {
  if (!needsChecking(link)) {
    continue;
  }

  console.log(`Checking ${url}`);

  const result = await checkUrl(url);

  link.status = result.status;
  link.error = result.error;
  link.result = getResult(result.status, result.error);
  link.lastChecked = new Date().toISOString();

  if (!link.wayback) {
    link.wayback = await getWaybackUrl(url);
  }
}

await fs.writeFile(DATA_FILE, `${JSON.stringify(links, null, 2)}\n`);

console.log("Done.");
