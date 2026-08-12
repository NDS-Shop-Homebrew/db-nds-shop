# Updates the _ds/*.md frontmatter after a full asset regeneration:
#   - screenshots: points each game to its real libretro Named_Snaps PNG
#     Priority: snaps-map.json (exact title mapping), then on-disk scan
#   - image_length: real byte size of the current icon PNG
# Then regenerates frontend/public/games.json.
import json
import unicodedata
import urllib.parse
from pathlib import Path

import frontmatter

ROOT = Path(__file__).resolve().parent.parent.parent
MDS_DIR = ROOT / "frontend/public/_ds"
ICONS_DIR = ROOT / "frontend/public/assets/images/icons"
SHOTS_DIR = ROOT / "frontend/public/assets/images/screenshots"
SNAPS_CACHE = Path(__file__).resolve().parent / "cache/snaps-map.json"


def normalize(s: str) -> str:
    """Lowercase, no accents, only alnum (for fuzzy folder matching)."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return "".join(c.lower() for c in s if c.isalnum())


# 1) Mapping exact depuis snaps-map.json (source de vérité)
SNAPS_MAP = {}
if SNAPS_CACHE.exists():
    try:
        SNAPS_MAP = json.loads(SNAPS_CACHE.read_text())
    except json.JSONDecodeError:
        print("Avertissement : snaps-map.json illisible")
else:
    print("Avertissement : cache/snaps-map.json absent")

# 2) Index des dossiers screenshots réels sur disque (fallback)
folder_index = {}
if SHOTS_DIR.exists():
    for d in SHOTS_DIR.iterdir():
        if d.is_dir():
            files = [f for f in d.iterdir() if f.is_file() and f.suffix.lower() in (".png", ".jpg", ".jpeg")]
            if files:
                folder_index[normalize(d.name)] = files[0]


def find_shot(title: str):
    """Retourne le chemin du PNG screenshot pour un titre, ou None."""
    if not title:
        return None
    # 1. Mapping exact snaps-map.json
    snap = SNAPS_MAP.get(title)
    if snap:
        # le fichier attendu : screenshots/<snap>/<snap>
        folder = SHOTS_DIR / snap
        if folder.exists():
            inner = [f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in (".png", ".jpg", ".jpeg")]
            if inner:
                return inner[0]
    # 2. Scan disque par titre normalisé
    return folder_index.get(normalize(title))


changed = 0
missing = []
for md_file in sorted(MDS_DIR.glob("*.md")):
    post = frontmatter.load(md_file)
    title = post.get("title")
    shot_file = find_shot(title)
    if not shot_file:
        missing.append(f"{md_file.name} (title={title})")
        continue

    folder_enc = urllib.parse.quote(shot_file.parent.name, safe="")
    file_enc = urllib.parse.quote(shot_file.name, safe="")
    shot_url = f"https://db-nds-shop.fr/assets/images/screenshots/{folder_enc}/{file_enc}"

    old_shots = post.get("screenshots", []) or []
    kept = [
        s for s in old_shots
        if s.get("description") != "Boxart" and s.get("url") != shot_url
    ]
    post["screenshots"] = [{"description": "Screenshot", "url": shot_url}] + kept
    icon_name = urllib.parse.unquote((post.get("icon") or "").split("/")[-1])
    icon_path = ICONS_DIR / icon_name
    if icon_name and icon_path.exists() and "image_length" in post:
        post["image_length"] = icon_path.stat().st_size
    frontmatter.dump(post, md_file)
    changed += 1

print(f"Frontmatter mis à jour : {changed}/{len(list(MDS_DIR.glob('*.md')))}")
if missing:
    print("Sans screenshot :")
    for m in missing:
        print(" -", m)
