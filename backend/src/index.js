/**
 * Anime Cave Backend - entry
 * file: backend/src/index.js:1
 */
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { securityMiddleware, safeJoin } from "./middleware/security.js";
import animeRouter from "./routes/anime.js";
import downloadsRouter from "./routes/downloads.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// middleware
securityMiddleware(app);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "V1", timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// anime proxy
app.use("/api/anime", animeRouter);

// downloads & local streaming
app.use("/api/downloads", downloadsRouter);

// subtitles - serve from local_content/subtitles and downloads
app.get("/api/subtitles/:fileName", (req, res) => {
  try {
    const fileName = req.params.fileName;
    if (!/^[\w\-\.]+\.(vtt|srt)$/.test(fileName)) return res.status(400).json({ error: "Invalid subtitle file" });
    const candidates = [
      path.resolve(process.env.LOCAL_CONTENT_DIR ? path.join(process.env.LOCAL_CONTENT_DIR, "..", "subtitles") : path.join(process.cwd(), "..", "local_content", "subtitles")),
      path.resolve(path.join(process.cwd(), "..", "local_content", "subtitles")),
      path.resolve(path.join(process.cwd(), "..", "downloads"))
    ];
    // also try LOCAL_CONTENT_DIR itself if it is videos folder
    for (const base of candidates) {
      try {
        const full = safeJoin(base, fileName);
        if (fs.existsSync(full)) {
          const ext = path.extname(full).toLowerCase();
          const ct = ext === ".vtt" ? "text/vtt" : "application/x-subrip";
          res.setHeader("Content-Type", ct);
          return res.sendFile(full);
        }
      } catch {}
    }
    // return empty vtt if not found (graceful)
    res.setHeader("Content-Type", "text/vtt");
    return res.send("WEBVTT\n\n1\n00:00:00.000 --> 00:00:05.000\nSubtitle not available for this episode\n");
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// fallback for downloaded videos listing (also via /api/downloads/library)
app.get("/api/versions", (req, res) => {
  res.json({
    versions: [
      { key: "sub", label: "SUB", desc: "Japanese + English subtitles" },
      { key: "dub", label: "English Dub", desc: "English dubbed audio" },
      { key: "tamil", label: "Tamil Dub", desc: "Tamil dubbed (if available)" }
    ],
    constraints: {
      external: "streaming only (YouTube embed / Crunchyroll redirect)",
      local: "streaming + download (owned content only)",
      downloadQualities: ["480p", "720p"]
    }
  });
});

// 404
app.use((req, res) => res.status(404).json({ error: "Not found", path: req.path }));

// error handler
app.use((err, req, res, next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Internal error", details: err.message });
});

app.listen(PORT, () => {
  console.log(`🦊 Anime Cave Backend V1 running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Trending: http://localhost:${PORT}/api/anime/trending`);
  console.log(`   Frontend allowed: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
});
