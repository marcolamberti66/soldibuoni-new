// GET /api/casa/push-chiave — chiave pubblica VAPID per iscriversi alle notifiche.
import { chiaviVapid } from '../../../casa/push-server.js';

export const prerender = false;

export async function GET() {
  try {
    const { publicKey } = await chiaviVapid();
    return new Response(JSON.stringify({ chiave: publicKey }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (e) {
    console.error('push-chiave', e.message);
    return new Response(JSON.stringify({ errore: 'Notifiche non disponibili.', dettaglio: String(e?.message || e).slice(0, 200) }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}
