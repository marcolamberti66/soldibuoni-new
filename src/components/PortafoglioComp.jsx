import React, { useState, useMemo } from 'react';

// ============================================================================
// PORTAFOGLIO COMP — Costruttore di Asset Allocation didattico
// Usa dati storici MSCI World, obbligazionari aggregati UE, liquidità BCE
// Mostra banda di confidenza, TER, costi nel tempo. Nessuna raccomandazione.
// ============================================================================

const THEME = { primary: '#3b82f6', soft: '#dbeafe', bg: '#eff6ff' };

// Dati storici asset class (rendimento annuo medio + deviazione standard)
// Fonti: MSCI World 1987-2025 (~8%/anno + 17% vol), BBG Global Agg EUR hedged 1999-2025 (~2,5% + 5% vol)
// Liquidità conti: tasso BCE medio 15 anni ~1%
const ASSET_CLASSES = {
  azionarioGlobale: { label: 'Azionario globale sviluppato', ret: 0.080, vol: 0.170, ter: 0.0020, etfExample: 'IWDA (IE00B4L5Y983), VWCE (IE00BK5BQT80), SPYL (IE000XZSV718)' },
  azionarioEmergenti: { label: 'Azionario mercati emergenti', ret: 0.070, vol: 0.220, ter: 0.0018, etfExample: 'EIMI (IE00BKM4GZ66), VFEM (IE00B3VVMM84)' },
  obbligazioniGovUE: { label: 'Obbligazioni governative EUR', ret: 0.025, vol: 0.050, ter: 0.0015, etfExample: 'IEGA (IE00B3FH7618), IBGL (IE00B1FZS798)' },
  obbligazioniCorp: { label: 'Obbligazioni corporate EUR', ret: 0.035, vol: 0.070, ter: 0.0020, etfExample: 'IEAC (IE00B3F81R35), VECP (IE00BGYWT403)' },
  liquidita: { label: 'Liquidità (conto deposito, BTP brevi)', ret: 0.020, vol: 0.005, ter: 0.0, etfExample: 'Conto deposito vincolato, BTP 6-12 mesi' }
};

// Tre portafogli modello per orizzonte / profilo rischio
// Pesi in %: somma sempre 100
const PORTAFOGLI = {
  conservativo: {
    label: 'Conservativo',
    descrizione: 'Obiettivo: proteggere il capitale battendo l\'inflazione, bassa volatilità',
    pesi: { azionarioGlobale: 20, azionarioEmergenti: 0, obbligazioniGovUE: 50, obbligazioniCorp: 20, liquidita: 10 },
    drawdownMax: 0.12,
    adatto: 'Orizzonte 1-5 anni, intolleranza al rischio alta'
  },
  bilanciato: {
    label: 'Bilanciato',
    descrizione: 'Compromesso crescita/protezione, volatilità moderata',
    pesi: { azionarioGlobale: 45, azionarioEmergenti: 5, obbligazioniGovUE: 25, obbligazioniCorp: 20, liquidita: 5 },
    drawdownMax: 0.25,
    adatto: 'Orizzonte 5-10 anni, tolleranza al rischio media'
  },
  aggressivo: {
    label: 'Aggressivo',
    descrizione: 'Massimizzazione crescita di lungo periodo, tolleranza volatilità alta',
    pesi: { azionarioGlobale: 75, azionarioEmergenti: 15, obbligazioniGovUE: 5, obbligazioniCorp: 5, liquidita: 0 },
    drawdownMax: 0.45,
    adatto: 'Orizzonte 10+ anni, tolleranza al rischio alta'
  }
};

const INFLAZIONE_ATTESA = 0.020; // 2% target BCE
const TASSAZIONE_CAPITAL_GAIN = 0.26; // 26% su ETF azionari e obbligazionari non governativi italiani

// ============================================================================

