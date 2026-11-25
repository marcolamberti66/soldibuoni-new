// ─────────────────────────────────────────────────────────────
// Account e sincronizzazione (Supabase).
// Il browser resta la fonte primaria: l'app funziona anche senza
// account. Con l'accesso, ogni modifica viene copiata sul database
// (debounce) e al login i dati di dispositivi diversi si uniscono.
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { getStato, aggiorna, subscribe as subscribeStato } from './store.js';

// Chiave pubblicabile: è fatta per stare nel codice del sito; i dati sono
// protetti dalle regole Row Level Security del database.
const URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://wudxegrfbjxwzuzadykh.supabase.co';
const KEY = import.meta.env.PUBLIC_SUPABASE_KEY || 'sb_publishable_Bli_DiK4Irtz_ryD7Bi8ig_Wne9-zwi';

let client = null;
export function sb() {
  if (!client && typeof window !== 'undefined') {
    client = createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
    });
  }
  return client;
}

const COLONNE = {
  case: ['id', 'nome', 'cap', 'persone', 'mq', 'riscaldamento', 'titolo', 'creato_il'],
  documenti: ['id', 'categoria', 'fornitore', 'offerta', 'periodo_dal', 'periodo_al', 'data_emissione', 'scadenza_pagamento',
    'fine_condizioni', 'importo', 'consumo', 'unita', 'consumo_annuo_dichiarato', 'prezzo_materia', 'quota_fissa_mese',
    'canone_mensile', 'tipo_prezzo', 'potenza_kw', 'consumi_stimati', 'conguaglio', 'domiciliazione', 'pagato', 'fonte',
    'affidabilita', 'creato_il'],
  ricorrenti: ['id', 'categoria', 'nome', 'importo', 'frequenza', 'prossima_scadenza', 'data_fine', 'domiciliazione',
    'attiva', 'tasso', 'tipo_tasso', 'debito_residuo', 'prima_casa', 'creato_il'],
  promemoria: ['id', 'titolo', 'data', 'categoria', 'fatto', 'creato_il'],
};
const VALORI_AMMESSI = {
  tipo_prezzo: ['fisso', 'variabile', 'tutela'],
  fonte: ['ai', 'manuale'],
  riscaldamento: ['gas_autonomo', 'centralizzato', 'pompa_calore', 'altro'],
  titolo: ['proprieta_mutuo', 'proprieta', 'affitto'],
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function versoDb(obj, tabella, extra = {}) {
  const out = { ...extra };
  for (const k of COLONNE[tabella]) {
    let v = obj[k];
    if (v === '' || v === undefined) v = null;
    if (v != null && VALORI_AMMESSI[k] && !VALORI_AMMESSI[k].includes(v)) v = null;
    if (k === 'cap' && v != null && !/^\d{5}$/.test(String(v))) v = null;
    if (k === 'persone' && v != null) v = Math.min(20, Math.max(1, Number(v)));
    out[k] = v;
  }
  return out;
}

function daDb(riga) {
  const o = {};
  for (const [k, v] of Object.entries(riga)) if (v !== null && k !== 'user_id' && k !== 'casa_id') o[k] = v;
  return o;
}

// ── stato della sincronizzazione (per l'interfaccia) ─────────
let info = { utente: null, stato: 'off', errore: null, ultimo: null };
const asc = new Set();
const set = (p) => { info = { ...info, ...p }; asc.forEach((f) => f()); };
export function useAccount() {
  return useSyncExternalStore((f) => { asc.add(f); return () => asc.delete(f); }, () => info, () => info);
}

// ── lettura / scrittura ──────────────────────────────────────
async function scarica(uid) {
  const c = sb();
  const [casa, doc, ric, pro] = await Promise.all([
    c.from('case').select('*').eq('user_id', uid).order('creato_il').limit(1),
    c.from('documenti').select('*').eq('user_id', uid),
    c.from('ricorrenti').select('*').eq('user_id', uid),
    c.from('promemoria').select('*').eq('user_id', uid),
  ]);
  for (const r of [casa, doc, ric, pro]) if (r.error) throw r.error;
  return {
    casa: casa.data[0] ? daDb(casa.data[0]) : null,
    documenti: doc.data.map(daDb),
    ricorrenti: ric.data.map(daDb),
    promemoria: pro.data.map(daDb),
  };
}

async function carica(uid, s) {
  if (!s.casa) return;
  const c = sb();
  const casaId = s.casa.id;
  const { error: e1 } = await c.from('case').upsert(versoDb(s.casa, 'case', { user_id: uid }));
  if (e1) throw e1;
  for (const [tab, lista] of [['documenti', s.documenti], ['ricorrenti', s.ricorrenti], ['promemoria', s.promemoria]]) {
    const righe = lista.filter((x) => UUID.test(x.id)).map((x) => versoDb(x, tab, { user_id: uid, casa_id: casaId }));
    if (righe.length) {
      const { error } = await c.from(tab).upsert(righe);
      if (error) throw error;
    }
    // ciò che è stato cancellato qui va cancellato anche sul database
    let del = c.from(tab).delete().eq('casa_id', casaId);
    if (righe.length) del = del.not('id', 'in', `(${righe.map((r) => r.id).join(',')})`);
    const { error: e2 } = await del;
    if (e2) throw e2;
  }
}

/** Primo accesso su questo dispositivo: unisce dati locali e remoti. */
async function unisci(uid) {
  const locale = getStato();
  const remoto = await scarica(uid);
  if (!remoto.casa) {
    // niente sul database: rendi validi gli id locali e carica
    if (locale.casa && !UUID.test(locale.casa.id)) {
      const { uid: nuovo } = await import('./model.js');
      aggiorna((s) => ({
        casa: { ...s.casa, id: UUID.test(s.casa.id) ? s.casa.id : nuovo() },
        documenti: s.documenti.map((x) => (UUID.test(x.id) ? x : { ...x, id: nuovo() })),
        ricorrenti: s.ricorrenti.map((x) => (UUID.test(x.id) ? x : { ...x, id: nuovo() })),
        promemoria: s.promemoria.map((x) => (UUID.test(x.id) ? x : { ...x, id: nuovo() })),
      }));
    }
    await carica(uid, getStato());
    return;
  }
  const unione = (a, b) => {
    const m = new Map(a.map((x) => [x.id, x]));
    for (const x of b) if (!m.has(x.id)) m.set(x.id, x);
    return [...m.values()];
  };
  aggiorna((s) => ({
    casa: { ...remoto.casa, ...(s.casa && s.casa.id === remoto.casa.id ? s.casa : {}) },
    documenti: unione(s.documenti, remoto.documenti),
    ricorrenti: unione(s.ricorrenti, remoto.ricorrenti),
    promemoria: unione(s.promemoria, remoto.promemoria),
  }));
  await carica(uid, getStato());
}

// ── ciclo di vita ────────────────────────────────────────────
let timer = null, avviato = false, staSalvando = false;

async function salva() {
  if (!info.utente || staSalvando) return;
  staSalvando = true;
  set({ stato: 'salvataggio' });
  try {
    await carica(info.utente.id, getStato());
    set({ stato: 'ok', errore: null, ultimo: new Date() });
  } catch (e) {
    console.error('sync', e);
    set({ stato: 'errore', errore: e.message || String(e) });
  } finally {
    staSalvando = false;
  }
}

async function accesso(utente) {
  set({ utente, stato: 'salvataggio' });
  try {
    await unisci(utente.id);
    await sb().from('notifiche').upsert({ user_id: utente.id }, { onConflict: 'user_id', ignoreDuplicates: true });
    set({ stato: 'ok', errore: null, ultimo: new Date() });
  } catch (e) {
    console.error('sync', e);
    set({ stato: 'errore', errore: e.message || String(e) });
  }
}

export function avviaSync() {
  if (avviato || typeof window === 'undefined') return;
  avviato = true;
  const c = sb();
  c.auth.getSession().then(({ data }) => { if (data.session?.user) accesso(data.session.user); });
  c.auth.onAuthStateChange((evento, sessione) => {
    if (evento === 'SIGNED_IN' && sessione?.user && sessione.user.id !== info.utente?.id) accesso(sessione.user);
    if (evento === 'SIGNED_OUT') set({ utente: null, stato: 'off' });
  });
  subscribeStato(() => {
    if (!info.utente) return;
    clearTimeout(timer);
    timer = setTimeout(salva, 1200);
  });
}

// ── azioni per l'interfaccia ─────────────────────────────────
export async function inviaLink(email) {
  const { error } = await sb().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + '/casa' },
  });
  if (error) throw error;
}

export async function esci() {
  await sb().auth.signOut();
}

export async function leggiNotifiche() {
  if (!info.utente) return null;
  const { data } = await sb().from('notifiche').select('*').eq('user_id', info.utente.id).maybeSingle();
  return data;
}

export async function impostaNotifiche(attive) {
  if (!info.utente) return;
  const { error } = await sb().from('notifiche').upsert({ user_id: info.utente.id, email_avvisi: attive });
  if (error) throw error;
}

export async function emailDiProva() {
  const { data } = await sb().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Accedi prima di chiedere l\'anteprima.');
  await salva();
  const r = await fetch('/api/casa/email-prova', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.errore || 'Invio non riuscito.');
  return b;
}
