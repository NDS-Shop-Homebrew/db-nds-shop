import { PrismaClient } from '@nds-shop/prisma';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function generate() {
  const games = await prisma.game.findMany({
    include: {
      screenshots: true,
      downloads: true,
      scripts: true,
    },
  });

  console.log(`Found ${games.length} games`);

  // Output directory
  const docsDir = path.resolve(__dirname, '..', 'frontend', 'public');
  const dsDir = path.join(docsDir, '_ds');
  if (!fs.existsSync(dsDir)) fs.mkdirSync(dsDir, { recursive: true });

  // Generate _ds/*.md files
  for (const game of games) {
    const slug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const mdPath = path.join(dsDir, `${slug}.md`);
    
    const content = `---
title: "${game.title}"
author: "${game.author}"
developer: "${game.developer}"
publisher: "${game.publisher}"
version: "${game.version}"
titleId: "${game.titleId}"
systems: ${JSON.stringify(JSON.parse(game.systems))}
genres: ${JSON.stringify(JSON.parse(game.genres))}
categories: ${JSON.stringify(JSON.parse(game.categories))}
color: "${game.color}"
color_bg: "${game.colorBg}"
priority: ${game.priority}
stars: ${game.stars}
icon: "${game.iconUrl}"
image: "${game.imageUrl}"
boxart: "${game.boxartUrl}"
downloads: ${JSON.stringify(Object.fromEntries(game.downloads.map(d => [d.filename, { url: d.url, size: Number(d.size) }])), null, 2)}
screenshots: ${JSON.stringify(game.screenshots.map(s => ({ url: s.url, order: s.order })), null, 2)}
scripts: ${JSON.stringify(game.scripts.map(s => ({ type: s.type, file: s.file, output: s.output })), null, 2)}
---`;

    fs.writeFileSync(mdPath, content);
    console.log(`Generated: ${mdPath}`);
  }

  // Generate games.json for frontend
  const gamesJson = games.map(g => ({
    title: g.title,
    author: g.author,
    developer: g.developer,
    publisher: g.publisher,
    version: g.version,
    titleId: g.titleId,
    systems: JSON.parse(g.systems),
    genres: JSON.parse(g.genres),
    categories: JSON.parse(g.categories),
    color: g.color,
    color_bg: g.colorBg,
    priority: g.priority,
    stars: g.stars,
    icon: g.iconUrl,
    image: g.imageUrl,
    boxart: g.boxartUrl,
    downloads: Object.fromEntries(g.downloads.map(d => [d.filename, { url: d.url, size: Number(d.size) }])),
    screenshots: g.screenshots.map(s => ({ url: s.url, order: s.order })),
    scripts: g.scripts.map(s => ({ type: s.type, file: s.file, output: s.output })),
  }));

  fs.writeFileSync(
    path.join(docsDir, 'games.json'),
    JSON.stringify(gamesJson, null, 2)
  );
  console.log('Generated: games.json');

  await prisma.$disconnect();
}

generate().catch(e => {
  console.error(e);
  process.exit(1);
});