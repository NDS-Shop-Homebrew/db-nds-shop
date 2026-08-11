# nds-to-cia — Générateur de forwarders NDS → CIA en batch

Convertit des ROMs `.nds`/`.dsi` en `.cia` forwarder installables sur 3DS,
sans GUI. Portage Node (zéro dépendance) de la logique forwarder de
**Multitool project/multitools** (elle-même une réimplémentation de
Forwarder3DS d'Olmectron).

## Prérequis

- Node.js ≥ 18 (Windows / Linux / macOS)

## Usage

```bash
# Convertir tous les .nds d'un dossier
node tools/nds-to-cia/nds-to-cia.mjs --roms <dossier_roms> --out <dossier_sortie>

# Régénérer les 55 forwarders de db-nds-shop (ROMs dans un dossier, manifest depuis source/apps)
node tools/nds-to-cia/nds-to-cia.mjs --roms <dossier_roms> --from-apps source/apps --out frontend/public/forwarder
```

Options :

| Option | Description | Défaut |
|---|---|---|
| `--roms <dir>` | Dossier contenant les ROMs `.nds`/`.dsi` (requis) | — |
| `--from-apps <dir>` | Restreint aux jeux listés dans `source/apps` et génère `/forwarder/*.cia` | — |
| `--out <dir>` | Dossier de sortie des `.cia` (requis) | — |
| `--card <id>` | Carte forwarder (voir `templates/`) | `sdcard` |
| `--gamepath <prefix>` | Dossier SD où sera la ROM | `/roms/nds` |
| `--tid <AAAA>` | Force un TID fixe (défaut : aléatoire par jeu) | aléatoire |
| `--keep` | Conserve les `.nds` patchés dans `<out>/patched/` | off |
| `--verbose` | Affiche la sortie de `make_cia` | off |

Cartes disponibles : `sdcard` (DSi/3DS SD Card), `ace_rpg`, `dstt`, `dstwo`,
`m3real`, `r4`, `r4idsn`, `r4itt`. Par défaut `sdcard` = ROM chargée depuis
la carte SD (le forwarder pointe vers `/roms/nds/<nom>.nds`, ce qui
correspond au chemin d'installation utilisé par les scripts du store).

## Comment ça marche

1. **Patch** : pour chaque ROM, le template forwarder (`templates/<carte>.nds`)
   est patché avec — le header de la ROM (0x00–0x11), un **TID aléatoire**
   (tiré de la liste `lib/tidList.mjs`, écrit en 0x0C + inversé en 0x230),
   le **banner** de la ROM (icône + palette + noms, format NTR 2112→9152
   octets avec CRC16, ou TWL brut), le **gamepath** (où la ROM sera sur la SD)
   et le **CRC16** du header.
2. **Conversion** : `make_cia --srl=<.nds patché>` (CTR_Toolkit v6.4 de
   3DSGuy, binaires dans `bin/`) produit le `.cia`, renommé `<jeu>.cia`.

Les `.cia` générés sont ceux que les scripts du store attendent sous
`/forwarder/<jeu>.cia`.

## Tests

```bash
node tools/nds-to-cia/test/tests.mjs
```

Couvre le vecteur de contrôle CRC16-ARC (`0xBB3D`) et les invariants du patch
(header, TID, banner 8 frames, CRC16, gamepath) sur une ROM synthétique.

**Validation à faire** : sur une vraie ROM, vérifier le lancement du forwarder
sur 3DS / émulateur. (Ne peut pas être automatisé ici sans ROM réelle.)

---

# Pipeline du store (db-nds-shop)

Le store complet se régénère à partir de `source/apps/*.json` (la source de
vérité : un fichier par jeu) et des ROMs locales. Tout est lancé par :

```bat
compile.bat
```

Il enchaîne :

| Étape | Script | Produit |
|---|---|---|
| Icônes | `nds-assets.mjs --icons` | `frontend/public/assets/images/icons/*.png` (48×48, extraites du banner ROM) |
| Boxarts | `nds-assets.mjs --boxart` | `assets/images/boxart/*.png` (libretro-thumbnails, commit épinglé) |
| Screenshots | `nds-assets.mjs --screenshots` | `assets/images/screenshots/<snap>/<snap>.png` (libretro Named_Snaps) |
| Pages + unistore (app 3DS) | `generate.py` | `_ds/*.md`, `assets/images/qr/`, `unistore/`, `data/full.json` |
| Frontmatter md | `update_md_screenshots.py` | URLs screenshots (vraies snaps) + `image_length` dans `frontend/public/_ds/*.md` |
| `games.json` (site) | `generate_games.py` | `frontend/public/games.json` |
| Déploiement | `scp`/`rsync` | serveur `db-nds-shop.fr` |

## Ajouter un jeu (3 étapes)

1. Déposer la ROM dans le dossier local des ROMs
   (défini par `--roms` dans les commandes / `compile.bat`).
2. Créer `source/apps/<slug>.json` — modèle :

   ```json
   {
     "title": "Mon Jeu",
     "author": "Éditeur",
     "categories": ["game"],
     "systems": ["DS"],
     "downloads": {
       "Mon Jeu (Europe).nds": {
         "url": "https://db-nds-shop.fr/games/Mon%20Jeu%20%28Europe%29.nds"
       }
     },
     "screenshots": [{
       "url": "https://db-nds-shop.fr/assets/images/boxart/Mon%20Jeu%20%28Europe%29.nds.png",
       "description": "Boxart"
     }],
     "version": "(Europe)",
     "updated": "2026-01-01T00:00:00+02:00"
   }
   ```

   (`icon` est optionnel : généré depuis le ROM s'il est absent.)
3. Lancer `compile.bat` — tout est régénéré (icône, boxart, screenshots,
   pages, unistore) puis déployé. Les images ne sont **jamais commitées**
   (`.gitignore`), seuls le texte (JSON, md, unistore) l'est.

## Ordre important

`generate.py` régénère les pages `_ds/*.md` depuis `source/apps` ; il
**écrase** donc toute modification du frontmatter. `update_md_screenshots.py`
(qui remplace l'entrée Boxart par la vraie snap libretro et corrige
`image_length`) doit tourner **après** `generate.py`, et `generate_games.py`
en dernier (il lit les md corrigés). L'ordre du tableau ci-dessus est celui
de `compile.bat`.

Le build est conçu pour fonctionner **sans accès à db-nds-shop.fr** : les
tailles de fichiers (`image_length`, `size`) et les icônes sont résolues en
local quand l'URL pointe vers le site (`siteLocalPath`), et les appels
réseau de secours sont silencieusement ignorés si le serveur est
injoignable (il suffit de relancer `compile.bat` quand il est revenu pour
combler les valeurs manquantes).

## Notes / attribution

- Logique forwarder : [Multitool project](https://github.com/TheRinzler65/3ds-homebrew-toolbox)
  (réimplémentation TS de Forwarder3DS, Olmectron).
- `make_cia` : CTR_Toolkit v6.4 © 2013 3DSGuy. Binaires Windows/Linux/macOS
  inclus dans `bin/`.
- Les templates `templates/*.fwd`/`*.nds` proviennent du même projet.
