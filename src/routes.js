const express = require("express");
const { getPopular, getPageById, getIncomingLinks } = require("./database");

const router = express.Router();

router.get("/info", (req, res) => {
  res.json({ name: process.env.SERVER_NAME || "COMP4601" });
});

router.get("/pages/:id", (req, res) => {
  const page = getPageById.get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: "Page not found" });
  }

  const incoming = getIncomingLinks.all(page.origUrl, page.dataset);
  res.json({
    webUrl: page.origUrl,
    incomingLinks: incoming.map((row) => row.source_url),
  });
});

router.get("/:datasetName/popular", (req, res) => {
  const { datasetName } = req.params;
  const rows = getPopular.all(datasetName);

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const result = rows.map((row) => ({
    url: `${baseUrl}/pages/${row.id}`,
    origUrl: row.origUrl,
  }));

  res.json({ result });
});

module.exports = router;
