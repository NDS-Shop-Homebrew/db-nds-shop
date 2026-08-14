import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";

interface Game {
  fileName: string;
  title: string;
  author: string;
  systems: string[];
  icon: string;
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" /> {t("nav.favorites")}
      </h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-20 h-20 mx-auto rounded-xl bg-muted" />
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
            <motion.div key={game.fileName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="relative group">
              <Link to={`/game/${game.fileName}`} className="block group">
                <div className="rounded-xl overflow-hidden bg-muted mb-2 ring-1 ring-border group-hover:ring-primary/50 transition-all">
                  <img src={game.icon} alt={game.title} className="w-20 h-20 mx-auto object-contain" />
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{game.title}</p>
              </Link>
              <button
                onClick={() => removeFav(game.fileName)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur text-red-500 hover:bg-red-50 transition-colors"
                title={t("favorites.remove")}
              >
                <Heart size={16} fill="currentColor" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}