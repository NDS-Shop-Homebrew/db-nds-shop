import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Download, Heart, Share2, ChevronLeft, ChevronRight, ExternalLink, Book } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import GameCard from "../components/GameCard";
import SafeImg from "../components/SafeImg";
import { usePageMeta } from "../hooks/usePageMeta";
import { useFavorites } from "../hooks/useFavorites";

interface Download { size: number; size_str: string; url: string; }
interface Screenshot { description: string; url: string; }
interface Game {
  fileName: string; title: string; author: string; version: string;
  titleId?: string;
  systems: string[]; categories?: string[]; icon: string; image: string;
  color: string; color_bg: string; updated: string;
  downloads?: Record<string, Download>; qr?: Record<string, string>;
  screenshots?: Screenshot[];
}

interface NdsdbMeta {
  name: string;
  description?: string;
  developer?: string;
  publisher?: string;
  genres?: string[];
  release_date?: string;
  product_code?: string;
  region?: string;
  rating_system?: { name?: string; age?: string };
}

export default function GameDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const { t, i18n } = useTranslation();
  usePageMeta(game ? `${game.title} — NDS-Shop` : "NDS-Shop");
  const { favs, toggle } = useFavorites();

  useEffect(() => {
    fetch("/games.json")
      .then((res) => res.json())
      .then((games: Game[]) => {
        setAllGames(games);
        setGame(games.find((g) => g.fileName === slug) || null);
      });
  }, [slug]);

  const [ndsdb, setNdsdb] = useState<NdsdbMeta | null>(null);
  const [dlCount, setDlCount] = useState<number | null>(null);

  useEffect(() => {
    if (!game?.titleId) { setNdsdb(null); return; }
    fetch(`/api/v1/ndsdb/metadata/${game.titleId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setNdsdb);
  }, [game?.titleId]);

  useEffect(() => {
    if (!game) return;
    fetch("/api/v1/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setDlCount(s?.downloads?.byGame?.[game.fileName] ?? null))
      .catch(() => {});
  }, [game?.fileName]);

  const boxart = game?.screenshots?.find((s) => s.description === "Boxart")?.url || null;

  // Images affichables (hors boxart)
  const gallery = useMemo(() => {
    const shots = (game?.screenshots || []).filter((s) => s.description !== "Boxart");
    return shots.length ? shots : [];
  }, [game]);

  const related = useMemo(() => {
    if (!game) return [];
    return allGames
      .filter((g) => g.fileName !== game.fileName)
      .filter((g) => g.author === game.author || g.systems?.some((s) => game.systems?.includes(s)))
      .slice(0, 6);
  }, [game, allGames]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIdx === null || gallery.length === 0) return;
    if (e.key === "Escape") setLightboxIdx(null);
    if (e.key === "ArrowLeft") setLightboxIdx((lightboxIdx - 1 + gallery.length) % gallery.length);
    if (e.key === "ArrowRight") setLightboxIdx((lightboxIdx + 1) % gallery.length);
  }, [lightboxIdx, gallery.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  const isFav = favs.includes(game.fileName);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/game-list" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft size={16} /> {t("gameDetail.back")}
      </Link>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-8 dsi-gradient">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative flex items-center gap-6 p-6 md:p-8 min-h-40">
          {boxart && (
            <div className="w-36 h-44 md:w-44 md:h-52 shrink-0 rounded-xl overflow-hidden shadow-lg ring-4 ring-white/20 bg-white/10">
              <SafeImg
                src={boxart}
                alt={game.title}
                className="w-full h-full object-cover"
                wrapperClassName="w-full h-full"
              />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">{game.title}</h1>
            <p className="text-white/80 mt-1">{game.author}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {game.systems?.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-medium">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Infos rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: t("gameDetail.author"), value: game.author },
          { label: t("gameDetail.version"), value: game.version },
          { label: t("gameDetail.updated"), value: new Date(game.updated).toLocaleDateString(i18n.language) },
          { label: t("gameDetail.systems"), value: game.systems?.join(", ") || "—" },
        ].map((info) => (
          <div key={info.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground mb-0.5">{info.label}</p>
            <p className="text-sm font-medium text-foreground truncate">{info.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Téléchargements */}
          {game.downloads && Object.keys(game.downloads).length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
                <span className="flex items-center gap-3">
                  {t("gameDetail.download")}
                  {dlCount != null && dlCount > 0 && (
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {t("gameDetail.downloadsCount", { count: dlCount.toLocaleString(i18n.language) })}
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggle(game.fileName)}
                          className={`p-2 rounded-lg border transition-colors ${isFav ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-500/10 dark:border-red-500/30" : "border-border text-muted-foreground hover:text-red-400"}`}
                          aria-label="Favori"
                        >
                          <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{isFav ? t("gameDetail.removeFav") : t("gameDetail.addFav")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => navigator.clipboard?.writeText(window.location.href)}
                          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors"
                          aria-label="Partager"
                        >
                          <Share2 size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t("gameDetail.share")}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(game.downloads).map(([name, details]) => (
                  <a key={name} href={details.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group">
                    <Download className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      {details.size_str && <p className="text-xs text-muted-foreground">{details.size_str}</p>}
                    </div>
                    <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* À propos (métadonnées ndsdb) */}
          {ndsdb && (() => {
            // Priorité: 1) IGDB 2) description_fr/en (Wikipedia bilingue) 3) description (Wikipedia legacy)
            const langDesc = ndsdb[i18n.language === "fr" ? "description_fr" : "description_en"];
            const desc = ndsdb.description_igdb || langDesc || ndsdb.description;
            if (!desc) return null;
            return (
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Book size={18} className="text-primary" /> À propos
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {desc.slice(0, 800)}
                {desc.length > 800 && (
                  <span className="text-primary cursor-pointer hover:underline"
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(game?.title + " Nintendo DS")}`, "_blank")}>
                    ... Lire plus
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                {ndsdb.genres?.filter(Boolean).map((g: string) => (
                  <Badge key={g} variant="secondary">{g}</Badge>
                ))}
                {ndsdb.developer && (
                  <Badge variant="outline">{ndsdb.developer}</Badge>
                )}
                {ndsdb.rating_system?.name && (
                  <Badge variant="outline">{ndsdb.rating_system.name} : {ndsdb.rating_system.age}+</Badge>
                )}
                {ndsdb.release_date && (
                  <Badge variant="outline">Sortie : {ndsdb.release_date}</Badge>
                )}
              </div>
            </div>
            );
          })()}

          {/* Galerie screenshots */}
          {gallery.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4">{t("gameDetail.screenshots")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map((shot, i) => (
                  <button key={i} onClick={() => setLightboxIdx(i)}
                    className="aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-border hover:ring-primary/50 transition-all group bg-muted/60">
                    <SafeImg
                      src={shot.url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      wrapperClassName="w-full h-full"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QR */}
          {game.qr && Object.keys(game.qr).length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4">{t("gameDetail.qr_code")}</h2>
              <div className="flex flex-wrap gap-4">
                {Object.entries(game.qr).map(([name, url]) => (
                  <a key={name} href={url} target="_blank" rel="noreferrer"
                    className="flex flex-col items-center gap-1.5 group">
                    <div className="w-40 h-40 rounded-xl bg-white p-2 ring-1 ring-border overflow-hidden group-hover:ring-primary/50 transition-all">
                      <SafeImg
                        src={url}
                        alt={name}
                        className="w-full h-full object-contain"
                        wrapperClassName="w-full h-full"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">{name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {game.categories && game.categories.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("gameDetail.categories")}</h3>
              <div className="flex flex-wrap gap-2">
                {game.categories.map((cat) => (
                  <Badge key={cat} variant="secondary">{cat}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Jeux similaires */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-lg font-bold mb-6">{t("gameDetail.related")}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {related.map((g) => (
              <GameCard key={g.fileName} game={g} showAuthor={false} />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && gallery[lightboxIdx] && (
        <Dialog open onOpenChange={(open) => !open && setLightboxIdx(null)}>
          <DialogTitle className="sr-only">{game.title}</DialogTitle>
          <DialogContent showCloseButton={false} className="sm:max-w-none border-0 bg-transparent p-0 shadow-none">
            <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + gallery.length) % gallery.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <ChevronLeft size={28} />
            </button>
            <img src={gallery[lightboxIdx].url} alt="" className="max-w-[90vw] max-h-[90vh] rounded-xl mx-auto" onClick={(e) => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % gallery.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <ChevronRight size={28} />
            </button>
            <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl">✕</button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">{lightboxIdx + 1} / {gallery.length}</div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}