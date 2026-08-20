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

interface Game {
  fileName: string;
  title: string;
  author: string;
  systems: string[];
  icon: string;
  screenshots?: { description: string; url: string }[];
}

export default function Favorites() {
  const { t } = useTranslation();
  usePageMeta(t("nav.favorites") + " — NDS-Shop");
  const { favs, toggle } = useFavorites();
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((all: Game[]) => {
        setAllGames(all);
        setLoading(false);
      });
  }, []);

  const games = allGames.filter((g) => favs.includes(g.fileName));
  const removeFav = (slug: string) => toggle(slug);

  return (
    <div>
      {/* Hero */}
      <section className="dsi-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{t("nav.favorites")}</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto">{t("favorites.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
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
            <Link to="/game-list" className="inline-flex">
              <Button>{t("nav.gameList")}</Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {games.map((game, i) => (
            <motion.div key={game.fileName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GameCard
                game={game}
                isFav
                onToggleFav={() => removeFav(game.fileName)}
              />
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}