// =============================================================
//  Média d'une œuvre : markup image + repli visuel cohérent
//  entre la carte et la modale. Gère le chargement/erreur.
// =============================================================

/** Échappe le texte pour l'insérer en attribut HTML */
function esc(s = '') {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  );
}

/** Renvoie le markup (image + emoji de repli) d'une œuvre */
export function mediaMarkup(art, { size = 'card' } = {}) {
  const alt = esc(`${art.title} — ${art.artist}`);
  const loading = size === 'large' ? 'eager' : 'lazy';
  // Fond flouté (grande image seulement) : quand l'œuvre ne remplit pas
  // tout le cadre, le pourtour est un prolongement flou de l'œuvre plutôt
  // qu'une couleur plate ambiguë.
  const backdrop =
    size === 'large'
      ? `<div class="modal__media-bg" style="background-image:url('${esc(art.imageUrl)}')"></div>`
      : '';
  // Le repli est placé DERRIÈRE l'image : visible pendant le chargement
  // ou en cas d'erreur, mais recouvert dès que l'image est chargée.
  return (
    backdrop +
    `<div class="artcard__fallback" aria-hidden="true">🖼️</div>` +
    `<img class="artcard__img" src="${esc(art.imageUrl)}" alt="${alt}" loading="${loading}" decoding="async" />`
  );
}

/** Branche le fondu au chargement et le repli en cas d'erreur */
export function wireImage(scope) {
  scope.querySelectorAll('.artcard__img').forEach((img) => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
      return;
    }
    img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
    img.addEventListener(
      'error',
      () => {
        // laisse le repli (couleur dominante + emoji) visible
        img.remove();
      },
      { once: true }
    );
  });
}
