import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function webName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getGameByTitle(title: string) {
  const slug = webName(title);
  return prisma.game.findUnique({
    where: { slug },
    include: {
      screenshots: true,
      downloads: true,
      scripts: true,
    },
  });
}

export async function updateGameIcon(title: string, iconUrl: string) {
  const slug = webName(title);
  return prisma.game.update({
    where: { slug },
    data: { iconUrl },
  });
}

export async function updateGameBoxart(title: string, boxartUrl: string) {
  const slug = webName(title);
  return prisma.game.update({
    where: { slug },
    data: { boxartUrl },
  });
}

export async function addGameScreenshot(title: string, description: string, url: string, order: number) {
  const slug = webName(title);
  const game = await prisma.game.findUnique({ where: { slug } });
  if (!game) throw new Error(`Game not found: ${title}`);
  return prisma.gameScreenshot.create({
    data: {
      gameId: game.id,
      description,
      url,
      order,
    },
  });
}

export async function addGameBoxartIfMissing(title: string, boxartUrl: string) {
  const slug = webName(title);
  const game = await prisma.game.findUnique({
    where: { slug },
    include: { screenshots: true },
  });
  if (!game) throw new Error(`Game not found: ${title}`);
  
  const hasBoxart = game.screenshots.some(s => s.description === "Boxart");
  if (hasBoxart) return;
  
  return prisma.gameScreenshot.create({
    data: {
      gameId: game.id,
      description: "Boxart",
      url: boxartUrl,
      order: 0,
    },
  });
}

export async function updateGameScreenshots(title: string, screenshots: Array<{ description: string, url: string }>) {
  const slug = webName(title);
  const game = await prisma.game.findUnique({ where: { slug } });
  if (!game) throw new Error(`Game not found: ${title}`);
  
  await prisma.gameScreenshot.deleteMany({ where: { gameId: game.id } });
  
  for (let i = 0; i < screenshots.length; i++) {
    const s = screenshots[i];
    await prisma.gameScreenshot.create({
      data: {
        gameId: game.id,
        description: s.description,
        url: s.url,
        order: i,
      },
    });
  }
}

export async function closeDb() {
  await prisma.$disconnect();
}