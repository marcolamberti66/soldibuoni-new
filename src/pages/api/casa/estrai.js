// ─────────────────────────────────────────────────────────────
// POST /api/casa/estrai
// Riceve una bolletta (PDF o immagine) e restituisce i dati
// economici strutturati. Il file NON viene salvato: è letto,
// passato al modello e scartato. I dati personali sono esclusi
// per istruzione e per schema (non esistono campi per riceverli).
// ─────────────────────────────────────────────────────────────
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const env = (k) =>
  (typeof process !== 'undefined' && process.env?.[k]) ||
  (typeof Netlify !== 'undefined' && Netlify.env?.get?.(k)) || null;

// Primo modello disponibile tra quelli in lista (il primo che l'API accetta).
const MODELLI = () => [env('CASA_MODEL'), 'claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5'].filter(Boolean);
const LIMITE_GIORNALIERO = () => Number(env('CASA_DAILY_CAP') || 300);

const DOC_SCHEMA = {
  type: 'object',
  properties: {
    categoria: { type: 'string', enum: ['luce', 'gas', 'internet', 'mobile', 'acqua', 'tari', 'condominio', 'altro'] },
    fornitore: { type: ['string', 'null'], description: 'Nome commerciale del fornitore (es. "Enel Energia", "Hera Comm", "Fastweb").' },
    offerta: { type: ['string', 'null'], description: 'Nome dell\'offerta o del piano tariffario, se indicato.' },
    periodo_dal: { type: ['string', 'null'], description: 'Inizio del periodo fatturato, formato YYYY-MM-DD.' },
    periodo_al: { type: ['string', 'null'], description: 'Fine del periodo fatturato, formato YYYY-MM-DD.' },
    data_emissione: { type: ['string', 'null'], description: 'Data di emissione del documento, YYYY-MM-DD.' },
    scadenza_pagamento: { type: ['string', 'null'], description: 'Data entro cui pagare, YYYY-MM-DD.' },
    importo: { type: ['number', 'null'], description: 'Totale da pagare in euro per questo servizio, IVA inclusa.' },
    consumo: { type: ['number', 'null'], description: 'Consumo del periodo fatturato (kWh luce, Smc gas, m³ acqua). Somma le fasce se divise. Null per internet/mobile.' },
    unita: { type: ['string', 'null'], enum: ['kWh', 'Smc', 'm³', null] },
    consumo_annuo_dichiarato: { type: ['number', 'null'], description: 'Consumo annuo riportato in bolletta (es. "consumo annuo" o "ultimi 12 mesi"), se presente.' },
    prezzo_materia: { type: ['number', 'null'], description: 'Prezzo unitario della sola componente energia/gas (€/kWh o €/Smc), IVA esclusa. Se indicizzato (PUN/PSV + spread) usa il valore effettivo applicato nel periodo se scritto; altrimenti null.' },
    quota_fissa_mese: { type: ['number', 'null'], description: 'Quota fissa di commercializzazione in €/mese, se indicata.' },
    canone_mensile: { type: ['number', 'null'], description: 'Solo internet/mobile: canone mensile attuale in euro.' },
    tipo_prezzo: { type: ['string', 'null'], enum: ['fisso', 'variabile', 'tutela', null] },
    fine_condizioni: { type: ['string', 'null'], description: 'Data di scadenza delle condizioni economiche o fine promozione, YYYY-MM-DD. Spesso scritta come "le condizioni economiche sono valide fino al" o "prezzo bloccato fino al".' },
    potenza_kw: { type: ['number', 'null'], description: 'Solo luce: potenza impegnata in kW.' },
    consumi_stimati: { type: ['boolean', 'null'], description: 'true se la bolletta è basata in tutto o in parte su consumi stimati e non su letture reali.' },
    conguaglio: { type: ['boolean', 'null'], description: 'true se contiene un conguaglio o ricalcolo di periodi precedenti.' },
    domiciliazione: { type: ['boolean', 'null'], description: 'true se il pagamento è addebitato automaticamente su conto (SDD/RID/domiciliazione) o carta.' },
  },
  required: ['categoria', 'importo'],
};

const TOOL = {
  name: 'registra_documenti',
  description: 'Registra i dati economici di una bolletta o fattura domestica italiana.',
  input_schema: {
    type: 'object',
    properties: {
      documenti: { type: 'array', items: DOC_SCHEMA, description: 'Uno per servizio. Una bolletta dual luce+gas con subtotali separati diventa due documenti.' },
      affidabilita: { type: 'string', enum: ['alta', 'media', 'bassa'] },
      non_e_una_bolletta: { type: 'boolean', description: 'true se il file non è una bolletta o fattura di un servizio domestico.' },
    },
    required: ['documenti', 'affidabilita'],
  },
};

