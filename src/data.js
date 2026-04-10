// ═══════════════════════════════════════════════════════════════════
// DATA - SoldiBuoni.it (FULL RESTORE + SEO TOPICS - April 2026)
// ═══════════════════════════════════════════════════════════════════

export let ENERGY_PROVIDERS = [
  { name: 'Illumia', tipo: 'Fisso 12m', prezzo: 0.119, fisso: 8, verde: false, note: 'Energia Lunga Easy — miglior fisso sul mercato', link: 'https://www.illumia.it/offerte/' },
  { name: 'Wekiwi', tipo: 'Fisso 12m', prezzo: 0.128, fisso: 5, verde: true, note: 'App-based, sconto digitale, 100% green', link: 'https://www.wekiwi.it/offerta-luce-e-gas/' },
  { name: 'Enel Energia', tipo: 'Fisso 12m', prezzo: 0.138, fisso: 12, verde: true, note: 'Fix Web Luce — prezzo bloccato 12 mesi', link: 'https://www.enel.it/it/luce-gas/luce' },
  { name: 'Edison', tipo: 'Fisso 12m', prezzo: 0.135, fisso: 12, verde: false, note: 'World Luce — bloccato 12 mesi con bonus', link: 'https://www.edison.it/offerte-luce-e-gas' },
  { name: 'Sorgenia', tipo: 'Variabile', prezzo: 0.145, fisso: 0, verde: true, note: 'Next Energy — PUN + 0.019, zero costi fissi', link: 'https://www.sorgenia.it/offerte-luce-e-gas' },
  { name: 'A2A Energia', tipo: 'Variabile', prezzo: 0.142, fisso: 8, verde: true, note: 'Smart Casa — PUN + spread, 100% rinnovabile', link: 'https://www.a2aenergia.eu/offerte-luce-gas' },
  { name: 'Hera Comm', tipo: 'Variabile', prezzo: 0.148, fisso: 9, verde: false, note: 'PUN + spread 0.022 €/kWh', link: 'https://www.heracomm.it/casa/offerte' },
  { name: 'Eni Plenitude', tipo: 'Fisso 12m', prezzo: 0.196, fisso: 12, verde: true, note: 'Fixa Time Smart — bloccato 12 mesi, 100% green', link: 'https://eniplenitude.com/offerte/luce-e-gas' },
];

export let GAS_PROVIDERS = [
  { name: 'Enel Energia', tipo: 'Fisso 12m', prezzo: 0.42, fisso: 12, note: 'Fix Web Gas — prezzo bloccato 12 mesi', link: 'https://www.enel.it/it/luce-gas/gas' },
  { name: 'Edison', tipo: 'Variabile', prezzo: 0.45, fisso: 12, note: 'PSV + spread 0.035 €/Smc', link: 'https://www.edison.it/offerte-luce-e-gas' },
  { name: 'Illumia', tipo: 'Variabile', prezzo: 0.48, fisso: 7, note: 'PSV + spread 0.04 €/Smc', link: 'https://www.illumia.it/offerte/' },
  { name: 'Sorgenia', tipo: 'Variabile', prezzo: 0.52, fisso: 0, note: 'PSV + spread, zero costi fissi mensili', link: 'https://www.sorgenia.it/offerte-luce-e-gas' },
  { name: 'Hera Comm', tipo: 'Variabile', prezzo: 0.50, fisso: 9, note: 'PSV + spread 0.04 €/Smc', link: 'https://www.heracomm.it/casa/offerte' },
  { name: 'A2A Energia', tipo: 'Variabile', prezzo: 0.55, fisso: 8, note: 'Smart Casa Gas — PUN + spread', link: 'https://www.a2aenergia.eu/offerte-luce-gas' },
  { name: 'Eni Plenitude', tipo: 'Fisso 12m', prezzo: 0.60, fisso: 12, note: 'Fixa Time Smart Gas — bloccato 12 mesi', link: 'https://eniplenitude.com/offerte/luce-e-gas' },
];

