// ─────────────────────────────────────────────────────────────
// Store "local-first". Oggi salva nel browser (localStorage);
// l'interfaccia (get / set / subscribe) è quella che userà
// l'adapter Supabase quando attiviamo gli account: i componenti
// non dovranno cambiare.
// ─────────────────────────────────────────────────────────────
import { useSyncExternalStore } from 'react';
import { uid } from './model.js';

const KEY = 'sb_casa_v1';
const VERSIONE = 1;

const vuoto = () => ({
  versione: VERSIONE,
  casa: null,          // { id, nome, cap, persone, mq, riscaldamento, creato_il }
  documenti: [],       // bollette e fatture estratte o inserite
  ricorrenti: [],      // spese fisse senza bolletta (TARI, condominio, ...)
  promemoria: [],      // scadenze manuali
  conviventi: [],      // chi divide le spese: { id, nome, account_id?, attivo }
  movimenti: [],       // spese divise e rimborsi
  avvisi_letti: {},    // id avviso → data in cui è stato archiviato
  // Sincronizzazione: id già presenti sul database e cancellazioni da propagare.
  _sync: { noti: { documenti: [], ricorrenti: [], promemoria: [], conviventi: [], movimenti: [] }, eliminati: { documenti: [], ricorrenti: [], promemoria: [], conviventi: [], movimenti: [] } },
});

let stato = vuoto();
let caricato = false;
const ascoltatori = new Set();

function carica() {
  if (caricato || typeof window === 'undefined') return;
  caricato = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) stato = { ...vuoto(), ...JSON.parse(raw) };
  } catch { /* storage non disponibile: si lavora in memoria */ }
}

function salva() {
  try { localStorage.setItem(KEY, JSON.stringify(stato)); } catch { /* quota o privato */ }
}

function emetti() { ascoltatori.forEach((f) => f()); }

export function getStato() { carica(); return stato; }

export function aggiorna(fn) {
  carica();
  stato = { ...stato, ...fn(stato) };
  salva(); emetti();
}

export function subscribe(f) {
  ascoltatori.add(f);
  const onStorage = (e) => { if (e.key === KEY) { caricato = false; carica(); emetti(); } };
  window.addEventListener('storage', onStorage);
  return () => { ascoltatori.delete(f); window.removeEventListener('storage', onStorage); };
}

const server = vuoto();
export function useCasa() {
  return useSyncExternalStore(subscribe, getStato, () => server);
}

// ── bollette lette da "Controlla la tua bolletta", in attesa di una casa ──
const ATTESA = 'sb_bollette_in_attesa';
export function mettiInAttesa(documenti) {
  try { localStorage.setItem(ATTESA, JSON.stringify(documenti)); } catch {}
}
/** Restituisce e consuma le bollette in attesa. */
export function prendiInAttesa() {
  try {
    const l = JSON.parse(localStorage.getItem(ATTESA) || '[]');
    localStorage.removeItem(ATTESA);
    return Array.isArray(l) ? l : [];
  } catch { return []; }
}
export function ciSonoInAttesa() {
  try { return !!localStorage.getItem(ATTESA); } catch { return false; }
}

// ── azioni ───────────────────────────────────────────────────
const ora = () => new Date().toISOString();

// Una cancellazione va propagata al database solo se l'elemento c'era già.
function segnaEliminato(s, tab, id) {
  const sy = s._sync || vuoto()._sync;
  if (!sy.noti?.[tab]?.includes(id)) return sy;
  return { ...sy, eliminati: { ...sy.eliminati, [tab]: [...(sy.eliminati?.[tab] || []), id] } };
}

