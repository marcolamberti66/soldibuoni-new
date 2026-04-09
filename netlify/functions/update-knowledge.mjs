import { getStore } from "@netlify/blobs";

// ═══════════════════════════════════════════════════════════════════
// UPDATE-KNOWLEDGE: Aggiorna Università, RC Auto, Pensione, Conti, Salute, Carburante
//
// OTTIMIZZAZIONE: Usa Haiku (Velocità e risparmio)
// SCHEDULE: Mensile (il 1° del mese alle 07:00)
// ═══════════════════════════════════════════════════════════════════

async function askClaude(prompt, maxTokens) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

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
  if (!raw) throw new Error("Empty response from Claude");

  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}

// --- FUNZIONI DI GENERAZIONE DATI ---

async function getUniversita() {
  console.log("  Fetching Università...");
  const prompt = `Compila tabella rette universitarie italiane 2025/2026. 10 facoltà: Economia, Giurisprudenza, Ingegneria, Medicina, Architettura, Scienze Politiche, Lettere e Filosofia, Psicologia, Informatica, Scienze della Comunicazione. Includi 5-7 università (Pubbliche e Private: Bocconi, LUISS, Statale Milano, ecc.). Campi: facolta, uni, citta, min, med, max, tipo. JSON ARRAY:`;
  return await askClaude(prompt, 10000);
}

async function getRcAuto() {
  console.log("  Fetching RC Auto...");
  const prompt = `Tabella premi RC Auto aprile 2026. Compagnie: UnipolSai, Generali, Allianz Direct, Zurich Connect, ConTe.it, Prima Assicurazioni, Verti. Campi: name, rc, furto, kasko, cristalli, assistenza, note, link. JSON ARRAY:`;
  return await askClaude(prompt, 3000);
}

async function getPensione() {
  console.log("  Fetching Pensione...");
  const prompt = `Tabella fondi pensione (Cometa, Amundi, Allianz Insieme, ecc.). Campi: name, tipo, costo (ISC), rendimento5y, rendimento10y, settore, note, link. JSON ARRAY:`;
  return await askClaude(prompt, 3000);
}

async function getConti() {
  console.log("  Fetching Conti Correnti...");
  const prompt = `Compila una tabella dei migliori 7 conti correnti italiani (aprile 2026). Includi: BBVA, Hype, Fineco, Revolut, Illimity, Intesa Sanpaolo (XME), UniCredit (MyGenius). 
  Campi richiesti: id (stringa minuscola), name, tags (array di stringhe es: ["Zero Spese", "Rendimento"]), canoneMensile (numero), rendimento (stringa es: "4%"), vantaggioPrincipale (stringa), note (max 50 caratteri), link. 
  FORMATO: SOLO JSON array valido.`;
  return await askClaude(prompt, 3000);
}

async function getSalute() {
  console.log("  Fetching Assicurazioni Salute...");
  const prompt = `Compila tabella per 6 assicurazioni sanitarie (UniSalute, Allianz, Generali, AXA, MetLife, Reale Mutua). 
  Campi: name, base (costo mensile), standard (costo mensile), premium (costo mensile), dentale (booleano), oculistica (booleano), specialistica (booleano), ricovero (booleano), note, link. 
  FORMATO: SOLO JSON array valido.`;
  return await askClaude(prompt, 3000);
}

async function getCarburante() {
  console.log("  Fetching Prezzi Carburante...");
  const prompt = `Fornisci i prezzi medi nazionali dei carburanti in Italia (aprile 2026).
  Restituisci un OGGETTO con chiavi: benzina, diesel, gpl, elettrico. 
  Ogni chiave contiene: price (numero), label (stringa es: "Benzina Senza Piombo"), unit (es: "€/l" o "€/kWh"), icon, color, defaultCons (numero km/l o kWh/100km). 
  FORMATO: SOLO JSON.`;
  return await askClaude(prompt, 2000);
}

// --- HANDLER PRINCIPALE ---

export default async function handler(req) {
  console.log("Avvio aggiornamento mensile Knowledge Base...");

  const store = getStore("prices");
  const newData = {};
  const errors = [];

  // Esecuzione sequenziale per evitare spike di rate limit
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
      console.warn("  Impossibile leggere blob esistente, creo nuovo set.");
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