function calcolaRendimentoPortafoglio(pesi) {
  let retAtteso = 0;
  let volAttesa = 0;
  let terMedio = 0;
  Object.entries(pesi).forEach(([k, p]) => {
    const asset = ASSET_CLASSES[k];
    retAtteso += (p / 100) * asset.ret;
    volAttesa += Math.pow((p / 100) * asset.vol, 2); // approx senza correlazioni
    terMedio += (p / 100) * asset.ter;
  });
  volAttesa = Math.sqrt(volAttesa);
  return { retAtteso, volAttesa, terMedio };
}

// Simulazione "fan chart": stima 10°, 50°, 90° percentile del risultato finale
// Calcolo chiuso usando lognormale: mediano, +/- 1.28 * sigma * sqrt(t) per 80% CI
function simulazione(iniziale, pacMese, anni, retAnnuo, volAnnua, ter) {
  const retNetto = retAnnuo - ter;
  const pacAnnuo = pacMese * 12;

  // Mediano/atteso: formula serie geometrica
  let capitaleMediano = iniziale;
  let versato = iniziale;
  const curvaMediano = [{ anno: 0, valore: iniziale, versato }];

  for (let i = 1; i <= anni; i++) {
    capitaleMediano = (capitaleMediano + pacAnnuo) * (1 + retNetto);
    versato += pacAnnuo;
    curvaMediano.push({ anno: i, valore: capitaleMediano, versato });
  }

  // Banda 80%: applichiamo fattore lognormale approssimato
  // sigma_cumulata = vol * sqrt(anni), z_80 = 1.28
  const sigmaCumul = volAnnua * Math.sqrt(anni);
  const fattoreInf = Math.exp(-1.28 * sigmaCumul);
  const fattoreSup = Math.exp(+1.28 * sigmaCumul);

  const valoreFinale = curvaMediano[anni].valore;
  const versatoTot = curvaMediano[anni].versato;
  const guadagno = valoreFinale - versatoTot;
  const tasse = Math.max(0, guadagno) * TASSAZIONE_CAPITAL_GAIN;
  const nettoPostTasse = valoreFinale - tasse;

  // Potere d'acquisto aggiustato inflazione (valore reale)
  const poterePerduto = Math.pow(1 + INFLAZIONE_ATTESA, anni);
  const valoreReale = nettoPostTasse / poterePerduto;

  // Banda 80%
  const finaleInf = valoreFinale * fattoreInf;
  const finaleSup = valoreFinale * fattoreSup;

  // Costo TER cumulato stimato (su capitale medio)
  const capitaleMedio = (iniziale + valoreFinale) / 2;
  const costoTER = capitaleMedio * ter * anni;

  return {
    curvaMediano,
    versatoTot: Math.round(versatoTot),
    valoreFinaleNominale: Math.round(valoreFinale),
    nettoPostTasse: Math.round(nettoPostTasse),
    valoreReale: Math.round(valoreReale),
    finaleInf: Math.round(finaleInf),
    finaleSup: Math.round(finaleSup),
    guadagno: Math.round(guadagno),
    tasse: Math.round(tasse),
    costoTER: Math.round(costoTER)
  };
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function PortafoglioComp({ color = '#3b82f6' }) {
  const [profilo, setProfilo] = useState('bilanciato');
  const [iniziale, setIniziale] = useState(10000);
  const [pacMese, setPacMese] = useState(300);
  const [anni, setAnni] = useState(15);

  const t = THEME;
  const themeColor = color || t.primary;

  const porta = PORTAFOGLI[profilo];
  const { retAtteso, volAttesa, terMedio } = useMemo(
    () => calcolaRendimentoPortafoglio(porta.pesi),
    [profilo, porta.pesi]
  );

  const sim = useMemo(
    () => simulazione(iniziale, pacMese, anni, retAtteso, volAttesa, terMedio),
    [iniziale, pacMese, anni, retAtteso, volAttesa, terMedio]
  );

  const cardBase = {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24,
    padding: '32px 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 800, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10
  };
  const formatEuro = (v) => `€ ${Math.round(v).toLocaleString('it-IT')}`;
  const formatPerc = (v, d = 1) => `${(v * 100).toFixed(d)}%`;

  const pesiSorted = Object.entries(porta.pesi)
    .filter(([k, p]) => p > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====================================================================
          INPUT
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22, fontWeight: 800, color: '#0f172a',
          margin: '0 0 6px', letterSpacing: '-0.01em'
        }}>
          Costruisci il tuo portafoglio modello
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
          Scegli profilo di rischio, orizzonte temporale e importo. Vedrai l'asset allocation, il rendimento atteso sui dati storici e una banda di confidenza 80% basata sulla volatilità storica.
        </p>

        {/* Profilo rischio */}
        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>Profilo di rischio</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
            {Object.entries(PORTAFOGLI).map(([key, p]) => {
              const active = profilo === key;
              return (
                <button
                  key={key}
                  onClick={() => setProfilo(key)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                    background: active ? t.bg : '#fff',
                    color: active ? '#0f172a' : '#64748b',
                    cursor: 'pointer', textAlign: 'left',
                    lineHeight: 1.4
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>{p.adatto}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orizzonte */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <label style={labelStyle}>Orizzonte temporale</label>
            <span style={{ fontSize: 18, fontWeight: 900, color: themeColor, fontVariantNumeric: 'tabular-nums' }}>
              {anni} anni
            </span>
          </div>
          <input
            type="range" min={1} max={40} step={1}
            value={anni} onChange={(e) => setAnni(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: themeColor }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            <span>1 anno</span><span>40 anni</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label style={labelStyle}>Capitale iniziale</label>
              <span style={{ fontSize: 16, fontWeight: 900, color: themeColor, fontVariantNumeric: 'tabular-nums' }}>
                {formatEuro(iniziale)}
              </span>
            </div>
            <input
              type="range" min={0} max={500000} step={1000}
              value={iniziale} onChange={(e) => setIniziale(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: themeColor }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label style={labelStyle}>Versamento mensile (PAC)</label>
              <span style={{ fontSize: 16, fontWeight: 900, color: themeColor, fontVariantNumeric: 'tabular-nums' }}>
                {formatEuro(pacMese)}
              </span>
            </div>
            <input
              type="range" min={0} max={3000} step={50}
              value={pacMese} onChange={(e) => setPacMese(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: themeColor }}
            />
          </div>

        </div>
      </div>

      {/* ====================================================================
          ASSET ALLOCATION VISUALE
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 18, fontWeight: 800, color: '#0f172a',
          margin: '0 0 4px', letterSpacing: '-0.01em'
        }}>
          Asset allocation — {porta.label}
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
          {porta.descrizione}
        </p>

        {/* Stacked bar */}
        <div style={{
          display: 'flex', width: '100%', height: 32,
          borderRadius: 8, overflow: 'hidden', marginBottom: 14,
          border: '1px solid #e2e8f0'
        }}>
          {pesiSorted.map(([k, peso], i) => {
            const colori = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#64748b'];
            return (
              <div
                key={k}
                style={{
                  width: `${peso}%`,
                  background: colori[i] || '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 11, fontWeight: 800
                }}
                title={`${ASSET_CLASSES[k].label}: ${peso}%`}
              >
                {peso >= 8 ? `${peso}%` : ''}
              </div>
            );
          })}
        </div>

        {/* Lista dettagliata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pesiSorted.map(([k, peso], i) => {
            const asset = ASSET_CLASSES[k];
            const colori = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#64748b'];
            return (
              <div key={k} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 14px',
                background: '#f8fafc', borderRadius: 12
              }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: colori[i] || '#94a3b8',
                  marginTop: 4, flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3, gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{asset.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{peso}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                    Rendimento storico medio <strong>{formatPerc(asset.ret)}</strong> · volatilità <strong>{formatPerc(asset.vol, 0)}</strong> · TER medio ETF <strong>{formatPerc(asset.ter, 2)}</strong>
                    {asset.etfExample && (
                      <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                        Esempi ETF UCITS: {asset.etfExample}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Riepilogo portafoglio */}
        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: t.bg, borderRadius: 12,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>
              Rendimento atteso
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: themeColor, fontVariantNumeric: 'tabular-nums' }}>
              {formatPerc(retAtteso)} / anno
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>
              Volatilità storica
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {formatPerc(volAttesa, 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>
              TER medio
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {formatPerc(terMedio, 2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>
              Drawdown max storico
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
              −{formatPerc(porta.drawdownMax, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SIMULAZIONE / FAN CHART
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20, fontWeight: 800, color: '#0f172a',
          margin: '0 0 4px', letterSpacing: '-0.01em'
        }}>
          Dopo {anni} anni, potresti avere...
        </h3>
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
          Simulazione basata sui rendimenti storici delle asset class selezionate e sulla volatilità cumulata. La banda di confidenza 80% indica l'intervallo in cui il risultato finale cadrà nell'80% degli scenari storicamente plausibili.
        </p>

        {/* Hero number — valore mediano nominale */}
        <div style={{
          background: `linear-gradient(135deg, ${themeColor}12, ${themeColor}04)`,
          border: `2px solid ${themeColor}40`,
          borderRadius: 20, padding: '24px', marginBottom: 24, textAlign: 'center'
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Valore atteso (mediano, nominale)
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 44, fontWeight: 900, color: themeColor,
            lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums'
          }}>
            {formatEuro(sim.valoreFinaleNominale)}
          </div>
          <div style={{ fontSize: 12, color: '#475569' }}>
            Banda 80%: <strong>{formatEuro(sim.finaleInf)}</strong> — <strong>{formatEuro(sim.finaleSup)}</strong>
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <BreakdownCell label="Versato totale" value={formatEuro(sim.versatoTot)} sub="Capitale iniziale + PAC cumulato" />
          <BreakdownCell label="Guadagno nominale" value={formatEuro(sim.guadagno)} sub="Valore finale − Versato" color="#059669" />
          <BreakdownCell label="Tasse capital gain (26%)" value={`− ${formatEuro(sim.tasse)}`} sub="Su ETF, al momento della vendita" color="#dc2626" />
          <BreakdownCell label="Costi TER cumulati" value={`− ${formatEuro(sim.costoTER)}`} sub="Stima su capitale medio" color="#dc2626" />
          <BreakdownCell label="Netto post tasse" value={formatEuro(sim.nettoPostTasse)} sub="Quello che incassi davvero" color={themeColor} strong />
          <BreakdownCell label="Valore reale (post inflazione 2%)" value={formatEuro(sim.valoreReale)} sub="Potere d'acquisto di oggi" color="#78350f" strong />
        </div>

      </div>

      {/* ====================================================================
          NOTA METODOLOGICA
          ==================================================================== */}
      <div style={{
        padding: '16px 20px', background: '#fffbeb',
        border: '1px solid #fbbf24', borderRadius: 14,
        fontSize: 12, color: '#78350f', lineHeight: 1.7, marginBottom: 24
      }}>
        <strong style={{ color: '#92400e', display: 'block', marginBottom: 6 }}>
          ⓘ Come leggere questi numeri
        </strong>
        Il rendimento atteso è calcolato sulla media storica delle asset class (MSCI World dal 1987, obbligazionari aggregati dagli anni '90): <strong>performance passate non garantiscono performance future</strong>. La banda 80% è una semplificazione che usa volatilità cumulata: nella realtà storica ci sono stati drawdown del 40-50% sull'azionario globale (2008, 2020) e nel 20% degli scenari la performance può essere fuori banda. <strong>Il valore reale</strong> (post-inflazione 2%) è il numero che conta davvero: €100.000 tra 20 anni varranno circa €67.000 di oggi — quindi un investimento che "raddoppia" nominale ma non batte l'inflazione non ti ha arricchito.
      </div>

      {/* ====================================================================
          DISCLAIMER LEGALE — RAFFORZATO PER INVESTIMENTI
          ==================================================================== */}
      <div style={{
        padding: '20px 24px', background: '#f8fafc',
        border: '2px solid #e2e8f0', borderRadius: 16,
        fontSize: 11, color: '#64748b', lineHeight: 1.7
      }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, fontSize: 12 }}>
          ⚠️ Disclaimer legale — leggere con attenzione
        </div>
        <p style={{ margin: '0 0 8px' }}>
          <strong>SoldiBuoni NON è un consulente finanziario autorizzato.</strong> SoldiBuoni non è iscritto all'Albo Unico dei Consulenti Finanziari (OCF) né è autorizzato CONSOB alla prestazione di servizi di investimento o di consulenza finanziaria ai sensi del TUF (D.Lgs. 58/1998). Questo strumento è esclusivamente di natura <strong>informativa ed educativa</strong>: illustra il funzionamento generale dei portafogli di investimento su basi di dati pubblici, ma NON costituisce consulenza finanziaria personalizzata, né sollecitazione al pubblico risparmio, né raccomandazione d'investimento su strumenti finanziari specifici.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Le performance passate non sono indicative di quelle future.</strong> I rendimenti storici mostrati (~8% annuo MSCI World, ~2,5% obbligazionari EUR) sono medie di lungo periodo che includono bull market e bear market. Nulla garantisce che si ripetano. Il capitale investito in strumenti finanziari è soggetto a <strong>rischio di perdita anche totale</strong>. Le obbligazioni governative di paesi in difficoltà possono subire ristrutturazioni; i mercati azionari hanno storicamente avuto crolli del 40-50% in singoli anni (2008, 2020). Un investimento a 1-3 anni in un portafoglio aggressivo può chiudere in perdita anche significativa.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Gli ETF citati sono esempi didattici, non raccomandazioni.</strong> I nomi (IWDA, VWCE, EIMI, IEGA ecc.) e i codici ISIN sono riportati come riferimento per capire quali strumenti reali corrispondono alle asset class analizzate. La loro menzione non costituisce consiglio d'acquisto né giudizio sulla loro adeguatezza al tuo profilo specifico. Prima di investire, leggi sempre il KID (Key Information Document) e il Prospetto informativo dello strumento, disponibili sul sito dell'emittente e su Borsa Italiana.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Fiscalità semplificata.</strong> Il calcolo applica capital gain 26% forfettario al momento della vendita: in realtà le obbligazioni governative italiane ed equivalenti (OCSE whitelist) sono tassate al 12,5%, i PIR Ordinari al 0% dopo 5 anni, e ETF detenuti in regime amministrato seguono meccanismi di tassazione specifici che possono differire. Non è considerato l'impatto delle commissioni di piattaforma (conto titoli, bonifico, eseguito di borsa), che variano ampiamente tra broker.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Rivolgiti a un consulente finanziario iscritto all'Albo OCF</strong> (albo.consob.it) per decisioni di investimento personalizzate. In alternativa, valuta un consulente autonomo (indipendente da reti commerciali) iscritto all'OCF Sez. Autonoma: addebita una parcella ma non percepisce commissioni sui prodotti, garantendo assenza di conflitto di interessi.
        </p>
      </div>

    </div>
  );
}

// --- Helper ---
function BreakdownCell({ label, value, sub, color = '#0f172a', strong = false }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: '#f8fafc', borderRadius: 12,
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: strong ? 18 : 16, fontWeight: strong ? 900 : 800, color,
        fontVariantNumeric: 'tabular-nums', marginBottom: 3
      }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4 }}>
        {sub}
      </div>
    </div>
  );
}