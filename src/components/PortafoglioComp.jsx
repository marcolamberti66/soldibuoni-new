import React, { useState, useMemo } from 'react';

// ============================================================================
// PORTAFOGLIO COMP — Esploratore didattico di portafogli modello storici
// Usa dati storici MSCI World, obbligazionari aggregati UE, liquidità BCE.
// NON fornisce raccomandazioni di investimento ai sensi del MAR.
// ============================================================================

const THEME = { primary: '#3b82f6', soft: '#dbeafe', bg: '#eff6ff' };

// Asset class - dati storici aggregati, nessun riferimento a strumenti specifici (rimossi ISIN)
// Fonti: MSCI World 1987-2025 (~8%/anno + 17% vol), BBG Global Agg EUR hedged 1999-2025 (~2,5% + 5% vol)
const ASSET_CLASSES = {
  azionarioGlobale: {
    label: 'Azionario globale mercati sviluppati',
    retStorico: 0.080,
    vol: 0.170,
    terTipico: 0.0020,
    descrizione: 'Indici ampi di azioni di società quotate nei paesi sviluppati (USA, Europa, Giappone, Oceania)'
  },
  azionarioEmergenti: {
    label: 'Azionario mercati emergenti',
    retStorico: 0.070,
    vol: 0.220,
    terTipico: 0.0018,
    descrizione: 'Indici di azioni di società quotate in Cina, India, Brasile, Corea del Sud e altri paesi emergenti'
  },
  obbligazioniGovUE: {
    label: 'Obbligazioni governative EUR',
    retStorico: 0.025,
    vol: 0.050,
    terTipico: 0.0015,
    descrizione: 'Titoli di Stato dei paesi dell\'Eurozona con rating investment grade'
  },
  obbligazioniCorp: {
    label: 'Obbligazioni corporate EUR',
    retStorico: 0.035,
    vol: 0.070,
    terTipico: 0.0020,
    descrizione: 'Obbligazioni emesse da aziende con rating investment grade in area euro'
  },
  liquidita: {
    label: 'Liquidità e strumenti monetari',
    retStorico: 0.020,
    vol: 0.005,
    terTipico: 0.0,
    descrizione: 'Conti deposito vincolati, titoli di Stato a brevissimo termine, fondi monetari'
  }
};

const PORTAFOGLI = {
  conservativo: {
    label: 'Conservativo',
    descrizione: 'Bassa volatilità storica, priorità alla protezione del capitale',
    pesi: { azionarioGlobale: 20, azionarioEmergenti: 0, obbligazioniGovUE: 50, obbligazioniCorp: 20, liquidita: 10 },
    drawdownMax: 0.12,
    adatto: 'Orizzonte 1-5 anni, bassa tolleranza al rischio'
  },
  bilanciato: {
    label: 'Bilanciato',
    descrizione: 'Mix crescita e protezione, volatilità storica moderata',
    pesi: { azionarioGlobale: 45, azionarioEmergenti: 5, obbligazioniGovUE: 25, obbligazioniCorp: 20, liquidita: 5 },
    drawdownMax: 0.25,
    adatto: 'Orizzonte 5-10 anni, tolleranza al rischio media'
  },
  aggressivo: {
    label: 'Aggressivo',
    descrizione: 'Massima esposizione azionaria, volatilità storica alta',
    pesi: { azionarioGlobale: 75, azionarioEmergenti: 15, obbligazioniGovUE: 5, obbligazioniCorp: 5, liquidita: 0 },
    drawdownMax: 0.45,
    adatto: 'Orizzonte 10+ anni, alta tolleranza al rischio'
  }
};

const INFLAZIONE_ATTESA = 0.020;
const TASSAZIONE_CAPITAL_GAIN = 0.26;

// ============================================================================

function calcolaRendimentoPortafoglio(pesi) {
  let retStorico = 0;
  let volStorica = 0;
  let terMedio = 0;
  Object.entries(pesi).forEach(([k, p]) => {
    const asset = ASSET_CLASSES[k];
    retStorico += (p / 100) * asset.retStorico;
    volStorica += Math.pow((p / 100) * asset.vol, 2);
    terMedio += (p / 100) * asset.terTipico;
  });
  volStorica = Math.sqrt(volStorica);
  return { retStorico, volStorica, terMedio };
}

