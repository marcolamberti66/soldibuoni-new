// ─────────────────────────────────────────────────────────────
// Telefono e app installata: invito all'installazione, notifiche
// push e il conteggio anonimo degli usi.
// ─────────────────────────────────────────────────────────────
import { useEffect, useSyncExternalStore } from 'react';
import { sb } from './sync.js';

const finestra = typeof window !== 'undefined';

// ── ambiente ─────────────────────────────────────────────────
export function ambiente() {
  if (!finestra) return {};
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  const safari = ios && !/CriOS|FxiOS|EdgiOS|GSA\//.test(ua);
  const push = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  return { ios, android, standalone, safari, push, mobile: ios || android };
}

// ── installazione ────────────────────────────────────────────
// Il prompt di sistema viene catturato nel layout (window.__sbPrompt),
// così il pulsante "Scarica l'app" del sito e quello dell'app usano lo stesso.
let installata = false;
const ascInst = new Set();
const notificaInst = () => ascInst.forEach((f) => f());
if (finestra) {
  document.addEventListener('sb-installabile', notificaInst);
  document.addEventListener('sb-installata', () => { installata = true; conta('app_installata'); notificaInst(); });
}
const leggiInst = () => (installata ? 'installata' : finestra && window.__sbPrompt ? 'pronta' : 'no');

/** 'pronta' (c'è il pulsante di sistema), 'installata', 'no'. */
export function useInstallazione() {
  return useSyncExternalStore((f) => { ascInst.add(f); return () => ascInst.delete(f); }, leggiInst, () => 'no');
}

/** Apre la finestra "Scarica l'app" del sito (istruzioni giuste per il dispositivo). */
export function apriScaricaApp(origine = 'app') {
  if (finestra && window.sbApp) window.sbApp.apri(origine);
}

export async function installa() {
  const p = finestra && window.__sbPrompt;
  if (!p) { apriScaricaApp(); return false; }
  p.prompt();
  const { outcome } = await p.userChoice.catch(() => ({ outcome: 'dismissed' }));
  window.__sbPrompt = null;
  notificaInst();
  return outcome === 'accepted';
}

// ── notifiche push ───────────────────────────────────────────
function b64ToUint8(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const s = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function registrazione() {
  if (!('serviceWorker' in navigator)) return null;
  const r = await navigator.serviceWorker.getRegistration();
  if (r) return r;
  await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
}

/** 'non-supportate' | 'serve-app' | 'bloccate' | 'attive' | 'spente' */
export async function statoPush() {
  const a = ambiente();
  if (!a.push) return a.ios && !a.standalone ? 'serve-app' : 'non-supportate';
  if (Notification.permission === 'denied') return 'bloccate';
  const r = await registrazione().catch(() => null);
  const s = await r?.pushManager.getSubscription().catch(() => null);
  return s && Notification.permission === 'granted' ? 'attive' : 'spente';
}

async function salvaIscrizione(s) {
  const { data } = await sb().auth.getUser();
  if (!data?.user) throw new Error('Accedi per ricevere le notifiche.');
  const j = s.toJSON();
  const a = ambiente();
  const { error } = await sb().from('push_iscrizioni').upsert({
    user_id: data.user.id,
    endpoint: j.endpoint,
    p256dh: j.keys.p256dh,
    auth: j.keys.auth,
    dispositivo: a.ios ? 'iPhone' : a.android ? 'Android' : 'Computer',
  }, { onConflict: 'endpoint' });
  if (error) throw error;
}

export async function attivaPush() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error(perm === 'denied'
    ? 'Le notifiche sono bloccate: riattivale dalle impostazioni del telefono per SoldiBuoni.'
    : 'Permesso non concesso.');
  const r = await registrazione();
  let s = await r.pushManager.getSubscription();
  if (!s) {
    const res = await fetch('/api/casa/push-chiave');
    const { chiave } = await res.json();
    if (!chiave) throw new Error('Notifiche non disponibili in questo momento.');
    s = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(chiave) });
  }
  await salvaIscrizione(s);
  conta('push_attivate');
}

export async function disattivaPush() {
  const r = await registrazione().catch(() => null);
  const s = await r?.pushManager.getSubscription().catch(() => null);
  if (!s) return;
  await sb().from('push_iscrizioni').delete().eq('endpoint', s.endpoint).then(() => {}, () => {});
  await s.unsubscribe().catch(() => {});
}

/** Dopo un accesso: se questo dispositivo ha già un'iscrizione, la lega all'account. */
export async function ricollegaPush() {
  try {
    if (!ambiente().push || Notification.permission !== 'granted') return;
    const r = await navigator.serviceWorker.getRegistration();
    const s = await r?.pushManager.getSubscription();
    if (s) await salvaIscrizione(s);
  } catch (_) {}
}

export async function provaPush() {
  const { data } = await sb().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Accedi prima di provare le notifiche.');
  const r = await fetch('/api/casa/push-prova', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.errore || 'Invio non riuscito.');
  return b;
}

// ── conteggio anonimo degli usi ──────────────────────────────
// Nessun cookie, nessun identificativo: ogni evento è una riga con
// nome, giorno e un dettaglio grossolano (es. da quanto usi l'app).
// Non è possibile collegare due eventi alla stessa persona.
const EVENTI = new Set(['apertura', 'onboarding', 'bolletta_letta', 'bolletta_errore', 'voce_manuale', 'spesa_fissa',
  'account', 'push_attivate', 'app_installata', 'invito_install', 'condivisione']);

if (finestra) window.sbConta = (n, d) => conta(n, d);

export function conta(nome, dettaglio = null) {
  if (!finestra || !EVENTI.has(nome)) return;
  if (/^(localhost|127\.|192\.168\.)/.test(location.hostname) || navigator.webdriver) return;
  try {
    sb().from('eventi').insert({ nome, dettaglio: dettaglio == null ? null : String(dettaglio).slice(0, 40) }).then(() => {}, () => {});
  } catch (_) {}
}

/** Una volta per sessione: apertura dell'app, con anzianità d'uso e modalità (app installata o browser). */
export function useApertura() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('sb_apertura')) return;
      sessionStorage.setItem('sb_apertura', '1');
      const oggi = new Date().toISOString().slice(0, 10);
      let primo = localStorage.getItem('sb_primo_uso');
      if (!primo) { primo = oggi; localStorage.setItem('sb_primo_uso', oggi); }
      const g = Math.round((Date.parse(oggi) - Date.parse(primo)) / 86400000);
      const fascia = g === 0 ? 'giorno0' : g <= 7 ? 'g1-7' : g <= 30 ? 'g8-30' : g <= 90 ? 'g31-90' : 'g90+';
      const origine = new URLSearchParams(location.search).get('origine');
      conta('apertura', `${fascia}·${ambiente().standalone ? 'app' : 'web'}${origine === 'push' ? '·push' : ''}`);
    } catch (_) {}
  }, []);
}
