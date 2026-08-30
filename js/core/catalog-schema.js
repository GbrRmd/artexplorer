// =============================================================
//  Contrat de données du catalogue + validation partagée.
//  Utilisé par la page d'administration (blocage avant publication)
//  ET par scripts/validate-catalog.mjs (Node, filet de sécurité au push).
//  Module pur : aucune dépendance, aucun accès au DOM.
// =============================================================

export const NOW_YEAR = new Date().getFullYear();
export const YEAR_MIN = -40000;
export const MAX_ANECDOTES = 3;

/** Ordre canonique des clés d'une œuvre dans le JSON publié (diff Git lisible). */
export const ARTWORK_KEY_ORDER = [
  'id',
  'title',
  'artist',
  'year',
  'technique',
  'themes',
  'dominantColor',
  'imageUrl',
  'description',
  'anecdotes',
];

/** Titre -> identifiant : minuscules, sans accents, tirets. */
export function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques (é -> e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Œuvre vierge (valeurs de départ du formulaire). */
export function blankArtwork() {
  return {
    id: '',
    title: '',
    artist: '',
    year: NOW_YEAR,
    technique: '',
    themes: [],
    dominantColor: '#5a4a2f',
    imageUrl: '',
    description: '',
    anecdotes: [],
  };
}

const isStr = (v) => typeof v === 'string';
const filled = (v) => isStr(v) && v.trim().length > 0;

/**
 * Valide une œuvre. Renvoie un tableau de messages en français
 * (tableau vide = valide).
 */
export function validateArtwork(a, { allIds = [] } = {}) {
  const e = [];
  if (!a || typeof a !== 'object') return ['Entrée illisible.'];

  if (!filled(a.id)) e.push('Identifiant manquant.');
  else if (!/^[a-z0-9-]+$/.test(a.id))
    e.push('Identifiant : minuscules, chiffres et tirets uniquement.');
  else if (allIds.filter((id) => id === a.id).length > 1)
    e.push(`Identifiant en double : « ${a.id} ».`);

  if (!filled(a.title)) e.push('Titre manquant.');
  if (!filled(a.artist)) e.push('Artiste manquant.');
  if (!filled(a.technique)) e.push('Technique manquante.');

  if (!Number.isInteger(a.year))
    e.push('Année : nombre entier attendu (négatif = avant J.-C.).');
  else if (a.year < YEAR_MIN || a.year > NOW_YEAR)
    e.push(`Année hors bornes (${YEAR_MIN} à ${NOW_YEAR}).`);

  if (!Array.isArray(a.themes) || a.themes.length === 0)
    e.push('Au moins un thème est requis.');
  else if (!a.themes.every(filled)) e.push('Thèmes : une valeur est vide.');

  if (!isStr(a.dominantColor) || !/^#[0-9a-fA-F]{6}$/.test(a.dominantColor))
    e.push('Couleur de repli : format #rrggbb attendu.');

  if (!filled(a.imageUrl)) e.push("URL de l'image manquante.");
  else if (!/^https:\/\/\S+$/.test(a.imageUrl))
    e.push("URL de l'image : doit commencer par https://");

  if (!filled(a.description)) e.push('Description manquante.');

  if (!Array.isArray(a.anecdotes)) e.push('Anecdotes : liste attendue.');
  else {
    if (a.anecdotes.length > MAX_ANECDOTES)
      e.push(`Maximum ${MAX_ANECDOTES} anecdotes.`);
    if (!a.anecdotes.every(filled)) e.push('Anecdotes : retirer les lignes vides.');
  }
  return e;
}

/** Valide le document complet { artworks: [...] }. */
export function validateCatalog(doc) {
  if (!doc || typeof doc !== 'object')
    return { ok: false, errors: ['Document JSON illisible.'] };
  if (!Array.isArray(doc.artworks))
    return { ok: false, errors: ['Clé « artworks » absente ou ce n’est pas une liste.'] };

  const ids = doc.artworks.map((a) => (a && a.id) || '');
  const errors = [];
  doc.artworks.forEach((a, i) => {
    const label = (a && (a.title || a.id)) || `œuvre #${i + 1}`;
    validateArtwork(a, { allIds: ids }).forEach((msg) =>
      errors.push(`« ${label} » : ${msg}`)
    );
  });
  return { ok: errors.length === 0, errors };
}

/** Réordonne les clés + nettoie (trim, retrait des vides). */
export function normalizeArtwork(a) {
  const out = {};
  for (const k of ARTWORK_KEY_ORDER) {
    if (k === 'themes' || k === 'anecdotes')
      out[k] = (Array.isArray(a[k]) ? a[k] : [])
        .map((s) => (isStr(s) ? s.trim() : s))
        .filter(Boolean);
    else if (k === 'year') out[k] = Number(a.year);
    else out[k] = isStr(a[k]) ? a[k].trim() : a[k];
  }
  return out;
}
