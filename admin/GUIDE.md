# Atelier du catalogue — mode d'emploi

Cette page sert à **ajouter, modifier ou retirer des œuvres** du site
« Arts Plastiques », sans toucher au code. Adresse :

- en ligne : `https://gbrrmd.github.io/artexplorer/admin/`
- en local : `http://localhost:3000/admin/` (après `npm run dev`)

Le site public se met à jour tout seul **une minute environ** après chaque
publication.

---

## 1. Créer son jeton d'accès (une seule fois)

Le jeton autorise l'atelier à enregistrer les modifications sur GitHub. Il
reste **uniquement dans ton navigateur**, sur ton ordinateur.

1. Va sur <https://github.com/settings/personal-access-tokens/new>
   (connecte-toi au compte qui a accès au dépôt `artexplorer`).
2. Renseigne :
   - **Token name** : `atelier arts plastiques`
   - **Expiration** : 90 jours (à refaire quand il expire)
   - **Repository access** → *Only select repositories* → coche **`artexplorer`**
     (et un autre dépôt si besoin)
   - **Permissions** → *Repository permissions* → **Contents** → **Read and write**
3. Clique **Generate token** et **copie** la valeur affichée (commence par
   `github_pat_…`). Elle ne sera plus jamais réaffichée.

## 2. Enregistrer le jeton dans l'atelier

1. Ouvre la page de l'atelier.
2. En haut, clique sur **« Jeton non renseigné »** pour déplier la zone.
3. Colle le jeton, clique **Enregistrer**.

Le catalogue se charge automatiquement.

## 3. Modifier le catalogue

- **↓ Tirer** : recharge la dernière version depuis GitHub. À faire en
  arrivant, surtout si quelqu'un d'autre édite aussi.
- **+ Ajouter une œuvre** / **Modifier** / **Dupliquer** / **Supprimer**.
- Dans le formulaire, les erreurs éventuelles s'affichent en bas en direct
  (titre manquant, année hors bornes, etc.). **Enregistrer dans la liste**
  garde la modif *en local* (pas encore publiée).
- **↑ Publier** : envoie tout sur GitHub. Le bouton reste gris tant qu'il
  n'y a rien à publier ou qu'une œuvre a une erreur.

Le bandeau **« Modifications non publiées »** rappelle qu'il reste des
changements à envoyer.

## 4. Champs d'une œuvre

| Champ | Remarque |
|---|---|
| Titre | tel qu'affiché |
| Identifiant | se remplit tout seul ; à ne changer qu'en cas de doublon |
| Artiste | |
| Année | nombre entier, **négatif = avant J.-C.** (Lascaux = −17000) |
| Technique | ex. Huile, Estampe… (les valeurs déjà utilisées sont suggérées) |
| Thèmes | au moins un ; coche ceux qui existent ou ajoute-en un |
| URL de l'image | lien direct `https://` (Wikimedia par ex.) ; un aperçu s'affiche |
| Couleur de repli | couleur montrée si l'image ne charge pas |
| Description | une phrase, langage ado |
| Anecdotes | 0 à 3, courtes |

## En cas de souci

- **« Jeton refusé (401) »** : le jeton est expiré → en refaire un (étape 1)
  et le ré-enregistrer.
- **« Accès refusé (403) »** : le jeton n'a pas la permission *Contents:
  écriture*, ou trop d'essais d'affilée (réessaie dans quelques minutes).
- **« Conflit »** : quelqu'un a publié entre-temps. Clique **↓ Tirer**
  (les modifs en cours seront perdues) puis recommence.
- Une publication ratée ne casse rien : le site continue d'afficher la
  version précédente.
