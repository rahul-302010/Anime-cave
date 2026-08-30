/**
 * Episode catalog - maps versions (Sub/Dub/Tamil) to sources
 * External = streaming only (YouTube/Crunchyroll), Local = owned files with download
 * file: backend/src/services/episodeCatalog.js:1
 */
import fs from "fs";
import path from "path";
import { getMuseVideoId, MUSE_CHANNEL } from "./youtubeMapping.js";

const CRUNCHYROLL_BASE = "https://www.crunchyroll.com/search?q=";

function slugify(name) {
  return (name || `anime-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0,40) || "anime";
}

// Generate deterministic episode list per anime
export function getEpisodeCatalog(animeId, media) {
  const title = media?.title?.english || media?.title?.romaji || `Anime ${animeId}`;
  const totalEpisodes = media?.episodes || 12;
  const count = Math.min(totalEpisodes, 24); // cap for demo

  // Determine which versions available - demo logic:
  // Sub always, Dub if popularity > 50000, Tamil if genres includes Action or id%3==0
  const versions = [];
  versions.push({ key: "sub", label: "SUB", fullLabel: "Sub (Japanese + English Subtitles)", available: true });
  const hasDub = (media?.popularity || 0) > 40000 || Number(animeId) % 2 === 0;
  if (hasDub) versions.push({ key: "dub", label: "English Dub", fullLabel: "English Dub", available: true });
  const hasTamil = (media?.genres || []).includes("Action") || Number(animeId) % 3 === 0;
  if (hasTamil) versions.push({ key: "tamil", label: "Tamil Dub", fullLabel: "Tamil Dub (if available)", available: true });

  // Check local files - structured paths: /downloads/<slug>/episode-<n>-<quality>.mp4 + legacy flat
  const localDir = path.resolve(process.env.LOCAL_CONTENT_DIR || path.join(process.cwd(), "..", "local_content", "videos"));
  const downloadedDir = path.resolve(process.env.DOWNLOAD_DIR || path.join(process.cwd(), "..", "downloads"));
  const slug = slugify(title);

  const episodesByVersion = {};

  for (const v of versions) {
    const eps = [];
    for (let i = 1; i <= count; i++) {
      // STRICT: Muse India validated YouTube mapping - never random
      const muse = getMuseVideoId(title, i, animeId);
      const ytId = muse.videoId;
      // structured file names per spec: /downloads/<anime-slug>/episode-<n>-<quality>.mp4
      // For V1 we support both flat (legacy) and structured: check both
      const legacyName = `${animeId}_${v.key}_ep${i}.mp4`;
      const structuredBase = `${slug}/episode-${i}-${v.key}`;
      const flat720 = `${legacyName.replace(".mp4","")}_720p.mp4`;
      const flat480 = `${legacyName.replace(".mp4","")}_480p.mp4`;
      const structured720 = path.join(slug, `episode-${i}-${v.key}-720p.mp4`);
      const structured480 = path.join(slug, `episode-${i}-${v.key}-480p.mp4`);
      const candidates = [
        path.join(downloadedDir, structured720), path.join(downloadedDir, structured480),
        path.join(localDir, structured720), path.join(localDir, structured480),
        path.join(downloadedDir, legacyName), path.join(localDir, legacyName),
        path.join(downloadedDir, flat720), path.join(downloadedDir, flat480)
      ];
      const hasLocal = candidates.some(p => fs.existsSync(p));
      // find first existing for file reference
      const existingFile = candidates.find(p => fs.existsSync(p));
      const relativeFile = existingFile ? path.relative(existingFile.includes(downloadedDir) ? downloadedDir : localDir, existingFile).replace(/\\/g,"/") : null;
      const localFileName = relativeFile || structured720.replace(/\\/g,"/"); // default to structured for new downloads

      // Determine source type - STRICT: version-based, not alternating (fixes user confusion)
      // sub/tamil -> YouTube (Muse India embed), dub -> Crunchyroll external, local if file exists
      let source;
      if (hasLocal) {
        // LOCAL ONLY - VLC player, not YouTube/Crunchyroll
        source = {
          type: "local",
          file: `/downloads/${localFileName}`,
          fileName: localFileName,
          streamUrl: `/api/downloads/stream/${encodeURIComponent(localFileName)}`,
          qualities: ["480p", "720p"],
          availableQualities: {
            "480p": { file: `/downloads/${localFileName.replace("720p","480p")}`, exists: fs.existsSync(candidates[1]) || fs.existsSync(candidates[3]) },
            "720p": { file: `/downloads/${localFileName}`, exists: true }
          },
          subtitles: [
            { lang: "en", label: "English", url: `/api/subtitles/${animeId}_${v.key}_ep${i}_en.vtt` },
            ...(v.key === "tamil" ? [{ lang: "ta", label: "Tamil", url: `/api/subtitles/${animeId}_${v.key}_ep${i}_ta.vtt` }] : [])
          ]
        };
      } else if (v.key === "dub") {
        // DUB -> Crunchyroll external only (never embed)
        const crUrl = `${CRUNCHYROLL_BASE}${encodeURIComponent(title + " episode " + i + " " + v.label)}`;
        source = {
          type: "crunchyroll",
          url: crUrl,
          searchUrl: crUrl, // backward compat
          note: "Opens in external browser - never embedded per Crunchyroll policy"
        };
      } else {
        // SUB / TAMIL -> YouTube Muse India validated embed (all episodes same source, no alternating confusion)
        source = {
          type: "youtube",
          videoId: ytId,
          // required format per spec
          embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`,
          watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
          url: `https://www.youtube.com/watch?v=${ytId}`,
          channel: MUSE_CHANNEL,
          query: muse.query,
          validated: muse.validated,
          embeddable: true,
          note: `Muse India validated • Query: "${muse.query}" • Channel must be "${MUSE_CHANNEL}" • Title contains "Episode"`,
          subtitles: [{ lang: "en", label: "English (YouTube CC)" }]
        };
      }

      eps.push({
        id: `${animeId}-${v.key}-${i}`,
        animeId: Number(animeId),
        version: v.key,
        episodeNumber: i,
        title: `Episode ${i}`,
        thumbnail: media?.coverImage?.large || null,
        duration: media?.duration ? `${media.duration} min` : "24 min",
        source
      });
    }
    episodesByVersion[v.key] = eps;
  }

  return { animeId: Number(animeId), title, versions, episodesByVersion, totalEpisodes: count };
}

