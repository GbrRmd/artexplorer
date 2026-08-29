// =============================================================
//  MODULE 1 — Galerie d'œuvres
//  P1 : grille de cartes interactives (effet 3D tilt),
//       modale de fiche détaillée, chargement de la donnée test.
//  (Recherche + filtres : P2 — Firestore : P3.)
// =============================================================

import { el, fetchJSON, loadModuleCSS, haptic } from '../../core/utils.js';
import { CONFIG } from '../../../config.js';
import { mediaMarkup, wireImage } from './media.js';
import { attachTilt } from './card-tilt.js';
import { openModal } from './modal.js';
import { createFilterBar } from './filters.js';

const ICON = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;

let data = null; // cache mémoire du catalogue
let cleanups = []; // fonctions de nettoyage des effets tilt

export default {
  id: 'gallery',
  title: 'Galerie',
  icon: ICON,
  description: "Explorer une collection d'œuvres d'art",

  async mount(container) {
    loadModuleCSS('js/modules/gallery/gallery.css');

    container.append(
      el('header', { class: 'module-head' }, [
        el('h1', { class: 'module-head__title', text: "Galerie d'œuvres" }),
        el('p', {
          class: 'module-head__subtitle',
          text: 'Explore, touche, découvre. Chaque œuvre a une histoire.',
        }),
      ])
    );

    const body = el('div', { id: 'gallery-body' });
    container.append(body);

    try {
      if (!data) data = await fetchJSON(CONFIG.data.mockArtworks);
      renderGallery(body, data.artworks || []);
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
    cleanups.forEach((fn) => fn());
    cleanups = [];
  },
};

function renderGallery(body, artworks) {
  const total = artworks.length;

  // Compteur de résultats
  const count = el('div', { class: 'gallery-count' });

  // Barre de recherche + filtres : re-rend la grille à chaque changement
  const filters = createFilterBar({ artworks, meta: data.meta }, (filtered) => {
    updateGrid(grid, filtered);
    updateCount(count, filtered.length, total);
  });

  const grid = el('div', { class: 'gallery-grid' });

  body.append(
    filters.el,
    el('div', { class: 'gallery-toolbar' }, [count]),
    grid
  );

  updateGrid(grid, artworks);
  updateCount(count, total, total);
}

function updateCount(node, shown, total) {
  node.innerHTML =
    shown === total
      ? `<strong>${total}</strong> œuvres à explorer`
      : `<strong>${shown}</strong> sur ${total} œuvres`;
}

// Vide la grille, nettoie les anciens effets, recrée les cartes.
function updateGrid(grid, artworks) {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  grid.innerHTML = '';

  if (artworks.length === 0) {
    grid.append(
      el('div', { class: 'gallery-empty' }, [
        el('div', { class: 'placeholder__emoji', text: '🔍' }),
        el('h2', { text: 'Aucune œuvre ne correspond' }),
        el('p', { text: 'Essaie un autre mot ou retire un filtre.' }),
      ])
    );
    return;
  }

  artworks.forEach((art, i) => grid.append(buildCard(art, i)));
  wireImage(grid);
  cleanups = artworks.map((_, i) => {
    const card = grid.children[i];
    return card ? attachTilt(card) : () => {};
  });
}

function buildCard(art, index) {
  const media = el('div', {
    class: 'artcard__media',
    html: mediaMarkup(art, { size: 'card' }) + '<div class="artcard__glare"></div>',
  });

  const body = el('div', { class: 'artcard__body' }, [
    el('span', { class: 'pill artcard__tech', text: art.technique }),
    el('h3', { class: 'artcard__title', text: art.title }),
    el('div', { class: 'artcard__meta' }, [
      el('span', { text: art.artist }),
      el('span', { class: 'dot', text: '•' }),
      el('span', { text: String(art.year) }),
    ]),
  ]);

  const open = () => {
    haptic(10);
    openModal(art);
  };

  const card = el(
    'article',
    {
      class: 'artcard',
      style: `--fallback:${art.dominantColor || '#333'}; --i:${index}`,
      tabindex: '0',
      role: 'button',
      'aria-label': `Voir « ${art.title} » de ${art.artist}`,
      onClick: open,
      onKeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      },
    },
    [el('div', { class: 'artcard__inner' }, [media, body])]
  );

  return card;
}
