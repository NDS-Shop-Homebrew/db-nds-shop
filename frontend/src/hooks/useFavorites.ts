import { useCallback, useEffect, useRef, useState } from "react";

import { API_BASE } from "../config";
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
  // ponytail: ref des favoris courants pour le sync debounce
  const favsRef = useRef(favs);
  favsRef.current = favs;
  const loggedInRef = useRef(loggedIn);
  loggedInRef.current = loggedIn;

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
        return next;
      });
    },
    []
  );

  // ponytail: sync serveur debounced — envoie l'état courant (ref) une seule fois par rafale
  useEffect(() => {
    if (!loggedInRef.current) return;
    const timer = setTimeout(() => {
      fetch(`${BASE_URL}/favorites`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ favorites: favsRef.current }),
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [favs]);

  return { favs, toggle, loggedIn };
}