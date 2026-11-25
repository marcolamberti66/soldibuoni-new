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
  case: ['id', 'nome', 'cap', 'persone', 'mq', 'riscaldamento', 'titolo', 'creato_il', 'aggiornato_il'],
  documenti: ['id', 'categoria', 'fornitore', 'offerta', 'periodo_dal', 'periodo_al', 'data_emissione', 'scadenza_pagamento',
    'fine_condizioni', 'importo', 'consumo', 'unita', 'consumo_annuo_dichiarato', 'prezzo_materia', 'quota_fissa_mese',
    'canone_mensile', 'tipo_prezzo', 'potenza_kw', 'consumi_stimati', 'conguaglio', 'domiciliazione', 'pagato', 'fonte',
    'affidabilita', 'creato_il', 'aggiornato_il'],
  ricorrenti: ['id', 'categoria', 'nome', 'importo', 'frequenza', 'prossima_scadenza', 'data_fine', 'domiciliazione',
    'attiva', 'tasso', 'tipo_tasso', 'debito_residuo', 'prima_casa', 'creato_il', 'aggiornato_il'],
  promemoria: ['id', 'titolo', 'data', 'categoria', 'fatto', 'creato_il', 'aggiornato_il'],
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
// Ogni casa è di chi ci vive: il proprietario e i membri invitati.
// La sincronizzazione è sempre "scarica, unisci, carica":
//  · tra due versioni dello stesso elemento vince la modifica più recente;
//  · un elemento cancellato qui viene cancellato sul database (lista "eliminati");
//  · un elemento che il database conosceva e ora non ha più è stato
//    cancellato altrove (altro dispositivo o altra persona): sparisce anche qui.
const TABELLE = ['documenti', 'ricorrenti', 'promemoria'];
const vuotoSync = () => ({ noti: { documenti: [], ricorrenti: [], promemoria: [] }, eliminati: { documenti: [], ricorrenti: [], promemoria: [] } });
const quando = (x) => Date.parse(x?.aggiornato_il || x?.creato_il || '') || 0;

