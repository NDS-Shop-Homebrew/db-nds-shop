import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "../../node_modules/react-i18next";
import { API_BASE_URL } from "../config";


interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar: string | null;
  banner?: string | null;
  accent_color?: number | null;
}

interface Presence {
  discord_status: "online" | "idle" | "dnd" | "offline";
  activities: {
    name: string;
    type: number;
    details?: string;
    state?: string;
    application_id?: string;
    assets?: { large_image?: string; small_image?: string };
  }[];
}

interface RoadmapItem {
  title: string;
  description: string;
  done: boolean;
}

const TEAM_IDS = ["590070698140237826", "446019155779387393"];

// --- Helpers ---
const getAvatarUrl = (user: DiscordUser) => {
  if (user.avatar) {
    const isGif = user.avatar.startsWith("a_");
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${
      isGif ? "gif" : "png"
    }?size=128`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${
    parseInt(user.discriminator) % 5
  }.png`;
};

const getBannerUrl = (user: DiscordUser) => {
  if (!user.banner) return null;
  const isGif = user.banner.startsWith("a_");
  return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${
    isGif ? "gif" : "png"
  }?size=600`;
};

const getActivityImageUrl = (activity: any) => {
  if (!activity.assets?.large_image) return null;

  // Spotify
  if (activity.assets.large_image.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${
      activity.assets.large_image.split(":")[1]
    }`;
  }

  // External MP image
  if (activity.assets.large_image.startsWith("mp:external")) {
    return activity.assets.large_image.replace(
      /^mp:external\/[^\/]+\/(http[s]?:\/\/.*)/,
      "$1"
    );
  }

  // Discord app image
  if (activity.application_id) {
    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
  }

  return null;
};

const getActivityPrefix = (activity: any, t: (key: string) => string) => {
  switch (activity.type) {
    case 0:
      return t("about.play") + " ";
    case 2:
      return t("about.listen") + " : ";
    case 3:
      return t("about.watch") + " : ";
    case 4:
      return t("about.stream") + " : ";
    default:
      return "";
  }
};


const intToHexColor = (num?: number | null) =>
  num ? `#${num.toString(16).padStart(6, "0")}` : undefined;

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  idle: "bg-yellow-500",
  dnd: "bg-red-500",
  offline: "bg-gray-500",
};

export default function About() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<DiscordUser[]>([]);
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);

  // Fetch team
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const users = await Promise.all(
          TEAM_IDS.map(async (id) => {
            const res = await fetch(`${API_BASE_URL}/discord-user/${id}`);
            if (!res.ok) return null;
            return (await res.json()) as DiscordUser;
          })
        );
        setMembers(users.filter(Boolean) as DiscordUser[]);
      } catch (err) {
        console.error("❌ Failed to fetch members:", err);
      }
    };
    fetchMembers();
  }, []);

  // Fetch presence
  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const pres = await Promise.all(
          TEAM_IDS.map(async (id) => {
            const res = await fetch(`${API_BASE_URL}/discord-presence/${id}`);
            if (!res.ok) return null;
            const data = await res.json();
            return { id, ...data } as { id: string } & Presence;
          })
        );
        const map: Record<string, Presence> = {};
        pres.forEach((p) => {
          if (p) map[p.id] = p;
        });
        setPresence(map);
      } catch (err) {
        console.error("❌ Failed to fetch presence:", err);
      }
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch roadmap
  useEffect(() => {
    fetch(`${API_BASE_URL}/roadmap`)
      .then((r) => r.json())
      .then(setRoadmap)
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-16">
      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
          {t("about.title")}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t("about.description")}
        </p>
      </motion.div>

      {/* Team */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-500">
          {t("about.team")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {members.map((member) => {
            const bannerUrl = getBannerUrl(member);
            const accentColor = intToHexColor(member.accent_color);
            const userPresence = presence[member.id];
            const status = userPresence?.discord_status || "offline";

            return (
              <motion.div
                key={member.id}
                whileHover={{ scale: 1.03 }}
                className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-900 relative"
                style={{
                  border: accentColor ? `3px solid ${accentColor}` : undefined,
                }}
              >
                {bannerUrl ? (
                  <div className="h-24 bg-gray-700">
                    <img
                      src={bannerUrl}
                      alt={`${member.username} banner`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-24 bg-gray-700" />
                )}
                <div className="p-4 flex flex-col items-center -mt-12">
                  <div className="relative">
                    <a
                      href={`https://discord.com/users/${member.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={getAvatarUrl(member)}
                        alt={member.username}
                        className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
                      />
                    </a>
                    <span
                      className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 ${STATUS_COLORS[status]}`}
                    />
                  </div>
                  <span className="mt-3 font-semibold text-gray-900 dark:text-white">
                    {member.global_name || member.username}
                  </span>
                  {member.discriminator !== "0" && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {member.username}#{member.discriminator}
                    </span>
                  )}

                  {/* Activities */}
                  {userPresence?.activities?.length ? (
                    <div className="mt-4 space-y-2 w-full">
                      {userPresence.activities.map((activity, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl shadow-sm"
                        >
                          {getActivityImageUrl(activity) ? (
                            <img
                              src={getActivityImageUrl(activity)!}
                              alt={activity.name}
                              className="w-12 h-12 rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center bg-indigo-500 text-white rounded-lg">
                              🎮
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {getActivityPrefix(activity, t)}
                              {activity.name}
                            </p>
                            {activity.details && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {activity.details}
                              </p>
                            )}
                            {activity.state && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {activity.state}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500 italic">
                      No current activity
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Roadmap */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-500">
          {t("about.roadmap")}
        </h2>
        <div className="space-y-4">
          {roadmap.map((item, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-lg border ${
                item.done
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-red-500 bg-red-50 dark:bg-red-900/20"
              }`}
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Project */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-4 text-indigo-500">
          {t("about.project")}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {t("about.project_description")}
        </p>
      </motion.div>
    </div>
  );
}
