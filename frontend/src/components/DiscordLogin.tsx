import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { API_BASE_URL } from "../config";

interface Me {
  loggedIn: boolean;
  user: { id: string; username: string } | null;
}

// Connexion "Se connecter avec Discord" (OAuth2). Le profil sert à recevoir les
// notifications MP du bot quand le statut de la demande change.
export default function DiscordLogin() {
  const { t } = useTranslation();
  const [me, setMe] = useState<Me>({ loggedIn: false, user: null });

  useEffect(() => {
    fetch(`${API_BASE_URL}/v1/auth/me`)
      .then((r) => r.json())
      .then(setMe)
      .catch(() => {});
  }, []);

  const logout = async () => {
    await fetch(`${API_BASE_URL}/v1/auth/logout`, { method: "POST" });
    setMe({ loggedIn: false, user: null });
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
      {me.loggedIn ? (
        <div className="flex items-center justify-between gap-2">
          <p>
            {t("request.loggedAs")} <strong>{me.user?.username}</strong>
          </p>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut size={14} /> {t("request.logout")}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p>{t("request.loginHint")}</p>
          <Button
            size="sm"
            onClick={() => {
              window.location.href = `${API_BASE_URL}/v1/auth/discord`;
            }}
          >
            🔗 {t("request.loginDiscord")}
          </Button>
        </div>
      )}
    </div>
  );
}