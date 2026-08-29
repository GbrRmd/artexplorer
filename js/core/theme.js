// =============================================================
//  Gestion du thème clair / sombre
//  Persisté dans localStorage (préférence UI, pas une donnée
//  personnelle). Respecte le réglage système au 1er passage.
// =============================================================

const STORAGE_KEY = 'artexplorer.theme';

const SUN = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
const MOON = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;

function systemPrefersLight() {
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

export function getTheme() {
  return (
    localStorage.getItem(STORAGE_KEY) ||
    (systemPrefersLight() ? 'light' : 'dark')
  );
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
  // Met à jour l'icône du bouton s'il existe
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? MOON : SUN;
    btn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
    );
  }
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

/** Applique le thème dès le boot (avant rendu pour éviter le flash) */
export function initTheme() {
  applyTheme(getTheme());
}
