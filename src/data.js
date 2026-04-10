// ═══════════════════════════════════════════════════════════════════
// DATA - SoldiBuoni.it (Aggiornato Aprile 2026)
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
  { name: 'UnipolSai', rc: 380, furto: 120, kasko: 450, cristalli: 45, assistenza: 35, note: 'Leader mercato italiano' },
  { name: 'Generali', rc: 420, furto: 140, kasko: 520, cristalli: 50, assistenza: 40, note: 'Capillarità agenzie' },
  { name: 'Allianz Direct', rc: 310, furto: 95, kasko: 380, cristalli: 35, assistenza: 25, note: 'Solo online, prezzi competitivi' },
  { name: 'Zurich Connect', rc: 325, furto: 100, kasko: 400, cristalli: 38, assistenza: 28, note: 'Polizza digitale flessibile' },
  { name: 'ConTe.it', rc: 295, furto: 90, kasko: 360, cristalli: 32, assistenza: 22, note: 'Miglior prezzo online' },
  { name: 'Prima Assicurazioni', rc: 305, furto: 88, kasko: 370, cristalli: 30, assistenza: 20, note: 'Startup insurtech italiana' },
  { name: 'Verti', rc: 330, furto: 110, kasko: 410, cristalli: 40, assistenza: 30, note: 'Ex Direct Line' },
];

