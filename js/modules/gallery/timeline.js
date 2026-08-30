// =============================================================
//  Vue "Frise" — chronologie verticale, du plus ancien (haut) à
//  aujourd'hui (bas). L'écart vertical entre deux œuvres est
//  PROPORTIONNEL à leur écart d'années (avec un minimum pour rester
//  lisible). Repère "an 0" en haut, saut d'échelle jusqu'aux œuvres,
//  zones colorées par période, "aujourd'hui" en bas. Animée au scroll.
// =============================================================

import { el } from '../../core/utils.js';
import { mediaMarkup, wireImage } from './media.js';
import { getPeriod, nowYear } from './periods.js';

const K = 1.4; // pixels par année (espacement entre œuvres)
const MIN_GAP = 92; // écart minimal lisible entre 2 œuvres
const AN0_Y = 44; // position du repère "an 0"
const BREAK = 66; // hauteur du saut d'échelle
const LEAD = 46; // marge avant la 1re œuvre
const PADB = 70; // marge après "aujourd'hui"

export function createTimeline(artworks, { onOpenArt }) {
  const NOW = nowYear();
  const sorted = [...artworks]
    .sort((a, b) => a.year - b.year)
    .map((a) => ({ a, period: getPeriod(a.year) }));

  // Positions verticales : écart ∝ écart d'années (plancher MIN_GAP)
  let y = AN0_Y + BREAK + LEAD;
  const placed = sorted.map((item, i) => {
    if (i > 0) {
      const dYear = item.a.year - sorted[i - 1].a.year;
      y += Math.max(MIN_GAP, dYear * K);
    }
    return { ...item, y };
  });
  const lastYear = sorted[sorted.length - 1].a.year;
  const yNow = placed[placed.length - 1].y + Math.max(MIN_GAP, (NOW - lastYear) * K);
  const total = yNow + PADB;

  const layers = [el('div', { class: 'fr__rail' })];

  // Repère "an 0" + saut d'échelle jusqu'aux œuvres
  layers.push(
    el('div', { class: 'fr__mark fr__mark--zero', style: `top:${AN0_Y}px` }, [
      el('span', { class: 'fr__mark-label', text: 'an 0 · début de notre ère' }),
    ])
  );
  layers.push(
    el('div', { class: 'fr__break', style: `top:${AN0_Y + 12}px; height:${BREAK}px` }, [
      el('span', { class: 'fr__break-label', text: `≈ ${placed[0].a.year} ans plus tard…` }),
    ])
  );

  // Zones colorées par période (segments du rail) + intitulés
  const groups = [];
  placed.forEach((p) => {
    const g = groups[groups.length - 1];
    if (g && g.period.id === p.period.id) g.items.push(p);
    else groups.push({ period: p.period, items: [p] });
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

  // Étiquettes d'écart (« N ans ») pour les grands sauts entre œuvres
  placed.forEach((p, i) => {
    if (i === 0) return;
    const prev = placed[i - 1];
    const dYear = p.a.year - prev.a.year;
    if (dYear >= 60) {
      layers.push(
        el('div', { class: 'fr__gap', style: `top:${(prev.y + p.y) / 2}px` }, [
          el('span', { class: 'fr__gap-label', text: `${dYear} ans` }),
        ])
      );
    }
  });

  // Œuvres
  placed.forEach(({ a, y, period }) => {
    layers.push(el('span', { class: 'fr__connector', style: `top:${y}px` }));
    layers.push(el('span', { class: 'fr__dot', style: `top:${y}px; --c:${period.color}` }));
    layers.push(
      el(
        'button',
        {
          class: 'fr__card',
          type: 'button',
          dataset: { id: a.id },
          style: `top:${y}px`,
          'aria-label': `${a.title}, ${a.artist}, ${a.year}`,
          onClick: () => onOpenArt(a),
        },
        [
          el('span', { class: 'fr__card-media', style: `--fallback:${a.dominantColor || '#333'}`, html: mediaMarkup(a, { size: 'card' }) }),
          el('span', { class: 'fr__card-info' }, [
            el('span', { class: 'fr__card-year', text: String(a.year) }),
            el('strong', { class: 'fr__card-title', text: a.title }),
            el('span', { class: 'fr__card-artist', text: a.artist }),
          ]),
        ]
      )
    );
  });

  // Repère "aujourd'hui"
  layers.push(
    el('div', { class: 'fr__mark fr__mark--now', style: `top:${yNow}px` }, [
      el('span', { class: 'fr__mark-label', text: `aujourd’hui · ${NOW}` }),
    ])
  );

  const frise = el('div', { class: 'frise', style: `height:${total}px` }, layers);

  const root = el('div', { class: 'timeline' }, [
    el('p', { class: 'view-hint', text: 'Remonte le temps 🕰️ — plus l’écart est grand, plus les œuvres sont éloignées.' }),
    frise,
  ]);

  wireImage(root);

  // Entrée animée des cartes au scroll
  const cards = [...root.querySelectorAll('.fr__card')];
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
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
