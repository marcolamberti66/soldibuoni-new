// POST /api/disiscrivi-1click?u=…&t=… — disiscrizione "one-click"
// dall'intestazione List-Unsubscribe-Post (RFC 8058): la chiamata
// arriva dal client di posta (Gmail, Apple Mail…), quindi da fuori
// dal sito, e non può passare dalle route Astro, che rifiutano i POST
// cross-site. Il link visibile nell'email resta /api/casa/disiscrivi.
import { createClient } from '@supabase/supabase-js';
import { verifica } from '../../src/casa/firma.js';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Metodo non ammesso', { status: 405 });
  const url = new URL(req.url);
  const u = url.searchParams.get('u'), t = url.searchParams.get('t');
  const segreto = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!verifica(u, t, segreto)) return new Response('Link non valido', { status: 400 });
  const db = createClient(process.env.PUBLIC_SUPABASE_URL || 'https://wudxegrfbjxwzuzadykh.supabase.co', segreto, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await db.from('notifiche').update({ email_avvisi: false }).eq('user_id', u);
  if (error) { console.error('disiscrivi-1click', error.message); return new Response('Errore', { status: 500 }); }
  return new Response('Disiscritto', { status: 200 });
};

export const config = { path: '/api/disiscrivi-1click' };
