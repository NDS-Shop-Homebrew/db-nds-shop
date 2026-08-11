// API v1 of db-nds-shop — read-only metadata endpoints.
//
// Serves data from the generated frontend/public/games.json (the single
// source of truth produced by compile.bat). Images are served directly by
// the static file server, the API only exposes their URLs.
//
// Versioning: /api/v1 is the current stable version; bump to /api/v2 when a
// backwards-incompatible change is introduced.
import express from "express";
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

export default router;
