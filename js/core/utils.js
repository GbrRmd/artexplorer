// =============================================================
//  Utilitaires partagés
// =============================================================

/** Sélecteur court */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/**
 * Crée un élément DOM avec attributs et enfants.
 * el('div', { class: 'x' }, [child1, 'texte'])
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'dataset') {
      Object.assign(node.dataset, v);
    } else {
      node.setAttribute(k, v);
    }
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

/** Limite la fréquence d'appel (dernier appel gagne) */
export function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Limite la fréquence d'appel (premier appel gagne, puis cooldown) */
export function throttle(fn, wait = 100) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}

/** Vibration mobile courte (si supportée et activée) */
export function haptic(pattern = 10) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

/** Récupère un JSON avec gestion d'erreur simple */
export async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Échec du chargement : ${url} (${res.status})`);
  return res.json();
}

/** Vrai si l'utilisateur préfère un mouvement réduit */
export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Vrai sur appareil tactile (pas de survol souris fin) */
export const isTouch = () =>
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

/** Charge une feuille de style de module une seule fois */
const loadedCSS = new Set();
export function loadModuleCSS(href) {
  if (loadedCSS.has(href)) return;
  loadedCSS.add(href);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}
