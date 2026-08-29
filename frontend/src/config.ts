// ponytail: point de sortie unique API + résolution d'assets (DRY)
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || "";

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}
