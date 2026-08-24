import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Grid3X3, List, ArrowUpDown, Sparkles, X, SearchX, Download } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../components/ui/empty";
import { InputGroup, InputGroupInput, InputGroupText } from "../components/ui/input-group";
import GameCard from "../components/GameCard";
import SafeImg from "../components/SafeImg";
import { usePageMeta } from "../hooks/usePageMeta";

interface Game {
  fileName: string;
  title: string;
  author: string;
  version: string;
  systems: string[];
  categories?: string[];
  genres?: string[];
  icon: string;
  updated: string;
  screenshots?: { description: string; url: string }[];
}

type SortOption = "title" | "author" | "version" | "updated" | "popular";
type ViewMode = "grid" | "list";

function GameSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square rounded-xl" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export default function GameList() {
  const { t, i18n } = useTranslation();
  usePageMeta(t("gameList.title") + " — NDS-Shop");
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [filterSystem, setFilterSystem] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterLetter, setFilterLetter] = useState<string>("all");
  const [counts, setCounts] = useState<Record<string, number>>({});

  const regionFilter = searchParams.get("region") || "";

  useEffect(() => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((data: Game[]) => {
        setGames(data);
        setLoading(false);
      });
    fetch("/api/v1/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((s) => setCounts(s?.downloads?.byGame || {}))
      .catch(() => {});
  }, []);

  const systems = useMemo(() => {
    const s = new Set<string>();
    games.forEach((g) => g.systems?.forEach((sys) => s.add(sys)));
    return ["all", ...Array.from(s).sort()];
  }, [games]);

  const genres = useMemo(() => {
    const s = new Set<string>();
    games.forEach((g) => g.genres?.forEach((gen) => s.add(gen)));
    return ["all", ...Array.from(s).sort()];
  }, [games]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    games.forEach((g) => g.categories?.forEach((c) => s.add(c)));
    return ["all", ...Array.from(s).sort()];
  }, [games]);

  const letters = useMemo(() => {
    const s = new Set<string>();
    games.forEach((g) => s.add((g.title[0] || "").toUpperCase()));
    return ["all", ...[...s].filter(Boolean).sort()];
  }, [games]);

  const catLabel = (c: string) =>
    c === "game" ? t("gameList.cat.game") : c === "homebrew" ? t("gameList.cat.homebrew") : c === "emulator" ? t("gameList.cat.emulator") : c;

  const filtered = useMemo(() => {
    let result = [...games];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((g) => g.title.toLowerCase().includes(q) || g.author.toLowerCase().includes(q));
    }
    if (filterSystem !== "all") result = result.filter((g) => g.systems?.includes(filterSystem));
    if (filterGenre !== "all") result = result.filter((g) => g.genres?.includes(filterGenre));
    if (filterCategory !== "all") result = result.filter((g) => g.categories?.includes(filterCategory));
    if (filterLetter !== "all") result = result.filter((g) => (g.title[0] || "").toUpperCase() === filterLetter);
    if (regionFilter) result = result.filter((g) => g.version?.includes(regionFilter));
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "author": cmp = a.author.localeCompare(b.author); break;
        case "version": cmp = a.version.localeCompare(b.version); break;
        case "updated": cmp = new Date(b.updated).getTime() - new Date(a.updated).getTime(); break;
        case "popular": cmp = (counts[b.fileName] || 0) - (counts[a.fileName] || 0); break;
        default: cmp = a.title.localeCompare(b.title); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [games, search, sortBy, sortDir, filterSystem, filterGenre, filterCategory, filterLetter, regionFilter, counts]);

  const toggleSort = (field: SortOption) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
  };

  const SortHeader = ({ field, label }: { field: SortOption; label: string }) => (
    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(field)}>
      <span className={`inline-flex items-center gap-1 transition-colors ${sortBy === field ? "text-primary font-semibold" : "hover:text-foreground"}`}>
        {label} <ArrowUpDown size={13} className="opacity-60" />
      </span>
    </TableHead>
  );

  return (
    <div>
      {}
      <section className="dsi-gradient">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{t("gameList.title")}</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">{t("gameList.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
      {}
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
            <div className="flex-1 sm:flex-none sm:w-64">
              <InputGroup>
                <InputGroupText>
                  <Search className="size-4 text-muted-foreground" />
                </InputGroupText>
                <InputGroupInput
                  placeholder={t("gameList.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </div>
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)} variant="outline">
              <ToggleGroupItem value="grid" title="Grille" aria-label="Grille">
                <Grid3X3 size={16} />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" title="Liste" aria-label="Liste">
                <List size={16} />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterSystem} onValueChange={setFilterSystem}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("gameList.all")} />
            </SelectTrigger>
            <SelectContent>
              {systems.map((s) => (
                <SelectItem key={s} value={s}>{s === "all" ? t("gameList.all") : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterGenre} onValueChange={setFilterGenre}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("gameList.allGenres")} />
            </SelectTrigger>
            <SelectContent>
              {genres.map((g) => (
                <SelectItem key={g} value={g}>{g === "all" ? t("gameList.allGenres") : g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("gameList.allCategories")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c === "all" ? t("gameList.allCategories") : catLabel(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterLetter} onValueChange={setFilterLetter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={t("gameList.allLetters")} />
            </SelectTrigger>
            <SelectContent>
              {letters.map((l) => (
                <SelectItem key={l} value={l}>{l === "all" ? t("gameList.allLetters") : l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v as SortOption);
              if (v === "popular") setSortDir("desc");
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("gameList.sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">{t("gameList.name")}</SelectItem>
              <SelectItem value="popular">{t("gameList.popular")}</SelectItem>
              <SelectItem value="updated">{t("gameList.updated")}</SelectItem>
              <SelectItem value="author">{t("gameList.author")}</SelectItem>
              <SelectItem value="version">{t("gameList.version")}</SelectItem>
            </SelectContent>
          </Select>
          {regionFilter && (
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/70" onClick={() => setSearchParams({})}>
              {regionFilter} <X size={14} />
            </Badge>
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
              <GameCard game={game} downloads={counts[game.fileName]} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-14"></TableHead>
                  <SortHeader field="title" label={t("gameList.name")} />
                  <SortHeader field="author" label={t("gameList.author")} />
                  <TableHead className="hidden sm:table-cell whitespace-nowrap">{t("gameList.version")}</TableHead>
                  <SortHeader field="popular" label={t("gameList.downloads")} />
                  <SortHeader field="updated" label={t("gameList.updated")} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((game, i) => (
                  <TableRow
                    key={game.fileName}
                    onClick={() => (window.location.href = `/game/${game.fileName}`)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors text-sm"
                  >
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/60 shrink-0">
                        <SafeImg src={game.icon} alt="" className="w-full h-full object-contain" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{game.title}</TableCell>
                    <TableCell className="text-muted-foreground">{game.author}</TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell whitespace-nowrap">{game.version}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {counts[game.fileName] != null && counts[game.fileName] > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Download size={13} className="text-primary" />
                          {counts[game.fileName].toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground/60 text-xs whitespace-nowrap">
                      {new Date(game.updated).toLocaleDateString(i18n.language)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <Empty className="border-border mt-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>{t("gameList.noResults")}</EmptyTitle>
            <EmptyDescription>{t("gameList.noResultsHint")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
    </div>
  );
}