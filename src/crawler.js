const cheerio = require("cheerio");
const { bulkInsert, clearDataset } = require("./database");

const SEED_URLS = {
  tinyfruits:
    "https://people.scs.carleton.ca/~avamckenney/tinyfruits/N-0.html",
  fruits100: "https://people.scs.carleton.ca/~avamckenney/fruits100/N-0.html",
  fruitsA: "https://people.scs.carleton.ca/~avamckenney/fruitsA/N-0.html",
  fruitgraph:
    "https://people.scs.carleton.ca/~avamckenney/fruitgraph/N-0.html",
};

const CONCURRENCY = 10;

async function fetchPage(url) {
  const response = await fetch(url);
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return null;
  const html = await response.text();
  return html;
}

async function crawl(datasetName) {
  const seedUrl = SEED_URLS[datasetName];
  if (!seedUrl) {
    throw new Error(
      `Unknown dataset: ${datasetName}. Available: ${Object.keys(SEED_URLS).join(", ")}`
    );
  }

  console.log(`Crawling dataset "${datasetName}" starting from ${seedUrl}`);
  clearDataset(datasetName);

  const visited = new Set();
  const queue = [seedUrl];
  const pages = [];
  const links = [];

  while (queue.length > 0) {
    const batch = [];
    while (batch.length < CONCURRENCY && queue.length > 0) {
      const url = queue.shift();
      if (visited.has(url)) continue;
      visited.add(url);
      batch.push(url);
    }

    if (batch.length === 0) continue;

    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const html = await fetchPage(url);
        return { url, html };
      })
    );

    for (const result of results) {
      if (result.status !== "fulfilled" || !result.value.html) continue;
      const { url, html } = result.value;

      pages.push({ url, content: html });

      const $ = cheerio.load(html);
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        try {
          const resolved = new URL(href, url).href;
          links.push({ source: url, target: resolved });
          if (!visited.has(resolved)) {
            queue.push(resolved);
          }
        } catch {
          // skip malformed URLs
        }
      });
    }

    if (visited.size % 100 === 0 || queue.length === 0) {
      console.log(`  Crawled ${visited.size} pages, ${queue.length} in queue`);
    }
  }

  console.log(
    `Crawl complete. ${pages.length} pages, ${links.length} links. Inserting into DB...`
  );
  bulkInsert(pages, links, datasetName);
  console.log("Done.");
}

module.exports = { crawl, SEED_URLS };
