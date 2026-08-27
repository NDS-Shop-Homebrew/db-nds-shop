import express from "express";
import fs from "fs";
import path from "path";
import { trackDownload } from "../middleware/trackDownload.js";

const router = express.Router();

const ROMS_PATH =
  process.env.ROMS_PATH ||
  path.resolve(process.cwd(), "../../storage/roms");

router.get("/download/:file", trackDownload, (req, res) => {
  const file = decodeURIComponent(req.params.file);

  if (!file || !/\.(nds|cia)$/i.test(file)) {
    return res.status(400).json({ error: "Format de fichier invalide (.nds ou .cia requis)" });
  }

  const safeFilename = path.basename(file);
  const filePath = path.resolve(ROMS_PATH, safeFilename);

  if (!filePath.startsWith(path.resolve(ROMS_PATH))) {
    return res.status(403).json({ error: "Accès interdit" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "ROM introuvable sur le serveur" });
  }

  res.download(filePath, safeFilename, (err) => {
    if (err && !res.headersSent) {
      console.error("⚠️ Échec de l'envoi de la ROM :", err);
      res.status(500).json({ error: "Erreur lors du transfert du fichier" });
    }
  });
});

export default router;