async function casaRemota(uid) {
  const c = sb();
  const { data: membro, error: e0 } = await c.from('case_membri').select('casa_id').eq('user_id', uid).limit(1);
  if (e0 && e0.code !== '42P01') throw e0; // tabella assente: migrazione non ancora eseguita
  if (membro?.[0]) {
    const { data, error } = await c.from('case').select('*').eq('id', membro[0].casa_id).maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  const { data, error } = await c.from('case').select('*').eq('user_id', uid).order('creato_il').limit(1);
  if (error) throw error;
  return data[0] || null;
}

async function scaricaCasa(casaRiga) {
  const c = sb();
  const ris = await Promise.all(TABELLE.map((t) => c.from(t).select('*').eq('casa_id', casaRiga.id)));
  for (const r of ris) if (r.error) throw r.error;
  const casa = daDb(casaRiga);
  casa.proprietario = casaRiga.user_id;
  return { casa, documenti: ris[0].data.map(daDb), ricorrenti: ris[1].data.map(daDb), promemoria: ris[2].data.map(daDb) };
}

function unisciLista(locale, remota, noti, eliminati) {
  const R = new Map(remota.map((x) => [x.id, x]));
  const elim = new Set(eliminati), conosciuti = new Set(noti);
  const out = [];
  for (const x of locale) {
    const r = R.get(x.id);
    if (r) { out.push(quando(r) > quando(x) ? r : x); R.delete(x.id); }
    else if (!conosciuti.has(x.id)) out.push(x); // nuovo, mai salvato: resta e verrà caricato
    // altrimenti: il database lo conosceva e non c'è più → cancellato altrove
  }
  for (const r of R.values()) if (!elim.has(r.id)) out.push(r);
  return out;
}

const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let applicando = false;

async function idValidi() {
  const s = getStato();
  if (!s.casa) return;
  const tutti = [s.casa, ...TABELLE.flatMap((t) => s[t])];
  if (tutti.every((x) => UUID.test(x.id))) return;
  const { uid: nuovo } = await import('./model.js');
  const fix = (x) => (UUID.test(x.id) ? x : { ...x, id: nuovo() });
  aggiorna((st) => ({ casa: fix(st.casa), documenti: st.documenti.map(fix), ricorrenti: st.ricorrenti.map(fix), promemoria: st.promemoria.map(fix) }));
}

async function sincronizza(uid) {
  await idValidi();
  const c = sb();
  const riga = await casaRemota(uid);
  const s = getStato();
  const sy = s._sync || vuotoSync();

  let unito;
  if (riga) {
    const r = await scaricaCasa(riga);
    // Se la casa locale è un'altra (prima volta, o casa appena condivisa), i dati
    // locali non ancora salvati confluiscono nella casa del database.
    const stessa = s.casa && s.casa.id === r.casa.id;
    const casa = stessa && quando(s.casa) > quando(r.casa) ? { ...r.casa, ...s.casa, proprietario: r.casa.proprietario } : r.casa;
    unito = { casa };
    for (const t of TABELLE) unito[t] = unisciLista(s[t], r[t], stessa ? sy.noti[t] || [] : [], sy.eliminati[t] || []);
  } else {
    if (!s.casa) return; // niente da nessuna parte
    unito = { casa: { ...s.casa, proprietario: uid } };
    for (const t of TABELLE) unito[t] = s[t];
  }

  // Carica: casa, elementi, cancellazioni.
  const casaId = unito.casa.id;
  const { error: e1 } = await c.from('case').upsert(versoDb(unito.casa, 'case', { user_id: unito.casa.proprietario || uid }));
  if (e1) throw e1;
  for (const t of TABELLE) {
    const righe = unito[t].map((x) => versoDb(x, t, { user_id: uid, casa_id: casaId }));
    if (righe.length) {
      const { error } = await c.from(t).upsert(righe);
      if (error) throw error;
    }
    const via = (sy.eliminati[t] || []).filter((id) => UUID.test(id));
    if (via.length) {
      const { error } = await c.from(t).delete().in('id', via);
      if (error) throw error;
    }
  }

  const nuovoSync = { noti: Object.fromEntries(TABELLE.map((t) => [t, unito[t].map((x) => x.id)])), eliminati: vuotoSync().eliminati };
  const attuale = getStato();
  // Modificato qualcosa mentre caricavamo? Non sovrascriviamo: un nuovo giro unirà tutto.
  if (attuale !== s) { ancora = true; return; }
  const prossimo = { ...unito, _sync: nuovoSync };
  if (!uguali({ casa: attuale.casa, documenti: attuale.documenti, ricorrenti: attuale.ricorrenti, promemoria: attuale.promemoria, _sync: attuale._sync }, prossimo)) {
    applicando = true;
    try { aggiorna(() => prossimo); } finally { applicando = false; }
  }
}

// ── ciclo di vita ────────────────────────────────────────────
let timer = null, avviato = false, inCorso = null, ancora = false;

async function salva() {
  if (!info.utente) return;
  if (inCorso) { ancora = true; return inCorso; }
  set({ stato: 'salvataggio' });
  inCorso = (async () => {
    try {
      await sincronizza(info.utente.id);
      set({ stato: 'ok', errore: null, ultimo: new Date() });
    } catch (e) {
      console.error('sync', e);
      set({ stato: 'errore', errore: e.message || String(e) });
    } finally {
      inCorso = null;
      if (ancora) { ancora = false; salva(); }
    }
  })();
  return inCorso;
}

const INVITO = 'sb_invito';
export function invitoInAttesa() { try { return localStorage.getItem(INVITO); } catch { return null; } }
export function ricordaInvito(codice) { try { codice ? localStorage.setItem(INVITO, codice.toUpperCase()) : localStorage.removeItem(INVITO); } catch {} }

async function applicaInvito() {
  const codice = invitoInAttesa();
  if (!codice) return;
  const { error } = await sb().rpc('accetta_invito', { p_codice: codice });
  ricordaInvito(null);
  if (error) {
    const m = error.message || '';
    set({ invito: { errore: m.includes('scaduto') ? 'L\'invito è scaduto: chiedine uno nuovo.' : m.includes('usato') ? 'L\'invito è già stato usato: chiedine uno nuovo.' : 'Invito non valido: chiedine uno nuovo.' } });
    return;
  }
  set({ invito: { ok: true } });
  import('./dispositivo.js').then((m) => m.conta('invito_accettato')).catch(() => {});
  // I dati locali confluiscono nella casa condivisa: la casa locale lascia il posto a quella del database.
  aggiorna(() => ({ _sync: vuotoSync(), casa: null }));
}

/** Da chiamare quando si apre un link d'invito: se sei già dentro, entra subito. */
export async function usaInvito(codice) {
  ricordaInvito(codice);
  if (!info.utente) return false;
  set({ stato: 'salvataggio' });
  await applicaInvito();
  await salva();
  return true;
}

async function accesso(utente) {
  set({ utente, stato: 'salvataggio' });
  try {
    await applicaInvito();
    await sb().from('notifiche').upsert({ user_id: utente.id }, { onConflict: 'user_id', ignoreDuplicates: true });
  } catch (e) { console.error('accesso', e); }
  await salva();
  import('./dispositivo.js').then((m) => m.ricollegaPush()).catch(() => {});
}

export function avviaSync() {
  if (avviato || typeof window === 'undefined') return;
  avviato = true;
  const c = sb();
  c.auth.getSession().then(({ data }) => { if (data.session?.user) accesso(data.session.user); });
  c.auth.onAuthStateChange((evento, sessione) => {
    if (evento === 'SIGNED_IN' && sessione?.user && sessione.user.id !== info.utente?.id) {
      accesso(sessione.user);
      import('./dispositivo.js').then((m) => m.conta('account')).catch(() => {});
    }
    if (evento === 'SIGNED_OUT') set({ utente: null, stato: 'off' });
  });
  subscribeStato(() => {
    if (!info.utente || applicando) return;
    clearTimeout(timer);
    timer = setTimeout(salva, 1200);
  });
  // Le modifiche di chi vive con te arrivano quando riapri l'app e, ad app aperta, ogni minuto.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') salva(); });
  setInterval(() => { if (document.visibilityState === 'visible') salva(); }, 60000);
}

// ── azioni per l'interfaccia ─────────────────────────────────
export async function inviaLink(email) {
  const { error } = await sb().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + '/casa' },
  });
  if (error) throw error;
}

