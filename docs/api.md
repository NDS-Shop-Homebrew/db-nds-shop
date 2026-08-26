# API Documentation

## Routes Publiques

### Téléchargement de ROMs

| Route | Méthode | Description | Exemple |
|-------|---------|-------------|---------|
| `/api/v1/download/:file` | GET | Télécharge une ROM (.nds/.cia) et track le téléchargement. | `/api/v1/download/Kirby%20-%20Power%20Paintbrush%20(Europe)%20(En%2CFr%2CDe%2CEs%2CIt).nds` |

**Exemple de réponse** :
Le fichier est servi directement (pas de JSON).

**Notes** :
- Le tracking est non bloquant (si la BDD est down, le téléchargement fonctionne quand même).
- Les URLs de téléchargement sont mises à jour automatiquement dans `games.json`.

### Métadonnées des jeux

| Route | Méthode | Description | Exemple |
|-------|---------|-------------|---------|
| `/api/v1/ndsdb/metadata/:serial` | GET | Récupère les métadonnées d'un jeu (titre, développeur, éditeur, etc.). | `/api/v1/ndsdb/metadata/ATKP` |

**Exemple de réponse** :
```json
{
  "name": "Kirby - Power Paintbrush",
  "formal_name": "Kirby - Power Paintbrush",
  "developer": "HAL Laboratory",
  "publisher": "Nintendo",
  "description": "...",
  "media": { ... }
}
```