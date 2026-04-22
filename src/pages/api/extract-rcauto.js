// src/pages/api/extract-rcauto.js
// Estrazione dati preventivo RC Auto con output strutturato via tool_use.

import Anthropic from '@anthropic-ai/sdk';

export var prerender = false;

var MAX_FILE_BYTES = 8 * 1024 * 1024;
// Allineato agli altri endpoint: Haiku 4.5 - piu accurato su OCR di PDF assicurativi.
var MODEL = 'claude-haiku-4-5-20251001';

var EXTRACTION_TOOL = {
  name: 'estrai_preventivo_rcauto',
  description: 'Registra i dati economici estratti da un preventivo di assicurazione RC Auto italiana.',
  input_schema: {
    type: 'object',
    properties: {
      nome: {
        type: ['string', 'null'],
        description: 'Nome della Compagnia assicurativa (es. "Prima", "ConTe", "Allianz Direct", "Genertel"). null se non trovato.'
      },
      premioBase: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro della SOLA copertura RC Auto base obbligatoria (danni a terzi). Se il preventivo non scorpora le garanzie ma indica solo il totale, inserisci qui il totale e segnala "bassa" in confidence.'
      },
      costoFurto: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro della garanzia Furto e Incendio. 0 se dichiarata inclusa gratis o non presente nel preventivo.'
      },
      costoCristalli: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro della garanzia Cristalli. 0 se non presente o inclusa.'
      },
      costoAssistenza: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro dell\'Assistenza Stradale. 0 se non presente o inclusa.'
      },
      costoInfortuni: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro per Infortuni del Conducente. 0 se non presente o inclusa.'
      },
      costoTutelaLegale: {
        type: ['number', 'null'],
        description: 'Costo annuale in euro della Tutela Legale. 0 se non presente o inclusa.'
      },
      scontoScatola: {
        type: ['number', 'null'],
        description: 'Importo in euro dello SCONTO per installazione scatola nera/telematica. Sempre positivo (es. 40). Se e espresso come percentuale (es. "sconto 15%"), usa null e segnala in note.'
      },
      franchigiaBase: {
        type: ['number', 'null'],
        description: 'Franchigia o scoperto fisso in euro applicato sui danni a terzi o sulla garanzia furto. 0 se nessuna franchigia esplicita.'
      },
      massimale: {
        type: ['string', 'null'],
        description: 'Massimale RCA in testo (es. "7.750.000 euro", "15 milioni", "illimitato"). Copia letterale. null se non indicato.'
      },
      classeMerito: {
        type: ['integer', 'null'],
        description: 'Classe di merito (bonus-malus) indicata nel preventivo. Intero da 1 a 18. null se non indicata.'
      },
      sospendibile: {
        type: ['boolean', 'null'],
        description: 'true SOLO se il preventivo dichiara esplicitamente che la polizza puo essere sospesa (es. "sospendibile per fermo auto"). null se non menzionato.'
      },
      confidence: {
        type: 'string',
        enum: ['alta', 'media', 'bassa'],
        description: 'alta = costi delle garanzie tutti espliciti; media = alcuni dedotti dal contesto; bassa = preventivo con solo totale unico o parzialmente illeggibile.'
      }
    },
    required: ['nome', 'premioBase', 'confidence']
  }
};

var SYSTEM_PROMPT = [
  'Sei un perito assicurativo italiano che estrae dati da preventivi RC Auto.',
  '',
  'REGOLE CRITICHE ANTI-ALLUCINAZIONE:',
  '1. NON INVENTARE MAI numeri o nomi. Se un dato non e espresso, usa null o 0 (0 se la garanzia e chiaramente assente).',
  '2. Distingui GARANZIA INCLUSA (costo gia nel premio base, usa 0) da GARANZIA SEPARATA (ha il suo costo in euro).',
  '3. Il "premioBase" e SOLO la RCA obbligatoria (danni a terzi). Non sommare mai le altre garanzie dentro premioBase, a meno che il preventivo mostri solo un totale senza scorporo (in tal caso metti il totale in premioBase, tutto il resto a 0, e confidence "bassa").',
  '4. Lo sconto scatola nera deve essere un importo in EURO POSITIVO. Se nel preventivo e scritto "15% di sconto", usa null.',
  '5. La franchigia e il valore che pagheresti in caso di sinistro. 0 se nessuna franchigia.',
  '6. Se vedi valori contraddittori (es. due cifre diverse per lo stesso campo), usa null e segnala in confidence bassa.',
  '7. La classe di merito e un intero da 1 (migliore) a 18 (peggiore). Se vedi "CU" seguito da un numero, e la classe universale.',
  '8. Compila sempre "confidence" in modo onesto.',
  '',
  'Chiama sempre il tool estrai_preventivo_rcauto con i dati estratti. Niente testo libero.'
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
      userContent = [{ type: 'text', text: 'Testo del preventivo RC Auto:\n\n' + inputText }];
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
          { type: 'text', text: 'Estrai i dati del preventivo e chiama il tool.' }
        ];
      } else if (mediaType.indexOf('image/') === 0) {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: 'Estrai i dati del preventivo e chiama il tool.' }
        ];
      } else {
        return new Response('Formato file non supportato (usa immagine o PDF)', { status: 400 });
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
      detail: 'Il modello non ha chiamato il tool. Verifica che il documento sia un preventivo RC Auto leggibile.'
    }), { status: 422, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(toolUse.input), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}