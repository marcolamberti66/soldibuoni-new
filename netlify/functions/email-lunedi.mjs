// ─────────────────────────────────────────────────────────────
// Ogni lunedì alle 6:00 UTC (7:00/8:00 in Italia): manda a chi
// l'ha attivata l'email con la settimana della casa.
// Richiede su Netlify: SUPABASE_SERVICE_ROLE_KEY (segreta) e
// BREVO_API_KEY. Se manca la prima, non fa nulla.
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { caricaStatoUtente } from '../../src/casa/dati-utente.js';
import { costruisciEmail, statoDaRighe } from '../../src/casa/email.js';
import { inviaEmail } from '../../src/casa/invio.js';

export default async () => {
  const URL_SB = process.env.PUBLIC_SUPABASE_URL || 'https://wudxegrfbjxwzuzadykh.supabase.co';
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const BREVO = process.env.BREVO_API_KEY;
  if (!SERVICE || !BREVO) {
    console.log('email-lunedi: manca SUPABASE_SERVICE_ROLE_KEY o BREVO_API_KEY, salto.');
    return new Response('non configurato', { status: 200 });
  }
  const db = createClient(URL_SB, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: iscritti, error } = await db.from('notifiche').select('user_id, ultimo_invio').eq('email_avvisi', true);
  if (error) { console.error('email-lunedi', error.message); return new Response('errore', { status: 500 }); }

  let inviate = 0, saltate = 0;
  const sogliaRipetizione = Date.now() - 5 * 86400000; // mai due volte nella stessa settimana
  for (const n of iscritti || []) {
    try {
      if (n.ultimo_invio && new Date(n.ultimo_invio).getTime() > sogliaRipetizione) { saltate++; continue; }
      const { data: u } = await db.auth.admin.getUserById(n.user_id);
      const email = u?.user?.email;
      if (!email) { saltate++; continue; }
      const stato = await caricaStatoUtente(db, n.user_id);
      if (!stato.casa) { saltate++; continue; }
      const msg = costruisciEmail(stato);
      if (!msg) { saltate++; continue; } // niente da dire: niente email
      await inviaEmail({ apiKey: BREVO, a: email, oggetto: msg.subject, html: msg.html, testo: msg.text, mittente: process.env.SENDER_EMAIL });
      await db.from('notifiche').update({ ultimo_invio: new Date().toISOString() }).eq('user_id', n.user_id);
      inviate++;
    } catch (e) {
      console.error('email-lunedi utente', n.user_id, e.message);
    }
  }
  console.log(`email-lunedi: inviate ${inviate}, saltate ${saltate}`);
  return new Response(JSON.stringify({ inviate, saltate }), { status: 200 });
};

export const config = { schedule: '0 6 * * 1' };
