// src/pages/api/extract-offer.js
// Estrazione dati offerta luce/gas con output strutturato garantito via tool_use.
// Questo approccio elimina il rischio di allucinazioni di formato (JSON malformato,
// testo extra, campi inventati) perche' Anthropic valida lo schema prima di rispondere.

import Anthropic from '@anthropic-ai/sdk';

export var prerender = false;

var MAX_FILE_BYTES = 8 * 1024 * 1024;
var MODEL = 'claude-haiku-4-5-20251001';

// Tool definition: lo schema qui sotto e' VINCOLANTE. Haiku non puo' uscirne.
var EXTRACTION_TOOL = {
  name: 'estrai_offerta_energia',
  description: 'Registra i dati economici estratti da una scheda offerta luce/gas italiana.',
  input_schema: {
    type: 'object',
    properties: {
      nome: {
        type: ['string', 'null'],
        description: 'Nome commerciale dell\'offerta (es. "Fixa Time Smart"). null se non trovato.'
      },
      tipo: {
        type: ['string', 'null'],
        enum: ['fisso', 'variabile', null],
        description: 'fisso se prezzo materia bloccato; variabile se indicizzato (PUN/PSV). null se ambiguo.'
      },
      prezzo: {
        type: ['number', 'null'],
        description: 'Prezzo materia in euro/kWh (luce) o euro/Smc (gas). Se variabile, inserire SOLO lo spread (es. 0.02), non il prezzo totale.'
      },
      fisso: {
        type: ['number', 'null'],
        description: 'Somma costi fissi annui di commercializzazione in euro/anno. Convertire mensili x12.'
      },
      scontoAnno: {
        type: ['number', 'null'],
        description: 'Sconto ricorrente annuale in euro (applicato ogni anno).'
      },
      scontoOneShot: {
        type: ['number', 'null'],
        description: 'Bonus una tantum solo anno 1 in euro (cashback di benvenuto).'
      },
      durata: {
        type: ['integer', 'null'],
        description: 'Mesi di blocco prezzo per offerte fisse. Tipicamente 12, 24 o 36.'
      },
      vincolo: {
        type: ['boolean', 'null'],
        description: 'true se c\'e vincolo di permanenza con penali di recesso esplicite.'
      },
      note: {
        type: ['string', 'null'],
        description: 'Breve nota solo se ci sono clausole rilevanti non coperte dai campi sopra (max 200 char).'
      },
      confidence: {
        type: 'string',
        enum: ['alta', 'media', 'bassa'],
        description: 'alta se tutti i campi chiave sono espliciti; media se alcuni sono inferiti da contesto; bassa se il documento e ambiguo o incompleto.'
      }
    },
    required: ['tipo', 'prezzo', 'fisso', 'confidence']
  }
};

var SYSTEM_PROMPT = [
  'Sei un estrattore di dati da schede economiche di offerte luce e gas italiane.',
  '',
  'REGOLE CRITICHE ANTI-ALLUCINAZIONE:',
  '1. NON INVENTARE MAI numeri o nomi. Se un dato non e espresso chiaramente, usa null.',
  '2. Non inferire valori da "offerte simili" o da conoscenza generale. Solo dal documento fornito.',
  '3. Se vedi un range (es. "da 0.10 a 0.15 euro/kWh"), usa null per il campo prezzo e segnala in note.',
  '4. Se il documento riporta valori CONTRADDITTORI (es. canone 0 in una riga e 9,99 in un\'altra), usa null e segnala in note.',
  '5. Distingui "contributo di attivazione rateizzato" (che e fisso nel tempo) da "rata modem" (che e rateo hardware). Nel campo "fisso" metti solo cio che si ripete ogni anno.',
  '6. Per offerte variabili, il campo prezzo deve essere SOLO lo SPREAD aggiunto a PUN/PSV, non il prezzo finale osservato.',
  '7. Compila sempre il campo "confidence" in base a quanto il documento e chiaro.',
  '',
  'Chiama sempre il tool estrai_offerta_energia con i dati estratti. Non aggiungere testo libero.'
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
      detail: 'ANTHROPIC_API_KEY non configurata nelle variabili ambiente.'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  var client;
  try {
    client = new Anthropic({ apiKey: apiKey });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Errore creazione client', detail: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  var ct = request.headers.get('content-type') || '';
  var userContent;
  var tipoEnergia;

  try {
    if (ct.includes('application/json')) {
      var body = await request.json();
      tipoEnergia = body.tipoEnergia || 'luce';
      var inputText = (body.text || '').trim();
      if (!inputText) return new Response('Testo vuoto', { status: 400 });
      if (inputText.length > 30000) return new Response('Testo troppo lungo', { status: 413 });

      userContent = [{
        type: 'text',
        text: 'Tipo offerta dichiarata dall\'utente: ' + tipoEnergia + '\n\nTesto della scheda:\n\n' + inputText
      }];
    } else if (ct.includes('multipart/form-data')) {
      var form = await request.formData();
      tipoEnergia = form.get('tipoEnergia') || 'luce';
      var file = form.get('file');
      if (!file || typeof file === 'string') return new Response('File mancante', { status: 400 });
      if (file.size > MAX_FILE_BYTES) return new Response('File troppo grande (max 8 MB)', { status: 413 });

      var bytes = await file.arrayBuffer();
      var base64Data = Buffer.from(bytes).toString('base64');
      var mediaType = file.type || 'application/octet-stream';
      var prompt = 'Tipo offerta dichiarata: ' + tipoEnergia + '. Estrai i dati economici e chiama il tool.';

      if (mediaType === 'application/pdf') {
        userContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
          { type: 'text', text: prompt }
        ];
      } else if (mediaType === 'image/jpeg' || mediaType === 'image/png' || mediaType === 'image/gif' || mediaType === 'image/webp') {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: prompt }
        ];
      } else if (mediaType.indexOf('image/') === 0) {
        return new Response('Formato immagine non supportato (' + mediaType + '). Usa JPG, PNG, GIF o WebP. Se il file e un HEIC da iPhone, convertilo prima.', { status: 400 });
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
      tool_choice: { type: 'tool', name: 'estrai_offerta_energia' },
      messages: [{ role: 'user', content: userContent }]
    });
  } catch (apiErr) {
    return new Response(JSON.stringify({
      error: 'Errore API Anthropic',
      detail: apiErr.message,
      status: apiErr.status || null
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  // Estrazione del tool_use block. Con tool_choice forzato siamo SICURI di riceverlo.
  var toolUse = null;
  for (var i = 0; i < response.content.length; i++) {
    if (response.content[i].type === 'tool_use' && response.content[i].name === 'estrai_offerta_energia') {
      toolUse = response.content[i];
      break;
    }
  }

  if (!toolUse) {
    return new Response(JSON.stringify({
      error: 'Estrazione fallita',
      detail: 'Il modello non ha chiamato il tool. Riprova o fornisci piu contesto.'
    }), { status: 422, headers: { 'Content-Type': 'application/json' } });
  }

  // toolUse.input e' gia' un oggetto JSON validato contro lo schema.
  return new Response(JSON.stringify(toolUse.input), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}