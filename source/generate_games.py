# generate_games.py
import json
from pathlib import Path
import frontmatter

GAMES_DIR = Path("../frontend/public/_ds")
OUTPUT_FILE = Path("../frontend/public/games.json")

games = []
for md_file in GAMES_DIR.glob("*.md"):
    post = frontmatter.load(md_file)
    data = post.metadata
    data["fileName"] = md_file.stem
    games.append(data)

OUTPUT_FILE.write_text(json.dumps(games, indent=2))
print(f"✅ {len(games)} jeux exportés dans public/games.json")
