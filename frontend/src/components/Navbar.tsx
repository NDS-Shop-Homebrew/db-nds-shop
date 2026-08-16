import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DarkModeToggle } from "./DarkModeToggle";

const links = [
  { to: "/", labelKey: "nav.home" },
  { to: "/game-list", labelKey: "nav.gameList" },
  { to: "/about", labelKey: "nav.about" },
  { to: "/tutorial", labelKey: "nav.tutorial" },
  { to: "/docs", labelKey: "nav.api" },
];

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleLang = () => {
    const next = i18n.language === "en" ? "fr" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("appLang", next);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 dark:bg-background/95 backdrop-blur border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="NDS-Shop" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg text-foreground hidden sm:inline">NDS-Shop</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
            <Link to="/favorites" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-red-500" title={t("nav.favorites")}>
              <Heart size={18} />
            </Link>
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
            >
              {i18n.language === "en" ? "FR" : "EN"}
            </button>
            <DarkModeToggle />
          </div>
        </nav>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-background border-b border-border">
          <div className="flex flex-col gap-1 p-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <div className="flex items-center gap-3 pt-4 mt-2 border-t border-border">
              <Link to="/favorites" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                <Heart size={16} /> {t("nav.favorites")}
              </Link>
              <button
                onClick={toggleLang}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
              >
                {i18n.language === "en" ? "FR" : "EN"}
              </button>
              <DarkModeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}