# db-nds-shop

Base de données de jeux Nintendo DS/3DS avec site web, UniStores et pipeline de build automatisé.

## Architecture

```
MySQL (source de vérité)
  ├── game                (titres, métadonnées, icons, screenshots)
  ├── game_screenshot     (screenshots par jeu)
  ├── game_download       (ROMs/forwarders par jeu)
  └── game_script         (scripts d'installation par jeu)

Python (pipeline de build)
  ├── generate.py         → _ds/*.md, _nds/*.md, data/full.json, UniStores, QR
  ├── generate_games.py   → games.json (API frontend)
  └── update_md_screenshots.py → sync screenshots BDD ↔ disque

Node.js (assets)
  └── nds-assets.mjs      → extraction icons/boxarts/screenshots depuis ROMs → BDD
```

## Développement local

### Prérequis
- Python 3.12+ avec les dépendances de `requirements.txt`
- Node.js 18+
- MySQL / MariaDB (via Laragon recommandé)
- La base `ndsshop` créée et peuplée

### Lancer les serveurs
```
test.bat
```
Ou manuellement :
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run start
```

## Build complet

### Windows
```bash
nds-build.bat
# Avec ROMs :
nds-build.bat --roms "D:\chemin\vers\roms"
```

### Linux
```bash
./scripts/nds-build.sh
# Avec ROMs :
./scripts/nds-build.sh /chemin/vers/roms
```

### Étapes du build
1. Git pull (branche courante)
2. Extraction assets depuis ROMs (si `--roms` fourni) : icons, boxarts, screenshots → BDD
3. Génération des pages Markdown + QR codes + UniStores
4. Mise à jour des screenshots BDD + export `games.json`
5. Génération des forwarders .cia (si `--roms` fourni)

## Structure des fichiers

```
db-nds-shop/
├── backend/              # API Express + Prisma
├── frontend/             # Site web React + Vite
├── frontend/public/
│   ├── _ds/              # Pages Markdown jeux (systeme DS)
│   ├── _nds/             # Pages Markdown jeux (systeme NDS)
│   ├── _3ds/             # Pages Markdown jeux (systeme 3DS)
│   ├── data/full.json    # Données enrichies complètes
│   ├── games.json        # API listes des jeux
│   └── unistore/         # Fichiers UniStore
├── source/               # Scripts Python de build
│   ├── generate.py       # Générateur principal
│   ├── generate_games.py # Export games.json
│   └── db_client.py      # Client MySQL
├── tools/
│   └── nds-to-cia/       # Extraction assets depuis ROMs (Node.js + Prisma)
├── scripts/              # Scripts Linux
├── archive/              # Anciens fichiers JSON (obsolète, source remplacée par BDD)
└── config.ini            # Config locale (token GitHub, paths)
```

## Ajouter un jeu

1. Insérer les métadonnées dans MySQL (via adminer, phpMyAdmin ou le site upload)
2. Ajouter les ROMs dans le dossier de ROMs
3. Lancer le build avec `--roms` pour extraire les assets automatiquement
4. Ou manuellement : screenshots dans `frontend/public/assets/images/screenshots/{slug}/`

## Notes techniques

- `backend/prisma/schema.prisma` : schéma **partiel** (ne contient que Game + tables liées + GameRequest). Ne jamais lancer `prisma db push` depuis ce repo.
- `config.ini` :token GitHub pour l'API (rate limits plus élevés)
- Les images (icons, boxarts, screenshots, QR) ne sont pas commitées, déployées directement sur le serveur
