import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import apiRouter, { loadGames } from "./routes/api.js";
import ndsdbRouter from "./routes/ndsdb.js";
import authRouter from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const isProduction = process.env.NODE_ENV === "production";

// Derrière nginx (X-Forwarded-For) : requis par express-rate-limit
app.set("trust proxy", true);

const allowedOrigins = ["https://db-nds-shop.fr", "http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        return callback(
          new Error(
            "❌ La politique CORS de ce serveur ne permet pas l'accès depuis cette origine."
          ),
          false
        );
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Rate limiting sur l'API publique
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!DISCORD_BOT_TOKEN) {
  console.warn("⚠️  DISCORD_BOT_TOKEN non défini — routes Discord désactivées");
}

// --- API v1 (jeux) ---
app.use("/api/v1", apiRouter);

// --- Auth Discord (OAuth2) ---
app.use("/api/v1/auth", authRouter);

// --- API v2 (ndsdb - metadata enrichie par serial) ---
app.use("/api/v1/ndsdb", ndsdbRouter);

// --- Embeds pour crawlers (Discord, Twitter, Telegram, Slack, SEO...) ---
// En production, nginx envoie les requêtes de bots sur /game/* vers ce backend.
// Les navigateurs normaux continuent de recevoir le SPA (index.html).
const BOT_UA =
  /(discordbot|twitterbot|facebookexternalhit|facebookcatalog|telegrambot|slackbot|whatsapp|viber|skypeuripreview|line|pinterest|linkedinbot|bingbot|googlebot|duckduckbot|baiduspider|yandexbot|curl|wget|python-requests|okhttp)/i;
const SITE_URL = process.env.SITE_URL || "https://db-nds-shop.fr";
const escapeHtml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escapeXml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// --- Flux RSS des nouveaux jeux ---
app.get("/rss.xml", (_req, res) => {
  const games = loadGames()
    .filter((g) => g.updated)
    .sort((a, b) => String(b.updated).localeCompare(String(a.updated)))
    .slice(0, 30);
  const items = games
    .map((g) => {
      const link = `${SITE_URL}/game/${escapeXml(g.fileName)}`;
      const pub = new Date(g.updated).toUTCString();
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
        `  <link>${SITE_URL}</link>\n  <description>New Nintendo DS games available on NDS-Shop</description>\n` +
        `  <language>en</language>\n  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>` +
        `${items}\n</channel>\n</rss>`
    );
});

app.get(/^\/game\/.+/, (req, res) => {
  const ua = String(req.headers["user-agent"] || "");
  if (!BOT_UA.test(ua)) return res.status(404).send("Not found");
  const slug = decodeURIComponent(req.path.replace(/^\/game\//, ""));
  const game = loadGames().find((g) => (g.fileName || g.slug) === slug);
  const url = `${SITE_URL}/game/${encodeURIComponent(slug)}`;
  if (!game) {
    return res
      .type("html")
      .send(`<!doctype html><html><head><meta charset="utf-8"/><title>NDS-Shop</title>` +
        `<meta property="og:title" content="NDS-Shop"/><meta property="og:url" content="${escapeHtml(url)}"/>` +
        `<meta property="og:image" content="${SITE_URL}/logo.png"/></head><body></body></html>`);
  }
  const title = escapeHtml(game.title || "NDS-Shop");
  const desc = escapeHtml([game.author, game.version].filter(Boolean).join(" · ") || "Jeu Nintendo DS sur NDS-Shop");
  const image = game.icon ? escapeHtml(game.icon) : `${SITE_URL}/logo.png`;
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

// --- Lien court pour le QR code home (URL compacte = QR scannable par une console) ---
// FBI n'aime pas les redirects → on proxy le .cia directement (binaire).
const CIA_URL =
  process.env.CIA_URL ||
  "https://github.com/NDS-Shop-Homebrew/NDS-Shop/releases/latest/download/NDS-Shop.cia";

app.get("/d", async (_req, res) => {
  try {
    const resp = await fetch(CIA_URL);
    if (!resp.ok) throw new Error(`GitHub ${resp.status}`);
    const buf = await resp.buffer();
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", buf.length);
    res.send(buf);
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
});
