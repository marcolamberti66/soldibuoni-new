import React, { useState, useMemo } from 'react';

// ============================================================================
// TROVA BONUS — Matrice di eleggibilità agevolazioni italiane 2026
// Fonti: INPS, Agenzia Entrate, ARERA, MIMIT, MIUR. Verificato aprile 2026.
// ============================================================================

const THEME = { primary: '#f59e0b', soft: '#fef3c7', bg: '#fffbeb' };

// --- ASSEGNO UNICO 2026: parametri ufficiali INPS circolare n. 7/2026 (+1,4%) ---
const AUU_2026 = {
  massimo: 203.80,      // €/mese per figlio minore, ISEE fino a ~17.444€
  minimo: 58.30,        // €/mese per figlio minore senza ISEE o ISEE > 46.582€
  soglia_max: 17444,    // ISEE per importo massimo
  soglia_min: 46582,    // ISEE oltre cui scatta solo il minimo
  magg_secondo_percettore: 34.10,  // maggiorazione se entrambi i genitori lavorano
  magg_terzo_figlio: 0.5,          // +50% sulla quota base per ogni figlio dal 3°
  magg_figlio_under3: 57           // maggiorazione media per figli <3 anni
};

// Stima AUU mensile per figlio minore (base + scala ISEE lineare)
function stimaAuuPerFiglio(isee) {
  if (isee === null || isee === undefined) return AUU_2026.minimo;
  if (isee <= AUU_2026.soglia_max) return AUU_2026.massimo;
  if (isee >= AUU_2026.soglia_min) return AUU_2026.minimo;
  // Interpolazione lineare tra soglia_max e soglia_min
  const range = AUU_2026.soglia_min - AUU_2026.soglia_max;
  const delta = isee - AUU_2026.soglia_max;
  const frac = delta / range;
  return AUU_2026.massimo - (AUU_2026.massimo - AUU_2026.minimo) * frac;
}

// Stima ISEE medio per la fascia selezionata
function iseeEstimate(fascia) {
  if (fascia === 'basso') return 12000;      // sotto 17.444 → importo massimo
  if (fascia === 'medio_basso') return 22000;
  if (fascia === 'medio') return 32000;
  if (fascia === 'medio_alto') return 42000;
  if (fascia === 'alto') return 55000;       // sopra 46.582 → importo minimo
  return null;
}

// ============================================================================
// DEFINIZIONE BONUS — matrice di eleggibilità
// ============================================================================

