// POST /api/casa/email-prova — manda all'utente collegato l'anteprima
// dell'email del lunedì, calcolata sui suoi dati. Usa il token
// dell'utente: legge solo ciò che le regole del database gli permettono.
import { createClient } from '@supabase/supabase-js';
import { costruisciEmail, statoDaRighe } from '../../../casa/email.js';
import { inviaEmail } from '../../../casa/invio.js';

export const prerender = false;

const env = (k) => (typeof process !== 'undefined' && process.env?.[k]) || (typeof Netlify !== 'undefined' && Netlify.env?.get?.(k)) || null;
const URL_SB = () => env('PUBLIC_SUPABASE_URL') || 'https://wudxegrfbjxwzuzadykh.supabase.co';
const KEY_SB = () => env('PUBLIC_SUPABASE_KEY') || 'sb_publishable_Bli_DiK4Irtz_ryD7Bi8ig_Wne9-zwi';
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function POST({ request, url }) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ errore: 'Accesso richiesto.' }, 401);
  const apiKey = env('BREVO_API_KEY');
  if (!apiKey) return json({ errore: 'Invio email non configurato.' }, 500);

  const c = createClient(URL_SB(), KEY_SB(), {
    global: { headers: { Authorization: 'Bearer ' + token } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u, error: eu } = await c.auth.getUser(token);
  if (eu || !u?.user?.email) return json({ errore: 'Sessione non valida: esci e rientra.' }, 401);
  const id = u.user.id;

  const [casa, documenti, ricorrenti, promemoria] = await Promise.all([
    c.from('case').select('*').eq('user_id', id).order('creato_il').limit(1),
    c.from('documenti').select('*').eq('user_id', id),
    c.from('ricorrenti').select('*').eq('user_id', id),
    c.from('promemoria').select('*').eq('user_id', id),
  ]);
  const err = [casa, documenti, ricorrenti, promemoria].find((r) => r.error);
  if (err) return json({ errore: 'Lettura dati non riuscita.' }, 500);

  const stato = statoDaRighe({ casa: casa.data[0], documenti: documenti.data, ricorrenti: ricorrenti.data, promemoria: promemoria.data });
  const email = costruisciEmail(stato, { sito: url.origin, forza: true });
  try {
    await inviaEmail({ apiKey, a: u.user.email, oggetto: '[Anteprima] ' + email.subject, html: email.html, testo: email.text, mittente: env('SENDER_EMAIL') });
  } catch (e) {
    console.error('email-prova', e.message);
    return json({ errore: 'Invio non riuscito. Riprova tra poco.' }, 502);
  }
  return json({ inviata: true, a: u.user.email });
}
