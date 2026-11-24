// =============================================================
//  Étape 3 — Comment un chatbot écrit
//  A. Le découpage en « morceaux » (tokens) puis en nombres.
//  B. « Devine le mot suivant » : un chatbot choisit, mot après mot,
//     une suite PROBABLE. Curseur « imagination » = température.
//  Les probabilités sont inventées pour l'exemple (dit à l'élève).
// =============================================================

import { el, haptic } from '../../../core/utils.js';
import { samy, keyIdea, panel } from './ui.js';

// ---------- A. Découpage en morceaux (approximation pédagogique) ----------
function tokenize(text) {
  const out = [];
  const parts = text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
  for (const w of parts) {
    if (w.length <= 5) {
      out.push(w);
      continue;
    }
    // Mot long : coupé en morceaux de 3-4 lettres (comme les vrais
    // découpeurs, qui gardent entiers les mots fréquents).
    let i = 0;
    while (i < w.length) {
      const rest = w.length - i;
      const size = rest <= 5 ? rest : 4;
      out.push(w.slice(i, i + size));
      i += size;
    }
  }
  return out;
}
/** Numéro stable d'un morceau (comme l'IA, qui ne voit que des nombres) */
function tokenId(t) {
  let h = 7;
  for (const c of t.toLowerCase()) h = (h * 31 + c.codePointAt(0)) % 50000;
  return h;
}

// ---------- B. Mini « modèle de langue » (chiffres inventés) ----------
const START = 'Au musée, j\'ai vu un';
const NEXT = {
  un: { tableau: 40, dinosaure: 20, gardien: 15, squelette: 12, chat: 8, nuage: 5 },
  tableau: { immense: 35, de: 35, bizarre: 18, qui: 12 },
  dinosaure: { immense: 45, qui: 30, bizarre: 25 },
  gardien: { qui: 55, bizarre: 25, immense: 20 },
  squelette: { immense: 45, de: 30, qui: 25 },
  chat: { qui: 55, bizarre: 45 },
  nuage: { qui: 60, bizarre: 40 },
  de: { 'Van Gogh': 40, 'Frida Kahlo': 25, Matisse: 20, dinosaure: 15 },
  'Van Gogh': { '.': 55, qui: 30, et: 15 },
  'Frida Kahlo': { '.': 55, qui: 30, et: 15 },
  Matisse: { '.': 55, qui: 30, et: 15 },
  immense: { '.': 50, qui: 30, et: 20 },
  bizarre: { '.': 50, qui: 30, et: 20 },
  qui: { brillait: 30, souriait: 28, dansait: 22, chantait: 15, 'mangeait une pizza': 5 },
  brillait: { '.': 70, et: 30 },
  souriait: { '.': 70, et: 30 },
  dansait: { '.': 65, et: 35 },
  chantait: { '.': 65, et: 35 },
  'mangeait une pizza': { '.': 80, et: 20 },
  et: { 'j\'ai pris une photo': 40, 'j\'ai rigolé': 35, 'le gardien a éternué': 25 },
  'j\'ai pris une photo': { '.': 100 },
  'j\'ai rigolé': { '.': 100 },
  'le gardien a éternué': { '.': 100 },
};

/** Applique la « température » : < 1 = sage, > 1 = farfelu */
function withTemperature(probs, t) {
  const entries = Object.entries(probs).map(([w, p]) => [w, Math.pow(p, 1 / t)]);
  const sum = entries.reduce((s, [, p]) => s + p, 0);
  return entries.map(([w, p]) => ({ word: w, p: p / sum })).sort((a, b) => b.p - a.p);
}

