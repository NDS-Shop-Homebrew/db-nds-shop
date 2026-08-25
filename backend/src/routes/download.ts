import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { trackDownload } from "../middleware/trackDownload.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROMS_PATH = process.env.ROMS_PATH || "/srv/nds-shop/roms";

router.get("/download/:file", trackDownload, (req, res) => {
  const file = decodeURIComponent(req.params.file);
  if (!file || !/\.(nds|cia)$/i.test(file)) {
    return res.status(400).json({ error: "Fichier invalide" });
  }
  const filePath = path.join(ROMS_PATH, file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier introuvable" });
  }
  res.sendFile(filePath, {}, (err) => {
    if (err) console.error("⚠️ Échec envoi fichier:", err);
  });
});

export default router;
