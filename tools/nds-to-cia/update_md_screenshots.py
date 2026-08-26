# Updates the _ds/*.md frontmatter after a full asset regeneration:
#   - screenshots: points each game to its screenshots in
#     assets/images/screenshots/<webfied>/<n>.png (numbered files)
#   - image_length: real byte size of the current icon PNG
# Then regenerates frontend/public/games.json.
import json
import re
import unicodedata
import urllib.parse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "source"))
from db_client import get_db

import frontmatter

ROOT = Path(__file__).resolve().parent.parent.parent
MDS_DIR = ROOT / "frontend/public/_ds"
ICONS_DIR = ROOT / "frontend/public/assets/images/icons"
SHOTS_DIR = ROOT / "frontend/public/assets/images/screenshots"


def normalize(s: str) -> str:
    """Lowercase, no accents, only alnum (for fuzzy folder matching)."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return "".join(c.lower() for c in s if c.isalnum())


def main():
    db = get_db()
    games = db.fetch_all_games()
    
    # Index des dossiers screenshots réels (nom -> liste des fichiers numérotés triés)
    folder_index = {}
    if SHOTS_DIR.exists():
        for d in SHOTS_DIR.iterdir():
            if d.is_dir():
                files = sorted(
                    (
                        f
                        for f in d.iterdir()
                        if f.is_file()
                        and re.match(r"^\d+\.(png|jpg|jpeg)$", f.name, re.I)
                    ),
                    key=lambda f: int(re.match(r"^(\d+)", f.name).group(1)),
                )
                if files:
                    folder_index[normalize(d.name)] = files
    else:
        print("Avertissement : dossier screenshots absent")

    changed = 0
    missing = []
    for md_file in sorted(MDS_DIR.glob("*.md")):
        post = frontmatter.load(md_file)
        title = post.get("title")
        
        # Find game in database
        game = next((g for g in games if g["title"] == title), None)
        if not game:
            missing.append(f"{md_file.name} (title={title})")
            continue
            
        # Update screenshots in frontmatter
        shot_files = folder_index.get(normalize(title))
        if shot_files:
            folder_enc = urllib.parse.quote(shot_files[0].parent.name, safe="")
            # Une seule URL par jeu (le premier fichier), même si le dossier en contient plusieurs
            new_url = f"https://db-nds-shop.fr/assets/images/screenshots/{folder_enc}/{urllib.parse.quote(shot_files[0].name, safe='')}"

            old_shots = post.get("screenshots", []) or []
            # Garde uniquement les Boxart + le nouveau screenshot (pas de doublon)
            kept_boxart = [s for s in old_shots if s.get("description") == "Boxart"]
            post["screenshots"] = [{"description": "Screenshot", "url": new_url}] + kept_boxart
        
        icon_name = urllib.parse.unquote((post.get("icon") or "").split("/")[-1])
        icon_path = ICONS_DIR / icon_name
        if icon_name and icon_path.exists() and "image_length" in post:
            post["image_length"] = icon_path.stat().st_size
        
        # Save back
        frontmatter.dump(post, md_file)
        changed += 1
    
    print(f"Frontmatter mis à jour : {changed}/{len(list(MDS_DIR.glob('*.md')))}")
    if missing:
        print("Sans screenshot sur disque ou non trouvé en BDD :")
        for m in missing:
            print(" -", m)

if __name__ == "__main__":
    main()
