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
  { name: 'Sorgenia Next Energy Sunlight', tipo: 'Variabile (PUN+0,006)', indice: 'PUN', spread: 0.006, prezzo: 0, fisso: 9.50, verde: true, note: 'Sconto fedeltà incluso', link: 'https://www.sorgenia.it/luce-gas' },
  { name: 'Eni Plenitude Fixa Time', tipo: 'Fisso 12 mesi', prezzo: 0.145, fisso: 12, verde: true, note: 'Sconto 12€/anno se usi domiciliazione', link: 'https://eniplenitude.com/offerta/casa/luce-e-gas/fixa-time' },
  { name: 'Iren Self Luce Prezzo Fisso', tipo: 'Fisso 18 mesi', prezzo: 0.139, fisso: 10, verde: false, note: 'Prezzo bloccato fino a fine 2026', link: 'https://www.irenlucegas.it/casa/offerte-luce/iren-self-luce-prezzo-fisso' },
  { name: 'Nen Special 48', tipo: 'Abbonamento Fisso', prezzo: 0.141, fisso: 8, verde: true, note: 'Rata costante basata su consumi storici', link: 'https://nen.it/offerte/luce' },
  { name: 'Octopus Energy Flex', tipo: 'Variabile (PUN+0)', indice: 'PUN', spread: 0, prezzo: 0, fisso: 8.50, verde: true, note: 'Nessun ricarico sul prezzo PUN', link: 'https://octopusenergy.it/offerte/flex-luce' }
];

export let GAS_PROVIDERS = [
  { name: 'Illumia Gas Lunga', tipo: 'Fisso 36 mesi', prezzo: 0.49, fisso: 5.50, note: '3 anni di tranquillità', link: 'https://www.illumia.it/casa/gas/energia-lunga-gas/' },
  { name: 'Illumia SicurInsieme Gas', tipo: 'Variabile (PSV+0,05)', indice: 'PSV', spread: 0.05, prezzo: 0, fisso: 7, note: 'Indicizzato PSV mensile', link: 'https://www.illumia.it/casa/gas/gas-flex/' },
  { name: 'Sorgenia Next Energy Sunlight', tipo: 'Variabile (PSV+0,01)', indice: 'PSV', spread: 0.01, prezzo: 0, fisso: 9.50, note: 'Ottima per medi consumi', link: 'https://www.sorgenia.it/luce-gas' },
  { name: 'Eni Plenitude Fixa Time Gas', tipo: 'Fisso 12 mesi', prezzo: 0.55, fisso: 12, note: 'Sconto domiciliazione attivo', link: 'https://eniplenitude.com/offerta/casa/luce-e-gas/fixa-time-gas' },
  { name: 'Iren Self Gas Prezzo Fisso', tipo: 'Fisso 12 mesi', prezzo: 0.52, fisso: 10, note: 'Prezzo bloccato 1 anno', link: 'https://www.irenlucegas.it/casa/offerte-gas/iren-self-gas-prezzo-fisso' },
  { name: 'Nen Special 48 Gas', tipo: 'Abbonamento Fisso', prezzo: 0.54, fisso: 8, note: 'Rata gas prevedibile', link: 'https://nen.it/offerte/gas' }
];

export const INTERNET_PROVIDERS = [
  { id: "windtre_fibra", name: "WindTre Super Fibra", tags: ["affiliato", "top_speed"], prezzoMensile: 19.99, velocita: "2.5 Gbps", nota: "Include Prime 12 mesi", link: "https://www.awin1.com/cread.php?awinmid=27760&awinaffid=2811530" },
  { id: "iliad_fibra", name: "Iliad Box", tags: ["trasparente"], prezzoMensile: 24.99, velocita: "5 Gbps", nota: "Prezzo fisso per sempre", link: "https://www.iliad.it/offerta-iliadbox.html" },
  { id: "fastweb_casa", name: "Fastweb Casa", tags: ["no_vincoli"], prezzoMensile: 29.95, velocita: "2.5 Gbps", nota: "Assicurazione casa inclusa", link: "https://www.fastweb.it/adsl-fibra-ottica/fastweb-casa/" },
  { id: "sky_wifi", name: "Sky Wifi", tags: ["ottimizzato_streaming"], prezzoMensile: 25.90, velocita: "1 Gbps", nota: "Sconto per clienti Sky TV", link: "https://www.sky.it/sky-wifi" },
  { id: "tiscali_ultra", name: "Tiscali UltraFibra", tags: ["conveniente"], prezzoMensile: 24.90, velocita: "2.5 Gbps", nota: "Attivazione gratuita", link: "https://casa.tiscali.it/fibra-adsl/fw-evdsl/ultrafibra_fas/" }
];

