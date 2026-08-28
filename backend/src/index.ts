import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import { prisma } from "./lib/prisma.js";

import apiRouter from "./routes/api.js";
import ndsdbRouter from "./routes/ndsdb.js";
import authRouter from "./routes/auth.js";
import downloadRouter from "./routes/download.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

const allowedOrigins = [
  "https://db-nds-shop.fr",
  "https://upload.db-nds-shop.fr",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || !isProduction) {
        return callback(null, true);
      }
      return callback(
        new Error("❌ CORS policy does not allow access from this origin."),
        false
      );
    },
    credentials: true,
  })
);

// --- Distribution des assets centralisés ---
const MEDIA_PATH =
  process.env.MEDIA_STORAGE_PATH ||
  path.resolve(process.cwd(), "../../storage/assets");

if (!fs.existsSync(MEDIA_PATH)) {
  fs.mkdirSync(MEDIA_PATH, { recursive: true });
}
app.use("/assets", express.static(MEDIA_PATH));

// --- Rate limiting sur l'API publique ---
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// --- Routes API ---
app.use("/api/v1", apiRouter);
app.use("/api/v1", downloadRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/ndsdb", ndsdbRouter);

// --- Crawlers & Embeds SEO / Discord ---
const BOT_UA =
  /(discordbot|twitterbot|facebookexternalhit|facebookcatalog|telegrambot|slackbot|whatsapp|viber|skypeuripreview|line|pinterest|linkedinbot|bingbot|googlebot|duckduckbot|baiduspider|yandexbot|curl|wget|python-requests|okhttp)/i;
const SITE_URL = process.env.SITE_URL || "https://db-nds-shop.fr";

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const escapeXml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// --- Flux RSS ---
app.get("/rss.xml", async (_req, res) => {
  try {
    const games = await prisma.game.findMany({
      orderBy: { updatedAt: "desc" },
      take: 15,
    });

    const items = games
      .map((g) => {
        const link = `${SITE_URL}/game/${escapeXml(g.id)}`;
        const pub = new Date(g.updatedAt).toUTCString();
        return (
          `\n  <item>\n    <title>${escapeXml(g.title || "?")}</title>\n` +
          `    <link>${link}</link>\n    <guid>${link}</guid>\n    <pubDate>${pub}</pubDate>\n` +
          `    <description>${escapeXml([g.author, g.version].filter(Boolean).join(" · "))}</description>\n  </item>`
        );
      })
      .join("");

    res
      .type("application/rss+xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>NDS-Shop</title>\n` +
          `  <link>${SITE_URL}</link>\n  <description>Nouveaux jeux Nintendo DS disponibles sur NDS-Shop</description>\n` +
          `  <language>fr</language>\n  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>` +
          `${items}\n</channel>\n</rss>`
      );
  } catch (err) {
    res.status(500).send("Error generating RSS feed");
  }
});

// --- Sitemap XML ---
const STATIC_PAGES = [
  { path: "", priority: "1.0" },
  { path: "/game-list", priority: "0.8" },
  { path: "/about", priority: "0.8" },
  { path: "/request", priority: "0.8" },
  { path: "/docs", priority: "0.8" },
  { path: "/favorites", priority: "0.8" },
  { path: "/tutorial", priority: "0.8" },
  { path: "/privacy", priority: "0.8" },
  { path: "/dmca", priority: "0.8" },
];

app.get("/sitemap.xml", async (_req, res) => {
  try {
    const staticUrls = STATIC_PAGES.map(
      (p) =>
        `\n<url><loc>${SITE_URL}${p.path}</loc><priority>${p.priority}</priority></url>`
    ).join("");

    const games = await prisma.game.findMany({
      select: { id: true, updatedAt: true },
    });

    const gameUrls = games
      .map((g) => {
        const slug = encodeURIComponent(g.id);
        const lastmod = g.updatedAt
          ? `<lastmod>${escapeXml(new Date(g.updatedAt).toISOString().slice(0, 10))}</lastmod>`
          : "";
        return `\n<url><loc>${SITE_URL}/game/${slug}</loc>${lastmod}<priority>0.9</priority></url>`;
      })
      .join("");

    res
      .type("application/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${gameUrls}\n</urlset>`
      );
  } catch (err) {
    res.status(500).send("Error generating Sitemap");
  }
});

// --- Embeds crawlers ---
app.get(/^\/game\/.+/, async (req, res) => {
  const ua = String(req.headers["user-agent"] || "");
  if (!BOT_UA.test(ua)) return res.status(404).send("Not found");

  const slug = decodeURIComponent(req.path.replace(/^\/game\//, ""));
  const url = `${SITE_URL}/game/${encodeURIComponent(slug)}`;

  const game = await prisma.game.findUnique({
    where: { id: slug },
  });

  if (!game) {
    return res
      .type("html")
      .send(
        `<!doctype html><html><head><meta charset="utf-8"/><title>NDS-Shop</title>` +
          `<meta property="og:title" content="NDS-Shop"/><meta property="og:url" content="${escapeHtml(url)}"/>` +
          `<meta property="og:image" content="${SITE_URL}/assets/logo.png"/></head><body></body></html>`
      );
  }

  const title = escapeHtml(game.title || "NDS-Shop");
  const desc = escapeHtml(
    [game.author, game.version].filter(Boolean).join(" · ") ||
      "Jeu Nintendo DS sur NDS-Shop"
  );
  const image = game.iconUrl ? escapeHtml(game.iconUrl) : `${SITE_URL}/assets/logo.png`;

  res.type("html").send(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>` +
      `<title>${title} — NDS-Shop</title>` +
      `<meta name="description" content="${desc}"/>` +
      `<meta property="og:type" content="website"/>` +
      `<meta property="og:site_name" content="NDS-Shop"/>` +
      `<meta property="og:title" content="${title}"/>` +
      `<meta property="og:description" content="${desc}"/>` +
      `<meta property="og:url" content="${escapeHtml(url)}"/>` +
      `<meta property="og:image" content="${image}"/>` +
      `<meta name="twitter:card" content="summary"/>` +
      `<meta name="twitter:title" content="${title}"/>` +
      `<meta name="twitter:description" content="${desc}"/>` +
      `<meta name="twitter:image" content="${image}"/>` +
      `</head><body></body></html>`
  );
});

// --- Lien court QR Code ---
const CIA_URL =
  process.env.CIA_URL ||
  "https://github.com/NDS-Shop-Homebrew/NDS-Shop/releases/latest/download/NDS-Shop.cia";

let ciaCache: { buf: Buffer; at: number } | null = null;

app.get("/d", async (_req, res) => {
  try {
    if (!ciaCache || Date.now() - ciaCache.at > 10 * 60 * 1000) {
      const resp = await fetch(CIA_URL, { signal: AbortSignal.timeout(15000) });
      if (!resp.ok) throw new Error(`GitHub ${resp.status}`);
      const buf = await resp.buffer();
      if (buf.length > 100 * 1024 * 1024)
        throw new Error("Fichier trop volumineux");
      ciaCache = { buf, at: Date.now() };
    }
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", ciaCache.buf.length);
    res.send(ciaCache.buf);
  } catch (err) {
    res.status(502).send(`Erreur téléchargement : ${(err as Error).message}`);
  }
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(
    `🚀 Server running on http://0.0.0.0:${PORT} | Mode: ${
      isProduction ? "Production" : "Développement"
    }`
  );
  console.log(`📁 Assets directory: ${MEDIA_PATH}`);
});