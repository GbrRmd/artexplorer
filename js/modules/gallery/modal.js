// =============================================================
//  Modale de fiche détaillée d'une œuvre.
//  Ouverture animée, fermeture par croix / clic hors panneau /
//  touche Échap. Piège le focus a minima et restaure le focus.
// =============================================================

import { el, haptic } from '../../core/utils.js';
import { mediaMarkup, wireImage } from './media.js';

let activeModal = null;
let lastFocused = null;

/**
 * Ouvre la fiche détaillée d'une œuvre.
 * @param {object} art
 * @param {object} [opts]
 * @param {Array}  [opts.related]  œuvres liées (navigation nodale)
 * @param {Function}[opts.onSelect] appelé quand on clique une œuvre liée
 */
export function openModal(art, opts = {}) {
  const { related = [], onSelect = null } = opts;
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
  ];

  // --- Navigation nodale : "Dans le même esprit" ---
  if (related.length && onSelect) {
    const list = el(
      'div',
      { class: 'related-list' },
      related.map((other) =>
        el(
          'button',
          {
            class: 'related-item',
            type: 'button',
            title: `${other.title} — ${other.artist}`,
            'aria-label': `Voir « ${other.title} » de ${other.artist}`,
            onClick: () => {
              haptic(10);
              onSelect(other);
            },
          },
          [
            el('span', {
              class: 'related-item__media',
              style: `--fallback:${other.dominantColor || '#333'}`,
              html: mediaMarkup(other, { size: 'card' }),
            }),
            el('span', { class: 'related-item__title', text: other.title }),
          ]
        )
      )
    );
    contentChildren.push(
      el('div', { class: 'modal__related' }, [
        el('span', { class: 'modal__related-label', text: '✨ Dans le même esprit' }),
        list,
      ])
    );
  }

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
