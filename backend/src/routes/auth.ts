// Auth OAuth2 Discord — connexion "Se connecter avec Discord".
// Session : cookie httpOnly signé (JWT HMAC-SHA256). Le site ne voit jamais le mot de passe,
// le code d'autorisation est à usage unique, et l'identité est lue depuis la session signée
// (jamais depuis le body du client).
import express from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";

const router = express.Router();

const DISCORD_AUTHORIZE = "https://discord.com/oauth2/authorize";
const DISCORD_TOKEN = "https://discord.com/api/oauth2/token";
const DISCORD_ME = "https://discord.com/api/v10/users/@me";
const SESSION_COOKIE = "nds_session";

function clientId() {
  return process.env.DISCORD_OAUTH_CLIENT_ID || "";
}
function clientSecret() {
  return process.env.DISCORD_OAUTH_CLIENT_SECRET || "";
}
function sessionSecret() {
  return process.env.SESSION_SECRET || "";
}

// --- Cookies (parse/pose minimal, pas besoin de cookie-parser) ---
function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of String(header || "").split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

const setCookie = (res: express.Response, value: string, maxAge: number) => {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; ${
      process.env.NODE_ENV === "production" ? "Secure; " : ""
    }SameSite=Lax; Max-Age=${maxAge}`
  );
};

const clearCookie = (res: express.Response) => {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
};

// --- Session helpers ---
export function getSessionUser(req: express.Request): { id: string; username: string } | null {
  try {
    const cookies = parseCookies(req.headers.cookie);
    if (!cookies[SESSION_COOKIE] || !sessionSecret()) return null;
    const payload = jwt.verify(cookies[SESSION_COOKIE], sessionSecret()) as any;
    if (!payload?.id) return null;
    return { id: payload.id, username: payload.username || "" };
  } catch {
    return null;
  }
}

const redirectUri = (req: express.Request) =>
  `https://${req.headers.host}/api/v1/auth/discord/callback`;

const frontendUrl = (req: express.Request) =>
  String(req.headers.host || "").includes("localhost")
    ? "http://localhost:5173"
    : "https://db-nds-shop.fr";

// --- GET /api/v1/auth/discord — redirige vers Discord ---
router.get("/discord", (req, res) => {
  const client = clientId();
  if (!client || !clientSecret() || !sessionSecret()) {
    return res.status(503).json({ error: "OAuth Discord non configuré." });
  }
  const state = jwt.sign({ csrf: Math.random().toString(36).slice(2) }, sessionSecret(), {
    expiresIn: "5m",
  });
  // state CSRF : cookie httpOnly court, vérifié au callback
  res.setHeader(
    "Set-Cookie",
    `oauth_state=${encodeURIComponent(state)}; Path=/api/v1/auth/discord/callback; HttpOnly; SameSite=Lax; Max-Age=300`
  );
  const url =
    `${DISCORD_AUTHORIZE}?client_id=${client}&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri(req))}` +
    `&scope=identify&state=${encodeURIComponent(state)}`;
  res.redirect(url);
});

// --- GET /api/v1/auth/discord/callback — échange le code, pose la session ---
router.get("/discord/callback", async (req, res) => {
  const { code, state } = req.query;
  const cookies = parseCookies(req.headers.cookie);
  try {
    // CSRF : le state doit correspondre à celui posé en cookie
    const expected = cookies["oauth_state"];
    if (!state || state !== expected) {
      return res.status(403).json({ error: "État invalide (CSRF)." });
    }
    if (!code) return res.status(400).json({ error: "Code manquant." });

    const form = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: redirectUri(req),
      client_id: clientId(),
      client_secret: clientSecret(),
    });
    const tokenResp = await fetch(DISCORD_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!tokenResp.ok) {
      return res.status(502).json({ error: `Échange token Discord: ${tokenResp.status}` });
    }
    const { access_token } = (await tokenResp.json()) as any;

    const meResp = await fetch(DISCORD_ME, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!meResp.ok) {
      return res.status(502).json({ error: `Profil Discord: ${meResp.status}` });
    }
    const me = (await meResp.json()) as any;

    const session = jwt.sign(
      { id: me.id, username: me.username || me.global_name || "Discord" },
      sessionSecret(),
      { expiresIn: "7d" }
    );
    setCookie(res, session, 7 * 24 * 3600);
    res.redirect(`${frontendUrl(req)}/request`);
  } catch (err) {
    console.error("❌ OAuth callback error:", err);
    res.status(500).json({ error: "Erreur de connexion." });
  }
});

// --- GET /api/v1/auth/me — état de la session ---
router.get("/me", (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.json({ loggedIn: false, user: null });
  res.json({
    loggedIn: true,
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

// --- POST /api/v1/auth/logout ---
router.post("/logout", (_req, res) => {
  clearCookie(res);
  res.json({ ok: true });
});

export default router;