import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DarkModeToggle } from "./DarkModeToggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useFavorites } from "../hooks/useFavorites";

const links = [
  { to: "/", labelKey: "nav.home" },
  { to: "/game-list", labelKey: "nav.gameList" },
  { to: "/about", labelKey: "nav.about" },
  { to: "/tutorial", labelKey: "nav.tutorial" },
  { to: "/request", labelKey: "nav.request" },
  { to: "/docs", labelKey: "nav.api" },
];

export function NavBar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { favs } = useFavorites();
  const [scrolled, setScrolled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleLang = () => {
    const next = i18n.language === "en" ? "fr" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("appLang", next);
  };

  const closeMenu = () => setSheetOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 dark:bg-background/95 backdrop-blur border-b border-border shadow-xs"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="NDS-Shop" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg text-foreground hidden sm:inline">
            NDS-Shop
          </span>
        </Link>

        {/* Navigation Desktop */}
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
            <Link
              to="/favorites"
              className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
              title={t("nav.favorites")}
              aria-label={t("nav.favorites")}
            >
              <Heart size={18} />
              {favs.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {favs.length}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={toggleLang}
              aria-label="Changer la langue"
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              {i18n.language === "en" ? "FR" : "EN"}
            </button>
            <DarkModeToggle />
          </div>
        </nav>

        {/* Menu Mobile */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Menu"
              className="md:hidden"
            >
              <Menu size={22} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <nav className="flex flex-col gap-1 p-4 pt-8">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}

              <Separator className="my-2" />

              <div className="flex flex-col gap-2 px-2 py-1">
                <Link
                  to="/favorites"
                  onClick={closeMenu}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Heart size={16} className="text-red-500" /> {t("nav.favorites")}
                  </span>
                  {favs.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold">
                      {favs.length}
                    </span>
                  )}
                </Link>

                <div className="flex items-center justify-between px-3 py-2">
                  <button
                    type="button"
                    onClick={toggleLang}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors cursor-pointer"
                  >
                    {i18n.language === "en" ? "Passer en Français" : "Switch to English"}
                  </button>
                  <DarkModeToggle />
                </div>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}