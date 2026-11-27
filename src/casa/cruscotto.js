// ─────────────────────────────────────────────────────────────
// Cruscotto della casa: costo per voce con peso, andamento e
// confronto; calendario dei prossimi 12 mesi con i mesi più pesanti.
// Funzioni pure, senza interfaccia: si possono verificare con i test.
// ─────────────────────────────────────────────────────────────
import { CATEGORIE, ORDINE, GRUPPI, FREQUENZE, costoMensile, mesiCoperti, dataDoc, oggiISO, addGiorni, parseISO } from './model.js';
import { prossimaRicorrenza } from './insights.js';
import { stimaCasa } from '../data/stima-casa.js';

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const MESI_LUNGHI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
export const nomeMese = (chiave, lungo = false) => (lungo ? MESI_LUNGHI : MESI)[Number(chiave.slice(5, 7)) - 1];

/** Spesa mensile media da bollette in una finestra [da, a) di date ISO, se coperta abbastanza. */
function mediaFinestra(docs, cat, da, a) {
  const sel = docs.filter((d) => d.categoria === cat && dataDoc(d) && dataDoc(d) >= da && dataDoc(d) < a && Number(d.importo) > 0);
  const mesi = sel.reduce((t, d) => t + mesiCoperti(d), 0);
  if (mesi < 4) return null; // troppo poco per dire se sale o scende
  return sel.reduce((t, d) => t + Number(d.importo), 0) / mesi;
}

/** Riferimento per confronto: la stima per una casa come questa (luce, gas, TARI). */
function riferimenti(casa) {
  if (!casa) return {};
  const s = stimaCasa({ citta: casa.citta, persone: casa.persone, riscaldamento: casa.riscaldamento });
  return Object.fromEntries(s.voci.map((v) => [v.cat, { anno: v.anno, testo: v.cat === 'tari' ? (s.citta ? `TARI media a ${s.citta.citta}` : 'TARI media dei capoluoghi') : 'stima per una casa come la tua' }]));
}

/**
 * Voci di costo con peso sul totale, andamento rispetto all'anno prima
 * (solo dove ci sono abbastanza bollette) e confronto con la stima.
 */
export function vociCosto(stato, oggi = oggiISO()) {
  const rif = riferimenti(stato.casa);
  const a1 = addGiorni(oggi, -365), a2 = addGiorni(oggi, -730);
  const voci = ORDINE.map((cat) => {
    const c = costoMensile(stato, cat);
    if (!c || !(c.mensile > 0)) return null;
    const anno = c.mensile * 12;
    let andamento = null;
    if (CATEGORIE[cat].bolletta) {
      const ora = mediaFinestra(stato.documenti, cat, a1, addGiorni(oggi, 1));
      const prima = mediaFinestra(stato.documenti, cat, a2, a1);
      if (ora && prima) andamento = { var: (ora / prima - 1) * 100 };
    }
    const r = rif[cat];
    const confronto = r && r.anno > 0 ? { var: (anno / r.anno - 1) * 100, testo: r.testo, rif: r.anno } : null;
    return { cat, label: CATEGORIE[cat].label, gruppo: CATEGORIE[cat].gruppo, mensile: c.mensile, anno, fonte: c.fonte, andamento, confronto };
  }).filter(Boolean).sort((a, b) => b.anno - a.anno);
  const totale = voci.reduce((t, v) => t + v.anno, 0);
  voci.forEach((v) => { v.quota = totale ? (v.anno / totale) * 100 : 0; });
  const gruppi = Object.keys(GRUPPI).map((g) => ({ g, label: GRUPPI[g], anno: voci.filter((v) => v.gruppo === g).reduce((t, v) => t + v.anno, 0) })).filter((x) => x.anno > 0);
  return { voci, totale, gruppi };
}

