// =============================================================
//  Accès au catalogue d'œuvres — SOURCE UNIQUE pour toute l'app.
//  - Réseau d'abord (revalidation à chaque session), copie locale
//    en secours : hors-ligne, wifi du CDI filtré ou lent.
//  - meta.themes / meta.techniques (+ compteurs) sont DÉRIVÉS des
//    œuvres : rien à maintenir à la main dans le JSON.
//  Changer de source (Firestore, API…) = ne toucher qu'à ce fichier.
// =============================================================

import { CONFIG } from '../../config.js';

const LS_KEY = 'artexplorer.catalog.v1';
let inflight = null; // mémoïse le chargement pour la durée de la session

function readCache() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(doc) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(doc));
  } catch {
    /* quota plein / navigation privée : le cache est optionnel */
  }
}

/** Recalcule meta (listes + compteurs) à partir des œuvres. */
export function deriveMeta(artworks, base = {}) {
  const themes = new Map();
  const techniques = new Map();
  for (const a of artworks) {
    for (const t of a.themes || []) themes.set(t, (themes.get(t) || 0) + 1);
    if (a.technique) techniques.set(a.technique, (techniques.get(a.technique) || 0) + 1);
  }
  const toList = (m) =>
    [...m.entries()]
      .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], 'fr'))
      .map(([name, count]) => ({ name, count }));
  return { ...base, count: artworks.length, themes: toList(themes), techniques: toList(techniques) };
}

function shape(doc) {
  const artworks = Array.isArray(doc?.artworks) ? doc.artworks : [];
  return { meta: deriveMeta(artworks, doc?.meta || {}), artworks };
}

async function load() {
  const url = CONFIG.data.catalog;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = await res.json();
    writeCache(doc);
    return shape(doc);
  } catch (err) {
    const cached = readCache();
    if (cached) {
      console.warn('[catalog] réseau indisponible — lecture de la copie locale.', err);
      return shape(cached);
    }
    throw err;
  }
}

/** Catalogue { meta, artworks }. Chargé une seule fois par session. */
export function getCatalog() {
  if (!inflight) inflight = load();
  return inflight;
}

/** Oublie le résultat mémoïsé : le prochain getCatalog() rechargera. */
export function invalidateCatalog() {
  inflight = null;
}
