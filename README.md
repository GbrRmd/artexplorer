# ArtExplorer

Plateforme web éducative et interactive à destination des collégiens.
Explorer, manipuler, comprendre — sans jargon, sans compte, sans donnée personnelle.

## Philosophie

- **Coût zéro** : hébergement GitHub Pages, base Firestore (lecture seule), images sur CDN Cloudinary.
- **Confidentialité totale** : aucune donnée personnelle, aucun compte, aucun tracker. Le site ne fait que *lire*.
- **Interactivité avant tout** : chaque action donne un retour visuel immédiat. Le plaisir de naviguer est une fonctionnalité.
- **Mobile-first** : pensé d'abord pour le smartphone tenu à une main, adapté au PC du CDI.

## Architecture par modules

Le site est une **coquille légère** (shell) qui charge des **modules pédagogiques autonomes**.
Ajouter un bloc = déposer un dossier dans `js/modules/` et l'enregistrer dans `js/main.js`.

| Module | État | Description |
|--------|------|-------------|
| `gallery` | 🚧 en cours | Base de données d'œuvres d'art à explorer |
| `ia` | 🔜 prévu | Comprendre l'IA et son utilisation |
| _(à venir)_ | 💡 | D'autres blocs viendront au fil de l'eau |

## Structure

```
index.html          Coquille unique (SPA légère, sans framework)
config.js           Config Firebase + Cloudinary
css/                Design system (tokens, base, composants)
js/core/            Shell, registre de modules, thème, cache, Firebase
js/modules/         Un dossier par bloc pédagogique
assets/             Logos, données statiques, données test
apps-script/        Pipeline images Drive -> Cloudinary -> Firestore
```

## Lancer en local

Les modules ES6 nécessitent un serveur HTTP (pas d'ouverture en `file://`).

```bash
npx serve .
# ou
python -m http.server 8000
```

Puis ouvrir http://localhost:3000 (ou :8000).

## Stack

HTML5 · CSS3 natif (variables, Grid, glassmorphism) · JavaScript ES6 Vanilla (zéro dépendance) · Firebase Firestore · Cloudinary · GitHub Pages.
