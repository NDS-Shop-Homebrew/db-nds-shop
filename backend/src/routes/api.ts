import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { getSessionUser } from "./auth.js";

const router = express.Router();

router.use(express.json());

const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de demandes. Réessaie plus tard." },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAMES_JSON =
  process.env.GAMES_JSON_PATH ||
  path.resolve(__dirname, "../../../frontend/public/games.json");

// Stockage communautaire (favoris + demandes de jeux) — fichier JSON, écriture atomique
const COMMUNITY_FILE =
  process.env.COMMUNITY_DATA_FILE || path.resolve(__dirname, "../data/community.json");

interface Community {
  favorites: Record<string, string[]>;
  requests: {
    id: string;
    games: { title: string; systems: string }[];
    note: string;
    requester: { id: string; username: string } | null;
    createdAt: string;
    votes: string[];
  }[];
}

function readCommunity(): Community {
  try {
    const raw = JSON.parse(fs.readFileSync(COMMUNITY_FILE, "utf8"));
    return {
      favorites: raw.favorites || {},
      requests: Array.isArray(raw.requests) ? raw.requests : [],
    };
  } catch {
    return { favorites: {}, requests: [] };
  }
}

function writeCommunity(data: Community) {
  fs.mkdirSync(path.dirname(COMMUNITY_FILE), { recursive: true });
  const tmp = COMMUNITY_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, COMMUNITY_FILE);
}

export function loadGames(): any[] {
  try {
    return JSON.parse(fs.readFileSync(GAMES_JSON, "utf8"));
  } catch (err) {
    console.error(`❌ games.json illisible (${GAMES_JSON}):`, err);
    return [];
  }
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Téléchargements .nds / .cia depuis le log nginx (30 jours) — mêmes logs que le back-office
function downloadCounts(days = 30) {
  const counts = { total: 0, today: 0, nds: 0, cia: 0, byGame: {} as Record<string, number>, last7: [0,0,0,0,0,0,0] };
  const cutoff = Date.now() / 1000 - days * 86400;
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000;
  const todayStart = dayStart(new Date());
  const logPaths = [
    process.env.NGINX_LOG,
    "/var/log/nginx/access.log",
    "/var/log/nginx/db-nds-shop.access.log",
    "/srv/nds-shop/logs/access.log",
  ].filter(Boolean) as string[];

  const RE = /\[(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})[^\]]*\].*?"GET (\S+\.(?:nds|cia))/;
  for (const logPath of logPaths) {
    if (!fs.existsSync(logPath)) continue;
    try {
      const lines = fs.readFileSync(logPath, "utf8").split("\n");
      for (const line of lines) {
        const m = line.match(RE);
        if (!m) continue;
        const mon = MONTHS.indexOf(m[2]);
        if (mon < 0) continue;
        const ts = new Date(Number(m[3]), mon, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6])).getTime() / 1000;
        if (isNaN(ts) || ts < cutoff) continue;
        const file = decodeURIComponent(m[7].replace(/^\/games\//, ""));
        counts.total++;
        if (ts >= todayStart) counts.today++;
        if (file.endsWith(".nds")) counts.nds++;
        else counts.cia++;
        const game = file.split("/").pop() || "?";
        counts.byGame[game] = (counts.byGame[game] || 0) + 1;
        for (let i = 0; i < 7; i++) {
          const start = todayStart - i * 86400;
          if (ts >= start) { counts.last7[i]++; break; }
        }
      }
    } catch {}
  }
  return counts;
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
  const dl = downloadCounts();
  const byGame: Record<string, number> = {};
  for (const g of games) {
    let n = 0;
    for (const f of Object.keys(g.downloads || {})) {
      n += dl.byGame[f.split("/").pop() || f] || 0;
    }
    if (n > 0) byGame[g.fileName] = n;
  }
  res.json({
    games: games.length,
    systems: bySystem,
    lastUpdated: games
      .map((g) => g.updated)
      .filter(Boolean)
      .sort()
      .pop() || null,
    downloads: {
      total: dl.total,
      today: dl.today,
      nds: dl.nds,
      cia: dl.cia,
      byGame,
      last7: dl.last7,
    },
  });
});

// --- POST /api/v1/request ---
router.post("/request", requestLimiter, async (req, res) => {
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
    // Persiste la demande localement (liste publique + votes)
    const community = readCommunity();
    community.requests.push({
      id: crypto.randomUUID(),
      games: gamesClean,
      note: noteClean,
      requester: requester ? { id: requester.id, username: requester.username } : null,
      createdAt: new Date().toISOString(),
      votes: [],
    });
    writeCommunity(community);
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

// --- Favoris synchronisés (login requis) ---
// GET /api/v1/favorites — liste des slugs favoris de l'utilisateur
router.get("/favorites", (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Connexion requise." });
  const community = readCommunity();
  res.json({ favorites: community.favorites[user.id] || [] });
});

// PUT /api/v1/favorites — remplace la liste des favoris
router.put("/favorites", (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Connexion requise." });
  const { favorites } = req.body || {};
  if (!Array.isArray(favorites) || favorites.some((f) => typeof f !== "string")) {
    return res.status(400).json({ error: "favorites (array de strings) requis." });
  }
  const community = readCommunity();
  community.favorites[user.id] = favorites;
  writeCommunity(community);
  res.json({ ok: true, favorites });
});

// --- Demandes de jeux (liste publique + votes) ---
// GET /api/v1/requests — triées par votes décroissants
router.get("/requests", (req, res) => {
  const user = getSessionUser(req);
  const community = readCommunity();
  const list = community.requests
    .slice()
    .sort((a, b) => b.votes.length - a.votes.length || b.createdAt.localeCompare(a.createdAt))
    .map((r) => ({
      id: r.id,
      games: r.games,
      note: r.note,
      requester: r.requester ? r.requester.username : null,
      createdAt: r.createdAt,
      votes: r.votes.length,
      hasVoted: !!user && r.votes.includes(user.id),
    }));
  res.json(list);
});

// POST /api/v1/requests/:id/vote — toggle du vote (login requis, 1 vote par utilisateur)
router.post("/requests/:id/vote", (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Connexion requise." });
  const community = readCommunity();
  const entry = community.requests.find((r) => r.id === req.params.id);
  if (!entry) return res.status(404).json({ error: "Demande introuvable." });
  const idx = entry.votes.indexOf(user.id);
  if (idx >= 0) entry.votes.splice(idx, 1);
  else entry.votes.push(user.id);
  writeCommunity(community);
  res.json({ ok: true, votes: entry.votes.length, hasVoted: idx < 0 });
});

export default router;
