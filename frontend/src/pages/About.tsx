import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Github } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
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

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  presenceCount: number;
  description: string | null;
}

interface ProjectStats {
  games: number;
  systems: Record<string, number>;
  lastUpdated: string | null;
}

const DISCORD_INVITE = "https://discord.gg/udw7Z4mdKJ";

// --- Helpers ---
const getAvatarUrl = (user: DiscordUser) => {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${
    parseInt(user.discriminator) % 5
  }.png`;
};

const getBannerUrl = (user: DiscordUser) => {
  if (!user.banner) return null;
  return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=512`;
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
  offline: "bg-muted",
};

export default function About() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<DiscordUser[]>([]);
  const [teamRoles, setTeamRoles] = useState<Record<string, string>>({});
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const [guild, setGuild] = useState<DiscordGuild | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);

  // Fetch team (IDs depuis /api/v1/team)
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const teamRes = await fetch(`${API_BASE_URL}/v1/team`);
        const team = await teamRes.json();
        const teamMembers: { id: string; role?: string }[] = team.members || [];
        setTeamRoles(
          Object.fromEntries(teamMembers.map((m) => [m.id, m.role || ""]))
        );
        const users = await Promise.all(
          teamMembers.map(async (m) => {
            const res = await fetch(`${API_BASE_URL}/v1/discord-user/${m.id}`);
            if (!res.ok) return null;
            return (await res.json()) as DiscordUser;
          })
        );
        setMembers(users.filter(Boolean) as DiscordUser[]);
      } catch (err) {
        console.error("â�Œ Failed to fetch members:", err);
      }
    };
    fetchMembers();
  }, []);

  // Fetch presence
  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const teamRes = await fetch(`${API_BASE_URL}/v1/team`);
        const team = await teamRes.json();
        const ids: string[] = (team.members || []).map((m: any) => m.id);
        const pres = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`${API_BASE_URL}/v1/discord-presence/${id}`);
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
        console.error("â�Œ Failed to fetch presence:", err);
      }
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch guild
  useEffect(() => {
    fetch(`${API_BASE_URL}/v1/discord-guild`)
      .then((r) => r.json())
      .then((g) => {
        if (g && g.name) setGuild(g);
      })
      .catch(console.error);
  }, []);

  // Fetch project stats
  useEffect(() => {
    fetch(`${API_BASE_URL}/v1/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setProjectStats)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="dsi-gradient text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src="/logo.png" alt="NDS-Shop" className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
              {t("about.title")}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto">
              {t("about.description")}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="p-8 max-w-6xl mx-auto space-y-16">
      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-extrabold text-foreground">
          {t("about.title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("about.description")}
        </p>
      </motion.div>

      {/* Discord server */}
      {guild && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="rounded-2xl bg-card border border-border shadow-lg overflow-hidden"
        >
          <div className="h-24 bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#7289da] relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-center gap-4">
            {guild.icon && (
              <img
                src={guild.icon}
                alt={guild.name}
                className="w-20 h-20 rounded-full border-4 border-background shadow-lg bg-background shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-foreground">{guild.name}</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl mx-auto sm:mx-0">
                {guild.description || t("about.discord_section_desc")}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                {typeof guild.memberCount === "number" && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {guild.memberCount.toLocaleString()} {t("about.discord_members")}
                  </span>
                )}
                {typeof guild.presenceCount === "number" && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#5865F2]" />
                    {guild.presenceCount.toLocaleString()} {t("about.discord_online")}
                  </span>
                )}
              </div>
            </div>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              {t("about.discord_join")}
            </a>
          </div>
        </motion.div>
      )}

      {/* Team */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">
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
                className="rounded-xl overflow-hidden shadow-lg bg-card relative"
                style={{
                  border: accentColor ? `3px solid ${accentColor}` : undefined,
                }}
              >
                {bannerUrl ? (
                  <div className="h-24 bg-muted">
                    <img
                      src={bannerUrl}
                      alt={`${member.username} banner`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-24 bg-muted" />
                )}
                <div className="p-4 flex flex-col items-center -mt-12">
                  <div className="relative">
                    <a
                      href={`https://discord.com/users/${member.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                        <AvatarImage src={getAvatarUrl(member)} alt={member.username} />
                        <AvatarFallback>{member.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </a>
                    <span
                      className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-background ${STATUS_COLORS[status]}`}
                    />
                  </div>
                  <span className="mt-3 font-semibold text-foreground">
                    {member.global_name || member.username}
                  </span>
                  {teamRoles[member.id] && (
                    <Badge className="mt-1 bg-primary/15 text-primary hover:bg-primary/15">{teamRoles[member.id]}</Badge>
                  )}
                  {member.discriminator !== "0" && (
                    <span className="text-sm text-muted-foreground">
                      {member.username}#{member.discriminator}
                    </span>
                  )}

                  {/* Activities */}
                  {userPresence?.activities?.length ? (
                    <div className="mt-4 space-y-2 w-full">
                      {userPresence.activities.map((activity, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-muted dark:bg-muted p-3 rounded-xl shadow-sm"
                        >
                          {getActivityImageUrl(activity) ? (
                            <img
                              src={getActivityImageUrl(activity)!}
                              alt={activity.name}
                              className="w-12 h-12 rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center bg-primary text-foreground rounded-lg">
                              ðŸŽ®
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">
                              {getActivityPrefix(activity, t)}
                              {activity.name}
                            </p>
                            {activity.details && (
                              <p className="text-sm text-muted-foreground">
                                {activity.details}
                              </p>
                            )}
                            {activity.state && (
                              <p className="text-xs text-muted-foreground">
                                {activity.state}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      {t("about.discord_no_activity")}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Project */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="bg-muted rounded-2xl p-8 shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-4 text-primary">
          {t("about.project")}
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          {t("about.project_description")}
        </p>

        {projectStats && (
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-primary">
                {projectStats.games}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("about.project_stats_games")}
              </p>
            </div>
            {Object.entries(projectStats.systems || {}).map(([sys, n]) => (
              <div key={sys} className="text-center">
                <p className="text-3xl font-extrabold text-primary">{n}</p>
                <p className="text-sm text-muted-foreground">{sys}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-card border border-border p-6">
          <p className="font-semibold mb-1">{t("about.project_github")}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {t("about.project_github_desc")}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/NDS-Shop-Homebrew"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Github size={16} />
              {t("about.project_contribute")}
            </a>
            <a
              href="https://github.com/NDS-Shop-Homebrew/NDS-Shop"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium hover:border-primary/50 transition-colors"
            >
              <Github size={16} />
              NDS-Shop
            </a>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
