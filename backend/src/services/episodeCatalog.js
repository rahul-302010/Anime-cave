/**
 * Episode catalog - maps versions (Sub/Dub/Tamil) to sources
 * External = streaming only (YouTube/Crunchyroll), Local = owned files with download
 * file: backend/src/services/episodeCatalog.js:1
 */
import fs from "fs";
import path from "path";

// Mock approved YouTube IDs (real app would have CMS). Using public demo videos.
const YOUTUBE_DEMO = [
  "dQw4w9WgXcQ", // demo placeholder - replace with anime trailers in real
  "9bZkp7q19f0",
  "J---aiyznGQ"
];

const CRUNCHYROLL_BASE = "https://www.crunchyroll.com/search?q=";

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

  // Check local files
  const localDir = path.resolve(process.env.LOCAL_CONTENT_DIR || path.join(process.cwd(), "..", "local_content", "videos"));
  const downloadedDir = path.resolve(process.env.DOWNLOAD_DIR || path.join(process.cwd(), "..", "downloads"));

  const episodesByVersion = {};

  for (const v of versions) {
    const eps = [];
    for (let i = 1; i <= count; i++) {
      const ytId = YOUTUBE_DEMO[(Number(animeId) + i) % YOUTUBE_DEMO.length];
      // local file convention: <animeId>_<version>_ep<i>.mp4
      const localFileName = `${animeId}_${v.key}_ep${i}.mp4`;
      const localPath = path.join(localDir, localFileName);
      const downloadedPath = path.join(downloadedDir, localFileName);
      const hasLocal = fs.existsSync(localPath) || fs.existsSync(downloadedPath);

      // Determine source type
      // For demo: even episodes use YouTube, odd use Crunchyroll - unless local exists
      let source;
      if (hasLocal) {
        source = {
          type: "local",
          fileName: localFileName,
          streamUrl: `/api/downloads/stream/${encodeURIComponent(localFileName)}`,
          qualities: ["480p", "720p"],
          subtitles: [
            { lang: "en", label: "English", url: `/api/subtitles/${animeId}_${v.key}_ep${i}_en.vtt` },
            ...(v.key === "tamil" ? [{ lang: "ta", label: "Tamil", url: `/api/subtitles/${animeId}_${v.key}_ep${i}_ta.vtt` }] : [])
          ]
        };
      } else if (i % 2 === 0) {
        source = {
          type: "youtube",
          videoId: ytId,
          embedUrl: `https://www.youtube.com/embed/${ytId}`,
          watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
          // no direct stream URL exposed - frontend uses embed only
          subtitles: [{ lang: "en", label: "English (YouTube CC)" }]
        };
      } else {
        source = {
          type: "crunchyroll",
          searchUrl: `${CRUNCHYROLL_BASE}${encodeURIComponent(title + " episode " + i + " " + v.label)}`,
          note: "Opens in browser - no embed per Crunchyroll policy"
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

// Library scanner for downloaded/owned files
export function scanLibrary() {
  const dirs = [
    path.resolve(process.env.DOWNLOAD_DIR || path.join(process.cwd(), "..", "downloads")),
    path.resolve(process.env.LOCAL_CONTENT_DIR || path.join(process.cwd(), "..", "local_content", "videos"))
  ];
  const files = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".mp4")) {
        const full = path.join(dir, e.name);
        const stat = fs.statSync(full);
        // parse name: <animeId>_<version>_ep<num>.mp4
        const match = e.name.match(/^(\d+)_(sub|dub|tamil)_ep(\d+)\.mp4$/);
        files.push({
          fileName: e.name,
          animeId: match ? Number(match[1]) : null,
          version: match ? match[2] : null,
          episodeNumber: match ? Number(match[3]) : null,
          size: stat.size,
          sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
          path: full,
          streamUrl: `/api/downloads/stream/${encodeURIComponent(e.name)}`,
          dir: dir.includes("downloads") ? "downloads" : "local_content"
        });
      }
    }
  }
  return files;
}
