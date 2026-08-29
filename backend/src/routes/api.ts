import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { getSessionUser } from "./auth.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.use(express.json());

// Cache-Control no-cache pour les données dynamiques
router.use("/games", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, must-revalidate");
  next();
});
router.use("/stats", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, must-revalidate");
  next();
});

const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de demandes. Réessaie plus tard." },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Stockage des favoris
const COMMUNITY_FILE =
  process.env.COMMUNITY_DATA_FILE ||
  path.resolve(__dirname, "../data/community.json");

interface Community {
  favorites: Record<string, string[]>;
}

function readCommunity(): Community {
  try {
    const raw = JSON.parse(fs.readFileSync(COMMUNITY_FILE, "utf8"));
    return { favorites: raw.favorites || {} };
  } catch {
    return { favorites: {} };
  }
}

function writeCommunity(data: Community) {
  fs.mkdirSync(path.dirname(COMMUNITY_FILE), { recursive: true });
  const tmp = COMMUNITY_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, COMMUNITY_FILE);
}

// Fonction utilitaire pour parser du JSON sécurisé
function safeJsonParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== "string") return val as T;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Transformateur de modèle Prisma -> Format API Frontend
function formatGameForApi(game: any) {
  const downloads: Record<string, { url: string; size?: number }> = {};
  if (Array.isArray(game.downloads)) {
    for (const d of game.downloads) {
      downloads[d.filename] = {
        url: d.url,
        size: d.size ? Number(d.size) : undefined,
      };
    }
  }

  const scripts: Record<string, any[]> = {};
  if (Array.isArray(game.scripts)) {
    for (const sc of game.scripts) {
      if (!scripts[sc.name]) scripts[sc.name] = [];
      scripts[sc.name].push({
        type: sc.type,
        file: sc.file,
        output: sc.output || undefined,
      });
    }
  }

  const screenshots = Array.isArray(game.screenshots)
    ? game.screenshots.map((s: any) => ({ url: s.url, order: s.order }))
    : [];

  return {
    id: game.id,
    slug: game.id,
    fileName: game.id,
    title: game.title,
    titleId: game.titleId,
    version: game.version,
    author: game.author,
    developer: game.developer,
    publisher: game.publisher,
    description: game.descriptionMd,
    descriptionMd: game.descriptionMd,
    systems: safeJsonParse(game.systems, ["DS"]),
    genres: safeJsonParse(game.genres, []),
    categories: safeJsonParse(game.categories, ["game"]),
    color: game.color,
    colorBg: game.colorBg,
    priority: game.priority,
    stars: game.stars,
    icon: game.iconUrl,
    iconUrl: game.iconUrl,
    image: game.imageUrl,
    imageUrl: game.imageUrl,
    boxart: game.boxartUrl,
    boxartUrl: game.boxartUrl,
    screenshots,
    downloads,
    scripts,
    updated: game.updatedAt,
    updatedAt: game.updatedAt,
    created: game.createdAt,
    createdAt: game.createdAt,
  };
}

// --- GET /api/v1/health ---
router.get("/health", async (_req, res) => {
  try {
    const count = await prisma.game.count();
    res.json({ status: "ok", db: true, totalGames: count });
  } catch (err: any) {
    res.status(500).json({ status: "error", db: false, error: err.message });
  }
});

// --- GET /api/v1/games ---
// Query params: ?search=, ?region=, ?system=, ?limit=, ?offset=
router.get("/games", async (req, res) => {
  try {
    const { search, region, system, limit, offset } = req.query;

    const where: any = {};

    const q = String(search || "").trim();
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { author: { contains: q } },
        { id: { contains: q } },
      ];
    }

    if (region) {
      where.version = { contains: String(region) };
    }

    if (system) {
      where.systems = { contains: String(system) };
    }

    const off = Math.max(0, parseInt(String(offset || "0"), 10) || 0);
    const lim = Math.min(100, parseInt(String(limit || "50"), 10) || 50);

    const [total, games] = await Promise.all([
      prisma.game.count({ where }),
      prisma.game.findMany({
        where,
        include: {
          downloads: true,
          screenshots: { orderBy: { order: "asc" } },
          scripts: true,
        },
        orderBy: [{ priority: "desc" }, { title: "asc" }],
        skip: off,
        take: lim > 0 ? lim : undefined,
      }),
    ]);

    const formatted = games.map(formatGameForApi);

    res.json({
      total,
      offset: off,
      limit: lim || null,
      count: formatted.length,
      games: formatted,
    });
  } catch (err: any) {
    console.error("❌ GET /games error:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des jeux" });
  }
});