function generaBonus(profilo) {
  const { eta, numFigli, iseeFascia, casa, lavoro, regione } = profilo;
  const isee = iseeEstimate(iseeFascia);
  const bonus = [];

  // --- FAMIGLIA ---

  if (numFigli > 0) {
    const auuPerFiglio = stimaAuuPerFiglio(isee);
    const maggiorazione3figli = numFigli >= 3 ? AUU_2026.massimo * AUU_2026.magg_terzo_figlio * (numFigli - 2) : 0;
    const auuTotMensile = auuPerFiglio * numFigli + maggiorazione3figli;
    const auuAnnuo = auuTotMensile * 12;

    bonus.push({
      id: 'auu',
      categoria: 'Famiglia',
      nome: 'Assegno Unico Universale',
      desc: `Sostegno mensile INPS per ogni figlio a carico fino ai 21 anni.`,
      valoreStimato: auuAnnuo,
      valoreTesto: `~€${Math.round(auuTotMensile)}/mese (${numFigli} ${numFigli === 1 ? 'figlio' : 'figli'})`,
      altoValore: auuAnnuo > 1500,
      action: 'Domanda su inps.it con SPID + ISEE aggiornato',
      link: 'https://www.inps.it/it/it/dettaglio-scheda.schede-servizio-strumento.schede-servizi.assegno-unico-e-universale-per-i-figli-a-carico-50644.assegno-unico-e-universale-per-i-figli-a-carico.html',
      note: isee && isee > AUU_2026.soglia_min ? 'Senza ISEE aggiornato ricevi solo il minimo di €58,30/mese per figlio' : null
    });

    // Bonus nido
    if (numFigli > 0 && (iseeFascia === 'basso' || iseeFascia === 'medio_basso' || iseeFascia === 'medio')) {
      const valoreNido = iseeFascia === 'basso' ? 3000 : iseeFascia === 'medio_basso' ? 2500 : 1500;
      bonus.push({
        id: 'nido',
        categoria: 'Famiglia',
        nome: 'Bonus Nido',
        desc: 'Rimborso per retta asilo nido pubblico/privato per figli 0-3 anni. Importo annuo diviso in 11 mensilità.',
        valoreStimato: valoreNido,
        valoreTesto: `fino a €${valoreNido}/anno per figlio`,
        altoValore: true,
        action: 'Domanda su inps.it con SPID + documentazione retta',
        link: 'https://www.inps.it/it/it/dettaglio-scheda.schede-servizio-strumento.schede-servizi.bonus-asilo-nido-e-forme-di-supporto-presso-la-propria-abitazione-50013.html'
      });
    }

    // Carta dedicata a te
    if (iseeFascia === 'basso' || iseeFascia === 'medio_basso') {
      bonus.push({
        id: 'cartadedicata',
        categoria: 'Famiglia',
        nome: '"Carta Dedicata a Te"',
        desc: 'Carta prepagata MIMIT per acquisto beni di prima necessità per famiglie ISEE fino a 15.000€ (fondi limitati, graduatorie comunali).',
        valoreStimato: 500,
        valoreTesto: '~€500 una tantum',
        altoValore: false,
        action: 'Assegnazione automatica da INPS/Comune (no domanda)',
        link: 'https://www.lavoro.gov.it/temi-e-priorita/poverta-ed-esclusione-sociale/focus-on/Carta-solidale/Pagine/default.aspx'
      });
    }
  }

  // --- CASA ---

  if (eta < 36 && (casa === 'cerca' || casa === 'mutuo') && (iseeFascia !== 'alto')) {
    bonus.push({
      id: 'mutuounder36',
      categoria: 'Casa',
      nome: 'Mutuo Prima Casa Under 36',
      desc: 'Esenzione imposte di registro/ipotecaria/catastale + garanzia statale Consap fino all\'80% + detrazione. Richiede ISEE ≤ 40.000€.',
      valoreStimato: 8000,
      valoreTesto: 'Risparmio ~€5.000-10.000 una tantum',
      altoValore: true,
      action: 'Si attiva in sede di rogito notarile e al momento del mutuo',
      link: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/agevolazioni/agevolazioni-prima-casa-under-36'
    });
  }

  if (casa === 'proprieta' || casa === 'mutuo') {
    bonus.push({
      id: 'ristrutturazione',
      categoria: 'Casa',
      nome: 'Bonus Ristrutturazione 50%',
      desc: 'Detrazione IRPEF del 50% su interventi edilizi, diluita in 10 anni. Tetto 96.000€ per unità immobiliare.',
      valoreStimato: 3000,
      valoreTesto: '50% detraibile in 10 anni',
      altoValore: true,
      action: 'Bonifico parlante + dichiarazione dei redditi',
      link: 'https://www.agenziaentrate.gov.it/portale/web/guest/agevolazioni/ristrutturazioni-edilizie'
    });

    bonus.push({
      id: 'ecobonus',
      categoria: 'Casa',
      nome: 'Ecobonus 50-65%',
      desc: 'Detrazione per interventi di efficientamento energetico (caldaia, serramenti, cappotto, solare termico).',
      valoreStimato: 2500,
      valoreTesto: '50-65% detraibile in 10 anni',
      altoValore: true,
      action: 'Comunicazione ENEA entro 90 giorni + dichiarazione redditi',
      link: 'https://www.agenziaentrate.gov.it/portale/web/guest/agevolazioni/detrazione-riqualificazione-energetica-55-privati'
    });
  }

  if (casa === 'affitto' && (iseeFascia === 'basso' || iseeFascia === 'medio_basso')) {
    bonus.push({
      id: 'canone',
      categoria: 'Casa',
      nome: 'Detrazione Canone di Locazione',
      desc: 'Detrazione IRPEF per inquilini con contratto registrato. Importo variabile in base a reddito e tipo contratto (libero/concordato/studenti).',
      valoreStimato: 300,
      valoreTesto: '€150-992 detraibile/anno',
      altoValore: false,
      action: 'Inserimento in dichiarazione redditi con codice contratto',
      link: 'https://www.agenziaentrate.gov.it/portale/detrazione-canoni-di-locazione'
    });
  }

  // --- BOLLETTE ---

  if (iseeFascia === 'basso') {
    bonus.push({
      id: 'bonusluce',
      categoria: 'Bollette',
      nome: 'Bonus Sociale Luce',
      desc: 'Sconto automatico in bolletta luce per ISEE fino a 9.530€ (o 20.000€ con 4+ figli). Assegnato automaticamente dall\'INPS ad ARERA.',
      valoreStimato: 170,
      valoreTesto: '~€170/anno sconto',
      altoValore: false,
      action: 'Automatico — serve solo ISEE aggiornato',
      link: 'https://www.arera.it/consumatori/bonus-sociale/come-funziona'
    });

    bonus.push({
      id: 'bonusgas',
      categoria: 'Bollette',
      nome: 'Bonus Sociale Gas',
      desc: 'Sconto automatico in bolletta gas per famiglie con ISEE ≤ 9.530€. Cumulabile con il bonus luce.',
      valoreStimato: 130,
      valoreTesto: '~€130/anno sconto',
      altoValore: false,
      action: 'Automatico — serve solo ISEE aggiornato',
      link: 'https://www.arera.it/consumatori/bonus-sociale/come-funziona'
    });
  }

  // --- LAVORO/FISCO ---

  if (lavoro === 'piva' || lavoro === 'piva_nuova') {
    if (lavoro === 'piva_nuova') {
      bonus.push({
        id: 'forfettariostartup',
        categoria: 'Fisco',
        nome: 'Forfettario Startup 5%',
        desc: 'Imposta sostitutiva del 5% per i primi 5 anni di attività, se nuova P.IVA che non continua un lavoro precedente. Soglia €85.000 fatturato.',
        valoreStimato: 5000,
        valoreTesto: 'Risparmio 10-30% su IRPEF ordinaria',
        altoValore: true,
        action: 'Apertura P.IVA in forfettario con coefficiente ATECO',
        link: 'https://www.agenziaentrate.gov.it/portale/web/guest/regime-forfetario'
      });
    } else {
      bonus.push({
        id: 'forfettario',
        categoria: 'Fisco',
        nome: 'Regime Forfettario 15%',
        desc: 'Imposta sostitutiva 15% su base forfettaria (coefficiente ATECO), in luogo di IRPEF progressiva. Soglia €85.000.',
        valoreStimato: 3000,
        valoreTesto: 'Risparmio variabile 10-25%',
        altoValore: true,
        action: 'Adesione in apertura P.IVA o da gennaio anno successivo',
        link: 'https://www.agenziaentrate.gov.it/portale/web/guest/regime-forfetario'
      });
    }
  }

  // --- GIOVANI ---

  if (eta >= 18 && eta <= 35) {
    bonus.push({
      id: 'cartagiovani',
      categoria: 'Giovani',
      nome: 'Carta Giovani Nazionale',
      desc: 'Carta digitale per ragazzi 18-35 anni con sconti su trasporti, cultura, sport, servizi e ristorazione presso esercenti convenzionati.',
      valoreStimato: 200,
      valoreTesto: 'Sconti variabili',
      altoValore: false,
      action: 'Attivazione gratuita su app IO con SPID',
      link: 'https://giovani2030.it/iniziativa/carta-giovani-nazionale/'
    });
  }

  // --- DICHIARAZIONE REDDITI GENERICA ---
  if (lavoro === 'dipendente' || lavoro === 'pensionato') {
    bonus.push({
      id: 'detrazioni',
      categoria: 'Fisco',
      nome: 'Detrazioni in dichiarazione redditi',
      desc: 'Ricorda di portare in detrazione: spese mediche 19%, mutuo prima casa 19%, fondo pensione (deducibile fino a €5.164), ristrutturazioni, ecobonus, sport bambini, rette asilo.',
      valoreStimato: 1000,
      valoreTesto: 'Recupero medio €500-2.000/anno',
      altoValore: true,
      action: 'Conservare ricevute e includerle nel 730 o nel modello redditi',
      link: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/dichiarazioni/dichiarazione-dei-redditi-persone-fisiche-730/infogen-chi-puo-utilizzare-il-modello-730'
    });
  }

  // --- CONTRIBUTI FONDO PENSIONE ---
  if (lavoro === 'dipendente' || lavoro === 'piva' || lavoro === 'piva_nuova') {
    bonus.push({
      id: 'fondopensione',
      categoria: 'Fisco',
      nome: 'Deduzione fondo pensione',
      desc: 'Versamenti al fondo pensione deducibili dal reddito IRPEF fino a €5.164,57/anno. Risparmio fiscale pari all\'aliquota marginale (23%-43%).',
      valoreStimato: 800,
      valoreTesto: 'Fino a €2.200/anno recuperati',
      altoValore: true,
      action: 'Adesione a fondo pensione + versamenti volontari',
      link: 'https://www.covip.it/per-il-cittadino'
    });
  }

  return bonus;
}

