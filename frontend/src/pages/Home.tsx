import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, Shuffle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
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
  icon: string;
  updated: string;
  screenshots?: { description: string; url: string }[];
}

function GameSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square rounded-xl" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  usePageMeta("NDS-Shop — " + t("home.tagline"));
  const [games, setGames] = useState<Game[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomGame, setRandomGame] = useState<Game | null>(null);
  const [stats, setStats] = useState<{ games: number; systems: Record<string, number>; downloads?: { total: number } } | null>(null);

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
            { label: t("home.stats.downloads"), value: stats?.downloads?.total?.toLocaleString(i18n.language) ?? "—" },
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
                <SafeImg
                  src={randomGame.screenshots?.find((s) => s.description === "Boxart")?.url || randomGame.icon}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover"
                  wrapperClassName="w-14 h-14 rounded-lg bg-muted shrink-0"
                />
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
            <Link key={region} to={`/game-list?region=${encodeURIComponent(region)}`} className="inline-flex">
              <Badge variant="outline" className="px-5 py-2 text-sm font-medium cursor-pointer hover:border-primary/50 hover:text-primary">
                {region}
              </Badge>
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
                  <GameCard game={game} />
                </motion.div>
              ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 mb-20">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          {t("home.faq.title")}
        </h2>
        <Accordion type="multiple" className="space-y-4">
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
            >
              <AccordionItem value={`faq-${i}`} className="rounded-xl border border-border bg-card px-5 shadow-sm">
                <AccordionTrigger className="font-semibold text-foreground">{t(item.q)}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {t(item.a)}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </div>
  );
}