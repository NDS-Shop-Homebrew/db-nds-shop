import { useCallback, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const BASE_URL = `${API_BASE}/api/v1`;
const FAV_KEY = "nds-favs";

const readLocal = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeLocal = (favs: string[]) => {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  } catch {
    // Ignore storage quota errors
  }
};

export function useFavorites() {
  const [favs, setFavs] = useState<string[]>(readLocal);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${BASE_URL}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { loggedIn: false }))
      .then((me) => {
        if (cancelled || !me.loggedIn) return;
        setLoggedIn(true);

        fetch(`${BASE_URL}/favorites`, { credentials: "include" })
          .then((r) => (r.ok ? r.json() : { favorites: [] }))
          .then((data) => {
            if (cancelled) return;
            const server: string[] = Array.isArray(data.favorites) ? data.favorites : [];
            const local = readLocal();

            if (server.length > 0) {
              setFavs(server);
              writeLocal(server);
            } else if (local.length > 0) {
              fetch(`${BASE_URL}/favorites`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ favorites: local }),
              }).catch(() => {});
            }
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(
    (slug: string) => {
      setFavs((prev) => {
        const next = prev.includes(slug)
          ? prev.filter((s) => s !== slug)
          : [...prev, slug];

        writeLocal(next);

        if (loggedIn) {
          fetch(`${BASE_URL}/favorites`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ favorites: next }),
          }).catch(() => {});
        }

        return next;
      });
    },
    [loggedIn]
  );

  return { favs, toggle, loggedIn };
}