export const CONTI_CORRENTI = [
  { id: "bbva", name: "BBVA Online", tags: ["affiliato", "rendimento"], canoneMensile: 0, rendimento: "3,00%", vantaggioPrincipale: "Remunerazione", note: "Bonifici istantanei gratis", link: "https://www.financeads.net/tc.php?t=82784C5581131019T" },
  { id: "hype", name: "Hype Base", tags: ["affiliato", "giovani"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Gestione App", note: "Fino a 25€ bonus", link: "https://www.financeads.net/tc.php?t=82784C257247700T" },
  { id: "fineco", name: "Fineco Bank", tags: ["investimenti"], canoneMensile: 3.95, rendimento: "1,50%", vantaggioPrincipale: "Trading", note: "Gratis Under 30", link: "https://finecobank.com/it/online/conto-e-carte/" },
  { id: "revolut", name: "Revolut", tags: ["zero_spese"], canoneMensile: 0, rendimento: "2,50%", vantaggioPrincipale: "Cambio valuta", note: "Per viaggiatori", link: "https://www.revolut.com/it-IT/" },
  { id: "bper", name: "BPER Banca", tags: ["tradizionale"], canoneMensile: 0, rendimento: "3,30%", vantaggioPrincipale: "Conto vincolato", note: "Canone zero", link: "https://www.bper.it/conti-correnti" },
  { id: "intesa_xme", name: "Intesa XME", tags: ["giovani"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Under 35", note: "Esenzione bollo", link: "https://www.intesasanpaolo.com/it/persone-e-famiglie/prodotti/conti-correnti.html" },
  { id: "unicredit", name: "UniCredit", tags: ["tradizionale"], canoneMensile: 0, rendimento: "0%", vantaggioPrincipale: "Online gratis", note: "Bonifici SEPA", link: "https://www.unicredit.it/it/privati/conti-correnti.html" }
];

export const INSURANCE_DATA = [
  { name: 'Prima.it', base: 280, assist: 25, infortuni: 35, note: 'Gestione 100% via App', link: 'https://www.prima.it/' },
  { name: 'ConTe.it', base: 310, assist: 18, infortuni: 42, note: 'Sconto scatola nera alto', link: 'https://www.conte.it/' },
  { name: 'Allianz Direct', base: 345, assist: 22, infortuni: 30, note: 'Ottima assistenza sinistri', link: 'https://www.allianzdirect.it/' },
  { name: 'Linear', base: 295, assist: 20, infortuni: 45, note: 'Gruppo Unipol', link: 'https://www.linear.it/' }
];

export const HEALTH_INSURANCE = [
  { name: 'Allianz Salute', premio: 'da 45€/mese', focus: 'Prevenzione', link: 'https://www.allianz.it/le-nostre-soluzioni/salute.html' },
  { name: 'Generali Sei in Salute', premio: 'da 52€/mese', focus: 'Ricoveri', link: 'https://www.generali.it/assicurazioni/salute' },
  { name: 'RBM Salute', premio: 'da 38€/mese', focus: 'Network cliniche', link: 'https://www.rbmsalute.it/' }
];

export const UNI_FACOLTA = [
  { id: 'ingegneria', label: 'Ingegneria / STEM' },
  { id: 'economia', label: 'Economia / Giurisprudenza' },
  { id: 'medicina', label: 'Medicina / Professioni Sanitarie' },
  { id: 'umanistica', label: 'Lettere / Filosofia / Lingue' },
  { id: 'design', label: 'Design / Architettura / Belle Arti' }
];

export const UNI_DATA = [
  { id: 'polimi', name: 'Politecnico di Milano', facolta: ['ingegneria', 'design'], costo: '3.900€', ranking: '1° in Italia', link: 'https://www.polimi.it/' },
  { id: 'bocconi', name: 'Università Bocconi', facolta: ['economia'], costo: '14.000€', ranking: 'Top 10 EU', link: 'https://www.unibocconi.it/' },
  { id: 'unibo', name: 'Alma Mater - Bologna', facolta: ['medicina', 'umanistica', 'ingegneria'], costo: '2.500€', ranking: 'Storica eccellenza', link: 'https://www.unibo.it/' },
  { id: 'sapienza', name: 'La Sapienza - Roma', facolta: ['umanistica', 'medicina'], costo: '2.200€', ranking: 'Migliore al mondo in Classici', link: 'https://www.uniroma1.it/' },
  { id: 'luiss', name: 'LUISS Guido Carli', facolta: ['economia'], costo: '12.500€', ranking: 'Networking Aziendale', link: 'https://www.luiss.it/' }
];

export const TOPICS = {
  luce_gas: {
    title: "Luce e Gas",
    icon: "⚡",
    color: "#f59e0b",
    capire: {
      title: "Cosa guardare in bolletta",
      content: [
        { subtitle: "Prezzo Fisso vs Variabile", text: "Il prezzo fisso ti protegge dai rincari per un periodo stabilito (12-24 mesi). Il variabile segue l'andamento del mercato (PUN per la luce, PSV per il gas) e solitamente ha costi di commercializzazione più bassi." },
        { subtitle: "Costi di Commercializzazione", text: "È una quota fissa mensile (PCV) che paghi indipendentemente dai consumi. Per bassi consumi (seconde case), è il dato più importante da confrontare." },
        { subtitle: "La Materia Prima", text: "Rappresenta circa il 45-60% della bolletta totale. Il resto è composto da oneri di sistema, trasporto e tasse, che sono uguali per tutti i fornitori." }
      ]
    },
    guida: {
      title: "Come cambiare fornitore",
      steps: [
        { n: "1", title: "Prendi l'ultima bolletta", text: "Individua il tuo consumo annuo (kWh o Smc) e i codici POD (luce) o PDR (gas)." },
        { n: "2", title: "Confronta il costo fisso", text: "Controlla quanto paghi di quota fissa mensile; spesso i vecchi contratti hanno quote molto alte (sopra i 12€/mese)." },
        { n: "3", title: "Sottoscrivi online", text: "Il passaggio è gratuito, non prevede interruzioni di servizio e non servono interventi al contatore." }
      ]
    }
  },
  conti_correnti: {
    title: "Conti e Risparmio",
    icon: "💳",
    color: "#3b82f6",
    capire: {
      title: "Oltre il canone zero",
      content: [
        { subtitle: "Imposta di Bollo", text: "Sui conti correnti con giacenza media superiore a 5.000€ si paga lo Stato (34,20€/anno). Alcune banche lo offrono gratuitamente come promozione." },
        { subtitle: "Interessi Attivi", text: "Oggi molti conti correnti remunerano la liquidità. Verifica se il tasso è vincolato (soldi bloccati) o libero." },
        { subtitle: "Costi Operativi", text: "Attenzione alle commissioni sui bonifici istantanei e sui prelievi presso altre banche, che possono annullare il risparmio del canone zero." }
      ]
    },
    guida: {
      title: "Trovare il conto ideale",
      steps: [
        { n: "1", title: "Analizza la tua giacenza", text: "Se lasci molto denaro fermo, cerca un conto con interessi (es. BBVA). Se hai poco, punta al canone zero assoluto." },
        { n: "2", title: "Verifica l'operatività", text: "Fai molti bonifici? Prelevi spesso? Controlla che queste voci siano incluse o abbiano costi bassi." },
        { n: "3", title: "Valuta l'App", text: "Per un conto online, l'interfaccia dell'applicazione è lo strumento principale: leggi le recensioni sugli store." }
      ]
    }
  },
  internet: {
    title: "Internet e Fibra",
    icon: "🌐",
    color: "#8b5cf6",
    capire: {
      title: "Verità sulla velocità",
      content: [
        { subtitle: "FTTH vs FTTC", text: "La FTTH arriva con la fibra fin dentro casa (fino a 10 Gbps). La FTTC usa il rame nell'ultimo tratto, limitando la velocità a 100-200 Mbps." },
        { subtitle: "Costi di Attivazione", text: "Spesso spalmati in 24 o 48 mesi. Se recedi prima, dovrai pagare le rate residue in un'unica soluzione." },
        { subtitle: "Il Modem", text: "Molti operatori includono il modem gratuitamente, ma in realtà è un comodato d'uso o una vendita rateizzata obbligatoria." }
      ]
    },
    guida: {
      title: "Abbonarsi senza sorprese",
      steps: [
        { n: "1", title: "Verifica la copertura", text: "Usa i siti ufficiali per capire se sei raggiunto dalla vera Fibra (bollino verde F) o dal rame." },
        { n: "2", title: "Guarda il prezzo 'a regime'", text: "Non farti incantare dallo sconto per i primi 6 mesi. Calcola la spesa media sui primi 24 mesi." },
        { n: "3", title: "Opzione 'Senza Vincoli'", text: "Alcuni operatori (es. Fastweb, Iliad) permettono di disdire senza penali o rate residue: preferiscili se non sei sicuro della permanenza." }
      ]
    }
  },
  rc_auto: {
    title: "Assicurazione RC Auto",
    icon: "🚗",
    color: "#e11d48",
    capire: {
      title: "Capire il mercato assicurativo oggi",
      content: [
        {
          subtitle: "L'illusione del Premio Base",
          text: "Il mercato RCA è diventato iper-competitivo sul 'premio base' (la copertura obbligatoria per legge) per attirarti in vetrina. Tuttavia, le vere marginalità per le compagnie derivano dalle garanzie accessorie (Furto, Cristalli, Infortuni). Spesso un preventivo che sembra il più economico diventa il più costoso non appena aggiungi l'assistenza stradale. Ecco perché confrontare 'pacchetti chiusi' a parità di garanzie è l'unico modo per trovare il risparmio reale."
        },
        {
          subtitle: "La trappola (e il vantaggio) della Scatola Nera",
          text: "Oggi quasi tutte le compagnie offrono sconti (dal 10% al 25%) se installi il dispositivo satellitare. Il vantaggio economico è innegabile, ma attenzione al compromesso: in caso di sinistro con dinamica dubbia, i dati telemetrici (es. se andavi a 53 km/h in una zona con limite a 50) verranno usati dalla compagnia per attribuirti un concorso di colpa. Valuta se lo sconto offerto giustifica questa cessione di privacy e controllo."
        },
        {
          subtitle: "Massimali minimi vs. Massimali di sicurezza",
          text: "La legge fissa un massimale minimo (circa 6,4 milioni per i danni alle persone e 1,3 milioni per le cose). Sembrano cifre enormi, ma in caso di incidenti multipli o danni gravi a infrastrutture, possono non bastare, intaccando il tuo patrimonio personale. Alzare il massimale a 10, 20 o 50 milioni di euro costa solitamente pochissimo (spesso meno di 10-15€ annui) ed è l'investimento più intelligente che tu possa fare."
        },
        {
          subtitle: "Compagnie Dirette (Online) vs. Tradizionali",
          text: "Le compagnie online (dirette) costano mediamente il 25-30% in meno perché tagliano i costi delle agenzie fisiche e degli intermediari. Il prodotto assicurativo è identico e normato dall'IVASS. La vera differenza è operativa: in caso di sinistro, con una compagnia tradizionale hai l'agente che ti compila le scartoffie, con una diretta dovrai gestire l'apertura del sinistro tramite App o call center."
        }
      ]
    },
    guida: {
      title: "Come configurare la polizza perfetta",
      steps: [
        {
          n: "1",
          title: "Sfrutta l'RC Familiare (ex Legge Bersani)",
          text: "Prima di stipulare una nuova polizza, verifica sempre se puoi ereditare la Classe di Merito (CU) migliore presente nel tuo nucleo familiare (Stato di Famiglia). Oggi vale anche tra veicoli di tipo diverso (es. da Auto a Moto) e anche sui rinnovi, purché non ci siano stati sinistri con colpa negli ultimi 5 anni."
        },
        {
          n: "2",
          title: "Includi sempre la 'Rinuncia alla Rivalsa'",
          text: "È l'opzione più importante in assoluto. Senza questa clausola, se causi un incidente con la patente scaduta da un giorno, senza revisione o con un tasso alcolemico fuori norma, l'assicurazione paga i danni ma poi 'si rivale' su di te, chiedendoti indietro i soldi (fino a mandarti in rovina). Costa pochi euro ma salva la vita finanziaria."
        },
        {
          n: "3",
          title: "Distingui tra Franchigia e Scoperto",
          text: "Sulle garanzie accessorie (es. Furto o Atti Vandalici) le compagnie si tutelano. La 'Franchigia' è una cifra fissa che paghi tu (es. i primi 250€ del danno). Lo 'Scoperto' è invece una percentuale (es. il 10% del danno). Molte compagnie li applicano entrambi ('Scoperto 10% con minimo di 250€'). Leggi sempre questi valori prima di esultare per un premio basso."
        },
        {
          n: "4",
          title: "Valuta le coperture in base all'età dell'auto",
          text: "Se la tua auto ha più di 6-7 anni, pagare per garanzie come 'Furto e Incendio' o 'Kasko' diventa antieconomico: in caso di danno totale, l'assicurazione ti rimborserà solo il valore commerciale del veicolo (Eurotax), che sarà ormai bassissimo. Su auto vecchie, mantieni solo Cristalli, Infortuni Conducente (copre i danni fisici a te stesso, che la RCA base non copre mai) e Assistenza Stradale."
        },
        {
          n: "5",
          title: "Pareggia i preventivi prima di decidere",
          text: "Non confrontare mai il preventivo di una compagnia che include l'assistenza stradale con uno che ha solo la RCA base. Usa il calcolatore di questa pagina per 'costruire' pacchetti identici. Solo pareggiando le garanzie scoprirai chi è davvero il più conveniente sul mercato."
        }
      ]
    }
  }
};