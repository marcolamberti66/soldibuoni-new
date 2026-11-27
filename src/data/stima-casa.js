// ─────────────────────────────────────────────────────────────
// Stima delle spese di una casa "come la tua" (home e app).
// Basi ufficiali: prezzi e consumi tipo ARERA, TARI per città
// Cittadinanzattiva. I coefficienti per numero di persone e per la
// pompa di calore sono NOSTRE ipotesi, dichiarate in pagina: servono
// a dare un ordine di grandezza, non a sostituire le bollette.
// ─────────────────────────────────────────────────────────────
import { LUCE, GAS } from './energia.js';
import { TARI, FONTE_TARI } from './tari-2025.js';

// Ipotesi SoldiBuoni: consumi rispetto alla famiglia tipo ARERA (≈ 3 persone).
export const FATTORE_PERSONE = { 1: 0.75, 2: 0.9, 3: 1, 4: 1.15, 5: 1.3 };
// Ipotesi SoldiBuoni: la TARI ha una parte variabile legata al numero di occupanti.
export const FATTORE_TARI = { 1: 0.8, 2: 0.9, 3: 1, 4: 1.1, 5: 1.2 };
// Ipotesi SoldiBuoni: kWh in più all'anno per scaldare con una pompa di calore.
export const KWH_POMPA_CALORE = 2500;

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
export function trovaCitta(nome) {
  const k = norm(nome);
  if (!k) return null;
  return TARI.find((t) => norm(t.citta) === k || t.slug.replace(/-/g, '') === k) || null;
}

/**
 * @param {{ citta?: string, persone?: number, riscaldamento?: string }} q
 * @returns {{ voci: Array<{cat, label, anno, nota, fonte}>, anno: number, mese: number, citta: object|null }}
 */
export function stimaCasa({ citta, persone = 3, riscaldamento = 'gas_autonomo' } = {}) {
  const p = Math.min(5, Math.max(1, Number(persone) || 3));
  const voci = [];

  const kwh = Math.round(LUCE.consumoTipo * FATTORE_PERSONE[p] + (riscaldamento === 'pompa_calore' ? KWH_POMPA_CALORE : 0));
  voci.push({
    cat: 'luce', label: 'Luce', anno: kwh * LUCE.prezzoKwh,
    nota: `${kwh.toLocaleString('it-IT')} kWh l'anno al prezzo di ${LUCE.periodo}`,
    fonte: LUCE.fonte, url: LUCE.url,
  });

  if (riscaldamento === 'gas_autonomo') {
    const smc = Math.round(GAS.consumoTipo * FATTORE_PERSONE[p]);
    voci.push({
      cat: 'gas', label: 'Gas', anno: smc * GAS.prezzoSmc,
      nota: `${smc.toLocaleString('it-IT')} Smc l'anno, riscaldamento compreso`,
      fonte: GAS.fonte, url: GAS.url,
    });
  }

  const c = trovaCitta(citta);
  const tariBase = c ? c.t25 : FONTE_TARI.media;
  voci.push({
    cat: 'tari', label: 'TARI', anno: tariBase * FATTORE_TARI[p],
    nota: c ? `${c.citta}, ${c.var > 0 ? '+' : ''}${String(c.var).replace('.', ',')}% sul 2024` : 'media dei capoluoghi',
    fonte: FONTE_TARI.nome, url: '/tari' + (c ? '/' + c.slug : ''),
  });

  const anno = voci.reduce((t, v) => t + v.anno, 0);
  return { voci, anno, mese: anno / 12, citta: c, riscaldamento, persone: p };
}

/** I "numeri del mese" in home, con variazione e fonte. */
export const LUCE_TRIMESTRI = [
  { t: 'gen–mar 2026', p: 27.97 },
  { t: 'apr–giu 2026', p: 30.24 },
  { t: 'lug–set 2026', p: 31.63 },
  { t: 'ott–dic 2026', p: 43.43 },
];
