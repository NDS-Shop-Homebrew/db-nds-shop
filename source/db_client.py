#!/usr/bin/env python3
"""
Client MySQL pour lire les jeux depuis la base de données.
Remplace la lecture de source/apps/*.json
"""
import json
import os
from pathlib import Path
import mysql.connector
from mysql.connector import pooling
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load .env file
load_dotenv(Path(__file__).parent.parent / ".env")


class DBClient:
    def __init__(self):
        self.pool = pooling.MySQLConnectionPool(
            pool_name="ndsshop_pool",
            pool_size=5,
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "nds"),
            password=os.getenv("DB_PASS", ""),
            database=os.getenv("DB_NAME", "ndsshop"),
            charset="utf8mb4",
            collation="utf8mb4_unicode_ci",
            autocommit=True,
        )

    def _conn(self):
        return self.pool.get_connection()

    def fetch_all_games(self) -> List[Dict[str, Any]]:
        """Récupère tous les jeux avec leurs relations"""
        conn = self._conn()
        cursor = conn.cursor(dictionary=True)
        try:
            # Games de base
            cursor.execute("""
                SELECT g.*, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT('description', s.description, 'url', s.url, 'order', s.order)
                    ) as screenshots,
                    JSON_ARRAYAGG(
                        JSON_OBJECT('fileName', d.fileName, 'url', d.url, 'size', d.size, 'type', d.type)
                    ) as downloads,
                    JSON_ARRAYAGG(
                        JSON_OBJECT('name', sc.name, 'script', sc.script)
                    ) as scripts
                FROM `game` g
                LEFT JOIN `game_screenshot` s ON s.gameId = g.id
                LEFT JOIN `game_download` d ON d.gameId = g.id
                LEFT JOIN `game_script` sc ON sc.gameId = g.id
                GROUP BY g.id
                ORDER BY g.title
            """)
            rows = cursor.fetchall()
            
            games = []
            for row in rows:
                game = {
                    "id": row["id"],
                    "title": row["title"],
                    "titleId": row["titleId"],
                    "version": row["version"],
                    "author": row["author"],
                    "developer": row["developer"],
                    "publisher": row["publisher"],
                    "descriptionMd": row["descriptionMd"],
                    "systems": json.loads(row["systems"]) if row["systems"] else [],
                    "genres": json.loads(row["genres"]) if row["genres"] else [],
                    "categories": json.loads(row["categories"]) if row["categories"] else ["game"],
                    "color": row["color"],
                    "color_bg": row["colorBg"],
                    "priority": bool(row["priority"]),
                    "stars": row["stars"] or 0,
                    "icon": row["iconUrl"],
                    "image": row["imageUrl"],
                    "boxart": row["boxartUrl"],
                    "updated": row["updatedAt"].isoformat() if row["updatedAt"] else None,
                }
                
                # Parse JSON arrays
                if row["screenshots"] and row["screenshots"][0]:
                    game["screenshots"] = [
                        s for s in json.loads(row["screenshots"]) if s["description"]
                    ]
                    game["screenshots"].sort(key=lambda x: x["order"])
                else:
                    game["screenshots"] = []
                    
                if row["downloads"] and row["downloads"][0]:
                    game["downloads"] = {
                        d["fileName"]: {"url": d["url"], "size": d["size"]}
                        for d in json.loads(row["downloads"]) if d["fileName"]
                    }
                else:
                    game["downloads"] = {}
                    
                if row["scripts"] and row["scripts"][0]:
                    game["scripts"] = {
                        s["name"]: s["script"]
                        for s in json.loads(row["scripts"]) if s["name"]
                    }
                else:
                    game["scripts"] = {}
                
                games.append(game)
            
            return games
        finally:
            cursor.close()
            conn.close()


# Instance globale
_db: Optional[DBClient] = None

def get_db() -> DBClient:
    global _db
    if _db is None:
        _db = DBClient()
    return _db