export const INSURANCE_DATA = [
  { name: 'UnipolSai', rc: 380, furto: 120, kasko: 450, cristalli: 45, assistenza: 35, note: 'Leader mercato italiano', link: 'https://www.unipolsai.it/assicurazione-auto' },
  { name: 'Generali', rc: 420, furto: 140, kasko: 520, cristalli: 50, assistenza: 40, note: 'Capillarità agenzie', link: 'https://www.generali.it/prodotti/auto-e-moto' },
  { name: 'Allianz Direct', rc: 310, furto: 95, kasko: 380, cristalli: 35, assistenza: 25, note: 'Solo online, prezzi competitivi', link: 'https://www.allianzdirect.it/assicurazione-auto/' },
  { name: 'Zurich Connect', rc: 325, furto: 100, kasko: 400, cristalli: 38, assistenza: 28, note: 'Polizza digitale flessibile', link: 'https://www.zurichconnect.it/preventivo-auto' },
  { name: 'ConTe.it', rc: 295, furto: 90, kasko: 360, cristalli: 32, assistenza: 22, note: 'Miglior prezzo online', link: 'https://www.conte.it/assicurazione-auto/' },
  { name: 'Prima Assicurazioni', rc: 305, furto: 88, kasko: 370, cristalli: 30, assistenza: 20, note: 'Startup insurtech italiana', link: 'https://prima.it/assicurazione-auto' },
  { name: 'Verti', rc: 330, furto: 110, kasko: 410, cristalli: 40, assistenza: 30, note: 'Ex Direct Line', link: 'https://www.verti.it/assicurazione-auto/' },
];

