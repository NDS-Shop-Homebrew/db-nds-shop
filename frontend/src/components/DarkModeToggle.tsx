import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

const isSystemDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const getInitialTheme = (): boolean => {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("darkMode");
  if (saved !== null) {
    return saved === "true";
  }
  return isSystemDark();
};

export function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState<boolean>(getInitialTheme);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("darkMode", String(next));
      return next;
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className="text-foreground/80 hover:text-primary hover:bg-primary/10 cursor-pointer"
      aria-label={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
      title={darkMode ? "Mode clair" : "Mode sombre"}
    >
      {darkMode ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}