/**
 * Download & local streaming routes - FIXED V1
 * Strict rules: YouTube/Crunchyroll = streaming only, never download
 * Only local/owned content allowed, structured paths, quality control
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

function slugify(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0,40) || "anime";
}

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

// Helper: resolve file path securely (supports nested /anime/episode-1-720p.mp4)
function resolveFile(fileParam) {
  const { downloadDir, localDir } = getDirs();
  // decodeURIComponent already done by Express for params, but for wildcard we decode manually
  let rel = decodeURIComponent(fileParam);
  // Prevent traversal: must not contain .. and must be normalized
  if (rel.includes("..") || path.isAbsolute(rel)) throw new Error("Invalid path - traversal blocked");
  // Only allow .mp4, allow subdirectories with alphanumeric, hyphen, underscore, slash, dot
  if (!/^[\w\-\/\.]+$/.test(rel) || !rel.endsWith(".mp4")) throw new Error("Invalid file name");
  // normalize and re-validate
  const normalized = path.normalize(rel).replace(/\\/g, "/");
  if (normalized.startsWith("..") || normalized.includes("../")) throw new Error("Invalid path");

  let filePath;
  try {
    filePath = safeJoin(downloadDir, normalized);
    if (!fs.existsSync(filePath)) filePath = safeJoin(localDir, normalized);
    // also try flat fallback for legacy
    if (!fs.existsSync(filePath)) {
      const flat = path.basename(normalized);
      const flatPathDown = safeJoin(downloadDir, flat);
      if (fs.existsSync(flatPathDown)) return flatPathDown;
      const flatPathLocal = safeJoin(localDir, flat);
      if (fs.existsSync(flatPathLocal)) return flatPathLocal;
    }
  } catch (e) {
    throw e;
  }
  return filePath;
}

// GET /api/downloads/stream/* - supports nested paths like /anime-name/episode-1-720p.mp4
router.get("/stream/:fileName", handleStream);
router.get("/stream/*", (req, res) => {
  // wildcard: req.params[0] contains path after /stream/
  const fileParam = req.params[0] || req.params.fileName || "";
  req.params.fileName = fileParam;
  return handleStream(req, res);
});

function handleStream(req, res) {
  try {
    let fileParam = req.params.fileName || req.params[0] || "";
    // Express may have encoded slash: handle both
    if (!fileParam && req.url.includes("/stream/")) {
      fileParam = decodeURIComponent(req.url.split("/stream/")[1].split("?")[0]);
    }
    if (!fileParam) return res.status(400).json({ error: "fileName required" });

    // allow encoded slash %2F
    fileParam = decodeURIComponent(fileParam);

    let filePath;
    try {
      filePath = resolveFile(fileParam);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    if (!fs.existsSync(filePath)) {
      console.log(`[stream] not found: ${fileParam} -> ${filePath}`);
      return res.status(404).json({ error: "File not found", file: fileParam });
    }

    const stat = fs.statSync(filePath);
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      if (isNaN(start) || isNaN(end) || start > end || end >= stat.size) {
        return res.status(416).json({ error: "Range not satisfiable" });
      }
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
}

// POST /api/downloads/request - STRICT: only local/owned, structured, quality controlled
// Accepts: { animeName, animeId, episodeNumber, version, quality, url?, fileName? }
// For backward compat, also supports { url, fileName, quality } but validates structured
router.post("/request", async (req, res) => {
  try {
    const body = req.body || {};
    let { url, fileName, quality, animeName, animeId, episodeNumber, version, sourceType } = body;

    // Validation: quality must be 480p or 720p
    if (quality && !["480p", "720p"].includes(quality)) {
      return res.status(400).json({ error: "quality must be 480p or 720p" });
    }
    quality = quality || "720p";

    // STRICT RULE: block YouTube/Crunchyroll - check URL and sourceType
    const checkUrl = (url || fileName || "").toLowerCase();
    if (checkUrl.includes("youtube.com") || checkUrl.includes("youtu.be") || checkUrl.includes("crunchyroll.com") || sourceType === "youtube" || sourceType === "crunchyroll") {
      console.log(`[download] BLOCKED external: ${url} sourceType=${sourceType}`);
      return res.status(403).json({
        error: "Downloads from YouTube/Crunchyroll not allowed - streaming only. Offline is for owned/legal content only.",
        rule: "Only source.type === 'local' allows download"
      });
    }
    if (url && !approvedHost(url)) {
      return res.status(403).json({
        error: "Host not approved. Only allow downloads from approved sources",
        approved: (process.env.APPROVED_DOWNLOAD_HOSTS || "").split(","),
        hint: "Use owned/local content or add host to APPROVED_DOWNLOAD_HOSTS"
      });
    }

    // Build structured file path: /downloads/<slug>/episode-<n>-<version>-<quality>.mp4
    let structuredRel;
    if (animeName && episodeNumber && version) {
      const slug = slugify(animeName);
      structuredRel = `${slug}/episode-${episodeNumber}-${version}-${quality}.mp4`;
    } else if (fileName) {
      // Validate fileName
      const decoded = decodeURIComponent(fileName);
      if (decoded.includes("..") || path.isAbsolute(decoded)) {
        return res.status(400).json({ error: "Invalid fileName - traversal blocked" });
      }
      // If fileName already structured (contains /), use it directly
      if (decoded.includes("/")) {
        if (!/^[\w\-\/]+\/episode-\d+-(sub|dub|tamil)-\d+p\.mp4$/.test(decoded) && !/^[\w\-\/]+\.mp4$/.test(decoded)) {
          return res.status(400).json({ error: "Invalid structured fileName" });
        }
        structuredRel = decoded.replace(/\\/g, "/");
        // ensure quality suffix matches requested quality
        if (quality && !structuredRel.includes(quality)) {
          structuredRel = structuredRel.replace(/\d+p\.mp4$/, `${quality}.mp4`);
        }
      } else {
        // flat legacy -> convert to structured if animeName available, else keep flat but validate
        if (!/^[\w\-\.]+\.mp4$/.test(decoded)) return res.status(400).json({ error: "Invalid fileName" });
        // convert flat 21_sub_ep1.mp4 -> add quality suffix
        if (!decoded.includes(quality)) {
          structuredRel = decoded.replace(".mp4", `-${quality}.mp4`);
        } else {
          structuredRel = decoded;
        }
        // if we have slug info, prefer structured
        if (animeName) {
          const slug = slugify(animeName);
          const ep = episodeNumber || decoded.match(/ep(\d+)/)?.[1] || "1";
          const ver = version || (decoded.includes("_dub_") ? "dub" : decoded.includes("_tamil_") ? "tamil" : "sub");
          structuredRel = `${slug}/episode-${ep}-${ver}-${quality}.mp4`;
        }
      }
    } else {
      return res.status(400).json({ error: "fileName or (animeName+episodeNumber+version) required", example: { animeName: "One Piece", episodeNumber: 1, version: "sub", quality: "720p" } });
    }

    // Security: prevent traversal
    if (structuredRel.includes("..") || path.isAbsolute(structuredRel)) {
      return res.status(400).json({ error: "Invalid path" });
    }

    const { downloadDir } = getDirs();
    ensureDirs();
    // ensure subdir exists
    const dest = safeJoin(downloadDir, structuredRel);
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    // Check duplicate
    if (fs.existsSync(dest)) {
      const stat = fs.statSync(dest);
      console.log(`[download] already exists: ${structuredRel}`);
      return res.json({
        status: "success",
        filePath: `/downloads/${structuredRel}`,
        fileName: structuredRel,
        quality,
        streamUrl: `/api/downloads/stream/${encodeURIComponent(structuredRel)}`,
        size: stat.size,
        message: "Already downloaded"
      });
    }

    // Validation before download: check dest is within whitelisted directory
    const relCheck = path.relative(path.resolve(downloadDir), path.resolve(dest));
    if (relCheck.startsWith("..") || path.isAbsolute(relCheck)) {
      return res.status(403).json({ error: "Whitelisted directory violation" });
    }

    // If no URL provided, this is a placeholder for owned content (create empty or simulate)
    // For V1, we require URL for actual fetch, but allow placeholder for local owned testing
    if (!url) {
      // Create a tiny placeholder mp4 (for testing offline playback without external fetch)
      console.log(`[download] creating placeholder for owned content: ${structuredRel}`);
      // Use ffmpeg if available, else create empty file with valid header
      try {
        const ffmpegCandidates = [
          "C:\\Users\\Rahul_Raja\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.1-full_build\\bin\\ffmpeg.exe",
          "ffmpeg"
        ];
        let created = false;
        for (const ff of ffmpegCandidates) {
          try {
            const { spawnSync } = await import("child_process");
            const r = spawnSync(ff, ["-y", "-f", "lavfi", "-i", "color=c=black:s=320x240:d=1:r=24", "-f", "lavfi", "-i", "anullsrc", "-shortest", "-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p", dest], { timeout: 5000 });
            if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { created = true; break; }
          } catch {}
        }
        if (!created) {
          // fallback: create minimal mp4 stub (will still stream but not playable - for test we create binary)
          fs.writeFileSync(dest, Buffer.from("owned placeholder - replace with real owned video"));
        }
      } catch (e) {
        fs.writeFileSync(dest, Buffer.from("placeholder"));
      }
      const stat = fs.statSync(dest);
      return res.json({
        status: "success",
        filePath: `/downloads/${structuredRel}`,
        fileName: structuredRel,
        file: `/downloads/${structuredRel}`,
        quality,
        streamUrl: `/api/downloads/stream/${encodeURIComponent(structuredRel)}`,
        size: stat.size,
        message: "Download complete (placeholder for owned content)"
      });
    }

    // Fetch from approved source
    console.log(`[download] ${url} -> ${dest} (${quality})`);
    console.log(`[download] Download: ${structuredRel} quality=${quality} filePath=/downloads/${structuredRel}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed ${response.status} ${response.statusText}`);
    if (!response.body) throw new Error("No body");

    const fileStream = fs.createWriteStream(dest);
    const reader = response.body.getReader ? response.body.getReader() : null;
    if (reader) {
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
      const { pipeline } = await import("stream/promises");
      await pipeline(response.body, fileStream);
    }

    // Validate file exists and not corrupted
    if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
      throw new Error("Downloaded file missing or empty");
    }
    if (fs.existsSync(dest) && fs.statSync(dest).size < 100) {
      console.warn(`[download] warning: small file ${fs.statSync(dest).size} bytes - may be placeholder`);
    }

    const stat = fs.statSync(dest);
    res.json({
      status: "success",
      filePath: `/downloads/${structuredRel}`,
      file: `/downloads/${structuredRel}`,
      fileName: structuredRel,
      quality,
      streamUrl: `/api/downloads/stream/${encodeURIComponent(structuredRel)}`,
      size: stat.size,
      message: "Download complete"
    });
  } catch (e) {
    console.error("[download request]", e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/downloads/* - supports nested paths
router.delete("/:fileName", handleDelete);
router.delete("/*", (req, res) => {
  const fileParam = req.params[0] || req.params.fileName || "";
  req.params.fileName = fileParam;
  return handleDelete(req, res);
});

function handleDelete(req, res) {
  try {
    let fileParam = req.params.fileName || req.params[0] || "";
    if (!fileParam && req.url.includes("/downloads/")) {
      fileParam = decodeURIComponent(req.url.split("/downloads/")[1].split("?")[0]);
    }
    fileParam = decodeURIComponent(fileParam);
    if (!fileParam) return res.status(400).json({ error: "fileName required" });
    if (fileParam.includes("..") || path.isAbsolute(fileParam)) return res.status(400).json({ error: "Invalid path" });

    const { downloadDir } = getDirs();
    let filePath;
    try {
      filePath = safeJoin(downloadDir, fileParam);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found", file: fileParam });
    fs.unlinkSync(filePath);
    // cleanup empty parent dir
    const dir = path.dirname(filePath);
    try { if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir); } catch {}
    console.log(`[download] deleted: ${fileParam}`);
    res.json({ status: "success", message: "Deleted", fileName: fileParam, filePath: `/downloads/${fileParam}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export default router;