// --- GET /api/v1/games/:slug ---
router.get("/games/:slug", async (req, res) => {
  try {
    const game = await prisma.game.findUnique({
      where: { id: req.params.slug },
      include: {
        downloads: true,
        screenshots: { orderBy: { order: "asc" } },
        scripts: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: "Jeu introuvable" });
    }

    res.json(formatGameForApi(game));
  } catch (err: any) {
    console.error(`❌ GET /games/${req.params.slug} error:`, err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// --- GET /api/v1/stats ---
// ponytail: cache en mémoire 60s, suffisant pour des stats
let statsCache: { body: string; at: number } | null = null;

router.get("/stats", async (_req, res) => {
  try {
    if (statsCache && Date.now() - statsCache.at < 60_000) {
      return res.setHeader("Content-Type", "application/json").send(statsCache.body);
    }

    const [totalGames, games] = await Promise.all([
      prisma.game.count(),
      prisma.game.findMany({
        select: {
          id: true,
          systems: true,
          updatedAt: true,
        },
      }),
    ]);

    const bySystem: Record<string, number> = {};
    let lastUpdated: Date | null = null;

    for (const g of games) {
      const systems = safeJsonParse<string[]>(g.systems, ["DS"]);
      for (const s of systems) {
        bySystem[s] = (bySystem[s] || 0) + 1;
      }
      if (!lastUpdated || g.updatedAt > lastUpdated) {
        lastUpdated = g.updatedAt;
      }
    }

    const body = JSON.stringify({
      games: totalGames,
      systems: bySystem,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
    });
    statsCache = { body, at: Date.now() };

    res.setHeader("Content-Type", "application/json").send(body);
  } catch (err: any) {
    console.error("❌ GET /stats error:", err);
    res.status(500).json({ error: "Erreur lors du calcul des statistiques" });
  }
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
  const requester = getSessionUser(req);

  if (token) {
    const guildId = process.env.DISCORD_GUILD_ID || "1271186486070345843";
    const forumName = process.env.DISCORD_FORUM_CHANNEL || "game-requests";

    try {
      const channels = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/channels`,
        { headers: { Authorization: `Bot ${token}` } }
      );
      if (channels.ok) {
        const channelList = await safeJson<any[]>(channels);
        const forum = channelList.find((c) => c.type === 15 && c.name === forumName);
        if (forum) {
          const pendingTag = (forum.available_tags || []).find((t: any) =>
            t.name.includes("Demandé")
          );

          for (const g of gamesClean) {
            const payload = {
              name: g.title.slice(0, 100),
              applied_tags: pendingTag ? [pendingTag.id] : [],
              message: {
                embeds: [
                  {
                    title: lang === "fr" ? "🎮 Demande de jeu" : "🎮 Game request",
                    color: 0x00b0f4,
                    description: `**${g.title}**${g.systems ? `\n*${g.systems}*` : ""}${
                      noteClean ? `\n\n${noteClean}` : ""
                    }`,
                    fields: requester
                      ? [
                          {
                            name: lang === "fr" ? "Demandeur" : "Requester",
                            value: requester.id,
                            inline: true,
                          },
                        ]
                      : [],
                    footer: { text: "via db-nds-shop.fr" },
                    timestamp: new Date().toISOString(),
                  },
                ],
              },
            };
            await fetch(
              `https://discord.com/api/v10/channels/${forum.id}/threads`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bot ${token}`,
                },
                body: JSON.stringify(payload),
              }
            );
          }
        }
      }
    } catch (err) {
      console.error("⚠️ Discord post error (non bloquant):", err);
    }
  }

  // Persiste les demandes en base MySQL
  try {
    await prisma.gameRequest.createMany({
      data: gamesClean.map((g) => ({
        title: g.title,
        systems: g.systems || null,
        note: noteClean || null,
        requesterId: requester?.id ?? null,
        requesterName: requester?.username ?? null,
      })),
    });
    res.json({ ok: true, count: gamesClean.length });
  } catch (err) {
    console.error("❌ SQL Insert Request Error:", err);
    res.status(500).json({ error: "Erreur enregistrement demande." });
  }
});

