// Prezzi di riferimento ARERA per i clienti vulnerabili: l'unico prezzo "ufficiale" pubblicato per una
// famiglia tipo. Sul mercato libero ognuno paga il prezzo del proprio contratto.
export const LUCE = {
  periodo: 'ottobre–dicembre 2026', aggiornato: '2026-09-29',
  prezzoKwh: 0.4343, // €/kWh tasse incluse, cliente tipo vulnerabile in Maggior Tutela
  consumoTipo: 2000, potenzaTipo: 3, // kWh/anno, kW
  spesaAnno2026: 665.38, // € spesa annua stimata del cliente tipo, 1/1–31/12/2026
  fonte: 'ARERA, comunicato del 29 settembre 2026',
  url: 'https://www.arera.it/comunicati-stampa/dettaglio/elettricità-maggior-tutela-373-nel-iv-trimestre-2026-per-i-clienti-vulnerabili',
};
export const GAS = {
  periodo: 'ottobre 2026', aggiornato: '2026-11-03',
  prezzoSmc: 1.768, // €/Smc tasse incluse, nuovo cliente tipo nel Servizio di tutela della vulnerabilità
  consumoTipo: 1100, // Smc/anno
  fonte: 'ARERA, comunicato del 3 novembre 2026',
  url: 'https://www.arera.it/comunicati-stampa/dettaglio/gas-valore-materia-prima-vulnerabilita-ottobre-2026',
};
export const ISTAT = {
  anno: 2025, spesaMese: 2782, quotaAbitazione: 36.0, affittoMedio: 438, rataMutuoMedia: 565,
  famiglieAffitto: '4,8 milioni', famiglieMutuo: '3,4 milioni', single: 2070,
  aree: { 'Nord-est': 3087, 'Centro': 3052, 'Nord-ovest': 2974, 'Isole': 2338, 'Sud': 2215 },
  fonte: 'ISTAT, Le spese per i consumi delle famiglie – Anno 2025 (8 ottobre 2026)',
  url: 'https://www.istat.it/comunicato-stampa/spese-per-consumi-delle-famiglie-anno-2025/',
};
export const eur = (n, d = 0) => n.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
