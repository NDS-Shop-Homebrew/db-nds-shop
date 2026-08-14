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

// --- API Roadmap ---
app.get("/api/roadmap", (req, res) => {
  res.json([
    { title: "Réouverture du serveur", description: "Le serveur et le catalogue sont en ligne.", done: true },
    { title: "API v1 (jeux / stats / ndsdb)", description: "API publique documentée pour interroger le catalogue.", done: true },
    { title: "Forwarders .cia", description: "Génération automatique des forwarders pour 3DS.", done: true },
    { title: "QR code d'installation", description: "Lien court scannable par la console (3DS/DSi).", done: true },
    { title: "Auto-update dans l'app", description: "Mise à jour automatique de l'application NDS-Shop.", done: false },
    { title: "Nouveaux jeux", description: "Enrichissement continu du catalogue NDS.", done: false },
  ]);
});

// --- Lien court pour le QR code home (URL compacte = QR scannable par une console) ---
app.get("/d", (_req, res) => {
  res.redirect(
    302,
    "https://github.com/NDS-Shop-Homebrew/NDS-Shop/releases/latest/download/NDS-Shop.cia"
  );
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(
    `🚀 Server running on http://0.0.0.0:${PORT} | Mode: ${
      isProduction ? "Production" : "Développement"
    }`
  );
});
