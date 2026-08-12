import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_BASE = path.join(__dirname, "../../public/db/nds/base");

const NS = "/api/v1/ndsdb";

function getBaseUrl(req: any) {
  return `${req.protocol}://${req.get("host")}`;
}

function serialPath(serial: string) {
  return path.join(DB_BASE, serial.toUpperCase());
}

function getMediaUrls(serialPath: string, serial: string, baseUrl: string) {
  const media: any = {
    banner: `${baseUrl}${NS}/images/${serial}/banner`,
    icon: `${baseUrl}${NS}/images/${serial}/icon`,
    front_boxart: `${baseUrl}${NS}/images/${serial}/front_boxart`,
    back_boxart: `${baseUrl}${NS}/images/${serial}/back_boxart`,
    screenshots: { compiled: [], uncompiled: { upper: [], lower: [] } },
    thumbnails: [],
  };
  try {
    const screenFiles = fs.readdirSync(path.join(serialPath, "screenshots"));
    media.screenshots.compiled = screenFiles
      .filter((f: string) => f.startsWith("screenshot_"))
      .sort()
      .map((f: string) => `${baseUrl}${NS}/screenshots/${serial}/screen/${f.match(/\d+/)?.[0]}`);
  } catch {}
  try {
    const uncompiledFiles = fs.readdirSync(path.join(serialPath, "screenshots_uncompiled"));
    uncompiledFiles.forEach((file: string) => {
      const match = file.match(/screenshot_(\d+)_(upper|lower)\.jpg/);
      if (match) {
        const type = match[2] === "upper" ? "upper" : "lower";
        media.screenshots.uncompiled[type].push(`${baseUrl}${NS}/screenshots/${serial}/screen_u/${match[1]}/${match[2][0]}`);
      }
    });
    media.screenshots.uncompiled.upper.sort();
    media.screenshots.uncompiled.lower.sort();
  } catch {}
  try {
    const thumbFiles = fs.readdirSync(path.join(serialPath, "thumbnails"));
    media.thumbnails = thumbFiles
      .filter((f: string) => f.startsWith("thumbnail_"))
      .sort()
      .map((f: string) => `${baseUrl}${NS}/thumbnails/${serial}/thumb/${f.match(/\d+/)?.[0]}`);
  } catch {}
  return media;
}

// ============================================================
// /api/v1/ndsdb/version
// ============================================================
router.get("/version", (_req, res) => {
  res.json({ version: "1.0.0" });
});

