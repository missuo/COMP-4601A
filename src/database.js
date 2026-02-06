const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "crawler.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset TEXT NOT NULL,
    origUrl TEXT NOT NULL,
    content TEXT
  );

  CREATE TABLE IF NOT EXISTS links (
    source_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    dataset TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_links_target_dataset ON links(target_url, dataset);
  CREATE INDEX IF NOT EXISTS idx_pages_dataset ON pages(dataset);
  CREATE INDEX IF NOT EXISTS idx_pages_origurl_dataset ON pages(origUrl, dataset);
`);

const insertPage = db.prepare(
  "INSERT INTO pages (dataset, origUrl, content) VALUES (?, ?, ?)"
);

const insertLink = db.prepare(
  "INSERT INTO links (source_url, target_url, dataset) VALUES (?, ?, ?)"
);

function bulkInsert(pages, links, dataset) {
  const tx = db.transaction(() => {
    for (const page of pages) {
      insertPage.run(dataset, page.url, page.content);
    }
    for (const link of links) {
      insertLink.run(link.source, link.target, dataset);
    }
  });
  tx();
}

function clearDataset(dataset) {
  db.prepare("DELETE FROM pages WHERE dataset = ?").run(dataset);
  db.prepare("DELETE FROM links WHERE dataset = ?").run(dataset);
}

const getPopular = db.prepare(`
  SELECT p.id, p.origUrl, COUNT(l.source_url) AS incomingCount
  FROM pages p
  JOIN links l ON l.target_url = p.origUrl AND l.dataset = p.dataset
  WHERE p.dataset = ?
  GROUP BY p.id
  ORDER BY incomingCount DESC
  LIMIT 10
`);

const getPageById = db.prepare("SELECT * FROM pages WHERE id = ?");

const getIncomingLinks = db.prepare(
  "SELECT DISTINCT source_url FROM links WHERE target_url = ? AND dataset = ?"
);

module.exports = {
  db,
  bulkInsert,
  clearDataset,
  getPopular,
  getPageById,
  getIncomingLinks,
};
