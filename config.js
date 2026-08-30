// =============================================================
//  Configuration globale d'ArtExplorer
//  (Ce fichier est versionné : les clés Firebase Web sont
//   publiques par nature, la sécurité repose sur les
//   Firestore Security Rules — voir README.)
// =============================================================

export const CONFIG = {
  // --- Firebase (branché en Phase 3) ---
  firebase: {
    enabled: false, // passe à true quand la base est prête
    apiKey: 'TODO',
    authDomain: 'TODO.firebaseapp.com',
    projectId: 'TODO',
    storageBucket: 'TODO.appspot.com',
    messagingSenderId: 'TODO',
    appId: 'TODO',
  },

  // --- Cloudinary (branché en Phase 4) ---
  cloudinary: {
    cloudName: 'TODO',
    // Transformation par défaut appliquée aux images de la galerie
    // (WebP auto, qualité auto, largeur adaptative)
    defaultTransform: 'f_auto,q_auto,w_800',
    thumbTransform: 'f_auto,q_auto,w_400',
  },

  // --- Données ---
  data: {
    // Catalogue servi en statique par GitHub Pages, édité via /admin/.
    // Lu par js/core/catalog.js (réseau + secours local, meta dérivée).
    catalog: 'assets/data/artworks.json',
  },

  // --- Dépôt (utilisé par la page d'administration /admin/) ---
  repo: {
    owner: 'GbrRmd',
    name: 'artexplorer',
    branch: 'main',
    dataPath: 'assets/data/artworks.json',
  },

  // --- Préférences d'expérience ---
  ux: {
    soundEnabled: false, // coupé par défaut (environnement CDI silencieux)
    hapticsEnabled: true, // vibration mobile sur actions clés
  },
};
