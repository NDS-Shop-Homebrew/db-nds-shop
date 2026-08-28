import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Github, Shield, FileText, Rss } from "lucide-react";

export default function Footer() {
  const version = import.meta.env.VITE_APP_VERSION || "dev";
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border mt-20 bg-card/40">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/assets/logo.png" alt="NDS-Shop" className="w-7 h-7 rounded-lg" />
              <span className="font-bold text-foreground">NDS-Shop</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://github.com/NDS-Shop-Homebrew"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github size={18} />
              </a>
              <a
                href="/rss.xml"
                aria-label={t("footer.rss")}
                title={t("footer.rss")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Rss size={18} />
              </a>
              <Link
                to="/privacy"
                aria-label={t("footer.privacy")}
                title={t("footer.privacy")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Shield size={18} />
              </Link>
              <Link
                to="/dmca"
                aria-label={t("footer.dmca")}
                title={t("footer.dmca")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <FileText size={18} />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">{t("footer.links")}</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/game-list" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("nav.gameList")}
              </Link>
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("nav.about")}
              </Link>
              <Link to="/tutorial" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("nav.tutorial")}
              </Link>
              <Link to="/docs" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("nav.api")}
              </Link>
              <Link to="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("footer.privacy")}
              </Link>
              <Link to="/dmca" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("footer.dmca")}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">{t("footer.legal")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("footer.developedBy", { author: "Rinzler" })}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">v{version}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}