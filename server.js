import express from "express";
import http from "http";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔴 Your actual feed URL
const FEED_URL =
  "https://raw.githubusercontent.com/jenkinscghs/orchestra-updates/main/feed.json";

// Keep latest feed in memory
let latestFeed = [];

// health check
app.get("/health", (req, res) => {
  res.send("OK");
});

// webhook endpoint
app.post("/github-webhook", async (req, res) => {
  console.log("✅ GitHub webhook received");

  try {
    const response = await fetch(FEED_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Feed fetch failed: ${response.status}`);
    }

    const feed = await response.json();

    // newest first
    feed.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    latestFeed = feed;

    console.log(`✅ Feed updated (${feed.length} items)`);
    res.status(200).send("Feed updated");
  } catch (err) {
    console.error("❌ Error updating feed:", err);
    res.status(500).send("Error updating feed");
  }
});

// optional: inspect feed in browser
app.get("/feed", (req, res) => {
  res.json(latestFeed);
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
