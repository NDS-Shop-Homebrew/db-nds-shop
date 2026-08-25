import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Github } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { API_BASE_URL } from "../config";
import { DiscordIcon } from "../components/DiscordLogin";
import { usePageMeta } from "../hooks/usePageMeta";


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

  
  if (activity.assets.large_image.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${
      activity.assets.large_image.split(":")[1]
    }`;
  }

  
  if (activity.assets.large_image.startsWith("mp:external")) {
    return activity.assets.large_image.replace(
      /^mp:external\/[^\/]+\/(http[s]?:\/\/.*)/,
      "$1"
    );
  }

  
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
  usePageMeta(t("about.title") + " — NDS-Shop");
  const [members, setMembers] = useState<DiscordUser[]>([]);
  const [teamRoles, setTeamRoles] = useState<Record<string, string>>({});
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const [guild, setGuild] = useState<DiscordGuild | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);

  
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

  
  useEffect(() => {
    fetch(`${API_BASE_URL}/v1/discord-guild`)
      .then((r) => r.json())
      .then((g) => {
        if (g && g.name) setGuild(g);
      })
      .catch(console.error);
  }, []);

  
  useEffect(() => {
    fetch(`${API_BASE_URL}/v1/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setProjectStats)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-16">
      {}
      <section className="dsi-gradient">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
              {t("about.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              {t("about.description")}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="p-8 max-w-6xl mx-auto space-y-16">
      {}
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

      {}
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
              <DiscordIcon className="w-5 h-5" />
              {t("about.discord_join")}
            </a>
          </div>
        </motion.div>
      )}

      {}
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

                  {}
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

      {}
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