function proiezione(iniziale, pacMese, anni, retAnnuo, volAnnua, ter) {
  const retNetto = retAnnuo - ter;
  const pacAnnuo = pacMese * 12;

  let capitaleProiezione = iniziale;
  let versato = iniziale;
  const curva = [{ anno: 0, valore: iniziale, versato }];

  for (let i = 1; i <= anni; i++) {
    capitaleProiezione = (capitaleProiezione + pacAnnuo) * (1 + retNetto);
    versato += pacAnnuo;
    curva.push({ anno: i, valore: capitaleProiezione, versato });
  }

  const sigmaCumul = volAnnua * Math.sqrt(anni);
  const fattoreInf = Math.exp(-1.28 * sigmaCumul);
  const fattoreSup = Math.exp(+1.28 * sigmaCumul);

  const valoreFinale = curva[anni].valore;
  const versatoTot = curva[anni].versato;
  const guadagno = valoreFinale - versatoTot;
  const tasse = Math.max(0, guadagno) * TASSAZIONE_CAPITAL_GAIN;
  const nettoPostTasse = valoreFinale - tasse;

  const poterePerduto = Math.pow(1 + INFLAZIONE_ATTESA, anni);
  const valoreReale = nettoPostTasse / poterePerduto;

  const finaleInf = valoreFinale * fattoreInf;
  const finaleSup = valoreFinale * fattoreSup;

  const capitaleMedio = (iniziale + valoreFinale) / 2;
  const costoTER = capitaleMedio * ter * anni;

  return {
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

export function PortafoglioComp({ color = '#3b82f6' }) {
  const [profilo, setProfilo] = useState('bilanciato');
  const [iniziale, setIniziale] = useState(10000);
  const [pacMese, setPacMese] = useState(300);
  const [anni, setAnni] = useState(15);

  const t = THEME;
  const themeColor = color || t.primary;

  const porta = PORTAFOGLI[profilo];
  const { retStorico, volStorica, terMedio } = useMemo(
    () => calcolaRendimentoPortafoglio(porta.pesi),
    [profilo, porta.pesi]
  );

  const sim = useMemo(
    () => proiezione(iniziale, pacMese, anni, retStorico, volStorica, terMedio),
    [iniziale, pacMese, anni, retStorico, volStorica, terMedio]
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
          WARNING DI APERTURA — VISIBILE SUBITO
          ==================================================================== */}
      <div style={{
        background: '#fffbeb',
        border: '2px solid #f59e0b',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start'
      }}>
        <div style={{ fontSize: 24, flexShrink: 0 }}>⚠️</div>
        <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
          <strong style={{ color: '#92400e' }}>Strumento educativo, non consulenza finanziaria.</strong> SoldiBuoni non è iscritto all'Albo OCF né autorizzato CONSOB. Le proiezioni si basano su dati storici di asset class aggregate: non sono previsioni né raccomandazioni di acquisto su strumenti finanziari specifici. Performance passate non garantiscono performance future.
        </div>
      </div>

      {/* ====================================================================
          INPUT
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22, fontWeight: 800, color: '#0f172a',
          margin: '0 0 6px', letterSpacing: '-0.01em'
        }}>
          Esplora portafogli modello storici
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
          Seleziona un profilo di rischio, orizzonte temporale e importo. Vedrai l'asset allocation teorica, il rendimento storico medio delle asset class sottostanti e una banda di proiezione basata sulla volatilità storica cumulata.
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
          Asset allocation teorica — {porta.label}
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
                    Rendimento storico medio <strong>{formatPerc(asset.retStorico)}</strong> · volatilità storica <strong>{formatPerc(asset.vol, 0)}</strong> · TER tipico ETF UCITS <strong>{formatPerc(asset.terTipico, 2)}</strong>
                    <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                      {asset.descrizione}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: t.bg, borderRadius: 12,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>
              Rendimento storico
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: themeColor, fontVariantNumeric: 'tabular-nums' }}>
              {formatPerc(retStorico)} / anno
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>media 1987-2025, non predittivo</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>
              Volatilità storica
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {formatPerc(volStorica, 0)}
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
          PROIEZIONE
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20, fontWeight: 800, color: '#0f172a',
          margin: '0 0 4px', letterSpacing: '-0.01em'
        }}>
          Proiezione storica su {anni} anni
        </h3>
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
          Calcolo basato sui rendimenti storici delle asset class selezionate e sulla volatilità cumulata. La banda di proiezione indica l'intervallo coperto nell'80% degli scenari storicamente osservati. <strong>Non è una previsione sul futuro.</strong>
        </p>

        <div style={{
          background: `linear-gradient(135deg, ${themeColor}12, ${themeColor}04)`,
          border: `2px solid ${themeColor}40`,
          borderRadius: 20, padding: '24px', marginBottom: 24, textAlign: 'center'
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Valore nominale (proiezione mediana storica)
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 44, fontWeight: 900, color: themeColor,
            lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums'
          }}>
            {formatEuro(sim.valoreFinaleNominale)}
          </div>
          <div style={{ fontSize: 12, color: '#475569' }}>
            Banda 80% storica: <strong>{formatEuro(sim.finaleInf)}</strong> — <strong>{formatEuro(sim.finaleSup)}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <BreakdownCell label="Versato totale" value={formatEuro(sim.versatoTot)} sub="Capitale iniziale + PAC cumulato" />
          <BreakdownCell label="Guadagno nominale" value={formatEuro(sim.guadagno)} sub="Valore finale − Versato" color="#059669" />
          <BreakdownCell label="Tasse capital gain (26%)" value={`− ${formatEuro(sim.tasse)}`} sub="Su ETF azionari, al momento della vendita" color="#dc2626" />
          <BreakdownCell label="Costi TER cumulati" value={`− ${formatEuro(sim.costoTER)}`} sub="Stima su capitale medio, esclude commissioni broker" color="#dc2626" />
          <BreakdownCell label="Netto post tasse" value={formatEuro(sim.nettoPostTasse)} sub="Quello che incassi alla vendita" color={themeColor} strong />
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
        I rendimenti storici utilizzati si basano sulla media delle asset class per il periodo 1987-2025 (MSCI World per l'azionario globale, indici aggregati obbligazionari per l'area euro). <strong>Performance passate non sono predittive di performance future</strong>. La banda 80% è una semplificazione che usa volatilità cumulata: nella realtà storica ci sono stati drawdown del 40-50% sull'azionario globale (2008, 2020) e nel 20% degli scenari il risultato può essere fuori banda. <strong>Il valore reale</strong> (post-inflazione 2%) è il numero che conta davvero: €100.000 tra 20 anni varranno circa €67.000 di oggi — un investimento che "raddoppia" nominale ma non batte l'inflazione non ti ha arricchito.
      </div>

      {/* ====================================================================
          DISCLAIMER LEGALE — RAFFORZATO CON MAR
          ==================================================================== */}
      <div style={{
        padding: '20px 24px', background: '#f8fafc',
        border: '2px solid #e2e8f0', borderRadius: 16,
        fontSize: 11, color: '#64748b', lineHeight: 1.7
      }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, fontSize: 12 }}>
          ⚠️ Disclaimer legale completo — leggere con attenzione
        </div>
        <p style={{ margin: '0 0 8px' }}>
          <strong>SoldiBuoni NON è un consulente finanziario autorizzato.</strong> SoldiBuoni non è iscritto all'Albo Unico dei Consulenti Finanziari (OCF) né è autorizzato CONSOB alla prestazione di servizi di investimento o di consulenza finanziaria ai sensi del TUF (D.Lgs. 58/1998). Questo strumento è esclusivamente di natura <strong>informativa ed educativa</strong>: illustra il comportamento storico aggregato di asset class finanziarie, ma NON costituisce consulenza finanziaria personalizzata, sollecitazione al pubblico risparmio, raccomandazione d'investimento o promozione di strumenti finanziari specifici.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Nessuna raccomandazione di investimento ai sensi del MAR.</strong> Questo contenuto non costituisce "raccomandazione di investimento" né "altra informazione che raccomanda o suggerisce una strategia di investimento" ai sensi del Regolamento UE 596/2014 (MAR) e del Regolamento delegato (UE) 2016/958: non raccomanda né suggerisce l'acquisto, la vendita o la detenzione di strumenti finanziari specifici, ma illustra in forma didattica il comportamento storico di asset class aggregate e di portafogli modello teorici. Non viene menzionato alcuno strumento finanziario specifico (azione, obbligazione, ETF, fondo) né alcun emittente.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Le performance passate non sono indicative di performance future.</strong> I rendimenti storici mostrati (~8% annuo MSCI World, ~2,5% obbligazionari EUR) sono medie di lungo periodo che includono periodi di rialzo e di crisi. Nulla garantisce che si ripetano nei prossimi anni o decenni. Il capitale investito in strumenti finanziari è soggetto a <strong>rischio di perdita anche totale</strong>. Le obbligazioni di paesi in difficoltà possono subire ristrutturazioni; i mercati azionari hanno storicamente avuto crolli del 40-50% in singoli anni (2008, 2020, 2022). Un investimento a 1-3 anni in un portafoglio aggressivo può chiudere in perdita anche significativa.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Fiscalità semplificata.</strong> Il calcolo applica capital gain 26% forfettario al momento della vendita: in realtà le obbligazioni governative italiane ed equivalenti (OCSE whitelist) sono tassate al 12,5%, i PIR Ordinari al 0% dopo 5 anni, e gli strumenti detenuti in regime amministrato seguono meccanismi specifici. Non è considerato l'impatto delle commissioni di piattaforma (conto titoli, bonifico, eseguito di borsa), né delle imposte di bollo (0,2% annuo).
        </p>
        <p style={{ margin: 0 }}>
          <strong>Rivolgiti a un consulente finanziario iscritto all'Albo OCF</strong> (albo.consob.it) per decisioni di investimento personalizzate. In alternativa, valuta un consulente autonomo (indipendente da reti commerciali) iscritto all'OCF Sezione Autonoma: addebita una parcella ma non percepisce commissioni sui prodotti, garantendo assenza di conflitto di interessi.
        </p>
      </div>

    </div>
  );
}

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