# db-nds-shop

Site web public de **NDS-Shop** : catalogue de jeux Nintendo DS/3DS, fiches, téléchargements, UniStore.

Ce repo contient uniquement le **site public** (`backend/` + `frontend/`). Le schéma BDD, le pipeline de build et l'API de génération vivent ailleurs (voir `PROMPT.md` / `MEMORY.md` à la racine de `NDS-Shop-all-project`).

## Composants

| Dossier | Rôle | Port |
|---|---|---|
| `backend/` | API Express + Prisma (`@nds-shop/prisma`), sert les assets `storage/` en `/assets` | 3001 |
| `frontend/` | Site React 19 + Vite + Tailwind v4 + shadcn/ui | 5174 |

## Développement local

Prérequis : Node.js 20+, MySQL (Laragon), base `ndsshop`.

```bash
cd backend && npm run dev     # :3001
cd frontend && npm run dev    # :5174
```

Ou lancer tout l'écosystème : `launch-all.bat` à la racine du projet.

Variables : `backend/.env` (`SITE_URL`, `MEDIA_STORAGE_PATH=…/storage/assets`, `SESSION_SECRET`), `frontend/.env`.

## Schéma BDD

Source de vérité = le package partagé `../prisma` (racine du projet). **Ne jamais lancer `prisma db push` depuis ce repo.**

## Pipeline de build

Les scripts de build (MD, games.json, UniStore, atlases, forwarders CIA) sont dans `api.db-nds-shop/src/scripts/` (TypeScript). La génération des données passe par l'API Hono (`POST /api/build/unistore`) ou le CLI (`cli.ts`).

## Ajouter un jeu

1. Uploader les métadonnées + ROM via l'admin `upload.db-nds-shop.fr`
2. Les assets (icônes, boxarts, screenshots, forwards CIA) sont extraits automatiquement puis stockés dans `storage/`