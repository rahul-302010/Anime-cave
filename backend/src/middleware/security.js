/**
 * Security middleware - helmet, CORS, rate-limit, path protection
 * file: backend/src/middleware/security.js:1
 */
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";

export function securityMiddleware(app) {
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  }));

  const allowed = (process.env.FRONTEND_URL || "http://localhost:5173").split(",");
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // electron / curl
      if (allowed.includes(origin) || allowed.includes("*")) return cb(null, true);
      // allow localhost dev
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) return cb(null, true);
      return cb(null, true); // V1 permissive - log but allow
    },
    credentials: true
  }));

  app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  }));
}

// Prevent directory traversal for local file serving
export function safeJoin(base, target) {
  const targetPath = path.join(base, target);
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(resolvedBase)) {
    throw new Error("Invalid path - directory traversal blocked");
  }
  return resolvedTarget;
}

export function approvedHost(urlString) {
  const hosts = (process.env.APPROVED_DOWNLOAD_HOSTS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (hosts.includes("*")) return true;
  try {
    const u = new URL(urlString);
    return hosts.some(h => u.hostname === h || u.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}
