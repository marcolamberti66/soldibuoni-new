import { getStore } from "@netlify/blobs";

// ═══════════════════════════════════════════════════════════════════
// UPDATE-KNOWLEDGE: Aggiorna Università, RC Auto, Pensione, Conti, Salute, Carburante
//
// OTTIMIZZAZIONE: Usa Haiku (Velocità e risparmio)
// SCHEDULE: Mensile (il 1° del mese alle 07:00)
// ═══════════════════════════════════════════════════════════════════

// Estrattore robusto per ignorare testo discorsivo o markdown di Claude
function extractJSON(text) {
  const match = text.match(/[\{\[]/);
  if (!match) throw new Error("Nessun inizio JSON trovato nella risposta");
  
  const start = match.index;
  const isArray = match[0] === '[';
  const closingChar = isArray ? ']' : '}';
  const end = text.lastIndexOf(closingChar);
  
  if (end === -1) throw new Error("Nessuna fine JSON trovata nella risposta");
  
  const jsonString = text.substring(start, end + 1);
  return JSON.parse(jsonString);
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

  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const raw = data.content && data.content[0] && data.content[0].text ? data.content[0].text.trim() : "";
  if (!raw) throw new Error("Risposta vuota da Claude");

  return extractJSON(raw);
}

// --- FUNZIONI DI GENERAZIONE DATI ---

async function getUniversita() {
  console.log("  Fetching Università...");
  const prompt = `Compila una tabella delle rette universitarie italiane A.A. 2025/2026.
  Restituisci dati per ESATTAMENTE queste 10 facolta: Economia, Giurisprudenza, Ingegneria, Medicina, Architettura, Scienze Politiche, Lettere e Filosofia, Psicologia, Informatica, Scienze della Comunicazione.
  Per OGNI facolta includi 5-7 universita (es. Bocconi, LUISS, Statale Milano, ecc.).
  Campi richiesti: facolta, uni, citta, min (numero), med (numero), max (numero), tipo ("Pubblica"|"Privata").
  FORMATO: ESCLUSIVAMENTE un JSON ARRAY. Niente markdown.`;
  
  const parsed = await askClaude(prompt, 10000);
  if (!Array.isArray(parsed)) throw new Error("Atteso un array da Claude");

  // Raggruppamento dati (logica originale)
  const grouped = {};
  parsed.forEach(o => {
    const fac = o.facolta || "Altro";
    if (!grouped[fac]) grouped[fac] = [];
    grouped[fac].push({ uni: o.uni, citta: o.citta, min: o.min, med: o.med, max: o.max, tipo: o.tipo });
  });
  return grouped;
}

async function getRcAuto() {
  console.log("  Fetching RC Auto...");
  const prompt = `Tabella premi RC Auto aprile 2026. Profilo standard: classe 1-5, Milano.
  Compagnie: UnipolSai, Generali, Allianz Direct, Zurich Connect, ConTe.it, Prima Assicurazioni, Verti.
  Campi: name, rc, furto, kasko, cristalli, assistenza, note, link.
  FORMATO: ESCLUSIVAMENTE un JSON ARRAY. Niente markdown.`;
  return await askClaude(prompt, 3000);
}

async function getPensione() {
  console.log("  Fetching Pensione...");
  const prompt = `Tabella fondi pensione aggiornata. 
  Fondi: Cometa, Fonte, Fon.Te, Amundi SecondaPensione, Allianz Insieme, Arca Previdenza, Generali Global.
  Campi: name, tipo ("Negoziale"|"Aperto"|"PIP"), costo (numero ISC), rendimento5y (numero), rendimento10y (numero), settore, note, link.
  FORMATO: ESCLUSIVAMENTE un JSON ARRAY. Niente markdown.`;
  return await askClaude(prompt, 3000);
}

async function getConti() {
  console.log("  Fetching Conti Correnti...");
  const prompt = `Compila una tabella dei migliori 7 conti correnti italiani (aprile 2026). Includi: BBVA, Hype, Fineco, Revolut, Illimity, Intesa Sanpaolo (XME), UniCredit. 
  Campi richiesti: id (stringa minuscola), name, tags (array di stringhe es: ["Zero Spese", "Rendimento"]), canoneMensile (numero), rendimento (stringa es: "4%"), vantaggioPrincipale (stringa), note, link. 
  FORMATO: ESCLUSIVAMENTE un JSON ARRAY. Niente markdown.`;
  return await askClaude(prompt, 3000);
}

async function getSalute() {
  console.log("  Fetching Assicurazioni Salute...");
  const prompt = `Compila tabella per 6 assicurazioni sanitarie in Italia (UniSalute, Allianz, Generali, AXA, MetLife, Reale Mutua). 
  Campi: name, base (costo mensile), standard (costo), premium (costo), dentale (booleano), oculistica (booleano), specialistica (booleano), ricovero (booleano), note, link. 
  FORMATO: ESCLUSIVAMENTE un JSON ARRAY. Niente markdown.`;
  return await askClaude(prompt, 3000);
}

async function getCarburante() {
  console.log("  Fetching Prezzi Carburante...");
  const prompt = `Fornisci i prezzi medi nazionali dei carburanti in Italia (aprile 2026).
  Restituisci un OGGETTO con chiavi: benzina, diesel, gpl, elettrico. 
  Ogni chiave contiene: price (numero), label (stringa), unit (es: "€/l" o "€/kWh"), icon, color, defaultCons (numero km/l o kWh/100km). 
  FORMATO: ESCLUSIVAMENTE un OGGETTO JSON. Niente markdown.`;
  return await askClaude(prompt, 2000);
}

// --- HANDLER PRINCIPALE ---

export default async function handler(req) {
  console.log("Avvio aggiornamento mensile Knowledge Base...");

  const store = getStore("prices");
  const newData = {};
  const errors = [];

  const tasks = [
    { name: 'universita', fn: getUniversita },
    { name: 'rc_auto', fn: getRcAuto },
    { name: 'pensione', fn: getPensione },
    { name: 'conti_correnti', fn: getConti },
    { name: 'salute', fn: getSalute },
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
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        existing = parsed.data || {};
      }
    } catch (e) {
      console.warn("  Nessun blob esistente, creo un nuovo set.");
    }

    const merged = { ...existing, ...newData };
    const payload = { 
      lastUpdated: new Date().toISOString(), 
      data: merged 
    };

    await store.setJSON("latest", payload);
    const dateKey = new Date().toISOString().split("T")[0];
    await store.setJSON(`archive-knowledge-${dateKey}`, payload);
    console.log("Dati salvati con successo per:", Object.keys(newData));
  }

  const summary = {
    success: errors.length === 0,
    updatedCategories: Object.keys(newData),
    errors: errors,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(summary, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// Schedule: Ore 07:00, Giorno 1 di ogni mese
export const config = { schedule: "0 7 1 * *" };
