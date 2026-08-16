import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, Shuffle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "../components/ui/dialog";

interface Game {
  fileName: string;
  title: string;
  author: string;
  version: string;
  systems: string[];
  categories?: string[];
  icon: string;
  updated: string;
}

function GameSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-24 h-24 rounded-xl bg-muted mb-3 mx-auto" />
      <div className="h-4 w-3/4 rounded bg-muted mb-2 mx-auto" />
      <div className="h-3 w-1/2 rounded bg-muted mx-auto" />
    </div>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomGame, setRandomGame] = useState<Game | null>(null);
  const [stats, setStats] = useState<{ games: number; systems: Record<string, number> } | null>(null);

  useEffect(() => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((allGames: Game[]) => {
        setAllGames(allGames);
        const sorted = [...allGames].sort(
          (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
        );
        setGames(sorted.slice(0, 6));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("/api/v1/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {});
  }, []);

  const pickRandom = () => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((all: Game[]) => {
        setRandomGame(all[Math.floor(Math.random() * all.length)]);
      });
  };

  const regions = ["France", "Europe"];

  return (
    <div>
      {/* Hero */}
      <section className="dsi-gradient text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src="/logo.png" alt="NDS-Shop" className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">NDS-Shop</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-lg mx-auto mb-8">
              {t("home.tagline")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => (window.location.href = "https://github.com/NDS-Shop-Homebrew/NDS-Shop/releases/latest/download/NDS-Shop.cia")}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                {t("home.download")}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-white/20 text-white hover:bg-white/30 border border-white/30 font-semibold px-8 py-6 text-lg">
                    <QrCode className="w-5 h-5 mr-2" />
                    {t("home.scan")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogTitle className="sr-only">{t("home.scan")}</DialogTitle>
                  <DialogDescription className="sr-only">{t("home.scan_instructions")}</DialogDescription>
                  <div className="flex flex-col items-center p-4">
                    <p className="mb-4 text-center text-muted-foreground">{t("home.scan_instructions")}</p>
                    <div className="bg-white p-4 rounded-xl">
                      <QRCodeSVG
                        value="https://db-nds-shop.fr/d"
                        size={256}
                        level="H"
                        marginSize={4}
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                        className="w-64 h-64"
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 mb-12">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-wrap justify-center gap-8">
          {[
            { label: t("home.stats.games"), value: stats?.games ?? allGames.length },
            { label: t("home.stats.systems"), value: Object.keys(stats?.systems || {}).length },
            { label: t("home.stats.updated"), value: new Date().toLocaleDateString(i18n.language) },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Random Game */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={pickRandom}
            variant="outline"
            className="gap-2"
          >
            <Shuffle className="w-4 h-4" />
            {t("home.random")}
          </Button>
          {randomGame && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                to={`/game/${randomGame.fileName}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <img src={randomGame.icon} alt="" className="w-14 h-14 rounded-lg" />
                <div>
                  <p className="font-semibold text-foreground">{randomGame.title}</p>
                  <p className="text-sm text-muted-foreground">{randomGame.author}</p>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Browsing by region */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex flex-wrap justify-center gap-3">
          {regions.map((region) => (
            <Link
              key={region}
              to={`/game-list?region=${encodeURIComponent(region)}`}
              className="px-5 py-2 rounded-full border border-border bg-card text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              {region}
            </Link>
          ))}
        </div>
      </div>

      {/* Latest Games */}
      <div className="max-w-7xl mx-auto px-4 mb-20">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {t("home.latest_games")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <GameSkeleton key={i} />)
            : games.map((game, i) => (
                <motion.div
                  key={game.fileName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/game/${game.fileName}`}
                    className="block group"
                  >
                    <div className="rounded-xl bg-muted/60 mb-3 ring-1 ring-border group-hover:ring-primary/50 transition-all p-3">
                      <img src={game.icon} alt={game.title} className="w-full aspect-square object-contain" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                      {game.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{game.author}</p>
                  </Link>
                </motion.div>
              ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 mb-20">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          {t("home.faq.title")}
        </h2>
        <div className="space-y-4">
          {[
            { q: "home.faq.q1", a: "home.faq.a1" },
            { q: "home.faq.q2", a: "home.faq.a2" },
            { q: "home.faq.q3", a: "home.faq.a3" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-semibold text-foreground mb-1">{t(item.q)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(item.a)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}