// ─────────────────────────────────────────────────────────────
// Modello dati di "La tua casa".
// Pensato per essere sincronizzato 1:1 con le tabelle Supabase
// (vedi supabase/schema.sql): stessi nomi di campo, ISO date.
// ─────────────────────────────────────────────────────────────

export const CATEGORIE = {
  // Abitazione
  mutuo:        { label: 'Mutuo',            unita: null,  colore: 'var(--c-mutuo)',        bolletta: false, icona: 'mutuo',      gruppo: 'abitazione' },
  affitto:      { label: 'Affitto',          unita: null,  colore: 'var(--c-mutuo)',        bolletta: false, icona: 'chiave',     gruppo: 'abitazione' },
  condominio:   { label: 'Condominio',       unita: null,  colore: 'var(--c-condominio)',   bolletta: false, icona: 'condominio', gruppo: 'abitazione' },
  assicurazione:{ label: 'Assicurazione casa', unita: null, colore: 'var(--c-assicurazione)', bolletta: false, icona: 'scudo',    gruppo: 'abitazione' },
  manutenzione: { label: 'Manutenzione',     unita: null,  colore: 'var(--c-manutenzione)', bolletta: false, icona: 'chiaveinglese', gruppo: 'abitazione' },
  tari:         { label: 'TARI',             unita: null,  colore: 'var(--c-tari)',         bolletta: false, icona: 'tari',       gruppo: 'tasse' },
  imu:          { label: 'IMU e tributi',    unita: null,  colore: 'var(--c-tari)',         bolletta: false, icona: 'documento',  gruppo: 'tasse' },
  // Utenze
  luce:         { label: 'Luce',             unita: 'kWh', colore: 'var(--c-luce)',         bolletta: true,  icona: 'luce',       gruppo: 'utenze' },
  gas:          { label: 'Gas',              unita: 'Smc', colore: 'var(--c-gas)',          bolletta: true,  icona: 'gas',        gruppo: 'utenze' },
  acqua:        { label: 'Acqua',            unita: 'm³',  colore: 'var(--c-acqua)',        bolletta: true,  icona: 'acqua',      gruppo: 'utenze' },
  internet:     { label: 'Internet',         unita: null,  colore: 'var(--c-internet)',     bolletta: true,  icona: 'internet',   gruppo: 'utenze' },
  mobile:       { label: 'Telefonia mobile', unita: null,  colore: 'var(--c-mobile)',       bolletta: true,  icona: 'mobile',     gruppo: 'utenze' },
  altro:        { label: 'Altro',            unita: null,  colore: 'var(--c-altro)',        bolletta: false, icona: 'altro',      gruppo: 'utenze' },
};

export const ORDINE = ['mutuo', 'affitto', 'condominio', 'luce', 'gas', 'acqua', 'internet', 'mobile', 'tari', 'imu', 'assicurazione', 'manutenzione', 'altro'];

export const GRUPPI = { abitazione: 'Abitazione', utenze: 'Utenze e servizi', tasse: 'Tasse' };

export const TITOLO = {
  proprieta_mutuo: 'Di proprietà, con mutuo',
  proprieta: 'Di proprietà',
  affitto: 'In affitto',
};

/** Voci che ha senso chiedere a questa casa (es. niente affitto se c'è il mutuo). */
export function vociAttese(casa) {
  const t = casa?.titolo;
  return ORDINE.filter((c) => {
    if (c === 'altro') return false;
    if (c === 'mutuo') return !t || t === 'proprieta_mutuo';
    if (c === 'affitto') return !t || t === 'affitto';
    if (c === 'imu') return t !== 'affitto';
    if (c === 'manutenzione') return t !== 'affitto';
    return true;
  });
}

/** Quota interessi stimata della prossima rata (ammortamento alla francese). */
export function quotaInteressi(r) {
  const res = Number(r.debito_residuo), tan = Number(r.tasso);
  if (!(res > 0) || !(tan >= 0)) return null;
  return res * (tan / 100) / 12;
}

export const FREQUENZE = {
  mensile: { label: 'ogni mese', mesi: 1 },
  bimestrale: { label: 'ogni 2 mesi', mesi: 2 },
  trimestrale: { label: 'ogni 3 mesi', mesi: 3 },
  quadrimestrale: { label: 'ogni 4 mesi', mesi: 4 },
  semestrale: { label: 'ogni 6 mesi', mesi: 6 },
  annuale: { label: 'una volta l\'anno', mesi: 12 },
  una_tantum: { label: 'una volta sola', mesi: 12, unaVolta: true },
};

/** Spesa una tantum: una sola scadenza, fuori dalla media mensile. */
export const unaVolta = (r) => !!FREQUENZE[r.frequenza]?.unaVolta;

export const RISCALDAMENTO = {
  gas_autonomo: 'Caldaia a gas autonoma',
  centralizzato: 'Centralizzato (condominio)',
  pompa_calore: 'Pompa di calore / elettrico',
  altro: 'Altro o non so',
};

// Riferimento ARERA "cliente domestico tipo": 2.700 kWh/anno con 3 kW,
// 1.400 Smc/anno di gas (riscaldamento autonomo). È un riferimento di
// regolazione, non una media statistica per numero di persone.
export const RIFERIMENTO_ARERA = {
  luce: { annuo: 2700, unita: 'kWh', nota: 'Cliente domestico tipo ARERA: 2.700 kWh/anno, 3 kW' },
  gas:  { annuo: 1400, unita: 'Smc', nota: 'Cliente domestico tipo ARERA: 1.400 Smc/anno, riscaldamento autonomo' },
};

