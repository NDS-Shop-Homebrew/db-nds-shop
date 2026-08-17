import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Grid3X3, List, ArrowUpDown, Sparkles, X } from "lucide-react";
import { Input } from "../components/ui/input";
import GameCard from "../components/GameCard";
import SafeImg from "../components/SafeImg";

interface Game {
  fileName: string;
  title: string;
  author: string;
  version: string;
  systems: string[];
  icon: string;
  updated: string;
  screenshots?: { description: string; url: string }[];
}

type SortOption = "title" | "author" | "version" | "updated";
type ViewMode = "grid" | "list";

function GameSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-xl bg-muted/60 mb-3" />
      <div className="h-3 w-3/4 rounded bg-muted mb-2" />
      <div className="h-3 w-1/2 rounded bg-muted" />
    </div>
  );
}

export default function GameList() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [filterSystem, setFilterSystem] = useState<string>("all");

  const regionFilter = searchParams.get("region") || "";

  useEffect(() => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((data: Game[]) => {
        setGames(data);
        setLoading(false);
      });
  }, []);

  const systems = useMemo(() => {
    const s = new Set<string>();
    games.forEach((g) => g.systems?.forEach((sys) => s.add(sys)));
    return ["all", ...Array.from(s).sort()];
  }, [games]);

  const filtered = useMemo(() => {
    let result = [...games];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((g) => g.title.toLowerCase().includes(q) || g.author.toLowerCase().includes(q));
    }
    if (filterSystem !== "all") result = result.filter((g) => g.systems?.includes(filterSystem));
    if (regionFilter) result = result.filter((g) => g.version?.includes(regionFilter));
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "author": cmp = a.author.localeCompare(b.author); break;
        case "version": cmp = a.version.localeCompare(b.version); break;
        case "updated": cmp = new Date(b.updated).getTime() - new Date(a.updated).getTime(); break;
        default: cmp = a.title.localeCompare(b.title); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [games, search, sortBy, sortDir, filterSystem, regionFilter]);

  const toggleSort = (field: SortOption) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
  };

  const SortHeader = ({ field, label }: { field: SortOption; label: string }) => (
    <th
      className="p-3 text-left cursor-pointer select-none whitespace-nowrap"
      onClick={() => toggleSort(field)}
    >
      <span className={`inline-flex items-center gap-1 transition-colors ${sortBy === field ? "text-primary font-semibold" : "hover:text-foreground"}`}>
        {label} <ArrowUpDown size={13} className="opacity-60" />
      </span>
    </th>
  );

  return (
    <div>
      {/* Hero */}
      <section className="dsi-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{t("gameList.title")}</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto">{t("gameList.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header : recherche + filtres + toggle */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm font-normal text-muted-foreground">
            {t("gameList.title")}
            {!loading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({filtered.length})
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("gameList.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="flex border border-input rounded-lg overflow-hidden shrink-0">
              <button onClick={() => setView("grid")} className={`p-2.5 ${view === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`} title="Grille">
                <Grid3X3 size={16} />
              </button>
              <button onClick={() => setView("list")} className={`p-2.5 ${view === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`} title="Liste">
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filtres actifs */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterSystem}
            onChange={(e) => setFilterSystem(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {systems.map((s) => (
              <option key={s} value={s}>{s === "all" ? t("gameList.all") : s}</option>
            ))}
          </select>
          {regionFilter && (
            <button
              onClick={() => setSearchParams({})}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-primary text-sm font-medium hover:bg-secondary/70 transition-colors"
            >
              {regionFilter} <X size={14} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <GameSkeleton key={i} />)}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((game, i) => (
            <motion.div key={game.fileName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <GameCard game={game} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 text-sm text-muted-foreground">
                  <th className="p-3 text-left w-14"></th>
                  <SortHeader field="title" label={t("gameList.name")} />
                  <SortHeader field="author" label={t("gameList.author")} />
                  <th className="p-3 text-left hidden sm:table-cell whitespace-nowrap">{t("gameList.version")}</th>
                  <SortHeader field="updated" label={t("gameList.updated")} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((game, i) => (
                  <motion.tr
                    key={game.fileName}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    onClick={() => (window.location.href = `/game/${game.fileName}`)}
                    className="cursor-pointer border-t border-border/50 hover:bg-muted/40 transition-colors text-sm"
                  >
                    <td className="p-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/60 shrink-0">
                        <SafeImg src={game.icon} alt="" className="w-full h-full object-contain" />
                      </div>
                    </td>
                    <td className="p-3 font-medium text-foreground">{game.title}</td>
                    <td className="p-3 text-muted-foreground">{game.author}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell whitespace-nowrap">{game.version}</td>
                    <td className="p-3 text-muted-foreground/60 text-xs whitespace-nowrap">
                      {new Date(game.updated).toLocaleDateString(i18n.language)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">{t("gameList.noResults")}</p>
      )}
    </div>
    </div>
  );
}