// GET  /api/casa/disiscrivi?u=…&t=… — pagina di conferma (un clic).
// POST /api/casa/disiscrivi?u=…&t=… — disattiva l'email del lunedì.
// Il POST serve anche alla disiscrizione "one-click" dei client di
// posta (RFC 8058, intestazione List-Unsubscribe-Post). Il GET non
// modifica nulla, così i controlli antispam che aprono i link non
// disiscrivono nessuno per sbaglio.
import { createClient } from '@supabase/supabase-js';
import { verifica } from '../../../casa/firma.js';

export const prerender = false;

const env = (k) => (typeof process !== 'undefined' && process.env?.[k]) || (typeof Netlify !== 'undefined' && Netlify.env?.get?.(k)) || null;
const URL_SB = () => env('PUBLIC_SUPABASE_URL') || 'https://wudxegrfbjxwzuzadykh.supabase.co';

const pagina = (titolo, testo, form = '') => new Response(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${titolo} — SoldiBuoni</title>
<style>body{margin:0;background:#f5f2ec;color:#17150f;font:16px/1.6 Georgia,serif;display:grid;place-items:center;min-height:100vh}main{max-width:440px;padding:32px 24px}h1{font-size:28px;font-weight:400;margin:0 0 12px}p{color:#47433a;margin:0 0 20px}button{font:inherit;background:#17150f;color:#f5f2ec;border:0;border-radius:999px;padding:12px 22px;cursor:pointer}a{color:#2c5a43}</style></head>
<body><main><h1>${titolo}</h1><p>${testo}</p>${form}<p style="font-size:14px;margin-top:24px"><a href="/casa">Apri La tua casa</a></p></main></body></html>`,
  { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

function parametri(url) {
  return { u: url.searchParams.get('u'), t: url.searchParams.get('t') };
}

export async function GET({ url }) {
  const { u, t } = parametri(url);
  if (!verifica(u, t, env('SUPABASE_SERVICE_ROLE_KEY'))) return pagina('Link non valido', 'Il link non è valido o è incompleto. Puoi disattivare l\'email del lunedì da La casa, dopo aver fatto l\'accesso.');
  return pagina('Email del lunedì', 'Vuoi smettere di ricevere il riepilogo settimanale? Puoi riattivarlo quando vuoi da La casa.',
    `<form method="post"><button type="submit">Non inviarmela più</button></form>`);
}

export async function POST({ url }) {
  const { u, t } = parametri(url);
  const segreto = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!verifica(u, t, segreto)) return pagina('Link non valido', 'Il link non è valido o è incompleto.');
  const db = createClient(URL_SB(), segreto, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await db.from('notifiche').update({ email_avvisi: false }).eq('user_id', u);
  if (error) {
    console.error('disiscrivi', error.message);
    return pagina('Qualcosa non va', 'Non sono riuscito a registrare la richiesta. Riprova tra poco, oppure disattiva l\'email da La casa.');
  }
  return pagina('Fatto', 'Non riceverai più l\'email del lunedì. Il tuo account e i dati della casa restano come sono.');
}
