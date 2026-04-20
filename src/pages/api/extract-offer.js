// src/pages/api/extract-offer.js
//
// Endpoint Astro che riceve testo o file (immagine/PDF) di un contratto luce/gas
// e usa Claude per estrarre i parametri economici in formato JSON strutturato.
//
// VARIABILI D'AMBIENTE RICHIESTE:
//   ANTHROPIC_API_KEY=inserita_su_netlify
//
// ASSUNZIONI:
//   - Il sito gira con output: 'server' o 'hybrid' in astro.config.mjs
//   - Hai installato @anthropic-ai/sdk:  npm i @anthropic-ai/sdk
//
// NOTA SICUREZZA:
//   - Limita la dimensione dei file (qui: max 8 MB) per evitare abuse
//   - Considera rate limiting per IP se il sito è pubblico (es. via Cloudflare)
//   - Logga gli errori ma NON loggare il testo dei contratti (privacy utenti)

import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
// Haiku 4.5 è più che sufficiente per estrazione strutturata e costa
// 3× meno di Sonnet ($1/$5 per MTok vs $3/$15). Per casi più complessi
// puoi passare a 'claude-sonnet-4-6'.
const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Sei un assistente specializzato nell'estrazione di dati economici da contratti italiani di fornitura di energia elettrica e gas naturale.

Riceverai il testo o l'immagine di una scheda economica/contratto. Devi estrarre i seguenti campi e restituire SOLO un oggetto JSON valido (nessun preambolo, nessun markdown):

{
  "nome": string | null,             // nome commerciale dell'offerta (es. "Fixa Time Smart")
  "tipo": "fisso" | "variabile",     // se il prezzo della materia è bloccato o indicizzato
  "prezzo": number | null,           // €/kWh per luce, €/Smc per gas. Se variabile, è lo SPREAD su PUN/PSV (non il prezzo totale).
  "fisso": number | null,            // costi fissi annui di commercializzazione, in €/anno (somma 12 mesi se mensili)
  "scontoAnno": number | null,       // sconto ricorrente annuale in € (es. sconto bolletta annuale)
  "scontoOneShot": number | null,    // bonus benvenuto una tantum in € (cashback, sconto primo anno)
  "durata": 12 | 24 | 36 | null,     // mesi di blocco prezzo per offerte fisse
  "vincolo": boolean | null,         // true se c'è vincolo di permanenza con penali
  "note": string | null              // breve nota se ci sono clausole rilevanti che non rientrano sopra
}

Regole:
- Se un valore non è chiaramente espresso, usa null. NON inventare numeri.
- Per gli importi mensili, converti sempre in annuali (×12).
- Se vedi più componenti di costo fisso (PCV + commercializzazione vendita), sommali.
- Se l'offerta è solo dual fuel ma vedi solo una materia, restituisci comunque i dati della materia visibile.
- Restituisci esclusivamente JSON, senza testo prima o dopo, senza blocchi markdown.`;

export async function POST({ request }) {
  try {
    const apiKey = import.meta.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response('Server non configurato (manca API key)', { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const contentType = request.headers.get('content-type') || '';

    let userContent;
    let tipoEnergia;

    if (contentType.includes('application/json')) {
      // ===== Modalità testo =====
      const body = await request.json();
      tipoEnergia = body.tipoEnergia;
      const text = (body.text || '').trim();
      if (!text) return new Response('Testo vuoto', { status: 400 });
      if (text.length > 30000) return new Response('Testo troppo lungo (max 30k caratteri)', { status: 413 });

      userContent = [
        { type: 'text', text: `Tipo offerta: ${tipoEnergia}\n\nTesto del contratto/scheda:\n\n${text}` }
      ];

    } else if (contentType.includes('multipart/form-data')) {
      // ===== Modalità file =====
      const form = await request.formData();
      tipoEnergia = form.get('tipoEnergia');
      const file = form.get('file');

      if (!file || typeof file === 'string') {
        return new Response('File mancante', { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return new Response('File troppo grande (max 8 MB)', { status: 413 });
      }

      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mediaType = file.type || 'application/octet-stream';

      if (mediaType === 'application/pdf') {
        userContent = [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 }
          },
          { type: 'text', text: `Tipo offerta: ${tipoEnergia}. Estrai i dati economici secondo lo schema.` }
        ];
      } else if (mediaType.startsWith('image/')) {
        userContent = [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          { type: 'text', text: `Tipo offerta: ${tipoEnergia}. Estrai i dati economici secondo lo schema.` }
        ];
      } else {
        return new Response('Formato file non supportato (usa immagine o PDF)', { status: 400 });
      }
    } else {
      return new Response('Content-Type non supportato', { status: 400 });
    }

    // Chiamata a Claude
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }]
    });

    // Estrai la risposta testuale
    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    // Pulisci eventuali fence markdown
    const clean = text.replace(/^
http://googleusercontent.com/immersive_entry_chip/0
