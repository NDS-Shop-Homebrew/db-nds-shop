import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import apiRouter from "./routes/api.js";

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

// --- Types enrichis ---
interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  discriminator: string;
  avatar: string | null;
  banner?: string | null;
  accent_color?: number | null;
  bio?: string | null;
  public_flags?: number;
}

// Helper JSON
async function safeJson<T>(response: any): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
}

// --- API v1 (jeux) ---
app.use("/api/v1", apiRouter);

if (DISCORD_BOT_TOKEN) {
  // --- API Discord User ---
  app.get("/api/discord-user/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const response = await fetch(`https://discord.com/api/v10/users/${id}`, {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      });

      if (!response.ok) {
        const errorData = await safeJson<any>(response);
        return res.status(response.status).json({ error: errorData });
      }

      const data = await safeJson<DiscordUser>(response);

      res.json({
        id: data.id,
        username: data.username,
        global_name: data.global_name,
        discriminator: data.discriminator,
        avatar: data.avatar,
        banner: data.banner,
        accent_color: data.accent_color,
        bio: data.bio,
        public_flags: data.public_flags,
      });
    } catch (err) {
      console.error("❌ Failed to fetch Discord user:", err);
      res.status(500).json({ error: "Failed to fetch from Discord" });
    }
  });

  // --- API Presence (via Lanyard) ---
  app.get("/api/discord-presence/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const response = await fetch(`https://api.lanyard.rest/v1/users/${id}`);
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: "Failed to fetch Lanyard" });
      }
      const data = await safeJson<any>(response);
      res.json(data.data);
    } catch (err) {
      console.error("❌ Failed to fetch Lanyard presence:", err);
      res.status(500).json({ error: "Failed to fetch presence" });
    }
  });
}

// --- API Roadmap ---
app.get("/api/roadmap", (req, res) => {
  res.json([
    { title: "Réouverture du serveur", description: "", done: true },
    {
      title: "Features",
      description:
        "Utiliser / Créer une API pour afficher les métadatas des jeux NDS",
      done: false,
    },
  ]);
});

// --- Fichiers statiques (frontend/public/) ---
const staticDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/public"
);
app.use(express.static(staticDir, { dotfiles: "ignore" }));

// Fallback SPA : toutes les routes non-API servent index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(
    `🚀 Server running on http://0.0.0.0:${PORT} | Mode: ${
      isProduction ? "Production" : "Développement"
    }`
  );
});
