// =============================================================
//  MODULE 2 — Comprendre l'IA
//  Placeholder pour l'instant : prouve que le système multi-modules
//  fonctionne. Sera développé en Phase 5 (tokenizer, frise,
//  panorama des acteurs, calculateur d'impact, quiz).
// =============================================================

import { el } from '../../core/utils.js';

const ICON = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M9 4h6"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>`;

export default {
  id: 'ia',
  title: "Comprendre l'IA",
  icon: ICON,
  description: "Comment fonctionne l'intelligence artificielle",

  async mount(container) {
    container.append(
      el('div', { class: 'placeholder' }, [
        el('div', { class: 'placeholder__emoji', text: '🤖' }),
        el('h2', { text: "Comprendre l'IA — bientôt" }),
        el('p', {
          text: "Ce bloc arrivera après la galerie : labo de tokenisation, frise du temps, panorama des géants de l'IA, calculateur d'impact et quiz.",
        }),
      ])
    );
  },
};
