// ─────────────────────────────────────────────────────────────
// Ogni giorno alle 7:00 UTC (8:00/9:00 in Italia): una notifica
// push a chi l'ha attivata, solo se oggi c'è qualcosa da sapere
// (vedi src/casa/push.js). Le iscrizioni scadute vengono rimosse.
// Richiede su Netlify: SUPABASE_SERVICE_ROLE_KEY.
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { caricaStatoUtente } from '../../src/casa/dati-utente.js';
import { costruisciPush } from '../../src/casa/push.js';
import { statoDaRighe } from '../../src/casa/email.js';
import { inviaPush } from '../../src/casa/push-server.js';

export default async () => {
  const URL_SB = process.env.PUBLIC_SUPABASE_URL || 'https://wudxegrfbjxwzuzadykh.supabase.co';
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE) { console.log('push-quotidiano: manca SUPABASE_SERVICE_ROLE_KEY, salto.'); return new Response('non configurato'); }
  const db = createClient(URL_SB, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: iscr, error } = await db.from('push_iscrizioni').select('*');
  if (error) { console.error('push-quotidiano', error.message); return new Response('errore', { status: 500 }); }

  const perUtente = new Map();
  for (const s of iscr || []) perUtente.set(s.user_id, [...(perUtente.get(s.user_id) || []), s]);

  let inviate = 0, utenti = 0, rimosse = 0;
  for (const [uid, lista] of perUtente) {
    try {
      const stato = await caricaStatoUtente(db, uid);
      const msg = costruisciPush(stato);
      if (!msg) continue;
      utenti++;
      for (const s of lista) {
        const esito = await inviaPush(s, msg);
        if (esito === 'ok') inviate++;
        if (esito === 'scaduta') { await db.from('push_iscrizioni').delete().eq('id', s.id); rimosse++; }
      }
      await db.from('push_iscrizioni').update({ ultimo_invio: new Date().toISOString() }).eq('user_id', uid);
    } catch (e) {
      console.error('push-quotidiano utente', uid, e.message);
    }
  }
  console.log(`push-quotidiano: ${inviate} notifiche a ${utenti} utenti, ${rimosse} iscrizioni scadute rimosse`);
  return new Response(JSON.stringify({ inviate, utenti, rimosse }));
};

export const config = { schedule: '0 7 * * *' };
