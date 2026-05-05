import express from "express";
import http from "http";
import fetch from "node-fetch";

const app = express();
app.use(express.json());


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});


const PORT = process.env.PORT || 3000;

const FEED_API_URL =
  "https://api.github.com/repos/jenkinscghs/orchestra-updates/contents/feed.json";


let latestFeed = [];

// helper to fetch feed

async function fetchFeed() {
  const res = await fetch(FEED_API_URL, {
    headers: {
      "Accept": "application/vnd.github.v3.raw",
      "User-Agent": "orchestra-updates-feed"
    }
  });

  if (!res.ok) {
    throw new Error(`Feed fetch failed: ${res.status}`);
  }

  const feed = await res.json();
  feed.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  latestFeed = feed;
  return feed;
}
``


// health check
app.get("/health", (req, res) => {
  res.send("OK");
});

// webhook (update feed immediately)
app.post("/github-webhook", async (req, res) => {
  try {
    console.log("✅ Webhook received");
    await fetchFeed();
    console.log(`✅ Feed updated (${latestFeed.length} items)`);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// feed endpoint (auto-heals after sleep)
app.get("/feed", async (req, res) => {
  try {
    if (latestFeed.length === 0) {
      console.log("ℹ️ Feed empty, fetching...");
      await fetchFeed();
    }
    res.json(latestFeed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load feed" });
  }
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
