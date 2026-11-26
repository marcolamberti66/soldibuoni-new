// ─────────────────────────────────────────────────────────────
// Tassi di mercato usati da tutte le pagine sul mutuo.
// Un solo posto da aggiornare, una volta al mese: le pagine mostrano
// la data e la fonte, così chi legge sa quanto sono freschi i numeri.
// ─────────────────────────────────────────────────────────────
export const TASSI = {
  aggiornato: '2026-11-18',
  aggiornatoTesto: 'novembre 2026',
  fonte: 'Facile.it: medie delle offerte e fixing Eurirs/Euribor',
  // Tassi medi (TAN) delle offerte di mutuo prima casa.
  fisso: 3.06,
  variabile: 2.75,
  // Parametri di riferimento (fixing del 18/11/2026, IRS 10 e 15 anni dell'11/11/2026).
  euribor3m: 2.825,
  irs: { 10: 3.40, 15: 3.45, 20: 3.47, 25: 3.41, 30: 3.33 },
};

/** IRS della durata più vicina. */
export function irsPer(anni) {
  const d = anni <= 10 ? 10 : anni <= 15 ? 15 : anni <= 20 ? 20 : anni <= 25 ? 25 : 30;
  return TASSI.irs[d];
}

export const fmtPerc = (n) => n.toFixed(2).replace('.', ',') + '%';
