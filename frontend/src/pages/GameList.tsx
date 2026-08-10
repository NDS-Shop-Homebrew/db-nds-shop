import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "../../node_modules/react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";

interface Game {
  fileName: string;
  title: string;
  author: string;
  version: string;
  systems: string[];
  icon: string;
  updated: string;
}

type SortOption = "title" | "author" | "version" | "updated";

export default function GameList() {
  const { t, i18n } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("title");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    fetch("/games.json")
      .then((res) => res.json())
      .then(setGames);
  }, []);

  const filteredGames = games.filter(
    (game) =>
      game.title.toLowerCase().includes(search.toLowerCase()) ||
      game.author.toLowerCase().includes(search.toLowerCase())
  );

  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case "author":
        return a.author.localeCompare(b.author);
      case "version":
        return a.version.localeCompare(b.version);
      case "updated":
        return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      case "title":
      default:
        return a.title.localeCompare(b.title);
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* --- Header + Search/Sort --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          {t("gameList.title")}
        </h1>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          {/* --- Search --- */}
          <Input
            placeholder={t("gameList.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64"
          />

          {/* --- Sort --- */}
          <Select
            defaultValue={sortBy}
            onValueChange={(val: string) => setSortBy(val as SortOption)}
          >
            <SelectTrigger className="w-[160px] ml-0 md:ml-2 mt-2 md:mt-0 p-2 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">{t("gameList.name")}</SelectItem>
              <SelectItem value="author">{t("gameList.author")}</SelectItem>
              <SelectItem value="version">{t("gameList.version")}</SelectItem>
              <SelectItem value="updated">{t("gameList.updated")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- Table --- */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("gameList.icon")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("gameList.name")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("gameList.author")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("gameList.version")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("gameList.updated")}
              </th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
            className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
          >
            {sortedGames.map((game) => (
              <motion.tr
                key={game.fileName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                  scale: 1.01,
                  backgroundColor: "rgba(229, 231, 235, 0.5)",
                }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer"
                onClick={() =>
                  (window.location.href = `/game/${game.fileName}`)
                }
              >
                <td className="px-4 py-2">
                  <img
                    src={game.icon}
                    alt={game.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                  {game.title}
                </td>
                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {game.author}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                  {game.version}
                </td>
                <td className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
                  {new Date(game.updated).toLocaleDateString(i18n.language, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
