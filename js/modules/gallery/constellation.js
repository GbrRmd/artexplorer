// =============================================================
//  Vue "Constellation" — exploration alternative par univers.
//  Les thèmes sont des bulles flottantes (taille = nb d'œuvres).
//  Taper une bulle plonge dans cet univers (filtre + retour grille).
//  Layout en flex-wrap : entièrement responsive, utilisable au doigt.
// =============================================================

import { el } from '../../core/utils.js';

const GRADS = [
  'var(--gradient-brand)',
  'var(--gradient-cool)',
  'var(--gradient-warm)',
  'linear-gradient(135deg, var(--brand-3), var(--brand-1))',
  'linear-gradient(135deg, var(--brand-4), var(--brand-2))',
  'linear-gradient(135deg, var(--brand-2), var(--brand-3))',
];

export function createConstellation(themes, onPick) {
  const max = Math.max(1, ...themes.map((t) => t.count));

  const bubbles = themes.map((t, i) => {
    // taille proportionnelle au nombre d'œuvres (88px -> 184px)
    const size = 88 + Math.round((t.count / max) * 96);
    return el(
      'button',
      {
        class: 'bubble',
        type: 'button',
        style: `--size:${size}px; --grad:${GRADS[i % GRADS.length]}; --d:${(i * 0.35).toFixed(2)}s`,
        'aria-label': `Explorer l'univers ${t.name}, ${t.count} œuvres`,
        onClick: () => onPick(t.name),
      },
      [
        el('span', { class: 'bubble__name', text: t.name }),
        el('span', { class: 'bubble__count', text: `${t.count} œuvres` }),
      ]
    );
  });

  const wrap = el('div', {}, [
    el('p', {
      class: 'constellation__hint',
      text: 'Choisis un univers pour plonger dedans ✨',
    }),
    el('div', { class: 'constellation' }, bubbles),
  ]);

  return { el: wrap };
}
