const { crawl } = require("./src/crawler");

const datasetName = process.argv[2];

if (!datasetName) {
  console.error("Usage: node crawl.js <datasetName>");
  console.error("Available datasets: tinyfruits, fruits100, fruitsA, fruitgraph");
  process.exit(1);
}

crawl(datasetName).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
