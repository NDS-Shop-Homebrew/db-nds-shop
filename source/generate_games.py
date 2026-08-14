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


# The _ds/*.md pages are regenerated from source/apps, but stale md files are
# not cleaned up, so they would otherwise leak into games.json. Keep only the
# games whose slug (webName of the title) matches a source JSON.
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

OUTPUT_FILE.write_text(json.dumps(games, indent=2))
print(f"✅ {len(games)} jeux exportés dans public/games.json")
