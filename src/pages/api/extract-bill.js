// src/pages/api/extract-bill.js
// Estrazione dati da una bolletta luce o gas con output strutturato via tool_use.
// Allineato agli altri 4 estrattori del sito (offer, conto, internet, rcauto).

import Anthropic from '@anthropic-ai/sdk';

export var prerender = false;

var MAX_FILE_BYTES = 8 * 1024 * 1024;
var MODEL = 'claude-haiku-4-5-20251001';

var EXTRACTION_TOOL = {
  name: 'estrai_dati_bolletta',
  description: 'Registra i dati economici estratti da una bolletta luce o gas italiana (PDF o immagine).',
  input_schema: {
    type: 'object',
    properties: {
      tipo: {
        type: ['string', 'null'],
        enum: ['energia', 'gas', 'dual', null],
        description: 'energia = bolletta luce, gas = bolletta gas, dual = bolletta unica luce+gas. null se non identificabile.'
      },
      fornitore: {
        type: ['string', 'null'],
        description: 'Nome del fornitore (es. "Enel Energia", "Eni Plenitude", "Hera Comm", "A2A", "Sorgenia").'
      },
      consumoAnnuo: {
        type: ['number', 'null'],
        description: 'Consumo annuo stimato in kWh (luce) o Smc (gas). Se in bolletta e mostrato un consumo bimestrale/mensile, annualizzalo.'
      },
      consumoFatturato: {
        type: ['number', 'null'],
        description: 'Consumo del periodo fatturato nella bolletta specifica (kWh o Smc). Diverso dal consumo annuo.'
      },
      prezzoMateria: {
        type: ['number', 'null'],
        description: 'Prezzo unitario della materia energia/gas in euro/kWh o euro/Smc (es. 0.142). Se variabile PUN+spread, usa il valore medio del periodo. Null se ambiguo.'
      },
      tipoContratto: {
        type: ['string', 'null'],
        enum: ['fisso', 'variabile', 'tutelato', null],
        description: 'fisso = prezzo bloccato; variabile = indicizzato PUN/PSV; tutelato = servizio di maggior tutela/vulnerabili. null se non determinabile.'
      },
      totaleBolletta: {
        type: ['number', 'null'],
        description: 'Importo totale della bolletta in euro, inclusi oneri e imposte.'
      },
      periodoFatturazione: {
        type: ['string', 'null'],
        description: 'Periodo coperto dalla bolletta in testo (es. "gen-feb 2026", "01/01/2026-28/02/2026"). Copia letterale.'
      },
      costoFissoMensile: {
        type: ['number', 'null'],
        description: 'Quota fissa mensile di commercializzazione in euro/mese. 0 se non presente o dichiarata zero.'
      },
      confidence: {
        type: 'string',
        enum: ['alta', 'media', 'bassa'],
        description: 'alta = tutti i dati chiave estratti con certezza; media = alcuni dedotti; bassa = bolletta illeggibile o dati contraddittori.'
      }
    },
    required: ['tipo', 'fornitore', 'totaleBolletta', 'confidence']
  }
};

var SYSTEM_PROMPT = [
  'Sei un analista di bollette italiane di energia elettrica e gas naturale.',
  '',
  'REGOLE CRITICHE ANTI-ALLUCINAZIONE:',
  '1. NON INVENTARE MAI numeri. Se un dato non e espresso chiaramente, usa null.',
  '2. Il "tipo" e "energia" SOLO per bollette luce, "gas" SOLO per gas, "dual" se la bolletta copre entrambi insieme.',
  '3. Il "prezzoMateria" e il prezzo al kWh o Smc della SOLA componente energia/gas, non il prezzo totale finale. Se la bolletta mostra solo il totale senza scorporo, usa null.',
  '4. Per contratti PUN/PSV variabili, usa il valore indicizzato medio del periodo (es. PUN medio bimestre + spread). Se vedi solo "PUN + X", non inventare il PUN: usa null con confidence bassa.',
  '5. Se vedi piu consumi (kWh nel periodo, kWh annuo stimato), distinguili: "consumoFatturato" e quello del periodo in bolletta, "consumoAnnuo" e quello annualizzato o dichiarato.',
  '6. Il "totaleBolletta" e l\'importo finale da pagare IVA inclusa.',
  '7. Non confondere il "servizio di maggior tutela" (tutelato) con un\'offerta di mercato libero. Se vedi ARERA, condizioni economiche tutelate, marca "tutelato".',
  '',
  'Chiama sempre il tool estrai_dati_bolletta. Niente testo libero.'
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
    if (ct.includes('multipart/form-data')) {
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
          { type: 'text', text: 'Estrai i dati della bolletta e chiama il tool.' }
        ];
      } else if (mediaType === 'image/jpeg' || mediaType === 'image/png' || mediaType === 'image/gif' || mediaType === 'image/webp') {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: 'Estrai i dati della bolletta e chiama il tool.' }
        ];
      } else if (mediaType.indexOf('image/') === 0) {
        return new Response('Formato immagine non supportato (' + mediaType + '). Usa JPG, PNG, GIF o WebP. Se il file e un HEIC da iPhone, convertilo prima.', { status: 400 });
      } else {
        return new Response('Formato file non supportato (usa PDF o immagine)', { status: 400 });
      }
    } else {
      return new Response('Carica una bolletta come PDF o immagine', { status: 400 });
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
      tool_choice: { type: 'tool', name: 'estrai_dati_bolletta' },
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
    if (response.content[i].type === 'tool_use' && response.content[i].name === 'estrai_dati_bolletta') {
      toolUse = response.content[i];
      break;
    }
  }

  if (!toolUse) {
    return new Response(JSON.stringify({
      error: 'Estrazione fallita',
      detail: 'Il modello non ha chiamato il tool. Verifica che il documento sia una bolletta leggibile.'
    }), { status: 422, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(toolUse.input), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}