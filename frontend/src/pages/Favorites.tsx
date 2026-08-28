import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../components/ui/empty";
import GameCard from "../components/GameCard";
import { usePageMeta } from "../hooks/usePageMeta";
import { useFavorites } from "../hooks/useFavorites";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface RawGameApi {
  id?: string;
  fileName?: string;
  title?: string;
  author?: string;
  version?: string;
  systems?: string[];
  categories?: string[];
  icon?: string;
  iconUrl?: string;
  updated?: string;
  updatedAt?: string;
  screenshots?: { description?: string; url: string }[];
}

interface GamesApiResponse {
  games?: RawGameApi[];
}

interface Game {
  id?: string;
  fileName: string;
  title: string;
  author: string;
  version: string;
  systems: string[];
  categories?: string[];
  icon: string;
  updated: string;
  screenshots: { description: string; url: string }[];
}

export default function Favorites() {
  const { t } = useTranslation();
  usePageMeta(t("nav.favorites") + " — NDS-Shop");
  const { favs, toggle } = useFavorites();
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/games`)
      .then((res) => (res.ok ? res.json() : { games: [] }))
      .then((data: GamesApiResponse | RawGameApi[]) => {
        const list = Array.isArray(data) ? data : data.games || [];
        const normalized: Game[] = list.map((g) => ({
          id: g.id || g.fileName || "",
          fileName: g.fileName || g.id || "",
          title: g.title || "",
          author: g.author || "",
          version: g.version || "",
          systems: Array.isArray(g.systems) ? g.systems : [],
          categories: Array.isArray(g.categories) ? g.categories : [],
          icon: g.icon || g.iconUrl || "",
          updated: g.updated || g.updatedAt || "",
          screenshots: (g.screenshots || []).map((s) => ({
            description: s.description || "",
            url: s.url || "",
          })),
        }));
        setAllGames(normalized);
      })
      .catch((err) => console.error("Failed to load favorites games:", err))
      .finally(() => setLoading(false));
  }, []);

  const games = allGames.filter((g) => favs.includes(g.fileName) || (g.id && favs.includes(g.id)));
  const removeFav = (slug: string) => toggle(slug);

  return (
    <div>
      <section className="dsi-gradient">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{t("nav.favorites")}</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">{t("favorites.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <Empty className="border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Heart />
              </EmptyMedia>
              <EmptyTitle>{t("favorites.empty")}</EmptyTitle>
              <EmptyDescription>{t("favorites.emptyHint")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link to="/game-list">{t("nav.gameList")}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {games.map((game, i) => (
              <motion.div key={game.fileName || game.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GameCard
                  game={game}
                  isFav
                  onToggleFav={() => removeFav(game.fileName || game.id || "")}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}