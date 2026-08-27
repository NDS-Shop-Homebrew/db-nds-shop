import { PrismaClient } from "@nds-shop/prisma";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function generate() {
  const games = await prisma.game.findMany({
    include: {
      screenshots: {
        orderBy: { order: "asc" },
      },
      downloads: true,
      scripts: true,
    },
  });

  console.log(`Trouvé : ${games.length} jeux`);

  // Dossier de sortie
  const docsDir = path.resolve(__dirname, "..", "frontend", "public");
  const dsDir = path.join(docsDir, "_ds");
  if (!fs.existsSync(dsDir)) fs.mkdirSync(dsDir, { recursive: true });

  // 1. Génération des fichiers Markdown _ds/*.md
  for (const game of games) {
    const slug =
      game.slug || game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const mdPath = path.join(dsDir, `${slug}.md`);

    const downloadsMap = Object.fromEntries(
      game.downloads.map((d) => [
        d.fileName,
        { url: d.url, size: d.size ? Number(d.size) : undefined, type: d.type },
      ]),
    );

    const screenshotsList = game.screenshots.map((s) => ({
      description: s.description,
      url: s.url,
      order: s.order,
    }));

    const scriptsList = game.scripts.map((s) => ({
      name: s.name,
      script: s.script,
    }));

    const content = `---
title: ${JSON.stringify(game.title || "")}
author: ${JSON.stringify(game.author || "")}
developer: ${JSON.stringify(game.developer || "")}
publisher: ${JSON.stringify(game.publisher || "")}
version: ${JSON.stringify(game.version || "")}
titleId: ${JSON.stringify(game.titleId || "")}
systems: ${JSON.stringify(game.systems || [])}
genres: ${JSON.stringify(game.genres || [])}
categories: ${JSON.stringify(game.categories || [])}
color: ${JSON.stringify(game.color || "")}
color_bg: ${JSON.stringify(game.colorBg || "")}
priority: ${Boolean(game.priority)}
stars: ${game.stars || 0}
icon: ${JSON.stringify(game.iconUrl || "")}
image: ${JSON.stringify(game.imageUrl || "")}
boxart: ${JSON.stringify(game.boxartUrl || "")}
downloads: ${JSON.stringify(downloadsMap, null, 2)}
screenshots: ${JSON.stringify(screenshotsList, null, 2)}
scripts: ${JSON.stringify(scriptsList, null, 2)}
---
`;

    fs.writeFileSync(mdPath, content, "utf8");
    console.log(`Généré : ${mdPath}`);
  }

  // 2. Génération de games.json pour le frontend
  const gamesJson = games.map((g) => ({
    id: g.id,
    slug: g.slug,
    title: g.title,
    author: g.author,
    developer: g.developer,
    publisher: g.publisher,
    version: g.version,
    titleId: g.titleId,
    systems: g.systems || [],
    genres: g.genres || [],
    categories: g.categories || [],
    color: g.color,
    color_bg: g.colorBg,
    priority: g.priority,
    stars: g.stars,
    icon: g.iconUrl,
    image: g.imageUrl,
    boxart: g.boxartUrl,
    downloads: Object.fromEntries(
      g.downloads.map((d) => [
        d.fileName,
        { url: d.url, size: d.size ? Number(d.size) : undefined, type: d.type },
      ]),
    ),
    screenshots: g.screenshots.map((s) => ({
      description: s.description,
      url: s.url,
      order: s.order,
    })),
    scripts: g.scripts.map((s) => ({
      name: s.name,
      script: s.script,
    })),
    updated: g.updatedAt.toISOString(),
  }));

  const gamesJsonPath = path.join(docsDir, "games.json");
  fs.writeFileSync(gamesJsonPath, JSON.stringify(gamesJson, null, 2), "utf8");
  console.log(`Généré : ${gamesJsonPath}`);

  await prisma.$disconnect();
}

generate().catch((e) => {
  console.error("Erreur génération:", e);
  process.exit(1);
});
