#!/bin/bash
# Build complet de db-nds-shop — à exécuter sur le serveur.
#
# 1. Icônes (ROMs) + boxarts + screenshots (libretro, cache skip si déjà là)
# 2. Pages + QR + unistore (generate.py)
# 3. Frontmatter + games.json (update_md + generate_games)
# 4. Forwarders .cia (optionnel, long)
#
# Usage (depuis la racine du repo): ./scripts/nds-build.sh [--roms <dir>]

set -e
export PATH=$PATH:/opt/devkitpro/tools/bin

# Vérifie qu'on est bien dans le repo db-nds-shop
if [[ ! -d .git && ! -f source/generate.py ]]; then
  echo "Erreur : lancez ce script depuis la racine du repo db-nds-shop"
  exit 1
fi
ROMS_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --roms) ROMS_DIR="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# Reset les fichiers générés localement (le build les régénère) pour un pull propre
git checkout -- frontend/public/_ds/ frontend/public/games.json 2>/dev/null || true
# Tire la branche courante (main en prod) au lieu de dev codé en dur
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git pull origin "$CURRENT_BRANCH" --ff-only
source .venv/bin/activate

echo "=== Icônes + Boxarts + Screenshots ==="
if [[ -n "$ROMS_DIR" && -d "$ROMS_DIR" ]]; then
  node tools/nds-to-cia/nds-assets.mjs \
    --apps source/apps \
    --roms "$ROMS_DIR" \
    --out frontend/public
else
  echo "(pas de --roms fourni, assets inchangés)"
fi

echo "=== Pages + QR ==="
cd source
python3 generate.py
cd ..

echo "=== Frontmatter + games.json ==="
cd tools/nds-to-cia
python3 update_md_screenshots.py
cd ../../source
python3 generate_games.py
cd ..

# 4. Forwarders .cia (skip si déjà générés)
echo "=== Forwarders .cia ==="
if [[ -n "$ROMS_DIR" && -d "$ROMS_DIR" ]]; then
  mkdir -p frontend/public/forwarder
  node tools/nds-to-cia/nds-to-cia.mjs \
    --roms "$ROMS_DIR" \
    --from-apps source/apps \
    --out frontend/public/forwarder
else
  echo "(pas de --roms fourni, forwarders inchangés)"
fi

echo "✅ Build terminé"
