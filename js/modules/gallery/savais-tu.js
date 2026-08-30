// =============================================================
//  "Le savais-tu ?" — sticker raton animé sur la fiche.
//  Au clic : un overlay avec Samy le raton donne jusqu'à 3
//  anecdotes (courtes, pour collégiens) sur l'œuvre / l'artiste.
//  (À terme, les anecdotes viendront de Firebase.)
// =============================================================

import { el, haptic } from '../../core/utils.js';

/**
 * Sticker raton "Le savais-tu ?" à poser SUR l'image de la fiche
 * (bien visible, halo pulsé qui invite au clic).
 * Renvoie null si l'œuvre n'a pas d'anecdote.
 */
export function buildSavaisTu(art) {
  const anecdotes = art.anecdotes || [];
  if (!anecdotes.length) return null;

  return el(
    'button',
    {
      class: 'savaistu',
      type: 'button',
      'aria-label': 'Le savais-tu ? Découvrir des anecdotes sur cette œuvre',
      onClick: (e) => {
        e.stopPropagation(); // ne pas déclencher le mode focus de l'image
        openAnecdotes(art);
      },
    },
    [
      el('span', { class: 'savaistu__halo' }),
      el('img', { class: 'savaistu__img', src: 'assets/mascot/savais-tu.png', alt: 'Le savais-tu ?' }),
    ]
  );
}

function openAnecdotes(art) {
  haptic(14);
  const anecdotes = art.anecdotes || [];
  let i = 0;

  const text = el('p', { class: 'anec__text', text: anecdotes[0] });
  const counter = el('span', { class: 'anec__counter' });
  const render = () => {
    text.textContent = anecdotes[i];
    counter.textContent =
      anecdotes.length > 1 ? `${i + 1} / ${anecdotes.length} — clique pour la suite` : '';
    // petite pulsation à chaque changement
    text.style.animation = 'none';
    void text.offsetWidth;
    text.style.animation = '';
  };
  render();

  const close = () => {
    overlay.classList.add('is-closing');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => overlay.remove(), 260);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };

  const card = el(
    'div',
    {
      class: 'anec__card',
      onClick: () => {
        if (anecdotes.length > 1) {
          i = (i + 1) % anecdotes.length;
          haptic(6);
          render();
        }
      },
    },
    [
      el('div', { class: 'anec__bg', style: `background-image:url('${art.imageUrl}')` }),
      el('button', {
        class: 'anec__close',
        type: 'button',
        'aria-label': 'Fermer',
        html: '&times;',
        onClick: (e) => {
          e.stopPropagation();
          close();
        },
      }),
      el('div', { class: 'anec__bubble' }, [
        el('span', { class: 'anec__badge', text: '💡 LE SAVAIS-TU ?' }),
        text,
        counter,
      ]),
      el('img', { class: 'anec__mascot', src: 'assets/mascot/samy.png', alt: 'Samy le raton' }),
    ]
  );

  const overlay = el(
    'div',
    {
      class: 'anec__overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Anecdote',
      onClick: (e) => {
        if (e.target === overlay) close();
      },
    },
    [card]
  );

  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  void overlay.offsetWidth; // force un reflow pour déclencher la transition
  overlay.classList.add('is-open');
}
