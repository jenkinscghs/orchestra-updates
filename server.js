import express from "express";
import fetch from "node-fetch";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.json());

// 🔁 CHANGE THIS to your actual GitHub raw JSON URL
const FEED_URL =
  "https://raw.githubusercontent.com/YOURNAME/YOURREPO/main/feed.json";

let latestFeed = [];

// WebSocket server

const server = app.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on("connection", ws => {
  clients.add(ws);

  // Send latest feed immediately
  if (latestFeed.length) {
    ws.send(JSON.stringify(latestFeed));
  }

  ws.on("close", () => clients.delete(ws));
});

// Fetch & broadcast feed
async function updateFeed() {
  const res = await fetch(FEED_URL, { cache: "no-store" });
  const feed = await res.json();

  feed.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  latestFeed = feed;

  const payload = JSON.stringify(feed);
  for (const ws of clients) ws.send(payload);
}

// GitHub webhook endpoint
app.post("/github-webhook", async (req, res) => {
  await updateFeed();
  res.sendStatus(200);
});

// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

``
