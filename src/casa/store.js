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
  avvisi_letti: {},    // id avviso → data in cui è stato archiviato
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

// ── azioni ───────────────────────────────────────────────────
const ora = () => new Date().toISOString();

export const azioni = {
  creaCasa(dati) {
    aggiorna(() => ({ casa: { id: uid(), creato_il: ora(), ...dati } }));
  },
  modificaCasa(patch) {
    aggiorna((s) => ({ casa: { ...s.casa, ...patch } }));
  },
  aggiungiDocumenti(lista) {
    const nuovi = lista.map((d) => ({ id: uid(), creato_il: ora(), ...d }));
    aggiorna((s) => ({ documenti: [...s.documenti, ...nuovi] }));
    return nuovi;
  },
  modificaDocumento(id, patch) {
    aggiorna((s) => ({ documenti: s.documenti.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  },
  eliminaDocumento(id) {
    aggiorna((s) => ({ documenti: s.documenti.filter((d) => d.id !== id) }));
  },
  salvaRicorrente(r) {
    aggiorna((s) => {
      if (r.id) return { ricorrenti: s.ricorrenti.map((x) => (x.id === r.id ? { ...x, ...r } : x)) };
      return { ricorrenti: [...s.ricorrenti, { id: uid(), creato_il: ora(), attiva: true, ...r }] };
    });
  },
  eliminaRicorrente(id) {
    aggiorna((s) => ({ ricorrenti: s.ricorrenti.filter((x) => x.id !== id) }));
  },
  salvaPromemoria(p) {
    aggiorna((s) => {
      if (p.id) return { promemoria: s.promemoria.map((x) => (x.id === p.id ? { ...x, ...p } : x)) };
      return { promemoria: [...s.promemoria, { id: uid(), creato_il: ora(), fatto: false, ...p }] };
    });
  },
  eliminaPromemoria(id) {
    aggiorna((s) => ({ promemoria: s.promemoria.filter((x) => x.id !== id) }));
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
