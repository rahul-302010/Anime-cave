/**
 * Download & local streaming routes
 * - Only allow downloads from approved sources (owned/legal content)
 * - External (YouTube/Crunchyroll) = streaming only, no download
 * file: backend/src/routes/downloads.js:1
 */
import express from "express";
import fs from "fs";
import path from "path";
import { approvedHost, safeJoin } from "../middleware/security.js";
import { scanLibrary } from "../services/episodeCatalog.js";

const router = express.Router();

function getDirs() {
  return {
    downloadDir: path.resolve(process.env.DOWNLOAD_DIR || path.join(process.cwd(), "..", "downloads")),
    localDir: path.resolve(process.env.LOCAL_CONTENT_DIR || path.join(process.cwd(), "..", "local_content", "videos")),
    subtitleDir: path.resolve(path.join(process.cwd(), "..", "local_content", "subtitles"))
  };
}

// Ensure dirs exist
function ensureDirs() {
  const { downloadDir, localDir, subtitleDir } = getDirs();
  for (const d of [downloadDir, localDir, subtitleDir]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}
ensureDirs();

// GET /api/downloads/library
router.get("/library", (req, res) => {
  try {
    const files = scanLibrary();
    res.json({ count: files.length, files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/downloads/stream/:fileName - stream local mp4 with range support
router.get("/stream/:fileName", (req, res) => {
  try {
    const { downloadDir, localDir } = getDirs();
    const fileName = req.params.fileName;
    if (!/^[\w\-\.]+\.mp4$/.test(fileName)) return res.status(400).json({ error: "Invalid file name" });

    let filePath;
    try {
      // try downloads first, then local_content
      filePath = safeJoin(downloadDir, fileName);
      if (!fs.existsSync(filePath)) filePath = safeJoin(localDir, fileName);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found", fileName });

    const stat = fs.statSync(filePath);
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunk = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunk,
        "Content-Type": "video/mp4"
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": stat.size,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes"
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (e) {
    console.error("[stream]", e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/downloads/request - download from approved source only
// body: { url, fileName, quality: "480p"|"720p" }
router.post("/request", async (req, res) => {
  try {
    const { url, fileName, quality } = req.body || {};
    if (!url || !fileName) return res.status(400).json({ error: "url and fileName required" });
    if (!/^[\w\-\.]+\.mp4$/.test(fileName)) return res.status(400).json({ error: "Invalid fileName" });
    if (quality && !["480p", "720p"].includes(quality)) return res.status(400).json({ error: "quality must be 480p or 720p" });

    // Security: block youtube/crunchyroll
    const lower = url.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("crunchyroll.com")) {
      return res.status(403).json({ error: "Downloads from YouTube/Crunchyroll not allowed - streaming only. Offline is for owned/legal content only." });
    }
    if (!approvedHost(url)) {
      return res.status(403).json({ error: "Host not approved. Only allow downloads from approved sources", approved: (process.env.APPROVED_DOWNLOAD_HOSTS || "").split(",") });
    }

    const { downloadDir } = getDirs();
    ensureDirs();
    const dest = safeJoin(downloadDir, fileName);
    if (fs.existsSync(dest)) return res.json({ message: "Already downloaded", fileName, streamUrl: `/api/downloads/stream/${encodeURIComponent(fileName)}` });

    // stream download
    console.log(`[download] ${url} -> ${dest} (${quality || "default"})`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed ${response.status} ${response.statusText}`);
    if (!response.body) throw new Error("No body");

    const fileStream = fs.createWriteStream(dest);
    const reader = response.body.getReader ? response.body.getReader() : null;
    if (reader) {
      // web stream
      const writer = fileStream;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        writer.write(Buffer.from(value));
      }
      writer.end();
      await new Promise((resolve, reject) => {
        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
      });
    } else {
      // node stream fallback
      const { pipeline } = await import("stream/promises");
      await pipeline(response.body, fileStream);
    }

    res.json({ message: "Download complete", fileName, quality: quality || "original", streamUrl: `/api/downloads/stream/${encodeURIComponent(fileName)}`, size: fs.statSync(dest).size });
  } catch (e) {
    console.error("[download request]", e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/downloads/:fileName
router.delete("/:fileName", (req, res) => {
  try {
    const { downloadDir } = getDirs();
    const fileName = req.params.fileName;
    if (!/^[\w\-\.]+\.mp4$/.test(fileName)) return res.status(400).json({ error: "Invalid file name" });
    const filePath = safeJoin(downloadDir, fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
    fs.unlinkSync(filePath);
    res.json({ message: "Deleted", fileName });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/subtitles/:file - serve .vtt/.srt
router.get("/../subtitles/:fileName", (req, res) => {
  // This is mounted separately in index.js; kept for reference
  res.status(404).json({ error: "Use /api/subtitles/:file" });
});

export default router;
