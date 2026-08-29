import { Link } from "react-router-dom";
import { Heart, Download } from "lucide-react";
import SafeImg from "./SafeImg";
import { Button } from "./ui/button";
import { resolveAssetUrl } from "../config";

export interface Game {
  id?: string;
  fileName: string;
  title: string;
  author?: string;
  icon?: string;
  iconUrl?: string;
  boxartUrl?: string;
  screenshots?: { description?: string; url: string }[];
}

interface GameCardProps {
  game: Game;
  isFav?: boolean;
  onToggleFav?: (slug: string) => void;
  showAuthor?: boolean;
  downloads?: number;
}

function gameBoxart(game: Game): string {
  const url =
    game.boxartUrl ||
    game.screenshots?.find((s) => s.description === "Boxart")?.url ||
    game.screenshots?.[0]?.url ||
    game.iconUrl ||
    game.icon;

  return resolveAssetUrl(url);
}

export default function GameCard({
  game,
  isFav,
  onToggleFav,
  showAuthor = true,
  downloads,
}: GameCardProps) {
  const gameKey = game.fileName || game.id || "";

  return (
    <div className="relative group">
      <Link to={`/game/${gameKey}`} className="block group">
        <div className="relative rounded-xl overflow-hidden bg-muted/60 mb-3 ring-1 ring-border group-hover:ring-primary/50 transition-all aspect-square">
          <SafeImg
            src={gameBoxart(game)}
            alt={game.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            wrapperClassName="w-full h-full"
          />
          {downloads != null && downloads > 0 && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur px-2 py-0.5 text-[11px] font-medium text-foreground shadow-xs">
              <Download size={11} className="text-primary" />
              {downloads.toLocaleString()}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {game.title}
        </h3>
        {showAuthor && game.author && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {game.author}
          </p>
        )}
      </Link>

      {onToggleFav && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFav(gameKey);
          }}
          className={`absolute top-2 right-2 rounded-full bg-background/85 backdrop-blur hover:bg-background/85 dark:hover:bg-background/85 cursor-pointer shadow-xs ${
            isFav
              ? "text-red-500 opacity-100"
              : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400"
          }`}
          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart size={16} fill={isFav ? "currentColor" : "none"} />
        </Button>
      )}
    </div>
  );
}