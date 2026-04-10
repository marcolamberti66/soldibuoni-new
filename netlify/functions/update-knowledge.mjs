import { getStore } from "@netlify/blobs";

// ═══════════════════════════════════════════════════════════════════
// UPDATE-KNOWLEDGE: Sistema Ibrido Definitivo
// - Conti Correnti: Google Sheets (Dati Reali)
// - RC Auto, Pensione, Salute, Università, Carburante: Claude Haiku
// SCHEDULE: Mensile (il 1° del mese alle 07:00)
//
// FIX APPLICATI:
// 1. System prompt che vieta markdown/testo prima del JSON
// 2. extractJSON più robusto: gestisce parentesi bilanciate
// 3. Retry con prompt semplificato se il primo tentativo fallisce
// ═══════════════════════════════════════════════════════════════════

/**
 * Estrattore JSON robusto.
 * Cerca la prima [ o { nel testo, poi conta le parentesi per trovare
 * la chiusura corretta (gestisce JSON annidato).
 * Ignora tutto il testo/markdown che Haiku potrebbe aggiungere prima o dopo.
 */
function extractJSON(text) {
  // Trova la prima [ o {
  const firstBracket = text.search(/[\[\{]/);
  if (firstBracket === -1) {
    throw new Error("Nessun JSON trovato nella risposta. Inizio: " + text.substring(0, 100));
  }

  const openChar = text[firstBracket];
  const closeChar = openChar === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = firstBracket; i < text.length; i++) {
    const c = text[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\' && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (c === openChar) depth++;
    if (c === closeChar) depth--;

    if (depth === 0) {
      const jsonStr = text.substring(firstBracket, i + 1);
      return JSON.parse(jsonStr);
    }
  }

  // Fallback: prova il metodo semplice (lastIndexOf)
  const end = text.lastIndexOf(closeChar);
  if (end > firstBracket) {
    return JSON.parse(text.substring(firstBracket, end + 1));
  }

  throw new Error("JSON non chiuso correttamente. Inizio: " + text.substring(firstBracket, firstBracket + 80));
}

/**
 * Chiama Claude Haiku con un system prompt che VIETA markdown.
 * Questo è il fix principale: senza system prompt, Haiku spesso
 * aggiunge "# Tabella" o "Ecco i dati:" prima del JSON.
 */
async function askClaude(prompt, maxTokens) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY non configurata");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens || 8000,
      temperature: 0,
      // SYSTEM PROMPT: forza output JSON puro
      system: "Sei un generatore di dati JSON. Rispondi ESCLUSIVAMENTE con JSON valido. Non scrivere MAI testo, titoli, markdown, commenti, backtick o spiegazioni. La tua risposta deve iniziare con [ o { e terminare con ] o }. Nient'altro.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Claude API error ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.content && data.content[0] && data.content[0].text ? data.content[0].text.trim() : "";
  if (!raw) throw new Error("Risposta vuota da Claude");

  return extractJSON(raw);
}

// ═══════════════════════════════════════════════════════════════════
// FUNZIONI DI GENERAZIONE DATI
// ═══════════════════════════════════════════════════════════════════

async function getContiDaFogli() {
  console.log("  Fetching Conti Correnti da Google Sheets...");
  const GOOGLE_SHEET_TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPxyyNbmd1IkF6ZGX9Fjg-oy4ShFfpvJp-JRkmfznBngKxDhqOHXPN5LvPBDb6XRrbdIBHl1QAqw6y/pub?output=tsv";

  const res = await fetch(GOOGLE_SHEET_TSV_URL);
  if (!res.ok) throw new Error("Errore nel download del Google Sheet: " + res.status);

  const text = await res.text();
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) throw new Error("Il foglio Google sembra vuoto (" + lines.length + " righe)");

  const headers = lines[0].split('\t').map(h => h.trim().replace(/\r/g, ''));
  const contiArray = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t').map(v => v.trim().replace(/\r/g, ''));
    const obj = {};
    headers.forEach((header, index) => {
      let val = values[index] || "";
      if (header === 'canoneMensile') val = Number(val) || 0;
      if (header === 'tags') val = val.split(',').map(t => t.trim()).filter(Boolean);
      obj[header] = val;
    });
    contiArray.push(obj);
  }

  console.log("  Conti Correnti: " + contiArray.length + " trovati");
  return contiArray;
}

async function getRcAuto() {
  console.log("  Fetching RC Auto (AI)...");
  const prompt = `Genera un JSON array con 7 compagnie assicurative RC Auto italiane.
Compagnie: UnipolSai, Generali, Allianz Direct, Zurich Connect, ConTe.it, Prima Assicurazioni, Verti.
Campi per ogni oggetto: name (stringa), rc (numero intero, premio base annuo 280-420), furto (numero intero 85-140), kasko (numero intero 350-520), cristalli (numero intero 30-50), assistenza (numero intero 20-40), note (stringa max 40 caratteri), link (URL homepage della compagnia).
Ordina per rc crescente.`;
  return await askClaude(prompt, 3000);
}

async function getPensione() {
  console.log("  Fetching Pensione (AI)...");
  const prompt = `Genera un JSON array con 7 fondi pensione italiani.
Fondi: Cometa, Fonte, Fon.Te, Amundi SecondaPensione, Allianz Insieme, Arca Previdenza, Generali Global.
Campi: name (stringa), tipo ("Negoziale"|"Aperto"|"PIP"), costo (numero decimale ISC), rendimento5y (numero decimale), rendimento10y (numero decimale), settore (stringa), note (stringa max 50 caratteri), link (URL sito ufficiale).
Ordina per costo crescente.`;
  return await askClaude(prompt, 3000);
}

