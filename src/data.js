// ═══════════════════════════════════════════════════════════════════
// DATA - SoldiBuoni.it (FULL RESTORE FOR BUILD - April 2026)
// ═══════════════════════════════════════════════════════════════════

export let ENERGY_PROVIDERS = [
  { name: 'Enel Energia', tipo: 'Variabile', prezzo: 0.067, fisso: 12.5, verde: true, note: 'PUN + spread 0.012 €/kWh' },
  { name: 'Eni Plenitude', tipo: 'Fisso 12m', prezzo: 0.082, fisso: 10, verde: false, note: 'Prezzo bloccato 12 mesi' },
  { name: 'A2A Energia', tipo: 'Fisso 24m', prezzo: 0.089, fisso: 8, verde: true, note: '100% rinnovabile' },
  { name: 'Edison', tipo: 'Variabile', prezzo: 0.063, fisso: 14, verde: false, note: 'PUN + spread 0.008 €/kWh' },
  { name: 'Sorgenia', tipo: 'Fisso 12m', prezzo: 0.078, fisso: 0, verde: true, note: 'Zero costi fissi, 100% green' },
  { name: 'Illumia', tipo: 'Variabile', prezzo: 0.071, fisso: 6, verde: false, note: 'PUN + spread 0.016 €/kWh' },
  { name: 'Wekiwi', tipo: 'Fisso 12m', prezzo: 0.075, fisso: 5, verde: true, note: 'App-based, sconto digitale' },
  { name: 'Hera Comm', tipo: 'Variabile', prezzo: 0.069, fisso: 9, verde: false, note: 'PUN + spread 0.014 €/kWh' },
];

export let GAS_PROVIDERS = [
  { name: 'Enel Energia', tipo: 'Variabile', prezzo: 0.42, fisso: 10, note: 'PSV + spread 0.03 €/Smc' },
  { name: 'Eni Plenitude', tipo: 'Fisso 12m', prezzo: 0.52, fisso: 8, note: 'Prezzo bloccato 12 mesi' },
  { name: 'A2A Energia', tipo: 'Fisso 24m', prezzo: 0.55, fisso: 6, note: 'Blocco 24 mesi, carbon offset' },
  { name: 'Edison', tipo: 'Variabile', prezzo: 0.4, fisso: 12, note: 'PSV + spread 0.02 €/Smc' },
  { name: 'Sorgenia', tipo: 'Fisso 12m', prezzo: 0.49, fisso: 0, note: 'Zero costi fissi mensili' },
  { name: 'Illumia', tipo: 'Variabile', prezzo: 0.44, fisso: 7, note: 'PSV + spread 0.04 €/Smc' },
  { name: 'Hera Comm', tipo: 'Variabile', prezzo: 0.43, fisso: 9, note: 'PSV + spread 0.035 €/Smc' },
];

export const INSURANCE_DATA = [
  { name: 'UnipolSai', rc: 380, furto: 120, kasko: 450, cristalli: 45, assistenza: 35, note: 'Leader' },
  { name: 'Generali', rc: 420, furto: 140, kasko: 520, cristalli: 50, assistenza: 40, note: 'Capillare' },
  { name: 'Allianz Direct', rc: 310, furto: 95, kasko: 380, cristalli: 35, assistenza: 25, note: 'Online' },
  { name: 'Zurich Connect', rc: 325, furto: 100, kasko: 400, cristalli: 38, assistenza: 28, note: 'Digitale' },
  { name: 'ConTe.it', rc: 295, furto: 90, kasko: 360, cristalli: 32, assistenza: 22, note: 'Prezzo' },
  { name: 'Prima Assicurazioni', rc: 305, furto: 88, kasko: 370, cristalli: 30, assistenza: 20, note: 'Insurtech' },
  { name: 'Verti', rc: 330, furto: 110, kasko: 410, cristalli: 40, assistenza: 30, note: 'Smart' },
];

