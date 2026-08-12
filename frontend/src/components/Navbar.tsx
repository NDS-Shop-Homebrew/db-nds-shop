import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Gamepad2, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DarkModeToggle } from "./DarkModeToggle";

const links = [
  { to: "/", labelKey: "nav.home" },
  { to: "/game-list", labelKey: "nav.gameList" },
  { to: "/about", labelKey: "nav.about" },
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
        scrolled
          ? "bg-background/95 backdrop-blur border-b border-primary/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
        <Link
          to="/"
          className="flex items-center gap-2 group"
        >
          <Gamepad2 className="w-7 h-7 text-primary group-hover:animate-[pixelSpin_0.5s_ease-in-out]" />
          <span className="font-pixel text-sm text-primary neon-text hidden sm:inline">
            NDS-Shop
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-body text-xl transition-all duration-200 hover:text-primary ${
                location.pathname === link.to
                  ? "text-primary neon-text"
                  : "text-foreground/80"
              }`}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
            <button
              onClick={toggleLang}
              className="font-pixel text-[10px] px-3 py-1.5 rounded pixel-border hover:bg-primary/10 transition-colors"
            >
              {i18n.language === "en" ? "FR" : "EN"}
            </button>
            <DarkModeToggle />
          </div>
        </nav>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur border-t border-primary/20">
          <div className="flex flex-col items-center gap-4 py-6 px-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`font-body text-2xl transition-colors ${
                  location.pathname === link.to
                    ? "text-primary neon-text"
                    : "text-foreground/80"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <div className="flex items-center gap-4 pt-4 border-t border-border w-full justify-center">
              <button
                onClick={toggleLang}
                className="font-pixel text-[10px] px-3 py-1.5 rounded pixel-border"
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