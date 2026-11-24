// =============================================================
//  Étape 1 — C'est quoi, une IA ?
//  Jeu de tri : « IA ou pas IA ? ». Idée clé : une IA APPREND à
//  partir d'exemples ; un programme classique suit des règles fixes.
// =============================================================

import { el, haptic } from '../../../core/utils.js';
import { samy, keyIdea, panel, shuffle } from './ui.js';

const ITEMS = [
  { emoji: '🧮', name: 'Une calculatrice', ai: false,
    why: 'Elle suit des règles de calcul écrites par des humains. Elle n\'apprend rien : 2 + 2 fera toujours 4.' },
  { emoji: '🤳', name: 'Un filtre qui te transforme en personnage de dessin animé', ai: true,
    why: 'Il a appris à reconnaître les visages en regardant des millions de photos.' },
  { emoji: '📱', name: 'Le fil « Pour toi » d\'une appli de vidéos', ai: true,
    why: 'Il apprend ce qui te fait rester et te propose encore plus de vidéos du même genre.' },
  { emoji: '⏰', name: 'Un réveil réglé sur 7 h', ai: false,
    why: 'Une seule règle : « à 7 h, sonne ». Il ne s\'adapte pas à toi.' },
  { emoji: '🌍', name: 'Un traducteur automatique', ai: true,
    why: 'Il a appris en comparant des millions de textes déjà traduits.' },
  { emoji: '🚦', name: 'Un feu rouge classique', ai: false,
    why: 'Une minuterie : vert, orange, rouge, et on recommence. Toujours pareil.' },
  { emoji: '🎙️', name: 'Un assistant qui comprend ta voix', ai: true,
    why: 'Il a appris à transformer des sons en mots en écoutant énormément d\'enregistrements.' },
];

export default {
  id: 'intro',
  emoji: '🤖',
  title: "C'est quoi, une IA ?",
  short: "C'est quoi ?",
  subtitle: 'IA = intelligence artificielle. Mais qu\'est-ce qui la rend différente d\'un programme normal ?',

  render(root) {
    root.append(
      samy(
        'Un programme normal suit des <strong>règles</strong> écrites par un humain. ' +
          'Une IA, elle, <strong>apprend toute seule à partir d\'exemples</strong>. ' +
          'À toi de trier : IA ou pas IA ?'
      )
    );

    const list = el('div', { class: 'ia-sort' });
    const score = el('p', { class: 'ia-score', 'aria-live': 'polite' });
    let answered = 0;
    let good = 0;

    for (const item of shuffle(ITEMS)) {
      const feedback = el('p', { class: 'ia-sort__why' });
      const btnAI = el('button', { class: 'ia-choice', type: 'button', text: '🤖 IA' });
      const btnNo = el('button', { class: 'ia-choice', type: 'button', text: '⚙️ Pas IA' });
      const card = el('div', { class: 'ia-sort__card' }, [
        el('span', { class: 'ia-sort__emoji', text: item.emoji, 'aria-hidden': 'true' }),
        el('span', { class: 'ia-sort__name', text: item.name }),
        el('div', { class: 'ia-sort__btns' }, [btnAI, btnNo]),
        feedback,
      ]);

      const answer = (saysAI) => {
        if (card.classList.contains('is-answered')) return;
        const ok = saysAI === item.ai;
        haptic(ok ? 10 : [20, 40, 20]);
        card.classList.add('is-answered', ok ? 'is-good' : 'is-bad');
        (saysAI ? btnAI : btnNo).classList.add('is-picked');
        btnAI.disabled = btnNo.disabled = true;
        feedback.innerHTML = `<strong>${ok ? '✅ Bien vu !' : '❌ Raté !'}</strong> ${
          item.ai ? "C'est une IA." : "Ce n'est pas une IA."
        } ${item.why}`;
        answered++;
        if (ok) good++;
        score.textContent =
          answered === ITEMS.length
            ? `Résultat : ${good} / ${ITEMS.length} ${good === ITEMS.length ? '🏆 Parfait !' : good >= 5 ? '👏 Très bien !' : '💪 Relis les explications !'}`
            : `${answered} / ${ITEMS.length} triés`;
      };
      btnAI.addEventListener('click', () => answer(true));
      btnNo.addEventListener('click', () => answer(false));
      list.append(card);
    }

    root.append(
      panel([list, score]),
      keyIdea(
        'Une IA n\'est pas magique et elle ne « pense » pas. C\'est un programme qui a ' +
          '<strong>repéré des régularités</strong> dans une montagne d\'exemples. ' +
          'Dans l\'étape suivante, c\'est <strong>toi</strong> qui vas entraîner une IA.'
      )
    );
  },
};
