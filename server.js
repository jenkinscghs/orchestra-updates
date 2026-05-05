import express from "express";
import http from "http";

const app = express();

// IMPORTANT: GitHub requires JSON parsing
app.use(express.json());

const PORT = process.env.PORT || 3000;

// LOG EVERY REQUEST (critical for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// health check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// webhook endpoint (MUST respond immediately)
app.post("/github-webhook", (req, res) => {
  console.log("✅ GitHub webhook received");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));

  // respond immediately
  res.status(200).send("Webhook received");
});

// create server (Render-safe)
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
