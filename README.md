# COMP 4601A - Lab 3: Web Crawler + RESTful API

A BFS web crawler that crawls HTML datasets, stores pages and link relationships in SQLite, and exposes a REST API for querying popular pages and incoming links.

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Crawling Datasets

Crawl a dataset by name. The crawler uses BFS with 10 concurrent requests.

```bash
node crawl.js <datasetName>
```

Available datasets:

| Dataset | Pages | Seed URL |
|---------|-------|----------|
| tinyfruits | 10 | `https://people.scs.carleton.ca/~avamckenney/tinyfruits/N-0.html` |
| fruits100 | 100 | `https://people.scs.carleton.ca/~avamckenney/fruits100/N-0.html` |
| fruitsA | ~1000 | `https://people.scs.carleton.ca/~avamckenney/fruitsA/N-0.html` |
| fruitgraph | 1000 | `https://people.scs.carleton.ca/~avamckenney/fruitgraph/N-0.html` |

Example:

```bash
node crawl.js tinyfruits
node crawl.js fruits100
node crawl.js fruitsA
```

Crawl data is stored in `data/crawler.db`. Re-crawling a dataset clears its previous data first.

## Starting the Server

```bash
SERVER_NAME=yourServerName node src/index.js
```

The server runs on port 3000.

## API Endpoints

### `GET /info`

Returns the server name. Used by the grading server's INFO test.

```json
{ "name": "yourServerName" }
```

### `GET /:datasetName/popular`

Returns the top 10 pages by incoming link count for a given dataset.

```json
{
  "result": [
    { "url": "http://yourHost:3000/pages/1", "origUrl": "https://..." },
    { "url": "http://yourHost:3000/pages/2", "origUrl": "https://..." }
  ]
}
```

### `GET /pages/:id`

Returns details for a specific crawled page, including its incoming links.

```json
{
  "webUrl": "https://...",
  "incomingLinks": ["https://...", "https://..."]
}
```

## Connecting to the Lab Grading Server

### 1. Deploy to OpenStack

- Create an instance using the `COMP4601A-W26.2026-01-08` snapshot
- Add the `ping-ssh-egress` and `web3000` security groups
- Assign a floating IP
- SSH into the instance, clone this repo, and run `npm install`

### 2. Crawl all required datasets

```bash
node crawl.js tinyfruits
node crawl.js fruits100
node crawl.js fruitsA
```

### 3. Start the server

```bash
SERVER_NAME=yourServerName node src/index.js
```

Replace `yourServerName` with the name you receive after registering (step 4).

### 4. Register your server

```bash
curl -X POST http://134.117.26.91:3000/servers \
  -H "Content-Type: application/json" \
  -d '{
    "serverAddress": "http://yourFloatingIP:3000",
    "members": ["studentId1", "studentId2"],
    "key": "yourServerKey"
  }'
```

You will receive a server name in the response. Use this as your `SERVER_NAME`.

### 5. Enable the L3 test

```bash
curl -X PUT http://134.117.26.91:3000/servers/yourServerName \
  -H "Content-Type: application/json" \
  -d '{
    "key": "yourServerKey",
    "running": { "INFO": true, "L3": true }
  }'
```

### 6. Check results

Visit `http://134.117.26.91:3000/results` to see your test status.
