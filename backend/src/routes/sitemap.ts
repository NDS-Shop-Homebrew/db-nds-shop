import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.get("/sitemap.xml", async (_req, res) => {
  try {
    const games = await prisma.game.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const staticPages = [
      { loc: "https://db-nds-shop.fr", priority: "1.0", changefreq: "daily" },
      { loc: "https://db-nds-shop.fr/game-list", priority: "0.9", changefreq: "daily" },
      { loc: "https://db-nds-shop.fr/about", priority: "0.8", changefreq: "monthly" },
      { loc: "https://db-nds-shop.fr/tutorial", priority: "0.8", changefreq: "monthly" },
      { loc: "https://db-nds-shop.fr/request", priority: "0.8", changefreq: "weekly" },
      { loc: "https://db-nds-shop.fr/docs", priority: "0.8", changefreq: "monthly" },
      { loc: "https://db-nds-shop.fr/favorites", priority: "0.5", changefreq: "monthly" },
      { loc: "https://db-nds-shop.fr/privacy", priority: "0.3", changefreq: "yearly" },
      { loc: "https://db-nds-shop.fr/dmca", priority: "0.3", changefreq: "yearly" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${page.loc}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    for (const game of games) {
      const lastmod = game.updatedAt
        ? new Date(game.updatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      xml += `  <url>\n`;
      xml += `    <loc>https://db-nds-shop.fr/game/${encodeURIComponent(game.slug)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=86400");
    res.send(xml);
  } catch (err) {
    console.error("Erreur génération sitemap:", err);
    res.status(500).end();
  }
});

export default router;