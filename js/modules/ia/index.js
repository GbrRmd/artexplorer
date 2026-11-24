// =============================================================
//  MODULE 2 — Comprendre l'IA
//  Un parcours en 6 étapes, toutes interactives, pour collégiens.
//  Chaque étape est un petit module autonome dans ./steps/ :
//    { id, emoji, title, subtitle, render(container) -> cleanup? }
//  Aucun appel réseau, aucune IA réelle : tout est simulé en local
//  pour montrer les MÉCANISMES (apprendre, prédire, débruiter…).
// =============================================================

import { el, loadModuleCSS, haptic } from '../../core/utils.js';
import intro from './steps/intro.js';
import learn from './steps/learn.js';
import words from './steps/words.js';
import images from './steps/images.js';
import quiz from './steps/quiz.js';
import reflexes from './steps/reflexes.js';

const ICON = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M9 4h6"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>`;

const STEPS = [intro, learn, words, images, quiz, reflexes];

// Étape en cours : on garde la position quand on revient sur le module
// (préférence d'interface locale, aucune donnée personnelle).
const KEY = 'artexplorer.ia.step';
const readStep = () => {
  try {
    const n = Number(localStorage.getItem(KEY));
    return Number.isInteger(n) && n >= 0 && n < STEPS.length ? n : 0;
  } catch {
    return 0;
  }
};
const saveStep = (n) => {
  try {
    localStorage.setItem(KEY, String(n));
  } catch {
    /* navigation privée : sans importance */
  }
};

let cleanup = null;

export default {
  id: 'ia',
  title: "Comprendre l'IA",
  shortTitle: 'IA',
  icon: ICON,
  description: "Comment fonctionne l'intelligence artificielle",

  mount(container) {
    loadModuleCSS('js/modules/ia/ia.css');

    container.append(
      el('header', { class: 'module-head' }, [
        el('h1', { class: 'module-head__title', text: "Comprendre l'IA" }),
        el('p', {
          class: 'module-head__subtitle',
          text: 'Six étapes pour voir ce qui se passe dans la machine. Touche, teste, trompe-la !',
        }),
      ])
    );

    // --- Fil d'étapes (stepper) ---
    const stepButtons = STEPS.map((s, i) =>
      el(
        'button',
        {
          class: 'ia-steps__btn',
          type: 'button',
          'aria-label': `Étape ${i + 1} : ${s.title}`,
          onClick: () => go(i),
        },
        [
          el('span', { class: 'ia-steps__emoji', text: s.emoji, 'aria-hidden': 'true' }),
          el('span', { class: 'ia-steps__num', text: String(i + 1), 'aria-hidden': 'true' }),
          el('span', { class: 'ia-steps__label', text: s.short || s.title }),
        ]
      )
    );
    const bar = el('div', { class: 'ia-steps__bar' }, [el('span', { class: 'ia-steps__fill' })]);
    const stepper = el('nav', { class: 'ia-steps', 'aria-label': 'Étapes du parcours' }, [
      el('div', { class: 'ia-steps__list' }, stepButtons),
      bar,
    ]);

    const stage = el('section', { class: 'ia-stage', 'aria-live': 'polite' });

    const prev = el('button', { class: 'ia-nav__btn', type: 'button', onClick: () => go(current - 1) });
    const next = el('button', { class: 'btn ia-nav__next', type: 'button' });
    const footer = el('div', { class: 'ia-nav' }, [prev, next]);

    container.append(stepper, stage, footer);

    let current = -1;
    function go(i) {
      if (i < 0 || i >= STEPS.length || i === current) return;
      haptic(8);
      if (cleanup) {
        try { cleanup(); } catch (e) { console.warn(e); }
        cleanup = null;
      }
      const first = current === -1;
      current = i;
      saveStep(i);
      const step = STEPS[i];

      stepButtons.forEach((b, k) => {
        b.setAttribute('aria-current', k === i ? 'step' : 'false');
        b.classList.toggle('is-done', k < i);
      });
      bar.style.setProperty('--p', `${((i + 1) / STEPS.length) * 100}%`);
      stepButtons[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });

      stage.innerHTML = '';
      stage.style.animation = 'none';
      void stage.offsetWidth;
      stage.style.animation = '';
      stage.append(
        el('header', { class: 'ia-stage__head' }, [
          el('span', { class: 'ia-stage__kicker', text: `Étape ${i + 1} sur ${STEPS.length}` }),
          el('h2', { class: 'ia-stage__title', text: `${step.emoji} ${step.title}` }),
          step.subtitle ? el('p', { class: 'ia-stage__subtitle', text: step.subtitle }) : null,
        ])
      );
      const body = el('div', { class: 'ia-stage__body' });
      stage.append(body);
      cleanup = step.render(body, { goNext: () => go(i + 1) }) || null;

      prev.textContent = '← Avant';
      prev.disabled = i === 0;
      next.textContent = i === STEPS.length - 1 ? '↺ Recommencer' : 'Étape suivante →';
      next.onclick = () => go(i === STEPS.length - 1 ? 0 : i + 1);

      if (!first) stepper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    go(readStep());
  },

  unmount() {
    if (cleanup) {
      try { cleanup(); } catch { /* rien */ }
    }
    cleanup = null;
  },
};