// Library scanner for downloaded/owned files - recursive, supports structured /anime-name/episode-n-quality.mp4
export function scanLibrary() {
  const dirs = [
    path.resolve(process.env.DOWNLOAD_DIR || path.join(process.cwd(), "..", "downloads")),
    path.resolve(process.env.LOCAL_CONTENT_DIR || path.join(process.cwd(), "..", "local_content", "videos"))
  ];
  const files = [];
  function walk(base, current) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        walk(base, full);
      } else if (e.isFile() && e.name.endsWith(".mp4")) {
        const stat = fs.statSync(full);
        const rel = path.relative(base, full).replace(/\\/g, "/");
        // parse structured: <slug>/episode-<num>-<version>-<quality>.mp4  or legacy: <id>_<version>_ep<num>.mp4
        let animeId = null, version = null, episodeNumber = null, quality = null, slug = null;
        const structured = rel.match(/^([^\/]+)\/episode-(\d+)-(sub|dub|tamil)-(\d+p)\.mp4$/);
        const legacy = rel.match(/^(\d+)_(sub|dub|tamil)_ep(\d+)(?:_(\d+p))?\.mp4$/);
        if (structured) {
          slug = structured[1];
          episodeNumber = Number(structured[2]);
          version = structured[3];
          quality = structured[4];
        } else if (legacy) {
          animeId = Number(legacy[1]);
          version = legacy[2];
          episodeNumber = Number(legacy[3]);
          quality = legacy[4] || "720p";
        } else {
          // generic mp4
          slug = path.dirname(rel) !== "." ? path.dirname(rel) : null;
        }
        files.push({
          fileName: rel,
          file: `/downloads/${rel}`,
          animeId,
          slug,
          version,
          episodeNumber,
          quality,
          size: stat.size,
          sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
          path: full,
          streamUrl: `/api/downloads/stream/${encodeURIComponent(rel)}`,
          streamUrlRaw: `/api/downloads/stream/${rel}`,
          dir: base.includes("downloads") ? "downloads" : "local_content"
        });
      }
    }
  }
  for (const dir of dirs) walk(dir, dir);
  return files;
}
