import express from "express";
import fetch from "node-fetch";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.json());

// 🔴 IMPORTANT: replace these with YOUR actual values
const FEED_URL =
  "https://raw.githubusercontent.com/jenkinscghs/orchestra-updates/main/feed.json";

// Render provides the port dynamically
const PORT = process.env.PORT || 3000;

// Create ONE HTTP server (required for Render + WebSockets)
const server = http.createServer(app);

// Attach WebSocket server to the SAME HTTP server
const wss = new WebSocketServer({ server });

let latestFeed = [];

// --- WebSocket handling ---
wss.on("connection", ws => {
  console.log("WebSocket client connected");

  // Always send the latest feed immediately
  if (latestFeed.length > 0) {
    ws.send(JSON.stringify(latestFeed));
  }

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});

// --- Helper: fetch feed + broadcast ---
async function updateFeed() {
  console.log("Fetching feed…");

  const res = await fetch(FEED_URL, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch feed: ${res.status}`);
  }

  const feed = await res.json();

  // newest first
  feed.sort((a, b) => new Date(b.ts) - new Date(a.ts));

  latestFeed = feed;

  const payload = JSON.stringify(feed);

  // Broadcast to all connected clients
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

// --- GitHub webhook ---
app.post("/github-webhook", async (req, res) => {
  try {
    await updateFeed();
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// --- Health check ---
app.get("/health", (req, res) => {
  res.send("OK");
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
