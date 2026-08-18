import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getSessionUser } from "./auth.js";

const router = express.Router();

router.use(express.json());

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

// --- POST /api/v1/request ---
router.post("/request", async (req, res) => {
  const { games, title, systems, note, lang } = req.body || {};
  const noteClean = String(note || "").trim();

  const rawGames = Array.isArray(games) ? games : title ? [{ title, systems }] : [];

  const gamesClean = rawGames
    .map((g: any) => ({
      title: String(g?.title || "").trim(),
      systems: String(g?.systems || "").trim(),
    }))
    .filter((g: any) => g.title);

  if (gamesClean.length < 1 || gamesClean.length > 10) {
    return res.status(400).json({ error: "Entre 1 et 10 jeux requis." });
  }
  for (const g of gamesClean) {
    if (g.title.length < 2 || g.title.length > 120) {
      return res.status(400).json({ error: "Titre invalide (2 à 120 caractères)." });
    }
    if (g.systems.length > 80) {
      return res.status(400).json({ error: "Systèmes trop longs (max 80 caractères)." });
    }
  }
  if (noteClean.length > 2000) {
    return res.status(400).json({ error: "Note trop longue (max 2000 caractères)." });
  }
  if (lang !== "fr" && lang !== "en") {
    return res.status(400).json({ error: "lang invalide (fr | en)." });
  }

  const token = getBotToken();
  if (!token) {
    return res.status(503).json({ error: "Token du bot non configuré." });
  }

  const guildId = process.env.DISCORD_GUILD_ID || "1271186486070345843";
  const forumName = process.env.DISCORD_FORUM_CHANNEL || "game-requests";

  try {
    const channels = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!channels.ok) throw new Error(`Discord channels ${channels.status}`);
    const channelList = await safeJson<any[]>(channels);
    const forum = channelList.find((c) => c.type === 15 && c.name === forumName);
    if (!forum) {
      return res.status(404).json({ error: `Forum #${forumName} introuvable.` });
    }
    const pendingTag = (forum.available_tags || []).find((t: any) => t.name.includes("Demandé"));

    const requester = getSessionUser(req);

    for (const g of gamesClean) {
      const payload = {
        name: g.title.slice(0, 100),
        applied_tags: pendingTag ? [pendingTag.id] : [],
        message: {
          embeds: [
            {
              title: lang === "fr" ? "🎮 Demande de jeu" : "🎮 Game request",
              color: 0x00b0f4,
              description: `**${g.title}**${g.systems ? `\n*${g.systems}*` : ""}${noteClean ? `\n\n${noteClean}` : ""}`,
              fields: requester
                ? [{ name: lang === "fr" ? "Demandeur" : "Requester", value: requester.id, inline: true }]
                : [],
              footer: { text: "via db-nds-shop.fr" },
              timestamp: new Date().toISOString(),
            },
          ],
        },
      };
      const response = await fetch(`https://discord.com/api/v10/channels/${forum.id}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bot ${token}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.error("❌ Discord forum post failed:", response.status, await response.text());
        return res.status(502).json({ error: "Échec de la création du post." });
      }
    }
    res.json({ ok: true, count: gamesClean.length });
  } catch (err) {
    console.error("❌ Discord request error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// --- GET /api/v1/team ---
// Liste des IDs Discord de l'équipe (fichier écrit par le back-office upload)
const TEAM_MEMBERS_FILE =
  process.env.TEAM_MEMBERS_FILE || "/srv/nds-shop/team-members.json";

router.get("/team", (_req, res) => {
  try {
    if (!fs.existsSync(TEAM_MEMBERS_FILE)) {
      return res.json({ members: [], updatedAt: null });
    }
    const data = JSON.parse(fs.readFileSync(TEAM_MEMBERS_FILE, "utf8"));
    // Rétrocompat : ancien format { discordIds: [] }
    if (Array.isArray(data.discordIds)) {
      return res.json({
        members: data.discordIds.map((id: string) => ({ id, role: "" })),
        updatedAt: data.updatedAt ?? null,
      });
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Discord ---
const getBotToken = () => process.env.DISCORD_BOT_TOKEN || "";

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
      headers: { Authorization: `Bot ${getBotToken()}` },
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
      { headers: { Authorization: `Bot ${getBotToken()}` } }
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
