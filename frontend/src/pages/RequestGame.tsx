import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Send, Plus, X, CheckCircle2, Info, Gamepad2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import DiscordLogin from "../components/DiscordLogin";
import { API_BASE_URL } from "../config";

interface CatalogGame {
  fileName: string;
  title: string;
  author: string;
  version: string;
  systems: string[];
}

interface Entry {
  title: string;
  systems: string;
  match: { level: "none" | "same" | "region"; found: CatalogGame[] };
}

const MAX_GAMES = 10;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()[\],.'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const baseTitle = (s: string) =>
  norm(s).replace(/\s*(france|europe|usa|japan|asia|australia|en|fr|de|es|it|jp)\s*$/i, "").trim();

function detectMatch(query: string, catalog: CatalogGame[]): Entry["match"] {
  const q = norm(query);
  if (q.length < 3) return { level: "none", found: [] };

  const exact = catalog.filter((g) => norm(g.title) === q);
  if (exact.length > 0) return { level: "same", found: exact };

  const base = baseTitle(query);
  const byBase = catalog.filter((g) => baseTitle(g.title) === base);
  if (byBase.length > 0) return { level: "region", found: byBase };

  const words = q.split(" ").filter((w) => w.length > 3);
  const fuzzy = catalog
    .map((g) => ({ g, score: words.filter((w) => norm(g.title).includes(w)).length }))
    .filter((x) => x.score >= Math.min(2, words.length))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.g);
  return fuzzy.length > 0 ? { level: "region", found: fuzzy } : { level: "none", found: [] };
}

export default function RequestGame() {
  const { t, i18n } = useTranslation();
  const [catalog, setCatalog] = useState<CatalogGame[]>([]);
  const [entries, setEntries] = useState<Entry[]>([{ title: "", systems: "", match: { level: "none", found: [] } }]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    fetch("/games.json")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => {});
  }, []);

  const updateEntry = (i: number, patch: Partial<Entry>) => {
    setEntries((prev) => {
      const next = prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
      if (patch.title !== undefined) {
        next[i] = { ...next[i], match: detectMatch(patch.title || "", catalog) };
      }
      return next;
    });
  };

  const addEntry = () => {
    if (entries.length >= MAX_GAMES) return;
    setEntries((prev) => [...prev, { title: "", systems: "", match: { level: "none", found: [] } }]);
  };

  const removeEntry = (i: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== i));
  };

  const gamesValid = entries.filter((e) => e.title.trim().length >= 2);
  const canSubmit = gamesValid.length >= 1 && status !== "loading";

  const submit = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE_URL}/v1/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          games: gamesValid.map((e) => ({ title: e.title.trim(), systems: e.systems.trim() })),
          note,
          lang: i18n.language,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setEntries([{ title: "", systems: "", match: { level: "none", found: [] } }]);
      setNote("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      <section className="dsi-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Gamepad2 className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{t("request.title")}</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto">{t("request.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("request.title")}</CardTitle>
            <CardDescription>{t("request.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DiscordLogin />

            {entries.map((entry, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {entries.length > 1 ? `${t("request.gameLabel")} ${i + 1}` : t("request.gameLabel")}
                  </Label>
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title={t("request.remove")}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <Input
                  value={entry.title}
                  onChange={(e) => updateEntry(i, { title: e.target.value })}
                  placeholder={t("request.gamePlaceholder")}
                  maxLength={120}
                />
                <Input
                  value={entry.systems}
                  onChange={(e) => updateEntry(i, { systems: e.target.value })}
                  placeholder={t("request.systemsPlaceholder")}
                  maxLength={80}
                />

                {entry.match.level !== "none" && (
                  <div
                    className={`flex items-start gap-2 rounded-md p-2 text-sm ${
                      entry.match.level === "same"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {entry.match.level === "same" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <Info size={16} className="mt-0.5 shrink-0" />}
                    <div>
                      <p>
                        {entry.match.level === "same"
                          ? t("request.alreadyInCatalog")
                          : t("request.similarFound")}
                      </p>
                      {entry.match.found.map((g) => (
                        <p key={g.fileName} className="text-xs opacity-90 mt-0.5">
                          {g.title} — {g.version}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {entries.length < MAX_GAMES && (
              <Button variant="outline" onClick={addEntry} className="w-full">
                <Plus size={16} /> {t("request.addAnother")}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {t("request.maxGames", { count: MAX_GAMES })}
            </p>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("request.noteLabel")}</Label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={t("request.notePlaceholder")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button onClick={submit} disabled={!canSubmit}>
              <Send size={16} /> {t("request.submit")}
            </Button>
            {status === "done" && (
              <p className="text-sm text-green-600 dark:text-green-400">{t("request.done")}</p>
            )}
            {status === "error" && (
              <p className="text-sm text-red-600 dark:text-red-400">{t("request.error")}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
}