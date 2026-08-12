import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, QrCode, Shuffle, Gamepad2, Clock, Hash, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog";

interface Game {
  fileName: string;
  title: string;
  author: string;
  version: string;
  systems: string[];
  icon: string;
  updated: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

function GameSkeleton() {
  return (
    <div className="w-56 h-72 rounded-xl border border-border/50 bg-card/50 animate-pulse p-4 flex flex-col items-center gap-3">
      <div className="w-24 h-24 rounded-lg bg-muted" />
      <div className="w-40 h-4 rounded bg-muted mt-2" />
      <div className="w-28 h-3 rounded bg-muted mt-auto" />
    </div>
  );
}

function StatsBar({ total }: { total: number }) {
  const { t } = useTranslation();
  const items = [
    { icon: Hash, label: t("home.stats.games"), value: total },
    { icon: Layers, label: t("home.stats.systems"), value: 2 },
    { icon: Clock, label: t("home.stats.updated"), value: new Date().toLocaleDateString() },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-6 md:gap-12">
      {items.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3 font-body text-xl">
          <stat.icon className="w-6 h-6 text-primary" />
          <span className="text-foreground/80">
            <strong className="text-foreground">{stat.value}</strong> — {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomGame, setRandomGame] = useState<Game | null>(null);

  const FAQ: FAQItem[] = [
    { question: t("home.faq.q1"), answer: t("home.faq.a1") },
    { question: t("home.faq.q2"), answer: t("home.faq.a2") },
    { question: t("home.faq.q3"), answer: t("home.faq.a3") },
  ];

  useEffect(() => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((allGames: Game[]) => {
        const sorted = [...allGames].sort(
          (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
        );
        setGames(sorted.slice(0, 6));
        setLoading(false);
      });
  }, []);

  const pickRandom = () => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((all: Game[]) => {
        const pick = all[Math.floor(Math.random() * all.length)];
        setRandomGame(pick);
      });
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-12 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.08)_0%,_transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <Gamepad2 className="w-16 h-16 mx-auto text-primary neon-glow mb-6" />
          <h1 className="font-pixel text-2xl md:text-3xl text-primary neon-text mb-4">
            NDS-Shop
          </h1>
          <p className="font-body text-2xl text-muted-foreground max-w-lg mx-auto mb-8">
            {t("home.tagline")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => (window.location.href = "/homebrew/NDS-Shop.cia")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-body text-xl px-8 py-6"
            >
              <Download className="w-5 h-5 mr-2" />
              {t("home.download")}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="font-body text-xl px-8 py-6 border-primary/30 text-foreground hover:bg-primary/10">
                  <QrCode className="w-5 h-5 mr-2" />
                  {t("home.scan")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-card border-primary/20">
                <div className="flex flex-col items-center p-4">
                  <p className="font-body text-xl mb-4">{t("home.scan_instructions")}</p>
                  <img src="/qrcode-nds-shop.unistore.png" alt="QR Code" className="w-64 h-64 pixel-border" />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto px-4 mb-16"
        >
          <StatsBar total={55} />
        </motion.div>
      )}

      {/* Random Game */}
      <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
        <Button
          onClick={pickRandom}
          variant="outline"
          className="font-body text-xl px-8 py-4 border-accent/30 text-foreground hover:bg-accent/10 hover:border-accent"
        >
          <Shuffle className="w-5 h-5 mr-2 text-accent" />
          {t("home.random")}
        </Button>
        {randomGame && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 inline-block">
            <Link
              to={`/game/${randomGame.fileName}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-accent/30 bg-card/50 hover:bg-card transition-colors"
            >
              <img src={randomGame.icon} alt="" className="w-12 h-12 rounded" />
              <div className="text-left">
                <p className="font-body text-xl text-foreground">{randomGame.title}</p>
                <p className="font-body text-base text-muted-foreground">{randomGame.author}</p>
              </div>
            </Link>
          </motion.div>
        )}
      </div>

      {/* Latest Games */}
      <div className="max-w-7xl mx-auto px-4 mb-16">
        <h2 className="font-pixel text-sm text-primary neon-text text-center mb-8">
          {t("home.latest_games")}
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <GameSkeleton key={i} />)
            : games.map((game, i) => (
                <motion.div
                  key={game.fileName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <Link
                    to={`/game/${game.fileName}`}
                    className="w-56 h-72 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:neon-glow-blue transition-all duration-300 overflow-hidden flex flex-col items-center p-4 group"
                  >
                    <div className="w-24 h-24 rounded-lg overflow-hidden mb-3 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
                      <img src={game.icon} alt={game.title} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-body text-xl text-foreground text-center line-clamp-2 break-words">
                      {game.title}
                    </h3>
                    <p className="font-body text-base text-muted-foreground text-center line-clamp-1 mt-auto">
                      {game.author}
                    </p>
                    <p className="font-body text-sm text-muted-foreground/60 mt-1">
                      {new Date(game.updated).toLocaleDateString(i18n.language, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </Link>
                </motion.div>
              ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 mb-24">
        <h2 className="font-pixel text-sm text-primary neon-text text-center mb-8">
          {t("home.faq.title")}
        </h2>
        <div className="space-y-4">
          {FAQ.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="rounded-xl border border-border/50 bg-card p-6"
            >
              <h3 className="font-body text-2xl text-foreground mb-2">
                {item.question}
              </h3>
              <p className="font-body text-lg text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}