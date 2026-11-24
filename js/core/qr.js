// =============================================================
//  QR code du site : bouton du menu -> grand QR code plein écran,
//  pour qu'une autre personne le scanne (vidéoprojecteur, CDI…).
//  Fermeture : bouton, clic sur le fond ou touche Échap.
// =============================================================

import { el, haptic } from './utils.js';

const SITE_URL = 'https://gbrrmd.github.io/artexplorer/';
let overlay = null;
let lastFocus = null;

function close() {
  if (!overlay) return;
  overlay.classList.add('is-closing');
  const node = overlay;
  overlay = null;
  document.removeEventListener('keydown', onKey);
  setTimeout(() => node.remove(), 200);
  if (lastFocus) lastFocus.focus();
}

function onKey(e) {
  if (e.key === 'Escape') close();
}

function open() {
  if (overlay) return;
  haptic(10);
  lastFocus = document.activeElement;
  const closeBtn = el('button', { class: 'btn qr-overlay__close', type: 'button', text: 'Fermer', onClick: close });
  overlay = el(
    'div',
    { class: 'qr-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'qr-title' },
    [
      el('div', { class: 'qr-overlay__backdrop', onClick: close }),
      el('div', { class: 'qr-overlay__panel' }, [
        el('h2', { class: 'qr-overlay__title', id: 'qr-title', text: '📱 Scanne pour ouvrir le site' }),
        el('img', {
          class: 'qr-overlay__img',
          src: 'assets/qr-site.png',
          alt: `QR code menant au site Arts Plastiques : ${SITE_URL}`,
          width: '720',
          height: '720',
        }),
        el('p', { class: 'qr-overlay__url', text: SITE_URL.replace('https://', '') }),
        closeBtn,
      ]),
    ]
  );
  document.body.append(overlay);
  document.addEventListener('keydown', onKey);
  closeBtn.focus();
}

export function initQr() {
  const btn = document.getElementById('qr-toggle');
  if (btn) btn.addEventListener('click', open);
}
