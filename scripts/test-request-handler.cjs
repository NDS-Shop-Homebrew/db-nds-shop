// Simule le handler /request pour vérifier qu'aucun bug de logique ne cause un 500.
const games = [
  { title: "Mario Kart DS", systems: "NDS" },
  { title: "Zelda Phantom Hourglass", systems: "NDS" },
];
const note = "test";
const lang = "fr";

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

const payload = {
  embeds: [
    {
      title: lang === "fr"
        ? `🎮 ${gamesClean.length > 1 ? `${gamesClean.length} demandes de jeu` : "Demande de jeu"}`
        : `🎮 ${gamesClean.length > 1 ? `${gamesClean.length} game requests` : "Game request"}`,
      color: 0x00b0f4,
      fields: [
        ...gamesClean.map((g, i) => ({
          name: lang === "fr" ? `${gamesClean.length > 1 ? `${i + 1}. ` : ""}Jeu` : `${gamesClean.length > 1 ? `${i + 1}. ` : ""}Game`,
          value: g.systems ? `**${g.title}**\n*${g.systems}*` : `**${g.title}**`,
          inline: gamesClean.length > 3 ? false : true,
        })),
        ...(noteClean ? [{ name: lang === "fr" ? "Note" : "Note", value: noteClean }] : []),
      ],
      footer: { text: "via db-nds-shop.fr" },
      timestamp: new Date().toISOString(),
    },
  ],
};

console.log("payload OK, fields:", payload.embeds[0].fields.length);
console.log(JSON.stringify(payload, null, 1));