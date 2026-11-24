// =============================================================
//  Étape 2 — Entraîne ta propre IA (couleurs chaudes / froides)
//  Apprentissage par l'exemple, version « plus proches voisins » :
//  pour deviner une couleur, l'IA regarde les 3 exemples que tu lui
//  as donnés qui lui ressemblent le plus, et vote.
//  Lien arts plastiques : le cercle chromatique.
// =============================================================

import { el, haptic } from '../../../core/utils.js';
import { samy, keyIdea, panel } from './ui.js';

const K = 3;
const MIN_EXAMPLES = 4;
const LABELS = {
  warm: { name: 'chaude', emoji: '🔥' },
  cold: { name: 'froide', emoji: '❄️' },
};

const hsl = (h) => `hsl(${Math.round(h)} 78% 55%)`;
const randomHue = () => Math.random() * 360;
/** Distance sur le cercle chromatique (0 à 180°) */
const hueDist = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

export default {
  id: 'learn',
  emoji: '🎨',
  title: 'Entraîne ta propre IA',
  short: 'Entraîner',
  subtitle: 'Une IA apprend avec des exemples. Ici, c\'est toi le prof : apprends-lui les couleurs chaudes et froides.',

  render(root) {
    /** @type {{hue:number,label:'warm'|'cold'}[]} */
    let examples = [];
    let mode = 'train'; // 'train' | 'test'
    let hue = randomHue();
    let stats = { right: 0, wrong: 0 };

    root.append(
      samy(
        'Mon IA ne sait <strong>rien du tout</strong> au départ. Dis-lui si chaque couleur est ' +
          '<strong>chaude</strong> 🔥 ou <strong>froide</strong> ❄️. Après quelques exemples, elle essaiera de deviner toute seule !'
      )
    );

    // --- Zone principale : la couleur + les boutons ---
    const swatch = el('div', { class: 'ia-swatch', 'aria-hidden': 'true' });
    const prompt = el('p', { class: 'ia-learn__prompt' });
    const actions = el('div', { class: 'ia-learn__actions' });
    const status = el('p', { class: 'ia-learn__status', 'aria-live': 'polite' });

    // --- Cercle chromatique déplié : exemples + « cerveau » de l'IA ---
    const markers = el('div', { class: 'ia-strip__markers' });
    const brain = el('div', { class: 'ia-strip__brain' });
    for (let i = 0; i < 72; i++) brain.append(el('span'));
    const strip = el('div', { class: 'ia-strip' }, [
      el('p', { class: 'ia-strip__title', text: '📚 Les exemples que tu as donnés' }),
      markers,
      el('div', { class: 'ia-strip__hues', 'aria-hidden': 'true' }),
      el('p', { class: 'ia-strip__title', text: '🧠 Ce que ton IA a compris (sa « carte » des couleurs)' }),
      brain,
      el('div', { class: 'ia-strip__legend' }, [
        el('span', { html: '<i class="lg lg--warm"></i> elle dirait « chaude »' }),
        el('span', { html: '<i class="lg lg--cold"></i> elle dirait « froide »' }),
        el('span', { html: '<i class="lg lg--none"></i> elle ne sait pas' }),
      ]),
    ]);

    const reset = el('button', {
      class: 'ia-link', type: 'button', text: '🗑️ Effacer sa mémoire et recommencer',
      onClick: () => {
        examples = [];
        stats = { right: 0, wrong: 0 };
        mode = 'train';
        newColor();
      },
    });

    root.append(
      panel([
        el('div', { class: 'ia-learn' }, [swatch, el('div', { class: 'ia-learn__side' }, [prompt, actions, status])]),
        strip,
        reset,
      ]),
      keyIdea(
        'Une IA ne connaît <strong>que ce qu\'on lui a montré</strong>. Donne-lui peu d\'exemples, ou de mauvais ' +
          'exemples, et elle se trompera… avec assurance ! C\'est ce qu\'on appelle un <strong>biais</strong>. ' +
          'Essaie : apprends-lui exprès que le rouge est froid 😈.'
      )
    );

    function predict(h) {
      if (!examples.length) return null;
      const near = [...examples].sort((a, b) => hueDist(a.hue, h) - hueDist(b.hue, h)).slice(0, K);
      const warm = near.filter((e) => e.label === 'warm').length;
      const label = warm * 2 >= near.length ? 'warm' : 'cold';
      const votes = label === 'warm' ? warm : near.length - warm;
      return { label, confidence: Math.round((votes / near.length) * 100) };
    }

    const ready = () =>
      examples.length >= MIN_EXAMPLES &&
      examples.some((e) => e.label === 'warm') &&
      examples.some((e) => e.label === 'cold');

    function drawStrip() {
      markers.innerHTML = '';
      for (const e of examples) {
        markers.append(
          el('span', {
            class: `ia-marker ia-marker--${e.label}`,
            style: `left:${(e.hue / 360) * 100}%; --c:${hsl(e.hue)}`,
            title: `Exemple ${LABELS[e.label].name}`,
            text: LABELS[e.label].emoji,
          })
        );
      }
      [...brain.children].forEach((cell, i) => {
        const p = predict(i * 5 + 2.5);
        cell.className = !p || !ready() ? 'is-none' : `is-${p.label}`;
        cell.style.opacity = p && ready() ? 0.35 + (p.confidence / 100) * 0.65 : 1;
      });
    }

    function button(text, cls, fn) {
      return el('button', { class: `ia-choice ${cls}`, type: 'button', text, onClick: fn });
    }

    function newColor() {
      hue = randomHue();
      swatch.style.background = hsl(hue);
      swatch.classList.remove('pop');
      void swatch.offsetWidth;
      swatch.classList.add('pop');
      actions.innerHTML = '';

      if (mode === 'train') {
        prompt.innerHTML = 'Cette couleur est…';
        actions.append(
          button('🔥 Chaude', 'ia-choice--warm', () => teach('warm')),
          button('❄️ Froide', 'ia-choice--cold', () => teach('cold'))
        );
        status.textContent = ready()
          ? `${examples.length} exemples. Ton IA est prête !`
          : `${examples.length} exemple${examples.length > 1 ? 's' : ''} sur ${MIN_EXAMPLES} minimum (des chaudes ET des froides).`;
        if (ready()) {
          actions.append(button('🧪 Tester mon IA', 'ia-choice--go', () => { mode = 'test'; newColor(); }));
        }
      } else {
        const p = predict(hue);
        prompt.innerHTML = `🤖 Mon IA dit : <strong>${LABELS[p.label].emoji} ${LABELS[p.label].name}</strong> <span class="ia-conf">(sûre à ${p.confidence} %)</span>`;
        actions.append(
          button('👍 Elle a raison', 'ia-choice--ok', () => judge(true, p)),
          button('👎 Elle se trompe', 'ia-choice--ko', () => judge(false, p)),
          button('✏️ Lui apprendre encore', '', () => { mode = 'train'; newColor(); })
        );
        const total = stats.right + stats.wrong;
        status.textContent = total
          ? `Score de ton IA : ${stats.right} / ${total} bonnes réponses.`
          : 'Est-ce que ton IA a bien appris ?';
      }
      drawStrip();
    }

    function teach(label) {
      haptic(8);
      examples.push({ hue, label });
      newColor();
    }

    function judge(right, p) {
      haptic(right ? 10 : [15, 30, 15]);
      if (right) stats.right++;
      else {
        stats.wrong++;
        // Tu la corriges : la bonne réponse devient un nouvel exemple.
        examples.push({ hue, label: p.label === 'warm' ? 'cold' : 'warm' });
      }
      newColor();
      if (!right) status.textContent += ' Corrigée ! Elle a ajouté ton exemple à sa mémoire.';
    }

    newColor();
  },
};