export const HEALTH_INSURANCE = [
  { name: 'UniSalute', base: 45, standard: 95, premium: 180, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'N.1 in Italia per sanità integrativa', link: 'https://www.unisalute.it/prodotti-assicurativi' },
  { name: 'Allianz', base: 60, standard: 120, premium: 230, dentale: true, oculistica: false, specialistica: true, ricovero: true, note: 'Solidità internazionale', link: 'https://www.allianz.it/prodotti/salute.html' },
  { name: 'Generali', base: 55, standard: 110, premium: 210, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Ampia rete convenzionata', link: 'https://www.generali.it/prodotti/salute' },
  { name: 'AXA', base: 52, standard: 105, premium: 200, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Soluzione Salute flessibile', link: 'https://www.axa.it/assicurazione-salute' },
  { name: 'MetLife', base: 35, standard: 75, premium: 150, dentale: false, oculistica: true, specialistica: true, ricovero: true, note: 'Prezzi entry-level competitivi', link: 'https://www.metlife.it/prodotti/protezione-salute/' },
  { name: 'Reale Mutua', base: 50, standard: 100, premium: 195, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Forte su ricoveri e chirurgia', link: 'https://www.realemutua.it/prodotti/salute' },
];

export let INTERNET_PROVIDERS = [
  { name: 'Iliad Fibra', tipo: 'FTTH', prezzo: 19.99, velocita: '5 Gbps', vincolo: 'No', note: 'Prezzo per sempre, no sorprese', link: 'https://www.iliad.it/offerte-fibra.html' },
  { name: 'Fastweb Casa Light', tipo: 'FTTH', prezzo: 27.95, velocita: '2.5 Gbps', vincolo: 'No', note: 'Modem incluso, WiFi 6', link: 'https://www.fastweb.it/adsl-fibra-ottica/' },
  { name: 'TIM WiFi Power', tipo: 'FTTH', prezzo: 29.9, velocita: '2.5 Gbps', vincolo: '24 mesi', note: 'Modem TIM Hub+, assistenza dedicata', link: 'https://www.tim.it/fisso-e-mobile/fibra' },
  { name: 'Vodafone Internet Unlimited', tipo: 'FTTH', prezzo: 27.9, velocita: '2.5 Gbps', vincolo: '24 mesi', note: 'Vodafone Station inclusa', link: 'https://www.vodafone.it/eshop/internet/offerte-internet-casa.html' },
  { name: 'WindTre Super Fibra', tipo: 'FTTH', prezzo: 26.99, velocita: '2.5 Gbps', vincolo: '24 mesi', note: 'Modem incluso, 12 mesi Amazon Prime', link: 'https://www.windtre.it/offerte-fibra/' },
  { name: 'Sky WiFi', tipo: 'FTTH', prezzo: 29.9, velocita: '1 Gbps', vincolo: '18 mesi', note: 'Sky WiFi Hub, ottimizzazione AI', link: 'https://www.sky.it/offerte/sky-wifi' },
  { name: 'Tiscali UltraFibra', tipo: 'FTTH', prezzo: 22.9, velocita: '2.5 Gbps', vincolo: 'No', note: 'Attivazione gratuita online', link: 'https://casa.tiscali.it/' },
];

export const PENSION_FUNDS = [
  { name: 'Cometa', tipo: 'Negoziale', costo: 0.15, rendimento5y: 4.2, rendimento10y: 5.1, settore: 'Metalmeccanici', note: 'Più grande fondo negoziale italiano', link: 'https://www.cometafondo.it/' },
  { name: 'Fonte', tipo: 'Negoziale', costo: 0.18, rendimento5y: 3.8, rendimento10y: 4.7, settore: 'Commercio/Turismo', note: 'Per dipendenti del terziario', link: 'https://www.fondofonte.it/' },
  { name: 'Fon.Te', tipo: 'Negoziale', costo: 0.2, rendimento5y: 3.9, rendimento10y: 4.5, settore: 'Vari CCNL', note: 'Multi-comparto flessibile', link: 'https://www.fondofonte.it/' },
  { name: 'Amundi SecondaPensione', tipo: 'Aperto', costo: 1.2, rendimento5y: 5.1, rendimento10y: 5.8, settore: 'Tutti', note: 'Ampia scelta comparti', link: 'https://www.amundi.it/privati/prodotti/previdenza-complementare' },
  { name: 'Allianz Insieme', tipo: 'Aperto', costo: 1.35, rendimento5y: 4.8, rendimento10y: 5.5, settore: 'Tutti', note: 'Buona performance storica', link: 'https://www.allianz.it/prodotti/previdenza.html' },
  { name: 'Arca Previdenza', tipo: 'Aperto', costo: 1.1, rendimento5y: 4.5, rendimento10y: 5.2, settore: 'Tutti', note: 'Costi contenuti per fondo aperto', link: 'https://www.arcaprevidenza.it/' },
  { name: 'Generali Global', tipo: 'PIP', costo: 2.1, rendimento5y: 3.2, rendimento10y: 3.9, settore: 'Tutti', note: 'Piano Individuale Pensionistico', link: 'https://www.generali.it/prodotti/previdenza' },
];

export const UNI_FACOLTA = [
  'Economia', 'Giurisprudenza', 'Ingegneria', 'Medicina', 'Architettura',
  'Scienze Politiche', 'Lettere e Filosofia', 'Psicologia', 'Informatica', 'Scienze della Comunicazione',
];

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
    capire: {
      title: "Capire il mercato dell'energia",
      content: [
        { subtitle: 'Come si forma il prezzo', text: "Il prezzo dell'energia elettrica in Italia è determinato dal PUN (Prezzo Unico Nazionale), il prezzo all'ingrosso stabilito ogni giorno sulla Borsa Elettrica (IPEX)." },
        { subtitle: 'Situazione attuale (2025-2026)', text: 'Dopo la crisi del 2022, i prezzi si sono stabilizzati. Il PUN medio nel 2025 si è aggirato intorno a 60-80 €/MWh.' },
      ],
    },
    guida: {
      title: 'Come scegliere il contratto energia',
      steps: [
        { n: '1', title: 'Trova la tua bolletta attuale', text: "Recupera l'ultima bolletta e individua: consumo annuo in kWh, prezzo €/kWh della componente energia, costo fisso mensile." },
        { n: '5', title: 'Attiva online e monitora', text: "L'attivazione online è più economica. Segna di ricontrollare il prezzo tra 10-11 mesi." },
      ],
    },
  },
  gas: {
    icon: '🔥', title: 'Gas Naturale', color: '#EF4444',
    capire: {
      title: 'Capire il mercato del gas',
      content: [
        { subtitle: 'Il prezzo del gas in Italia', text: "Il prezzo è agganciato al PSV (Punto di Scambio Virtuale), influenzato dal TTF olandese." },
      ],
    },
    guida: {
      title: 'Come scegliere il contratto gas',
      steps: [
        { n: '1', title: 'Analizza il tuo consumo', text: 'Il consumo si misura in Smc. Famiglia media: 800-1200 Smc/anno.' },
      ],
    },
  },
  internet: { icon: '📡', title: 'Internet & Telefonia', color: '#8B5CF6' },
  mutuo: { icon: '🏠', title: 'Mutuo & Affitto', color: '#10B981' },
  rc_auto: { icon: '🚗', title: 'RC Auto & Assicurazioni', color: '#EC4899' },
  bollo_revisione: { icon: '🔧', title: 'Bollo, Revisione & Manutenzione', color: '#F97316' },
  istruzione: { icon: '🎓', title: 'Istruzione Universitaria', color: '#6366F1' },
  tfr_pensione: { icon: '📊', title: 'TFR & Pensione Integrativa', color: '#14B8A6' },
  salute: { icon: '🏥', title: 'Assicurazione Sanitaria', color: '#DC2626' },
  carburante: { icon: '⛽', title: 'Carburante', color: '#84CC16' },
};

export const CONTI_CORRENTI = [
  { id: "bbva", name: "BBVA Conto Online", tags: ["zero_spese"], canoneMensile: 0, rendimento: "3% annuo", vantaggioPrincipale: "Cashback 4%", note: "No costi nascosti", link: "https://www.bbva.it/persone/prodotti/conti/conto-online.html" },
  { id: "hype", name: "Hype Base", tags: ["zero_spese"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Carta virtuale", note: "Under 30", link: "https://www.hype.it/conti" },
  { id: "fineco", name: "FinecoBank", tags: ["business"], canoneMensile: 3.95, rendimento: "1,50%", vantaggioPrincipale: "Trading", note: "Gratis Under 30", link: "https://finecobank.com/it/online/conto-e-carte/" },
  { id: "revolut", name: "Revolut", tags: ["zero_spese"], canoneMensile: 0, rendimento: "2,50%", vantaggioPrincipale: "Cambio valuta", note: "Per viaggiatori", link: "https://www.revolut.com/it-IT/" },
  { id: "bper", name: "BPER Banca", tags: ["tradizionale"], canoneMensile: 0, rendimento: "3,30%", vantaggioPrincipale: "Conto vincolato", note: "Canone zero", link: "https://www.bper.it/conti-correnti" },
  { id: "intesa_xme", name: "Intesa XME", tags: ["giovani"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Under 35", note: "Esenzione bollo", link: "https://www.intesasanpaolo.com/it/persone-e-famiglie/prodotti/conti-correnti.html" },
  { id: "unicredit", name: "UniCredit", tags: ["tradizionale"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Online gratis", note: "Bonifici SEPA", link: "https://www.unicredit.it/it/privati/conti-correnti.html" }
];

export const FUEL_PRICES = {
  benzina: { price: 1.85, label: "Benzina", unit: "€/l", icon: "⛽", color: "#f59e0b", defaultCons: 14 },
  diesel: { price: 1.74, label: "Diesel", unit: "€/l", icon: "🛢️", color: "#3b82f6", defaultCons: 18 },
  gpl: { price: 0.71, label: "GPL", unit: "€/l", icon: "🍃", color: "#10b981", defaultCons: 10 },
  elettrico: { price: 0.25, label: "Elettrico (Ricarica Domestica)", unit: "€/kWh", icon: "⚡", color: "#8b5cf6", defaultCons: 16 }
};