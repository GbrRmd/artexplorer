// =============================================================
//  Atelier du catalogue — édite assets/data/artworks.json et le
//  publie sur GitHub (l'API Contents fait le commit ; GitHub Pages
//  redéploie tout seul). Site statique -> l'authentification passe
//  par un jeton d'accès personnel, stocké uniquement dans ce
//  navigateur. Aucune donnée n'est envoyée ailleurs qu'à GitHub.
// =============================================================

import { el } from '../js/core/utils.js';
import { initTheme, toggleTheme } from '../js/core/theme.js';
import { CONFIG } from '../config.js';
import {
  blankArtwork,
  validateArtwork,
  normalizeArtwork,
  normalizeAnecdote,
  slugify,
  MAX_ANECDOTES,
} from '../js/core/catalog-schema.js';

const REPO = CONFIG.repo;
const API = `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${REPO.dataPath}`;
const TOKEN_KEY = 'artexplorer.gh_token';

const state = {
  token: localStorage.getItem(TOKEN_KEY) || '',
  sha: null, // sha du fichier lors du dernier « Tirer » (requis pour publier)
  artworks: [],
  pristine: '', // signature JSON des œuvres à la dernière synchro
  loaded: false,
  busy: false,
};

// Éditeur en cours
let editing = null; // index dans state.artworks, ou null (nouvelle œuvre)
let draft = null;
let idTouched = false;

const els = {};
[
  'pull', 'push', 'dirty', 'theme-toggle',
  'token-toggle', 'token-body', 'token-state', 'token-input', 'token-save', 'token-clear',
  'search', 'count', 'add', 'list', 'empty',
  'editor', 'editor-title', 'editor-close', 'form', 'form-errors', 'form-cancel', 'form-save',
  'toast',
].forEach((id) => (els[id] = document.getElementById(id)));

// ---------- Base64 (UTF-8 sûr) ----------
function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

// ---------- Sérialisation ----------
function buildDoc(list) {
  return {
    meta: {
      version: 3,
      updatedAt: new Date().toISOString().slice(0, 10),
      note:
        "Catalogue d'Arts Plastiques — édité via /admin/. Les listes de thèmes / techniques sont dérivées à la lecture (js/core/catalog.js).",
    },
    artworks: list.map(normalizeArtwork),
  };
}
const fileText = (list) => JSON.stringify(buildDoc(list), null, 2) + '\n';
// Signature stable (ignore meta.updatedAt) pour détecter les modifs.
const signature = (list) => JSON.stringify(list.map(normalizeArtwork));
const isDirty = () => state.loaded && signature(state.artworks) !== state.pristine;

