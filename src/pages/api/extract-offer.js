// src/pages/api/extract-offer.js
//
// Endpoint Astro che riceve testo o file (immagine/PDF) di un contratto luce/gas
// e usa Claude per estrarre i parametri economici in formato JSON strutturato.
//
// VARIABILI D'AMBIENTE RICHIESTE:
//   ANTHROPIC_API_KEY=inserita_su_netlify
//
// NOTA SICUREZZA:
//   - Limita la dimensione dei file (qui: max 8 MB) per evitare abuse
//   - Considera rate limiting per IP se il sito e pubblico (es. via Cloudflare)
//   - Logga gli errori ma NON loggare il testo dei contratti (privacy utenti)

import Anthropic from '@anthropic-ai/sdk';

export var prerender = false;

var MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

// Haiku 4.5: $1/$5 per MTok — perfetto per estrazione strutturata.
var MODEL = 'claude-haiku-4-5-20251001';

var SYSTEM_PROMPT = 'Sei un assistente specializzato nell\'estrazione di dati economici da contratti italiani di fornitura di energia elettrica e gas naturale.\n\nRiceverai il testo o l\'immagine di una scheda economica/contratto. Devi estrarre i seguenti campi e restituire SOLO un oggetto JSON valido (nessun preambolo, nessun markdown):\n\n{\n  "nome": "string oppure null - nome commerciale offerta",\n  "tipo": "fisso oppure variabile",\n  "prezzo": "number oppure null - euro/kWh per luce, euro/Smc per gas. Se variabile, e lo SPREAD su PUN/PSV (non il prezzo totale)",\n  "fisso": "number oppure null - costi fissi annui di commercializzazione in euro/anno (somma x12 se mensili)",\n  "scontoAnno": "number oppure null - sconto ricorrente annuale in euro",\n  "scontoOneShot": "number oppure null - bonus benvenuto una tantum in euro",\n  "durata": "12 o 24 o 36 o null - mesi di blocco prezzo",\n  "vincolo": "boolean oppure null - true se c\'e vincolo di permanenza con penali",\n  "note": "string oppure null - breve nota su clausole rilevanti"\n}\n\nRegole:\n- Se un valore non e chiaramente espresso, usa null. NON inventare numeri.\n- Per gli importi mensili, converti sempre in annuali (x12).\n- Se vedi piu componenti di costo fisso (PCV + commercializzazione vendita), sommali.\n- Se l\'offerta e solo dual fuel ma vedi solo una materia, restituisci i dati della materia visibile.\n- Restituisci esclusivamente JSON, senza testo prima o dopo, senza blocchi markdown.';

// Rimuove fence markdown dalla risposta del modello.
// NON si usa regex con backtick perche esbuild li interpreta male.
function stripMarkdownFences(str) {
  var s = str.trim();
  // Costruisce la stringa di 3 backtick senza scriverla come literal
  var fence = String.fromCharCode(96, 96, 96);
  // Rimuovi apertura (es: fence json o fence pura)
  if (s.indexOf(fence) === 0) {
    var firstNewline = s.indexOf('\n');
    if (firstNewline !== -1) {
      s = s.substring(firstNewline + 1);
    }
  }
  // Rimuovi chiusura
  if (s.lastIndexOf(fence) === s.length - fence.length && s.length >= fence.length) {
    s = s.substring(0, s.length - fence.length);
  }
  return s.trim();
}

export async function POST({ request }) {
  try {
    var apiKey = import.meta.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response('Server non configurato (manca API key)', { status: 500 });
    }

    var client = new Anthropic({ apiKey: apiKey });
    var ct = request.headers.get('content-type') || '';

    var userContent;
    var tipoEnergia;

    if (ct.includes('application/json')) {
      // ===== Modalita testo =====
      var body = await request.json();
      tipoEnergia = body.tipoEnergia;
      var inputText = (body.text || '').trim();
      if (!inputText) return new Response('Testo vuoto', { status: 400 });
      if (inputText.length > 30000) return new Response('Testo troppo lungo (max 30k caratteri)', { status: 413 });

      userContent = [
        { type: 'text', text: 'Tipo offerta: ' + tipoEnergia + '\n\nTesto del contratto/scheda:\n\n' + inputText }
      ];

    } else if (ct.includes('multipart/form-data')) {
      // ===== Modalita file =====
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
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64Data }
          },
          { type: 'text', text: 'Tipo offerta: ' + tipoEnergia + '. Estrai i dati economici secondo lo schema.' }
        ];
      } else if (mediaType.indexOf('image/') === 0) {
        userContent = [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data }
          },
          { type: 'text', text: 'Tipo offerta: ' + tipoEnergia + '. Estrai i dati economici secondo lo schema.' }
        ];
      } else {
        return new Response('Formato file non supportato (usa immagine o PDF)', { status: 400 });
      }
    } else {
      return new Response('Content-Type non supportato', { status: 400 });
    }

    // Chiamata a Claude
    var response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }]
    });

    // Estrai la risposta testuale
    var responseText = '';
    for (var i = 0; i < response.content.length; i++) {
      if (response.content[i].type === 'text') {
        responseText += response.content[i].text;
      }
    }
    responseText = responseText.trim();

    // Pulisci eventuali fence markdown
    var clean = stripMarkdownFences(responseText);

    var parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('JSON parse failure:', clean.substring(0, 200));
      return new Response('Estrazione non riuscita: prova a fornire piu dettagli', { status: 422 });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('extract-offer error:', err.message);
    return new Response('Errore interno durante l\'estrazione', { status: 500 });
  }
}