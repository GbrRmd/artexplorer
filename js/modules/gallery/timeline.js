// =============================================================
//  Vue "Frise" — chronologie verticale, du plus ancien (haut) à
//  aujourd'hui (bas). Modèle par "événements" : chaque œuvre, plus
//  l'an 0 et aujourd'hui, sont placés à la suite ; l'écart vertical
//  est proportionnel à l'écart d'années (borné pour rester lisible).
//  Zones colorées par période, étiquettes "N ans" sur les grands
//  sauts. Animée à l'entrée (scroll).
// =============================================================

import { el } from '../../core/utils.js';
import { mediaMarkup, wireImage } from './media.js';
import { PERIODS, getPeriod, nowYear, formatYear } from './periods.js';

const K = 0.9; // pixels par année
const MIN_GAP = 88; // écart minimal lisible
const MAX_GAP = 300; // écart maximal (borne les grands sauts)
const TOP = 44;
const PADB = 60;

export function createTimeline(artworks, { onOpenArt }) {
  const NOW = nowYear();

  // Événements = œuvres + repères an 0 et aujourd'hui, triés par année
  const events = [
    ...artworks.map((a) => ({ kind: 'art', year: a.year, art: a, period: getPeriod(a.year) })),
    { kind: 'zero', year: 0 },
    { kind: 'now', year: NOW },
  ].sort((a, b) => a.year - b.year || (a.kind === 'zero' ? -1 : 1));

  // Positions : écart ∝ écart d'années, borné [MIN_GAP, MAX_GAP]
  let y = TOP;
  events.forEach((e, i) => {
    if (i > 0) {
      const dYear = e.year - events[i - 1].year;
      y += Math.min(MAX_GAP, Math.max(MIN_GAP, dYear * K));
    }
    e.y = y;
  });
  const total = y + PADB;

  const layers = [el('div', { class: 'fr__rail' })];

  // Zones + intitulés de période (groupes d'œuvres consécutives)
  const arts = events.filter((e) => e.kind === 'art');
  const groups = [];
  arts.forEach((e) => {
    const g = groups[groups.length - 1];
    if (g && g.period.id === e.period.id) g.items.push(e);
    else groups.push({ period: e.period, items: [e] });
  });
  groups.forEach((g) => {
    const first = g.items[0].y;
    const last = g.items[g.items.length - 1].y;
    layers.push(
      el('div', {
        class: 'fr__zone',
        style: `top:${first - 34}px; height:${last - first + 68}px; --c:${g.period.color}`,
      })
    );
    layers.push(
      el('div', { class: 'fr__chip', style: `top:${first - 34}px; --c:${g.period.color}` }, [
        el('strong', { text: g.period.name }),
        el('span', { class: 'fr__chip-dates', text: g.period.dates }),
      ])
    );
  });

  // Étiquettes "N ans" sur les grands écarts
  events.forEach((e, i) => {
    if (i === 0) return;
    const dYear = e.year - events[i - 1].year;
    if (dYear >= 60) {
      layers.push(
        el('div', { class: 'fr__gap', style: `top:${(events[i - 1].y + e.y) / 2}px` }, [
          el('span', { class: 'fr__gap-label', text: `${dYear.toLocaleString('fr-FR')} ans` }),
        ])
      );
    }
  });

  // Repères an 0 / aujourd'hui + cartes d'œuvres
  events.forEach((e) => {
    if (e.kind === 'zero') {
      layers.push(
        el('div', { class: 'fr__mark fr__mark--zero', style: `top:${e.y}px` }, [
          el('span', { class: 'fr__mark-label', text: 'an 0 · début de notre ère' }),
        ])
      );
      return;
    }
    if (e.kind === 'now') {
      layers.push(
        el('div', { class: 'fr__mark fr__mark--now', style: `top:${e.y}px` }, [
          el('span', { class: 'fr__mark-label', text: `aujourd’hui · ${NOW}` }),
        ])
      );
      return;
    }
    const a = e.art;
    layers.push(el('span', { class: 'fr__connector', style: `top:${e.y}px` }));
    layers.push(el('span', { class: 'fr__dot', style: `top:${e.y}px; --c:${e.period.color}` }));
    layers.push(
      el(
        'button',
        {
          class: 'fr__card',
          type: 'button',
          dataset: { id: a.id },
          style: `top:${e.y}px`,
          'aria-label': `${a.title}, ${a.artist}, ${formatYear(a.year)}`,
          onClick: () => onOpenArt(a),
        },
        [
          el('span', { class: 'fr__card-media', style: `--fallback:${a.dominantColor || '#333'}`, html: mediaMarkup(a, { size: 'card' }) }),
          el('span', { class: 'fr__card-info' }, [
            el('span', { class: 'fr__card-year', text: formatYear(a.year) }),
            el('strong', { class: 'fr__card-title', text: a.title }),
            el('span', { class: 'fr__card-artist', text: a.artist }),
          ]),
        ]
      )
    );
  });

  const frise = el('div', { class: 'frise', style: `height:${total}px` }, layers);

  // Légende : toutes les grandes périodes de l'art, pour situer les œuvres.
  // Celles représentées dans le catalogue sont mises en avant ; les autres
  // restent visibles (grisées) pour montrer qu'elles existent.
  const presentIds = new Set(arts.map((e) => e.period.id));
  const legend = el('div', { class: 'fr__legend' }, [
    el('span', { class: 'fr__legend-title', text: 'Les grandes périodes' }),
    el(
      'ul',
      { class: 'fr__legend-list' },
      PERIODS.map((p) =>
        el(
          'li',
          {
            class: 'fr__legend-item' + (presentIds.has(p.id) ? ' is-present' : ''),
            style: `--c:${p.color}`,
          },
          [
            el('span', { class: 'fr__legend-dot' }),
            el('span', { class: 'fr__legend-name', text: p.name }),
            el('span', { class: 'fr__legend-dates', text: p.dates }),
          ]
        )
      )
    ),
  ]);

  const root = el('div', { class: 'timeline' }, [
    el('p', { class: 'view-hint', text: 'Remonte le temps 🕰️ — plus l’écart est grand, plus les œuvres sont éloignées.' }),
    legend,
    frise,
  ]);

  wireImage(root);

  const cards = [...root.querySelectorAll('.fr__card')];
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px' }
    );
    cards.forEach((c) => io.observe(c));
  } else {
    cards.forEach((c) => c.classList.add('is-in'));
  }

  function focus(id) {
    root.querySelectorAll('.fr__card.is-focus').forEach((n) => n.classList.remove('is-focus'));
    const t = root.querySelector(`.fr__card[data-id="${id}"]`);
    if (t) {
      t.classList.add('is-in', 'is-focus');
      t.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return { el: root, focus };
}
