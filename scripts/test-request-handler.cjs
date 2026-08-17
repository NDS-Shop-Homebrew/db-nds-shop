const games = [
  { title: "Mario Kart DS", systems: "NDS" },
  { title: "Zelda Phantom Hourglass", systems: "NDS" },
];
const note = "test";
const lang = "fr";
const forum = { id: "forum123", name: "game-requests", available_tags: [{ id: "tag1", name: "📥 Demandé" }] };

const noteClean = String(note || "").trim();
const rawGames = Array.isArray(games) ? games : [];
const gamesClean = rawGames
  .map((g) => ({ title: String(g?.title || "").trim(), systems: String(g?.systems || "").trim() }))
  .filter((g) => g.title);

console.log("gamesClean:", gamesClean.length);
if (gamesClean.length < 1 || gamesClean.length > 10) throw new Error("400: 1-10 jeux");
for (const g of gamesClean) {
  if (g.title.length < 2 || g.title.length > 120) throw new Error("400: titre");
  if (g.systems.length > 80) throw new Error("400: systems");
}
if (noteClean.length > 2000) throw new Error("400: note");
if (lang !== "fr" && lang !== "en") throw new Error("400: lang");

const pendingTag = (forum.available_tags || []).find((t) => t.name.includes("Demandé"));
const requester = { id: "123456789012345678", username: "test" };

for (const g of gamesClean) {
  const payload = {
    name: g.title.slice(0, 100),
    applied_tags: pendingTag ? [pendingTag.id] : [],
    message: {
      embeds: [
        {
          title: lang === "fr" ? "🎮 Demande de jeu" : "🎮 Game request",
          color: 0x00b0f4,
          description: `**${g.title}**${g.systems ? `\n*${g.systems}*` : ""}${noteClean ? `\n\n${noteClean}` : ""}`,
          fields: requester
            ? [{ name: lang === "fr" ? "Demandeur" : "Requester", value: requester.id, inline: true }]
            : [],
          footer: { text: "via db-nds-shop.fr" },
          timestamp: new Date().toISOString(),
        },
      ],
    },
  };
  console.log("POST /channels/" + forum.id + "/threads", JSON.stringify(payload));
}

console.log("OK: " + gamesClean.length + " posts forum créés (1 par jeu), champ Demandeur inclus");