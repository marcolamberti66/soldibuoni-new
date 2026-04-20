// src/pages/api/extract-offer.js
import Anthropic from '@anthropic-ai/sdk';

export var prerender = false;

var MAX_FILE_BYTES = 8 * 1024 * 1024;
var MODEL = 'claude-haiku-4-5-20251001';

var SYSTEM_PROMPT = 'Sei un assistente specializzato nell\'estrazione di dati economici da contratti italiani di fornitura di energia elettrica e gas naturale.\n\nRiceverai il testo o l\'immagine di una scheda economica/contratto. Devi estrarre i seguenti campi e restituire SOLO un oggetto JSON valido (nessun preambolo, nessun markdown):\n\n{\n  "nome": "string oppure null - nome commerciale offerta",\n  "tipo": "fisso oppure variabile",\n  "prezzo": "number oppure null - euro/kWh per luce, euro/Smc per gas. Se variabile, e lo SPREAD su PUN/PSV (non il prezzo totale)",\n  "fisso": "number oppure null - costi fissi annui di commercializzazione in euro/anno (somma x12 se mensili)",\n  "scontoAnno": "number oppure null - sconto ricorrente annuale in euro",\n  "scontoOneShot": "number oppure null - bonus benvenuto una tantum in euro",\n  "durata": "12 o 24 o 36 o null - mesi di blocco prezzo",\n  "vincolo": "boolean oppure null - true se c\'e vincolo di permanenza con penali",\n  "note": "string oppure null - breve nota su clausole rilevanti"\n}\n\nRegole:\n- Se un valore non e chiaramente espresso, usa null. NON inventare numeri.\n- Per gli importi mensili, converti sempre in annuali (x12).\n- Se vedi piu componenti di costo fisso (PCV + commercializzazione vendita), sommali.\n- Se l\'offerta e solo dual fuel ma vedi solo una materia, restituisci i dati della materia visibile.\n- Restituisci esclusivamente JSON, senza testo prima o dopo, senza blocchi markdown.';

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

// Prova a leggere la chiave API da diverse fonti (Netlify puo usare percorsi diversi)
function getApiKey() {
  // 1. process.env standard (funziona nella maggior parte dei casi Netlify)
  if (typeof process !== 'undefined' && process.env && process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  // 2. Netlify.env (Netlify Functions v2)
  if (typeof Netlify !== 'undefined' && Netlify.env && typeof Netlify.env.get === 'function') {
    var val = Netlify.env.get('ANTHROPIC_API_KEY');
    if (val) return val;
  }
  return null;
}

export async function POST({ request }) {
  // Step 1: Recupera la chiave API
  var apiKey;
  try {
    apiKey = getApiKey();
  } catch (envErr) {
    return new Response(JSON.stringify({
      error: 'Errore lettura variabili ambiente',
      detail: envErr.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'API key non trovata',
      detail: 'ANTHROPIC_API_KEY non e configurata nelle variabili ambiente di Netlify. Vai su Netlify > Site configuration > Environment variables e verifica che esista.',
      // Debug: mostra quali env vars iniziano con ANTH (senza rivelare il valore)
      envCheck: typeof process !== 'undefined' && process.env
        ? Object.keys(process.env).filter(function(k) { return k.indexOf('ANTH') === 0; })
        : 'process.env non disponibile'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // Step 2: Crea il client Anthropic
  var client;
  try {
    client = new Anthropic({ apiKey: apiKey });
  } catch (clientErr) {
    return new Response(JSON.stringify({
      error: 'Errore creazione client Anthropic',
      detail: clientErr.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // Step 3: Parsa la richiesta
  var ct = request.headers.get('content-type') || '';
  var userContent;
  var tipoEnergia;

  try {
    if (ct.includes('application/json')) {
      var body = await request.json();
      tipoEnergia = body.tipoEnergia;
      var inputText = (body.text || '').trim();
      if (!inputText) return new Response('Testo vuoto', { status: 400 });
      if (inputText.length > 30000) return new Response('Testo troppo lungo (max 30k caratteri)', { status: 413 });

      userContent = [
        { type: 'text', text: 'Tipo offerta: ' + tipoEnergia + '\n\nTesto del contratto/scheda:\n\n' + inputText }
      ];

    } else if (ct.includes('multipart/form-data')) {
      var form = await request.formData();
      tipoEnergia = form.get('tipoEnergia');
      var file = form.get('file');

      if (!file || typeof file === 'string') {
        return new Response('File mancante', { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return new Response('File troppo grande (max 8 MB)', { status: 413 });
      }

      var bytes = await file.arrayBuffer();
      var base64Data = Buffer.from(bytes).toString('base64');
      var mediaType = file.type || 'application/octet-stream';

      if (mediaType === 'application/pdf') {
        userContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
          { type: 'text', text: 'Tipo offerta: ' + tipoEnergia + '. Estrai i dati economici secondo lo schema.' }
        ];
      } else if (mediaType.indexOf('image/') === 0) {
        userContent = [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: 'Tipo offerta: ' + tipoEnergia + '. Estrai i dati economici secondo lo schema.' }
        ];
      } else {
        return new Response('Formato file non supportato (usa immagine o PDF)', { status: 400 });
      }
    } else {
      return new Response('Content-Type non supportato', { status: 400 });
    }
  } catch (parseErr) {
    return new Response(JSON.stringify({
      error: 'Errore parsing richiesta',
      detail: parseErr.message
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Step 4: Chiama Claude
  var response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }]
    });
  } catch (apiErr) {
    return new Response(JSON.stringify({
      error: 'Errore chiamata API Anthropic',
      detail: apiErr.message,
      status: apiErr.status || null,
      type: apiErr.constructor ? apiErr.constructor.name : 'unknown'
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  // Step 5: Estrai e parsa la risposta
  try {
    var responseText = '';
    for (var i = 0; i < response.content.length; i++) {
      if (response.content[i].type === 'text') {
        responseText += response.content[i].text;
      }
    }
    responseText = responseText.trim();

    var clean = stripMarkdownFences(responseText);

    var parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (jsonErr) {
      return new Response(JSON.stringify({
        error: 'Risposta AI non parsabile come JSON',
        detail: 'Il modello ha restituito testo non valido. Riprova con piu dettagli.',
        rawPreview: clean.substring(0, 300)
      }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (extractErr) {
    return new Response(JSON.stringify({
      error: 'Errore estrazione risposta',
      detail: extractErr.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}