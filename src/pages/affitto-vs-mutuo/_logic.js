export const cittaList = ["milano","roma","torino","napoli","firenze","bologna","genova","bari","verona","padova","brescia","bergamo","parma","modena","trieste","venezia","catania","palermo","cagliari","pisa"];
export const importiList = [400, 450, 500, 550, 600, 650, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1700, 2000, 2200, 2500, 3000];

const CITTA_DATA = {
  "milano": { nome: "Milano", regione: "Lombardia", prezzoMq: 5400, affittoMq: 22.5, yield: 5.0, note: "Tra le città più costose d'Italia" },
  "roma": { nome: "Roma", regione: "Lazio", prezzoMq: 3300, affittoMq: 16.5, yield: 6.0, note: "Mercato molto frammentato tra zone centrali e periferiche" },
  "torino": { nome: "Torino", regione: "Piemonte", prezzoMq: 2200, affittoMq: 11.0, yield: 6.0, note: "Ottimo rapporto prezzo-qualità" },
  "napoli": { nome: "Napoli", regione: "Campania", prezzoMq: 2700, affittoMq: 12.5, yield: 5.5, note: "Mercato in crescita, prezzi moderati" },
  "firenze": { nome: "Firenze", regione: "Toscana", prezzoMq: 4100, affittoMq: 17.0, yield: 5.0, note: "Pressione turistica sui canoni e sui prezzi" },
  "bologna": { nome: "Bologna", regione: "Emilia-Romagna", prezzoMq: 3800, affittoMq: 17.5, yield: 5.5, note: "Forte domanda studentesca" },
  "genova": { nome: "Genova", regione: "Liguria", prezzoMq: 2100, affittoMq: 10.5, yield: 6.0, note: "Tra i prezzi più bassi delle grandi città" },
  "bari": { nome: "Bari", regione: "Puglia", prezzoMq: 2300, affittoMq: 11.0, yield: 5.5, note: "Mercato in crescita costante" },
  "verona": { nome: "Verona", regione: "Veneto", prezzoMq: 2900, affittoMq: 12.5, yield: 5.0, note: "Mercato stabile con buona qualità della vita" },
  "padova": { nome: "Padova", regione: "Veneto", prezzoMq: 2700, affittoMq: 12.0, yield: 5.5, note: "Polo universitario con domanda sostenuta" },
  "brescia": { nome: "Brescia", regione: "Lombardia", prezzoMq: 2400, affittoMq: 11.5, yield: 5.5, note: "Beneficia della prossimità a Milano" },
  "bergamo": { nome: "Bergamo", regione: "Lombardia", prezzoMq: 2800, affittoMq: 12.0, yield: 5.0, note: "Mercato sostenuto dal pendolarismo verso Milano" },
  "parma": { nome: "Parma", regione: "Emilia-Romagna", prezzoMq: 2500, affittoMq: 11.0, yield: 5.5, note: "Buon equilibrio tra prezzi e qualità della vita" },
  "modena": { nome: "Modena", regione: "Emilia-Romagna", prezzoMq: 2400, affittoMq: 10.5, yield: 5.5, note: "Mercato stabile nel polo industriale" },
  "trieste": { nome: "Trieste", regione: "Friuli", prezzoMq: 2300, affittoMq: 10.5, yield: 5.5, note: "Tra i mercati meno volatili del Nord-Est" },
  "venezia": { nome: "Venezia", regione: "Veneto", prezzoMq: 4200, affittoMq: 18.0, yield: 5.0, note: "Pressione turistica eccezionale" },
  "catania": { nome: "Catania", regione: "Sicilia", prezzoMq: 1700, affittoMq: 8.0, yield: 5.5, note: "Tra i mercati più accessibili d'Italia" },
  "palermo": { nome: "Palermo", regione: "Sicilia", prezzoMq: 1500, affittoMq: 7.5, yield: 6.0, note: "Prezzi tra i più bassi tra i capoluoghi" },
  "cagliari": { nome: "Cagliari", regione: "Sardegna", prezzoMq: 2400, affittoMq: 11.0, yield: 5.5, note: "Mercato sostenuto dalla domanda turistica" },
  "pisa": { nome: "Pisa", regione: "Toscana", prezzoMq: 2700, affittoMq: 12.5, yield: 5.5, note: "Polo universitario con domanda continua" }
};

export function fmt(n) { return new Intl.NumberFormat('it-IT').format(n); }
function rataMensile(C, anni, tassoPerc) {
  const i = tassoPerc / 100 / 12;
  const n = anni * 12;
  return C * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
}

