import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

const FAV_KEY = "nds-favs";

const readLocal = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeLocal = (favs: string[]) =>
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));

export function useFavorites() {
  const [favs, setFavs] = useState<string[]>(readLocal);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/v1/auth/me`)
      .then((r) => r.json())
      .then((me) => {
        if (cancelled || !me.loggedIn) return;
        setLoggedIn(true);
        fetch(`${API_BASE_URL}/v1/favorites`)
          .then((r) => r.json())
          .then((data) => {
            const server = Array.isArray(data.favorites) ? data.favorites : [];
            const local = readLocal();
            if (server.length > 0) {
              setFavs(server);
              writeLocal(server);
            } else if (local.length > 0) {
              fetch(`${API_BASE_URL}/v1/favorites`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ favorites: local }),
              });
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
      const next = favs.includes(slug) ? favs.filter((s) => s !== slug) : [...favs, slug];
      setFavs(next);
      writeLocal(next);
      if (loggedIn) {
        fetch(`${API_BASE_URL}/v1/favorites`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favorites: next }),
        }).catch(() => {});
      }
    },
    [favs, loggedIn]
  );

  return { favs, toggle, loggedIn };
}