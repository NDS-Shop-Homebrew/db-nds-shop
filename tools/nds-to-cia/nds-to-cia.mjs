#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// nds-to-cia.mjs — Batch NDS → CIA forwarder generator for db-nds-shop
//
// Ported from the forwarder logic of "Multitool project/multitools"
//   (React/Tauri app). Converts .nds/.dsi ROMs into installable 3DS
//   forwarder .cia files using the bundled make_cia (CTR_Toolkit).
//
// Usage:
//   node nds-to-cia.mjs --roms <dir> --out <dir> [--card sdcard] [--gamepath /roms/nds]
//   node nds-to-cia.mjs --roms <dir> --from-apps <db-nds-shop/source/apps> --out <dir>
//
// Options:
//   --roms <dir>          folder containing the .nds/.dsi ROMs (required)
//   --from-apps <dir>     restrict to the games listed in db-nds-shop source/apps
//   --out <dir>           output folder for the generated .cia (required)
//   --card <id>           forwarder card template (default: sdcard)
//   --gamepath <prefix>   SD folder where the ROM will live (default: /roms/nds)
//   --tid <AAAA>          force a fixed TID (default: random per game)
//   --keep                keep the intermediate patched .nds files
//   --verbose             show make_cia output
// ─────────────────────────────────────────────────────────────────────────────

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest } from "./lib/manifest.mjs";
import { parseCard } from "./lib/cards.mjs";
import { buildPatchedNDS } from "./lib/ndsPatcher.mjs";
import { getRandomTid } from "./lib/tidList.mjs";

const cliDir = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(cliDir, "templates");
const BIN_DIR = path.join(cliDir, "bin");

const MAKE_CIA = process.platform === "win32"
  ? path.join(BIN_DIR, "make_cia.exe")
  : process.platform === "darwin"
    ? path.join(BIN_DIR, "make_cia_macos")
    : path.join(BIN_DIR, "make_cia_linux");

// ─── Args ────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const val = argv[i + 1];
      if (val === undefined || val.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = val;
        i++;
      }
    }
  }
  return args;
}

// ─── Card template ───────────────────────────────────────────────────────────

function loadCard(cardId) {
  const fwdPath = path.join(TEMPLATES_DIR, `${cardId}.fwd`);
  const ndsPath = path.join(TEMPLATES_DIR, `${cardId}.nds`);
  if (!existsSync(fwdPath) || !existsSync(ndsPath)) {
    const available = readdirSync(TEMPLATES_DIR)
      .filter((f) => f.endsWith(".fwd"))
      .map((f) => f.slice(0, -4))
      .join(", ");
    throw new Error(`Carte "${cardId}" introuvable. Cartes disponibles : ${available}`);
  }
  return { card: parseCard(readFileSync(fwdPath, "utf8")), template: readFileSync(ndsPath) };
}

// ─── Build the work list ─────────────────────────────────────────────────────

function buildEntries(args) {
  const romsDir = args.roms;
  if (!romsDir || !existsSync(romsDir)) throw new Error("--roms <dir> requis (dossier des ROMs .nds)");
  const gamePathPrefix = args.gamepath || "/roms/nds";
  const entries = [];

  const push = (fileName, forcedGamePath) => {
    const romPath = path.join(romsDir, fileName);
    if (!existsSync(romPath)) {
      console.warn(`⚠  ROM manquante : ${fileName} (ignorée)`);
      return;
    }
    const base = fileName.replace(/\.(nds|dsi)$/i, "");
    entries.push({
      romPath,
      romName: fileName,
      base,
      gamepath: forcedGamePath || `${gamePathPrefix.replace(/\/+$/, "")}/${fileName}`,
      out: `${base}.cia`,
    });
  };

  if (args["from-apps"]) {
    const manifest = buildManifest(args["from-apps"], gamePathPrefix);
    for (const entry of manifest) push(entry.rom, entry.gamepath);
  } else {
    for (const fileName of readdirSync(romsDir).sort()) {
      if (/\.(nds|dsi)$/i.test(fileName)) push(fileName);
    }
  }

  return entries;
}

// ─── Convert one ROM ─────────────────────────────────────────────────────────

function convertOne(entry, card, templateBuffer, args, tempDir, forcedTid) {
  const romBuffer = readFileSync(entry.romPath);
  const tid = forcedTid || getRandomTid();

  const { template } = buildPatchedNDS(romBuffer, templateBuffer, card, {
    tid,
    gamepath: entry.gamepath,
  });

  // make_cia truncates long paths, so use a short temp name and rename after.
  const patchedName = "in.nds";
  const patchedPath = path.join(tempDir, patchedName);
  writeFileSync(patchedPath, template);

  const result = spawnSync(MAKE_CIA, [`--srl=${patchedName}`], {
    cwd: tempDir,
    timeout: 120000,
    encoding: "utf8",
    stdio: args.verbose ? "inherit" : "pipe",
  });

  if (result.error || result.status !== 0) {
    const err = result.error ? result.error.message : result.stderr?.trim() || `exit ${result.status}`;
    throw new Error(`make_cia a échoué pour "${entry.romName}" : ${err}`);
  }

  let ciaPath = path.join(tempDir, "in.cia");
  if (!existsSync(ciaPath)) {
    const found = readdirSync(tempDir).filter((f) => f.endsWith(".cia"));
    if (found.length !== 1) throw new Error(`Sortie .cia introuvable pour "${entry.romName}"`);
    ciaPath = path.join(tempDir, found[0]);
  }

  const outPath = path.join(args.out, entry.out);
  // renameSync fails across volumes (EXDEV), e.g. temp on C: -> output on D:
  copyFileSync(ciaPath, outPath);
  rmSync(ciaPath, { force: true });

  if (args.keep) {
    mkdirSync(path.join(args.out, "patched"), { recursive: true });
    copyFileSync(patchedPath, path.join(args.out, "patched", `${entry.base}_forwarder.nds`));
  }

  return { outPath, tid };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    console.log("Usage: node nds-to-cia.mjs --roms <dir> --out <dir> [options]");
    return;
  }
  if (!args.out) throw new Error("--out <dir> requis");

  if (!existsSync(MAKE_CIA)) throw new Error(`make_cia introuvable : ${MAKE_CIA}`);

  const cardId = args.card || "sdcard";
  const { card, template } = loadCard(cardId);
  const entries = buildEntries(args);
  if (entries.length === 0) {
    console.log("Aucune ROM à convertir.");
    return;
  }

  mkdirSync(args.out, { recursive: true });
  const tempDir = path.join(tmpdir(), `nds-to-cia-${process.pid}-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  const forcedTid = args.tid;
  let ok = 0;
  let failed = 0;

  console.log(`Carte     : ${card.name} (${cardId})`);
  console.log(`make_cia  : ${MAKE_CIA}`);
  console.log(`ROMs      : ${entries.length} à convertir → ${args.out}\n`);

  for (const entry of entries) {
    process.stdout.write(`🔄  ${entry.romName} → ${entry.out} ... `);
    try {
      const { tid } = convertOne(entry, card, template, args, tempDir, forcedTid);
      process.stdout.write(`✅ (TID ${tid})\n`);
      ok++;
    } catch (err) {
      process.stdout.write(`❌ ${err.message}\n`);
      failed++;
    }
  }

  rmSync(tempDir, { recursive: true, force: true });

  console.log(`\nTerminé : ${ok} générés, ${failed} en échec.`);
  if (failed > 0) process.exitCode = 1;
}

main();