// ---------- Réseau GitHub ----------
function ghHeaders() {
  return {
    Authorization: `Bearer ${state.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}
function httpError(status, action) {
  const map = {
    401: 'Jeton refusé (401) : invalide ou expiré. Renseigne un nouveau jeton.',
    403:
      "Accès refusé (403) : le jeton n'a pas la permission « Contents : écriture » sur ce dépôt, ou la limite d'appels GitHub est atteinte.",
    404:
      "Introuvable (404) : dépôt ou fichier absent, ou le jeton n'a pas accès à ce dépôt.",
  };
  return new Error(map[status] || `Échec de la ${action} (HTTP ${status}).`);
}
function requireToken() {
  if (state.token) return true;
  toast('Renseigne d’abord ton jeton d’accès GitHub.', true);
  openTokenBox(true);
  return false;
}

async function pull() {
  if (!requireToken()) return;
  setBusy(true);
  try {
    const res = await fetch(`${API}?ref=${REPO.branch}`, {
      headers: ghHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) throw httpError(res.status, 'lecture');
    const data = await res.json();
    const doc = JSON.parse(b64decode(data.content));
    state.artworks = Array.isArray(doc.artworks) ? doc.artworks.map(normalizeArtwork) : [];
    state.sha = data.sha;
    state.pristine = signature(state.artworks);
    state.loaded = true;
    render();
    toast(`Catalogue chargé — ${state.artworks.length} œuvres.`);
  } catch (err) {
    toast(err.message, true);
  } finally {
    setBusy(false);
  }
}

async function push() {
  if (!requireToken()) return;
  const problems = allProblems();
  if (problems.length) {
    toast(`Publication bloquée : ${problems.length} œuvre(s) à corriger.`, true);
    return;
  }
  if (!isDirty()) {
    toast('Rien à publier.');
    return;
  }
  setBusy(true);
  try {
    const body = {
      message: `Catalogue : ${state.artworks.length} œuvres (via l'atelier)`,
      content: b64encode(fileText(state.artworks)),
      branch: REPO.branch,
    };
    if (state.sha) body.sha = state.sha;
    const res = await fetch(API, {
      method: 'PUT',
      headers: ghHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 409 || res.status === 422) {
      throw new Error(
        'Conflit : le catalogue a changé sur GitHub entre-temps. Clique sur « ↓ Tirer » (tes modifs en cours seront perdues), puis recommence.'
      );
    }
    if (!res.ok) throw httpError(res.status, 'publication');
    const data = await res.json();
    state.sha = data.content.sha;
    state.pristine = signature(state.artworks);
    render();
    toast('Publié ✓ Le site public se met à jour dans une minute environ.');
  } catch (err) {
    toast(err.message, true);
  } finally {
    setBusy(false);
  }
}

// ---------- Validation globale ----------
function allProblems() {
  const ids = state.artworks.map((a) => a.id);
  return state.artworks
    .map((a) => ({ a, errs: validateArtwork(a, { allIds: ids }) }))
    .filter((x) => x.errs.length);
}
const knownThemes = () =>
  [...new Set(state.artworks.flatMap((a) => a.themes || []))].sort((x, y) =>
    x.localeCompare(y, 'fr')
  );
const knownTechniques = () =>
  [...new Set(state.artworks.map((a) => a.technique).filter(Boolean))].sort((x, y) =>
    x.localeCompare(y, 'fr')
  );

// ---------- Rendu liste ----------
function setBusy(b) {
  state.busy = b;
  render();
}

function render() {
  els.empty.hidden = state.loaded;
  els.pull.disabled = state.busy;
  els.add.disabled = state.busy || !state.loaded;
  els.push.disabled = state.busy || !isDirty() || allProblems().length > 0;
  els.dirty.hidden = !isDirty();

  const q = els.search.value.trim().toLowerCase();
  const rows = state.artworks
    .map((a, index) => ({ a, index }))
    .filter(
      ({ a }) =>
        !q ||
        (a.title || '').toLowerCase().includes(q) ||
        (a.artist || '').toLowerCase().includes(q)
    );

  els.count.textContent = state.loaded
    ? rows.length === state.artworks.length
      ? `${state.artworks.length} œuvres`
      : `${rows.length} / ${state.artworks.length} œuvres`
    : '';

  els.list.replaceChildren(...rows.map(({ a, index }) => card(a, index)));
}

function card(a, index) {
  const errs = validateArtwork(a, { allIds: state.artworks.map((x) => x.id) });
  return el('div', { class: 'ad-card' }, [
    el('img', {
      class: 'ad-card__thumb',
      src: a.imageUrl || undefined,
      alt: '',
      loading: 'lazy',
      onError: (e) => (e.target.style.visibility = 'hidden'),
    }),
    el('div', { class: 'ad-card__body' }, [
      el('div', { class: 'ad-card__title', text: a.title || '(sans titre)' }),
      el('div', { class: 'ad-card__meta', text: `${a.artist || '—'} · ${a.year}` }),
      errs.length
        ? el('span', { class: 'ad-card__flag', text: `${errs.length} à corriger` })
        : null,
    ]),
    el('div', { class: 'ad-card__actions' }, [
      el('button', { class: 'ad-btn', type: 'button', text: 'Modifier', onClick: () => openEditor(index) }),
      el('button', { class: 'ad-btn', type: 'button', text: 'Dupliquer', onClick: () => duplicate(index) }),
      el('button', { class: 'ad-btn', type: 'button', text: 'Supprimer', onClick: () => remove(index) }),
    ]),
  ]);
}

function uniquify(base) {
  const ids = new Set(state.artworks.map((a) => a.id));
  if (!ids.has(base)) return base;
  let n = 2;
  while (ids.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function duplicate(index) {
  const src = structuredClone(state.artworks[index]);
  src.id = uniquify(`${src.id || 'oeuvre'}-copie`);
  src.title = `${src.title} (copie)`;
  state.artworks.splice(index + 1, 0, src);
  render();
  toast('Copie ajoutée — pense à la modifier.');
}

function remove(index) {
  const a = state.artworks[index];
  if (!confirm(`Supprimer « ${a.title || a.id} » du catalogue ?`)) return;
  state.artworks.splice(index, 1);
  render();
  toast('Œuvre retirée. Publie pour appliquer.');
}

// ---------- Éditeur ----------
function openEditor(index) {
  editing = index ?? null;
  draft = editing == null ? blankArtwork() : structuredClone(state.artworks[editing]);
  idTouched = editing != null;
  els['editor-title'].textContent = editing == null ? 'Nouvelle œuvre' : 'Modifier l’œuvre';
  buildForm();
  renderFormErrors();
  els.editor.hidden = false;
}

function closeEditor() {
  els.editor.hidden = true;
  els.form.replaceChildren();
  els['form-errors'].replaceChildren();
  editing = null;
  draft = null;
}

function field(label, control, hint) {
  return el('div', { class: 'ad-field' }, [
    el('label', { text: label }),
    control,
    hint ? el('span', { class: 'ad-field__hint', text: hint }) : null,
  ]);
}

function buildForm() {
  const f = els.form;
  f.replaceChildren();

  // Titre
  const titleInput = el('input', { type: 'text', value: draft.title });
  titleInput.addEventListener('input', () => {
    draft.title = titleInput.value;
    if (!idTouched) {
      draft.id = slugify(titleInput.value);
      idInput.value = draft.id;
    }
    renderFormErrors();
  });

  // Identifiant
  const idInput = el('input', { type: 'text', value: draft.id });
  idInput.addEventListener('input', () => {
    idTouched = true;
    draft.id = idInput.value.trim();
    renderFormErrors();
  });

  // Artiste / Année
  const artistInput = el('input', { type: 'text', value: draft.artist });
  artistInput.addEventListener('input', () => {
    draft.artist = artistInput.value;
    renderFormErrors();
  });
  const yearInput = el('input', { type: 'number', step: '1', value: String(draft.year) });
  yearInput.addEventListener('input', () => {
    const n = parseInt(yearInput.value, 10);
    draft.year = Number.isFinite(n) ? n : NaN;
    renderFormErrors();
  });

  // Technique (+ suggestions)
  const techList = el('datalist', { id: 'tech-list' },
    knownTechniques().map((t) => el('option', { value: t })));
  const techInput = el('input', { type: 'text', value: draft.technique, list: 'tech-list' });
  techInput.addEventListener('input', () => {
    draft.technique = techInput.value;
    renderFormErrors();
  });

  // Thèmes
  const themeBox = el('div', { class: 'ad-chips' });
  function renderThemes() {
    const known = [...new Set([...knownThemes(), ...draft.themes])].sort((x, y) =>
      x.localeCompare(y, 'fr')
    );
    themeBox.replaceChildren(
      ...known.map((name) => {
        const cb = el('input', { type: 'checkbox' });
        cb.checked = draft.themes.includes(name);
        cb.addEventListener('change', () => {
          if (cb.checked) draft.themes.push(name);
          else draft.themes = draft.themes.filter((t) => t !== name);
          renderFormErrors();
        });
        return el('label', { class: 'ad-chk' }, [cb, el('span', { text: name })]);
      })
    );
  }
  renderThemes();
  const newTheme = el('input', { type: 'text', placeholder: 'nouveau thème…' });
  const addTheme = el('button', { class: 'ad-btn', type: 'button', text: 'Ajouter' });
  const addThemeFn = () => {
    const v = newTheme.value.trim();
    if (v && !draft.themes.includes(v)) {
      draft.themes.push(v);
      newTheme.value = '';
      renderThemes();
      renderFormErrors();
    }
  };
  addTheme.addEventListener('click', addThemeFn);
  newTheme.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addThemeFn();
    }
  });

  // Image + aperçu
  const imgInput = el('input', { type: 'url', value: draft.imageUrl, placeholder: 'https://…' });
  const preview = el('img', { class: 'ad-preview', alt: 'Aperçu' });
  const syncPreview = () => {
    if (draft.imageUrl) {
      preview.hidden = false;
      preview.src = draft.imageUrl;
    } else {
      preview.hidden = true;
    }
  };
  preview.addEventListener('error', () => (preview.hidden = true));
  imgInput.addEventListener('input', () => {
    draft.imageUrl = imgInput.value.trim();
    syncPreview();
    renderFormErrors();
  });
  syncPreview();

  // Couleur de repli
  const hex = /^#[0-9a-fA-F]{6}$/.test(draft.dominantColor) ? draft.dominantColor : '#5a4a2f';
  const colorPick = el('input', { type: 'color', value: hex });
  const colorText = el('input', { type: 'text', value: draft.dominantColor });
  const setColor = (v) => {
    draft.dominantColor = v;
    colorText.value = v;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) colorPick.value = v;
    renderFormErrors();
  };
  colorPick.addEventListener('input', () => setColor(colorPick.value));
  colorText.addEventListener('input', () => setColor(colorText.value.trim()));

  // Description
  const descInput = el('textarea', { rows: '3' }, [draft.description]);
  descInput.addEventListener('input', () => {
    draft.description = descInput.value;
    renderFormErrors();
  });

  // Anecdotes
  const anecBox = el('div', { class: 'ad-anec' });
  const addAnec = el('button', { class: 'ad-btn', type: 'button', text: '+ Ajouter une anecdote' });
  function renderAnec() {
    anecBox.replaceChildren(
      ...draft.anecdotes.map((an, i) => {
        // Migre vers { text, source } en place (accepte les anciennes chaînes).
        const cur = normalizeAnecdote(an);
        draft.anecdotes[i] = cur;
        const ta = el('textarea', { rows: '2', placeholder: 'Anecdote (langage ado)…' }, [cur.text]);
        ta.addEventListener('input', () => {
          cur.text = ta.value;
          renderFormErrors();
        });
        const src = el('input', {
          type: 'text',
          class: 'ad-anec__source',
          placeholder: 'Source (musée, site, ouvrage…)',
          value: cur.source,
        });
        src.addEventListener('input', () => {
          cur.source = src.value;
          renderFormErrors();
        });
        const del = el('button', {
          class: 'ad-btn ad-btn--icon',
          type: 'button',
          text: '✕',
          'aria-label': 'Retirer cette anecdote',
          onClick: () => {
            draft.anecdotes.splice(i, 1);
            renderAnec();
            renderFormErrors();
          },
        });
        return el('div', { class: 'ad-anec__row' }, [
          el('div', { class: 'ad-anec__fields' }, [ta, src]),
          del,
        ]);
      })
    );
    addAnec.disabled = draft.anecdotes.length >= MAX_ANECDOTES;
  }
  addAnec.addEventListener('click', () => {
    if (draft.anecdotes.length < MAX_ANECDOTES) {
      draft.anecdotes.push({ text: '', source: '' });
      renderAnec();
    }
  });
  renderAnec();

  f.append(
    field('Titre', titleInput),
    field('Identifiant', idInput, 'Se remplit tout seul depuis le titre. Minuscules, chiffres et tirets.'),
    el('div', { class: 'ad-field ad-field--row' }, [
      field('Artiste', artistInput),
      field('Année', yearInput, 'Négatif = avant J.-C. (ex. −17000).'),
    ]),
    field('Technique', el('div', {}, [techInput, techList])),
    field('Thèmes', el('div', {}, [themeBox, el('div', { class: 'ad-anec__row' }, [newTheme, addTheme])]),
      'Au moins un.'),
    field('URL de l’image', imgInput, 'Lien direct https vers une image (Wikimedia, etc.).'),
    field('Aperçu', preview),
    field('Couleur de repli', el('div', { class: 'ad-color' }, [colorPick, colorText]),
      'Affichée si l’image ne charge pas.'),
    field('Description', descInput, 'Une phrase, langage ado.'),
    field(`Anecdotes (max ${MAX_ANECDOTES})`, el('div', {}, [anecBox, addAnec]))
  );
}

