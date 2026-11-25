// ─────────────────────────────────────────────────────────────
// Guardie comuni per le chiamate al modello dei vecchi calcolatori
// (luce-gas, internet, conti, RC auto).
// · un tetto giornaliero condiviso, così un abuso non svuota il credito;
// · il modello più economico disponibile, con ripiego se non esiste.
// ─────────────────────────────────────────────────────────────

const env = (k) =>
  (typeof process !== 'undefined' && process.env?.[k]) ||
  (typeof Netlify !== 'undefined' && Netlify.env?.get?.(k)) || null;

const MODELLI = () => [env('LEGACY_MODEL'), 'claude-haiku-5-5', 'claude-haiku-4-5'].filter(Boolean);
const LIMITE = () => Number(env('LEGACY_DAILY_CAP') || 100);

async function contatore(incrementa) {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('rate-limits');
    const k = 'legacy-estrai-' + new Date().toISOString().slice(0, 10);
    const n = Number((await store.get(k)) || 0);
    if (incrementa) await store.set(k, String(n + 1));
    return n;
  } catch { return 0; }
}

/** Restituisce una Response 429 se il tetto di oggi è raggiunto, altrimenti null. */
export async function limiteSuperato() {
  if ((await contatore(false)) < LIMITE()) return null;
  return new Response(JSON.stringify({
    error: 'Limite giornaliero raggiunto',
    detail: 'Per oggi abbiamo esaurito le letture automatiche. Inserisci i dati a mano o riprova domani.',
  }), { status: 429, headers: { 'Content-Type': 'application/json' } });
}

/** Come client.messages.create, ma prova i modelli in ordine e conta la chiamata riuscita. */
export async function creaConRipiego(client, params) {
  let ultimoErrore;
  for (const model of MODELLI()) {
    try {
      const r = await client.messages.create({ ...params, model });
      await contatore(true);
      return r;
    } catch (e) {
      ultimoErrore = e;
      if (e?.status !== 404 && e?.status !== 400) break;
    }
  }
  throw ultimoErrore;
}
