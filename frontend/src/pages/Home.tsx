import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, QrCode } from "lucide-react";
import { useTranslation } from "../../node_modules/react-i18next";
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

export default function Home() {
    const { t, i18n } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const FAQ: FAQItem[] = [
    { question: t("home.faq.q1"), answer: t("home.faq.a1") },
    { question: t("home.faq.q2"), answer: t("home.faq.a2") },
    { question: t("home.faq.q3"), answer: t("home.faq.a3") },
  ];

  useEffect(() => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((allGames: Game[]) => {
        const latest = [...allGames]
          .sort(
            (a, b) =>
              new Date(b.updated).getTime() - new Date(a.updated).getTime()
          )
          .slice(0, 4);
        setGames(latest);
      });
  }, []);

  if (games.length === 0)
    return <p className="p-6">{t("home.loading_games")}</p>;

  return (
    <div className="p-6 space-y-16 max-w-7xl mx-auto">
      {/* --- Header with Download and QR Code Buttons --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-center items-center gap-6 p-4"
      >
        <Button
          onClick={() => (window.location.href = "/homebrew/NDS-Shop.cia")}
          className="bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          {t("home.download")}
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              {t("home.scan")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <div className="flex flex-col items-center">
              <p className="mb-4 text-center">{t("home.scan_instructions")}</p>
              <img
                src="/qrcode-nds-shop.unistore.png"
                alt="QR Code"
                className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96"
              />
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* --- FAQ Section --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-10 p-4"
      >
        <h2 className="text-3xl font-bold text-center text-indigo-500 mb-8">
          {t("home.faq.title")}
        </h2>

        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          {FAQ.map((item, index) => (
            <motion.div
              key={index}
              layout
              initial={{ borderRadius: 16 }}
              whileHover={{ scale: 1.02 }}
              className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-2xl p-6 transition-transform duration-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {item.question}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {item.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* --- Latest Games --- */}
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex flex-wrap justify-center gap-4 p-4">
        {t("home.latest_games")}
      </h1>

      <motion.div
        className="flex flex-wrap justify-center gap-4 p-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {games.map((game) => (
          <motion.div
            key={game.fileName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to={`/game/${game.fileName}`}
              className="w-64 h-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden cursor-pointer flex flex-col items-center p-4"
            >
              <div className="w-32 h-32 rounded-lg overflow-hidden mb-2">
                <img
                  src={game.icon}
                  alt={game.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center line-clamp-2 break-words">
                {game.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center line-clamp-1 break-words mt-auto">
                {game.author}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1">
                {t("gameDetail.updated")}{" "}
                {new Date(game.updated).toLocaleDateString(i18n.language, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Lightbox Overlay */}
      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Enlarged view"
            className="max-w-full max-h-full rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
