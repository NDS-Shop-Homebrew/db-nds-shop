import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Grid3X3, List, ArrowUpDown } from "lucide-react";
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
    <div className="w-full max-w-xs rounded-xl border border-border/50 bg-card/50 animate-pulse p-4 space-y-3">
      <div className="w-20 h-20 rounded-lg bg-muted mx-auto" />
      <div className="w-40 h-4 rounded bg-muted mx-auto" />
      <div className="w-28 h-3 rounded bg-muted mx-auto" />
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
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.author.toLowerCase().includes(q)
      );
    }

    if (filterSystem !== "all") {
      result = result.filter((g) => g.systems?.includes(filterSystem));
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "author":
          cmp = a.author.localeCompare(b.author);
          break;
        case "version":
          cmp = a.version.localeCompare(b.version);
          break;
        case "updated":
          cmp = new Date(b.updated).getTime() - new Date(a.updated).getTime();
          break;
        case "title":
        default:
          cmp = a.title.localeCompare(b.title);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [games, search, sortBy, sortDir, filterSystem]);

  const toggleSort = (field: SortOption) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <h1 className="font-pixel text-sm text-primary neon-text">
          {t("gameList.title")}
        </h1>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("gameList.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full md:w-56 font-body text-lg"
            />
          </div>

          <select
            value={filterSystem}
            onChange={(e) => setFilterSystem(e.target.value)}
            className="bg-card border border-border rounded px-3 py-2 font-body text-lg text-foreground"
          >
            {systems.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? t("gameList.all") : s}
              </option>
            ))}
          </select>

          <div className="flex border border-border rounded overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-2 ${view === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 ${view === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-wrap justify-center gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <GameSkeleton key={i} />
          ))}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((game, i) => (
            <motion.div
              key={game.fileName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Link
                to={`/game/${game.fileName}`}
                className="block rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:neon-glow-blue transition-all duration-300 p-4 group"
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
                  <img src={game.icon} alt={game.title} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-body text-lg text-foreground line-clamp-2">
                  {game.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground line-clamp-1 mt-1">
                  {game.author}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 font-body text-lg">
                <th className="p-3 text-left w-12"></th>
                <th className="p-3 text-left cursor-pointer" onClick={() => toggleSort("title")}>
                  <span className="flex items-center gap-1">
                    {t("gameList.name")} <ArrowUpDown size={14} />
                  </span>
                </th>
                <th className="p-3 text-left hidden md:table-cell cursor-pointer" onClick={() => toggleSort("author")}>
                  <span className="flex items-center gap-1">
                    {t("gameList.author")} <ArrowUpDown size={14} />
                  </span>
                </th>
                <th className="p-3 text-left hidden sm:table-cell cursor-pointer" onClick={() => toggleSort("version")}>
                  <span className="flex items-center gap-1">
                    {t("gameList.version")} <ArrowUpDown size={14} />
                  </span>
                </th>
                <th className="p-3 text-left hidden lg:table-cell cursor-pointer" onClick={() => toggleSort("updated")}>
                  <span className="flex items-center gap-1">
                    {t("gameList.updated")} <ArrowUpDown size={14} />
                  </span>
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
                  className="cursor-pointer border-t border-border/30 hover:bg-muted/30 transition-colors font-body text-lg"
                >
                  <td className="p-3">
                    <img src={game.icon} alt="" className="w-10 h-10 rounded" />
                  </td>
                  <td className="p-3 text-foreground">{game.title}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{game.author}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{game.version}</td>
                  <td className="p-3 text-muted-foreground/60 text-base hidden lg:table-cell">
                    {new Date(game.updated).toLocaleDateString(i18n.language)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center font-body text-xl text-muted-foreground py-12">
          {t("gameList.noResults")}
        </p>
      )}
    </div>
  );
}