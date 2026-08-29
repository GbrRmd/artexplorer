// =============================================================
//  Bootstrap d'ArtExplorer
//  1. Applique le thème (avant rendu, évite le flash)
//  2. Enregistre les modules pédagogiques
//  3. Démarre le shell
//
//  Ajouter un bloc = importer son module + registry.register(...)
// =============================================================

import { initTheme } from './core/theme.js';
import { register } from './core/registry.js';
import { initShell } from './core/shell.js';

// --- Modules pédagogiques (l'ordre = ordre dans la navigation) ---
import gallery from './modules/gallery/index.js';
import ia from './modules/ia/index.js';

initTheme();

register(gallery);
register(ia);

// Démarre une fois le DOM prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShell);
} else {
  initShell();
}
