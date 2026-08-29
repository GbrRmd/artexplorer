// =============================================================
//  MODULE 1 — Galerie d'œuvres
//  P0 : coquille du module + chargement de la donnée test
//       (prouve le pipeline fetch -> mount).
//  P1 : cartes + tilt 3D + modale + recherche + filtres.
// =============================================================

import { el, fetchJSON } from '../../core/utils.js';
import { CONFIG } from '../../../config.js';

const ICON = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;

let data = null; // cache mémoire du catalogue

export default {
  id: 'gallery',
  title: 'Galerie',
  icon: ICON,
  description: "Explorer une collection d'œuvres d'art",

  async mount(container) {
    const head = el('header', { class: 'module-head' }, [
      el('h1', { class: 'module-head__title', text: "Galerie d'œuvres" }),
      el('p', {
        class: 'module-head__subtitle',
        text: 'Explore, touche, découvre. Chaque œuvre a une histoire.',
      }),
    ]);
    container.append(head);

    // Zone de contenu (remplie par la donnée)
    const body = el('div', { id: 'gallery-body' });
    container.append(body);

    // Chargement de la donnée test (Firestore prendra le relais en P3)
    try {
      if (!data) data = await fetchJSON(CONFIG.data.mockArtworks);
      renderTeaser(body, data);
    } catch (err) {
      console.error(err);
      body.append(
        el('div', { class: 'placeholder' }, [
          el('div', { class: 'placeholder__emoji', text: '🖼️' }),
          el('h2', { text: 'Impossible de charger les œuvres' }),
          el('p', {
            text: 'Lance le site via un serveur local (npx serve) — les modules ES6 ne marchent pas en ouverture directe du fichier.',
          }),
        ])
      );
    }
  },

  unmount() {
    /* rien à nettoyer pour l'instant */
  },
};

// --- P0 : simple teaser prouvant que la donnée est bien chargée.
//     Sera remplacé par la vraie grille de cartes en P1.
function renderTeaser(body, data) {
  const count = data.artworks?.length ?? 0;
  const wrap = el('div', { class: 'glass glass--lit', style: 'padding: var(--space-8); text-align:center;' }, [
    el('div', { class: 'placeholder__emoji', text: '🎨' }),
    el('h2', { style: 'font-size: var(--text-2xl); margin-bottom: var(--space-2);', text: `${count} œuvres prêtes à explorer` }),
    el('p', {
      style: 'color: var(--text-muted); max-width: 44ch; margin: 0 auto;',
      text: 'Le socle est en place. La grille interactive (cartes, effet 3D, fiches détaillées, recherche) arrive à la prochaine étape.',
    }),
    el('div', { style: 'display:flex; gap:var(--space-2); flex-wrap:wrap; justify-content:center; margin-top: var(--space-5);' },
      (data.meta?.themes ?? []).map((t) =>
        el('span', { class: 'pill', text: `${t.name} · ${t.count}` })
      )
    ),
  ]);
  body.append(wrap);
}
