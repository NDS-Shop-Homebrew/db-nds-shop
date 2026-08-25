import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { trackDownload } from "../middleware/trackDownload";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROMS_PATH = process.env.ROMS_PATH || "/srv/nds-shop/roms";

// Proxy pour les téléchargements de ROMs — sert le fichier ET track le download
router.get("/download/:file", trackDownload, (req, res) => {
  const file = req.params.file;
  if (!file || !/^[a-zA-Z0-9%._-]+\.(nds|cia)$/.test(file)) {
    return res.status(400).json({ error: "Fichier invalide" });
  }
  const filePath = path.join(ROMS_PATH, decodeURIComponent(file));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }
  res.sendFile(filePath, {}, (err) => {
    if (err) console.error("⚠️ Échec envoi fichier:", err);
  });
});

export default router;