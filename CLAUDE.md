# CLAUDE.md — Contexte projet (à lire au démarrage)

> Travaille et réponds **en français**. Public : **collégiens de Guadeloupe, en arts plastiques**.

## Le projet

**Arts Plastiques** (nom affiché ; dépôt/URL restent `artexplorer`) : plateforme web
éducative et interactive (PC du CDI + smartphones). Deux axes : **explorer l'art** et
(plus tard) **comprendre l'IA**.

- **En ligne** : https://gbrrmd.github.io/artexplorer/ (GitHub Pages, redéployé à chaque `git push` sur `main`)
- **Dépôt** : https://github.com/GbrRmd/artexplorer

## Contraintes

- **Coût zéro** : GitHub Pages + Firebase Firestore (lecture seule, pas encore branché) + Cloudinary (images, pas encore branché).
- **Confidentialité totale** : aucune donnée perso, aucun compte, aucun tracker. Le site ne fait que *lire*.
- **UX** : interactivité et feedback avant tout, mobile-first, faible charge cognitive (zéro jargon, tout compréhensible par l'icône/le mouvement). Sons coupés par défaut.

## Stack & architecture

HTML5 + CSS3 natif (glassmorphism, thème clair/sombre) + **JS ES6 vanilla, zéro dépendance**.
Nécessite un serveur pour les modules ES6 : `npx serve .` puis http://localhost:3000.

**Architecture par modules** : coquille légère (`js/core/` : shell, registry, theme) +
modules pédagogiques autonomes (contrat `id/title/icon/mount/unmount`, enregistrés dans
`js/main.js`). Ajouter un bloc = 1 dossier + 1 ligne.

```
index.html            Coquille (SPA légère)
config.js             Config : source des données, dépôt (admin), Cloudinary TODO
css/                  tokens / base / components (design system)
js/core/              shell, registry, theme, utils, catalog(+schema)
js/modules/gallery/   Module Galerie (voir plus bas)
js/modules/ia/        Module "Comprendre l'IA" (placeholder)
assets/data/artworks.json   Catalogue (15 œuvres + anecdotes), édité via /admin/
admin/               Atelier du catalogue (édition + publication GitHub) + GUIDE.md
scripts/             validate-catalog.mjs (contrôle du JSON, aussi en CI)
assets/mascot/        savais-tu.png (bouton), samy.png (raton overlay)
```

## Module Galerie — ce qui existe (P0→P2 faits)

- Grille responsive + cartes **tilt 3D**, repli couleur+emoji si image absente.
- **Modale fiche** : image toujours ajustée (`contain`) + fond flouté + **mode focus** (clic image), mini-frise chronologique, **mascotte « Le savais-tu ? »** (raton sur l'image → overlay Samy donnant jusqu'à 3 **anecdotes**).
- **Recherche + filtres repliables** (`filters.js`) : facettes Thèmes / Techniques / **Artistes**, compteurs "disponibles" (valeurs sans combo possible **grisées**), barre fermée par défaut.
- **3 vues** (`js/modules/gallery/index.js`) : **Grille** · **Constellation** (bulles par thème) · **Frise** (`timeline.js`, chronologie verticale proportionnelle, an 0 → année courante).
- Périodes historiques : `periods.js` (Préhistoire → Contemporain, couleurs, échelle). La vue Frise affiche une **légende de toutes les périodes** (celles sans œuvre restent grisées).
- Données : `assets/data/artworks.json` (15 œuvres, dont **Lascaux** préhistorique + 2 **guadeloupéennes** : roches gravées de Trois-Rivières, Le Serment des ancêtres de Lethière). Chaque œuvre a un tableau `anecdotes` (court, langage ado).

## Données — P3 fait (JSON versionné + atelier)

Décision : **pas de Firebase**. Le catalogue vit en **JSON dans le dépôt**, servi en
statique par Pages. Motifs : coût zéro réel, « aucun tracker » (pas de connexion Google
depuis les tel des élèves), zéro dépendance, historique Git + retour arrière gratuits.
Firestore reste une option si un jour édition sans redéploiement multi-rédacteurs.

- **`js/core/catalog.js`** : source unique. Réseau d'abord + copie locale de secours
  (hors-ligne / CDI). `meta.themes` / `meta.techniques` (+ compteurs) **dérivés** des
  œuvres — rien à maintenir à la main. Changer de source = ce seul fichier.
- **`js/core/catalog-schema.js`** : contrat + validation, partagé app / admin / CI.
- **`admin/`** : atelier web (vanilla) pour non-technicien·ne. Boutons **Tirer** /
  **Publier** via l'API GitHub Contents ; auth = **fine-grained PAT** (repo `artexplorer`,
  permission *Contents: write*) collé une fois, stocké dans le navigateur. Voir `admin/GUIDE.md`.
- **`scripts/validate-catalog.mjs`** (`npm run validate`) + workflow
  `.github/workflows/validate-catalog.yml` : filet de sécurité au push.

Plan restant : **P4** pipeline Cloudinary images (upload non signé dans l'atelier) →
**P5** module IA → P6+.

## Conventions

- **Commits en français**, terminés par : `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Déploiement** = simple `git push origin main` (Pages rebuild ~1 min). Vérifier le build : `gh api repos/GbrRmd/artexplorer/pages/builds/latest`.
- Sous Windows + Git Bash : `gh` n'est pas dans le PATH par défaut (`export PATH="$PATH:/c/Program Files/GitHub CLI"`), et préfixer les `gh api /repos/...` par `export MSYS_NO_PATHCONV=1`.
- Images test via Wikimedia `Special:FilePath` ; le repli couleur+emoji couvre les 404.