// UUID v4: gli id devono essere validi anche per il database (colonne uuid).
export const uid = () => {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.random() * 256;
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const GIORNO = 86400000;
export const parseISO = (s) => (s ? new Date(s + (s.length === 10 ? 'T00:00:00' : '')) : null);
export const giorniTra = (a, b) => Math.round((parseISO(b) - parseISO(a)) / GIORNO);
export const oggiISO = () => new Date().toISOString().slice(0, 10);
export const addGiorni = (iso, n) => new Date(parseISO(iso).getTime() + n * GIORNO).toISOString().slice(0, 10);

/** Mesi coperti da un documento (minimo 1). */
export function mesiCoperti(doc) {
  if (doc.periodo_dal && doc.periodo_al) {
    const g = giorniTra(doc.periodo_dal, doc.periodo_al) + 1;
    if (g > 0) return Math.max(g / 30.4375, 0.5);
  }
  return doc.mesi_stimati || 1;
}

/** Data di riferimento per ordinare/raggruppare un documento. */
export const dataDoc = (d) => d.periodo_al || d.data_emissione || d.scadenza_pagamento || d.creato_il?.slice(0, 10);

/** Documenti di una categoria degli ultimi 12 mesi, ordinati dal più recente. */
export function documentiRecenti(docs, categoria, mesi = 12) {
  const limite = addGiorni(oggiISO(), -Math.round(mesi * 30.4375) - 31);
  return docs
    .filter((d) => d.categoria === categoria && (dataDoc(d) || '') >= limite)
    .sort((a, b) => (dataDoc(b) || '').localeCompare(dataDoc(a) || ''));
}

/**
 * Costo mensile medio per categoria.
 * - Con bollette: somma importi / mesi coperti (ultimi 12 mesi).
 * - Con spese ricorrenti: importo / mesi della frequenza.
 * Ritorna { mensile, fonte, mesiDati } oppure null se mancano dati.
 */
export function costoMensile(stato, categoria) {
  const docs = documentiRecenti(stato.documenti, categoria);
  let mensile = 0, fonte = null, mesiDati = 0;
  if (docs.length) {
    const tot = docs.reduce((s, d) => s + (Number(d.importo) || 0), 0);
    mesiDati = docs.reduce((s, d) => s + mesiCoperti(d), 0);
    if (mesiDati > 0) { mensile += tot / mesiDati; fonte = 'bollette'; }
  }
  // Le spese una tantum (conguagli, anticipi, riparazioni) non entrano nella media mensile:
  // la falserebbero. Compaiono nelle scadenze e nella lista delle spese.
  const ric = stato.ricorrenti.filter((r) => r.categoria === categoria && r.attiva !== false && !unaVolta(r));
  if (ric.length) {
    mensile += ric.reduce((s, r) => s + (Number(r.importo) || 0) / (FREQUENZE[r.frequenza]?.mesi || 1), 0);
    fonte = fonte ? 'misto' : 'ricorrente';
  }
  return fonte ? { mensile, fonte, mesiDati } : null;
}

/** Consumo annualizzato (kWh/Smc/m³) dagli ultimi 12 mesi di bollette. */
export function consumoAnnuo(stato, categoria) {
  const docs = documentiRecenti(stato.documenti, categoria).filter((d) => Number(d.consumo) > 0);
  if (!docs.length) {
    const dich = stato.documenti.filter((d) => d.categoria === categoria && Number(d.consumo_annuo_dichiarato) > 0)
      .sort((a, b) => (dataDoc(b) || '').localeCompare(dataDoc(a) || ''))[0];
    return dich ? { annuo: Number(dich.consumo_annuo_dichiarato), fonte: 'dichiarato in bolletta', affidabile: true } : null;
  }
  const consumo = docs.reduce((s, d) => s + Number(d.consumo), 0);
  const mesi = docs.reduce((s, d) => s + mesiCoperti(d), 0);
  if (mesi < 1) return null;
  // Sotto i 10 mesi la stagionalità (soprattutto del gas) rende l'estrapolazione inaffidabile:
  // se la bolletta riporta il consumo annuo, usiamo quello.
  const dich = docs.find((d) => Number(d.consumo_annuo_dichiarato) > 0);
  if (mesi < 10 && dich) return { annuo: Number(dich.consumo_annuo_dichiarato), fonte: 'dichiarato in bolletta', affidabile: true };
  return { annuo: (consumo / mesi) * 12, fonte: mesi >= 10 ? 'ultimi 12 mesi' : 'proiezione su ' + Math.round(mesi) + ' mesi', affidabile: mesi >= 10 };
}

/** Costo "tutto incluso" per unità: importo / consumo del documento. */
export const costoUnitarioPieno = (d) => (Number(d.consumo) > 0 && Number(d.importo) > 0 ? Number(d.importo) / Number(d.consumo) : null);

export const eur = (n, dec = 0) =>
  n == null || isNaN(n) ? '—' : '€\u00a0' + new Intl.NumberFormat('it-IT', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
export const num = (n, dec = 0) =>
  n == null || isNaN(n) ? '—' : new Intl.NumberFormat('it-IT', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
export const dataBreve = (iso) =>
  iso ? new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).format(parseISO(iso)) : '—';
export const meseAnno = (iso) =>
  iso ? new Intl.DateTimeFormat('it-IT', { month: 'short', year: '2-digit' }).format(parseISO(iso)) : '—';

/**
 * Numero scritto all'italiana: "1.234,50" → 1234.5, "185.000" → 185000,
 * "0.134" → 0.134, "142,3" → 142.3.
 */
export function parseNumero(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  let s = String(v).trim().replace(/\s|€/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return isNaN(n) ? null : n;
}
