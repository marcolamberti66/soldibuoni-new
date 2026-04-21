// src/pages/api/extract-internet.js
import Anthropic from '@anthropic-ai/sdk';

export var prerender = false;

var MAX_FILE_BYTES = 8 * 1024 * 1024;
var MODEL = 'claude-haiku-4-5-20251001';

var SYSTEM_PROMPT = 'Sei un assistente specializzato nell\'estrazione di dati economici da offerte internet fibra o mobile italiane.\n\nRiceverai il testo o l\'immagine di una scheda economica/contratto. Devi estrarre i seguenti campi e restituire SOLO un oggetto JSON valido (nessun preambolo, nessun markdown):\n\n{\n  "nome": "string oppure null",\n  "canonePromo": "number oppure null - canone mensile in euro in promo",\n  "durataPromo": "number oppure 0 - durata in mesi della promozione",\n  "canonePieno": "number oppure null - canone mensile in euro finita la promo",\n  "attivazione": "number oppure null - costo attivazione una tantum in euro",\n  "rataModem": "number oppure null - costo mensile in euro per rata modem",\n  "durataModem": "number oppure 0 - numero di mesi di rateizzazione modem",\n  "penaleRecesso": "number oppure null - costo fisso in euro per disattivazione",\n  "velocita": "string oppure null - es. 2.5 Gbps FTTH",\n  "serviziInclusi": "string oppure null"\n}\n\nRegole:\n- Usa null se non trovi il dato. Non inventare numeri.\n- Restituisci SOLO JSON senza formattazione markdown.';

function stripMarkdownFences(str) {
  var s = str.trim();
  var fence = String.fromCharCode(96, 96, 96);
  if (s.indexOf(fence) === 0) {
    var firstNewline = s.indexOf('\n');
    if (firstNewline !== -1) {
      s = s.substring(firstNewline + 1);
    }
  }
  if (s.length >= fence.length && s.lastIndexOf(fence) === s.length - fence.length) {
    s = s.substring(0, s.length - fence.length);
  }
  return s.trim();
}

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
  var apiKey;
  try {
    apiKey = getApiKey();
  } catch (envErr) {
    return new Response(JSON.stringify({ error: 'Errore lettura variabili ambiente', detail: envErr.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'API key non trovata',
      detail: 'ANTHROPIC_API_KEY non configurata.',
      envCheck: typeof process !== 'undefined' && process.env ? Object.keys(process.env).filter(function(k) { return k.indexOf('ANTH') === 0; }) : 'process.env non disponibile'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  var client;
  try {
    client = new Anthropic({ apiKey: apiKey });
  } catch (clientErr) {
    return new Response(JSON.stringify({ error: 'Errore creazione client Anthropic', detail: clientErr.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  var ct = request.headers.get('content-type') || '';
  var userContent;

  try {
    if (ct.includes('application/json')) {
      var body = await request.json();
      var inputText = (body.text || '').trim();
      if (!inputText) return new Response('Testo vuoto', { status: 400 });
      if (inputText.length > 30000) return new Response('Testo troppo lungo', { status: 413 });
      userContent = [{ type: 'text', text: 'Testo del contratto:\n\n' + inputText }];
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
          { type: 'text', text: 'Estrai i dati economici secondo lo schema.' }
        ];
      } else if (mediaType.indexOf('image/') === 0) {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: 'Estrai i dati economici secondo lo schema.' }
        ];
      } else {
        return new Response('Formato file non supportato', { status: 400 });
      }
    } else {
      return new Response('Content-Type non supportato', { status: 400 });
    }
  } catch (parseErr) {
    return new Response(JSON.stringify({ error: 'Errore parsing richiesta', detail: parseErr.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  var response;
  try {
    response = await client.messages.create({
      model: MODEL, max_tokens: 800, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userContent }]
    });
  } catch (apiErr) {
    return new Response(JSON.stringify({ error: 'Errore API', detail: apiErr.message }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    var responseText = '';
    for (var i = 0; i < response.content.length; i++) {
      if (response.content[i].type === 'text') responseText += response.content[i].text;
    }
    var clean = stripMarkdownFences(responseText);

    var parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (jsonErr) {
      return new Response(JSON.stringify({ error: 'Risposta AI non parsabile', rawPreview: clean.substring(0, 300) }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (extractErr) {
    return new Response(JSON.stringify({ error: 'Errore estrazione', detail: extractErr.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}