// Ordina per (alto valore desc, valore stimato desc)
function ordinaBonus(lista) {
  return [...lista].sort((a, b) => {
    if (a.altoValore !== b.altoValore) return b.altoValore - a.altoValore;
    return (b.valoreStimato || 0) - (a.valoreStimato || 0);
  });
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function TrovaBonus({ color }) {
  const [step, setStep] = useState(1);
  const [profilo, setProfilo] = useState({
    eta: 35,
    numFigli: 0,
    iseeFascia: 'medio',
    casa: 'affitto',
    lavoro: 'dipendente',
    regione: ''
  });

  const t = THEME;
  const themeColor = color || t.primary;

  const bonusTrovati = useMemo(() => ordinaBonus(generaBonus(profilo)), [profilo]);
  const totaleStimato = bonusTrovati.reduce((acc, b) => acc + (b.valoreStimato || 0), 0);

  const cardBase = {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24,
    padding: '32px 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 800, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10
  };

  // Raggruppa per categoria
  const bonusPerCategoria = useMemo(() => {
    const groups = {};
    bonusTrovati.forEach(b => {
      if (!groups[b.categoria]) groups[b.categoria] = [];
      groups[b.categoria].push(b);
    });
    return groups;
  }, [bonusTrovati]);

  const categoryIcons = {
    'Famiglia': '👨‍👩‍👧',
    'Casa': '🏠',
    'Bollette': '⚡',
    'Fisco': '📋',
    'Giovani': '🎓'
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====================================================================
          STEP 1: QUESTIONARIO
          ==================================================================== */}
      {step === 1 && (
        <div style={{ ...cardBase, marginBottom: 24 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22, fontWeight: 800, color: '#0f172a',
            margin: '0 0 6px', letterSpacing: '-0.01em'
          }}>
            Il tuo profilo
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
            Rispondi a 5 domande anonime. I dati non vengono salvati: la stima è calcolata solo nel tuo browser.
          </p>

          {/* ETÀ */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>La tua età: <strong style={{ color: themeColor, marginLeft: 8 }}>{profilo.eta} anni</strong></label>
            <input
              type="range" min={18} max={75}
              value={profilo.eta}
              onChange={(e) => setProfilo({ ...profilo, eta: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: themeColor }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              <span>18</span><span>75</span>
            </div>
          </div>

          {/* FIGLI */}
          <div style={{ marginBottom: 24 }}>
            <style dangerouslySetInnerHTML={{__html:`
              .tb-figli { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; }
              .tb-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:6px; }
              @media(max-width:500px){
                .tb-figli button { padding:10px 4px !important; font-size:14px !important; }
                .tb-grid { grid-template-columns:repeat(2,1fr) !important; }
                .tb-grid button { padding:8px 6px !important; font-size:11px !important; }
                .tb-grid button > div:first-child { font-size:12px !important; }
              }
            `}}/>
            <label style={labelStyle}>
              Numero di figli a carico
            </label>
            <div className="tb-figli">
              {[0, 1, 2, 3, 4].map(n => {
                const active = profilo.numFigli === n;
                return (
                  <button
                    key={n}
                    onClick={() => setProfilo({ ...profilo, numFigli: n })}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 12,
                      border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                      background: active ? t.soft : '#fff',
                      color: active ? '#0f172a' : '#64748b',
                      fontSize: 15, fontWeight: 800, cursor: 'pointer',
                      transition: 'all 0.2s', fontFamily: 'inherit'
                    }}
                  >
                    {n === 4 ? '4+' : n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ISEE */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>
              Fascia ISEE stimata (indicatore reddituale famiglia)
            </label>
            <div className="tb-grid">
              {[
                { id: 'basso', label: 'Basso', sub: '≤ €15.000' },
                { id: 'medio_basso', label: 'Medio-basso', sub: '€15k-25k' },
                { id: 'medio', label: 'Medio', sub: '€25k-40k' },
                { id: 'medio_alto', label: 'Medio-alto', sub: '€40k-50k' },
                { id: 'alto', label: 'Alto', sub: '> €50k' }
              ].map(f => {
                const active = profilo.iseeFascia === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setProfilo({ ...profilo, iseeFascia: f.id })}
                    style={{
                      padding: '10px 12px', borderRadius: 12,
                      border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                      background: active ? t.soft : '#fff',
                      color: active ? '#0f172a' : '#64748b',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      lineHeight: 1.3, textAlign: 'left', fontFamily: 'inherit'
                    }}
                  >
                    <div>{f.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 500, marginTop: 2 }}>{f.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CASA */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Situazione abitativa</label>
            <div className="tb-grid">
              {[
                { id: 'proprieta', label: 'Proprietario', icon: '🏡' },
                { id: 'mutuo', label: 'Ho un mutuo', icon: '🏦' },
                { id: 'affitto', label: 'In affitto', icon: '🔑' },
                { id: 'cerca', label: 'Cerco casa', icon: '🔍' },
                { id: 'altro', label: 'Altro', icon: '📍' }
              ].map(c => {
                const active = profilo.casa === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setProfilo({ ...profilo, casa: c.id })}
                    style={{
                      padding: '10px 12px', borderRadius: 12,
                      border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                      background: active ? t.soft : '#fff',
                      color: active ? '#0f172a' : '#64748b',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    <span style={{ marginRight: 6 }}>{c.icon}</span>{c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LAVORO */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Situazione lavorativa</label>
            <div className="tb-grid">
              {[
                { id: 'dipendente', label: 'Dipendente', icon: '💼' },
                { id: 'piva', label: 'Partita IVA', icon: '📊' },
                { id: 'piva_nuova', label: 'P.IVA < 5 anni', icon: '🚀' },
                { id: 'pensionato', label: 'Pensionato', icon: '👴' },
                { id: 'disoccupato', label: 'Disoccupato', icon: '📝' },
                { id: 'studente', label: 'Studente', icon: '🎓' }
              ].map(l => {
                const active = profilo.lavoro === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setProfilo({ ...profilo, lavoro: l.id })}
                    style={{
                      padding: '10px 12px', borderRadius: 12,
                      border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                      background: active ? t.soft : '#fff',
                      color: active ? '#0f172a' : '#64748b',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    <span style={{ marginRight: 6 }}>{l.icon}</span>{l.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            style={{
              width: '100%', padding: '14px 20px',
              background: themeColor, color: '#fff',
              border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 8px 20px -4px ${themeColor}60`,
              transition: 'all 0.2s'
            }}
          >
            Mostrami i bonus a cui ho diritto →
          </button>
        </div>
      )}

      {/* ====================================================================
          STEP 2: RISULTATI
          ==================================================================== */}
      {step === 2 && (
        <>
          {/* Riepilogo + indietro */}
          <div style={{ ...cardBase, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{
                  display: 'inline-block', padding: '4px 10px',
                  background: t.soft, color: '#92400e',
                  borderRadius: 6, fontSize: 10, fontWeight: 800,
                  letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8
                }}>
                  ✓ Analisi completata
                </div>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22, fontWeight: 800, color: '#0f172a',
                  margin: '0 0 6px'
                }}>
                  {bonusTrovati.length} agevolazioni potenzialmente compatibili
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Valore cumulato stimato: <strong style={{ color: themeColor }}>~€{Math.round(totaleStimato).toLocaleString('it-IT')}/anno</strong> (annuo o una tantum a seconda del bonus)
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '8px 14px', borderRadius: 10,
                  border: '1px solid #cbd5e1', background: '#fff',
                  color: '#64748b', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer'
                }}
              >← Modifica profilo</button>
            </div>
          </div>

          {/* Lista per categoria */}
          {Object.keys(bonusPerCategoria).length === 0 ? (
            <div style={{ ...cardBase, textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Nessun bonus trovato per questo profilo
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                Prova a modificare le risposte: i bonus dipendono molto da età, figli e situazione abitativa
              </div>
            </div>
          ) : (
            Object.entries(bonusPerCategoria).map(([cat, list]) => (
              <div key={cat} style={{ marginBottom: 24 }}>
                <h3 style={{
                  fontSize: 14, fontWeight: 800, color: '#475569',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  margin: '0 0 14px'
                }}>
                  <span style={{ marginRight: 8, fontSize: 16 }}>{categoryIcons[cat] || '📌'}</span>
                  {cat}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {list.map(b => (
                    <div key={b.id} style={{
                      background: '#fff',
                      border: b.altoValore ? `2px solid ${themeColor}` : '1px solid #e2e8f0',
                      borderRadius: 20,
                      padding: '20px 24px',
                      boxShadow: b.altoValore ? `0 16px 32px -12px ${themeColor}25` : '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', marginBottom: 12
                      }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{b.nome}</span>
                            {b.altoValore && (
                              <span style={{
                                fontSize: 9, fontWeight: 900,
                                background: themeColor, color: '#fff',
                                padding: '2px 8px', borderRadius: 10,
                                letterSpacing: '0.05em'
                              }}>⭐ ALTO VALORE</span>
                            )}
                          </div>
                          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 8px', lineHeight: 1.6 }}>
                            {b.desc}
                          </p>
                        </div>
                        <div style={{
                          textAlign: 'right',
                          padding: '8px 14px',
                          background: t.soft, borderRadius: 10,
                          minWidth: 140
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                            Valore
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#78350f', lineHeight: 1.3 }}>
                            {b.valoreTesto}
                          </div>
                        </div>
                      </div>

                      {b.note && (
                        <div style={{
                          padding: '8px 12px', background: '#fffbeb',
                          borderRadius: 8, fontSize: 11,
                          color: '#92400e', marginBottom: 10,
                          border: '1px solid #fbbf24'
                        }}>
                          ⚠️ {b.note}
                        </div>
                      )}

                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', gap: 10, flexWrap: 'wrap',
                        paddingTop: 12, borderTop: '1px dashed #e2e8f0'
                      }}>
                        <div style={{ fontSize: 12, color: '#64748b', flex: 1 }}>
                          <strong style={{ color: '#475569' }}>Come fare:</strong> {b.action}
                        </div>
                        <a
                          href={b.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '8px 14px', borderRadius: 10,
                            background: '#f8fafc', color: themeColor,
                            border: `1px solid ${themeColor}40`,
                            fontSize: 12, fontWeight: 800,
                            textDecoration: 'none', whiteSpace: 'nowrap'
                          }}
                        >
                          Fonte istituzionale →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ====================================================================
          DISCLAIMER FINALE
          ==================================================================== */}
      <div style={{
        marginTop: 40, padding: '20px 24px',
        background: '#f8fafc', borderRadius: 16,
        border: '1px solid #e2e8f0',
        fontSize: 11, color: '#64748b', lineHeight: 1.7
      }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, fontSize: 12 }}>
          ⚠️ Disclaimer e nota metodologica
        </div>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Strumento informativo, non sostituisce CAF né patronato.</strong> SoldiBuoni non è né un Centro di Assistenza Fiscale né un patronato. Questo strumento fornisce una prima indicazione orientativa dei bonus potenzialmente compatibili con il tuo profilo, basata su regole semplificate. L'eleggibilità reale dipende da requisiti specifici (ISEE esatto, cause ostative, situazione familiare dettagliata) che vanno verificati caso per caso.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Importi stimati e non vincolanti.</strong> Tutti i valori indicati sono stime calcolate su parametri medi e fasce ISEE. Gli importi reali dei bonus dipendono dall'ISEE puntuale (non dalla fascia), dal numero e età dei figli, dalla composizione del nucleo, dalle maggiorazioni spettanti. Per la cifra esatta rivolgiti a un CAF o calcola i singoli bonus sui portali ufficiali.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Parametri 2026.</strong> Soglie ISEE, importi e aliquote sono aggiornati alla Legge di Bilancio 2026 e alle circolari INPS/ARERA/Agenzia Entrate pubblicate fino ad aprile 2026. Alcuni bonus (Carta Dedicata a Te, bandi regionali) sono a risorse limitate e seguono graduatorie: la loro disponibilità non è garantita.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Come verificare.</strong> Prima di fare domanda consulta sempre il sito ufficiale del bonus (link "Fonte istituzionale" in ogni scheda), calcola l'ISEE aggiornato su inps.it, e se hai dubbi rivolgiti gratuitamente a un CAF o a un patronato convenzionato.
        </p>
      </div>

    </div>
  );
}