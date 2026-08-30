// =============================================================
//  Périodes historiques de l'art (repères pour collégiens).
//  Bornes simplifiées volontairement (pédagogie, pas thèse).
//  Chaque période a une couleur pour la frise chronologique.
// =============================================================

export const PERIODS = [
  { id: 'prehistoire', name: 'Préhistoire', from: -40000, to: -3000, color: '#6d5b4f', dates: 'avant −3000' },
  { id: 'antiquite', name: 'Antiquité', from: -3000, to: 476, color: '#c19a2e', dates: '−3000 → 476' },
  { id: 'moyen-age', name: 'Moyen Âge', from: 476, to: 1400, color: '#6a4fa3', dates: '476 → 1400' },
  { id: 'renaissance', name: 'Renaissance', from: 1400, to: 1600, color: '#2f9070', dates: '1400 → 1600' },
  { id: 'classique', name: 'Époque classique', from: 1600, to: 1800, color: '#c0563f', dates: '1600 → 1800' },
  { id: 'moderne', name: 'Époque moderne', from: 1800, to: 1945, color: '#2f7fb8', dates: '1800 → 1945' },
  { id: 'contemporain', name: 'Art contemporain', from: 1945, to: 2100, color: '#d64f8a', dates: 'depuis 1945' },
];

/** Indice de la période contenant une année. */
export function periodIndex(year) {
  for (let i = 0; i < PERIODS.length; i++) {
    if (year < PERIODS[i].to) return i;
  }
  return PERIODS.length - 1;
}

/** Période contenant une année. */
export function getPeriod(year) {
  return PERIODS[periodIndex(year)];
}

/** Année courante (l'extrémité "aujourd'hui" des frises). */
export function nowYear() {
  return new Date().getFullYear();
}

// --- Échelle proportionnelle au temps ---
// On démarre l'axe à l'Antiquité (−3000) : la Préhistoire est un "temps
// profond" hors échelle. L'an 0 tombe alors vers le milieu, l'année en
// cours à l'extrémité — exactement le repère demandé.
export const AXIS_MIN = -3000;

/** Périodes réellement placées sur l'échelle (hors Préhistoire). */
export const SCALED_PERIODS = PERIODS.filter((p) => p.id !== 'prehistoire');

/** Position (0..100 %) d'une année sur l'axe proportionnel. */
export function yearPercent(year, min = AXIS_MIN, max = nowYear()) {
  const y = Math.max(min, Math.min(max, year));
  return ((y - min) / (max - min)) * 100;
}

/** Durée (années) d'une période visible dans l'intervalle de l'axe. */
export function scaledDuration(p, min = AXIS_MIN, max = nowYear()) {
  return Math.max(0, Math.min(p.to, max) - Math.max(p.from, min));
}
