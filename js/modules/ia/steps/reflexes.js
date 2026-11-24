// =============================================================
//  Étape 6 — Mes bons réflexes + défi créatif
//  Cartes à retourner (tap) : chaque réflexe et son « pourquoi ».
// =============================================================

import { el, haptic } from '../../../core/utils.js';
import { samy, keyIdea } from './ui.js';

const CARDS = [
  { emoji: '🔍', title: 'Je vérifie', back: 'Une IA peut se tromper ou inventer. Je compare avec une 2e source fiable avant de croire ou de partager.' },
  { emoji: '🔒', title: 'Je me protège', back: 'Jamais de nom, adresse, photo, mot de passe ou secret dans un chatbot.' },
  { emoji: '🏷️', title: 'Je le dis', back: 'Si une IA m\'a aidé, je l\'indique, comme je cite une source. C\'est une question d\'honnêteté.' },
  { emoji: '🎨', title: 'Je reste l\'artiste', back: 'L\'IA peut donner des idées, mais le regard, les choix et l\'émotion viennent de moi.' },
  { emoji: '🌱', title: 'J\'économise', back: 'Chaque demande consomme de l\'énergie. Pas besoin d\'une IA pour ce que je sais faire moi-même.' },
  { emoji: '🧠', title: 'Je garde mon cerveau', back: 'Si l\'IA fait tout à ma place, je n\'apprends rien. Je m\'en sers pour comprendre, pas pour copier.' },
];

export default {
  id: 'reflexes',
  emoji: '✅',
  title: 'Mes bons réflexes',
  short: 'Réflexes',
  subtitle: 'L\'IA est un outil puissant. Voici comment bien t\'en servir.',

  render(root) {
    root.append(samy('Touche chaque carte pour la retourner. Combien de réflexes as-tu déjà ?'));

    const counter = el('p', { class: 'ia-score', 'aria-live': 'polite' });
    const seen = new Set();
    const grid = el('div', { class: 'ia-flips' });

    CARDS.forEach((c, i) => {
      const card = el('button', {
        class: 'ia-flip', type: 'button', style: `--i:${i}`,
        'aria-label': `${c.title} : ${c.back}`,
        'aria-pressed': 'false',
      }, [
        el('span', { class: 'ia-flip__inner' }, [
          el('span', { class: 'ia-flip__face ia-flip__front' }, [
            el('span', { class: 'ia-flip__emoji', text: c.emoji, 'aria-hidden': 'true' }),
            el('span', { class: 'ia-flip__title', text: c.title }),
            el('span', { class: 'ia-flip__hint', text: 'Touche-moi', 'aria-hidden': 'true' }),
          ]),
          el('span', { class: 'ia-flip__face ia-flip__back', text: c.back }),
        ]),
      ]);
      card.addEventListener('click', () => {
        haptic(8);
        const on = card.classList.toggle('is-flipped');
        card.setAttribute('aria-pressed', String(on));
        seen.add(i);
        counter.textContent =
          seen.size === CARDS.length ? '🎉 Tu connais les 6 réflexes !' : `${seen.size} / ${CARDS.length} réflexes découverts`;
      });
      grid.append(card);
    });
    counter.textContent = `0 / ${CARDS.length} réflexes découverts`;

    root.append(
      grid,
      counter,
      el('div', { class: 'glass ia-panel ia-challenge' }, [
        el('h3', { text: '🎯 Défi arts plastiques' }),
        el('p', { html: 'Va dans la <strong>Galerie</strong>, choisis une œuvre et décris-la en <strong>une seule phrase</strong>, comme un « prompt » pour une IA d\'images.' }),
        el('p', { html: 'Puis fais l\'inverse : <strong>dessine-la toi-même</strong> en 5 minutes, sans la regarder. Compare : qu\'est-ce que ta phrase a oublié ? Qu\'est-ce que ton dessin raconte que l\'IA ne pourrait pas savoir ?' }),
        el('a', { class: 'btn', href: '#gallery', text: '🖼️ Aller à la Galerie' }),
      ]),
      keyIdea('Une IA, c\'est comme un pinceau très bizarre : <strong>ce qui compte, c\'est la main et la tête de celui ou celle qui s\'en sert</strong>.')
    );
  },
};
