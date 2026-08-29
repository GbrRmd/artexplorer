// =============================================================
//  Shell — la coquille qui orchestre les modules.
//  Construit la navigation, gère le changement de module,
//  monte/démonte, et synchronise avec l'URL (#module).
// =============================================================

import { $, el, haptic } from './utils.js';
import { getModules, getModule } from './registry.js';
import { toggleTheme } from './theme.js';

let current = null; // module actuellement monté

function buildNav() {
  const nav = el('nav', { class: 'modnav', 'aria-label': 'Modules' });
  for (const m of getModules()) {
    const btn = el(
      'button',
      {
        class: 'modnav__btn',
        'data-module': m.id,
        onClick: () => navigate(m.id),
      },
      [
        el('span', { class: 'icon-wrap', html: m.icon || '' }),
        el('span', { class: 'label', text: m.title }),
      ]
    );
    nav.append(btn);
  }
  return nav;
}

function markActive(id) {
  for (const btn of document.querySelectorAll('.modnav__btn')) {
    btn.setAttribute('aria-current', String(btn.dataset.module === id));
  }
}

async function navigate(id, { push = true } = {}) {
  const module = getModule(id);
  if (!module || (current && current.id === id)) return;

  haptic(8);

  // Démonte le module précédent
  if (current && typeof current.unmount === 'function') {
    try { current.unmount(); } catch (e) { console.warn('unmount', e); }
  }

  const root = $('#module-root');
  root.innerHTML = '';
  // Relance l'animation d'entrée
  root.style.animation = 'none';
  void root.offsetWidth;
  root.style.animation = '';

  current = module;
  markActive(id);

  if (push && location.hash.slice(1) !== id) {
    history.pushState({ id }, '', `#${id}`);
  }

  try {
    await module.mount(root);
  } catch (err) {
    console.error(`Erreur au montage du module ${id}`, err);
    root.append(
      el('div', { class: 'placeholder' }, [
        el('div', { class: 'placeholder__emoji', text: '😵‍💫' }),
        el('h2', { text: 'Oups, ce bloc a eu un souci' }),
        el('p', { text: 'On réessaiera. Choisis un autre module en attendant.' }),
      ])
    );
  }
}

export function initShell() {
  // Injecte la navigation dans le header
  const navSlot = $('#nav-slot');
  navSlot.append(buildNav());

  // Bouton thème
  $('#theme-toggle').addEventListener('click', () => {
    toggleTheme();
    haptic(8);
  });

  // Navigation avant/arrière du navigateur
  window.addEventListener('popstate', (e) => {
    const id = (e.state && e.state.id) || location.hash.slice(1) || defaultId();
    navigate(id, { push: false });
  });

  // Module initial : hash de l'URL, sinon le premier enregistré
  const initial = location.hash.slice(1) || defaultId();
  navigate(initial, { push: false });
}

function defaultId() {
  const mods = getModules();
  return mods.length ? mods[0].id : null;
}