export default {
  id: 'words',
  emoji: '💬',
  title: 'Comment un chatbot écrit',
  short: 'Chatbot',
  subtitle: 'ChatGPT, Le Chat, Gemini… Ils ont l\'air de parler. En vrai, ils jouent à « devine le mot suivant ».',

  render(root) {
    // ===== A. Tokens =====
    root.append(
      samy(
        'D\'abord, un chatbot ne lit pas des mots comme toi. Il coupe ton texte en <strong>petits morceaux</strong>, ' +
          'puis transforme chaque morceau en <strong>nombre</strong>. Écris une phrase pour voir !'
      )
    );

    const input = el('input', {
      class: 'ia-input',
      type: 'text',
      value: 'Les Nymphéas de Monet sont magnifiques !',
      maxlength: '120',
      'aria-label': 'Écris une phrase',
      autocomplete: 'off',
    });
    const chips = el('div', { class: 'ia-tokens', 'aria-live': 'polite' });
    const info = el('p', { class: 'ia-tokens__info' });
    let asNumbers = false;
    const toggle = el('button', {
      class: 'ia-choice', type: 'button', 'aria-pressed': 'false',
      text: '🔢 Voir comme l\'IA',
      onClick: () => {
        asNumbers = !asNumbers;
        toggle.setAttribute('aria-pressed', String(asNumbers));
        toggle.textContent = asNumbers ? '🔤 Voir les morceaux' : '🔢 Voir comme l\'IA';
        drawTokens();
      },
    });

    function drawTokens() {
      const toks = tokenize(input.value);
      chips.innerHTML = '';
      toks.forEach((t, i) =>
        chips.append(
          el('span', {
            class: 'ia-token',
            style: `--h:${(i * 47) % 360}; --i:${i}`,
            text: asNumbers ? String(tokenId(t)) : t,
          })
        )
      );
      const words = (input.value.match(/[\p{L}\p{N}]+/gu) || []).length;
      info.innerHTML = toks.length
        ? `<strong>${words}</strong> mot${words > 1 ? 's' : ''} → <strong>${toks.length}</strong> morceaux.`
        : 'Écris quelque chose…';
    }
    input.addEventListener('input', drawTokens);
    drawTokens();

    root.append(
      panel([
        el('label', { class: 'ia-label', text: '✍️ Ta phrase' }),
        input,
        chips,
        el('div', { class: 'ia-row' }, [info, toggle]),
        el('p', { class: 'ia-note', text: 'Découpage simplifié pour l\'exemple : les vrais chatbots utilisent des milliers de morceaux appris à l\'avance.' }),
      ])
    );

    // ===== B. Mot suivant =====
    root.append(
      samy(
        'Ensuite, il calcule quel morceau a le plus de chances de venir <strong>après</strong>. ' +
          'Construis une phrase avec lui : choisis toi-même, ou laisse l\'IA tirer au sort selon les chances.'
      )
    );

    let sentence = [];
    let temperature = 1;
    const sentenceEl = el('p', { class: 'ia-sentence', 'aria-live': 'polite' });
    const options = el('div', { class: 'ia-probs' });
    const tempLabel = el('span', { class: 'ia-temp__value' });
    const slider = el('input', {
      class: 'ia-range', type: 'range', min: '0.3', max: '3', step: '0.1', value: '1',
      'aria-label': 'Imagination de l\'IA (température)',
    });
    slider.addEventListener('input', () => {
      temperature = Number(slider.value);
      drawNext();
    });

    const auto = el('button', { class: 'btn ia-auto', type: 'button', text: '🎲 Laisse l\'IA choisir' });
    const restart = el('button', { class: 'ia-link', type: 'button', text: '↺ Recommencer la phrase' });

    const lastWord = () => sentence.length ? sentence[sentence.length - 1] : 'un';
    const done = () => lastWord() === '.';

    function drawNext() {
      const t = temperature;
      tempLabel.textContent =
        t < 0.7 ? '😐 très sage' : t <= 1.3 ? '🙂 normale' : t <= 2.2 ? '🤪 farfelue' : '🌀 n\'importe quoi';

      const text = [START, ...sentence].join(' ').replace(/ \./, '.');
      sentenceEl.innerHTML = `${text}${done() ? '' : ' <span class="ia-caret">▍</span>'}`;

      options.innerHTML = '';
      auto.disabled = done();
      if (done()) {
        options.append(el('p', { class: 'ia-done', text: '✅ Phrase terminée ! L\'IA n\'a rien « compris » : elle a juste enchaîné les suites les plus probables.' }));
        return;
      }
      for (const { word, p } of withTemperature(NEXT[lastWord()], t)) {
        const pct = Math.round(p * 100);
        options.append(
          el('button', {
            class: 'ia-prob', type: 'button', style: `--p:${pct}%`,
            'aria-label': `${word === '.' ? 'point final' : word} : ${pct} % de chances`,
            onClick: () => pick(word),
          }, [
            el('span', { class: 'ia-prob__word', text: word === '.' ? '• (point final)' : word }),
            el('span', { class: 'ia-prob__pct', text: `${pct} %` }),
          ])
        );
      }
    }

    function pick(word) {
      haptic(8);
      sentence.push(word);
      if (sentence.length > 10 && !done()) sentence.push('.');
      drawNext();
    }

    auto.addEventListener('click', () => {
      if (done()) return;
      const probs = withTemperature(NEXT[lastWord()], temperature);
      let r = Math.random();
      const choice = probs.find((o) => (r -= o.p) <= 0) || probs[probs.length - 1];
      pick(choice.word);
    });
    restart.addEventListener('click', () => {
      sentence = [];
      drawNext();
    });
    drawNext();

    root.append(
      panel([
        sentenceEl,
        el('p', { class: 'ia-label', text: '🎯 Les suites possibles et leurs chances' }),
        options,
        el('div', { class: 'ia-temp' }, [
          el('label', { class: 'ia-label', text: '🌡️ Imagination de l\'IA : ' }, [tempLabel]),
          slider,
        ]),
        el('div', { class: 'ia-row' }, [auto, restart]),
        el('p', { class: 'ia-note', text: 'Pourcentages inventés pour l\'exemple. Un vrai chatbot hésite entre des dizaines de milliers de morceaux à chaque fois !' }),
      ]),
      keyIdea(
        'Un chatbot écrit <strong>un morceau à la fois</strong>, en choisissant une suite <strong>probable</strong>. ' +
          'Il ne vérifie pas si c\'est vrai. C\'est pour ça qu\'il peut inventer des choses fausses avec un ton très sûr de lui ' +
          '(on appelle ça une <strong>hallucination</strong>).'
      )
    );
  },
};
