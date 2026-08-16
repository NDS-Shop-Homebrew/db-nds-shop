import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import apiRouter from "./routes/api.js";
import ndsdbRouter from "./routes/ndsdb.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = isProduction
  ? ["https://db-nds-shop.fr"]
  : ["http://localhost:5173"];

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

// --- API v2 (ndsdb - metadata enrichie par serial) ---
app.use("/api/v1/ndsdb", ndsdbRouter);

// --- Lien court pour le QR code home (URL compacte = QR scannable par une console) ---
// FBI n'aime pas les redirects → on proxy le .cia directement (binaire).
const CIA_URL =
  process.env.CIA_URL ||
  "https://github.com/NDS-Shop-Homebrew/NDS-Shop/releases/download/v1.0.0/NDS-Shop.cia";

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
