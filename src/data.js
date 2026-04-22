// ═══════════════════════════════════════════════════════════════════
// DATA - SoldiBuoni.it (FULL RESTORE + SEO TOPICS + LINKS)
// ═══════════════════════════════════════════════════════════════════

export const INDICI_MERCATO = {
  PUN: 0.115, // Media stimata recente (€/kWh)
  PSV: 0.380, // Media stimata recente (€/Smc)
  ultimoAggiornamento: 'Aprile 2026'
};

export let ENERGY_PROVIDERS = [
  { name: 'Illumia Energia Lunga', tipo: 'Fisso 36 mesi', prezzo: 0.125, fisso: 5.50, verde: false, note: 'F0 monorario — penale recesso anticipato', link: 'https://www.illumia.it/casa/luce/energia-lunga-luce/' },
  { name: 'Illumia SicurInsieme Luce', tipo: 'Variabile (PUN+0,01)', indice: 'PUN', spread: 0.01, prezzo: 0, fisso: 7, verde: false, note: 'PUN + spread — nessuna penale di recesso', link: 'https://www.illumia.it/casa/luce/luce-flex/' },
  { name: 'Sorgenia Next Energy Sunlight', tipo: 'Variabile (PUN+0,006)', indice: 'PUN', spread: 0.006, prezzo: 0, fisso: 6.18, verde: true, note: 'Sconto benvenuto 15€ — prezzo indicizzato', link: 'https://www.sorgenia.it/offerte-luce-casa' },
  { name: 'Sorgenia Next Energy Smart', tipo: 'Fisso 12 mesi', prezzo: 0.159, fisso: 10, verde: true, note: 'Sconto benvenuto 15€ — prezzo bloccato 12 mesi', link: 'https://www.sorgenia.it/offerte-luce-casa' },
  { name: 'Enel Fix Web Luce', tipo: 'Fisso 24 mesi', prezzo: 0.135, fisso: 12, verde: true, note: 'Bonus 60€ in bolletta — solo online, bloccato 24 mesi', link: 'https://www.enel.it/it-it/offerte-luce' },
  { name: 'Enel Flex', tipo: 'Variabile (PUN+0,022)', indice: 'PUN', spread: 0.022, prezzo: 0, fisso: 15, verde: false, note: 'PUN+0,022 — spread fisso', link: 'https://www.enel.it/it-it/offerte-luce' },
  { name: 'A2A Start Luce', tipo: 'Fisso 24 mesi', prezzo: 0.144, fisso: 9.50, verde: true, note: '100% green — bloccato 24 mesi, nessuna penale', link: 'https://www.a2a.it/casa/a2a-start' },
  { name: 'A2A Smart Casa', tipo: 'Variabile (PUN+0,025)', indice: 'PUN', spread: 0.025, prezzo: 0, fisso: 9.50, verde: true, note: 'PUN+0,025 — 100% green, nessuna penale', link: 'https://www.a2a.it/casa/smart-casa' },
  { name: 'Hera PiùControllo Special Flat', tipo: 'Fisso 12 mesi', prezzo: 0.150, fisso: 12.10, verde: false, note: 'Bonus digital 30€ — fatturazione mensile', link: 'https://heracomm.gruppohera.it/casa/offerte-luce-gas/piu-controllo-special-flat' },
  { name: 'Eni Plenitude', tipo: 'Fisso 12 mesi', prezzo: 0.1881, fisso: 7.50, verde: true, note: 'Fixa Time Smart — sconto 108€ dual, Polizza Zurich omaggio', link: 'https://eniplenitude.com/offerte/luce-e-gas' }
];

export let GAS_PROVIDERS = [
  { name: 'Enel Fix Web Gas', tipo: 'Fisso 24 mesi', prezzo: 0.420, fisso: 12, note: '-30% vs listino — solo online, bloccato 24 mesi', link: 'https://www.enel.it/it-it/offerte-gas' },
  { name: 'Illumia SicurInsieme Gas', tipo: 'Variabile (PSV+0,05)', indice: 'PSV', spread: 0.05, prezzo: 0, fisso: 7, note: 'PSV + 0,05 €/Smc — nessuna penale di recesso', link: 'https://www.illumia.it/casa/gas/gas-flex/' },
  { name: 'A2A Start Gas', tipo: 'Fisso 24 mesi', prezzo: 0.540, fisso: 9.50, note: 'Bloccato 24 mesi — nessuna penale di recesso', link: 'https://www.a2a.it/casa/a2a-start' },
  { name: 'A2A Smart Casa Gas', tipo: 'Variabile (PSV+0,12)', indice: 'PSV', spread: 0.12, prezzo: 0, fisso: 9.50, note: 'PSV + 0,12 €/Smc — nessuna penale', link: 'https://www.a2a.it/casa/smart-casa' },
  { name: 'Enel Flex Gas', tipo: 'Variabile (PSV+0,11)', indice: 'PSV', spread: 0.11, prezzo: 0, fisso: 15, note: 'PSV+0,11 — spread fisso', link: 'https://www.enel.it/it-it/offerte-gas' },
  { name: 'Sorgenia Next Energy Sunlight Gas', tipo: 'Variabile (PSV+0,15)', indice: 'PSV', spread: 0.15, prezzo: 0, fisso: 9.50, note: 'Sconto benvenuto 15€ — prezzo indicizzato', link: 'https://www.sorgenia.it/offerte-gas-casa' },
  { name: 'Illumia Energia Lunga Gas', tipo: 'Fisso 36 mesi', prezzo: 0.590, fisso: 6, note: 'Bloccato 36 mesi — penale recesso', link: 'https://www.illumia.it/casa/gas/energia-lunga-gas/' },
  { name: 'Hera PiùControllo Special Flat Gas', tipo: 'Fisso 12 mesi', prezzo: 0.599, fisso: 12, note: 'Bonus digital 30€ — fatturazione mensile', link: 'https://heracomm.gruppohera.it/casa/offerte-luce-gas/piu-controllo-special-flat' },
  { name: 'Sorgenia Next Energy Smart Gas', tipo: 'Fisso 12 mesi', prezzo: 0.580, fisso: 12, note: 'Sconto benvenuto 15€ — prezzo bloccato 12 mesi', link: 'https://www.sorgenia.it/offerte-gas-casa' },
  { name: 'Eni Plenitude', tipo: 'Fisso 12 mesi', prezzo: 0.7050, fisso: 7.50, note: 'Fixa Time Smart Gas — sconto 108€ dual, Polizza Zurich omaggio', link: 'https://eniplenitude.com/offerte/luce-e-gas' }
];

