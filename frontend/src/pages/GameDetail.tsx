import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "../../node_modules/react-i18next";

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

export default function GameDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((games: Game[]) => {
        const found = games.find((g) => g.fileName === slug);
        setGame(found || null);
      });
  }, [slug]);

  if (!game)
    return (
      <p className="p-6 text-red-500 font-bold">{t("gameDetail.not_found")}</p>
    );

  return (
    <div className="p-6 space-y-8">
      {/* --- Banner --- */}
      <motion.div
        className="w-full h-48 sm:h-64 rounded-lg relative overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: game.color_bg }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <img
          src={game.image}
          alt={`${game.title} Banner`}
          className="w-full h-full object-cover opacity-40"
        />
        <h1 className="absolute text-3xl sm:text-5xl font-bold text-white text-center px-4">
          {game.title}
        </h1>
      </motion.div>

      {/* --- Main Info --- */}
      <motion.div
        className="flex flex-col md:flex-row gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Left Column: Icon + basic info */}
        <div className="flex flex-col items-center md:items-start gap-3 w-full md:w-1/3">
          <img
            src={game.icon}
            alt={`${game.title} Icon`}
            className="w-32 h-32 rounded-lg shadow-lg"
          />
          <p>
            <strong style={{ color: game.color }}>
              {t("gameDetail.author")}
            </strong>{" "}
            {game.author}
          </p>
          <p>
            <strong style={{ color: game.color }}>
              {t("gameDetail.version")}
            </strong>{" "}
            {game.version}
          </p>
          <p>
            <strong style={{ color: game.color }}>
              {t("gameDetail.updated")}
            </strong>{" "}
            {new Date(game.updated).toLocaleDateString(i18n.language, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
          {game.categories && (
            <p>
              <strong style={{ color: game.color }}>
                {t("gameDetail.categories")}
              </strong>{" "}
              {game.categories.join(", ")}
            </p>
          )}
          {game.systems && (
            <p>
              <strong style={{ color: game.color }}>
                {t("gameDetail.systems")}
              </strong>{" "}
              {game.systems.join(", ")}
            </p>
          )}
        </div>

        {/* Right Column: Downloads, QR, Screenshots */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Downloads */}
          {game.downloads && Object.keys(game.downloads).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: game.color }}
              >
                {t("gameDetail.download")}
              </h2>
              <ul className="list-disc ml-5 space-y-1">
                {Object.entries(game.downloads).map(([name, details]) => (
                  <li key={name}>
                    <a
                      href={details.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-500 hover:underline"
                    >
                      {name}
                    </a>{" "}
                    ({details.size_str})
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* QR Codes */}
          {game.qr && Object.keys(game.qr).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: game.color }}
              >
                {t("gameDetail.qr_code")}
              </h2>
              <div className="flex flex-wrap gap-4">
                {Object.entries(game.qr).map(([name, url]) => (
                  <div key={name} className="flex flex-col items-center">
                    <img
                      src={url}
                      alt={`QR Code for ${name}`}
                      className="w-32 h-32 cursor-pointer hover:scale-105 transition-transform rounded-lg"
                      onClick={() => setLightboxImg(url)}
                    />
                    <span className="text-xs mt-1 text-gray-500">{name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Screenshots */}
          {game.screenshots && game.screenshots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: game.color }}
              >
                {t("gameDetail.screenshots")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {game.screenshots.map((shot, i) => (
                  <img
                    key={i}
                    src={shot.url}
                    alt={shot.description || "Screenshot"}
                    className="w-full h-48 object-cover rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setLightboxImg(shot.url)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
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
