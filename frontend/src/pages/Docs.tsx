import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface Endpoint {
  method: string;
  path: string;
  descKey: string;
  example: string;
}

const BASE = "https://db-nds-shop.fr/api/v1";

const endpoints: { section: "games" | "ndsdb" | "discord"; items: Endpoint[] }[] = [
  {
    section: "games",
    items: [
      { method: "GET", path: "/health", descKey: "docs.route_health", example: "/health" },
      { method: "GET", path: "/games", descKey: "docs.route_games", example: "/games" },
      { method: "GET", path: "/games/:slug", descKey: "docs.route_game", example: "/games/animal-crossing---wild-world" },
      { method: "GET", path: "/stats", descKey: "docs.route_stats", example: "/stats" },
    ],
  },
  {
    section: "ndsdb",
    items: [
      { method: "GET", path: "/ndsdb/version", descKey: "docs.route_ndsdb_version", example: "/ndsdb/version" },
      { method: "GET", path: "/ndsdb/stats/stats", descKey: "docs.route_ndsdb_stats", example: "/ndsdb/stats/stats" },
      { method: "GET", path: "/ndsdb/stats/category/:category", descKey: "docs.route_ndsdb_category", example: "/ndsdb/stats/category/base" },
      { method: "GET", path: "/ndsdb/metadata/:serial", descKey: "docs.route_ndsdb_metadata", example: "/ndsdb/metadata/A2DP" },
    ],
  },
  {
    section: "discord",
    items: [
      { method: "GET", path: "/team", descKey: "docs.route_team", example: "/team" },
      { method: "GET", path: "/discord-guild", descKey: "docs.route_guild", example: "/discord-guild" },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
};

export default function Docs() {
  const { t } = useTranslation();
  const [active, setActive] = useState<Endpoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const test = async (endpoint: Endpoint) => {
    setActive(endpoint);
    setLoading(true);
    setResponse("");
    try {
      const r = await fetch(`${BASE}${endpoint.example}`);
      const text = await r.text();
      setResponse(text ? JSON.stringify(JSON.parse(text), null, 2) : "(empty)");
    } catch (e: any) {
      setResponse(t("docs.error") + " : " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div>
      {/* Hero */}
      <section className="dsi-gradient text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{t("docs.title")}</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-6">{t("docs.description")}</p>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-sm font-mono text-white/90">
              <span className="text-white/60">{t("docs.base_url")} :</span>
              <span className="font-semibold">{BASE}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="p-8 max-w-6xl mx-auto space-y-12">

      {endpoints.map((group) => (
        <motion.div key={group.section} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold mb-4 text-primary">
            {t(`docs.sections.${group.section}`)}
          </h2>
          <div className="space-y-3">
            {group.items.map((endpoint) => (
              <div key={endpoint.path} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${METHOD_COLORS[endpoint.method]}`}>
                    {endpoint.method}
                  </span>
                  <code className="font-mono text-sm text-foreground flex-1 min-w-0">{endpoint.path}</code>
                  <p className="text-sm text-muted-foreground w-full sm:w-auto sm:flex-1 sm:text-right">
                    {t(endpoint.descKey)}
                  </p>
                  <button
                    onClick={() => test(endpoint)}
                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t("docs.try")}
                  </button>
                </div>

                {active?.path === endpoint.path && (
                  <div className="border-t border-border p-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">{t("docs.request")}</p>
                        <button
                          onClick={() => copyCode(`curl "${BASE}${endpoint.example}"`)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {copied ? t("docs.copied") : t("docs.copy")}
                        </button>
                      </div>
                      <pre className="rounded-lg bg-muted p-3 text-sm font-mono overflow-x-auto">
                        <code>{`curl "${BASE}${endpoint.example}"`}</code>
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        {t("docs.response")}
                      </p>
                      <pre className="rounded-lg bg-muted p-3 text-sm font-mono overflow-x-auto max-h-80">
                        {loading ? t("docs.load") : <code>{response || t("docs.no_content")}</code>}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
      </div>
    </div>
  );
}