export async function verificaCodice(email, codice) {
  const token = String(codice).replace(/\D/g, '');
  const { error } = await sb().auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
}

export async function esci() {
  // Il dispositivo smette di ricevere le notifiche di questo account.
  await import('./dispositivo.js').then((m) => m.disattivaPush()).catch(() => {});
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

// ── casa condivisa ───────────────────────────────────────────
const LETTERE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Crea un invito per la casa attuale e restituisce il link da mandare. */
export async function creaInvito() {
  if (!info.utente) throw new Error('Accedi con la tua email per invitare qualcuno.');
  await salva();
  const casa = getStato().casa;
  if (!casa) throw new Error('Prima crea la tua casa.');
  const byte = crypto.getRandomValues(new Uint8Array(8));
  const codice = Array.from(byte, (b) => LETTERE[b % LETTERE.length]).join('');
  const { error } = await sb().from('inviti').insert({ codice, casa_id: casa.id });
  if (error) throw new Error('Non riesco a creare l\'invito: riprova tra poco.');
  import('./dispositivo.js').then((m) => m.conta('invito_creato')).catch(() => {});
  return { codice, link: `${window.location.origin}/casa?invito=${codice}` };
}

export async function invitoValido(codice) {
  const { data, error } = await sb().rpc('invito_valido', { p_codice: codice });
  return !error && data === true;
}

/** Persone che vivono nella casa (email). */
export async function personeCasa() {
  const casa = getStato().casa;
  if (!info.utente || !casa) return [];
  const { data, error } = await sb().rpc('persone_casa', { p_casa: casa.id });
  return error ? [] : data;
}

/** Il proprietario toglie qualcuno, oppure un membro esce dalla casa. */
export async function rimuoviPersona(userId) {
  const casa = getStato().casa;
  const { error } = await sb().from('case_membri').delete().eq('casa_id', casa.id).eq('user_id', userId);
  if (error) throw new Error('Operazione non riuscita.');
  if (userId === info.utente?.id) {
    // Chi esce tiene una copia dei dati sul dispositivo, come casa propria nuova.
    const { uid: nuovo } = await import('./model.js');
    aggiorna((s) => ({
      casa: { ...s.casa, id: nuovo(), proprietario: userId, aggiornato_il: new Date().toISOString() },
      documenti: s.documenti.map((x) => ({ ...x, id: nuovo() })),
      ricorrenti: s.ricorrenti.map((x) => ({ ...x, id: nuovo() })),
      promemoria: s.promemoria.map((x) => ({ ...x, id: nuovo() })),
      _sync: vuotoSync(),
    }));
  }
}

/** Elimina la casa anche dal database (proprietario) o esce dalla casa (membro). */
export async function eliminaCasaRemota() {
  const casa = getStato().casa;
  if (!info.utente || !casa) return;
  if (!casa.proprietario || casa.proprietario === info.utente.id) {
    const { error } = await sb().from('case').delete().eq('id', casa.id);
    if (error) throw new Error('Non riesco a eliminare i dati dall\'account.');
  } else {
    await sb().from('case_membri').delete().eq('casa_id', casa.id).eq('user_id', info.utente.id);
  }
}

export const sincronizzaOra = () => salva();
export const chiudiAvvisoInvito = () => set({ invito: null });
