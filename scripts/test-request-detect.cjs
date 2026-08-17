const catalog = require("../frontend/public/games.json");

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()[\],.'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const baseTitle = (s) =>
  norm(s)
    .replace(/\s*(france|europe|usa|japan|asia|australia|en|fr|de|es|it|jp)\s*$/i, "")
    .trim();

function detect(query) {
  const q = norm(query);
  const exact = catalog.filter((g) => norm(g.title) === q);
  if (exact.length) return { level: "same", found: exact.map((g) => g.title + " " + g.version) };
  const base = baseTitle(query);
  const byBase = catalog.filter((g) => baseTitle(g.title) === base);
  if (byBase.length) return { level: "region", found: byBase.map((g) => g.title + " " + g.version) };
  const words = q.split(" ").filter((w) => w.length > 3);
  const fuzzy = catalog
    .map((g) => ({ g, score: words.filter((w) => norm(g.title).includes(w)).length }))
    .filter((x) => x.score >= Math.min(2, words.length))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.g);
  return fuzzy.length ? { level: "region", found: fuzzy.map((g) => g.title + " " + g.version) } : { level: "none", found: [] };
}

for (const q of [
  "Animal Crossing",
  "mario kart DS",
  "chrono trigger (france)",
  "Zelda Phantom Hourglass",
  "Beyblade Metal Fusion",
  "totally unknown game xyz",
]) {
  console.log(q, "=>", JSON.stringify(detect(q)));
}