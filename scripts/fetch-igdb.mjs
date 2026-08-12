import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_BASE = path.resolve(__dirname, "../backend/public/db/nds/base");
const CLIENT_ID = process.env.IGDB_CLIENT_ID;
const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
const LIMIT = parseInt(process.env.LIMIT || "0", 10) || 0;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Usage: IGDB_CLIENT_ID=xxx IGDB_CLIENT_SECRET=xxx node scripts/fetch-igdb.mjs");
  process.exit(1);
}

async function getToken() {
  const r = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error("Twitch OAuth: " + JSON.stringify(j));
  return j.access_token;
}

async function searchIGDB(token, title) {
  const name = title.replace(/[()]/g, "").trim();
  const r = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": CLIENT_ID,
      Authorization: "Bearer " + token,
      "Content-Type": "text/plain",
    },
    body: 'search "' + name + '"; fields name,summary,genres.name,first_release_date,rating,platforms.id; limit 5;',
  });
  if (!r.ok) throw new Error("IGDB " + r.status + ": " + (await r.text()));
  const data = await r.json();
  // Seulement les jeux Nintendo DS (platform id = 20) avec un summary
  return data?.filter((g) => g.platforms?.some((p) => p.id === 20) && g.summary?.trim())?.[0] || null;
}

async function fetchSummary(token, title) {
  let clean = title.replace(/\s*\(.*?\)/g, "").replace(/\s*\[.*?\]/g, "").replace(/\s*[:&-]\s*/g, " ").replace(/\s+/g, " ").trim();
  let game = await searchIGDB(token, clean + " (Nintendo DS)");
  if (game) return game;
  game = await searchIGDB(token, clean + " Nintendo DS");
  if (game) return game;
  return await searchIGDB(token, clean);
}

async function main() {
  console.log("🔑 Token...");
  const token = await getToken();
  console.log("✅ Token obtenu");

  const dirs = fs.readdirSync(DB_BASE).filter((d) => d !== "Example" && fs.statSync(path.join(DB_BASE, d)).isDirectory());
  let ok = 0;
  let done = 0;

  for (const serial of dirs) {
    if (LIMIT > 0 && done >= LIMIT) break;
    done++;

    const metaPath = path.join(DB_BASE, serial, "meta.json");
    if (!fs.existsSync(metaPath)) continue;
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));

    if (meta.description_igdb) { console.log("= " + meta.name + " → déjà fait"); ok++; continue; }

    const title = meta.name || meta.formal_name || serial;
    process.stdout.write("  " + title + "... ");

    try {
      const result = await fetchSummary(token, title);
      if (result?.summary?.trim()) {
        meta.description_igdb = result.summary.trim().slice(0, 2000);
        if (result.genres?.length) meta.genres = result.genres.map((g) => g.name).filter(Boolean);
        if (result.first_release_date) meta.release_date = new Date(result.first_release_date * 1000).toISOString().split("T")[0];
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
        console.log("✅");
        ok++;
      } else {
        console.log("⚠ pas de summary");
      }
    } catch (e) {
      console.log("❌ " + e.message);
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("\n📊 " + ok + "/" + done);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });