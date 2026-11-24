// =============================================================
//  Étape 4 — Comment une IA fabrique une image
//  Simulation du principe de « diffusion » : on part d'un bruit
//  (neige de télé) et, étape après étape, on enlève du bruit en se
//  laissant guider par la phrase. Ici l'image cible est dessinée
//  par le code : c'est une maquette du MÉCANISME, pas une vraie IA.
// =============================================================

import { el, haptic, prefersReducedMotion } from '../../../core/utils.js';
import { samy, keyIdea, panel } from './ui.js';

const SIZE = 96; // résolution de travail (agrandie en CSS, effet pixel)
const STEPS = 30;

// --- Dessins cibles (ce que « l'IA » est censée faire émerger) ---
const SCENES = {
  sunset: {
    label: '🌅 un coucher de soleil sur la mer des Caraïbes',
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, 60);
      g.addColorStop(0, '#2b1055'); g.addColorStop(0.55, '#d53369'); g.addColorStop(1, '#ffb347');
      c.fillStyle = g; c.fillRect(0, 0, SIZE, 62);
      c.fillStyle = '#ffe066'; c.beginPath(); c.arc(48, 58, 16, 0, Math.PI * 2); c.fill();
      const s = c.createLinearGradient(0, 60, 0, SIZE);
      s.addColorStop(0, '#0f4c81'); s.addColorStop(1, '#06223d');
      c.fillStyle = s; c.fillRect(0, 60, SIZE, SIZE - 60);
      c.fillStyle = 'rgba(255,224,102,.75)';
      for (let y = 64; y < 90; y += 5) c.fillRect(48 - (90 - y) / 3, y, ((90 - y) / 3) * 2, 2);
      // palmier
      c.strokeStyle = '#1a1022'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(14, 96); c.quadraticCurveTo(18, 60, 12, 36); c.stroke();
      c.fillStyle = '#1a1022';
      for (const a of [-2.6, -2.0, -1.2, -0.5, 0.2]) {
        c.beginPath(); c.ellipse(12 + Math.cos(a) * 10, 36 + Math.sin(a) * 6, 12, 3, a, 0, Math.PI * 2); c.fill();
      }
    },
  },
  volcano: {
    label: '🌋 un volcan sous un ciel étoilé',
    draw(c) {
      c.fillStyle = '#0b1033'; c.fillRect(0, 0, SIZE, SIZE);
      c.fillStyle = '#fff';
      for (let i = 0; i < 40; i++) c.fillRect((i * 37) % SIZE, (i * 53) % 55, 1.5, 1.5);
      c.fillStyle = '#f5f3c1'; c.beginPath(); c.arc(76, 18, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#0b1033'; c.beginPath(); c.arc(80, 15, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2e5e3a';
      c.beginPath(); c.moveTo(-5, 96); c.lineTo(38, 40); c.lineTo(58, 40); c.lineTo(101, 96); c.fill();
      c.fillStyle = '#9aa0a6';
      for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(46 + i * 4, 32 - i * 7, 6 + i * 2, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#1d3b25'; c.fillRect(0, 86, SIZE, 10);
    },
  },
  matisse: {
    label: '✂️ des formes découpées façon Matisse',
    draw(c) {
      c.fillStyle = '#f4efe1'; c.fillRect(0, 0, SIZE, SIZE);
      c.fillStyle = '#e94b35'; c.fillRect(0, 0, 48, 48);
      c.fillStyle = '#1f4fa3';
      c.beginPath(); c.arc(30, 22, 8, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(30, 52, 10, 18, 0.2, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(18, 70, 18, 7, -0.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(44, 74, 16, 6, 0.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2f9e5b';
      for (let i = 0; i < 5; i++) {
        c.beginPath(); c.ellipse(74, 20 + i * 15, 14 - i, 5, (i % 2 ? 0.6 : -0.6), 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#ffcc33'; c.beginPath(); c.arc(74, 82, 8, 0, Math.PI * 2); c.fill();
    },
  },
};

export default {
  id: 'images',
  emoji: '🖼️',
  title: 'Comment une IA fabrique une image',
  short: 'Images',
  subtitle: 'Une IA d\'images ne peint pas comme toi. Elle part du chaos et le range petit à petit.',

  render(root) {
    root.append(
      samy(
        'Une IA d\'images commence avec de la <strong>« neige » de télé</strong> (du bruit au hasard). ' +
          'Puis, étape après étape, elle <strong>enlève un peu de bruit</strong> en se demandant : ' +
          '« à quoi ressemblerait cette phrase ? ». Choisis une phrase et lance la machine !'
      )
    );

    // Canevas cible (caché) + canevas affiché
    const target = document.createElement('canvas');
    target.width = target.height = SIZE;
    const tctx = target.getContext('2d', { willReadFrequently: true });
    const view = el('canvas', { class: 'ia-canvas', width: SIZE, height: SIZE, role: 'img', 'aria-label': 'Image en cours de fabrication' });
    const vctx = view.getContext('2d');

    // Bruit fixe (le « point de départ » au hasard)
    let noise = new Uint8ClampedArray(SIZE * SIZE * 4);
    const reseed = () => {
      noise = new Uint8ClampedArray(SIZE * SIZE * 4);
      for (let i = 0; i < noise.length; i += 4) {
        const v = Math.random() * 255;
        noise[i] = v * (0.6 + Math.random() * 0.4);
        noise[i + 1] = v * (0.6 + Math.random() * 0.4);
        noise[i + 2] = v * (0.6 + Math.random() * 0.4);
        noise[i + 3] = 255;
      }
    };
    reseed();

    let sceneKey = 'sunset';
    let step = 0;
    let timer = null;
    let tdata = null;

    const slider = el('input', {
      class: 'ia-range', type: 'range', min: '0', max: String(STEPS), step: '1', value: '0',
      'aria-label': 'Étape de débruitage',
    });
    const stepLabel = el('p', { class: 'ia-img__step', 'aria-live': 'polite' });
    const play = el('button', { class: 'btn', type: 'button', text: '▶️ Lancer la machine' });
    const again = el('button', { class: 'ia-link', type: 'button', text: '🎲 Nouveau bruit de départ' });

    const promptBtns = Object.entries(SCENES).map(([key, s]) =>
      el('button', {
        class: 'ia-choice', type: 'button', text: s.label, 'aria-pressed': String(key === sceneKey),
        onClick: () => {
          sceneKey = key;
          promptBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === promptBtnFor(key))));
          loadScene();
          setStep(0);
        },
      })
    );
    const promptBtnFor = (key) => promptBtns[Object.keys(SCENES).indexOf(key)];

    function loadScene() {
      tctx.clearRect(0, 0, SIZE, SIZE);
      SCENES[sceneKey].draw(tctx);
      tdata = tctx.getImageData(0, 0, SIZE, SIZE).data;
    }

    /** Image au pas s : mélange bruit / cible, de plus en plus nette. */
    function render(s) {
      const a = s / STEPS; // 0 = bruit pur, 1 = image finie
      const ease = a * a * (3 - 2 * a);
      // Les grandes formes apparaissent d'abord, les détails à la fin
      const block = Math.max(1, Math.round(16 * (1 - a) ** 2));
      const out = vctx.createImageData(SIZE, SIZE);
      const o = out.data;
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const i = (y * SIZE + x) * 4;
          const bx = Math.min(SIZE - 1, Math.floor(x / block) * block + (block >> 1));
          const by = Math.min(SIZE - 1, Math.floor(y / block) * block + (block >> 1));
          const j = (by * SIZE + bx) * 4;
          for (let k = 0; k < 3; k++) o[i + k] = tdata[j + k] * ease + noise[i + k] * (1 - ease);
          o[i + 3] = 255;
        }
      }
      vctx.putImageData(out, 0, 0);
    }

    function setStep(s) {
      step = s;
      slider.value = String(s);
      render(s);
      stepLabel.innerHTML =
        s === 0
          ? 'Étape 0 : <strong>que du bruit</strong>, aucune image.'
          : s < STEPS * 0.4
            ? `Étape ${s} / ${STEPS} : des <strong>taches de couleur</strong> apparaissent.`
            : s < STEPS
              ? `Étape ${s} / ${STEPS} : les <strong>formes</strong> se précisent.`
              : `Étape ${STEPS} / ${STEPS} : <strong>image terminée</strong> ! 🎉`;
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      play.textContent = '▶️ Lancer la machine';
    }

    play.addEventListener('click', () => {
      haptic(10);
      if (timer) return stop();
      if (prefersReducedMotion()) return setStep(STEPS);
      if (step >= STEPS) setStep(0);
      play.textContent = '⏸️ Pause';
      timer = setInterval(() => {
        if (step >= STEPS) return stop();
        setStep(step + 1);
      }, 140);
    });
    slider.addEventListener('input', () => {
      stop();
      setStep(Number(slider.value));
    });
    again.addEventListener('click', () => {
      stop();
      reseed();
      setStep(0);
    });

    loadScene();
    setStep(0);

    root.append(
      panel([
        el('p', { class: 'ia-label', text: '✍️ Ta phrase pour l\'IA (le « prompt ») :' }),
        el('div', { class: 'ia-row ia-row--wrap' }, promptBtns),
        el('div', { class: 'ia-img' }, [
          view,
          el('div', { class: 'ia-img__side' }, [stepLabel, slider, el('div', { class: 'ia-row' }, [play, again])]),
        ]),
        el('p', { class: 'ia-note', text: 'Maquette simplifiée : ici l\'image finale est dessinée par le code. Une vraie IA, elle, a appris à quoi ressemblent les choses en analysant des millions d\'images.' }),
      ]),
      panel([
        el('h3', { class: 'ia-debate__title', text: '🗣️ On en débat en classe' }),
        el('p', { html: 'Pour apprendre, les IA d\'images ont « regardé » des millions d\'œuvres et de photos, souvent <strong>sans demander leur avis aux artistes</strong>.' }),
        el('ul', { class: 'ia-debate__list' }, [
          el('li', { text: '🤔 Si une IA imite le style de Matisse, qui est l\'artiste : Matisse, l\'IA ou toi ?' }),
          el('li', { text: '🎨 Une image faite en 5 secondes a-t-elle la même valeur qu\'une œuvre faite à la main ?' }),
          el('li', { text: '⚖️ Les artistes devraient-ils pouvoir refuser que leurs œuvres servent à entraîner une IA ?' }),
        ]),
      ], 'ia-debate'),
      keyIdea(
        'Une IA d\'images <strong>recompose</strong> ce qu\'elle a vu pendant son apprentissage. Elle ne voit pas le monde, ' +
          'elle n\'a pas d\'intention, pas d\'émotion. <strong>L\'idée, le regard et le choix</strong>, c\'est toi l\'artiste.'
      )
    );

    return stop;
  },
};
