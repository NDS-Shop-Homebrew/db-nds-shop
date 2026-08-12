import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_BASE = path.join(__dirname, "../../public/db/nds/base");

function getBaseUrl(req: any) {
  return `${req.protocol}://${req.get("host")}`;
}

function getMediaUrls(serialPath: string, serial: string, baseUrl: string) {
  const media: any = {
    banner: `${baseUrl}/api/v2/ndsdb/${serial}/banner`,
    icon: `${baseUrl}/api/v2/ndsdb/${serial}/icon`,
    front_boxart: `${baseUrl}/api/v2/ndsdb/${serial}/front_boxart`,
    back_boxart: `${baseUrl}/api/v2/ndsdb/${serial}/back_boxart`,
    screenshots: { compiled: [], uncompiled: { upper: [], lower: [] } },
    thumbnails: [],
  };
  try {
    const screenFiles = fs.readdirSync(path.join(serialPath, "screenshots"));
    media.screenshots.compiled = screenFiles
      .filter((f: string) => f.startsWith("screenshot_"))
      .sort()
      .map((f: string) => `${baseUrl}/api/v2/ndsdb/${serial}/screen/${f.match(/\d+/)?.[0]}`);
  } catch {}
  try {
    const uncompiledFiles = fs.readdirSync(path.join(serialPath, "screenshots_uncompiled"));
    uncompiledFiles.forEach((file: string) => {
      const match = file.match(/screenshot_(\d+)_(upper|lower)\.jpg/);
      if (match) {
        const type = match[2] === "upper" ? "upper" : "lower";
        media.screenshots.uncompiled[type].push(`${baseUrl}/api/v2/ndsdb/${serial}/screen_u/${match[1]}/${match[2][0]}`);
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
      .map((f: string) => `${baseUrl}/api/v2/ndsdb/${serial}/thumb/${f.match(/\d+/)?.[0]}`);
  } catch {}
  return media;
}

// GET /api/v2/ndsdb/ — list all serials
router.get("/", (req, res) => {
  try {
    const serials = fs.readdirSync(DB_BASE).filter((s) => s !== "Example" && fs.statSync(path.join(DB_BASE, s)).isDirectory());
    res.json({ count: serials.length, serials: serials.sort() });
  } catch {
    res.status(500).json({ error: "Failed to read database" });
  }
});

// GET /api/v2/ndsdb/:serial — full metadata
router.get("/:serial", (req, res) => {
  try {
    const serialPath = path.join(DB_BASE, req.params.serial.toUpperCase());
    if (!fs.existsSync(serialPath)) return res.status(404).json({ error: "Serial not found" });
    const meta = JSON.parse(fs.readFileSync(path.join(serialPath, "meta.json"), "utf-8"));
    const media = getMediaUrls(serialPath, req.params.serial.toUpperCase(), getBaseUrl(req));
    res.json({ ...meta, media });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v2/ndsdb/:serial/:type — image files
router.get("/:serial/:type", (req, res) => {
  const serialPath = path.join(DB_BASE, req.params.serial.toUpperCase());
  if (!fs.existsSync(serialPath)) return res.status(404).json({ error: "Serial not found" });
  const validTypes = ["banner", "icon", "front_boxart", "back_boxart", "top_image"];
  if (!validTypes.includes(req.params.type)) return res.status(400).json({ error: "Invalid type" });
  const filePath = path.join(serialPath, `${req.params.type}.jpg`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.sendFile(filePath);
});

// GET /api/v2/ndsdb/:serial/screen/:num — screenshot
router.get("/:serial/screen/:num", (req, res) => {
  const serialPath = path.join(DB_BASE, req.params.serial.toUpperCase());
  const filePath = path.join(serialPath, "screenshots", `screenshot_${req.params.num}.jpg`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Screenshot not found" });
  res.sendFile(filePath);
});

// GET /api/v2/ndsdb/:serial/screen_u/:num/:screen — uncompiled screenshot
router.get("/:serial/screen_u/:num/:screen", (req, res) => {
  const serialPath = path.join(DB_BASE, req.params.serial.toUpperCase());
  const screen = req.params.screen === "u" ? "upper" : "lower";
  const filePath = path.join(serialPath, "screenshots_uncompiled", `screenshot_${req.params.num}_${screen}.jpg`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Screenshot not found" });
  res.sendFile(filePath);
});

// GET /api/v2/ndsdb/:serial/thumb/:num — thumbnail
router.get("/:serial/thumb/:num", (req, res) => {
  const serialPath = path.join(DB_BASE, req.params.serial.toUpperCase());
  const filePath = path.join(serialPath, "thumbnails", `thumbnail_${req.params.num}.jpg`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Thumbnail not found" });
  res.sendFile(filePath);
});

export default router;