// =============================================================
//  Modale de fiche détaillée d'une œuvre.
//  Ouverture animée, fermeture par croix / clic hors panneau /
//  touche Échap. Piège le focus a minima et restaure le focus.
// =============================================================

import { el, haptic } from '../../core/utils.js';
import { mediaMarkup, wireImage } from './media.js';
import {
  getPeriod,
  SCALED_PERIODS,
  scaledDuration,
  yearPercent,
  nowYear,
} from './periods.js';

let activeModal = null;
let lastFocused = null;

/**
 * Ouvre la fiche détaillée d'une œuvre.
 * @param {object} art
 * @param {object} [opts]
 * @param {Function}[opts.onTimeline] appelé (avec l'œuvre) au clic sur la frise
 */
export function openModal(art, opts = {}) {
  const { onTimeline = null } = opts;
  haptic(12);
  // Saut vers une œuvre liée : on retire l'ancienne modale immédiatement
  // (sans animation ni déverrouillage du scroll). Sinon on mémorise le
  // focus de départ pour le restaurer à la fermeture finale.
  if (activeModal) hardClose();
  else lastFocused = document.activeElement;

  const media = el('div', {
    class: 'modal__media',
    style: `--fallback:${art.dominantColor || '#333'}`,
    title: "Cliquer pour agrandir l'œuvre",
    html:
      mediaMarkup(art, { size: 'large' }) +
      '<span class="modal__zoom-hint" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>' +
      '</span>',
  });

  // --- Bonus : mode focus. Clic sur l'œuvre = on masque le bloc infos
  //     et on ne garde que l'œuvre, agrandie. Re-clic = retour. ---
  const toggleFocus = () => {
    haptic(10);
    panel.classList.toggle('is-focused');
    const focused = panel.classList.contains('is-focused');
    media.setAttribute(
      'title',
      focused ? "Cliquer pour revenir au détail" : "Cliquer pour agrandir l'œuvre"
    );
  };
  media.addEventListener('click', toggleFocus);

  const tags = el(
    'div',
    { class: 'modal__tags' },
    [
      el('span', { class: 'pill', text: `🗓️ ${art.year}` }),
      el('span', { class: 'pill', text: `🎨 ${art.technique}` }),
      ...(art.themes || []).map((t) => el('span', { class: 'pill', text: `#${t}` })),
    ]
  );

  const contentChildren = [
    el('h2', { class: 'modal__title', id: 'modal-title', text: art.title }),
    el('p', { class: 'modal__artist', text: art.artist }),
    el('p', { class: 'modal__desc', text: art.description || '' }),
    tags,
    buildFriseMini(art, onTimeline),
  ];

  const content = el('div', { class: 'modal__content' }, contentChildren);

  const closeBtn = el('button', {
    class: 'modal__close',
    type: 'button',
    'aria-label': 'Fermer',
    html: '&times;',
    onClick: closeModal,
  });

  const panel = el(
    'div',
    { class: 'modal__panel glass--lit', role: 'document' },
    [closeBtn, media, content]
  );

  const backdrop = el('div', { class: 'modal__backdrop', onClick: closeModal });

  const modal = el(
    'div',
    {
      class: 'modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'modal-title',
    },
    [backdrop, panel]
  );

  document.body.append(modal);
  document.body.style.overflow = 'hidden';
  activeModal = modal;

  // Active le chargement des images (grande image + vignettes liées)
  wireImage(modal);

  document.addEventListener('keydown', onKeydown);
  closeBtn.focus();
}

// Mini-frise PROPORTIONNELLE : zones dimensionnées à l'échelle du temps
// (de l'Antiquité à aujourd'hui), repère "an 0", année en cours à droite,
// marqueur sur l'année de l'œuvre. Cliquable -> vue Frise dédiée.
function buildFriseMini(art, onTimeline) {
  const period = getPeriod(art.year);

  const zones = SCALED_PERIODS.map((p) =>
    el('span', {
      class: 'fmini__zone' + (p.id === period.id ? ' is-active' : ''),
      style: `flex-grow:${scaledDuration(p)}; --c:${p.color}`,
      title: `${p.name} (${p.dates})`,
    })
  );

  const bar = el('div', { class: 'fmini' }, [
    el('div', { class: 'fmini__track' }, zones),
    el('span', {
      class: 'fmini__zero',
      style: `left:${yearPercent(0).toFixed(1)}%`,
      html: '<i class="fmini__zero-line"></i><em class="fmini__cap">an 0</em>',
    }),
    el('span', { class: 'fmini__now', text: String(nowYear()) }),
    el('span', {
      class: 'fmini__marker',
      style: `left:${yearPercent(art.year).toFixed(1)}%`,
      html: `<em class="fmini__marker-year">${art.year}</em>`,
    }),
  ]);

  return el('div', { class: 'modal__frise' }, [
    el(
      'button',
      {
        class: 'frise-mini',
        type: 'button',
        'aria-label': `Voir la frise chronologique — période ${period.name}`,
        onClick: () => {
          haptic(10);
          const cb = onTimeline;
          closeModal();
          if (cb) cb(art);
        },
      },
      [
        el('span', { class: 'frise-mini__caption', text: '📜 Sa place dans le temps' }),
        bar,
        el('span', {
          class: 'frise-mini__label',
          html: `<strong>${period.name}</strong> · ${art.year} <span class="frise-mini__go">— voir la frise →</span>`,
        }),
      ]
    ),
  ]);
}

function onKeydown(e) {
  if (e.key === 'Escape') closeModal();
}

// Retrait immédiat de la modale active (utilisé lors d'un saut nodal) :
// pas d'animation, on garde le scroll verrouillé et le focus de départ.
function hardClose() {
  if (!activeModal) return;
  document.removeEventListener('keydown', onKeydown);
  activeModal.remove();
  activeModal = null;
}

export function closeModal() {
  if (!activeModal) return;
  const modal = activeModal;
  activeModal = null;
  document.removeEventListener('keydown', onKeydown);

  modal.classList.add('is-closing');
  const done = () => {
    modal.remove();
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  };
  // Attend la fin de l'anim (ou ferme direct si mouvement réduit)
  const anim = modal.querySelector('.modal__panel');
  if (anim) {
    anim.addEventListener('animationend', done, { once: true });
    setTimeout(done, 400); // filet de sécurité
  } else {
    done();
  }
}
