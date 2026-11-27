// ─────────────────────────────────────────────────────────────
// POST /api/casa/estrai
// Riceve un documento della casa (PDF o immagine): bolletta,
// rate del condominio, TARI, F24 IMU, mutuo… e restituisce i dati
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

const DATA = { type: ['string', 'null'], description: 'YYYY-MM-DD' };
// Spese della casa senza bolletta: condominio, TARI, IMU, mutuo, affitto, assicurazione.
const SPESA_SCHEMA = {
  type: 'object',
  properties: {
    categoria: { type: 'string', enum: ['condominio', 'tari', 'imu', 'mutuo', 'affitto', 'assicurazione', 'manutenzione', 'altro'] },
    descrizione: { type: 'string', description: 'Breve, senza dati personali: es. "Condominio, gestione ordinaria 2026", "TARI 2026", "IMU saldo 2026", "Conguaglio gestione 2025", "Rata mutuo".' },
    tipo: { type: 'string', enum: ['rate', 'periodica', 'una_tantum'], description: 'rate = importi diversi a date diverse nello stesso anno; periodica = stesso importo a intervalli regolari (mutuo, affitto, premio annuale); una_tantum = un solo pagamento (conguaglio, saldo, rata straordinaria).' },
    rate: { type: 'array', items: { type: 'object', properties: { data: { type: 'string' }, importo: { type: 'number' } }, required: ['data', 'importo'] }, description: 'Solo per tipo "rate": ogni rata con data di scadenza e importo, in ordine.' },
    importo: { type: ['number', 'null'], description: 'Per "periodica" e "una_tantum": importo di ogni pagamento in euro.' },
    frequenza: { type: ['string', 'null'], enum: ['mensile', 'bimestrale', 'trimestrale', 'quadrimestrale', 'semestrale', 'annuale', null] },
    data: { ...DATA, description: 'Per "periodica": prossima scadenza; per "una_tantum": data di pagamento. YYYY-MM-DD.' },
    data_fine: { ...DATA, description: 'Mutuo: data dell\'ultima rata. Affitto: fine del contratto.' },
    tasso: { type: ['number', 'null'], description: 'Mutuo: TAN in percentuale (es. 3.1).' },
    tipo_tasso: { type: ['string', 'null'], enum: ['fisso', 'variabile', 'misto', null] },
    debito_residuo: { type: ['number', 'null'], description: 'Mutuo: capitale residuo in euro.' },
    domiciliazione: { type: ['boolean', 'null'] },
  },
  required: ['categoria', 'descrizione', 'tipo'],
};

const TOOL = {
  name: 'registra_documenti',
  description: 'Registra i dati economici di un documento domestico italiano: bollette e fatture, oppure spese senza bolletta (condominio, TARI, IMU, mutuo, affitto, assicurazione).',
  input_schema: {
    type: 'object',
    properties: {
      documenti: { type: 'array', items: DOC_SCHEMA, description: 'Bollette e fatture di utenze (luce, gas, acqua, internet, telefonia). Una per servizio. Vuoto se il documento non è una bolletta.' },
      spese: { type: 'array', items: SPESA_SCHEMA, description: 'Spese senza bolletta trovate nel documento: rate del condominio, conguagli, avvisi TARI, F24 IMU, piano del mutuo, contratto d\'affitto, polizza.' },
      affidabilita: { type: 'string', enum: ['alta', 'media', 'bassa'] },
      serve_riferimento: { type: 'boolean', description: 'true se il documento riporta importi di molte unità o persone (es. riparto condominiale) e non è stato indicato a quale riferirsi, oppure il riferimento indicato non si trova.' },
      non_e_una_bolletta: { type: 'boolean', description: 'true se il file non è un documento di spese della casa.' },
    },
    required: ['documenti', 'spese', 'affidabilita'],
  },
};

