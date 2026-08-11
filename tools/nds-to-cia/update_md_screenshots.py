# Updates the _ds/*.md frontmatter after a full asset regeneration:
#   - screenshots: replaces the "Boxart" preview entry with the real
#     libretro Named_Snaps URL (keeps existing non-Boxart entries)
#   - image_length: real byte size of the current icon PNG
# Then regenerates frontend/public/games.json.
import json
import urllib.parse
from pathlib import Path

import frontmatter

ROOT = Path(__file__).resolve().parent.parent.parent
MDS_DIR = ROOT / "frontend/public/_ds"
ICONS_DIR = ROOT / "frontend/public/assets/images/icons"
SNAPS_CACHE = Path(__file__).resolve().parent / "cache/snaps-map.json"
if not SNAPS_CACHE.exists():
    print("Avertissement : cache/snaps-map.json absent - screenshots inchangés")
    SNAPS_MAP = {}
else:
    SNAPS_MAP = json.loads(SNAPS_CACHE.read_text())

changed = 0
missing = []
for md_file in sorted(MDS_DIR.glob("*.md")):
    post = frontmatter.load(md_file)
    title = post.get("title")
    snap = SNAPS_MAP.get(title)
    if not snap:
        missing.append(f"{md_file.name} (title={title})")
        continue
    enc = urllib.parse.quote(snap, safe="")
    shot_url = f"https://db-nds-shop.fr/assets/images/screenshots/{enc}/{enc}"
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
    print("Sans snap (à vérifier) :")
    for m in missing:
        print(" -", m)