// --- GET /api/v1/team ---
const TEAM_MEMBERS_FILE =
  process.env.TEAM_MEMBERS_FILE || "/srv/nds-shop/team-members.json";

router.get("/team", (_req, res) => {
  try {
    if (!fs.existsSync(TEAM_MEMBERS_FILE)) {
      return res.json({ members: [], updatedAt: null });
    }
    const data = JSON.parse(fs.readFileSync(TEAM_MEMBERS_FILE, "utf8"));
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

// --- Discord helpers ---
const getBotToken = () => process.env.DISCORD_BOT_TOKEN || "";

async function safeJson<T>(response: any): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
}

// ponytail: timeout 5s sur tous les fetch Discord
const fetcher = (url: string, init: any = {}) =>
  fetch(url, { ...init, signal: AbortSignal.timeout(5000) });

// GET /api/v1/discord-user/:id
router.get("/discord-user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetcher(`https://discord.com/api/v10/users/${id}`, {
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
    res.status(500).json({ error: "Failed to fetch from Discord" });
  }
});

// GET /api/v1/discord-presence/:id
router.get("/discord-presence/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetcher(`https://api.lanyard.rest/v1/users/${id}`);
    if (response.status === 404) {
      return res.json({ discord_status: "offline", activities: [] });
    }
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch Lanyard" });
    }
    const data = await safeJson<any>(response);
    res.json(data.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch presence" });
  }
});

// ponytail: cache 60s du guild
let guildCache: { body: string; at: number } | null = null;
router.get("/discord-guild", async (_req, res) => {
  const guildId = process.env.DISCORD_GUILD_ID || "1271186486070345843";
  try {
    if (guildCache && Date.now() - guildCache.at < 60_000) {
      return res.setHeader("Content-Type", "application/json").send(guildCache.body);
    }
    const response = await fetcher(
      `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`,
      { headers: { Authorization: `Bot ${getBotToken()}` } }
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch guild" });
    }
    const data = await safeJson<any>(response);
    const body = JSON.stringify({
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
    guildCache = { body, at: Date.now() };
    res.setHeader("Content-Type", "application/json").send(body);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch guild" });
  }
});

// --- Favoris ---
router.get("/favorites", (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Connexion requise." });
  const community = readCommunity();
  res.json({ favorites: community.favorites[user.id] || [] });
});

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

// --- Demandes de jeux ---
router.get("/requests", async (req, res) => {
  try {
    const user = getSessionUser(req);
    const rows = await prisma.gameRequest.findMany({
      include: { votes: true },
      orderBy: [{ votes: { _count: "desc" } }, { createdAt: "desc" }],
    });
    const list = rows.map((r) => ({
      id: r.id,
      title: r.title,
      systems: r.systems,
      note: r.note,
      requester: r.requesterName,
      createdAt: r.createdAt,
      votes: r.votes.length,
      hasVoted: !!user && r.votes.some((v) => v.userId === user.id),
    }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.post("/requests/:id/vote", async (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Connexion requise." });
  try {
    const existing = await prisma.gameRequestVote.findUnique({
      where: {
        requestId_userId: { requestId: req.params.id, userId: user.id },
      },
    });
    if (existing) {
      await prisma.gameRequestVote.delete({
        where: {
          requestId_userId: { requestId: req.params.id, userId: user.id },
        },
      });
    } else {
      await prisma.gameRequestVote.create({
        data: { requestId: req.params.id, userId: user.id },
      });
    }
    const count = await prisma.gameRequestVote.count({
      where: { requestId: req.params.id },
    });
    res.json({ ok: true, votes: count, hasVoted: !existing });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;