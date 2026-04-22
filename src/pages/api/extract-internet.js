// src/pages/api/extract-internet.js
// Estrazione dati offerta internet/fibra con output strutturato via tool_use.

import Anthropic from '@anthropic-ai/sdk';

export var prerender = false;

var MAX_FILE_BYTES = 8 * 1024 * 1024;
var MODEL = 'claude-haiku-4-5-20251001';

var EXTRACTION_TOOL = {
  name: 'estrai_offerta_internet',
  description: 'Registra i dati economici estratti da una scheda di offerta internet fibra/mobile italiana.',
  input_schema: {
    type: 'object',
    properties: {
      nome: {
        type: ['string', 'null'],
        description: 'Nome commerciale dell\'offerta (es. "Super Fibra", "Kena 130").'
      },
      canonePromo: {
        type: ['number', 'null'],
        description: 'Canone mensile in euro valido durante il periodo PROMOZIONALE. Se l\'offerta non ha promo (prezzo uniforme), inserisci qui il canone normale.'
      },
      durataPromo: {
        type: ['integer', 'null'],
        description: 'Durata in mesi del canone promo. 0 se il canonePromo vale per sempre (offerte trasparenti senza promo).'
      },
      canonePieno: {
        type: ['number', 'null'],
        description: 'Canone mensile in euro che si applica DOPO la scadenza della promo. Se non e specificato ma c\'e promo, usa null e segnala in note. Se il prezzo non cambia, ripeti qui canonePromo.'
      },
      attivazione: {
        type: ['number', 'null'],
        description: 'Costo TOTALE di attivazione una tantum in euro. Se rateizzato, somma tutte le rate. Distingui da "rata modem" (separata).'
      },
      rataModem: {
        type: ['number', 'null'],
        description: 'Costo mensile in euro della rata modem/router hardware. 0 se il modem e gratuito o non richiesto.'
      },
      durataModem: {
        type: ['integer', 'null'],
        description: 'Numero di mesi di rateizzazione del modem. 0 se nessuna rata.'
      },
      penaleRecesso: {
        type: ['number', 'null'],
        description: 'Penale fissa in euro per recesso anticipato, esclusa dal saldo residuo delle rate modem. 0 se nessuna penale esplicita.'
      },
      velocita: {
        type: ['string', 'null'],
        description: 'Velocita massima dichiarata (es. "1 Gbps FTTH", "100 Mbps FTTC", "150 GB 5G"). Copia letterale dal documento.'
      },
      serviziInclusi: {
        type: ['string', 'null'],
        description: 'Elenco breve dei servizi extra inclusi (es. "DAZN 12 mesi, Amazon Prime, SIM dati gratuita"). max 150 char.'
      },
      confidence: {
        type: 'string',
        enum: ['alta', 'media', 'bassa'],
        description: 'alta = tutti i campi chiave espliciti; media = alcuni inferiti; bassa = documento ambiguo.'
      }
    },
    required: ['canonePromo', 'confidence']
  }
};

var SYSTEM_PROMPT = [
  'Sei un estrattore di dati da schede di offerte internet fibra o mobile italiane.',
  '',
  'REGOLE CRITICHE ANTI-ALLUCINAZIONE:',
  '1. NON INVENTARE MAI dati. Se non e espresso chiaramente, usa null.',
  '2. Distinguere "attivazione" da "rata modem":',
  '   - Attivazione = costo una tantum per attivare la linea (anche se rateizzato in bolletta, e comunque costo una tantum totale).',
  '   - Rata modem = costo mensile del dispositivo hardware, che si continua a pagare per N mesi.',
  '   Se il documento dice "contributo di attivazione 47,76 euro in 24 rate da 1,99", attivazione = 47.76 e rata modem = 0 (a meno che non ci sia una rata modem separata).',
  '3. ATTENZIONE ALLA PROMO: molte offerte fibra italiane hanno struttura "19,99/m per 12 mesi poi 26,99/m". Devi popolare TUTTI e tre i campi: canonePromo=19.99, durataPromo=12, canonePieno=26.99.',
  '4. Se il canone non cambia mai, imposta canonePromo = canonePieno e durataPromo = 0.',
  '5. "Modem gratuito" o "modem incluso" significa rataModem = 0 e durataModem = 0.',
  '6. Se vedi "costi di disattivazione fino a 25 euro", usa 25 per penaleRecesso.',
  '7. Per velocita: copia LETTERALMENTE dal documento. Non inferire da altre offerte dello stesso operatore.',
  '',
  'Chiama sempre il tool estrai_offerta_internet con i dati estratti.'
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
      userContent = [{ type: 'text', text: 'Testo del contratto/scheda:\n\n' + inputText }];
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
      tool_choice: { type: 'tool', name: 'estrai_offerta_internet' },
      messages: [{ role: 'user', content: userContent }]
    });
  } catch (apiErr) {
    return new Response(JSON.stringify({
      error: 'Errore API', detail: apiErr.message, status: apiErr.status || null
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  var toolUse = null;
  for (var i = 0; i < response.content.length; i++) {
    if (response.content[i].type === 'tool_use' && response.content[i].name === 'estrai_offerta_internet') {
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