import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import GameCard from "../components/GameCard";

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
  const [games, setGames] = useState<Game[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fav = JSON.parse(localStorage.getItem("nds-favs") || "[]");
    setFavs(fav);
    fetch("/games.json")
      .then((res) => res.json())
      .then((all: Game[]) => {
        setGames(all.filter((g) => fav.includes(g.fileName)));
        setLoading(false);
      });
  }, []);

  const removeFav = (slug: string) => {
    const next = favs.filter((f) => f !== slug);
    setFavs(next);
    localStorage.setItem("nds-favs", JSON.stringify(next));
    setGames((prev) => prev.filter((g) => g.fileName !== slug));
  };

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square rounded-xl bg-muted/60 mb-3" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">{t("favorites.empty")}</p>
          <Link to="/game-list" className="text-primary hover:underline font-medium">
            {t("nav.gameList")}
          </Link>
        </div>
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