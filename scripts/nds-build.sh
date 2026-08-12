#!/bin/bash
# Build complet de db-nds-shop — à exécuter sur le serveur.
#
# 1. Icônes extraites des ROMs (local, pas d'internet)
# 2. Pages + QR + unistore (generate.py)
# 3. Frontmatter + games.json (update_md + generate_games)
# 4. Forwarders .cia (optionnel, long)
#
# Usage: ./scripts/nds-build.sh [--roms <dir>]

set -e
export PATH=$PATH:/opt/devkitpro/tools/bin

cd "$(dirname "$0")/.."
ROMS_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --roms) ROMS_DIR="$2"; shift 2 ;;
    *) shift ;;
  esac
done

git pull origin dev --ff-only
source .venv/bin/activate

echo "=== Icônes (extraction ROMs locales) ==="
if [[ -n "$ROMS_DIR" && -d "$ROMS_DIR" ]]; then
  node tools/nds-to-cia/nds-assets.mjs \
    --apps source/apps \
    --roms "$ROMS_DIR" \
    --out frontend/public \
    --no-boxart --no-screenshots
else
  echo "(pas de --roms fourni, icônes inchangées)"
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