const chiaveMese = (iso) => iso.slice(0, 7);
function aggiungiMesi(iso, n) {
  const d = parseISO(iso);
  const g = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(g, ultimo));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * I prossimi 12 mesi (dal mese in corso): quanto esce in ognuno.
 * · "certo": rate e spese fisse alle loro date, una tantum, bollette con scadenza non pagate;
 * · "stimato": per le utenze con bollette ma senza scadenze future, la media mensile.
 */
export function calendarioAnno(stato, oggi = oggiISO()) {
  const inizio = oggi.slice(0, 8) + '01';
  const mesi = Array.from({ length: 12 }, (_, i) => ({ chiave: chiaveMese(aggiungiMesi(inizio, i)), certo: 0, stimato: 0, voci: [] }));
  const idx = Object.fromEntries(mesi.map((m, i) => [m.chiave, i]));
  const fine = aggiungiMesi(inizio, 12);
  const metti = (data, importo, cat, titolo, tipo = 'certo') => {
    const i = idx[chiaveMese(data)];
    if (i === undefined || !(importo > 0)) return;
    mesi[i][tipo] += importo;
    mesi[i].voci.push({ data, importo, cat, titolo, tipo });
  };

  for (const r of stato.ricorrenti) {
    if (r.attiva === false) continue;
    const f = FREQUENZE[r.frequenza];
    let d = prossimaRicorrenza(r, inizio);
    const titolo = r.nome || CATEGORIE[r.categoria]?.label;
    if (f?.unaVolta) { if (d && d >= inizio) metti(d, Number(r.importo), r.categoria, titolo); continue; }
    let guard = 0;
    while (d && d < fine && guard++ < 60) {
      if (!r.data_fine || d <= r.data_fine) metti(d, Number(r.importo), r.categoria, titolo);
      d = aggiungiMesi(d, f?.mesi || 1);
    }
  }

  const conScadenza = new Set();
  for (const d of stato.documenti) {
    if (d.scadenza_pagamento && !d.pagato && d.scadenza_pagamento >= inizio) {
      metti(d.scadenza_pagamento, Number(d.importo), d.categoria, (CATEGORIE[d.categoria]?.label || 'Bolletta') + (d.fornitore ? ' · ' + d.fornitore : ''));
      conScadenza.add(d.categoria);
    }
  }

  // Utenze a bolletta: la media mensile copre i mesi senza una scadenza nota.
  for (const cat of ORDINE.filter((c) => CATEGORIE[c].bolletta)) {
    const c = costoMensile(stato, cat);
    if (!c || c.fonte === 'ricorrente' || !(c.mensile > 0)) continue;
    for (const m of mesi) {
      if (m.voci.some((v) => v.cat === cat && v.tipo === 'certo')) continue;
      if (m.chiave === chiaveMese(oggi) && conScadenza.has(cat)) continue;
      m.stimato += c.mensile;
      m.voci.push({ data: m.chiave + '-15', importo: c.mensile, cat, titolo: CATEGORIE[cat].label + ' (media)', tipo: 'stimato' });
    }
  }

  const totali = mesi.map((m) => m.certo + m.stimato);
  const ord = [...totali].sort((a, b) => a - b);
  const mediana = ord.length ? (ord[5] + ord[6]) / 2 : 0;
  mesi.forEach((m, i) => {
    m.totale = totali[i];
    m.picco = mediana > 0 && m.totale > mediana * 1.35 && m.totale - mediana > 150;
    m.voci.sort((a, b) => b.importo - a.importo);
  });
  return { mesi, mediana, max: Math.max(0, ...totali), totale: totali.reduce((t, x) => t + x, 0) };
}

/** Uscite nei prossimi N giorni (solo importi certi). */
export function usciteProssime(stato, giorni = 30, oggi = oggiISO()) {
  const fine = addGiorni(oggi, giorni);
  const { mesi } = calendarioAnno(stato, oggi);
  const voci = mesi.flatMap((m) => m.voci).filter((v) => v.tipo === 'certo' && v.data >= oggi && v.data <= fine).sort((a, b) => a.data.localeCompare(b.data));
  return { voci, totale: voci.reduce((t, v) => t + v.importo, 0) };
}