// AUTOCALCOLO TARIFFE VARIABILI BASATO SU PUN/PSV
ENERGY_PROVIDERS.forEach(p => {
  if (p.indice === 'PUN') p.prezzo = INDICI_MERCATO.PUN + p.spread;
});
GAS_PROVIDERS.forEach(p => {
  if (p.indice === 'PSV') p.prezzo = INDICI_MERCATO.PSV + p.spread;
});

export const INSURANCE_DATA = [
  { name: 'UnipolSai', rc: 380, furto: 120, kasko: 450, cristalli: 45, assistenza: 35, note: 'Leader mercato italiano', link: 'https://www.unipolsai.it/assicurazione-auto' },
  { name: 'Generali', rc: 420, furto: 140, kasko: 520, cristalli: 50, assistenza: 40, note: 'Capillarità agenzie', link: 'https://www.generali.it/prodotti/auto-e-moto' },
  { name: 'Allianz Direct', rc: 310, furto: 95, kasko: 380, cristalli: 35, assistenza: 25, note: 'Solo online, prezzi competitivi', link: 'https://www.allianzdirect.it/assicurazione-auto/' },
  { name: 'Zurich Connect', rc: 325, furto: 100, kasko: 400, cristalli: 38, assistenza: 28, note: 'Polizza digitale flessibile', link: 'https://www.zurichconnect.it/preventivo-auto' },
  { name: 'ConTe.it', rc: 295, furto: 90, kasko: 360, cristalli: 32, assistenza: 22, note: 'Miglior prezzo online', link: 'https://www.conte.it/assicurazione-auto/' },
  { name: 'Prima Assicurazioni', rc: 305, furto: 88, kasko: 370, cristalli: 30, assistenza: 20, note: 'Startup insurtech italiana', link: 'https://prima.it/assicurazione-auto' },
  { name: 'Verti', rc: 330, furto: 110, kasko: 410, cristalli: 40, assistenza: 30, note: 'Ex Direct Line', link: 'https://www.verti.it/assicurazione-auto/' }
];

