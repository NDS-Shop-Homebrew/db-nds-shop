# generate_games.py
import json
import re
import unicodedata
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent))
from db_client import get_db

import frontmatter

GAMES_DIR = Path("../frontend/public/_ds")
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


def main():
    db = get_db()
    games = db.fetch_all_games()
    
    # Build slug to titleId mapping
    title_ids = {}
    for game in games:
        if game.get("titleId"):
            title_ids[web_name(game["title"])] = game["titleId"]
    
    output = []
    for md_file in sorted(GAMES_DIR.glob("*.md")):
        slug = md_file.stem
        if slug not in title_ids:
            continue
        
        post = frontmatter.load(md_file)
        title = post.get("title", "")
        
        # Find corresponding game from DB
        game = next((g for g in games if g["title"] == title), None)
        if not game:
            continue
        
        g = {
            "title": game["title"],
            "titleId": game["titleId"],
            "version": game["version"],
            "author": game["author"],
            "developer": game["developer"],
            "publisher": game["publisher"],
            "description": game["descriptionMd"],
            "systems": game["systems"],
            "genres": game["genres"],
            "categories": game["categories"],
            "color": game["color"],
            "color_bg": game["color_bg"],
            "priority": game["priority"],
            "stars": game["stars"],
            "icon": game["icon"],
            "image": game["image"],
            "boxart": game["boxart"],
            "website": game.get("website"),
            "wiki": game.get("wiki"),
            "source": game.get("source"),
            "license": game.get("license"),
            "screenshots": game.get("screenshots", []),
            "downloads": game.get("downloads", {}),
            "scripts": game.get("scripts", {}),
        }
        
        output.append(g)
    
    OUTPUT_FILE.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf8")
    print(f"OK {len(output)} jeux exportes dans {OUTPUT_FILE}")

if __name__ == "__main__":
    main()