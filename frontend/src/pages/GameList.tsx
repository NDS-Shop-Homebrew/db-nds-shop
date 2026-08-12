import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Grid3X3, List, ArrowUpDown, Sparkles } from "lucide-react";
import { Input } from "../components/ui/input";

interface Game {
  fileName: string;
  title: string;
  author: string;
  version: string;
  systems: string[];
  icon: string;
  updated: string;
}

type SortOption = "title" | "author" | "version" | "updated";
type ViewMode = "grid" | "list";

function GameSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-xl bg-muted mb-3" />
      <div className="h-4 w-3/4 rounded bg-muted mb-2" />
      <div className="h-3 w-1/2 rounded bg-muted" />
    </div>
  );
}

export default function GameList() {
  const { t, i18n } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [filterSystem, setFilterSystem] = useState<string>("all");

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
  }, [games, search, sortBy, sortDir, filterSystem]);

  const toggleSort = (field: SortOption) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> {t("gameList.title")}
        </h1>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("gameList.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full md:w-56"
            />
          </div>
          <select
            value={filterSystem}
            onChange={(e) => setFilterSystem(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {systems.map((s) => (
              <option key={s} value={s}>{s === "all" ? t("gameList.all") : s}</option>
            ))}
          </select>
          <div className="flex border border-input rounded-lg overflow-hidden">
            <button onClick={() => setView("grid")} className={`p-2.5 ${view === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
              <Grid3X3 size={16} />
            </button>
            <button onClick={() => setView("list")} className={`p-2.5 ${view === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
              <List size={16} />
            </button>
          </div>
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
              <Link to={`/game/${game.fileName}`} className="block group">
                <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3 ring-1 ring-border group-hover:ring-primary/50 transition-all">
                  <img src={game.icon} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{game.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">{game.author}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-sm">
                <th className="p-3 text-left w-10"></th>
                <th className="p-3 text-left cursor-pointer select-none" onClick={() => toggleSort("title")}>
                  <span className="flex items-center gap-1">{t("gameList.name")} <ArrowUpDown size={14} /></span>
                </th>
                <th className="p-3 text-left hidden md:table-cell cursor-pointer select-none" onClick={() => toggleSort("author")}>
                  <span className="flex items-center gap-1">{t("gameList.author")} <ArrowUpDown size={14} /></span>
                </th>
                <th className="p-3 text-left hidden sm:table-cell cursor-pointer select-none" onClick={() => toggleSort("version")}>
                  <span className="flex items-center gap-1">{t("gameList.version")} <ArrowUpDown size={14} /></span>
                </th>
                <th className="p-3 text-left hidden lg:table-cell cursor-pointer select-none" onClick={() => toggleSort("updated")}>
                  <span className="flex items-center gap-1">{t("gameList.updated")} <ArrowUpDown size={14} /></span>
                </th>
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
                  className="cursor-pointer border-t border-border/50 hover:bg-muted/50 transition-colors text-sm"
                >
                  <td className="p-3"><img src={game.icon} alt="" className="w-9 h-9 rounded-lg" /></td>
                  <td className="p-3 font-medium text-foreground">{game.title}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{game.author}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{game.version}</td>
                  <td className="p-3 text-muted-foreground/60 text-xs hidden lg:table-cell">
                    {new Date(game.updated).toLocaleDateString(i18n.language)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">{t("gameList.noResults")}</p>
      )}
    </div>
  );
}