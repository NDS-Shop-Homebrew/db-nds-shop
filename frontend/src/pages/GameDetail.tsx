import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Download, Heart, Share2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface Download {
  size: number;
  size_str: string;
  url: string;
}

interface Screenshot {
  description: string;
  url: string;
}

interface Game {
  fileName: string;
  title: string;
  author: string;
  version: string;
  systems: string[];
  categories?: string[];
  icon: string;
  image: string;
  color: string;
  color_bg: string;
  updated: string;
  downloads?: Record<string, Download>;
  qr?: Record<string, string>;
  screenshots?: Screenshot[];
}

function useLocalStorageFavorites() {
  const [favs, setFavs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("nds-favs") || "[]");
    } catch {
      return [];
    }
  });
  const toggle = (slug: string) => {
    setFavs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem("nds-favs", JSON.stringify(next));
      return next;
    });
  };
  return { favs, toggle };
}

export default function GameDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const { t, i18n } = useTranslation();
  const { favs, toggle } = useLocalStorageFavorites();

  useEffect(() => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((games: Game[]) => {
        setAllGames(games);
        setGame(games.find((g) => g.fileName === slug) || null);
      });
  }, [slug]);

  const related = useMemo(() => {
    if (!game) return [];
    return allGames
      .filter((g) => g.fileName !== game.fileName)
      .filter((g) => g.author === game.author || g.systems?.some((s) => game.systems?.includes(s)))
      .slice(0, 6);
  }, [game, allGames]);

  const screenshots = game?.screenshots || [];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft") setLightboxIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : screenshots.length - 1));
      if (e.key === "ArrowRight") setLightboxIdx((prev) => (prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0));
    },
    [lightboxIdx, screenshots.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const shareGame = () => {
    navigator.clipboard?.writeText(window.location.href);
  };

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-xl bg-muted" />
          <div className="h-6 w-1/2 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/game-list"
        className="inline-flex items-center gap-2 font-body text-lg text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft size={18} /> {t("gameDetail.back")}
      </Link>

      {/* Banner */}
      <motion.div
        className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-8"
        style={{ backgroundColor: game.color_bg || "#1E293B" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {game.image && (
          <img src={game.image} alt="" className="w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="font-pixel text-lg md:text-2xl text-white neon-text text-center px-4">
            {game.title}
          </h1>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => toggle(game.fileName)}
            className={`p-2 rounded-full backdrop-blur transition-colors ${
              favs.includes(game.fileName) ? "bg-primary/80 text-white" : "bg-black/30 text-white/80 hover:bg-primary/60"
            }`}
            aria-label="Favoris"
          >
            <Heart size={18} fill={favs.includes(game.fileName) ? "currentColor" : "none"} />
          </button>
          <button
            onClick={shareGame}
            className="p-2 rounded-full bg-black/30 text-white/80 hover:bg-primary/60 transition-colors"
            aria-label="Partager"
          >
            <Share2 size={18} />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Icon + info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <img src={game.icon} alt={game.title} className="w-32 h-32 rounded-xl mx-auto md:mx-0 pixel-border" />

          <div className="space-y-2 font-body text-lg">
            <p>
              <span className="text-primary">{t("gameDetail.author")}</span>{" "}
              <span className="text-foreground">{game.author}</span>
            </p>
            <p>
              <span className="text-primary">{t("gameDetail.version")}</span>{" "}
              <span className="text-foreground">{game.version}</span>
            </p>
            <p>
              <span className="text-primary">{t("gameDetail.updated")}</span>{" "}
              <span className="text-foreground">
                {new Date(game.updated).toLocaleDateString(i18n.language)}
              </span>
            </p>
            {game.systems && (
              <p>
                <span className="text-primary">{t("gameDetail.systems")}</span>{" "}
                <span className="text-foreground">{game.systems.join(", ")}</span>
              </p>
            )}
            {game.categories && game.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {game.categories.map((cat) => (
                  <span key={cat} className="px-3 py-1 rounded-full border border-primary/30 text-primary font-body text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Downloads + Screenshots */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-2 space-y-8"
        >
          {/* Downloads */}
          {game.downloads && Object.keys(game.downloads).length > 0 && (
            <div>
              <h2 className="font-pixel text-xs text-primary neon-text mb-4">
                {t("gameDetail.download")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(game.downloads).map(([name, details]) => (
                  <a
                    key={name}
                    href={details.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card hover:border-accent/30 hover:neon-glow-green transition-all duration-300 group"
                  >
                    <Download className="w-6 h-6 text-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="font-body text-lg text-foreground truncate">{name}</p>
                      {details.size_str && (
                        <p className="font-body text-sm text-muted-foreground">{details.size_str}</p>
                      )}
                    </div>
                    <ExternalLink size={16} className="ml-auto shrink-0 text-muted-foreground group-hover:text-accent transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots gallery */}
          {screenshots.length > 0 && (
            <div>
              <h2 className="font-pixel text-xs text-primary neon-text mb-4">
                {t("gameDetail.screenshots")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {screenshots.map((shot, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIdx(i)}
                    className="aspect-video rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all group"
                  >
                    <img src={shot.url} alt={shot.description || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QR */}
          {game.qr && Object.keys(game.qr).length > 0 && (
            <div>
              <h2 className="font-pixel text-xs text-primary neon-text mb-4">
                {t("gameDetail.qr_code")}
              </h2>
              <div className="flex flex-wrap gap-4">
                {Object.entries(game.qr).map(([name, url]) => (
                  <div key={name} className="flex flex-col items-center">
                    <img src={url} alt={name} className="w-28 h-28 rounded pixel-border" />
                    <span className="font-body text-sm text-muted-foreground mt-1">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Related games */}
      {related.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="font-pixel text-xs text-primary neon-text text-center mb-6">
            {t("gameDetail.related")}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {related.map((g) => (
              <Link
                key={g.fileName}
                to={`/game/${g.fileName}`}
                className="w-36 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:neon-glow-blue transition-all duration-300 p-3 group"
              >
                <img src={g.icon} alt="" className="w-full aspect-square rounded-lg mb-2" />
                <p className="font-body text-sm text-foreground text-center line-clamp-2">{g.title}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && screenshots[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + screenshots.length) % screenshots.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <img
            src={screenshots[lightboxIdx].url}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % screenshots.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight size={28} />
          </button>
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
          >
            ✕
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-body text-base text-white/60">
            {lightboxIdx + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}