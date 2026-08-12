import { useTranslation } from "react-i18next";
import { Github, Shield, FileText, Gamepad2 } from "lucide-react";

export default function Footer() {
  const version = import.meta.env.VITE_APP_VERSION || "dev";
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-foreground">NDS-Shop</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("footer.copyright", { year: new Date().getFullYear() })}</p>
            <div className="flex gap-3 mt-4">
              <a href="https://github.com/TheRinzler65" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Github size={18} /></a>
              <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors"><Shield size={18} /></a>
              <a href="/dmca" className="text-muted-foreground hover:text-primary transition-colors"><FileText size={18} /></a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">{t("footer.links")}</h4>
            <div className="space-y-2 text-sm">
              <a href="/game-list" className="block text-muted-foreground hover:text-primary transition-colors">{t("nav.gameList")}</a>
              <a href="/about" className="block text-muted-foreground hover:text-primary transition-colors">{t("nav.about")}</a>
              <a href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">{t("footer.privacy")}</a>
              <a href="/dmca" className="block text-muted-foreground hover:text-primary transition-colors">DMCA</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">{t("footer.legal")}</h4>
            <p className="text-sm text-muted-foreground">{t("footer.developedBy", { author: "Rinzler" })}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">v{version}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}