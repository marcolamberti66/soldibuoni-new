// ─────────────────────────────────────────────────────────────
// Lato server delle notifiche push (Web Push con chiavi VAPID).
// Le chiavi si creano da sole al primo uso e restano in Netlify
// Blobs: nessuna variabile d'ambiente da configurare. Se in futuro
// servisse fissarle, VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY su
// Netlify hanno la precedenza.
// ─────────────────────────────────────────────────────────────
import webpush from 'web-push';

const env = (k) =>
  (typeof process !== 'undefined' && process.env?.[k]) ||
  (typeof Netlify !== 'undefined' && Netlify.env?.get?.(k)) || null;

let cache = null;

export async function chiaviVapid() {
  if (cache) return cache;
  if (env('VAPID_PUBLIC_KEY') && env('VAPID_PRIVATE_KEY')) {
    cache = { publicKey: env('VAPID_PUBLIC_KEY'), privateKey: env('VAPID_PRIVATE_KEY') };
    return cache;
  }
  const { getStore } = await import('@netlify/blobs');
  const store = getStore('config');
  let k = await store.get('vapid', { type: 'json' });
  if (!k?.publicKey || !k?.privateKey) {
    await store.setJSON('vapid', webpush.generateVAPIDKeys());
    k = await store.get('vapid', { type: 'json' }); // rilettura: in caso di corsa vince una sola coppia
  }
  cache = k;
  return k;
}

/** Invia a una iscrizione. Restituisce 'ok' | 'scaduta' | 'errore'. */
export async function inviaPush(iscrizione, messaggio) {
  const k = await chiaviVapid();
  try {
    await webpush.sendNotification(
      { endpoint: iscrizione.endpoint, keys: { p256dh: iscrizione.p256dh, auth: iscrizione.auth } },
      JSON.stringify(messaggio),
      {
        vapidDetails: { subject: 'mailto:' + (env('SENDER_EMAIL') || 'ciao@soldibuoni.it'), publicKey: k.publicKey, privateKey: k.privateKey },
        TTL: 60 * 60 * 12,
        urgency: 'normal',
      },
    );
    return 'ok';
  } catch (e) {
    if (e?.statusCode === 404 || e?.statusCode === 410) return 'scaduta';
    console.error('push', e?.statusCode, e?.body || e?.message);
    return 'errore';
  }
}
