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

/** Position (%) d'une année sur une frise à zones de largeur égale. */
export function markerPercent(year) {
  const i = periodIndex(year);
  const p = PERIODS[i];
  const frac = Math.max(0, Math.min(1, (year - p.from) / (p.to - p.from)));
  return ((i + frac) / PERIODS.length) * 100;
}
