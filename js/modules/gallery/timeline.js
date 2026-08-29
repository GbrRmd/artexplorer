// =============================================================
//  Vue "Frise" — chronologie verticale qui défile de la Préhistoire
//  à aujourd'hui. Chaque période est une bande colorée ; les œuvres
//  y sont rangées par année. On peut cibler une œuvre (focus).
// =============================================================

import { el } from '../../core/utils.js';
import { mediaMarkup, wireImage } from './media.js';
import { PERIODS, getPeriod } from './periods.js';

export function createTimeline(artworks, { onOpenArt }) {
  const tlItem = (a) =>
    el(
      'button',
      {
        class: 'tl-item',
        type: 'button',
        dataset: { id: a.id },
        'aria-label': `${a.title}, ${a.artist}, ${a.year}`,
        onClick: () => onOpenArt(a),
      },
      [
        el('span', { class: 'tl-item__year', text: String(a.year) }),
        el('span', {
          class: 'tl-item__media',
          style: `--fallback:${a.dominantColor || '#333'}`,
          html: mediaMarkup(a, { size: 'card' }),
        }),
        el('span', { class: 'tl-item__info' }, [
          el('strong', { text: a.title }),
          el('span', { class: 'tl-item__artist', text: a.artist }),
        ]),
      ]
    );

  const sections = PERIODS.map((p) => {
    const items = artworks
      .filter((a) => getPeriod(a.year).id === p.id)
      .sort((a, b) => a.year - b.year);

    const body = items.length
      ? el('div', { class: 'tl-items' }, items.map(tlItem))
      : el('p', { class: 'tl-empty', text: 'Aucune œuvre de la collection ici… pour l’instant.' });

    return el('section', { class: 'tl-period', style: `--c:${p.color}`, dataset: { period: p.id } }, [
      el('div', { class: 'tl-period__head' }, [
        el('span', { class: 'tl-period__dot' }),
        el('div', {}, [
          el('h3', { class: 'tl-period__name', text: p.name }),
          el('span', { class: 'tl-period__dates', text: p.dates }),
        ]),
        el('span', { class: 'tl-period__count', text: items.length ? `${items.length}` : '' }),
      ]),
      body,
    ]);
  });

  const root = el('div', { class: 'timeline' }, [
    el('p', { class: 'view-hint', text: 'Remonte le temps, de l’Antiquité à aujourd’hui 🕰️' }),
    el('div', { class: 'tl-track' }, sections),
  ]);

  wireImage(root);

  function focus(id) {
    root.querySelectorAll('.tl-item.is-focus').forEach((n) => n.classList.remove('is-focus'));
    const target = root.querySelector(`.tl-item[data-id="${id}"]`);
    if (target) {
      target.classList.add('is-focus');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return { el: root, focus };
}
