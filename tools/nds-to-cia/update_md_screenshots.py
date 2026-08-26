#!/usr/bin/env python3
"""
Updates the database with screenshot info after asset regeneration:
  - screenshots: points each game to its screenshots in
    assets/images/screenshots/<webfied>/<n>.png (numbered files)
  - icon: updates icon URL if extracted
Then regenerates frontend/public/games.json via generate_games.py.
"""
import json
import re
import unicodedata
import urllib.parse
import secrets
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "source"))
from db_client import get_db

ROOT = Path(__file__).resolve().parent.parent.parent
SHOTS_DIR = ROOT / "frontend/public/assets/images/screenshots"
ICONS_DIR = ROOT / "frontend/public/assets/images/icons"


def normalize(s: str) -> str:
    """Lowercase, no accents, only alnum - matches iconName() convention in nds-assets.mjs."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return "".join(c.lower() for c in s if c.isalnum())


def generate_id() -> str:
    """Generate a ULID-like ID (26 chars, similar to Prisma's default)."""
    # ULID-like: timestamp (10 chars) + random (16 chars)
    import time
    timestamp = int(time.time() * 1000)
    # Base32 encoding of timestamp (10 chars)
    alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
    ts = ""
    for _ in range(10):
        ts = alphabet[timestamp % 32] + ts
        timestamp //= 32
    # Random part (16 chars)
    random_part = "".join(secrets.choice(alphabet) for _ in range(16))
    return (ts + random_part).lower()


def main():
    db = get_db()
    games = db.fetch_all_games()
    
    # Index des dossiers screenshots réels (nom normalisé -> liste des fichiers numérotés triés)
    folder_index = {}
    if SHOTS_DIR.exists():
        for d in SHOTS_DIR.iterdir():
            if d.is_dir():
                files = sorted(
                    (
                        f
                        for f in d.iterdir()
                        if f.is_file()
                        and re.match(r"^(\d+|[a-z0-9]+)\.(png|jpg|jpeg)$", f.name, re.I)
                    ),
                    key=lambda f: (
                        int(re.match(r"^(\d+)", f.name).group(1))
                        if re.match(r"^\d+", f.name)
                        else 999
                    ),
                )
                if files:
                    folder_index[normalize(d.name)] = files
    else:
        print("Avertissement : dossier screenshots absent")

    updated = 0
    missing = []
    for game in games:
        title = game.get("title")
        if not title:
            continue
            
        norm_title = normalize(title)
        shot_files = folder_index.get(norm_title)
        
        if shot_files:
            # Build screenshot URLs
            screenshots = []
            for i, shot_file in enumerate(shot_files):
                folder_enc = urllib.parse.quote(shot_file.parent.name, safe="")
                file_enc = urllib.parse.quote(shot_file.name, safe="")
                url = f"https://db-nds-shop.fr/assets/images/screenshots/{folder_enc}/{file_enc}"
                screenshots.append({
                    "description": f"Screenshot {i+1}",
                    "url": url,
                    "order": i
                })
            
            # Keep existing Boxart if any
            existing_boxart = [s for s in game.get("screenshots", []) if s.get("description") == "Boxart"]
            screenshots = existing_boxart + screenshots
            
            # Update in database via direct SQL with proper SQL mode
            import mysql.connector
            from mysql.connector import pooling
            from dotenv import load_dotenv
            load_dotenv(ROOT / ".env")
            
            pool = pooling.MySQLConnectionPool(
                pool_name="update_pool",
                pool_size=1,
                host="localhost",
                port=3306,
                user="root",
                password="",
                database="ndsshop",
                charset="utf8mb4",
                collation="utf8mb4_unicode_ci",
                sql_mode="ANSI_QUOTES",
                autocommit=True,
            )
            cnx = pool.get_connection()
            cursor = cnx.cursor()
            try:
                # Get game ID
                cursor.execute("SELECT id FROM game WHERE title = %s", (title,))
                result = cursor.fetchone()
                if not result:
                    missing.append(title)
                    continue
                game_id = result[0]
                
                # Delete old screenshots (except boxart)
                cursor.execute(
                    "DELETE FROM game_screenshot WHERE gameId = %s AND description != 'Boxart'",
                    (game_id,)
                )
                # Insert new screenshots
                for s in screenshots:
                    if s["description"] == "Boxart":
                        continue  # already exists
                    cursor.execute(
                        'INSERT INTO game_screenshot (id, gameId, description, url, "order") VALUES (%s, %s, %s, %s, %s)',
                        (generate_id(), game_id, s["description"], s["url"], s["order"])
                    )
                updated += 1
            finally:
                cursor.close()
                cnx.close()
        else:
            missing.append(title)
    
    print(f"Screenshots mis à jour en BDD : {updated}/{len(games)}")
    if missing:
        print(f"Sans dossier screenshots : {len(missing)}")
        for m in missing[:10]:
            print(" -", m)

    # Regenerate games.json
    import subprocess
    result = subprocess.run([sys.executable, "generate_games.py"], cwd=ROOT / "source", capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr)


if __name__ == "__main__":
    main()