export const HEALTH_INSURANCE = [
  { name: 'UniSalute', base: 45, standard: 95, premium: 180, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Leader' },
  { name: 'Allianz', base: 60, standard: 120, premium: 230, dentale: true, oculistica: false, specialistica: true, ricovero: true, note: 'Internazionale' },
  { name: 'Generali', base: 55, standard: 110, premium: 210, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Rete top' },
  { name: 'AXA', base: 52, standard: 105, premium: 200, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Flessibile' },
  { name: 'MetLife', base: 35, standard: 75, premium: 150, dentale: false, oculistica: true, specialistica: true, ricovero: true, note: 'Competitiva' },
  { name: 'Reale Mutua', base: 50, standard: 100, premium: 195, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Chirurgia' },
];

export let INTERNET_PROVIDERS = [
  { name: 'Iliad Fibra', tipo: 'FTTH', prezzo: 19.99, velocita: '5 Gbps', vincolo: 'No', note: 'Prezzo fisso' },
  { name: 'Fastweb Casa', tipo: 'FTTH', prezzo: 27.95, velocita: '2.5 Gbps', vincolo: 'No', note: 'WiFi 6' },
  { name: 'TIM WiFi', tipo: 'FTTH', prezzo: 29.9, velocita: '2.5 Gbps', vincolo: '24m', note: 'Assistenza' },
  { name: 'Vodafone', tipo: 'FTTH', prezzo: 27.9, velocita: '2.5 Gbps', vincolo: '24m', note: 'Station incl.' },
  { name: 'WindTre', tipo: 'FTTH', prezzo: 26.99, velocita: '2.5 Gbps', vincolo: '24m', note: 'Amazon Prime' },
  { name: 'Sky WiFi', tipo: 'FTTH', prezzo: 29.9, velocita: '1 Gbps', vincolo: '18m', note: 'Ottimizzato AI' },
  { name: 'Tiscali', tipo: 'FTTH', prezzo: 22.9, velocita: '2.5 Gbps', vincolo: 'No', note: 'Attivazione free' },
];

export const PENSION_FUNDS = [
  { name: 'Cometa', tipo: 'Negoziale', costo: 0.15, rendimento5y: 4.2, rendimento10y: 5.1, settore: 'Metalmeccanici', note: 'Più grande' },
  { name: 'Fonte', tipo: 'Negoziale', costo: 0.18, rendimento5y: 3.8, rendimento10y: 4.7, settore: 'Commercio', note: 'Terziario' },
  { name: 'Amundi', tipo: 'Aperto', costo: 1.2, rendimento5y: 5.1, rendimento10y: 5.8, settore: 'Tutti', note: 'Top performer' },
  { name: 'Allianz Insieme', tipo: 'Aperto', costo: 1.35, rendimento5y: 4.8, rendimento10y: 5.5, settore: 'Tutti', note: 'Performante' },
  { name: 'Generali Global', tipo: 'PIP', costo: 2.1, rendimento5y: 3.2, rendimento10y: 3.9, settore: 'Tutti', note: 'Individuale' },
];

export const UNI_FACOLTA = [ 'Economia', 'Giurisprudenza', 'Ingegneria', 'Medicina', 'Architettura', 'Scienze Politiche', 'Lettere e Filosofia', 'Psicologia', 'Informatica', 'Scienze della Comunicazione' ];

export const UNI_DATA = {
  Economia: [ { uni: 'Bocconi', citta: 'Milano', min: 5900, med: 9200, max: 13000, tipo: 'Privata' }, { uni: 'LUISS', citta: 'Roma', min: 5500, med: 8500, max: 12000, tipo: 'Privata' }, { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1200, max: 2800, tipo: 'Pubblica' } ],
};

// ── OGGETTO TOPICS COMPLETO PER ASTRO ROUTES ──
export const TOPICS = {
  energia: { icon: '⚡', title: 'Energia', color: '#F59E0B', capire: { title: "Mercato", content: [] }, guida: { title: "Guida", steps: [] } },
  gas: { icon: '🔥', title: 'Gas', color: '#EF4444', capire: { title: "Mercato", content: [] }, guida: { title: "Guida", steps: [] } },
  acqua: { icon: '💧', title: 'Acqua', color: '#3B82F6', capire: { title: "Mercato", content: [] }, guida: { title: "Guida", steps: [] } },
  internet: { icon: '📡', title: 'Internet', color: '#8B5CF6', capire: { title: "Mercato", content: [] }, guida: { title: "Guida", steps: [] } },
  mutuo: { icon: '🏠', title: 'Mutuo', color: '#10B981', capire: { title: "Mercato", content: [] }, guida: { title: "Guida", steps: [] } },
  rc_auto: { icon: '🚗', title: 'RC Auto', color: '#EC4899', capire: { title: "Mercato", content: [] }, guida: { title: "Guida", steps: [] } },
  bollo_revisione: { icon: '🔧', title: 'Bollo', color: '#F97316', capire: { title: "Scadenze", content: [] }, guida: { title: "Guida", steps: [] } },
  istruzione: { icon: '🎓', title: 'Istruzione', color: '#6366F1', capire: { title: "Costi", content: [] }, guida: { title: "Guida", steps: [] } },
  tfr_pensione: { icon: '📊', title: 'Pensione', color: '#14B8A6', capire: { title: "TFR", content: [] }, guida: { title: "Guida", steps: [] } },
  salute: { icon: '🏥', title: 'Salute', color: '#DC2626', capire: { title: "Assicurazione", content: [] }, guida: { title: "Guida", steps: [] } },
  carburante: { icon: '⛽', title: 'Carburante', color: '#84CC16', capire: { title: "Prezzi", content: [] }, guida: { title: "Guida", steps: [] } },
};

export const CONTI_CORRENTI = [
  { id: "bbva", name: "BBVA Conto Online", tags: ["zero_spese"], canoneMensile: 0, rendimento: "3% lordo", vantaggioPrincipale: "Cashback 4%", note: "No costi nascosti", link: "[LINK_BBVA]" },
  { id: "hype", name: "Hype Base", tags: ["zero_spese"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Carta virtuale", note: "Under 30", link: "[LINK_HYPE]" },
  { id: "fineco", name: "FinecoBank", tags: ["business"], canoneMensile: 3.95, rendimento: "1,50%", vantaggioPrincipale: "Trading", note: "Gratis Under 30", link: "[LINK_FINECO]" },
  { id: "revolut", name: "Revolut", tags: ["zero_spese"], canoneMensile: 0, rendimento: "2,50%", vantaggioPrincipale: "Cambio valuta", note: "Per viaggiatori", link: "[LINK_REVOLUT]" },
  { id: "bper", name: "BPER Banca", tags: ["tradizionale"], canoneMensile: 0, rendimento: "3,30%", vantaggioPrincipale: "Conto vincolato", note: "Canone zero", link: "[LINK_BPER]" },
  { id: "intesa_xme", name: "Intesa XME", tags: ["giovani"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Under 35", note: "Esenzione bollo", link: "[LINK_INTESA]" },
  { id: "unicredit", name: "UniCredit", tags: ["tradizionale"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Online gratis", note: "Bonifici SEPA", link: "[LINK_UNICREDIT]" }
];

export const FUEL_PRICES = {
  benzina: { price: 1.85, label: "Benzina", unit: "€/l", icon: "⛽", color: "#f59e0b", defaultCons: 14 },
  diesel: { price: 1.74, label: "Diesel", unit: "€/l", icon: "🛢️", color: "#3b82f6", defaultCons: 18 },
  gpl: { price: 0.71, label: "GPL", unit: "€/l", icon: "🍃", color: "#10b981", defaultCons: 10 },
  elettrico: { price: 0.25, label: "Elettrico", unit: "€/kWh", icon: "⚡", color: "#8b5cf6", defaultCons: 16 }
};
