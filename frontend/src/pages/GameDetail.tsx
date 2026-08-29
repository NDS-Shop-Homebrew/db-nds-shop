import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Download,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Book,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import GameCard from "../components/GameCard";
import SafeImg from "../components/SafeImg";
import { usePageMeta } from "../hooks/usePageMeta";
import { useFavorites } from "../hooks/useFavorites";
import { Button } from "../components/ui/button";
import { API_BASE, resolveAssetUrl } from "../config";

interface DownloadItem {
  size?: number;
  size_str?: string;
  url: string;
}

interface Screenshot {
  description: string;
  order?: number;
  url: string;
}

interface ApiScreenshot {
  description?: string;
  order?: number;
  url: string;
}

interface Game {
  id?: string;
  fileName: string;
  title: string;
  author: string;
  version: string;
  titleId?: string;
  systems: string[];
  categories?: string[];
  icon?: string;
  iconUrl?: string;
  image?: string;
  imageUrl?: string;
  boxartUrl?: string;
  color?: string;
  colorBg?: string;
  color_bg?: string;
  updated: string;
  downloads?: Record<string, DownloadItem>;
  screenshots?: Screenshot[];
}

interface ApiGameResponse extends Omit<Game, "screenshots"> {
  screenshots?: ApiScreenshot[];
}

interface GamesApiResponse {
  games?: ApiGameResponse[];
}

interface NdsdbMeta {
  name: string;
  description?: string;
  description_fr?: string;
  description_en?: string;
  description_igdb?: string;
  developer?: string;
  publisher?: string;
  genres?: string[];
  release_date?: string;
  product_code?: string;
  region?: string;
  rating_system?: { name?: string; age?: string };
}

interface StatsResponse {
  downloads?: {
    byGame?: Record<string, number>;
  };
}

