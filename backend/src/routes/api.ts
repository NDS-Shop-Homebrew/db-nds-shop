// API v1 of db-nds-shop — read-only metadata endpoints.
//
// Serves data from the generated frontend/public/games.json (the single
// source of truth produced by compile.bat). Images are served directly by
// the static file server, the API only exposes their URLs.
//
// Versioning: /api/v1 is the current stable version; bump to /api/v2 when a
// backwards-incompatible change is introduced.
import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAMES_JSON =
  process.env.GAMES_JSON_PATH ||
  path.resolve(__dirname, "../../../frontend/public/games.json");

function loadGames(): any[] {
  try {
    return JSON.parse(fs.readFileSync(GAMES_JSON, "utf8"));
  } catch (err) {
    console.error(`❌ games.json illisible (${GAMES_JSON}):`, err);
    return [];
  }
}

// --- GET /api/v1/health ---
router.get("/health", (_req, res) => {
  res.json({ status: "ok", gamesJson: fs.existsSync(GAMES_JSON) });
});

// --- GET /api/v1/games ---
// Query params: ?search=, ?region=, ?system=, ?limit=, ?offset=
router.get("/games", (req, res) => {
  const { search, region, system, limit, offset } = req.query;
  let games = loadGames();

  const q = String(search || "").toLowerCase();
  if (q) {
    games = games.filter(
      (g) =>
        (g.title || "").toLowerCase().includes(q) ||
        (g.author || "").toLowerCase().includes(q) ||
        (g.fileName || "").toLowerCase().includes(q)
    );
  }
  if (region) {
    games = games.filter((g) =>
      String(g.version || "").toLowerCase().includes(String(region).toLowerCase())
    );
  }
  if (system) {
    games = games.filter(
      (g) =>
        Array.isArray(g.systems) &&
        g.systems.some((s: string) =>
          s.toLowerCase().includes(String(system).toLowerCase())
        )
    );
  }

  const off = Math.max(0, parseInt(String(offset || "0"), 10) || 0);
  const lim = Math.min(100, parseInt(String(limit || "0"), 10) || 0);
  const total = games.length;
  const page = lim > 0 ? games.slice(off, off + lim) : games.slice(off);

  res.json({
    total,
    offset: off,
    limit: lim || null,
    count: page.length,
    games: page,
  });
});

// --- GET /api/v1/games/:slug ---
router.get("/games/:slug", (req, res) => {
  const game = loadGames().find((g) => (g.slug || g.fileName) === req.params.slug);
  if (!game) return res.status(404).json({ error: "Jeu introuvable" });
  res.json(game);
});

// --- GET /api/v1/stats ---
router.get("/stats", (_req, res) => {
  const games = loadGames();
  const bySystem: Record<string, number> = {};
  for (const g of games) {
    for (const s of g.systems || []) {
      bySystem[s] = (bySystem[s] || 0) + 1;
    }
  }
  res.json({
    games: games.length,
    systems: bySystem,
    lastUpdated: games
      .map((g) => g.updated)
      .filter(Boolean)
      .sort()
      .pop() || null,
  });
});

// --- GET /api/v1/team ---
// Liste des IDs Discord de l'équipe (fichier écrit par le back-office upload)
const TEAM_MEMBERS_FILE =
  process.env.TEAM_MEMBERS_FILE || "/srv/nds-shop/team-members.json";

router.get("/team", (_req, res) => {
  try {
    if (!fs.existsSync(TEAM_MEMBERS_FILE)) {
      return res.json({ discordIds: [], updatedAt: null });
    }
    const data = JSON.parse(fs.readFileSync(TEAM_MEMBERS_FILE, "utf8"));
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Discord (routes uniquement si token présent) ---
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";

async function safeJson<T>(response: any): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
}

// GET /api/v1/discord-user/:id — profil public d'un utilisateur
router.get("/discord-user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(`https://discord.com/api/v10/users/${id}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    });
    if (!response.ok) {
      const errorData = await safeJson<any>(response);
      return res.status(response.status).json({ error: errorData });
    }
    const data = await safeJson<any>(response);
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

// GET /api/v1/discord-presence/:id — statut/activité via Lanyard
router.get("/discord-presence/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${id}`);
    if (response.status === 404) {
      // Utilisateur non suivi par Lanyard → statut inconnu
      return res.json({ discord_status: "offline", activities: [] });
    }
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch Lanyard" });
    }
    const data = await safeJson<any>(response);
    res.json(data.data);
  } catch (err) {
    console.error("❌ Failed to fetch Lanyard presence:", err);
    res.status(500).json({ error: "Failed to fetch presence" });
  }
});

// GET /api/v1/discord-guild — infos du serveur Discord
router.get("/discord-guild", async (_req, res) => {
  const guildId = process.env.DISCORD_GUILD_ID || "1271186486070345843";
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`,
      { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch guild" });
    }
    const data = await safeJson<any>(response);
    res.json({
      id: data.id,
      name: data.name,
      icon: data.icon
        ? `https://cdn.discordapp.com/icons/${data.id}/${data.icon}.png?size=256`
        : null,
      memberCount: data.approximate_member_count,
      presenceCount: data.approximate_presence_count,
      description: data.description,
      invite: data.vanity_url_code
        ? `https://discord.gg/${data.vanity_url_code}`
        : null,
    });
  } catch (err) {
    console.error("❌ Failed to fetch Discord guild:", err);
    res.status(500).json({ error: "Failed to fetch guild" });
  }
});

export default router;