export function elaboraDati(type, val) {
  const YIELD_ITALIA = 5.0;
  const ANTICIPO_PERC = 20;
  const TASSO_MUTUO = 3.20;
  const DURATA_MUTUO = 25;
  const REND_ANTICIPO = 3.0;
  const ISTAT = 1.5;
  const MANUTENZIONE = 1.0;
  const ORIZZONTE = 30;

  let d = { type, val, color: "#10b981" };

  if (type === 'citta') {
    d.cittaObj = CITTA_DATA[val];
    d.prezzoTotale = d.cittaObj.prezzoMq * 80;
    d.affittoMensile = d.cittaObj.affittoMq * 80;
    d.altreCitta = cittaList.filter(c => c !== val).map(c => ({ slug: c, nome: CITTA_DATA[c].nome }));
  } else {
    d.affittoMensile = val;
    d.prezzoTotale = Math.round((val * 12 * 100) / YIELD_ITALIA);
    d.tuttiImporti = importiList;
  }

  d.anticipo = Math.round(d.prezzoTotale * (ANTICIPO_PERC / 100));
  d.importoMutuo = d.prezzoTotale - d.anticipo;
  d.speseAcq = Math.round(d.prezzoTotale * 0.06);
  d.rata = Math.round(rataMensile(d.importoMutuo, DURATA_MUTUO, TASSO_MUTUO));

  let costoAcqCum = d.anticipo + d.speseAcq;
  let costoAffCum = 0;
  let canoneCorrente = d.affittoMensile;
  let anticipoInvestito = d.anticipo;
  d.breakEven = null;

  for (let anno = 1; anno <= ORIZZONTE; anno++) {
    const ratePagate = anno <= DURATA_MUTUO ? d.rata * 12 : 0;
    costoAcqCum += ratePagate + (d.prezzoTotale * (MANUTENZIONE / 100));
    costoAffCum += canoneCorrente * 12;
    canoneCorrente *= (1 + (ISTAT / 100));
    anticipoInvestito *= (1 + (REND_ANTICIPO / 100));
    const equity = anno <= DURATA_MUTUO ? d.importoMutuo * (anno / DURATA_MUTUO) : d.importoMutuo;
    
    if (d.breakEven === null && (costoAcqCum - equity - d.anticipo) < (costoAffCum - (anticipoInvestito - d.anticipo))) {
      d.breakEven = anno;
    }
  }

  if (type === 'importo') {
    const nettoMensileNecessario = d.rata / 0.30;
    const tabella = [[1100, 16500], [1330, 20000], [1526, 25000], [1723, 30000], [1919, 35000], [2115, 40000], [2310, 45000], [2506, 50000], [2700, 55000], [2891, 60000], [3270, 70000], [3647, 80000], [4025, 90000], [4403, 100000]];
    let ralStimata = 0;
    if (nettoMensileNecessario <= tabella[0][0]) ralStimata = tabella[0][1];
    else if (nettoMensileNecessario >= tabella[tabella.length - 1][0]) ralStimata = Math.round(nettoMensileNecessario * 22.7);
    else {
      for (let i = 0; i < tabella.length - 1; i++) {
        if (nettoMensileNecessario >= tabella[i][0] && nettoMensileNecessario <= tabella[i + 1][0]) {
          const ratio = (nettoMensileNecessario - tabella[i][0]) / (tabella[i + 1][0] - tabella[i][0]);
          ralStimata = Math.round(tabella[i][1] + ratio * (tabella[i + 1][1] - tabella[i][1]));
        }
      }
    }

    const RAL_DISP = [15000, 18000, 20000, 22000, 24000, 25000, 26000, 27000, 28000, 30000, 32000, 33000, 35000, 38000, 40000, 42000, 45000, 48000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 100000, 120000, 150000];
    d.ralLink = RAL_DISP[0]; let diffRal = Math.abs(ralStimata - d.ralLink);
    for (const r of RAL_DISP) { const diff = Math.abs(ralStimata - r); if (diff < diffRal) { diffRal = diff; d.ralLink = r; } }
    d.ralStimata = ralStimata;

    const IMP_MUTUO = [50000, 60000, 70000, 80000, 90000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 200000, 220000, 240000, 250000, 270000, 280000, 300000, 320000, 350000, 380000, 400000, 420000, 450000, 480000, 500000];
    d.mutuoLink = IMP_MUTUO[0]; let diffMutuo = Math.abs(d.importoMutuo - d.mutuoLink);
    for (const m of IMP_MUTUO) { const diff = Math.abs(d.importoMutuo - m); if (diff < diffMutuo) { diffMutuo = diff; d.mutuoLink = m; } }

    if (d.breakEven === null) {
      d.verdetto = `Spendere ${val} €/mese di affitto equivale a non poter raggiungere il pareggio con un acquisto in 30 anni.`; d.verdettoColor = "#dc2626"; d.verdettoIcon = "⚖️";
    } else if (d.breakEven <= 5) {
      d.verdetto = `Se paghi ${val} € di affitto, comprare diventa più conveniente già dopo ${d.breakEven} anni.`; d.verdettoColor = "#10b981"; d.verdettoIcon = "⚖️";
    } else if (d.breakEven <= 10) {
      d.verdetto = `Se paghi ${val} € di affitto, comprare conviene dopo ${d.breakEven} anni: orizzonte ragionevole.`; d.verdettoColor = "#f59e0b"; d.verdettoIcon = "⚖️";
    } else {
      d.verdetto = `Spendere ${val} € di affitto richiede ${d.breakEven} anni perché l'acquisto diventi più conveniente.`; d.verdettoColor = "#dc2626"; d.verdettoIcon = "⚖️";
    }

    d.titleSeo = `Affitto da ${val} euro al mese: meglio comprare casa? Calcolo`;
    d.descrSeo = `Se paghi ${val} €/mese di affitto, potresti comprare una casa da circa ${fmt(d.prezzoTotale)} € con rata di ${fmt(d.rata)} €/mese.`;
    d.faqs = [
      { q: `Se pago ${val} euro di affitto, che mutuo posso permettermi?`, a: `Pagare ${val} €/mese equivale, in media, a una casa da ${fmt(d.prezzoTotale)} €. Avresti un mutuo di ${fmt(d.importoMutuo)} € con rata di ${fmt(d.rata)} € a 25 anni.` },
      { q: `Conviene di più pagare ${val} di affitto o ${fmt(d.rata)} di rata mutuo?`, a: `L'acquisto richiede ${fmt(d.anticipo + d.speseAcq)} € di liquidità iniziale. Comprare conviene dopo circa ${d.breakEven || 'oltre 30'} anni.` },
      { q: `Quale stipendio serve per un mutuo equivalente a ${val} di affitto?`, a: `Per la rata di ${fmt(d.rata)} €/mese serve un netto di almeno ${fmt(Math.round(d.rata / 0.30))} €/mese, equivalente a una RAL di circa ${fmt(ralStimata)} €.` }
    ];
  } else {
    if (d.breakEven === null) {
      d.verdetto = `A ${d.cittaObj.nome} l'acquisto non raggiunge il pareggio nei 30 anni di simulazione: l'affitto resta più conveniente.`; d.verdettoColor = '#dc2626'; d.verdettoIcon = '🏃';
    } else if (d.breakEven <= 5) {
      d.verdetto = `A ${d.cittaObj.nome} comprare conviene già dopo ${d.breakEven} anni: scelta naturale per il medio periodo.`; d.verdettoColor = '#10b981'; d.verdettoIcon = '🏠';
    } else if (d.breakEven <= 10) {
      d.verdetto = `A ${d.cittaObj.nome} comprare diventa più conveniente dell'affitto dopo ${d.breakEven} anni.`; d.verdettoColor = '#f59e0b'; d.verdettoIcon = '⚖️';
    } else {
      d.verdetto = `A ${d.cittaObj.nome} il break-even arriva solo dopo ${d.breakEven} anni: l'affitto è la scelta più razionale a meno di intenzioni di lunghissimo periodo.`; d.verdettoColor = '#dc2626'; d.verdettoIcon = '🏃';
    }

    d.titleSeo = `Affitto vs Mutuo a ${d.cittaObj.nome}: dopo quanti anni conviene comprare`;
    d.descrSeo = `${d.cittaObj.nome}: 80 mq costano circa ${fmt(d.prezzoTotale)} € all'acquisto vs ${fmt(d.affittoMensile)} €/mese di affitto.`;
    d.faqs = [
      { q: `Conviene comprare casa o restare in affitto a ${d.cittaObj.nome}?`, a: d.breakEven === null ? `A ${d.cittaObj.nome} l'acquisto non raggiunge il pareggio rispetto all'affitto in 30 anni.` : `A ${d.cittaObj.nome} comprare diventa più conveniente dopo circa ${d.breakEven} anni di permanenza.` },
      { q: `Quanto costa un appartamento di 80 mq a ${d.cittaObj.nome}?`, a: `Costa mediamente ${fmt(d.cittaObj.prezzoMq)} €/mq nelle zone semicentrali. Per 80 mq significa circa ${fmt(d.prezzoTotale)} € totali.` },
      { q: `Qual è l'affitto medio a ${d.cittaObj.nome}?`, a: `Il canone medio è di ${d.cittaObj.affittoMq} €/mq al mese. Per 80 mq si arriva a circa ${fmt(d.affittoMensile)} €/mese.` }
    ];
  }

  d.faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": d.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) };
  return d;
}