export default function GameDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const { t, i18n } = useTranslation();
  usePageMeta(game ? `${game.title} — NDS-Shop` : "NDS-Shop");
  const { favs, toggle } = useFavorites();

  useEffect(() => {
    if (!slug) return;

    fetch(`${API_BASE}/api/v1/games/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? (res.json() as Promise<ApiGameResponse>) : null))
      .then((data) => {
        if (!data) return setGame(null);
        setGame({
          ...data,
          screenshots: (data.screenshots || []).map((s: ApiScreenshot) => ({
            description: s.description || "",
            order: s.order,
            url: s.url,
          })),
        });
      })
      .catch((err: unknown) => console.error("Error fetching game detail:", err));

    fetch(`${API_BASE}/api/v1/games`)
      .then((res) => (res.ok ? (res.json() as Promise<GamesApiResponse | ApiGameResponse[]>) : { games: [] }))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.games || [];
        setAllGames(
          list.map((g: ApiGameResponse) => ({
            ...g,
            screenshots: (g.screenshots || []).map((s: ApiScreenshot) => ({
              description: s.description || "",
              order: s.order,
              url: s.url,
            })),
          }))
        );
      })
      .catch((err: unknown) => console.error("Error fetching related games:", err));
  }, [slug]);

  const [ndsdb, setNdsdb] = useState<NdsdbMeta | null>(null);
  const [dlCount, setDlCount] = useState<number | null>(null);

  useEffect(() => {
    if (!game?.titleId) {
      setNdsdb(null);
      return;
    }
    fetch(`${API_BASE}/api/v1/ndsdb/metadata/${game.titleId}`)
      .then((r) => (r.ok ? (r.json() as Promise<NdsdbMeta>) : null))
      .then(setNdsdb)
      .catch(() => setNdsdb(null));
  }, [game?.titleId]);

  useEffect(() => {
    if (!game) return;
    fetch(`${API_BASE}/api/v1/stats`)
      .then((r) => (r.ok ? (r.json() as Promise<StatsResponse>) : null))
      .then((s) => setDlCount(s?.downloads?.byGame?.[game.fileName] ?? null))
      .catch((e: unknown) => {
        console.error(e);
      });
  }, [game?.fileName, game]);

  const boxart =
    resolveAssetUrl(game?.boxartUrl) ||
    resolveAssetUrl(game?.screenshots?.find((s) => s.description === "Boxart")?.url) ||
    resolveAssetUrl(game?.iconUrl || game?.icon);

  const gallery = useMemo(() => {
    const shots = (game?.screenshots || [])
      .filter((s) => s.description !== "Boxart")
      .map((s) => ({ ...s, url: resolveAssetUrl(s.url) }));
    return shots.length ? shots : [];
  }, [game]);

  const related = useMemo(() => {
    if (!game) return [];
    return allGames
      .filter((g) => (g.fileName || g.id) !== (game.fileName || game.id))
      .filter(
        (g) =>
          g.author === game.author ||
          g.systems?.some((s) => game.systems?.includes(s))
      )
      .slice(0, 6);
  }, [game, allGames]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIdx === null || gallery.length === 0) return;
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft")
        setLightboxIdx((lightboxIdx - 1 + gallery.length) % gallery.length);
      if (e.key === "ArrowRight")
        setLightboxIdx((lightboxIdx + 1) % gallery.length);
    },
    [lightboxIdx, gallery.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (game === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
        <Skeleton className="h-5 w-28" />
        <div className="rounded-2xl bg-muted p-6 md:p-8 flex items-center gap-6">
          <Skeleton className="w-28 h-28 rounded-xl shrink-0" />
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <Skeleton className="h-8 w-2/3 max-w-sm" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-40 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="aspect-[2/3] w-2/3 mx-auto rounded-xl" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (game === null) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <p className="text-4xl">?</p>
        <h1 className="text-xl font-bold">{t("gameDetail.notFound", "Jeu introuvable")}</h1>
        <Link to="/game-list" className="text-sm text-primary hover:underline">{t("gameDetail.back")}</Link>
      </div>
    );
  }

  const isFav = favs.includes(game.fileName || game.id || "");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to="/game-list"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} /> {t("gameDetail.back")}
      </Link>

      <div className="relative rounded-2xl overflow-hidden mb-8 bg-muted">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative flex items-center gap-6 p-6 md:p-8 min-h-40">
          {boxart && (
            <div className="aspect-square shrink-0 rounded-xl overflow-hidden shadow-lg ring-4 ring-border bg-muted w-28 h-28">
              <SafeImg
                src={boxart}
                alt={game.title}
                className="w-full h-full object-contain"
                wrapperClassName="w-full h-full"
              />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground drop-shadow">
              {game.title}
            </h1>
            <p className="text-muted-foreground mt-1">{game.author}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {game.systems?.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          {ndsdb &&
            (() => {
              const langDesc =
                ndsdb[
                  i18n.language === "fr" ? "description_fr" : "description_en"
                ];
              const desc =
                ndsdb.description_igdb || langDesc || ndsdb.description;
              if (!desc) return null;
              return (
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Book size={18} className="text-primary" /> À propos
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {desc.slice(0, 800)}
                    {desc.length > 800 && (
                      <span
                        className="text-primary cursor-pointer hover:underline ml-1"
                        onClick={() =>
                          window.open(
                            `https://www.google.com/search?q=${encodeURIComponent(
                              game?.title + " Nintendo DS"
                            )}`,
                            "_blank"
                          )
                        }
                      >
                        ... Lire plus
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {ndsdb.genres?.filter(Boolean).map((g: string) => (
                      <Badge key={g} variant="secondary">
                        {g}
                      </Badge>
                    ))}
                    {ndsdb.developer && (
                      <Badge variant="outline">{ndsdb.developer}</Badge>
                    )}
                    {ndsdb.rating_system?.name && (
                      <Badge variant="outline">
                        {ndsdb.rating_system.name} : {ndsdb.rating_system.age}+
                      </Badge>
                    )}
                    {ndsdb.release_date && (
                      <Badge variant="outline">
                        {t("gameDetail.release")} {ndsdb.release_date}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })()}

          {gallery.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4">
                {t("gameDetail.screenshots")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map((shot, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    onClick={() => setLightboxIdx(i)}
                    className="aspect-[2/3] w-auto h-auto p-0 rounded-xl overflow-hidden ring-1 ring-border hover:ring-primary/50 hover:bg-muted/60 dark:hover:bg-muted/60 group bg-muted/60"
                  >
                    <SafeImg
                      src={shot.url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      wrapperClassName="w-full h-full"
                    />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
              <span className="flex items-center gap-3">
                {t("gameDetail.download")}
                {dlCount != null && (
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {t("gameDetail.downloadsCount", { count: dlCount })}
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggle(game.fileName || game.id || "")}
                        className={`rounded-lg border ${
                          isFav
                            ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-500 dark:bg-red-500/10 dark:border-red-500/30 dark:hover:bg-red-500/10"
                            : "border-border text-muted-foreground hover:text-red-400 hover:bg-transparent dark:hover:bg-transparent"
                        }`}
                        aria-label="Favori"
                      >
                        <Heart
                          size={18}
                          fill={isFav ? "currentColor" : "none"}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isFav
                        ? t("gameDetail.removeFav")
                        : t("gameDetail.addFav")}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigator.clipboard?.writeText(window.location.href)
                        }
                        className="rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-transparent dark:hover:bg-transparent"
                        aria-label="Partager"
                      >
                        <Share2 size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("gameDetail.share")}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </h2>

            {game.downloads && Object.keys(game.downloads).length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(game.downloads).map(([name, details]) => {
                  const dlUrl = details.url.startsWith("http")
                    ? details.url
                    : `${API_BASE}${details.url.startsWith("/") ? "" : "/"}${details.url}`;

                  return (
                    <a
                      key={name}
                      href={dlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/30 hover:shadow-sm transition-all group"
                    >
                      <Download className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {name}
                        </p>
                        {details.size_str ? (
                          <p className="text-xs text-muted-foreground">
                            {details.size_str}
                          </p>
                        ) : details.size ? (
                          <p className="text-xs text-muted-foreground">
                            {(details.size / (1024 * 1024)).toFixed(1)} Mo
                          </p>
                        ) : null}
                      </div>
                      <ExternalLink
                        size={14}
                        className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                      />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {game.categories && game.categories.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("gameDetail.categories")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {game.categories.map((cat) => (
                  <Badge key={cat} variant="secondary">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-lg font-bold mb-6">{t("gameDetail.related")}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {related.map((g) => (
              <GameCard
                key={g.fileName || g.id}
                game={g}
                showAuthor={false}
              />
            ))}
          </div>
        </div>
      )}

      {lightboxIdx !== null && gallery[lightboxIdx] && (
        <Dialog open onOpenChange={(open) => !open && setLightboxIdx(null)}>
          <DialogTitle className="sr-only">{game.title}</DialogTitle>
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-none border-0 bg-transparent p-0 shadow-none"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(
                  (lightboxIdx - 1 + gallery.length) % gallery.length
                );
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 hover:text-white text-white"
            >
              <ChevronLeft size={28} />
            </Button>
            <img
              src={gallery[lightboxIdx].url}
              alt=""
              className="max-w-[90vw] max-h-[90vh] rounded-xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx((lightboxIdx + 1) % gallery.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 hover:text-white text-white"
            >
              <ChevronRight size={28} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLightboxIdx(null)}
              className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white hover:bg-transparent dark:hover:bg-transparent"
            >
              ✕
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
              {lightboxIdx + 1} / {gallery.length}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}