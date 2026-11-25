// POST /api/casa/push-prova — manda una notifica di prova ai dispositivi
// dell'utente collegato. Usa il token dell'utente: vede solo le sue iscrizioni.
import { createClient } from '@supabase/supabase-js';
import { caricaStatoUtente } from '../../../casa/dati-utente.js';
import { inviaPush } from '../../../casa/push-server.js';
import { costruisciPush } from '../../../casa/push.js';
import { statoDaRighe } from '../../../casa/email.js';

export const prerender = false;

const env = (k) => (typeof process !== 'undefined' && process.env?.[k]) || (typeof Netlify !== 'undefined' && Netlify.env?.get?.(k)) || null;
const URL_SB = () => env('PUBLIC_SUPABASE_URL') || 'https://wudxegrfbjxwzuzadykh.supabase.co';
const KEY_SB = () => env('PUBLIC_SUPABASE_KEY') || 'sb_publishable_Bli_DiK4Irtz_ryD7Bi8ig_Wne9-zwi';
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function POST({ request, url }) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ errore: 'Accesso richiesto.' }, 401);
  const c = createClient(URL_SB(), KEY_SB(), {
    global: { headers: { Authorization: 'Bearer ' + token } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u, error: eu } = await c.auth.getUser(token);
  if (eu || !u?.user) return json({ errore: 'Sessione non valida: esci e rientra.' }, 401);
  const id = u.user.id;

  const { data: iscr, error } = await c.from('push_iscrizioni').select('*').eq('user_id', id);
  if (error) return json({ errore: 'Lettura iscrizioni non riuscita.' }, 500);
  if (!iscr?.length) return json({ errore: 'Nessun dispositivo iscritto: attiva prima le notifiche.' }, 404);

  // Anteprima vera, se oggi ci sarebbe qualcosa da dire; altrimenti una prova neutra.
  const stato = await caricaStatoUtente(c, id);
  const vero = costruisciPush(stato, { sito: url.origin });
  const msg = vero || {
    titolo: 'Notifiche attive',
    corpo: 'Ti scriveremo solo quando serve: scadenze del giorno, pagamenti da fare, offerte in scadenza.',
    url: url.origin + '/casa?origine=push',
    tag: 'sb-prova',
  };

  let ok = 0;
  for (const s of iscr) {
    const esito = await inviaPush(s, msg);
    if (esito === 'ok') ok++;
    if (esito === 'scaduta') await c.from('push_iscrizioni').delete().eq('id', s.id);
  }
  if (!ok) return json({ errore: 'Il dispositivo non ha accettato la notifica. Disattiva e riattiva le notifiche.' }, 502);
  return json({ inviate: ok });
}