export const HEALTH_INSURANCE = [
  { name: 'UniSalute', base: 45, standard: 95, premium: 180, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'N.1 in Italia per sanità integrativa' },
  { name: 'Allianz', base: 60, standard: 120, premium: 230, dentale: true, oculistica: false, specialistica: true, ricovero: true, note: 'Solidità internazionale' },
  { name: 'Generali', base: 55, standard: 110, premium: 210, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Ampia rete convenzionata' },
  { name: 'AXA', base: 52, standard: 105, premium: 200, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Soluzione Salute flessibile' },
  { name: 'MetLife', base: 35, standard: 75, premium: 150, dentale: false, oculistica: true, specialistica: true, ricovero: true, note: 'Prezzi entry-level competitivi' },
  { name: 'Reale Mutua', base: 50, standard: 100, premium: 195, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Forte su ricoveri e chirurgia' },
];

export let INTERNET_PROVIDERS = [
  { name: 'Iliad Fibra', tipo: 'FTTH', prezzo: 19.99, velocita: '5 Gbps', vincolo: 'No', note: 'Prezzo per sempre, no sorprese' },
  { name: 'Fastweb Casa Light', tipo: 'FTTH', prezzo: 27.95, velocita: '2.5 Gbps', vincolo: 'No', note: 'Modem incluso, WiFi 6' },
  { name: 'TIM WiFi Power', tipo: 'FTTH', prezzo: 29.9, velocita: '2.5 Gbps', vincolo: '24 mesi', note: 'Modem TIM Hub+, assistenza dedicata' },
  { name: 'Vodafone Internet Unlimited', tipo: 'FTTH', prezzo: 27.9, velocita: '2.5 Gbps', vincolo: '24 mesi', note: 'Vodafone Station inclusa' },
  { name: 'WindTre Super Fibra', tipo: 'FTTH', prezzo: 26.99, velocita: '2.5 Gbps', vincolo: '24 mesi', note: 'Modem incluso, 12 mesi Amazon Prime' },
  { name: 'Sky WiFi', tipo: 'FTTH', prezzo: 29.9, velocita: '1 Gbps', vincolo: '18 mesi', note: 'Sky WiFi Hub, ottimizzazione AI' },
  { name: 'Tiscali UltraFibra', tipo: 'FTTH', prezzo: 22.9, velocita: '2.5 Gbps', vincolo: 'No', note: 'Attivazione gratuita online' },
];

export const PENSION_FUNDS = [
  { name: 'Cometa', tipo: 'Negoziale', costo: 0.15, rendimento5y: 4.2, rendimento10y: 5.1, settore: 'Metalmeccanici', note: 'Più grande fondo negoziale italiano' },
  { name: 'Fonte', tipo: 'Negoziale', costo: 0.18, rendimento5y: 3.8, rendimento10y: 4.7, settore: 'Commercio/Turismo', note: 'Per dipendenti del terziario' },
  { name: 'Fon.Te', tipo: 'Negoziale', costo: 0.2, rendimento5y: 3.9, rendimento10y: 4.5, settore: 'Vari CCNL', note: 'Multi-comparto flessibile' },
  { name: 'Amundi SecondaPensione', tipo: 'Aperto', costo: 1.2, rendimento5y: 5.1, rendimento10y: 5.8, settore: 'Tutti', note: 'Ampia scelta comparti' },
  { name: 'Allianz Insieme', tipo: 'Aperto', costo: 1.35, rendimento5y: 4.8, rendimento10y: 5.5, settore: 'Tutti', note: 'Buona performance storica' },
  { name: 'Arca Previdenza', tipo: 'Aperto', costo: 1.1, rendimento5y: 4.5, rendimento10y: 5.2, settore: 'Tutti', note: 'Costi contenuti per fondo aperto' },
  { name: 'Generali Global', tipo: 'PIP', costo: 2.1, rendimento5y: 3.2, rendimento10y: 3.9, settore: 'Tutti', note: 'Piano Individuale Pensionistico' },
];

export const UNI_FACOLTA = [ 'Economia', 'Giurisprudenza', 'Ingegneria', 'Medicina', 'Architettura', 'Scienze Politiche', 'Lettere e Filosofia', 'Psicologia', 'Informatica', 'Scienze della Comunicazione' ];

export const UNI_DATA = {
  Economia: [
    { uni: 'Bocconi', citta: 'Milano', min: 5900, med: 9200, max: 13000, tipo: 'Privata' },
    { uni: 'LUISS', citta: 'Roma', min: 5500, med: 8500, max: 12000, tipo: 'Privata' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1200, max: 2800, tipo: 'Pubblica' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1100, max: 2500, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1300, max: 2900, tipo: 'Pubblica' },
    { uni: 'Cattolica', citta: 'Milano', min: 3800, med: 6200, max: 8900, tipo: 'Privata' },
    { uni: 'Torino', citta: 'Torino', min: 156, med: 1000, max: 2600, tipo: 'Pubblica' },
  ],
  Giurisprudenza: [
    { uni: 'LUISS', citta: 'Roma', min: 5500, med: 8500, max: 12000, tipo: 'Privata' },
    { uni: 'Bocconi', citta: 'Milano', min: 5900, med: 9000, max: 12500, tipo: 'Privata' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1100, max: 2500, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1200, max: 2800, tipo: 'Pubblica' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1150, max: 2700, tipo: 'Pubblica' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1050, max: 2600, tipo: 'Pubblica' },
  ],
  Ingegneria: [
    { uni: 'Politecnico Milano', citta: 'Milano', min: 156, med: 1500, max: 3800, tipo: 'Pubblica' },
    { uni: 'Politecnico Torino', citta: 'Torino', min: 156, med: 1300, max: 3200, tipo: 'Pubblica' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1100, max: 2600, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1250, max: 2900, tipo: 'Pubblica' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1100, max: 2700, tipo: 'Pubblica' },
    { uni: 'Federico II', citta: 'Napoli', min: 156, med: 900, max: 2400, tipo: 'Pubblica' },
  ],
  Medicina: [
    { uni: 'San Raffaele', citta: 'Milano', min: 8000, med: 14000, max: 20000, tipo: 'Privata' },
    { uni: 'Humanitas', citta: 'Milano', min: 9000, med: 15000, max: 20000, tipo: 'Privata' },
    { uni: 'Campus Bio-Medico', citta: 'Roma', min: 6000, med: 10000, max: 15000, tipo: 'Privata' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1400, max: 2800, tipo: 'Pubblica' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1500, max: 3000, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1350, max: 2900, tipo: 'Pubblica' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1200, max: 2700, tipo: 'Pubblica' },
  ],
  Architettura: [
    { uni: 'Politecnico Milano', citta: 'Milano', min: 156, med: 1500, max: 3800, tipo: 'Pubblica' },
    { uni: 'IUAV', citta: 'Venezia', min: 156, med: 1300, max: 3200, tipo: 'Pubblica' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1100, max: 2500, tipo: 'Pubblica' },
    { uni: 'Politecnico Torino', citta: 'Torino', min: 156, med: 1200, max: 3000, tipo: 'Pubblica' },
    { uni: 'Federico II', citta: 'Napoli', min: 156, med: 900, max: 2200, tipo: 'Pubblica' },
  ],
  'Scienze Politiche': [
    { uni: 'LUISS', citta: 'Roma', min: 5500, med: 8000, max: 11000, tipo: 'Privata' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1000, max: 2400, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1150, max: 2700, tipo: 'Pubblica' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1100, max: 2600, tipo: 'Pubblica' },
    { uni: 'Torino', citta: 'Torino', min: 156, med: 950, max: 2400, tipo: 'Pubblica' },
  ],
  'Lettere e Filosofia': [
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1000, max: 2300, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1100, max: 2600, tipo: 'Pubblica' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1050, max: 2500, tipo: 'Pubblica' },
    { uni: 'Cattolica', citta: 'Milano', min: 3500, med: 5500, max: 8000, tipo: 'Privata' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1000, max: 2400, tipo: 'Pubblica' },
  ],
  Psicologia: [
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1100, max: 2500, tipo: 'Pubblica' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1050, max: 2500, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1150, max: 2700, tipo: 'Pubblica' },
    { uni: 'Cattolica', citta: 'Milano', min: 3500, med: 5800, max: 8200, tipo: 'Privata' },
    { uni: 'Bicocca', citta: 'Milano', min: 156, med: 1200, max: 2800, tipo: 'Pubblica' },
  ],
  Informatica: [
    { uni: 'Politecnico Milano', citta: 'Milano', min: 156, med: 1500, max: 3800, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1250, max: 2900, tipo: 'Pubblica' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1100, max: 2600, tipo: 'Pubblica' },
    { uni: 'Trento', citta: 'Trento', min: 156, med: 1100, max: 2700, tipo: 'Pubblica' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1050, max: 2600, tipo: 'Pubblica' },
  ],
  'Scienze della Comunicazione': [
    { uni: 'IULM', citta: 'Milano', min: 4500, med: 6500, max: 9000, tipo: 'Privata' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1000, max: 2400, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1100, max: 2600, tipo: 'Pubblica' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1050, max: 2500, tipo: 'Pubblica' },
    { uni: 'Torino', citta: 'Torino', min: 156, med: 950, max: 2300, tipo: 'Pubblica' },
  ],
};

export const TOPICS = {
  energia: {
    icon: '⚡', title: 'Energia Elettrica', color: '#F59E0B',
    capire: { title: "Capire il mercato dell'energia", content: [ { subtitle: 'Come si forma il prezzo', text: "Il prezzo dell'energia elettrica in Italia è determinato dal PUN (Prezzo Unico Nazionale), il prezzo all'ingrosso stabilito ogni giorno sulla Borsa Elettrica (IPEX)." }, { subtitle: "Dal mercato all'ingrosso alla tua bolletta", text: 'Il fornitore acquista energia al PUN e la rivende aggiungendo uno spread.' } ] },
    guida: { title: 'Come scegliere il contratto energia', steps: [ { n: '1', title: 'Trova la tua bolletta attuale', text: "Recupera l'ultima bolletta e individua il tuo consumo annuo." } ] }
  },
  gas: {
    icon: '🔥', title: 'Gas Naturale', color: '#EF4444',
    capire: { title: 'Capire il mercato del gas', content: [ { subtitle: 'Il prezzo del gas in Italia', text: "Il prezzo è agganciato al PSV (Punto di Scambio Virtuale), influenzato dal TTF olandese." } ] },
    guida: { title: 'Come scegliere il contratto gas', steps: [ { n: '1', title: 'Analizza il tuo consumo', text: 'Il consumo si misura in Smc. Trova il dato sulla bolletta.' } ] }
  },
  acqua: {
    icon: '💧', title: 'Acqua', color: '#3B82F6',
    capire: { title: 'Capire il servizio idrico', content: [ { subtitle: 'Un mercato NON liberalizzato', text: "Non puoi scegliere il fornitore. Le tariffe sono stabilite da ARERA." } ] },
    guida: { title: "Come ottimizzare i costi dell'acqua", steps: [ { n: '1', title: 'Controlla le fasce', text: 'Restare nella fascia agevolata fa risparmiare molto.' } ] }
  },
  internet: {
    icon: '📡', title: 'Internet & Telefonia', color: '#8B5CF6',
    capire: { title: 'Capire la connettività in Italia', content: [ { subtitle: 'FTTH, FTTC, FWA: cosa cambia', text: "FTTH è fibra fino a casa. FTTC è fibra fino all'armadio." } ] },
    guida: { title: 'Come scegliere il contratto internet', steps: [ { n: '1', title: 'Verifica la copertura', text: 'Controlla se il tuo indirizzo è raggiunto da FTTH.' } ] }
  },
};

export const CONTI_CORRENTI = [
  { id: "bbva", name: "BBVA Conto Online", tags: ["zero_spese", "remunerato_cashback"], canoneMensile: 0, rendimento: "3% lordo", vantaggioPrincipale: "Rendimento sul saldo senza vincoli", note: "Cashback 4% sui primi acquisti", link: "[LINK_BBVA]" },
  { id: "hype", name: "Hype Base", tags: ["zero_spese", "giovani"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Carta virtuale immediata", note: "Ottima per la gestione delle spese quotidiane", link: "[LINK_HYPE]" },
  { id: "fineco", name: "FinecoBank", tags: ["giovani", "business"], canoneMensile: 3.95, rendimento: "1,50%", vantaggioPrincipale: "Il miglior conto per chi vuole anche investire", note: "Gratis primi 12 mesi o under 30", link: "[LINK_FINECO]" },
  { id: "revolut", name: "Revolut Standard", tags: ["zero_spese", "giovani"], canoneMensile: 0, rendimento: "2,50%", vantaggioPrincipale: "Cambi valuta senza commissioni", note: "Prelievi gratuiti fino a 200€ al mese", link: "[LINK_REVOLUT]" },
  { id: "bper", name: "BPER Banca", tags: ["tradizionale"], canoneMensile: 0, rendimento: "3,30%", vantaggioPrincipale: "Conto vincolato a 6 mesi", note: "Canone zero con accredito stipendio", link: "[LINK_BPER]" },
  { id: "intesa_xme", name: "Intesa XME Under 35", tags: ["giovani"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Azzeramento canone e imposta di bollo", note: "Solo per under 35, poi 8.50€/mese", link: "[LINK_INTESA]" },
  { id: "unicredit", name: "UniCredit MyGenius Green", tags: ["tradizionale"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Operatività online gratuita", note: "Bonifici SEPA gratuiti online", link: "[LINK_UNICREDIT]" }
];

export const FUEL_PRICES = {
  benzina: { price: 1.85, label: "Benzina", unit: "€/l", icon: "⛽", color: "#f59e0b", defaultCons: 14 },
  diesel: { price: 1.74, label: "Diesel", unit: "€/l", icon: "🛢️", color: "#3b82f6", defaultCons: 18 },
  gpl: { price: 0.71, label: "GPL", unit: "€/l", icon: "🍃", color: "#10b981", defaultCons: 10 },
  elettrico: { price: 0.25, label: "Elettrico (Ricarica Domestica)", unit: "€/kWh", icon: "⚡", color: "#8b5cf6", defaultCons: 16 }
};
