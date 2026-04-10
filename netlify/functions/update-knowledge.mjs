import { getStore } from "@netlify/blobs";

// ═══════════════════════════════════════════════════════════════════
// UPDATE-KNOWLEDGE: Sistema Ibrido Definitivo
// - Conti Correnti: Google Sheets (Dati Reali)
// - RC Auto, Pensione, Salute, Università, Carburante: Claude Haiku
// SCHEDULE: Mensile (il 1° del mese alle 07:00)
// ═══════════════════════════════════════════════════════════════════

function extractJSON(text) {
  const match = text.match(/[\{\[]/);
  if (!match) throw new Error("Nessun inizio JSON trovato nella risposta");
  const start = match.index;
  const isArray = match[0] === '[';
  const closingChar = isArray ? ']' : '}';
  const end = text.lastIndexOf(closingChar);
  if (end === -1) throw new Error("Nessuna fine JSON trovata nella risposta");
  return JSON.parse(text.substring(start, end + 1));
}

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
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error ${res.status}`);
  const data = await res.json();
  const raw = data.content && data.content[0] && data.content[0].text ? data.content[0].text.trim() : "";
  if (!raw) throw new Error("Risposta vuota da Claude");
  return extractJSON(raw);
}

// --- FUNZIONI DI GENERAZIONE DATI ---

async function getContiDaFogli() {
  console.log("  Fetching Conti Correnti da Google Sheets...");
  const GOOGLE_SHEET_TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPxyyNbmd1IkF6ZGX9Fjg-oy4ShFfpvJp-JRkmfznBngKxDhqOHXPN5LvPBDb6XRrbdIBHl1QAqw6y/pub?output=tsv";
  
  const res = await fetch(GOOGLE_SHEET_TSV_URL);
  if (!res.ok) throw new Error("Errore nel download del Google Sheet");
  
  const text = await res.text();
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) throw new Error("Il foglio Google sembra vuoto");

  const headers = lines[0].split('\t').map(h => h.trim().replace('\r', ''));
  const contiArray = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t').map(v => v.trim().replace('\r', ''));
    const obj = {};
    headers.forEach((header, index) => {
      let val = values[index] || "";
      if (header === 'canoneMensile') val = Number(val) || 0;
      if (header === 'tags') val = val.split(',').map(t => t.trim());
      obj[header] = val;
    });
    contiArray.push(obj);
  }
  return contiArray;
}

async function getRcAuto() {
  console.log("  Fetching RC Auto (AI)...");
  // FIX: Costringiamo l'AI a usare NUMERI INTERI, non range o stringhe, per permettere l'addizione.
  const prompt = `Tabella premi RC Auto aprile 2026. Compagnie obbligatorie: UnipolSai, Generali, Allianz Direct, Zurich Connect, ConTe.it, Prima Assicurazioni, Verti.
  REGOLA FONDAMENTALE: I prezzi DEVONO essere numeri interi singoli (es. 350), NON range e NON stringhe.
  Campi richiesti: name, rc (numero intero), furto (numero intero), kasko (numero intero), cristalli (numero intero), assistenza (numero intero), note, link (se non lo sai, usa la homepage es. "https://www.generali.it").
  FORMATO: SOLO JSON ARRAY.`;
  return await askClaude(prompt, 3000);
}

async function getPensione() {
  console.log("  Fetching Pensione (AI)...");
  const prompt = `Tabella fondi pensione aggiornata. Fondi: Cometa, Fonte, Fon.Te, Amundi SecondaPensione, Allianz Insieme, Arca Previdenza, Generali Global. 
  Campi: name, tipo, costo (numero), rendimento5y (numero), rendimento10y (numero), settore, note, link. 
  FORMATO: SOLO JSON ARRAY.`;
  return await askClaude(prompt, 3000);
}

async function getSalute() {
  console.log("  Fetching Assicurazioni Salute (AI)...");
  // FIX: Forza solo i grandi player ed esclude micro-società.
  const prompt = `Compila tabella per ESATTAMENTE queste 6 grandi assicurazioni sanitarie: UniSalute, Allianz, Generali, AXA, MetLife, Reale Mutua.
  Campi: name, base (costo mensile come numero intero), standard (numero intero), premium (numero intero), dentale (booleano), oculistica (booleano), specialistica (booleano), ricovero (booleano), note, link. 
  FORMATO: SOLO JSON ARRAY.`;
  return await askClaude(prompt, 3000);
}

async function getUniversita() {
  console.log("  Fetching Università (AI)...");
  const prompt = `Compila tabella rette universitarie 2025/2026 per 10 facolta: Economia, Giurisprudenza, Ingegneria, Medicina, Architettura, Scienze Politiche, Lettere e Filosofia, Psicologia, Informatica, Scienze della Comunicazione. Includi 5-7 università note (Politecnico, Bocconi, Statale, LUISS, ecc.). 
  Campi: facolta, uni, citta, min (numero intero), med (numero intero), max (numero intero), tipo ("Pubblica"|"Privata"). FORMATO: SOLO JSON ARRAY.`;
  const parsed = await askClaude(prompt, 10000);
  
  const grouped = {};
  parsed.forEach(o => {
    const fac = o.facolta || "Altro";
    if (!grouped[fac]) grouped[fac] = [];
    grouped[fac].push({ uni: o.uni, citta: o.citta, min: o.min, med: o.med, max: o.max, tipo: o.tipo });
  });
  return grouped;
}

async function getCarburante() {
  console.log("  Fetching Prezzi Carburante (AI)...");
  const prompt = `Prezzi medi nazionali carburanti Italia. Oggetto con chiavi: benzina, diesel, gpl, elettrico. Campi per ogni chiave: price (numero decimale), label (stringa), unit, icon, color, defaultCons. FORMATO: SOLO OGGETTO JSON.`;
  return await askClaude(prompt, 2000);
}

// --- HANDLER PRINCIPALE ---

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
    } catch (err) {
      errors.push(`${task.name}: ${err.message}`);
      console.error(`  Task ${task.name} fallito:`, err.message);
    }
  }

  if (Object.keys(newData).length > 0) {
    let existing = {};
    try {
      const raw = await store.get("latest");
      if (raw) existing = typeof raw === "string" ? JSON.parse(raw).data : raw.data;
    } catch (e) {
      console.warn("  Nessun blob esistente, creo nuovo.");
    }

    const merged = { ...existing, ...newData };
    const payload = { lastUpdated: new Date().toISOString(), data: merged };

    await store.setJSON("latest", payload);
    await store.setJSON(`archive-knowledge-${new Date().toISOString().split("T")[0]}`, payload);
  }

  return new Response(JSON.stringify({ success: errors.length === 0, updatedCategories: Object.keys(newData), errors }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
}

export const config = { schedule: "0 7 1 * *" };
