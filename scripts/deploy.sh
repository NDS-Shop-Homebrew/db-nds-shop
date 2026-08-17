#!/bin/bash
# Déploiement db-nds-shop — à exécuter sur le serveur.
# Usage: ./scripts/deploy.sh
set -e
cd /srv/nds-shop/db

git pull origin main

# Backend : recompile le dist/ (gitignoré, jamais mis à jour par git pull)
cd backend
npx tsc
cd ..

pm2 restart db-nds-shop
echo "✅ Déployé — backend recompilé et redémarré"