import { useTranslation } from "react-i18next";
import { Github, Shield, FileText, Gamepad2 } from "lucide-react";

export default function Footer() {
  const version = import.meta.env.VITE_APP_VERSION || "dev";
  const { t } = useTranslation();

  return (
    <footer className="border-t border-primary/10 mt-24">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <span className="font-pixel text-xs text-primary neon-text">NDS-Shop</span>
            </div>
            <p className="font-body text-lg text-muted-foreground">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="https://github.com/TheRinzler65"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github size={20} />
              </a>
              <a
                href="/privacy"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Shield size={20} />
              </a>
              <a
                href="/dmca"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <FileText size={20} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-pixel text-xs text-foreground mb-4">
              {t("footer.links")}
            </h4>
            <div className="space-y-2 font-body text-lg">
              <a href="/game-list" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("nav.gameList")}
              </a>
              <a href="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("nav.about")}
              </a>
              <a href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                {t("footer.privacyPolicy")}
              </a>
              <a href="/dmca" className="block text-muted-foreground hover:text-primary transition-colors">
                DMCA
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-pixel text-xs text-foreground mb-4">
              {t("footer.legal")}
            </h4>
            <p className="font-body text-lg text-muted-foreground">
              {t("footer.developedBy", { author: "Rinzler" })}
            </p>
            <p className="font-body text-base text-muted-foreground/60 mt-2">
              v{version}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}