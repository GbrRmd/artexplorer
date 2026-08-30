// =============================================================
//  Barre de recherche + filtres dynamiques (thèmes / techniques).
//  - Recherche texte sur titre + artiste.
//  - Chips de filtre à bascule, avec compteurs qui se recalculent.
//  - Émet la liste filtrée via onChange à chaque modification.
//  Entre facettes : ET. Dans une facette : OU (on élargit).
// =============================================================

import { el, debounce } from '../../core/utils.js';

const SEARCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`;

export function createFilterBar(data, onChange) {
  const artworks = data.artworks || [];
  const themes = (data.meta?.themes || []).map((t) => t.name);
  const techniques = (data.meta?.techniques || []).map((t) => t.name);
  const artists = [...new Set(artworks.map((a) => a.artist))].sort((a, b) =>
    a.localeCompare(b, 'fr')
  );

  const state = { q: '', themes: new Set(), techniques: new Set(), artists: new Set() };

  // --- Recherche ---
  const search = el('input', {
    type: 'search',
    class: 'filter-search',
    placeholder: 'Rechercher une œuvre, un artiste…',
    'aria-label': 'Rechercher une œuvre ou un artiste',
    onInput: debounce(() => {
      state.q = search.value.trim().toLowerCase();
      apply();
    }, 140),
  });

  // --- Chips ---
  const themeChips = new Map();
  const techChips = new Map();
  const artistChips = new Map();

  function makeChip(name, set) {
    const count = el('span', { class: 'chip__count' });
    const btn = el(
      'button',
      {
        class: 'chip',
        type: 'button',
        'aria-pressed': 'false',
        onClick: () => {
          set.has(name) ? set.delete(name) : set.add(name);
          btn.setAttribute('aria-pressed', String(set.has(name)));
          apply();
        },
      },
      [el('span', { text: name }), count]
    );
    return { btn, count };
  }

  const themeWrap = el('div', { class: 'chips' });
  themes.forEach((name) => {
    const c = makeChip(name, state.themes);
    themeChips.set(name, c);
    themeWrap.append(c.btn);
  });

  const techWrap = el('div', { class: 'chips' });
  techniques.forEach((name) => {
    const c = makeChip(name, state.techniques);
    techChips.set(name, c);
    techWrap.append(c.btn);
  });

  const artistWrap = el('div', { class: 'chips' });
  artists.forEach((name) => {
    const c = makeChip(name, state.artists);
    artistChips.set(name, c);
    artistWrap.append(c.btn);
  });

  // --- Bouton effacer ---
  const clearBtn = el('button', {
    class: 'filter-clear',
    type: 'button',
    onClick: () => {
      state.q = '';
      state.themes.clear();
      state.techniques.clear();
      state.artists.clear();
      search.value = '';
      syncPressed();
      apply();
    },
  }, [
    el('span', { html: '&times;' }),
    el('span', { text: 'Effacer les filtres' }),
  ]);

  // --- Logique ---
  const matchQuery = (a) =>
    !state.q ||
    a.title.toLowerCase().includes(state.q) ||
    a.artist.toLowerCase().includes(state.q);

  // Prédicats par facette (OU à l'intérieur d'une facette)
  const okThemes = (a) => state.themes.size === 0 || a.themes.some((t) => state.themes.has(t));
  const okTech = (a) => state.techniques.size === 0 || state.techniques.has(a.technique);
  const okArtist = (a) => state.artists.size === 0 || state.artists.has(a.artist);

  const matches = (a) => matchQuery(a) && okThemes(a) && okTech(a) && okArtist(a);

  // Compteurs "disponibles" : pour chaque valeur, on compte les œuvres qui
  // passeraient les AUTRES facettes actives (+ la recherche) et cette valeur.
  // Les valeurs à 0 sont grisées -> on guide vers les combinaisons possibles.
  function updateCounts() {
    themeChips.forEach((c, name) => {
      const n = artworks.filter(
        (a) => matchQuery(a) && okTech(a) && okArtist(a) && a.themes.includes(name)
      ).length;
      c.count.textContent = n;
      c.btn.classList.toggle('is-empty', n === 0);
    });
    techChips.forEach((c, name) => {
      const n = artworks.filter(
        (a) => matchQuery(a) && okThemes(a) && okArtist(a) && a.technique === name
      ).length;
      c.count.textContent = n;
      c.btn.classList.toggle('is-empty', n === 0);
    });
    artistChips.forEach((c, name) => {
      const n = artworks.filter(
        (a) => matchQuery(a) && okThemes(a) && okTech(a) && a.artist === name
      ).length;
      c.count.textContent = n;
      c.btn.classList.toggle('is-empty', n === 0);
    });
  }

  function syncPressed() {
    themeChips.forEach((c, n) => c.btn.setAttribute('aria-pressed', String(state.themes.has(n))));
    techChips.forEach((c, n) => c.btn.setAttribute('aria-pressed', String(state.techniques.has(n))));
    artistChips.forEach((c, n) => c.btn.setAttribute('aria-pressed', String(state.artists.has(n))));
  }

  function activeCount() {
    return (
      (state.q ? 1 : 0) + state.themes.size + state.techniques.size + state.artists.size
    );
  }

  function apply() {
    updateCounts();
    const n = activeCount();
    clearBtn.classList.toggle('is-visible', n > 0);
    badge.textContent = n ? String(n) : '';
    badge.classList.toggle('is-visible', n > 0);
    onChange(artworks.filter(matches));
  }

  // Sélectionne un seul thème (piloté depuis la constellation) :
  // on repart propre puis on plonge dans cet univers.
  function selectTheme(name) {
    state.q = '';
    search.value = '';
    state.themes.clear();
    state.techniques.clear();
    state.artists.clear();
    if (themeChips.has(name)) state.themes.add(name);
    syncPressed();
    apply();
  }

  // Contenu repliable (recherche + facettes + effacer)
  const inner = el('div', { class: 'filterbar__inner' }, [
    el('div', { class: 'filterbar__search' }, [
      el('span', { class: 'filter-search__icon', html: SEARCH_ICON }),
      search,
    ]),
    el('div', { class: 'facet' }, [
      el('span', { class: 'facet__label', text: 'Thèmes' }),
      themeWrap,
    ]),
    el('div', { class: 'facet' }, [
      el('span', { class: 'facet__label', text: 'Techniques' }),
      techWrap,
    ]),
    el('div', { class: 'facet' }, [
      el('span', { class: 'facet__label', text: 'Artistes' }),
      artistWrap,
    ]),
    clearBtn,
  ]);
  const body = el('div', { class: 'filterbar__body' }, [inner]);

  // Badge du nombre de filtres actifs (sur le bouton d'ouverture)
  const badge = el('span', { class: 'filterbar__badge' });

  // Ouverture/fermeture pilotée en JS (max-height = hauteur réelle du
  // contenu) : fiable quelle que soit la cascade CSS.
  function setOpen(open) {
    bar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  // Bouton d'ouverture/fermeture — la barre est fermée et discrète par défaut
  const toggle = el(
    'button',
    {
      class: 'filterbar__toggle',
      type: 'button',
      'aria-expanded': 'false',
      onClick: () => setOpen(!bar.classList.contains('is-open')),
    },
    [
      el('span', { class: 'filter-search__icon', html: SEARCH_ICON }),
      el('span', { class: 'filterbar__toggle-label', text: 'Rechercher & filtrer' }),
      badge,
      el('span', { class: 'filterbar__chevron', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' }),
    ]
  );

  const bar = el('div', { class: 'filterbar glass glass--lit' }, [toggle, body]);

  updateCounts();

  return { el: bar, selectTheme, open: () => setOpen(true) };
}
