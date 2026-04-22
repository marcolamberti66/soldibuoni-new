// src/pages/api/extract-rcauto.js
// Estrazione dati da un preventivo RC Auto con output strutturato garantito via tool_use.
// Struttura allineata a extract-offer.js per massima stabilita in produzione.

import Anthropic from '@anthropic-ai/sdk';

export var prerender = false;

var MAX_FILE_BYTES = 8 * 1024 * 1024;
// NOME DEL MODELLO: Uso l'ultimo Haiku ufficiale per i tool
var MODEL = 'claude-3-5-haiku-20241022';

// Tool definition: lo schema qui sotto e' VINCOLANTE.
var EXTRACTION_TOOL = {
  name: 'estrai_preventivo_rcauto',
  description: 'Registra i dati economici estratti da un preventivo di assicurazione RC Auto.',
  input_schema: {
    type: 'object',
    properties: {
      nome: {
        type: ['string', 'null'],
        description: 'Nome della Compagnia assicurativa (es. "Prima", "ConTe", "Allianz"). null se non trovato.'
      },
      premioBase: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro della SOLA copertura RC Auto base obbligatoria. Se il preventivo non scorpora le garanzie, inserisci qui il totale.'
      },
      costoFurto: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro della garanzia accessoria Furto e Incendio. 0 se inclusa gratis o non presente.'
      },
      costoCristalli: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro della garanzia Cristalli. 0 se non presente.'
      },
      costoAssistenza: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro dell\'Assistenza Stradale. 0 se non presente.'
      },
      costoInfortuni: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro per Infortuni del Conducente. 0 se non presente.'
      },
      scontoScatola: {
        type: ['number', 'null'],
        description: 'Importo in euro dello SCONTO per installazione scatola nera/satellitare. Sempre positivo. 0 se assente.'
      },
      franchigiaBase: {
        type: ['number', 'null'],
        description: 'Franchigia o scoperto in euro indicato sulla RCA o sulla garanzia principale. 0 se assente.'
      },
      sospendibile: {
        type: ['boolean', 'null'],
        description: 'true se e chiaramente indicato che la polizza puo essere sospesa durante l\'anno.'
      },
      confidence: {
        type: 'string',
        enum: ['alta', 'media', 'bassa'],
        description: 'alta se i costi delle singole garanzie sono espliciti; media se alcuni sono dedotti; bassa se il preventivo e illeggibile o totale unico.'
      }
    },
    required: ['nome', 'premioBase', 'confidence']
  }
};

var SYSTEM_PROMPT = [
  'Sei un perito assicurativo che estrae dati da preventivi RC Auto italiani.',
  '',
  'REGOLE CRITICHE ANTI-ALLUCINAZIONE:',
  '1. NON INVENTARE MAI numeri o nomi. Se un costo accessorio non è menzionato, usa 0.',
  '2. Se un dato non è chiaro, usa null.',
  '3. Se il preventivo ha solo un Premio Totale e non elenca i costi delle garanzie, metti quel totale in "premioBase" e 0 nel resto, segnando confidence "bassa".',
  '4. Lo sconto per scatola nera deve essere un importo in Euro positivo (es. 30), non una percentuale.',
  '5. Compila sempre il campo "confidence" in base a quanto il documento è chiaro.',
  '',
  'Chiama sempre il tool estrai_preventivo_rcauto con i dati estratti. Non aggiungere testo libero.'
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

  try {
    if (ct.includes('application/json')) {
      var body = await request.json();
      var inputText = (body.text || '').trim();
      if (!inputText) return new Response('Testo vuoto', { status: 400 });
      if (inputText.length > 30000) return new Response('Testo troppo lungo', { status: 413 });

      userContent = [{
        type: 'text',
        text: 'Testo del preventivo auto:\n\n' + inputText
      }];
    } else if (ct.includes('multipart/form-data')) {
      var form = await request.formData();
      var file = form.get('file');
      
      if (!file || typeof file === 'string') return new Response('File mancante', { status: 400 });
      if (file.size > MAX_FILE_BYTES) return new Response('File troppo grande (max 8 MB)', { status: 413 });

      var bytes = await file.arrayBuffer();
      var base64Data = Buffer.from(bytes).toString('base64');
      var mediaType = file.type || 'application/octet-stream';
      var prompt = 'Estrai i costi delle garanzie del preventivo e chiama il tool.';

      if (mediaType === 'application/pdf') {
        userContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
          { type: 'text', text: prompt }
        ];
      } else if (mediaType.indexOf('image/') === 0) {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: prompt }
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
      tool_choice: { type: 'tool', name: 'estrai_preventivo_rcauto' },
      messages: [{ role: 'user', content: userContent }]
    });
  } catch (apiErr) {
    return new Response(JSON.stringify({
      error: 'Errore API Anthropic',
      detail: apiErr.message,
      status: apiErr.status || null
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  var toolUse = null;
  for (var i = 0; i < response.content.length; i++) {
    if (response.content[i].type === 'tool_use' && response.content[i].name === 'estrai_preventivo_rcauto') {
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

  // L'SDK parsifica in automatico, toolUse.input è già un oggetto pulito! Nessuna regex necessaria.
  return new Response(JSON.stringify(toolUse.input), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}