export const HEALTH_INSURANCE = [
  { name: 'UniSalute', base: 45, standard: 95, premium: 180, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'N.1 in Italia per sanità integrativa', link: 'https://www.unisalute.it/prodotti-assicurativi' },
  { name: 'Allianz', base: 60, standard: 120, premium: 230, dentale: true, oculistica: false, specialistica: true, ricovero: true, note: 'Solidità internazionale', link: 'https://www.allianz.it/prodotti/salute.html' },
  { name: 'Generali', base: 55, standard: 110, premium: 210, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Ampia rete convenzionata', link: 'https://www.generali.it/prodotti/salute' },
  { name: 'AXA', base: 52, standard: 105, premium: 200, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Soluzione Salute flessibile', link: 'https://www.axa.it/assicurazione-salute' },
  { name: 'MetLife', base: 35, standard: 75, premium: 150, dentale: false, oculistica: true, specialistica: true, ricovero: true, note: 'Prezzi entry-level competitivi', link: 'https://www.metlife.it/prodotti/protezione-salute/' },
  { name: 'Reale Mutua', base: 50, standard: 100, premium: 195, dentale: true, oculistica: true, specialistica: true, ricovero: true, note: 'Forte su ricoveri e chirurgia', link: 'https://www.realemutua.it/prodotti/salute' }
];

export let INTERNET_PROVIDERS = [
  { name: 'Iliad Fibra', tipo: 'FTTH', prezzo: 19.99, velocita: '5 Gbps', vincolo: 'No', note: 'Prezzo per sempre, no sorprese', link: 'https://www.iliad.it/offerte-fibra.html' },
  { name: 'Fastweb Casa Light', tipo: 'FTTH', prezzo: 27.95, velocita: '2.5 Gbps', vincolo: 'No', note: 'Modem incluso, WiFi 6', link: 'https://www.fastweb.it/adsl-fibra-ottica/' },
  { name: 'TIM WiFi Power', tipo: 'FTTH', prezzo: 29.9, velocita: '2.5 Gbps', vincolo: '24 mesi', note: 'Modem TIM Hub+, assistenza dedicata', link: 'https://www.tim.it/fisso-e-mobile/fibra' },
  { name: 'Vodafone Internet Unlimited', tipo: 'FTTH', prezzo: 27.9, velocita: '2.5 Gbps', vincolo: '24 mesi', note: 'Vodafone Station inclusa', link: 'https://www.vodafone.it/eshop/internet/offerte-internet-casa.html' },
  { name: 'WindTre Super Fibra', tipo: 'FTTH', prezzo: 26.99, velocita: '2.5 Gbps', vincolo: '24 mesi', note: 'Modem incluso, 12 mesi Amazon Prime', link: 'https://www.windtre.it/offerte-fibra/' },
  { name: 'Sky WiFi', tipo: 'FTTH', prezzo: 29.9, velocita: '1 Gbps', vincolo: '18 mesi', note: 'Sky WiFi Hub, ottimizzazione AI', link: 'https://www.sky.it/offerte/sky-wifi' },
  { name: 'Tiscali UltraFibra', tipo: 'FTTH', prezzo: 22.9, velocita: '2.5 Gbps', vincolo: 'No', note: 'Attivazione gratuita online', link: 'https://casa.tiscali.it/' }
];

export const PENSION_FUNDS = [
  { name: 'Cometa', tipo: 'Negoziale', costo: 0.15, rendimento5y: 4.2, rendimento10y: 5.1, settore: 'Metalmeccanici', note: 'Più grande fondo negoziale italiano', link: 'https://www.cometafondo.it/' },
  { name: 'Fonte', tipo: 'Negoziale', costo: 0.18, rendimento5y: 3.8, rendimento10y: 4.7, settore: 'Commercio/Turismo', note: 'Per dipendenti del terziario', link: 'https://www.fondofonte.it/' },
  { name: 'Fon.Te', tipo: 'Negoziale', costo: 0.2, rendimento5y: 3.9, rendimento10y: 4.5, settore: 'Vari CCNL', note: 'Multi-comparto flessibile', link: 'https://www.fondofonte.it/' },
  { name: 'Amundi SecondaPensione', tipo: 'Aperto', costo: 1.2, rendimento5y: 5.1, rendimento10y: 5.8, settore: 'Tutti', note: 'Ampia scelta comparti', link: 'https://www.amundi.it/privati/prodotti/previdenza-complementare' },
  { name: 'Allianz Insieme', tipo: 'Aperto', costo: 1.35, rendimento5y: 4.8, rendimento10y: 5.5, settore: 'Tutti', note: 'Buona performance storica', link: 'https://www.allianz.it/prodotti/previdenza.html' },
  { name: 'Arca Previdenza', tipo: 'Aperto', costo: 1.1, rendimento5y: 4.5, rendimento10y: 5.2, settore: 'Tutti', note: 'Costi contenuti per fondo aperto', link: 'https://www.arcaprevidenza.it/' },
  { name: 'Generali Global', tipo: 'PIP', costo: 2.1, rendimento5y: 3.2, rendimento10y: 3.9, settore: 'Tutti', note: 'Piano Individuale Pensionistico', link: 'https://www.generali.it/prodotti/previdenza' }
];

export const UNI_FACOLTA = [
  'Economia', 'Giurisprudenza', 'Ingegneria', 'Medicina', 'Architettura',
  'Scienze Politiche', 'Lettere e Filosofia', 'Psicologia', 'Informatica', 'Scienze della Comunicazione'
];

export const UNI_DATA = {
  Economia: [
    { uni: 'Bocconi', citta: 'Milano', min: 3400, med: 10000, max: 16700, tipo: 'Privata', indicator: 'ISU' },
    { uni: 'LUISS', citta: 'Roma', min: 14000, med: 14000, max: 14000, tipo: 'Privata', retta_fissa: true },
    { uni: 'Cattolica', citta: 'Milano', min: 3200, med: 6500, max: 10400, tipo: 'Privata' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1500, max: 3200, tipo: 'Pubblica' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1400, max: 2977, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1600, max: 3100, tipo: 'Pubblica' },
    { uni: 'Torino', citta: 'Torino', min: 156, med: 1400, max: 2800, tipo: 'Pubblica' }
  ],
  Giurisprudenza: [
    { uni: 'LUISS', citta: 'Roma', min: 13200, med: 13200, max: 13200, tipo: 'Privata', retta_fissa: true },
    { uni: 'Bocconi', citta: 'Milano', min: 3400, med: 10000, max: 16700, tipo: 'Privata', indicator: 'ISU' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1400, max: 2977, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1500, max: 3100, tipo: 'Pubblica' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1500, max: 3200, tipo: 'Pubblica' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1400, max: 2900, tipo: 'Pubblica' }
  ],
  Ingegneria: [
    { uni: 'Politecnico Milano', citta: 'Milano', min: 156, med: 1800, max: 3891, tipo: 'Pubblica' },
    { uni: 'Politecnico Torino', citta: 'Torino', min: 161, med: 1500, max: 3100, tipo: 'Pubblica' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1500, max: 3080, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1600, max: 3300, tipo: 'Pubblica' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1500, max: 3100, tipo: 'Pubblica' },
    { uni: 'Federico II', citta: 'Napoli', min: 156, med: 1100, max: 2800, tipo: 'Pubblica' }
  ],
  Medicina: [
    { uni: 'San Raffaele', citta: 'Milano', min: 20190, med: 20190, max: 20190, tipo: 'Privata', retta_fissa: true },
    { uni: 'Humanitas', citta: 'Milano', min: 10206, med: 16500, max: 23206, tipo: 'Privata', indicator: 'ISEP' },
    { uni: 'Campus Bio-Medico', citta: 'Roma', min: 15500, med: 15500, max: 15500, tipo: 'Privata', retta_fissa: true },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1500, max: 3080, tipo: 'Pubblica' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1600, max: 3300, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1600, max: 3300, tipo: 'Pubblica' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1500, max: 3100, tipo: 'Pubblica' }
  ],
  Architettura: [
    { uni: 'Politecnico Milano', citta: 'Milano', min: 156, med: 1800, max: 3891, tipo: 'Pubblica' },
    { uni: 'IUAV', citta: 'Venezia', min: 156, med: 1500, max: 3200, tipo: 'Pubblica' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1400, max: 3080, tipo: 'Pubblica' },
    { uni: 'Politecnico Torino', citta: 'Torino', min: 161, med: 1400, max: 3100, tipo: 'Pubblica' },
    { uni: 'Federico II', citta: 'Napoli', min: 156, med: 1100, max: 2600, tipo: 'Pubblica' }
  ],
  'Scienze Politiche': [
    { uni: 'LUISS', citta: 'Roma', min: 14000, med: 14000, max: 14000, tipo: 'Privata', retta_fissa: true },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1300, max: 2977, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1400, max: 3000, tipo: 'Pubblica' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1400, max: 3000, tipo: 'Pubblica' },
    { uni: 'Torino', citta: 'Torino', min: 156, med: 1300, max: 2700, tipo: 'Pubblica' }
  ],
  'Lettere e Filosofia': [
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1300, max: 2977, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1400, max: 2900, tipo: 'Pubblica' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1300, max: 2900, tipo: 'Pubblica' },
    { uni: 'Cattolica', citta: 'Milano', min: 3200, med: 6000, max: 9500, tipo: 'Privata' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1300, max: 2800, tipo: 'Pubblica' }
  ],
  Psicologia: [
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1400, max: 2977, tipo: 'Pubblica' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1400, max: 2900, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1500, max: 3000, tipo: 'Pubblica' },
    { uni: 'Cattolica', citta: 'Milano', min: 3200, med: 6200, max: 9800, tipo: 'Privata' },
    { uni: 'Bicocca', citta: 'Milano', min: 156, med: 1400, max: 2900, tipo: 'Pubblica' }
  ],
  Informatica: [
    { uni: 'Politecnico Milano', citta: 'Milano', min: 156, med: 1800, max: 3891, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1600, max: 3300, tipo: 'Pubblica' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1500, max: 3080, tipo: 'Pubblica' },
    { uni: 'Trento', citta: 'Trento', min: 156, med: 1400, max: 3000, tipo: 'Pubblica' },
    { uni: 'Padova', citta: 'Padova', min: 156, med: 1500, max: 3100, tipo: 'Pubblica' }
  ],
  'Scienze della Comunicazione': [
    { uni: 'IULM', citta: 'Milano', min: 3600, med: 6800, max: 9956, tipo: 'Privata' },
    { uni: 'La Sapienza', citta: 'Roma', min: 156, med: 1300, max: 2977, tipo: 'Pubblica' },
    { uni: 'Bologna', citta: 'Bologna', min: 156, med: 1400, max: 2900, tipo: 'Pubblica' },
    { uni: 'Statale Milano', citta: 'Milano', min: 156, med: 1300, max: 2900, tipo: 'Pubblica' },
    { uni: 'Torino', citta: 'Torino', min: 156, med: 1200, max: 2700, tipo: 'Pubblica' }
  ]
};

