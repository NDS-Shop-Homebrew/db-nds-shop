import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "./ui/navigation-menu";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import { useTranslation } from "../../node_modules/react-i18next";
import { Select, SelectTrigger, SelectContent, SelectItem } from "./ui/select";
import { DarkModeToggle } from "./DarkModeToggle";

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<string>(i18n.language || "en");

  const handleChangeLang = (value: string) => {
    i18n.changeLanguage(value);
    setLang(value);
    localStorage.setItem("appLang", value);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("appLang");
    if (savedLang && savedLang !== lang) {
      i18n.changeLanguage(savedLang);
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full px-4 py-2 border-b border-gray-700 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-bold tracking-tight"
        >
          <img src="/favicon.ico" alt="NDS-Shop Logo" className="w-8 h-8" />
          <span>NDS-Shop</span>
        </Link>

        <NavigationMenu>
          <NavigationMenuList className="hidden md:flex gap-7 text-xl font-semibold items-center">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/">{t("nav.home")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/game-list">{t("nav.gameList")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/about">{t("nav.about")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Sélecteur de langue */}
            <NavigationMenuItem>
              <Select value={lang} onValueChange={handleChangeLang}>
                <SelectTrigger className="w-[140px] flex items-center justify-between px-3 py-1 border rounded-lg bg-gray-100 hover:bg-gray-200">
                  <div className="flex items-center gap-2">
                    <LanguageIcon fontSize="small" />
                    <span>{lang === "en" ? "English" : "Français"}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en" className="flex items-center gap-2">
                    <LanguageIcon fontSize="small" /> English
                  </SelectItem>
                  <SelectItem value="fr" className="flex items-center gap-2">
                    <LanguageIcon fontSize="small" /> Français
                  </SelectItem>
                </SelectContent>
              </Select>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <DarkModeToggle />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <button
          className="md:hidden z-50"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        ref={menuRef}
        className={`md:hidden absolute top-full left-0 w-full flex flex-col items-start gap-3 px-6 py-4 ease-in-out transform origin-top ${
          menuOpen ? "scale-y-100" : "scale-y-0"
        } bg-white dark:bg-[oklch(0.14_0_0)]`}
        style={{
          transformOrigin: "top",
        }}
      >
        <Link to="/" onClick={() => setMenuOpen(false)}>
          {t("nav.home")}
        </Link>
        <Link to="/game-list" onClick={() => setMenuOpen(false)}>
          {t("nav.gameList")}
        </Link>
        <Link to="/about" onClick={() => setMenuOpen(false)}>
          {t("nav.about")}
        </Link>

        <Select value={lang} onValueChange={handleChangeLang}>
          <SelectTrigger className="mt-2 w-full flex items-center justify-between px-3 py-1 border rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
            <div className="flex items-center gap-2">
              <LanguageIcon fontSize="small" />
              <span>{lang === "en" ? "English" : "Français"}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en" className="flex items-center gap-2">
              <LanguageIcon fontSize="small" /> English
            </SelectItem>
            <SelectItem value="fr" className="flex items-center gap-2">
              <LanguageIcon fontSize="small" /> Français
            </SelectItem>
          </SelectContent>
        </Select>
        
        <div className="mt-4">
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
