// ─────────────────────────────────────────────────────────────
// Conti di casa: spese divise tra chi vive insieme.
// Tutto in centesimi interi, così i conti tornano sempre al centesimo.
//  · spesa:    chi paga anticipa l'importo, ognuno deve la sua quota;
//  · rimborso: chi restituisce paga, chi riceve incassa.
// Saldo positivo = deve ricevere; negativo = deve dare.
// ─────────────────────────────────────────────────────────────

export const cent = (eur) => Math.round(Number(eur || 0) * 100);
export const euro = (c) => c / 100;

/** Divide `totale` (euro) tra `persone` secondo il modo. Restituisce { id: euro }. */
export function ripartisci(totale, modo, persone, valori = {}) {
  const T = cent(totale);
  if (!persone.length || T <= 0) return {};
  if (modo === 'importi') {
    return Object.fromEntries(persone.map((id) => [id, euro(cent(valori[id]))]));
  }
  const pesi = persone.map((id) => (modo === 'quote' ? Math.max(0, Number(valori[id]) || 0) : 1));
  const somma = pesi.reduce((t, p) => t + p, 0);
  if (somma <= 0) return {};
  // Metodo dei resti più grandi: la somma delle parti è esattamente il totale.
  const esatte = pesi.map((p) => (T * p) / somma);
  const base = esatte.map(Math.floor);
  let resto = T - base.reduce((t, b) => t + b, 0);
  const ordine = esatte.map((e, i) => [e - Math.floor(e), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; resto > 0; k = (k + 1) % ordine.length, resto--) base[ordine[k][1]]++;
  return Object.fromEntries(persone.map((id, i) => [id, euro(base[i])]));
}

/** Differenza tra totale e somma delle parti (per gli importi esatti), in euro. */
export const scarto = (totale, quote) => euro(cent(totale) - Object.values(quote).reduce((t, v) => t + cent(v), 0));

/** Saldi in centesimi per persona. */
export function saldi(movimenti, conviventi) {
  const s = Object.fromEntries(conviventi.map((c) => [c.id, 0]));
  for (const m of movimenti) {
    const imp = cent(m.importo);
    if (m.tipo === 'rimborso') {
      if (m.pagato_da in s) s[m.pagato_da] += imp;
      if (m.a_chi in s) s[m.a_chi] -= imp;
      continue;
    }
    if (m.pagato_da in s) s[m.pagato_da] += imp;
    for (const [id, q] of Object.entries(m.quote || {})) if (id in s) s[id] -= cent(q);
  }
  return s;
}

/** Il minimo di passaggi di denaro per mettere tutti in pari. [{ da, a, importo (euro) }] */
export function pareggio(saldiC) {
  const creditori = Object.entries(saldiC).filter(([, v]) => v > 0).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v);
  const debitori = Object.entries(saldiC).filter(([, v]) => v < 0).map(([id, v]) => ({ id, v: -v })).sort((a, b) => b.v - a.v);
  const out = [];
  let i = 0, j = 0;
  while (i < debitori.length && j < creditori.length) {
    const x = Math.min(debitori[i].v, creditori[j].v);
    if (x > 0) out.push({ da: debitori[i].id, a: creditori[j].id, importo: euro(x) });
    debitori[i].v -= x; creditori[j].v -= x;
    if (debitori[i].v === 0) i++;
    if (creditori[j].v === 0) j++;
  }
  return out;
}

// ── chi sono "io" su questo dispositivo ─────────────────────
const IO = 'sb_io';
export function idIo(conviventi, utenteId) {
  if (utenteId) {
    const mio = conviventi.find((c) => c.account_id === utenteId);
    if (mio) return mio.id;
  }
  try {
    const salvato = localStorage.getItem(IO);
    if (salvato && conviventi.some((c) => c.id === salvato)) return salvato;
  } catch {}
  return conviventi.find((c) => c.attivo !== false)?.id || null;
}
export function impostaIo(id) { try { localStorage.setItem(IO, id); } catch {} }

/** Le bollette e le spese fisse recenti non ancora divise: proposte con un tocco. */
export function daDividere(stato, oggi = new Date().toISOString().slice(0, 10)) {
  const divisiDoc = new Set(stato.movimenti.map((m) => m.documento_id).filter(Boolean));
  const limite = new Date(Date.parse(oggi) - 75 * 864e5).toISOString().slice(0, 10);
  const bollette = stato.documenti
    .filter((d) => Number(d.importo) > 0 && !divisiDoc.has(d.id))
    .filter((d) => (d.data_emissione || d.periodo_al || d.creato_il?.slice(0, 10) || '') >= limite)
    .map((d) => ({ tipo: 'documento', id: d.id, categoria: d.categoria, importo: Number(d.importo), data: d.scadenza_pagamento || d.data_emissione || d.periodo_al || oggi, d }));
  const mese = oggi.slice(0, 7);
  const fatteMese = new Set(stato.movimenti.filter((m) => m.ricorrente_id && (m.data || '').slice(0, 7) === mese).map((m) => m.ricorrente_id));
  const fisse = stato.ricorrenti
    .filter((r) => r.attiva !== false && Number(r.importo) > 0 && !fatteMese.has(r.id))
    .filter((r) => !r.prossima_scadenza || (r.prossima_scadenza.slice(0, 7) <= mese))
    .map((r) => ({ tipo: 'ricorrente', id: r.id, categoria: r.categoria, importo: Number(r.importo), data: r.prossima_scadenza && r.prossima_scadenza.slice(0, 7) === mese ? r.prossima_scadenza : oggi, r }));
  return [...bollette, ...fisse];
}