export const TOPICS = {
  energia: {
    icon: '⚡',
    title: 'Energia Elettrica',
    color: '#F59E0B',
    capire: {
      title: "Capire il mercato dell'energia",
      content: [
        { subtitle: "Come si forma il prezzo", text: "Il prezzo dell'energia elettrica in Italia è determinato dal PUN (Prezzo Unico Nazionale), il prezzo all'ingrosso stabilito ogni giorno sulla Borsa Elettrica (IPEX). Il PUN è influenzato dal costo del gas naturale, dalla domanda, dalla produzione rinnovabile e dalle interconnessioni con l'estero. Quando il gas costa di più, il PUN sale." },
        { subtitle: "Dal mercato all'ingrosso alla tua bolletta", text: "Il fornitore acquista energia al PUN e la rivende aggiungendo uno spread. La bolletta si compone di: materia prima energia (~40-50%), trasporto e gestione contatore (~20%), oneri di sistema (~15%) e imposte (~15-20%). Solo la componente materia prima varia tra fornitori. Confrontare il prezzo €/kWh della materia prima è la chiave." },
        { subtitle: "Mercato libero vs. Tutela e il segreto dell'STG", text: "Dal 2024 il Servizio di Maggior Tutela è abolito. Chi non ha scelto è finito nel Servizio a Tutele Graduali (STG). Attualmente le tariffe STG sono imbattibili (hanno costi fissi negativi, in pratica ti 'pagano' circa 73€/anno). Se sei in STG, non cambiare fino al 2027. Nel mercato libero puoi scegliere tra fisso (protegge dai rialzi) e variabile (più economico a lungo termine)." },
        { subtitle: "Situazione attuale (2025-2026)", text: "Dopo la crisi del 2022, i prezzi si sono stabilizzati. Il PUN medio nel 2025 si è aggirato intorno a 60-80 €/MWh. La crescita delle rinnovabili contribuisce a calmierare i prezzi. Tuttavia, tensioni geopolitiche e transizione energetica continuano a generare volatilità." }
      ]
    },
    guida: {
      title: "Come scegliere il contratto energia",
      steps: [
        { n: "1", title: "Trova i costi nascosti (PCV) in bolletta", text: "Recupera l'ultima bolletta e individua il consumo annuo in kWh e il costo materia prima (€/kWh). Fondamentale: cerca la voce PCV (Prezzo Commercializzazione Vendita). È il costo fisso mensile che i fornitori cercano di nascondere." },
        { n: "2", title: "Decidi fisso o variabile", text: "Prezzi bassi e prevedi rialzi → fisso. Prezzi alti o in discesa → variabile. In generale, il variabile conviene nel lungo periodo perché non incorpora il premio assicurativo del fisso." },
        { n: "3", title: "Confronta la materia prima", text: "Non guardare il prezzo finale stimato: confronta SOLO prezzo €/kWh + costo fisso mensile (PCV). Ignora bonus una tantum che mascherano costi reali." },
        { n: "4", title: "La trappola delle penali di recesso", text: "Da gennaio 2024, i fornitori possono applicare penali di recesso anticipato (anche 100-150€) sui contratti a prezzo fisso se cambi prima della scadenza. I contratti variabili, invece, restano liberi da penali per legge. Controlla il contratto." },
        { n: "5", title: "Attiva online e monitora", text: "L'attivazione online è più economica. Segna di ricontrollare il prezzo tra 10-11 mesi: valuta se restare o cambiare prima del rinnovo." }
      ]
    }
  },
  gas: {
    icon: '🔥',
    title: 'Gas Naturale',
    color: '#EF4444',
    capire: {
      title: "Capire il mercato del gas",
      content: [
        { subtitle: "Il prezzo del gas in Italia", text: "Il prezzo è agganciato al PSV (Punto di Scambio Virtuale), influenzato dal TTF olandese. Il gas arriva in Italia via gasdotto dall'Algeria, Azerbaijan, e come GNL via nave da USA e Qatar." },
        { subtitle: "L'impatto geopolitico", text: "La guerra in Ucraina ha rivoluzionato il mercato europeo. L'Italia importava ~40% del gas dalla Russia: oggi quasi azzerato, sostituito da GNL e nuovi gasdotti. Prezzi più alti e volatili, ma maggiore diversificazione." },
        { subtitle: "Come si compone la bolletta", text: "Materia prima (~45%), trasporto (~20%), oneri (~10%), imposte (~25%). Le imposte sul gas sono pesanti: IVA al 22% (10% sui primi 480 Smc) e accise. L'unica voce decisa dal fornitore è la materia prima e la quota fissa (QVD)." },
        { subtitle: "Contesto attuale", text: "Nel 2025-2026 i prezzi si sono assestati su ~35-45 €/MWh al PSV. Forte stagionalità: in inverno il prezzo sale. Il piano REPowerEU spinge verso pompe di calore ed efficientamento." }
      ]
    },
    guida: {
      title: "Come scegliere il contratto gas",
      steps: [
        { n: "1", title: "Cerca la QVD in bolletta", text: "Il consumo si misura in Smc (media: 800-1200 Smc/anno). Sulla bolletta, oltre al costo al metro cubo, cerca la QVD (Quota Vendita al Dettaglio): è il costo fisso mensile del fornitore. Questi due dati bastano per confrontare." },
        { n: "2", title: "Valuta la stagionalità", text: "Se attivi un contratto fisso in estate, potresti ottenere tariffe migliori. Il gas ha forte stagionalità e i fornitori propongono offerte più aggressive nei mesi caldi." },
        { n: "3", title: "Confronta il prezzo Smc", text: "Usa il comparatore per confrontare €/Smc e costo fisso mensile. Calcola: (consumo × prezzo/Smc) + (QVD × 12) = costo annuo reale." },
        { n: "4", title: "Attenzione alle offerte dual e alle penali", text: "Sconti per luce+gas sembrano comodi, ma spesso nascondono un rincaro su una componente. Inoltre, come per la luce, i nuovi contratti gas a prezzo fisso possono prevedere penali di recesso anticipato. Analizza sempre i singoli costi." },
        { n: "5", title: "Pensa al lungo termine", text: "Se ristrutturi, valuta una pompa di calore: elimina il gas dal riscaldamento. Investimento ripagato in 5-8 anni." }
      ]
    }
  },
  acqua: {
    icon: '💧',
    title: 'Acqua',
    color: '#3B82F6',
    capire: {
      title: "Capire il servizio idrico",
      content: [
        { subtitle: "Un mercato NON liberalizzato", text: "A differenza di luce e gas, il servizio idrico NON è liberalizzato. Non puoi scegliere il fornitore. Le tariffe sono stabilite da ARERA e variano significativamente tra zone d'Italia." },
        { subtitle: "Come si compone la bolletta", text: "Quota fissa + quota variabile (proporzionale ai mc, con fasce crescenti) + fognatura e depurazione. Il sistema a fasce penalizza i consumi elevati." },
        { subtitle: "Quanto consuma una famiglia", text: "Consumo medio: 150-200 litri/persona/giorno. Famiglia di 3: circa 150-220 mc/anno. Bolletta media: 300-500€/anno." },
        { subtitle: "Come risparmiare", text: "Riduttori di flusso (-30%), cassette WC a doppio scarico, elettrodomestici classe A, raccolta acqua piovana. Verifica perdite: un WC che gocciola spreca 200 litri/giorno." }
      ]
    },
    guida: {
      title: "Come ottimizzare i costi dell'acqua",
      steps: [
        { n: "1", title: "Leggi la bolletta", text: "Consumo in mc, tariffa per fascia, quota fissa. Verifica che i componenti del nucleo dichiarati siano corretti." },
        { n: "2", title: "Controlla le fasce", text: "Restare nella fascia agevolata fa risparmiare molto. Se superi la soglia, tutta la fascia superiore costa di più." },
        { n: "3", title: "Installa riduttori di flusso", text: "Costano 2-5€, riducono il consumo del 30-50%. Investimento ~20€. Risparmio annuo: 50-100€." },
        { n: "4", title: "Verifica perdite occulte", text: "Chiudi tutti i rubinetti e controlla il contatore. Rubinetto che gocciola: 5.000 litri/anno. WC che non chiude: 70.000 litri/anno." },
        { n: "5", title: "Richiedi il bonus idrico", text: "ISEE sotto 8.265€ (o 20.000€ con 4+ figli): Bonus Sociale Idrico. Si richiede tramite ISEE all'INPS." }
      ]
    }
  },
  internet: {
    icon: '📡',
    title: 'Internet & Telefonia',
    color: '#8B5CF6',
    capire: {
      title: "Capire la connettività in Italia",
      content: [
        { subtitle: "FTTH, FTTC, FWA: cosa cambia", text: "FTTH è fibra fino a casa (fino a 10 Gbps). FTTC è fibra fino all'armadio poi rame (max ~200 Mbps). FWA è wireless: utile dove non arriva la fibra. Verifica la copertura sul sito BUL o dei singoli operatori." },
        { subtitle: "La rete Open Fiber", text: "Open Fiber costruisce la rete FTTH e la affitta agli operatori. L'operatore che scegli determina solo il prezzo e il servizio clienti, non la velocità." },
        { subtitle: "Cosa conta davvero", text: "Per uso medio: 100 Mbps bastano. La differenza tra 1 e 2.5 Gbps è impercettibile. Ciò che conta: latenza, stabilità, qualità del router." }
      ]
    },
    guida: {
      title: "Come scegliere il contratto internet",
      steps: [
        { n: "1", title: "Verifica la copertura", text: "Controlla se il tuo indirizzo è raggiunto da FTTH. Non pagare per velocità irraggiungibili." },
        { n: "2", title: "Ignora la velocità massima", text: "Guarda le recensioni sulla velocità reale. Il sito Nemesys di AGCOM misura e certifica." },
        { n: "3", title: "Attenzione al vincolo", text: "Iliad e Tiscali non hanno vincoli. A parità di prezzo, preferisci l'assenza di vincolo." },
        { n: "4", title: "Valuta il modem", text: "Per legge hai diritto al modem libero. Un buon router WiFi 6 (80-150€) migliora tutto." },
        { n: "5", title: "Controlla i costi nascosti", text: "Attivazione, modem a rate, contributo di migrazione. Calcola il costo totale su 24 mesi." }
      ]
    }
  },
  mutuo: {
    icon: '🏠',
    title: 'Mutuo & Affitto',
    color: '#10B981',
    capire: {
      title: "Capire mutui e mercato immobiliare",
      content: [
        { subtitle: "Tasso fisso vs. variabile", text: "Il fisso blocca la rata per tutta la durata. Il variabile segue l'Euribor e oscilla. Storicamente il variabile è più economico ma espone a rischi di aumento improvviso." },
        { subtitle: "Come si calcola il tasso", text: "Tasso = indice di riferimento + spread banca. Fisso: IRS + spread. Variabile: Euribor + spread. Lo spread (0.8-2%) è l'unica variabile su cui negoziare." },
        { subtitle: "Quando surrogare", text: "La surroga è gratuita per legge. Conviene quando: tassi scesi, sei nei primi anni, spread della nuova banca è inferiore." },
        { subtitle: "Affitto: quando ha senso", text: "Conviene se resti meno di 5-7 anni, prezzi in calo, rapporto rata/canone sbilanciato verso il mutuo. Con IMU, TARI e manutenzione, l'acquisto conviene solo con orizzonte lungo." }
      ]
    },
    guida: {
      title: "Come scegliere il mutuo giusto",
      steps: [
        { n: "1", title: "Calcola la tua capacità", text: "Rata max 30-35% del reddito netto. Con LTV 80% (anticipo 20%) ottieni le condizioni migliori." },
        { n: "2", title: "Confronta lo spread", text: "1% vs 1.5% su 200.000€ trentennale = ~15.000€ di differenza totale." },
        { n: "3", title: "Calcola il TAEG, non il TAN", text: "Il TAEG include tutti i costi: perizia, istruttoria, assicurazioni. È l'unico indicatore reale." },
        { n: "4", title: "Negozia le condizioni", text: "Non sei obbligato ad accettare polizze e conti della banca. Porta la tua polizza: risparmi 50-70%." },
        { n: "5", title: "Monitora per la surroga", text: "Ogni 6-12 mesi. Se i tassi scendono di 0.5%+, valuta la surroga. Gratuita e illimitata." }
      ]
    }
  },
  rc_auto: {
    icon: '🚗',
    title: 'RC Auto & Assicurazioni',
    color: '#EC4899',
    capire: {
      title: "Capire le assicurazioni auto",
      content: [
        { subtitle: "Come funziona l'RC Auto", text: "Obbligatoria per legge, copre i danni a terzi. Il premio dipende da: classe di merito (bonus-malus), provincia, tipo veicolo, età, sinistrosità. La classe parte da 14 e scende fino a 1." },
        { subtitle: "Le garanzie accessorie", text: "Furto e Incendio, Kasko (danni al TUO veicolo), Cristalli, Assistenza Stradale, Tutela Legale, Infortuni Conducente. Ognuna ha costo e utilità diversa." },
        { subtitle: "Il Risarcimento Diretto", text: "Dal 2007, in caso di sinistro con colpa altrui, è la TUA compagnia a risarcirti. Importante scegliere una compagnia efficiente, non solo economica." },
        { subtitle: "Assicurazione Casa e Personale", text: "RC Capofamiglia: copre danni che tu o la famiglia causate a terzi. Costa 50-100€/anno, fortemente raccomandata. Assicurazione infortuni: copre te se non puoi lavorare." }
      ]
    },
    guida: {
      title: "Come scegliere l'assicurazione auto",
      steps: [
        { n: "1", title: "Conosci la tua classe", text: "Controlla l'attestato di rischio. Neopatentato? Verifica la Legge Bersani per ereditare la classe di un familiare." },
        { n: "2", title: "Decidi le garanzie", text: "Auto > 15.000€: valuta Furto e Kasko. Auto < 5.000€: RC + Assistenza. Cristalli conviene quasi sempre." },
        { n: "3", title: "Confronta a parità", text: "Stessi massimali (min 6M€), stesse garanzie, stesse franchigie. Altrimenti il confronto è falsato." },
        { n: "4", title: "Valuta la scatola nera", text: "Riduce il premio del 10-20%. Se guidi poco e bene, è un ottimo affare." },
        { n: "5", title: "Tempistiche di disdetta", text: "Puoi disdire fino al giorno prima della scadenza via PEC. Cerca preventivi 3-4 settimane prima." }
      ]
    }
  },
  bollo_revisione: {
    icon: '🔧',
    title: 'Bollo, Revisione & Manutenzione',
    color: '#F97316',
    capire: {
      title: "Capire gli obblighi del veicolo",
      content: [
        { subtitle: "Il Bollo Auto", text: "Tassa regionale basata su kW e classe ambientale. Auto elettriche esenti 5 anni. Scadenza legata al mese di immatricolazione. Mancato pagamento: sanzioni dall'1% al 30%." },
        { subtitle: "La Revisione", text: "Prima: 4 anni dall'immatricolazione. Successive: ogni 2 anni. Costo: 45€ (Motorizzazione) o 66-79€ (centri autorizzati). Senza revisione: multa 173-694€." },
        { subtitle: "Manutenzione ordinaria", text: "Tagliando ogni 15.000-30.000 km o 1-2 anni. Costo: 150-300€ (utilitaria) fino a 500-1000€ (premium). Non è obbligatorio dal concessionario." },
        { subtitle: "Manutenzione straordinaria", text: "Freni, ammortizzatori, cinghia distribuzione (ogni 60.000-120.000 km), pneumatici (min 1.6mm battistrada). La cinghia è critica: la rottura distrugge il motore." }
      ]
    },
    guida: {
      title: "Come gestire il veicolo senza stress",
      steps: [
        { n: "1", title: "Segna le scadenze", text: "Usa il calendario qui sotto per registrare bollo, revisione, tagliando e gomme. Riceverai promemoria via email." },
        { n: "2", title: "Paga il bollo in tempo", text: "PagoPA, ACI, tabaccai o home banking. Entro 15 gg: sanzione 0.1%/giorno. Dopo 30 gg: 1.5%. Dopo 1 anno: 3.75%." },
        { n: "3", title: "Prenota la revisione", text: "2-3 settimane prima della scadenza. Evita settembre-ottobre (periodo di punta)." },
        { n: "4", title: "Non trascurare il tagliando", text: "Preserva il valore dell'auto. Storico completo = +10-15% in rivendita." },
        { n: "5", title: "Confronta preventivi officina", text: "Per interventi straordinari, 3 preventivi. Officine indipendenti: -30-50% vs concessionarie." }
      ]
    }
  },
  istruzione: {
    icon: '🎓',
    title: 'Istruzione Universitaria',
    color: '#6366F1',
    capire: {
      title: "Capire i costi dell'università in Italia",
      content: [
        { subtitle: "Come funzionano le rette nelle pubbliche", text: "Le università pubbliche modulano la retta in base all'ISEE per il diritto allo studio universitario (ISEE-U). Sotto la soglia di No Tax Area (almeno 22.000€ a livello nazionale, fino a 30.000€ in atenei come Statale Milano, Padova, Federico II) si è esenti dal contributo universitario: si paga solo la tassa regionale per il diritto allo studio (~140€) e l'imposta di bollo (16€), per un totale di ~156€. Sopra la No Tax Area la retta cresce progressivamente fino al contributo pieno (in genere 2.800-3.900€ per le facoltà scientifiche)." },
        { subtitle: "La No Tax Area e le riduzioni graduali", text: "Con ISEE fino a 22.000€ l'esenzione è totale in tutti gli atenei statali. Tra 22.001 e 30.000€ sono previste riduzioni progressive: 80% di sconto fino a 24k, 50% fino a 26k, 25% fino a 28k, 10% fino a 30k. Molti atenei (Bologna, Sapienza, Politecnico di Milano, Federico II, Padova) estendono autonomamente la No Tax Area fino a 24-30k€, rendendo le riduzioni ancora più favorevoli. Senza ISEE presentato si paga automaticamente il contributo massimo." },
        { subtitle: "Le private: rette modulate vs rette fisse", text: "Le università private si dividono in due categorie. Quelle a retta modulata (Bocconi, Cattolica, IULM, Humanitas) calcolano l'importo su fasce di reddito interne — a volte basate sull'ISEE parificato, a volte su indicatori propri come l'ISU Bocconi o l'ISEP di Humanitas — con range ampi (Bocconi: 3.400-16.700€, Cattolica: 3.200-10.400€). Quelle a retta fissa (LUISS, San Raffaele, Campus Bio-Medico) applicano un unico importo uguale per tutti, abbattibile solo tramite borse di studio separate basate sul merito o l'ISEE." },
        { subtitle: "Borse DSU regionali: importi e requisiti", text: "La borsa di studio DSU (Diritto allo Studio Universitario) è erogata dalle Regioni in base a reddito e merito. Per l'a.a. 2025/26 gli importi minimi fissati dal MUR (DD 180/2025) sono: studente in sede 2.850€, pendolare 4.133€, fuori sede 7.072€. Per ISEE sotto i 13.974€ è prevista una maggiorazione del 15% che porta la borsa fuori sede fino a 8.133€. Le soglie ISEE/ISPE per accedere sono 27.948€ e 60.758€. I bandi escono tra giugno e settembre sui siti degli enti regionali (DSU Lombardia, DiSCo Lazio, ER.GO Emilia-Romagna, ecc.)." },
        { subtitle: "Pubblica vs privata: quando vale la differenza", text: "Le rette delle private sono 3-10 volte superiori a quelle delle pubbliche (escluso il caso della No Tax Area). Il valore aggiunto è nel network, nei servizi di placement, nella dimensione internazionale e nel brand. Per economia e finanza, management e giurisprudenza il premio salariale di Bocconi e LUISS è documentato, soprattutto nei primi anni di carriera. Per medicina, ingegneria e materie STEM le pubbliche top (Politecnico di Milano, Sapienza, Padova, Federico II) hanno tassi di occupazione e stipendi post-laurea allineati alle private, a costi molto inferiori." }
      ]
    },
    guida: {
      title: "Come scegliere l'università e risparmiare",
      steps: [
        { n: "1", title: "Calcola e presenta sempre l'ISEE-U", text: "Rivolgiti a un CAF o usa il simulatore INPS per ottenere l'ISEE per il diritto allo studio universitario (è gratuito). Presentarlo è il singolo atto che fa risparmiare di più: senza, paghi automaticamente il contributo massimo, fino a 4.000€ di differenza. Le scadenze sono in genere tra ottobre e dicembre." },
        { n: "2", title: "Confronta rette e ricorda che le etichette ISEE del comparatore sono semplificate", text: "Il comparatore qui sotto raggruppa in tre fasce (No Tax Area, zona agevolata 22-30k€, contributo pieno). Nella realtà ogni ateneo ha 4-9 scaglioni. Per un calcolo preciso usa i simulatori ufficiali del tuo ateneo target (Sapienza Infostud, Unibo, Polimi, Federico II ne hanno tutti uno pubblico)." },
        { n: "3", title: "Verifica borse di merito e convenzioni", text: "Le private offrono borse di merito legate al voto di maturità o al test di ingresso (Bocconi4Access fino al 100%, agevolazioni LUISS per SAT/IB, borse Humanitas fino a 23.000€). Le pubbliche hanno bonus per diploma 100/100 e lode (Federico II: 50% di sconto). Controlla i bandi tra aprile e luglio." },
        { n: "4", title: "Stima il costo totale, non solo la retta", text: "Fuori sede a Milano: 12.000-18.000€/anno extra (affitto 600-900€/mese, vitto, trasporti, libri). Roma: 10.000-14.000€. Città medie (Bologna, Torino, Padova, Pisa): 8.000-11.000€. Città del sud (Napoli, Bari, Catania): 5.500-8.000€. Le residenze universitarie DSU sono la soluzione più economica ma i posti sono limitati." },
        { n: "5", title: "Valuta il ritorno sull'investimento (ROI)", text: "Consulta il portale AlmaLaurea (almalaurea.it) per tasse di occupazione e stipendio a 1 e 5 anni dalla laurea, ateneo per ateneo e corso per corso. Un ateneo più costoso con il 95% di occupazione e stipendio medio 35.000€ a 5 anni si ripaga rapidamente; uno con il 60% di occupazione e stipendio 22.000€ è un cattivo investimento anche se la retta è bassa." }
      ]
    }
  },
  tfr_pensione: {
    icon: '📊',
    title: 'TFR & Pensione Integrativa',
    color: '#14B8A6',
    capire: {
      title: "Capire la previdenza complementare e il TFR",
      content: [
        { subtitle: "Cos'è il TFR e perché è importante", text: "Ogni mese, il tuo datore di lavoro accantona circa il 6,91% della tua retribuzione lorda come Trattamento di Fine Rapporto. Se lasci il TFR in azienda, si rivaluta ogni anno dell'1,5% fisso più il 75% dell'inflazione — un rendimento modesto, nell'ordine del 2-3% annuo. Ma hai un'alternativa: destinarlo a un fondo pensione. Questa scelta, spesso sottovalutata, può fare una differenza enorme sul tuo tenore di vita dopo il pensionamento. Non si tratta di soldi in più che devi tirare fuori dal tuo stipendio: è denaro che già ti spetta, e la domanda è semplicemente dove farlo fruttare meglio." },
        { subtitle: "Fondo pensione o TFR in azienda: differenze fiscali e vantaggi oggettivi", text: "Il confronto è netto. Il TFR lasciato in azienda rende poco e viene tassato con l'aliquota IRPEF ordinaria (dal 23% al 43%) quando lo incassi. Un fondo pensione, invece, ha storicamente reso tra il 4% e il 6% annuo sulle linee bilanciate e azionarie, e gode di una tassazione agevolata tra il 9% e il 15% — che si abbassa con gli anni di permanenza. In più, se aderisci al fondo negoziale del tuo settore, il datore di lavoro è obbligato a versare un contributo aggiuntivo (tipicamente l'1-2% della retribuzione) che altrimenti perderesti. Infine, i contributi versati al fondo sono deducibili dal reddito fino a 5.164€ all'anno, generando un risparmio fiscale immediato." },
        { subtitle: "Il gap pensionistico: quanto prenderai davvero di pensione", text: "Con il sistema contributivo, la tua pensione pubblica sarà probabilmente tra il 50% e il 60% dell'ultimo stipendio — e per chi ha iniziato a lavorare dopo il 1996 o ha carriere discontinue, potrebbe scendere al 40-50%. Significa che, se oggi guadagni 1.800€ netti al mese, la tua pensione pubblica potrebbe essere di 900-1.000€. Il fondo pensione serve esattamente a colmare questo gap, costruendo una rendita integrativa che si aggiunge a quella dell'INPS. Prima inizi, più l'effetto dell'interesse composto lavora a tuo favore." },
        { subtitle: "Le tre tipologie di fondi pensione", text: "I fondi negoziali (o di categoria) sono riservati ai lavoratori di specifici settori (es. Cometa per i metalmeccanici, Fonte per il commercio). Hanno costi bassissimi (0,1-0,3% annuo) e includono il contributo obbligatorio del datore. Sono quasi sempre la scelta migliore per chi ne ha diritto. I fondi aperti sono accessibili a tutti — lavoratori dipendenti, autonomi, liberi professionisti. Costano di più (1-1,5% annuo) ma offrono maggiore flessibilità nella scelta dei comparti. I PIP (Piani Individuali Pensionistici) sono prodotti assicurativi spesso molto costosi (2-3% annuo). Possono avere senso in casi specifici, ma nella maggior parte delle situazioni i costi elevati erodono significativamente il rendimento nel lungo periodo." },
        { subtitle: "Come leggere i rendimenti di un fondo pensione", text: "Quando confronti i fondi, guarda sempre i rendimenti netti su orizzonti lunghi — almeno 5 o 10 anni. Il rendimento di un singolo anno può essere fuorviante: un anno eccezionale non significa che il fondo sia strutturalmente migliore. I rendimenti pubblicati dalla COVIP sono già al netto dei costi di gestione e delle imposte sul rendimento, quindi sono direttamente confrontabili. Ricorda che rendimenti passati non garantiscono rendimenti futuri, ma un track record solido su 10-20 anni è un buon indicatore della qualità della gestione." }
      ]
    },
    guida: {
      title: "Come scegliere il fondo pensione giusto per te",
      steps: [
        { n: "1", title: "Controlla se hai diritto a un fondo negoziale", text: "La prima cosa da fare è verificare il tuo Contratto Collettivo Nazionale (CCNL): quasi tutti prevedono un fondo pensione di categoria. Se ce l'hai, il datore di lavoro è obbligato a versare un contributo aggiuntivo (tipicamente l'1-2% della tua retribuzione) a patto che anche tu versi la tua quota minima. Non aderire al fondo negoziale significa letteralmente rinunciare a soldi gratis che il tuo datore è pronto a versarti. È il primo e più importante passo." },
        { n: "2", title: "Destina il TFR al fondo pensione", text: "Per spostare il TFR nel fondo devi compilare il modulo TFR2 e consegnarlo al datore di lavoro. La scelta è irreversibile per il TFR futuro (quello già maturato resta dove si trova). La convenienza è chiara: il TFR nel fondo viene tassato al 9-15% all'uscita, contro il 23-43% se lo lasci in azienda. Su una carriera di 30 anni, questa differenza fiscale da sola può valere decine di migliaia di euro. Se hai dubbi, parlane con il tuo ufficio risorse umane o con un consulente." },
        { n: "3", title: "Scegli il comparto in base alla tua età e orizzonte", text: "Ogni fondo offre diversi comparti con livelli di rischio crescenti. La regola generale è semplice: più sei giovane, più puoi permetterti un comparto azionario, perché hai tempo per recuperare eventuali perdite e beneficiare della crescita di lungo periodo. Se hai meno di 35 anni, la teoria finanziaria suggerisce di valutare un comparto azionario o bilanciato-aggressivo. Tra i 35 e i 55, un bilanciato classico offre storicamente un buon compromesso. Sopra i 55, si tende solitamente a spostarsi gradualmente verso comparti più prudenti. Molti fondi offrono anche opzioni life-cycle che ribilanciano automaticamente con l'avvicinarsi della pensione." },
        { n: "4", title: "Sfrutta al massimo la deducibilità fiscale", text: "Puoi dedurre dal reddito imponibile fino a 5.164€ all'anno di contributi al fondo pensione (incluso il TFR). Questo significa che lo Stato ti restituisce una parte di quanto versi, sotto forma di minori tasse. Esempio concreto: con un reddito lordo di 35.000€, versare 5.164€ al fondo ti fa risparmiare circa 1.800€ di IRPEF — un rendimento immediato di oltre il 35% sull'importo versato, prima ancora di considerare i rendimenti finanziari del fondo. Verifica nella tua dichiarazione dei redditi che il commercialista stia effettivamente applicando questa deduzione." },
        { n: "5", title: "Confronta i costi con l'ISC (Indicatore Sintetico dei Costi)", text: "I costi di gestione sono il nemico silenzioso del risparmio previdenziale. L'ISC è l'indicatore che li riassume tutti in un singolo numero percentuale. Un fondo con ISC dello 0,2% e uno con ISC del 2% possono sembrare simili, ma su 30 anni di investimento la differenza è enorme: il fondo più costoso ti restituirà circa il 25% in meno di capitale finale. I fondi negoziali hanno tipicamente un ISC tra 0,2% e 0,5%; i fondi aperti tra 1% e 1,5%; i PIP superano spesso il 2%. Puoi confrontare gli ISC di tutti i fondi sul sito della COVIP." }
      ]
    }
  },
  salute: {
    icon: '🏥',
    title: 'Assicurazione Sanitaria',
    color: '#DC2626',
    capire: {
      title: "Capire l'assicurazione sanitaria integrativa",
      content: [
        { subtitle: "Perché serve in Italia", text: "SSN universale ma con tempi lunghi e copertura limitata su odontoiatria e oculistica. L'integrativa permette di accedere al privato a costi contenuti." },
        { subtitle: "Cosa copre", text: "Grandi Interventi (ricoveri, chirurgia), Piccole Prestazioni (visite, diagnostica), Odontoiatria/Oculistica. I piani premium coprono tutto." },
        { subtitle: "A chi conviene", text: "Famiglie con bambini, autonomi, over 50, chiunque in zone con liste d'attesa lunghe." },
        { subtitle: "Periodi di carenza", text: "3-6 mesi per la maggior parte delle prestazioni. Odontoiatria e maternità fino a 12 mesi. Attivarla PRIMA di averne bisogno." }
      ]
    },
    guida: {
      title: "Come scegliere l'assicurazione sanitaria",
      steps: [
        { n: "1", title: "Valuta le tue esigenze", text: "Odontoiatria? Visite rapide? Ricoveri? Il piano che copre tutto costa di più e include cose che non userai." },
        { n: "2", title: "Confronta i massimali", text: "Ricoveri: almeno 100.000€. Piccole prestazioni: 2.000-5.000€/anno sufficienti." },
        { n: "3", title: "Verifica la rete convenzionata", text: "In convenzione paghi poco o nulla. Fuori devi anticipare e chiedere rimborso (parziale)." },
        { n: "4", title: "Leggi le esclusioni", text: "Preesistenze, sport estremi, chirurgia estetica. Dichiara tutto onestamente." },
        { n: "5", title: "Valuta il fondo aziendale", text: "Se il CCNL prevede un fondo sanitario, verifica le coperture incluse: potresti già avere una buona base." }
      ]
    }
  },
  carburante: {
    icon: '⛽',
    title: 'Carburante',
    color: '#84CC16',
    capire: {
      title: "Capire i prezzi del carburante",
      content: [
        { subtitle: "Come si compone il prezzo alla pompa", text: "Materia prima (~30-35%), accise (~40%, fisse), IVA 22% (anche sulle accise). Il costo in Italia è tra i più alti d'Europa." },
        { subtitle: "Perché varia tra distributori", text: "Margini bassi (2-5 cent/litro). Differenze per: posizione (autostrada +15-20 cent), brand (no-logo -5-15 cent), self vs servito (-10-15 cent)." },
        { subtitle: "Osservatorio prezzi", text: "osservaprezzi.mise.gov.it e Google Maps mostrano i distributori più economici. Differenza nella stessa zona: fino a 15-20 cent/litro." }
      ]
    },
    guida: {
      title: "Come risparmiare sul carburante",
      steps: [
        { n: "1", title: "Usa le pompe bianche", text: "No-logo: -10-15 cent/litro. Su 1.200 litri/anno = 120-180€ di risparmio." },
        { n: "2", title: "Sempre self-service", text: "Servito: +10-15 cent senza valore aggiunto. Evita l'autostrada: +20 cent." },
        { n: "3", title: "Guida efficiente", text: "Velocità costante, marce alte, pneumatici gonfi: -15-25% consumi. A 130 km/h +20% vs 110." },
        { n: "4", title: "Carte carburante e app", text: "IP Plus, Eni Live, Q8 Star: cashback 1-3 cent. App Prezzi Benzina e Gaspal per trovare il più economico." },
        { n: "5", title: "Valuta l'elettrico", text: "Se > 15.000 km/anno e hai un box: -60-70% costo/km. Break-even a 4-6 anni." }
      ]
    }
  }
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