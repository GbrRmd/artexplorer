# Arts Plastiques — Synthèse de reprise

> Document de passation complet. Pour une reprise par un humain **ou une autre IA**.
> Version courte auto-chargée par l'assistant : [`CLAUDE.md`](CLAUDE.md).
> Dernière mise à jour : 2026-09-16.

---

## 1. En un coup d'œil

- **Quoi** : « Arts Plastiques » (nom affiché ; dépôt/URL = `artexplorer`), plateforme web
  **éducative et interactive** pour explorer des œuvres d'art. Public : **collégiens de
  Guadeloupe (6e-3e), en arts plastiques**. Usage : PC du CDI + smartphones.
- **En ligne** : <https://gbrrmd.github.io/artexplorer/> — atelier d'édition :
  <https://gbrrmd.github.io/artexplorer/admin/>
- **Dépôt** : <https://github.com/GbrRmd/artexplorer> (branche `main`).
- **Stack** : HTML5 + CSS3 natif (glassmorphism, thème clair/sombre) + **JS ES6 vanilla,
  zéro dépendance, zéro build**. Hébergé sur **GitHub Pages** (déploiement = `git push`).
- **Statut** : P0→P3 faits (galerie complète + données en JSON versionné + atelier
  d'édition). Reste P4 (images Cloudinary) puis P5 (module « Comprendre l'IA »).
- **Langue de travail** : **français** (réponses, commentaires de code, commits, docs).

---

## 2. Lancer & vérifier en local

