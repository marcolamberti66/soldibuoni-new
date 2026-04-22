// src/pages/api/extract-conto.js
// Estrazione dati conto corrente con output strutturato via tool_use.

import Anthropic from '@anthropic-ai/sdk';

export var prerender = false;

var MAX_FILE_BYTES = 8 * 1024 * 1024;
var MODEL = 'claude-haiku-4-5-20251001';

var EXTRACTION_TOOL = {
  name: 'estrai_offerta_conto',
  description: 'Registra i dati economici estratti da un foglio informativo di conto corrente italiano.',
  input_schema: {
    type: 'object',
    properties: {
      nome: {
        type: ['string', 'null'],
        description: 'Nome commerciale del conto (es. "Conto Arancio", "Hype Plus"). null se non trovato.'
      },
      canone: {
        type: ['number', 'null'],
        description: 'Canone mensile di tenuta conto in euro/mese. 0 se conto gratuito dichiarato.'
      },
      bolloPagato: {
        type: ['boolean', 'null'],
        description: 'true SOLO se il documento dichiara esplicitamente che la banca paga l\'imposta di bollo (es. "bollo incluso", "nessuna imposta di bollo a carico del cliente"). false o null altrimenti.'
      },
      tasso: {
        type: ['number', 'null'],
        description: 'Tasso interesse lordo annuo STANDARD (post-promo) in percentuale. Es. 1.0 significa 1% lordo annuo.'
      },
      tassoPromo: {
        type: ['number', 'null'],
        description: 'Tasso interesse lordo PROMOZIONALE in percentuale (valido solo per un periodo limitato). null se non c\'e promo.'
      },
      durataPromo: {
        type: ['integer', 'null'],
        description: 'Durata in mesi del tasso promozionale. 0 se non c\'e promo.'
      },
      costoBonifico: {
        type: ['number', 'null'],
        description: 'Costo in euro di un singolo bonifico SEPA istantaneo online. Se il documento dichiara "gratis" o "illimitati", usa 0. Se non e specificato, usa il costo del bonifico ordinario online.'
      },
      costoPrelievo: {
        type: ['number', 'null'],
        description: 'Costo in euro di un singolo prelievo ATM su ATM di altra banca in Italia. 0 se dichiarato gratuito.'
      },
      canoneCarta: {
        type: ['number', 'null'],
        description: 'Canone annuo della carta di debito base inclusa nel conto. 0 se gratuita.'
      },
      bonusBenvenuto: {
        type: ['number', 'null'],
        description: 'Bonus una tantum di benvenuto in euro (solo primo anno).'
      },
      cashbackAnnuo: {
        type: ['number', 'null'],
        description: 'Cashback ANNUO STIMATO in euro. null se il documento indica solo la percentuale senza stima annua massima.'
      },
      richiedeStipendio: {
        type: ['boolean', 'null'],
        description: 'true SOLO se l\'azzeramento del canone o uno sconto chiave richiede esplicitamente l\'accredito stipendio o pensione.'
      },
      confidence: {
        type: 'string',
        enum: ['alta', 'media', 'bassa'],
        description: 'alta = tutti i campi chiave espliciti; media = alcuni inferiti; bassa = documento ambiguo.'
      }
    },
    required: ['canone', 'confidence']
  }
};

var SYSTEM_PROMPT = [
  'Sei un estrattore di dati da fogli informativi di conti correnti italiani.',
  '',
  'REGOLE CRITICHE ANTI-ALLUCINAZIONE:',
  '1. NON INVENTARE MAI dati. Se non e espresso chiaramente, usa null.',
  '2. Attenzione alle condizioni: "bonifici istantanei GRATIS per i primi 3 al mese" significa che oltre il limite hanno un costo. Se vedi un limite, usa il costo oltre il limite, non zero. Se il costo oltre il limite non e dichiarato, usa null e segnala in note.',
  '3. NON confondere il tasso PROMO col tasso STANDARD. Il promo tipicamente dura 6-12 mesi. Se vedi solo un tasso "fino al X/Y/2026" e un tasso "successivamente", sono rispettivamente tassoPromo e tasso.',
  '4. Se il documento dice "canone zero con accredito stipendio", metti canone a 0 E richiedeStipendio a true.',
  '5. Se il documento dice "cashback 1% illimitato", usa null per cashbackAnnuo (non puoi stimare senza sapere la spesa dell\'utente).',
  '6. Se un valore appare in un range o c\'e ambiguita, usa null.',
  '',
  'Chiama sempre il tool estrai_offerta_conto con i dati estratti.'
].join('\n');

function getApiKey() {
  if (typeof process !== 'undefined' && process.env && process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  if (typeof Netlify !== 'undefined' && Netlify.env && typeof Netlify.env.get === 'function') {
    var val = Netlify.env.get('ANTHROPIC_API_KEY');
    if (val) return val;
  }
  return null;
}

export async function POST({ request }) {
  var apiKey = getApiKey();
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'API key non trovata',
      detail: 'ANTHROPIC_API_KEY non configurata.'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  var client;
  try { client = new Anthropic({ apiKey: apiKey }); }
  catch (e) {
    return new Response(JSON.stringify({ error: 'Errore client', detail: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  var ct = request.headers.get('content-type') || '';
  var userContent;

  try {
    if (ct.includes('application/json')) {
      var body = await request.json();
      var inputText = (body.text || '').trim();
      if (!inputText) return new Response('Testo vuoto', { status: 400 });
      if (inputText.length > 30000) return new Response('Testo troppo lungo', { status: 413 });
      userContent = [{ type: 'text', text: 'Testo del foglio informativo:\n\n' + inputText }];
    } else if (ct.includes('multipart/form-data')) {
      var form = await request.formData();
      var file = form.get('file');
      if (!file || typeof file === 'string') return new Response('File mancante', { status: 400 });
      if (file.size > MAX_FILE_BYTES) return new Response('File troppo grande (max 8 MB)', { status: 413 });

      var bytes = await file.arrayBuffer();
      var base64Data = Buffer.from(bytes).toString('base64');
      var mediaType = file.type || 'application/octet-stream';

      if (mediaType === 'application/pdf') {
        userContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
          { type: 'text', text: 'Estrai i dati economici e chiama il tool.' }
        ];
      } else if (mediaType.indexOf('image/') === 0) {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: 'Estrai i dati economici e chiama il tool.' }
        ];
      } else {
        return new Response('Formato file non supportato', { status: 400 });
      }
    } else {
      return new Response('Content-Type non supportato', { status: 400 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Errore parsing', detail: e.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  var response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: 'tool', name: 'estrai_offerta_conto' },
      messages: [{ role: 'user', content: userContent }]
    });
  } catch (apiErr) {
    return new Response(JSON.stringify({
      error: 'Errore API', detail: apiErr.message, status: apiErr.status || null
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  var toolUse = null;
  for (var i = 0; i < response.content.length; i++) {
    if (response.content[i].type === 'tool_use' && response.content[i].name === 'estrai_offerta_conto') {
      toolUse = response.content[i];
      break;
    }
  }

  if (!toolUse) {
    return new Response(JSON.stringify({
      error: 'Estrazione fallita',
      detail: 'Il modello non ha chiamato il tool.'
    }), { status: 422, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(toolUse.input), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}