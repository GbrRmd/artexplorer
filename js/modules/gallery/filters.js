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

  const state = { q: '', themes: new Set(), techniques: new Set() };

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

  // --- Bouton effacer ---
  const clearBtn = el('button', {
    class: 'filter-clear',
    type: 'button',
    onClick: () => {
      state.q = '';
      state.themes.clear();
      state.techniques.clear();
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

  const matches = (a) =>
    matchQuery(a) &&
    (state.themes.size === 0 || a.themes.some((t) => state.themes.has(t))) &&
    (state.techniques.size === 0 || state.techniques.has(a.technique));

  // Compteurs : basés sur le sous-ensemble texte uniquement (lisible)
  function updateCounts() {
    const subset = artworks.filter(matchQuery);
    themeChips.forEach((c, name) => {
      const n = subset.filter((a) => a.themes.includes(name)).length;
      c.count.textContent = n;
      c.btn.classList.toggle('is-empty', n === 0);
    });
    techChips.forEach((c, name) => {
      const n = subset.filter((a) => a.technique === name).length;
      c.count.textContent = n;
      c.btn.classList.toggle('is-empty', n === 0);
    });
  }

  function syncPressed() {
    themeChips.forEach((c, n) => c.btn.setAttribute('aria-pressed', String(state.themes.has(n))));
    techChips.forEach((c, n) => c.btn.setAttribute('aria-pressed', String(state.techniques.has(n))));
  }

  function apply() {
    updateCounts();
    const active = state.q || state.themes.size || state.techniques.size;
    clearBtn.classList.toggle('is-visible', Boolean(active));
    onChange(artworks.filter(matches));
  }

  // Sélectionne un seul thème (piloté depuis la constellation) :
  // on repart propre puis on plonge dans cet univers.
  function selectTheme(name) {
    state.q = '';
    search.value = '';
    state.themes.clear();
    state.techniques.clear();
    if (themeChips.has(name)) state.themes.add(name);
    syncPressed();
    apply();
  }

  const bar = el('div', { class: 'filterbar glass glass--lit' }, [
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
    clearBtn,
  ]);

  updateCounts();

  return { el: bar, selectTheme };
}