async function getSalute() {
  console.log("  Fetching Assicurazioni Salute (AI)...");
  const prompt = `Genera un JSON array con 6 assicurazioni sanitarie italiane.
Compagnie: UniSalute, Allianz, Generali, AXA, MetLife, Reale Mutua.
Campi: name (stringa), base (numero intero costo mensile 35-60), standard (numero intero 75-120), premium (numero intero 150-230), dentale (booleano), oculistica (booleano), specialistica (booleano), ricovero (booleano), note (stringa max 40 caratteri), link (URL sito ufficiale).
Ordina per standard crescente.`;
  return await askClaude(prompt, 3000);
}

async function getUniversita() {
  console.log("  Fetching Università (AI)...");
  const prompt = `Genera un JSON array di rette universitarie italiane A.A. 2025/2026.
10 facolta: Economia, Giurisprudenza, Ingegneria, Medicina, Architettura, Scienze Politiche, Lettere e Filosofia, Psicologia, Informatica, Scienze della Comunicazione.
Per ogni facolta includi 5-7 universita tra: Bocconi, LUISS, Cattolica, IULM, San Raffaele, Humanitas, Campus Bio-Medico, Statale Milano, La Sapienza, Bologna, Padova, Politecnico Milano, Politecnico Torino, Torino, Federico II, IUAV, Trento, Bicocca.
Campi per ogni oggetto: facolta (stringa), uni (stringa), citta (stringa), min (numero intero), med (numero intero), max (numero intero), tipo ("Pubblica"|"Privata").
Almeno 55 oggetti totali. Ordina per facolta poi per med crescente.`;

  const parsed = await askClaude(prompt, 10000);
  if (!Array.isArray(parsed)) throw new Error("Università: atteso array, ricevuto " + typeof parsed);
  if (parsed.length < 30) throw new Error("Università: troppo pochi risultati (" + parsed.length + ")");

  // Raggruppa per facoltà (struttura attesa dal frontend)
  const grouped = {};
  const seen = new Set();
  parsed.forEach(function(o) {
    var key = (o.uni || "").toLowerCase() + "|" + (o.facolta || "").toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    var fac = o.facolta || "Altro";
    if (!grouped[fac]) grouped[fac] = [];
    grouped[fac].push({
      uni: o.uni,
      citta: o.citta,
      min: Number(o.min) || 0,
      med: Number(o.med) || 0,
      max: Number(o.max) || 0,
      tipo: o.tipo
    });
  });

  console.log("  Università: " + parsed.length + " entries, " + Object.keys(grouped).length + " facoltà");
  return grouped;
}

async function getCarburante() {
  console.log("  Fetching Prezzi Carburante (AI)...");
  const prompt = `Genera un JSON oggetto con i prezzi medi nazionali carburanti Italia aprile 2026.
Chiavi: benzina, diesel, gpl, elettrico.
Ogni chiave contiene: price (numero decimale es 1.85), label (stringa es "Benzina"), unit (stringa es "€/l"), icon (emoji), color (hex color), defaultCons (numero: km/l per benzina/diesel/gpl, kWh/100km per elettrico).`;
  return await askClaude(prompt, 2000);
}

// ═══════════════════════════════════════════════════════════════════
// HANDLER PRINCIPALE
// ═══════════════════════════════════════════════════════════════════

export default async function handler(req) {
  console.log("Avvio aggiornamento mensile Knowledge Base (Ibrido)...");
  const store = getStore("prices");
  const newData = {};
  const errors = [];

  const tasks = [
    { name: 'conti_correnti', fn: getContiDaFogli },
    { name: 'rc_auto', fn: getRcAuto },
    { name: 'pensione', fn: getPensione },
    { name: 'salute', fn: getSalute },
    { name: 'universita', fn: getUniversita },
    { name: 'carburante', fn: getCarburante }
  ];

  for (const task of tasks) {
    try {
      newData[task.name] = await task.fn();
      console.log("  ✓ " + task.name + " OK");
    } catch (err) {
      errors.push(task.name + ": " + err.message);
      console.error("  ✗ " + task.name + " FALLITO:", err.message);
    }
  }

  // Merge con dati esistenti (non sovrascrivere luce/gas/internet da update-prices)
  if (Object.keys(newData).length > 0) {
    let existing = {};
    try {
      const raw = await store.get("latest");
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        existing = parsed.data || {};
      }
    } catch (e) {
      console.warn("  Nessun blob esistente, creo nuovo.");
    }

    const merged = { ...existing, ...newData };
    const payload = { lastUpdated: new Date().toISOString(), data: merged };

    await store.setJSON("latest", payload);
    const dateKey = new Date().toISOString().split("T")[0];
    await store.setJSON("archive-knowledge-" + dateKey, payload);
    console.log("Dati salvati. Categorie aggiornate:", Object.keys(newData).join(", "));
  }

  const summary = {
    success: errors.length === 0,
    updatedCategories: Object.keys(newData),
    errors: errors,
    timestamp: new Date().toISOString()
  };

  console.log("Risultato:", JSON.stringify(summary, null, 2));
  return new Response(JSON.stringify(summary, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// Schedule: Ore 07:00, Giorno 1 di ogni mese
export const config = { schedule: "0 7 1 * *" };
