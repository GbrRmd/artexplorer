// =============================================================
//  Petits éléments d'interface partagés par les étapes IA.
// =============================================================

import { el } from '../../../core/utils.js';

/** Samy le raton (la mascotte de la galerie) qui explique en une bulle. */
export function samy(text, { mood = '' } = {}) {
  return el('div', { class: `ia-samy ${mood ? `ia-samy--${mood}` : ''}` }, [
    el('img', { class: 'ia-samy__img', src: 'assets/mascot/samy.png', alt: '', 'aria-hidden': 'true' }),
    el('p', { class: 'ia-samy__bubble', html: text }),
  ]);
}

/** Carte « à retenir » : l'idée clé de l'étape, en une phrase. */
export function keyIdea(text) {
  return el('aside', { class: 'ia-key' }, [
    el('span', { class: 'ia-key__label', text: '💡 À retenir' }),
    el('p', { html: text }),
  ]);
}

/** Panneau de jeu (surface verre). */
export function panel(children, cls = '') {
  return el('div', { class: `glass ia-panel ${cls}` }, children);
}

/** Mélange une copie d'un tableau. */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