// ============================================================
// /api/v1/ndsdb/stats
// ============================================================
router.get("/stats/stats", (_req, res) => {
  try {
    const stats: any = { total: 0, categories: {} };
    const serials = fs
      .readdirSync(DB_BASE)
      .filter((s) => s !== "Example" && fs.statSync(path.join(DB_BASE, s)).isDirectory());
    stats.categories["base"] = serials.length;
    stats.total = serials.length;
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats/category/:category", (req, res) => {
  try {
    if (req.params.category !== "base") {
      return res.status(400).json({ error: "Invalid category", validCategories: ["base"] });
    }
    const serials = fs
      .readdirSync(DB_BASE)
      .filter((s) => s !== "Example" && fs.statSync(path.join(DB_BASE, s)).isDirectory())
      .sort();
    if (!serials.length) return res.status(404).json({ error: "No titles found" });
    res.json({ category: "base", count: serials.length, serials });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// /api/v1/ndsdb/metadata/:serial
// ============================================================
router.get("/metadata/:serial/meta/:meta", (req, res) => {
  try {
    const sp = serialPath(req.params.serial);
    if (!fs.existsSync(sp)) return res.status(404).json({ error: "Serial not found" });
    const meta = JSON.parse(fs.readFileSync(path.join(sp, "meta.json"), "utf-8"));
    if (meta[req.params.meta] === undefined) {
      return res.status(404).json({
        error: "Metadata field not found",
        availableFields: Object.keys(meta),
      });
    }
    res.json(meta[req.params.meta]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/metadata/:serial", (req, res) => {
  try {
    const sp = serialPath(req.params.serial);
    if (!fs.existsSync(sp)) return res.status(404).json({ error: "Serial not found" });
    const meta = JSON.parse(fs.readFileSync(path.join(sp, "meta.json"), "utf-8"));
    const media = getMediaUrls(sp, req.params.serial.toUpperCase(), getBaseUrl(req));
    res.json({ ...meta, media });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// /api/v1/ndsdb/images/:serial/:type
// ============================================================
const IMAGE_TYPES = ["banner", "icon", "front_boxart", "back_boxart", "top_image"];

router.get("/images/:serial/:type", (req, res) => {
  const sp = serialPath(req.params.serial);
  if (!fs.existsSync(sp)) return res.status(404).json({ error: "Serial not found" });
  if (!IMAGE_TYPES.includes(req.params.type)) {
    return res.status(400).json({ error: "Invalid type", validTypes: IMAGE_TYPES });
  }
  const filePath = path.join(sp, `${req.params.type}.jpg`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Image not found" });
  res.sendFile(filePath);
});

// ============================================================
// /api/v1/ndsdb/screenshots/:serial
// ============================================================
router.get("/screenshots/:serial/screens", (req, res) => {
  try {
    const sp = serialPath(req.params.serial);
    if (!fs.existsSync(sp)) return res.status(404).json({ error: "Serial not found" });
    const dir = path.join(sp, "screenshots");
    if (!fs.existsSync(dir)) return res.json({ count: 0, screenshots: [] });
    const shots = fs
      .readdirSync(dir)
      .filter((f: string) => f.startsWith("screenshot_") && f.endsWith(".jpg"))
      .sort()
      .map((f: string) => `${getBaseUrl(req)}${NS}/screenshots/${req.params.serial}/screen/${f.match(/\d+/)?.[0]}`);
    res.json({ count: shots.length, screenshots: shots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/screenshots/:serial/screen_u", (req, res) => {
  try {
    const sp = serialPath(req.params.serial);
    if (!fs.existsSync(sp)) return res.status(404).json({ error: "Serial not found" });
    const dir = path.join(sp, "screenshots_uncompiled");
    if (!fs.existsSync(dir)) return res.json({ count: { upper: 0, lower: 0, total: 0 }, screenshots: { upper: [], lower: [] } });
    const shots: any = { upper: [], lower: [] };
    fs.readdirSync(dir).forEach((file: string) => {
      const match = file.match(/screenshot_(\d+)_(upper|lower)\.jpg/);
      if (match) {
        const type = match[2] === "upper" ? "upper" : "lower";
        shots[type].push({
          number: parseInt(match[1]),
          url: `${getBaseUrl(req)}${NS}/screenshots/${req.params.serial}/screen_u/${match[1]}/${match[2][0]}`,
        });
      }
    });
    shots.upper.sort((a: any, b: any) => a.number - b.number);
    shots.lower.sort((a: any, b: any) => a.number - b.number);
    res.json({
      count: { upper: shots.upper.length, lower: shots.lower.length, total: shots.upper.length + shots.lower.length },
      screenshots: shots,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/screenshots/:serial/screen_u/:num/:screen", (req, res) => {
  const sp = serialPath(req.params.serial);
  if (!fs.existsSync(sp)) return res.status(404).json({ error: "Serial not found" });
  const screen = req.params.screen === "u" ? "upper" : "lower";
  const filePath = path.join(sp, "screenshots_uncompiled", `screenshot_${req.params.num}_${screen}.jpg`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Screenshot not found" });
  res.sendFile(filePath);
});

router.get("/screenshots/:serial/screen/:num", (req, res) => {
  const sp = serialPath(req.params.serial);
  if (!fs.existsSync(sp)) return res.status(404).json({ error: "Serial not found" });
  const filePath = path.join(sp, "screenshots", `screenshot_${req.params.num}.jpg`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Screenshot not found" });
  res.sendFile(filePath);
});

// ============================================================
// /api/v1/ndsdb/thumbnails/:serial
// ============================================================
router.get("/thumbnails/:serial/thumbs", (req, res) => {
  try {
    const sp = serialPath(req.params.serial);
    if (!fs.existsSync(sp)) return res.status(404).json({ error: "Serial not found" });
    const dir = path.join(sp, "thumbnails");
    if (!fs.existsSync(dir)) return res.json({ count: 0, thumbnails: [] });
    const thumbs = fs
      .readdirSync(dir)
      .filter((f: string) => f.startsWith("thumbnail_") && f.endsWith(".jpg"))
      .sort()
      .map((f: string) => `${getBaseUrl(req)}${NS}/thumbnails/${req.params.serial}/thumb/${f.match(/\d+/)?.[0]}`);
    res.json({ count: thumbs.length, thumbnails: thumbs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/thumbnails/:serial/thumb/:num", (req, res) => {
  const sp = serialPath(req.params.serial);
  if (!fs.existsSync(sp)) return res.status(404).json({ error: "Serial not found" });
  const filePath = path.join(sp, "thumbnails", `thumbnail_${req.params.num}.jpg`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Thumbnail not found" });
  res.sendFile(filePath);
});

// ============================================================
// /api/v1/ndsdb/uptimes
// ============================================================
router.get("/uptimes/uptime", (_req, res) => {
  const s = Math.floor(process.uptime());
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  res.json({
    uptime_seconds: s,
    uptime_string: `${days}d ${hours}h ${minutes}m ${seconds}s`,
  });
});

export default router;