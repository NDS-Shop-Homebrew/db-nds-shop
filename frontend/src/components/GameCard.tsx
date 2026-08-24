import { Link } from "react-router-dom";
import { Heart, Download } from "lucide-react";
import SafeImg from "./SafeImg";

interface Game {
  fileName: string;
  title: string;
  author?: string;
  icon?: string;
  screenshots?: { description: string; url: string }[];
}

interface GameCardProps {
  game: Game;
  isFav?: boolean;
  onToggleFav?: (slug: string) => void;
  showAuthor?: boolean;
  downloads?: number;
}

export function gameBoxart(game: Game) {
  return (
    game.screenshots?.find((s) => s.description === "Boxart")?.url ||
    game.screenshots?.[0]?.url ||
    game.icon
  );
}

export default function GameCard({ game, isFav, onToggleFav, showAuthor = true, downloads }: GameCardProps) {
  return (
    <div className="relative group">
      <Link to={`/game/${game.fileName}`} className="block group">
        <div className="relative rounded-xl overflow-hidden bg-muted/60 mb-3 ring-1 ring-border group-hover:ring-primary/50 transition-all aspect-square">
          <SafeImg
            src={gameBoxart(game)}
            alt={game.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            wrapperClassName="w-full h-full"
          />
          {downloads != null && downloads > 0 && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-[11px] font-medium text-foreground">
              <Download size={11} className="text-primary" />
              {downloads.toLocaleString()}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{game.title}</h3>
        {showAuthor && game.author && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{game.author}</p>
        )}
      </Link>
      {onToggleFav && (
        <button
          onClick={() => onToggleFav(game.fileName)}
          className={`absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur transition-colors ${
            isFav ? "text-red-500" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400"
          }`}
          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart size={16} fill={isFav ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
}