# generate_games.py
import json
import re
import unicodedata
from pathlib import Path
import frontmatter

GAMES_DIR = Path("../frontend/public/_ds")
APPS_DIR = Path("../source/apps")
OUTPUT_FILE = Path("../frontend/public/games.json")


def web_name(name: str) -> str:
    """Same slug rule as generate.py's webName()."""
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("ascii").lower()
    out = ""
    for letter in name:
        if letter in "abcdefghijklmnopqrstuvwxyz0123456789-_":
            out += letter
        elif letter in ". ":
            out += "-"
    return out


# Les _ds/*.md pages sont régénérées depuis source/apps, mais les .md obsolètes
# ne sont pas nettoyés : ils fuiteraient sinon dans games.json. Ne garder que les
# jeux dont le slug (webName du titre) correspond à un JSON de source.
known_slugs = set()
title_ids = {}
for app_file in APPS_DIR.glob("*.json"):
    try:
        app = json.loads(app_file.read_text(encoding="utf8"))
        known_slugs.add(web_name(app.get("title", "")))
        if app.get("titleId"):
            title_ids[web_name(app.get("title", ""))] = app["titleId"]
    except json.JSONDecodeError:
        pass

NDSDB_BASE = Path("../backend/public/db/nds/base")


def inject_genres(games: list) -> None:
    for g in games:
        serial = g.get("titleId")
        if not serial:
            continue
        meta = NDSDB_BASE / serial / "meta.json"
        try:
            data = json.loads(meta.read_text(encoding="utf8"))
        except (OSError, json.JSONDecodeError):
            continue
        genres = data.get("genres") or []
        if genres:
            g["genres"] = genres


games = []
for md_file in GAMES_DIR.glob("*.md"):
    post = frontmatter.load(md_file)
    data = post.metadata
    slug = data.get("slug") or web_name(data.get("title", ""))
    if slug not in known_slugs:
        print(f"⚠ ignoré (app source absente) : {md_file.name}")
        continue
    data["fileName"] = md_file.stem
    # titleId vit dans source/apps (les .md ne le contiennent pas) → on l'injecte
    if "titleId" not in data and slug in title_ids:
        data["titleId"] = title_ids[slug]
    games.append(data)

inject_genres(games)

OUTPUT_FILE.write_text(json.dumps(games, indent=2))
print(f"✅ {len(games)} jeux exportés dans public/games.json")

# --- sitemap.xml + robots.txt ---
SITE = "https://db-nds-shop.fr"
STATIC_PAGES = ["/", "/game-list", "/about", "/request", "/docs", "/favorites", "/tutorial", "/privacy", "/dmca"]

urls = [f"<url><loc>{SITE}</loc><priority>1.0</priority></url>"]
for page in STATIC_PAGES[1:]:
    urls.append(f"<url><loc>{SITE}{page}</loc><priority>0.8</priority></url>")
for g in games:
    lastmod = (g.get("updated") or "")[:10]
    urls.append(
        f"<url><loc>{SITE}/game/{g.get('fileName', '')}</loc>"
        + (f"<lastmod>{lastmod}</lastmod>" if lastmod else "")
        + "<priority>0.9</priority></url>"
    )

SITEMAP_FILE = Path("../frontend/public/sitemap.xml")
SITEMAP_FILE.write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "\n".join(urls)
    + "\n</urlset>\n"
)

ROBOTS_FILE = Path("../frontend/public/robots.txt")
ROBOTS_FILE.write_text(
    "User-agent: *\nAllow: /\n\nSitemap: " + SITE + "/sitemap.xml\n"
)
print("✅ sitemap.xml + robots.txt générés dans public/")
