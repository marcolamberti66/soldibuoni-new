// POST /api/casa/elimina-account — cancella l'account dell'utente
// collegato. Le tabelle sono legate ad auth.users con "on delete
// cascade": case create dall'utente (con documenti, spese, scadenze,
// conviventi e movimenti), appartenenze a case altrui, notifiche e
// iscrizioni push spariscono insieme all'account.
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const env = (k) => (typeof process !== 'undefined' && process.env?.[k]) || (typeof Netlify !== 'undefined' && Netlify.env?.get?.(k)) || null;
const URL_SB = () => env('PUBLIC_SUPABASE_URL') || 'https://wudxegrfbjxwzuzadykh.supabase.co';
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function POST({ request }) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ errore: 'Accesso richiesto.' }, 401);
  const segreto = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!segreto) return json({ errore: 'Cancellazione non disponibile: scrivici e la facciamo a mano.' }, 500);

  const db = createClient(URL_SB(), segreto, { auth: { persistSession: false, autoRefreshToken: false } });
  // L'identità viene dal token, mai da un parametro: si può cancellare solo sé stessi.
  const { data: u, error: eu } = await db.auth.getUser(token);
  if (eu || !u?.user?.id) return json({ errore: 'Sessione non valida: esci e rientra.' }, 401);

  const { error } = await db.auth.admin.deleteUser(u.user.id);
  if (error) {
    console.error('elimina-account', u.user.id, error.message);
    return json({ errore: 'Cancellazione non riuscita. Riprova tra poco o scrivici.' }, 502);
  }
  return json({ eliminato: true });
}
