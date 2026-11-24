// =============================================================
//  Étape 5 — Vrai ou faux ? (esprit critique)
//  Une question à la fois, réponse immédiate + explication.
// =============================================================

import { el, haptic } from '../../../core/utils.js';
import { samy, panel, shuffle } from './ui.js';

const QUESTIONS = [
  { q: 'Un chatbot comprend ce qu\'il dit, comme toi.', a: false,
    why: 'Il calcule la suite de mots la plus probable. Il n\'a ni pensées, ni souvenirs, ni sentiments.' },
  { q: 'Une IA peut inventer une information fausse, avec beaucoup d\'assurance.', a: true,
    why: 'Oui ! C\'est une « hallucination ». Vérifie toujours avec une deuxième source fiable (manuel, site officiel, prof).' },
  { q: 'Si une image est très réaliste, c\'est forcément une vraie photo.', a: false,
    why: 'Les IA fabriquent des images très réalistes. Indices : mains bizarres, texte illisible, reflets ou ombres impossibles… et surtout : qui a publié l\'image ?' },
  { q: 'Une IA peut reproduire des préjugés (sur les filles, les garçons, les couleurs de peau…).', a: true,
    why: 'Elle apprend sur des textes et images faits par des humains. Si ces exemples contiennent des préjugés, l\'IA les répète.' },
  { q: 'Je peux donner mon nom, mon adresse et ma photo à un chatbot sans risque.', a: false,
    why: 'Ce que tu écris peut être stocké et réutilisé. Ne partage jamais d\'informations personnelles.' },
  { q: 'Utiliser une IA consomme de l\'électricité et de l\'eau.', a: true,
    why: 'Les IA tournent sur d\'énormes ordinateurs (des « centres de données ») qui consomment beaucoup d\'énergie et qu\'il faut refroidir, souvent avec de l\'eau.' },
  { q: 'Si j\'utilise une IA pour un devoir ou une création, je n\'ai pas besoin de le dire.', a: false,
    why: 'Être honnête, c\'est dire quels outils tu as utilisés, comme quand tu cites une source.' },
  { q: 'Une IA peut se tromper en reconnaissant une œuvre ou un artiste.', a: true,
    why: 'Elle peut confondre deux peintres au style proche, ou inventer un titre. Ton œil et tes recherches restent indispensables.' },
];

export default {
  id: 'quiz',
  emoji: '🕵️',
  title: 'Vrai ou faux ?',
  short: 'Quiz',
  subtitle: 'Deviens détective de l\'IA : démêle le vrai du faux.',

  render(root) {
    root.append(samy('8 affirmations. À toi de dire si c\'est <strong>vrai</strong> ou <strong>faux</strong>. Pas de piège… enfin, presque 😏.'));

    const box = el('div', { class: 'ia-quiz' });
    root.append(panel([box]));

    let order = [];
    let idx = 0;
    let score = 0;

    function start() {
      order = shuffle(QUESTIONS);
      idx = 0;
      score = 0;
      show();
    }

    function show() {
      box.innerHTML = '';
      if (idx >= order.length) return end();
      const item = order[idx];
      const why = el('div', { class: 'ia-quiz__why', 'aria-live': 'polite' });
      const bTrue = el('button', { class: 'ia-choice ia-choice--big ia-choice--ok', type: 'button', text: '👍 Vrai' });
      const bFalse = el('button', { class: 'ia-choice ia-choice--big ia-choice--ko', type: 'button', text: '👎 Faux' });
      const nextBtn = el('button', {
        class: 'btn', type: 'button', hidden: true,
        text: idx === order.length - 1 ? 'Voir mon score 🏁' : 'Question suivante →',
        onClick: () => { idx++; show(); },
      });

      const answer = (val) => {
        const ok = val === item.a;
        haptic(ok ? 10 : [20, 40, 20]);
        if (ok) score++;
        bTrue.disabled = bFalse.disabled = true;
        (val ? bTrue : bFalse).classList.add('is-picked');
        box.classList.remove('is-good', 'is-bad');
        void box.offsetWidth;
        box.classList.add(ok ? 'is-good' : 'is-bad');
        why.innerHTML = `<strong>${ok ? '✅ Exact !' : '❌ Eh non !'} C'est ${item.a ? 'VRAI' : 'FAUX'}.</strong> ${item.why}`;
        nextBtn.hidden = false;
        nextBtn.focus();
      };
      bTrue.addEventListener('click', () => answer(true));
      bFalse.addEventListener('click', () => answer(false));

      box.append(
        el('div', { class: 'ia-quiz__progress' }, [
          el('span', { text: `Question ${idx + 1} / ${order.length}` }),
          el('span', { text: `⭐ ${score}` }),
        ]),
        el('div', { class: 'ia-quiz__dots', 'aria-hidden': 'true' },
          order.map((_, k) => el('i', { class: k < idx ? 'is-past' : k === idx ? 'is-now' : '' }))),
        el('p', { class: 'ia-quiz__q', text: `« ${item.q} »` }),
        el('div', { class: 'ia-row ia-row--center' }, [bTrue, bFalse]),
        why,
        el('div', { class: 'ia-row ia-row--center' }, [nextBtn])
      );
    }

    function end() {
      const n = order.length;
      const [emoji, msg] =
        score === n ? ['🏆', 'Score parfait ! Rien ne t\'échappe, détective.']
          : score >= n - 2 ? ['🥇', 'Excellent ! Tu as l\'esprit critique bien aiguisé.']
            : score >= n / 2 ? ['👍', 'Pas mal ! Relis les explications et retente ta chance.']
              : ['💪', 'L\'IA a gagné cette manche. Rejoue, tu vas progresser !'];
      box.append(
        el('div', { class: 'ia-quiz__end' }, [
          el('div', { class: 'ia-quiz__trophy', text: emoji, 'aria-hidden': 'true' }),
          el('p', { class: 'ia-quiz__score', html: `<strong>${score}</strong> / ${n}` }),
          el('p', { text: msg }),
          el('button', { class: 'btn', type: 'button', text: '↺ Rejouer', onClick: start }),
        ])
      );
    }

    start();
  },
};