const SYSTEM = `Leggi bollette e fatture domestiche italiane (luce, gas, acqua, internet, telefonia, TARI, condominio) ed estrai solo dati economici e di consumo.

Regole:
- Non inventare mai un numero. Se un dato non è scritto chiaramente, usa null.
- Ignora e non riportare mai dati personali: nomi, indirizzi, codice fiscale, POD, PDR, codice cliente, IBAN.
- Date sempre in formato YYYY-MM-DD.
- "importo" è il totale da pagare per quel servizio, IVA inclusa. Per bollette dual con subtotali separati crea due documenti; senza subtotali crea un solo documento di categoria "luce" e consumi null.
- "prezzo_materia" è il prezzo della sola componente energia/gas, non il costo medio totale.
- Chiama sempre lo strumento registra_documenti.`;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

async function contatore(incrementa) {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('rate-limits');
    const k = 'casa-estrai-' + new Date().toISOString().slice(0, 10);
    const n = Number((await store.get(k)) || 0);
    if (incrementa) await store.set(k, String(n + 1));
    return n;
  } catch { return 0; } // in locale o se Blobs non risponde: non blocchiamo
}

export async function POST({ request }) {
  const apiKey = env('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ errore: 'Servizio di lettura non configurato.' }, 500);

  if ((await contatore(false)) >= LIMITE_GIORNALIERO()) {
    return json({ errore: 'Abbiamo raggiunto il limite di letture automatiche per oggi. Puoi inserire i dati a mano o riprovare domani.' }, 429);
  }

  let file;
  try {
    const form = await request.formData();
    file = form.get('file');
  } catch { return json({ errore: 'Richiesta non valida.' }, 400); }
  if (!file || typeof file === 'string') return json({ errore: 'Nessun file ricevuto.' }, 400);
  if (file.size > MAX_FILE_BYTES) return json({ errore: 'Il file supera 8 MB.' }, 413);

  const tipo = file.type || '';
  const data = Buffer.from(await file.arrayBuffer()).toString('base64');
  let blocco;
  if (tipo === 'application/pdf') blocco = { type: 'document', source: { type: 'base64', media_type: tipo, data } };
  else if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(tipo)) blocco = { type: 'image', source: { type: 'base64', media_type: tipo, data } };
  else return json({ errore: 'Formato non supportato: carica un PDF o una foto (JPG, PNG).' }, 415);

  let risposta, ultimoErrore;
  const client = new Anthropic({ apiKey });
  for (const model of MODELLI()) {
    try {
      risposta = await client.messages.create({
        model,
        max_tokens: 1500,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: TOOL.name },
        messages: [{ role: 'user', content: [blocco, { type: 'text', text: 'Estrai i dati di questo documento.' }] }],
      });
      break;
    } catch (e) {
      ultimoErrore = e;
      console.error('estrai: errore API', model, e?.status, e?.message);
      if (e?.status !== 404 && e?.status !== 400) break; // modello inesistente → prova il successivo
    }
  }
  if (!risposta) {
    return json({ errore: 'Non sono riuscito a leggere il documento in questo momento. Riprova tra poco.', codice: ultimoErrore?.status || null }, 502);
  }

  const uso = risposta.content.find((c) => c.type === 'tool_use');
  if (!uso) return json({ errore: 'Non sono riuscito a leggere il documento.' }, 422);
  const out = uso.input || {};
  if (out.non_e_una_bolletta) return json({ errore: 'Il file non sembra una bolletta o una fattura domestica.' }, 422);

  await contatore(true);

  const pulito = (out.documenti || []).map((d) => {
    const x = {};
    for (const k of Object.keys(DOC_SCHEMA.properties)) if (d[k] !== undefined && d[k] !== null) x[k] = d[k];
    for (const k of ['periodo_dal', 'periodo_al', 'data_emissione', 'scadenza_pagamento', 'fine_condizioni']) {
      if (x[k] && !/^\d{4}-\d{2}-\d{2}$/.test(x[k])) delete x[k];
    }
    return x;
  }).filter((d) => d.categoria);

  if (!pulito.length) return json({ errore: 'Non ho trovato importi leggibili nel documento.' }, 422);
  return json({ documenti: pulito, affidabilita: out.affidabilita || 'media' });
}
