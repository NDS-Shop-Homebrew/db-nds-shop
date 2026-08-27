import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Badge } from "../components/ui/badge";
import { Spinner } from "../components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

interface Endpoint {
  method: string;
  path: string;
  descKey: string;
  example: string;
}

interface ResponseState {
  status?: number;
  statusText?: string;
  duration?: number;
  data: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || "https://db-nds-shop.fr";
const BASE = `${API_BASE}/api/v1`;

const endpoints: {
  section: "games" | "ndsdb" | "community";
  items: Endpoint[];
}[] = [
  {
    section: "games",
    items: [
      {
        method: "GET",
        path: "/health",
        descKey: "docs.route_health",
        example: "/health",
      },
      {
        method: "GET",
        path: "/games",
        descKey: "docs.route_games",
        example: "/games?limit=5",
      },
      {
        method: "GET",
        path: "/games/:slug",
        descKey: "docs.route_game",
        example: "/games/animal-crossing---wild-world",
      },
      {
        method: "GET",
        path: "/download/:file",
        descKey: "docs.route_download",
        example:
          "/download/Kirby%20-%20Power%20Paintbrush%20(Europe)%20(En%2CFr%2CDe%2CEs%2CIt).nds",
      },
      {
        method: "GET",
        path: "/stats",
        descKey: "docs.route_stats",
        example: "/stats",
      },
    ],
  },
  {
    section: "ndsdb",
    items: [
      {
        method: "GET",
        path: "/ndsdb/version",
        descKey: "docs.route_ndsdb_version",
        example: "/ndsdb/version",
      },
      {
        method: "GET",
        path: "/ndsdb/stats/stats",
        descKey: "docs.route_ndsdb_stats",
        example: "/ndsdb/stats/stats",
      },
      {
        method: "GET",
        path: "/ndsdb/metadata/:serial",
        descKey: "docs.route_ndsdb_metadata",
        example: "/ndsdb/metadata/A2DP",
      },
      {
        method: "GET",
        path: "/ndsdb/images/:serial/:type",
        descKey: "docs.route_ndsdb_images",
        example: "/ndsdb/images/A2DP/front_boxart",
      },
      {
        method: "GET",
        path: "/ndsdb/screenshots/:serial/screens",
        descKey: "docs.route_ndsdb_screens",
        example: "/ndsdb/screenshots/A2DP/screens",
      },
    ],
  },
  {
    section: "community",
    items: [
      {
        method: "GET",
        path: "/requests",
        descKey: "docs.route_requests",
        example: "/requests",
      },
      {
        method: "GET",
        path: "/team",
        descKey: "docs.route_team",
        example: "/team",
      },
      {
        method: "GET",
        path: "/discord-guild",
        descKey: "docs.route_guild",
        example: "/discord-guild",
      },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
};

export default function Docs() {
  const { t } = useTranslation();
  usePageMeta(t("docs.title") + " — NDS-Shop");
  const [active, setActive] = useState<Endpoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const test = async (endpoint: Endpoint) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setActive(endpoint);
    setLoading(true);
    setResponse(null);

    const isDownloadRoute = endpoint.path.startsWith("/download");
    const startTime = performance.now();

    try {
      const r = await fetch(`${BASE}${endpoint.example}`, {
        method: isDownloadRoute ? "HEAD" : endpoint.method,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      const duration = Math.round(performance.now() - startTime);
      const contentType = r.headers.get("content-type") || "";
      const contentLength = r.headers.get("content-length");

      if (contentType.includes("application/json")) {
        const data = await r.json();
        setResponse({
          status: r.status,
          statusText: r.statusText,
          duration,
          data: JSON.stringify(data, null, 2),
        });
      } else {
        const bytes = contentLength ? parseInt(contentLength, 10) : 0;
        const sizeMb =
          bytes > 0
            ? (bytes / (1024 * 1024)).toFixed(2) + " Mo"
            : "Taille inconnue (stream)";

        setResponse({
          status: r.status,
          statusText: r.statusText,
          duration,
          data:
            `// Fichier binaire / média (${r.status} ${r.statusText})\n` +
            `Content-Type: ${contentType || "application/octet-stream"}\n` +
            `Content-Length: ${bytes ? `${bytes.toLocaleString()} octets (~${sizeMb})` : "N/A"}\n\n` +
            `[Requête HEAD effectuée : aucun téléchargement de données superflues]`,
        });
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      const duration = Math.round(performance.now() - startTime);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setResponse({
        status: 500,
        statusText: "Client Error",
        duration,
        data: `${t("docs.error")} : ${errorMessage}`,
      });
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
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
      <section className="dsi-gradient">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
              {t("docs.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              {t("docs.description")}
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-sm font-mono text-foreground shadow-sm">
              <span className="text-muted-foreground">
                {t("docs.base_url")} :
              </span>
              <span className="font-semibold">{BASE}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="p-8 max-w-6xl mx-auto space-y-12">
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="games">{t("docs.sections.games")}</TabsTrigger>
            <TabsTrigger value="ndsdb">{t("docs.sections.ndsdb")}</TabsTrigger>
            <TabsTrigger value="community">
              {t("docs.sections.community") || "Communauté"}
            </TabsTrigger>
          </TabsList>

          {endpoints.map((group) => (
            <TabsContent key={group.section} value={group.section}>
              <Card>
                <CardHeader>
                  <CardTitle>{t(`docs.sections.${group.section}`)}</CardTitle>
                  <CardDescription>
                    {t(`docs.sections.${group.section}_desc`)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.items.map((endpoint) => (
                      <div
                        key={endpoint.path}
                        className="rounded-xl border border-border bg-card overflow-hidden shadow-xs"
                      >
                        <div className="flex flex-wrap items-center gap-3 p-4">
                          <Badge className={METHOD_COLORS[endpoint.method]}>
                            {endpoint.method}
                          </Badge>
                          <code className="font-mono text-sm text-foreground flex-1 min-w-0">
                            {endpoint.path}
                          </code>
                          <p className="text-sm text-muted-foreground w-full sm:w-auto sm:flex-1 sm:text-right">
                            {t(endpoint.descKey)}
                          </p>
                          <Button
                            onClick={() => test(endpoint)}
                            size="sm"
                            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                          >
                            {t("docs.try")}
                          </Button>
                        </div>

                        {active?.path === endpoint.path && (
                          <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  {t("docs.request")}
                                </p>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() =>
                                          copyCode(
                                            `curl "${BASE}${endpoint.example}"`
                                          )
                                        }
                                        className="text-xs font-medium text-primary hover:underline cursor-pointer"
                                      >
                                        {copied
                                          ? t("docs.copied")
                                          : t("docs.copy")}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {copied
                                        ? t("docs.copied")
                                        : t("docs.copy")}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <pre className="rounded-lg bg-muted p-3 text-sm font-mono overflow-x-auto border border-border">
                                <code>{`curl "${BASE}${endpoint.example}"`}</code>
                              </pre>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  {t("docs.response")}
                                </p>
                                {response?.status && (
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={
                                        response.status < 400
                                          ? "default"
                                          : "destructive"
                                      }
                                      className="text-xs"
                                    >
                                      {response.status} {response.statusText}
                                    </Badge>
                                    {response.duration != null && (
                                      <span className="text-xs text-muted-foreground font-mono">
                                        {response.duration} ms
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <pre className="rounded-lg bg-muted p-3 text-sm font-mono overflow-x-auto max-h-80 border border-border">
                                {loading ? (
                                  <span className="flex items-center gap-2 text-muted-foreground">
                                    <Spinner className="size-4" />{" "}
                                    {t("docs.load")}
                                  </span>
                                ) : (
                                  <code>
                                    {response?.data || t("docs.no_content")}
                                  </code>
                                )}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}