Aucune install (site statique). Un serveur est requis pour les **modules ES6** (pas d'ouverture en `file://`).

```bash
npm run dev        # = npx serve . -l 3000   →  http://localhost:3000
npm run validate   # = node scripts/validate-catalog.mjs (vérifie le catalogue)
```

- Dans l'app Claude Code : `.claude/launch.json` définit le serveur **`artexplorer`** (port 4321) pour la preview intégrée.
- **Toujours vérifier une modif observable dans le navigateur** avant de conclure (console sans erreur, rendu OK).

---

## 3. Architecture & inventaire des fichiers

Coquille légère (`shell`) + **modules pédagogiques autonomes** enregistrés dans `js/main.js`.
Contrat d'un module : `{ id, title, icon, mount(container), unmount() }`. Ajouter un bloc = 1 dossier + 1 ligne.

```
index.html                     Coquille (SPA légère) : header (marque, nav modules, thème), #module-root
config.js                      Config : source des données + infos dépôt (pour /admin) + Cloudinary (TODO)
package.json                   scripts dev / validate (aucune dépendance runtime)
.github/workflows/
  validate-catalog.yml         CI : valide le catalogue à chaque push
scripts/validate-catalog.mjs   Validation Node du JSON (utilise le schéma partagé)

css/
  tokens.css                   Design system : variables (couleurs, glassmorphism, thème clair/sombre)
  base.css                     Reset, layout du shell, fond ambiant animé  ([hidden]{display:none!important})
  components.css               Composants partagés (boutons, pilules, en-têtes de module…)

js/
  main.js                      Bootstrap : thème + enregistre les modules (gallery, ia) + démarre le shell
  core/
    shell.js                   Navigation entre modules, routing par #hash, montage/démontage
    registry.js                Registre des modules
    theme.js                   Thème clair/sombre (persisté en localStorage)
    utils.js                   Helpers (el, $, debounce, throttle, haptic, fetchJSON, loadModuleCSS…)
    catalog.js                 SOURCE UNIQUE des données : réseau d'abord + secours localStorage ;
                               meta.themes / meta.techniques (+ compteurs) DÉRIVÉS des œuvres
    catalog-schema.js          Contrat + validation + normalisation, PARTAGÉ app / admin / CI
  modules/
    ia/index.js                Module « Comprendre l'IA » — placeholder (à faire en P5)
    gallery/
      index.js                 Orchestration galerie : 3 vues (Grille/Constellation/Frise), rendu grille,
                               calcul de meta, ouverture des fiches
      filters.js               Recherche + facettes (Thèmes/Techniques/Artistes), masquage des combos impossibles
      constellation.js         Vue « Constellation » : bulles par thème (taille = nb d'œuvres)
      timeline.js              Vue « Frise » : chronologie verticale proportionnelle (an 0 → aujourd'hui) + légende
      periods.js               Périodes historiques (Préhistoire→Contemporain), couleurs, échelle, bornes frise
      media.js                 Markup image + repli (couleur dominante + emoji) + chargement (is-loaded/erreur)
      card-tilt.js             Effet 3D tilt des cartes (souris + tactile)
      modal.js                 Fiche détaillée : image (contain) + fond flouté + mode focus + mini-frise + tags
      savais-tu.js             Mascotte « Le savais-tu ? » : sticker raton sur l'image → overlay anecdotes
      gallery.css              Styles du module galerie (cartes, modale, frise, constellation, filtres, mascotte)

assets/
  data/artworks.json           LE CATALOGUE (éditer via /admin/, pas à la main de préférence)
  mascot/savais-tu.png         Icône « Le savais-tu ? » (bouton sur l'image)
  mascot/samy.png              Raton « Samy » (dans l'overlay d'anecdotes)

admin/                         Atelier d'édition du catalogue (voir §6)
  index.html  admin.js  admin.css  GUIDE.md

CLAUDE.md                      Contexte court auto-chargé par l'assistant
SYNTHESE.md                    Ce document
README.md                      Présentation publique
```

---

## 4. Modèle de données (catalogue)

`assets/data/artworks.json` : `{ meta, artworks[] }`. `meta` est **cosmétique** (version, date,
note) — les listes **thèmes/techniques et leurs compteurs sont recalculées** au chargement par
`catalog.js` (`deriveMeta`). Il n'y a **rien à maintenir à la main** dans `meta`.

### Contrat d'une œuvre (`catalog-schema.js`)
Ordre des clés = `ARTWORK_KEY_ORDER`. Validé par `validateArtwork` (app + admin + CI).

| Champ | Type / règle |
|---|---|
| `id` | slug unique `[a-z0-9-]+` (auto depuis le titre dans l'atelier) |
| `title` | requis |
| `artist` | requis |
| `year` | entier, **négatif = av. J.-C.** ; borne `-40000` → année courante |
| `technique` | requis (ex. Huile, Estampe, Sculpture, Fresque, Lithographie, Tempera, Feuille d'or, Peinture rupestre, Gravure sur roche) |
| `themes` | tableau, **≥ 1** |
| `dominantColor` | `#rrggbb` (repli si l'image ne charge pas) |
| `imageUrl` | `https://…` requis |
| `description` | requis (une phrase, langage ado) |
| `anecdotes` | tableau de **0 à 3** objets `{ text, source }` |

### Anecdotes = `{ text, source }`
Chaque anecdote **cite sa source** (musée, site, ouvrage). Le rendu (`savais-tu.js`) et le schéma
acceptent **aussi les anciennes chaînes** (rétro-compat, source vide). `normalizeAnecdote()` migre
chaîne → `{ text, source }`.

### Contenu actuel
**~30 œuvres** de la Préhistoire à 1908. Deux axes assumés :
- **Cursus collège** : Lascaux, Néfertiti, Vénus de Milo, Michel-Ange, Bruegel, Arcimboldo,
  Rembrandt, Vermeer, Hokusai, Turner, Manet, Monet, Renoir, Seurat, Cézanne, Toulouse-Lautrec,
  Rodin, Rousseau, Munch, Klimt, Van Gogh…
- **Caraïbes / DROM** : Lethière (né en Guadeloupe), roches gravées de Trois-Rivières,
  Pissarro (né à Saint-Thomas), Brunias (marché en Dominique).

Images = **Wikimedia `Special:FilePath`** (domaine public) ; le **repli couleur + emoji** couvre
les 404. Pipeline **Cloudinary prévu en P4**.

> ⚠️ **À nettoyer** : une œuvre de test « **Test** » (`id: lascaux-taureaux-copie`, image cassée)
> traîne dans le catalogue (créée en testant « Dupliquer » dans l'atelier). À supprimer via
> `/admin/` (Supprimer → Publier) ou en retirant l'entrée du JSON.

---

## 5. Module Galerie (fonctionnel, P0→P2)

- **Grille** responsive, cartes **tilt 3D**, repli couleur+emoji si image absente.
- **Fiche (modale)** : image toujours **ajustée** (`object-fit: contain`) + **fond flouté** de
  l'œuvre + **mode focus** (clic sur l'image = plein cadre) ; **mini-frise chronologique**
  recentrée (œuvre après l'an 0 → axe 0→année courante ; avant → axe œuvre→aujourd'hui) ;
  **mascotte « Le savais-tu ? »** (raton sur l'image → overlay « Samy » qui déroule jusqu'à 3
  anecdotes avec **source affichée**, mascotte qui « respire »).
- **Recherche + filtres** (`filters.js`), **barre repliable** (fermée par défaut) :
  - recherche **sans accents**, multi-mots, sur titre/artiste/technique/thèmes/description ;
  - facettes **Thèmes / Techniques / Artistes** ; **les valeurs sans combinaison possible sont
    masquées** (on ne voit que les « couples » réalisables) ; une facette entièrement vide
    disparaît. Badge = nombre de filtres actifs.
- **3 vues d'exploration** (bouton central) :
  - **Grille** · **Constellation** (bulles par thème, taille = nb d'œuvres) ·
    **Frise** (chronologie verticale proportionnelle au temps, repères « an 0 » et
    « aujourd'hui », étiquettes « N ans » sur les grands sauts, **légende de toutes les périodes**).

---

## 6. L'atelier `/admin/` (édition du catalogue sans coder)

Page statique (`admin/`) qui **lit et publie `artworks.json` via l'API GitHub Contents**. Pensée
pour un·e non-technicien·ne. Détails complets : [`admin/GUIDE.md`](admin/GUIDE.md).

- **Auth** = **fine-grained PAT** GitHub, dépôt `artexplorer`, permission **Contents: Read and
  write**. Collé une fois, **stocké uniquement dans le navigateur** (localStorage). Le **même
  jeton** marche sur tous les appareils/navigateurs (à recoller une fois par navigateur). En
  refaire un seulement s'il expire (90 j) ou pour révoquer un appareil.
- **Boutons** : **↓ Tirer** (recharge depuis GitHub — à faire en arrivant), **+ Ajouter /
  Modifier / Dupliquer / Supprimer**, **Enregistrer dans la liste** (local), **↑ Publier**
  (commit + push via l'API → Pages redéploie en ~1 min).
- Validation en direct (bloque la publication tant qu'une œuvre est invalide).
- L'atelier réécrit `meta` avec `version: 3` et sa propre note : **normal**, `meta` est dérivée à
  la lecture.

---

## 7. Workflows opérationnels

### Git (multi-rédacteurs : code + atelier + tél)
L'atelier et les sessions distantes **commitent directement sur GitHub**. Donc, **avant de
travailler en local** :
```bash
git pull origin main
```
- Commite/`stash` d'éventuelles modifs locales avant de tirer.
- Le seul fichier « à risque » de conflit est `assets/data/artworks.json` → **ne pas l'éditer à
  la main** ; passer par `/admin/`. Côté code, toujours **tirer avant** de toucher au catalogue.

### Déploiement
`git push origin main` → GitHub Pages rebuild (~1 min). Vérifier :
```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"; export MSYS_NO_PATHCONV=1
gh api repos/GbrRmd/artexplorer/pages/builds/latest --jq '{status,error:.error.message}'
```

### Pilotage à distance (téléphone → ce PC)
- **`claude rc`** (= `claude remote-control`) lancé dans le dossier du projet : enregistre **ce
  PC** comme appareil, pilotable depuis l'**app mobile Claude** (« Code » → Appareils). Un seul
  PC suffit. (⚠️ ce n'est **pas** `--cloud`, qui crée une session *cloud* séparée sans
  l'historique local.)
- Binaire `claude` **pas dans le PATH** : `C:\Users\ramon\AppData\Roaming\Claude\claude-code\<version>\claude.exe`
  (version datée, change aux mises à jour). Windows Terminal dispo (`wt.exe`).

### Conventions
- **Commits en français**, terminés par : `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Sous **Windows + Git Bash** : `gh` hors PATH (l'ajouter), et **préfixer les `gh api /repos/...`
  par `export MSYS_NO_PATHCONV=1`** (sinon les chemins `/…` sont mangés en chemins Windows).

---

## 8. Décisions clés (et pourquoi)

- **Pas de Firebase.** Catalogue en **JSON versionné** servi en statique. Motifs : coût zéro réel,
  « aucun tracker » (pas de connexion Google depuis les tél des élèves), zéro dépendance,
  historique Git + retour arrière gratuits. Firestore reste une option si un jour besoin d'édition
  multi-rédacteurs sans redéploiement.
- **Images Wikimedia (domaine public) + repli couleur/emoji.** Google Drive écarté (hotlinking
  instable). **Cloudinary** viendra en P4 (CDN + WebP).
- **Pas de compte / pas de session élève** : le site ne fait que **lire**. RGPD trivial.
- **Graphe « Nœuds » orbital** de l'idée initiale **abandonné** (mauvais sur mobile) au profit de
  la **Constellation** + **Frise**.

---

## 9. Pièges connus / quirks

- **Attribut `[hidden]`** : un `display:` de classe l'écrase → toujours poser
  `[hidden]{display:none!important}` (déjà dans `css/base.css` et `admin/admin.css`). C'était la
  cause d'un overlay d'éditeur qui bloquait toute la page dans l'atelier.
- **Moteur de la preview intégrée** : `max-height` en `vh`/`%` peut être **calculé à `0px`**
  (panneau qui s'effondre), alors qu'un **vrai navigateur** est OK. Contourné dans l'atelier par
  un patron « overlay qui défile » (pas de cap en `vh`). Idem, `requestAnimationFrame` peut être
  throttlé en preview : préférer un **reflow forcé** (`void el.offsetWidth`) pour déclencher une
  transition d'ouverture.
- **Screenshots de preview** : peuvent expirer si des **images externes** (Wikimedia) chargent →
  se fier à l'inspection DOM (`javascript_tool`) plutôt qu'au screenshot.
- **CRLF** : dépôt normalisé en LF via `.gitattributes`.

---

## 10. État courant & TODO immédiats

- ✅ Galerie complète, atelier fonctionnel, ~30 œuvres sourcées, filtres « couples possibles »,
  3 vues, mascotte + anecdotes `{text,source}`.
- ⏳ **Supprimer l'œuvre de test « Test »** (`lascaux-taureaux-copie`).
- ⏳ (Optionnel) Uniformiser `meta.version` (l'atelier remet 3 ; sans impact).

## 11. Feuille de route

- **P4 — Images Cloudinary** : upload non signé depuis l'atelier + transformations `f_auto,q_auto`
  (voir `config.js` → `cloudinary`). Objectif : fiabilité + WebP, indépendance vis-à-vis de Wikimedia.
- **P5 — Module « Comprendre l'IA »** (`js/modules/ia/`) : labo de tokenisation, frise de l'IA,
  panorama des acteurs, calculateur d'impact, quiz esprit critique (cf. brief initial).
- **P6+** : autres blocs pédagogiques (le système de modules est fait pour ça).
- Idées : mode hors-ligne renforcé (service worker), export/impression d'une fiche, plus d'œuvres
  antillaises/DROM au fur et à mesure que des images libres sont trouvées.

---

## 12. Pour une autre IA qui reprend

1. **Lire [`CLAUDE.md`](CLAUDE.md)** (contexte court) puis ce document.
2. **Répondre et coder en français.** Public = collégiens : viser clarté, feedback, mobile-first,
   zéro jargon.
3. **`git pull` avant tout**, ne pas éditer `artworks.json` à la main (passer par `/admin/`).
4. **Valider** après toute modif de données : `npm run validate`.
5. **Vérifier dans le navigateur** (console + rendu) avant de conclure ; sur ce site, les modules
   ES6 exigent un serveur (`npm run dev`).
6. **Commits en français** avec la ligne `Co-Authored-By` ; **déploiement = push** ; vérifier le
   build Pages.
7. Respecter le **zéro-dépendance / zéro-build** (JS vanilla) et le **coût zéro** (statique).