function currentIds() {
  const ids = state.artworks.map((a, i) => (i === editing ? draft.id : a.id));
  if (editing == null) ids.push(draft.id);
  return ids;
}

function renderFormErrors() {
  const errs = validateArtwork(normalizeArtwork(draft), { allIds: currentIds() });
  els['form-errors'].replaceChildren(
    errs.length
      ? el('ul', {}, errs.map((m) => el('li', { text: m })))
      : el('span', { class: 'ad-field__hint', text: 'Tout est bon ✓' })
  );
}

function saveDraft() {
  const clean = normalizeArtwork(draft);
  if (editing == null) state.artworks.push(clean);
  else state.artworks[editing] = clean;
  const n = validateArtwork(clean, { allIds: state.artworks.map((a) => a.id) }).length;
  closeEditor();
  render();
  toast(n ? `Enregistré — ${n} point(s) à corriger avant publication.` : 'Enregistré dans la liste.');
}

// ---------- Jeton ----------
function openTokenBox(open) {
  els['token-body'].hidden = !open;
  els['token-toggle'].setAttribute('aria-expanded', String(open));
}
function updateTokenState() {
  const ok = !!state.token;
  els['token-state'].textContent = ok
    ? 'Jeton enregistré sur cet ordinateur'
    : 'Jeton non renseigné';
  els['token-state'].classList.toggle('is-ok', ok);
  els['token-input'].value = state.token;
}
function wireToken() {
  els['token-toggle'].addEventListener('click', () =>
    openTokenBox(els['token-body'].hidden)
  );
  els['token-save'].addEventListener('click', () => {
    const v = els['token-input'].value.trim();
    state.token = v;
    if (v) localStorage.setItem(TOKEN_KEY, v);
    else localStorage.removeItem(TOKEN_KEY);
    updateTokenState();
    toast(v ? 'Jeton enregistré.' : 'Jeton effacé.');
    if (v && !state.loaded) pull();
  });
  els['token-clear'].addEventListener('click', () => {
    state.token = '';
    localStorage.removeItem(TOKEN_KEY);
    updateTokenState();
    toast('Jeton effacé.');
  });
}

// ---------- Toast ----------
let toastTimer = null;
function toast(msg, isErr = false) {
  els.toast.textContent = msg;
  els.toast.classList.toggle('ad-toast--err', isErr);
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (els.toast.hidden = true), isErr ? 7000 : 4000);
}

// ---------- Boot ----------
initTheme();
els['theme-toggle'].addEventListener('click', toggleTheme);
els.pull.addEventListener('click', pull);
els.push.addEventListener('click', push);
els.add.addEventListener('click', () => openEditor(null));
els.search.addEventListener('input', render);
els['editor-close'].addEventListener('click', closeEditor);
els['form-cancel'].addEventListener('click', closeEditor);
els['form-save'].addEventListener('click', saveDraft);
els.editor.addEventListener('click', (e) => {
  if (e.target === els.editor) closeEditor();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.editor.hidden) closeEditor();
});
window.addEventListener('beforeunload', (e) => {
  if (isDirty()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

wireToken();
updateTokenState();
render();
if (state.token) pull();