const SYSTEM = `Leggi documenti di spesa della casa italiani ed estrai solo dati economici e di consumo.
- Bollette e fatture di utenze (luce, gas, acqua, internet, telefonia) → "documenti".
- Spese senza bolletta → "spese": rate e conguagli del condominio (preventivi, rateizzazioni, avvisi di pagamento), avvisi TARI con le rate, F24 IMU (acconto e saldo), piano di ammortamento o avviso di rata del mutuo, contratto d'affitto, polizza della casa.

Regole per le spese:
- Riparti condominiali con molte unità: usa solo la riga dell'unità indicata nel riferimento dell'utente (cognome o numero di unità). Se non c'è un riferimento o non lo trovi, non inventare: restituisci spese vuote e serve_riferimento true.
- Rate del condominio con importi diversi → tipo "rate", con ogni data e importo. Un conguaglio o un saldo a debito → "una_tantum" con la sua data (se scritto "a vista", usa la data della prima rata). Un saldo a credito non è una spesa.
- Se il riferimento ha più unità (es. appartamento e box), somma le rate alla stessa data e indica le unità nella descrizione.
- TARI con più rate → tipo "rate". IMU: acconto e saldo → tipo "rate" con le due date.
- Mutuo → tipo "periodica", frequenza della rata, con tasso, debito residuo e data dell'ultima rata se scritti.

Regole generali:
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

  let file, riferimento = '';
  try {
    const form = await request.formData();
    file = form.get('file');
    // Facoltativo: cognome o numero di unità, per i riparti del condominio. Usato solo nella lettura, mai salvato.
    riferimento = String(form.get('riferimento') || '').replace(/[^\p{L}\p{N} .,'/-]/gu, '').trim().slice(0, 80);
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
        max_tokens: 3000,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: TOOL.name },
        messages: [{ role: 'user', content: [blocco, { type: 'text', text: 'Estrai i dati di questo documento.' + (riferimento ? ` Riferimento dell'utente per i riparti condominiali: "${riferimento}".` : '') + ` Oggi è il ${new Date().toISOString().slice(0, 10)}.` }] }],
      });
      break;
    } catch (e) {
      ultimoErrore = e;
      console.error('estrai: errore API', model, e?.status, e?.message);
      if (e?.status !== 404 && e?.status !== 400) break; // modello inesistente → prova il successivo
    }
  }
  if (!risposta) {
    if (/credit balance/i.test(ultimoErrore?.message || '')) console.error('estrai: CREDITO API ANTHROPIC ESAURITO');
    return json({ errore: 'Non sono riuscito a leggere il documento in questo momento. Riprova tra poco.', codice: ultimoErrore?.status || null }, 502);
  }

  const uso = risposta.content.find((c) => c.type === 'tool_use');
  if (!uso) return json({ errore: 'Non sono riuscito a leggere il documento.' }, 422);
  const out = uso.input || {};
  if (out.non_e_una_bolletta) return json({ errore: 'Il file non sembra un documento di spese della casa.' }, 422);

  await contatore(true);

  const pulito = (out.documenti || []).map((d) => {
    const x = {};
    for (const k of Object.keys(DOC_SCHEMA.properties)) if (d[k] !== undefined && d[k] !== null) x[k] = d[k];
    for (const k of ['periodo_dal', 'periodo_al', 'data_emissione', 'scadenza_pagamento', 'fine_condizioni']) {
      if (x[k] && !/^\d{4}-\d{2}-\d{2}$/.test(x[k])) delete x[k];
    }
    return x;
  }).filter((d) => d.categoria);

  const isoOk = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
  const spese = (out.spese || []).map((x) => {
    const y = {};
    for (const k of Object.keys(SPESA_SCHEMA.properties)) if (x[k] !== undefined && x[k] !== null) y[k] = x[k];
    for (const k of ['data', 'data_fine']) if (y[k] && !isoOk(y[k])) delete y[k];
    if (y.rate) y.rate = y.rate.filter((r) => isoOk(r.data) && Number(r.importo) > 0).slice(0, 12);
    if (y.tipo === 'rate' && !(y.rate?.length)) return null;
    if (y.tipo !== 'rate' && !(Number(y.importo) > 0)) return null;
    y.descrizione = String(y.descrizione || '').slice(0, 80);
    return y;
  }).filter(Boolean);

  if (!pulito.length && !spese.length) {
    if (out.serve_riferimento) return json({ errore: riferimento ? `Non trovo "${riferimento}" nel documento: controlla come è scritto (cognome o numero di unità).` : 'Il documento riguarda molte unità: scrivi il tuo cognome o il numero della tua unità e ricaricalo.', serve_riferimento: true }, 422);
    return json({ errore: 'Non ho trovato importi leggibili nel documento.' }, 422);
  }
  return json({ documenti: pulito, spese, affidabilita: out.affidabilita || 'media' });
}
