// =============================================================
//  Registre de modules — le "hub" d'extension d'ArtExplorer.
//
//  Chaque module pédagogique implémente ce contrat :
//    {
//      id: string,            // identifiant unique (ex: 'gallery')
//      title: string,         // libellé affiché dans la nav
//      icon: string,          // markup SVG de l'icône
//      description: string,
//      mount(container),      // (async) rend le module dans container
//      unmount()              // (optionnel) nettoyage au changement de module
//    }
//
//  Ajouter un bloc pédagogique = register(monModule). Rien d'autre.
// =============================================================

const modules = [];

export function register(module) {
  if (!module || !module.id || typeof module.mount !== 'function') {
    throw new Error('Module invalide : id et mount() sont requis.');
  }
  if (modules.some((m) => m.id === module.id)) {
    throw new Error(`Module déjà enregistré : ${module.id}`);
  }
  modules.push(module);
}

export function getModules() {
  return [...modules];
}

export function getModule(id) {
  return modules.find((m) => m.id === id) || null;
}
