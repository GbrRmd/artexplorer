// =============================================================
//  Effet 3D "tilt" sur les cartes.
//  - Souris (desktop) : la carte s'incline vers le curseur.
//  - Tactile (mobile) : idem sous le doigt pendant le contact.
//  Reflet lumineux (glare) qui suit le point de contact.
//  Désactivé si l'utilisateur préfère un mouvement réduit.
// =============================================================

import { prefersReducedMotion } from '../../core/utils.js';

const MAX_TILT = 10; // degrés max d'inclinaison

/** Attache l'effet tilt à une carte. Renvoie une fonction de nettoyage. */
export function attachTilt(card) {
  if (prefersReducedMotion()) return () => {};

  let raf = null;

  const onMove = (clientX, clientY) => {
    const rect = card.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width; // 0..1
    const py = (clientY - rect.top) / rect.height; // 0..1
    const rotateY = (px - 0.5) * 2 * MAX_TILT;
    const rotateX = -(py - 0.5) * 2 * MAX_TILT;

    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      card.style.setProperty('--gx', `${px * 100}%`);
      card.style.setProperty('--gy', `${py * 100}%`);
    });
  };

  const reset = () => {
    if (raf) cancelAnimationFrame(raf);
    card.style.transform = '';
  };

  // --- Souris ---
  const mouseMove = (e) => onMove(e.clientX, e.clientY);
  card.addEventListener('mousemove', mouseMove);
  card.addEventListener('mouseleave', reset);

  // --- Tactile ---
  const touchMove = (e) => {
    const t = e.touches[0];
    if (t) onMove(t.clientX, t.clientY);
  };
  card.addEventListener('touchmove', touchMove, { passive: true });
  card.addEventListener('touchend', reset);
  card.addEventListener('touchcancel', reset);

  return () => {
    card.removeEventListener('mousemove', mouseMove);
    card.removeEventListener('mouseleave', reset);
    card.removeEventListener('touchmove', touchMove);
    card.removeEventListener('touchend', reset);
    card.removeEventListener('touchcancel', reset);
    if (raf) cancelAnimationFrame(raf);
  };
}