export const azioni = {
  creaCasa(dati) {
    aggiorna(() => ({ casa: { id: uid(), creato_il: ora(), aggiornato_il: ora(), ...dati } }));
  },
  modificaCasa(patch) {
    aggiorna((s) => ({ casa: { ...s.casa, ...patch, aggiornato_il: ora() } }));
  },
  aggiungiDocumenti(lista) {
    const nuovi = lista.map((d) => ({ id: uid(), creato_il: ora(), aggiornato_il: ora(), ...d }));
    aggiorna((s) => ({ documenti: [...s.documenti, ...nuovi] }));
    return nuovi;
  },
  modificaDocumento(id, patch) {
    aggiorna((s) => ({ documenti: s.documenti.map((d) => (d.id === id ? { ...d, ...patch, aggiornato_il: ora() } : d)) }));
  },
  eliminaDocumento(id) {
    aggiorna((s) => ({ documenti: s.documenti.filter((d) => d.id !== id), _sync: segnaEliminato(s, 'documenti', id) }));
  },
  salvaRicorrente(r) {
    aggiorna((s) => {
      if (r.id) return { ricorrenti: s.ricorrenti.map((x) => (x.id === r.id ? { ...x, ...r, aggiornato_il: ora() } : x)) };
      return { ricorrenti: [...s.ricorrenti, { id: uid(), creato_il: ora(), aggiornato_il: ora(), attiva: true, ...r }] };
    });
  },
  eliminaRicorrente(id) {
    aggiorna((s) => ({ ricorrenti: s.ricorrenti.filter((x) => x.id !== id), _sync: segnaEliminato(s, 'ricorrenti', id) }));
  },
  salvaPromemoria(p) {
    aggiorna((s) => {
      if (p.id) return { promemoria: s.promemoria.map((x) => (x.id === p.id ? { ...x, ...p, aggiornato_il: ora() } : x)) };
      return { promemoria: [...s.promemoria, { id: uid(), creato_il: ora(), aggiornato_il: ora(), fatto: false, ...p }] };
    });
  },
  eliminaPromemoria(id) {
    aggiorna((s) => ({ promemoria: s.promemoria.filter((x) => x.id !== id), _sync: segnaEliminato(s, 'promemoria', id) }));
  },
  salvaConvivente(c) {
    aggiorna((s) => {
      if (c.id && s.conviventi.some((x) => x.id === c.id)) return { conviventi: s.conviventi.map((x) => (x.id === c.id ? { ...x, ...c, aggiornato_il: ora() } : x)) };
      return { conviventi: [...s.conviventi, { id: c.id || uid(), creato_il: ora(), aggiornato_il: ora(), attivo: true, ...c }] };
    });
  },
  eliminaConvivente(id) {
    aggiorna((s) => {
      // Chi compare in qualche conto non si cancella: si mette da parte, i conti restano giusti.
      const usato = s.movimenti.some((m) => m.pagato_da === id || m.a_chi === id || (m.quote && id in m.quote));
      if (usato) return { conviventi: s.conviventi.map((x) => (x.id === id ? { ...x, attivo: false, aggiornato_il: ora() } : x)) };
      return { conviventi: s.conviventi.filter((x) => x.id !== id), _sync: segnaEliminato(s, 'conviventi', id) };
    });
  },
  salvaMovimento(m) {
    aggiorna((s) => {
      if (m.id && s.movimenti.some((x) => x.id === m.id)) return { movimenti: s.movimenti.map((x) => (x.id === m.id ? { ...x, ...m, aggiornato_il: ora() } : x)) };
      return { movimenti: [...s.movimenti, { id: uid(), creato_il: ora(), aggiornato_il: ora(), ...m }] };
    });
  },
  eliminaMovimento(id) {
    aggiorna((s) => ({ movimenti: s.movimenti.filter((x) => x.id !== id), _sync: segnaEliminato(s, 'movimenti', id) }));
  },
  archiviaAvviso(id) {
    aggiorna((s) => ({ avvisi_letti: { ...s.avvisi_letti, [id]: ora() } }));
  },
  esporta() {
    const blob = new Blob([JSON.stringify(getStato(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'soldibuoni-casa-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  async importa(file) {
    const dati = JSON.parse(await file.text());
    if (!dati || typeof dati !== 'object' || !Array.isArray(dati.documenti)) throw new Error('File non valido');
    aggiorna(() => ({ ...vuoto(), ...dati, versione: VERSIONE }));
  },
  azzera() {
    aggiorna(() => vuoto());
  },
};
