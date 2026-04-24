import React, { useState, useMemo } from 'react';

// ============================================================================
// MUTUO COMP — Simulatore rata con tassi 2026, costi accessori, stress test,
// surroga. Nessuna intermediazione del credito.
// Fonti tassi: ABI aprile 2026, Osservatorio MutuiOnline
// ============================================================================

const THEME = { primary: '#10b981', soft: '#d1fae5', bg: '#ecfdf5' };

// Tassi di riferimento aprile 2026 (indicativi)
const TASSI_BASE = {
  irs20: 2.10,      // IRS 20 anni (base tasso fisso 20y)
  irs25: 2.20,      // IRS 25 anni
  irs30: 2.25,      // IRS 30 anni (base tasso fisso 30y)
  euribor1m: 2.15,  // Euribor 1 mese (base variabile)
  euribor3m: 2.20   // Euribor 3 mesi
};

// Spread tipici banche aprile 2026
const SPREAD_TIPICO = {
  fisso: 0.90,      // Tipico 0,6-1,5%
  variabile: 0.50   // Tipico 0,3-1,2%
};

// Sconto classe energetica A/B (green mortgage)
const SCONTO_CLASSE_AB = 0.40;

function pmt(ratePeriod, nper, pv) {
  if (ratePeriod === 0) return pv / nper;
  const x = Math.pow(1 + ratePeriod, nper);
  return (pv * ratePeriod * x) / (x - 1);
}

function calcolaAmmortamento(importo, tassoMese, mesi) {
  const rata = pmt(tassoMese, mesi, importo);
  let debito = importo;
  const anni = Math.ceil(mesi / 12);
  const rows = [];
  for (let a = 1; a <= anni; a++) {
    let capAnno = 0, intAnno = 0;
    const mesiAnno = Math.min(12, mesi - (a - 1) * 12);
    for (let m = 0; m < mesiAnno; m++) {
      const intMese = debito * tassoMese;
      const capMese = rata - intMese;
      capAnno += capMese;
      intAnno += intMese;
      debito -= capMese;
    }
    rows.push({ anno: a, capitale: capAnno, interessi: intAnno, debitoResiduo: Math.max(0, debito) });
  }
  return { rata, totale: rata * mesi, interessi: rata * mesi - importo, rows };
}

export function MutuoComp({ color = '#10b981' }) {
  // Inputs simulatore principale
  const [importo, setImporto] = useState(180000);
  const [immobile, setImmobile] = useState(240000);
  const [anni, setAnni] = useState(25);
  const [tipoTasso, setTipoTasso] = useState('fisso');
  const [spread, setSpread] = useState(SPREAD_TIPICO.fisso);
  const [classeEnergetica, setClasseEnergetica] = useState(false);

  // Stress test (solo variabile)
  const [stressRate, setStressRate] = useState(4.5);

  // Surroga
  const [surrRataAttuale, setSurrRataAttuale] = useState('750');
  const [surrResiduo, setSurrResiduo] = useState('120000');
  const [surrAnniRimasti, setSurrAnniRimasti] = useState(20);

  const t = THEME;
  const themeColor = color || t.primary;

  // Tasso base (dipende da durata e tipo)
  const tassoBase = useMemo(() => {
    if (tipoTasso === 'variabile') return TASSI_BASE.euribor1m;
    if (anni <= 20) return TASSI_BASE.irs20;
    if (anni <= 25) return TASSI_BASE.irs25;
    return TASSI_BASE.irs30;
  }, [tipoTasso, anni]);

  const tassoFinale = useMemo(() => {
    const base = tassoBase + spread - (classeEnergetica ? SCONTO_CLASSE_AB : 0);
    return Math.max(0.5, base);
  }, [tassoBase, spread, classeEnergetica]);

  const ltv = useMemo(() => (importo / immobile) * 100, [importo, immobile]);

  const principale = useMemo(() => {
    const tassoAnnuo = tassoFinale / 100;
    const mesi = anni * 12;
    const tassoMese = tassoAnnuo / 12;
    return calcolaAmmortamento(importo, tassoMese, mesi);
  }, [importo, tassoFinale, anni]);

  // Costi accessori stimati (una tantum)
  const costiAccessori = useMemo(() => {
    const istruttoria = Math.min(Math.max(importo * 0.007, 300), 2000);
    const perizia = 300;
    const impostaSostitutiva = importo * 0.0025; // 0,25% prima casa
    const notaio = 1800; // media approssimativa
    return {
      istruttoria: Math.round(istruttoria),
      perizia,
      impostaSostitutiva: Math.round(impostaSostitutiva),
      notaio,
      totale: Math.round(istruttoria + perizia + impostaSostitutiva + notaio)
    };
  }, [importo]);

  // TAEG stimato (include costi accessori spalmati sulla durata)
  const taegStimato = useMemo(() => {
    const mesi = anni * 12;
    const costoTotaleEffettivo = principale.totale + costiAccessori.totale;
    // Approssimazione TAEG: tasso che eguaglia rata + costi all'importo netto
    // Formula semplificata: tasso finale + incidenza annuale costi
    const incidenzaCostiAnnuale = (costiAccessori.totale / importo) / anni * 100;
    return tassoFinale + incidenzaCostiAnnuale * 0.6; // fattore correttivo empirico
  }, [tassoFinale, costiAccessori, importo, anni, principale]);

  // Stress test variabile
  const stressTest = useMemo(() => {
    if (tipoTasso !== 'variabile') return null;
    const tassoMese = (stressRate / 100) / 12;
    const mesi = anni * 12;
    const rataStress = pmt(tassoMese, mesi, importo);
    return {
      nuovaRata: Math.round(rataStress),
      aumento: Math.round(rataStress - principale.rata),
      aumentoPerc: ((rataStress - principale.rata) / principale.rata) * 100
    };
  }, [tipoTasso, stressRate, anni, importo, principale.rata]);

  // Confronto durate
  const confrontoDurate = useMemo(() => {
    return [10, 15, 20, 25, 30].map(d => {
      const tassoMese = (tassoFinale / 100) / 12;
      const mesi = d * 12;
      const r = pmt(tassoMese, mesi, importo);
      return { anni: d, rata: Math.round(r), totale: Math.round(r * mesi), interessi: Math.round(r * mesi - importo) };
    });
  }, [tassoFinale, importo]);

  // Surroga
  const surroga = useMemo(() => {
    const rataOld = parseFloat(surrRataAttuale) || 0;
    const residuo = parseFloat(surrResiduo) || 0;
    const anniR = surrAnniRimasti || 20;
    if (residuo <= 0 || rataOld <= 0) return null;

    const tassoMese = (tassoFinale / 100) / 12;
    const mesi = anniR * 12;
    const rataNew = pmt(tassoMese, mesi, residuo);
    const risparmioMensile = rataOld - rataNew;
    const risparmioTotale = risparmioMensile * mesi;
    return {
      rataNew: Math.round(rataNew),
      risparmioMensile: Math.round(risparmioMensile),
      risparmioTotale: Math.round(risparmioTotale),
      conviene: risparmioMensile > 15
    };
  }, [surrRataAttuale, surrResiduo, surrAnniRimasti, tassoFinale]);

  const formatEuro = (v) => `€ ${Math.round(v).toLocaleString('it-IT')}`;
  const formatPerc = (v, d = 2) => `${v.toFixed(d)}%`;

  const cardBase = {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24,
    padding: '32px 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 800, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10
  };
  const inputStyle = {
    width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1',
    borderRadius: 12, boxSizing: 'border-box', color: '#0f172a', background: '#fff', outline: 'none'
  };

  // Reddito consigliato (regola 35%)
  const redditoConsigliato = Math.round(principale.rata / 0.35);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====================================================================
          BLOCCO 1 — INPUT SIMULATORE
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22, fontWeight: 800, color: '#0f172a',
          margin: '0 0 6px', letterSpacing: '-0.01em'
        }}>
          Simulatore rata mutuo 2026
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
          Tassi base aggiornati aprile 2026 (IRS ed Euribor). Negozia lo spread della banca: è l'unica parte del tasso su cui hai potere contrattuale.
        </p>

        {/* Importo + Immobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 22 }}>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label style={labelStyle}>Importo mutuo</label>
              <span style={{ fontSize: 18, fontWeight: 900, color: themeColor, fontVariantNumeric: 'tabular-nums' }}>{formatEuro(importo)}</span>
            </div>
            <input type="range" min={30000} max={600000} step={5000} value={importo} onChange={(e) => setImporto(parseInt(e.target.value))} style={{ width: '100%', accentColor: themeColor }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label style={labelStyle}>Valore immobile</label>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{formatEuro(immobile)}</span>
            </div>
            <input type="range" min={50000} max={800000} step={5000} value={immobile} onChange={(e) => setImmobile(parseInt(e.target.value))} style={{ width: '100%', accentColor: themeColor }} />
            <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                fontSize: 11, fontWeight: 800,
                padding: '4px 10px', borderRadius: 20,
                background: ltv <= 80 ? '#dcfce7' : ltv <= 90 ? '#fef3c7' : '#fee2e2',
                color: ltv <= 80 ? '#166534' : ltv <= 90 ? '#92400e' : '#991b1b'
              }}>
                LTV {ltv.toFixed(0)}%
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {ltv <= 80 ? 'Condizioni ottimali' : ltv <= 90 ? 'Accettabile, spread leggermente più alto' : 'LTV alto, alcune banche non finanziano'}
              </span>
            </div>
          </div>

        </div>

        {/* Durata */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <label style={labelStyle}>Durata</label>
            <span style={{ fontSize: 18, fontWeight: 900, color: themeColor, fontVariantNumeric: 'tabular-nums' }}>{anni} anni</span>
          </div>
          <input type="range" min={5} max={30} step={1} value={anni} onChange={(e) => setAnni(parseInt(e.target.value))} style={{ width: '100%', accentColor: themeColor }} />
        </div>

        {/* Tipo tasso */}
        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>Tipo di tasso</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'fisso', label: 'Fisso', sub: `IRS ${anni}y ≈ ${tassoBase.toFixed(2)}%` },
              { id: 'variabile', label: 'Variabile', sub: `Euribor 1M ≈ ${TASSI_BASE.euribor1m.toFixed(2)}%` }
            ].map(o => {
              const active = tipoTasso === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    setTipoTasso(o.id);
                    setSpread(SPREAD_TIPICO[o.id]);
                  }}
                  style={{
                    flex: 1, padding: '14px 16px',
                    borderRadius: 14,
                    border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                    background: active ? t.bg : '#fff',
                    color: active ? '#0f172a' : '#64748b',
                    cursor: 'pointer', textAlign: 'left', lineHeight: 1.4
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{o.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>{o.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Spread banca */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <label style={labelStyle}>Spread banca (negoziabile)</label>
            <span style={{ fontSize: 18, fontWeight: 900, color: themeColor, fontVariantNumeric: 'tabular-nums' }}>{formatPerc(spread)}</span>
          </div>
          <input type="range" min={0.3} max={2.0} step={0.05} value={spread} onChange={(e) => setSpread(parseFloat(e.target.value))} style={{ width: '100%', accentColor: themeColor }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            <span>0,30% (migliori offerte)</span><span>2,00% (banca tradizionale)</span>
          </div>
        </div>

        {/* Classe energetica */}
        <div style={{
          padding: '14px 16px', background: classeEnergetica ? '#dcfce7' : '#f8fafc',
          borderRadius: 12, border: classeEnergetica ? '2px solid #10b981' : '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
        }} onClick={() => setClasseEnergetica(!classeEnergetica)}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            border: classeEnergetica ? 'none' : '2px solid #cbd5e1',
            background: classeEnergetica ? '#10b981' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 14,
            flexShrink: 0
          }}>
            {classeEnergetica ? '✓' : ''}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>🌱 Immobile in classe energetica A o B</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Mutuo green: sconto tipico −0,40% sullo spread (APE certificato richiesto)</div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          RISULTATO HERO + BREAKDOWN
          ==================================================================== */}
      <div style={{
        background: `linear-gradient(135deg, ${themeColor}12 0%, ${themeColor}04 100%)`,
        border: `2px solid ${themeColor}40`,
        borderRadius: 24, padding: '36px 24px', marginBottom: 24, textAlign: 'center'
      }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Rata mensile stimata · Tasso finale {formatPerc(tassoFinale)}
        </div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 52, fontWeight: 900, color: themeColor,
          lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums'
        }}>
          {formatEuro(principale.rata)}
        </div>
        <div style={{ fontSize: 13, color: '#475569' }}>
          <strong>{formatEuro(principale.totale)}</strong> costo vita del mutuo · <strong>{formatEuro(principale.interessi)}</strong> di interessi totali
        </div>
        <div style={{
          display: 'inline-block',
          marginTop: 14, padding: '8px 16px',
          background: 'rgba(255,255,255,0.6)', color: '#475569',
          fontSize: 12, fontWeight: 700, borderRadius: 20
        }}>
          💡 Reddito netto consigliato ≥ <strong style={{ color: themeColor }}>{formatEuro(redditoConsigliato)}/mese</strong> (regola 35%)
        </div>
        {redditoConsigliato > 3500 && (
          <div style={{ marginTop: 10 }}>
            <a href="/calcolo-stipendio" style={{ fontSize: 12, color: '#475569', textDecoration: 'underline' }}>
              Verifica il tuo netto con il Calcolatore Stipendio 2026 →
            </a>
          </div>
        )}
      </div>

      {/* ====================================================================
          BLOCCO 2 — COSTI ACCESSORI + TAEG
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h3 style={{
          fontSize: 16, fontWeight: 800, color: '#0f172a',
          margin: '0 0 6px', letterSpacing: '-0.01em'
        }}>
          Costi una tantum all'accensione (spesso dimenticati)
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px', lineHeight: 1.5 }}>
          Oltre alla rata, l'apertura mutuo ha costi di ingresso significativi — il tuo budget "cassa" per l'acquisto deve includerli.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
          <CostoCell label="Istruttoria" value={formatEuro(costiAccessori.istruttoria)} sub="0,5-1% importo; azzerabile per classe A/B in molte banche" />
          <CostoCell label="Perizia immobile" value={formatEuro(costiAccessori.perizia)} sub="Banca incarica perito; 200-450€" />
          <CostoCell label="Imposta sostitutiva" value={formatEuro(costiAccessori.impostaSostitutiva)} sub="0,25% prima casa; 2% seconda casa" />
          <CostoCell label="Notaio (stima)" value={formatEuro(costiAccessori.notaio)} sub="Atto mutuo + atto compravendita insieme" />
        </div>

        <div style={{
          padding: '14px 16px', background: '#f8fafc', borderRadius: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Totale costi una tantum
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
              {formatEuro(costiAccessori.totale)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              TAEG stimato
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {formatPerc(taegStimato)}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>TAN + incidenza costi</div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          BLOCCO 3 — STRESS TEST VARIABILE
          ==================================================================== */}
      {tipoTasso === 'variabile' && stressTest && (
        <div style={{ ...cardBase, marginBottom: 24, borderColor: '#f59e0b40', background: 'linear-gradient(135deg, #fffbeb 0%, #fff 100%)' }}>
          <h3 style={{
            fontSize: 16, fontWeight: 800, color: '#78350f',
            margin: '0 0 6px', letterSpacing: '-0.01em'
          }}>
            ⚠️ Stress test tasso variabile
          </h3>
          <p style={{ fontSize: 13, color: '#78350f', margin: '0 0 18px', lineHeight: 1.5 }}>
            Il variabile segue l'Euribor, che può salire. Storicamente (2008, 2022) è arrivato fino al 4,5-5%. Verifica se reggi la rata nello scenario peggiore:
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <label style={labelStyle}>Se il tasso salisse a...</label>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatPerc(stressRate)}</span>
          </div>
          <input type="range" min={tassoFinale} max={7} step={0.25} value={stressRate} onChange={(e) => setStressRate(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#dc2626', marginBottom: 18 }} />

          <div style={{
            padding: '18px 20px', background: '#fee2e2', borderRadius: 12,
            border: '1px solid #fca5a5'
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#991b1b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              La tua rata diventerebbe
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                {formatEuro(stressTest.nuovaRata)}
              </div>
              <div style={{ fontSize: 14, color: '#991b1b', fontWeight: 700 }}>
                +{formatEuro(stressTest.aumento)}/mese · +{stressTest.aumentoPerc.toFixed(1)}%
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#991b1b', marginTop: 10, lineHeight: 1.5 }}>
              Se non sei sicuro di poter reggere questa rata, valuta di passare al tasso fisso — o di ridurre l'importo richiesto.
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          CONFRONTO DURATE
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h3 style={{
          fontSize: 16, fontWeight: 800, color: '#0f172a',
          margin: '0 0 18px', letterSpacing: '-0.01em'
        }}>
          Durata alternative (stesso importo e tasso)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {confrontoDurate.map(c => {
            const isActive = c.anni === anni;
            const maxInt = Math.max(...confrontoDurate.map(x => x.interessi));
            const pctInt = (c.interessi / maxInt) * 100;
            return (
              <div key={c.anni} style={{
                padding: '12px 14px',
                background: isActive ? t.bg : '#f8fafc',
                borderRadius: 12,
                border: isActive ? `2px solid ${themeColor}` : '1px solid transparent'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: isActive ? 900 : 700, color: '#0f172a' }}>
                    {c.anni} anni {isActive && <span style={{ fontSize: 11, color: themeColor, marginLeft: 6 }}>← attuale</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                    <strong style={{ color: '#0f172a' }}>{formatEuro(c.rata)}</strong>/mese · interessi <strong style={{ color: '#dc2626' }}>{formatEuro(c.interessi)}</strong>
                  </div>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${pctInt}%`, height: '100%', background: themeColor, transition: 'width 0.4s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          PIANO AMMORTAMENTO (primi 5 anni + ultimo)
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h3 style={{
          fontSize: 16, fontWeight: 800, color: '#0f172a',
          margin: '0 0 6px', letterSpacing: '-0.01em'
        }}>
          Piano di ammortamento
        </h3>
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 18px' }}>
          Nei primi anni la maggior parte della rata paga interessi. Il debito residuo scende più velocemente verso fine mutuo.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>Anno</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#475569', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>Capitale</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#475569', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>Interessi</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#475569', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>Debito residuo</th>
              </tr>
            </thead>
            <tbody>
              {principale.rows.slice(0, 5).map(r => (
                <tr key={r.anno} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.anno}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: themeColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatEuro(r.capitale)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatEuro(r.interessi)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatEuro(r.debitoResiduo)}</td>
                </tr>
              ))}
              {principale.rows.length > 5 && (
                <>
                  <tr>
                    <td colSpan={4} style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>···</td>
                  </tr>
                  <tr style={{ background: '#f8fafc', borderTop: '2px dashed #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{principale.rows[principale.rows.length - 1].anno}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: themeColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatEuro(principale.rows[principale.rows.length - 1].capitale)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatEuro(principale.rows[principale.rows.length - 1].interessi)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatEuro(0)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================================
          BLOCCO 4 — MINI-TOOL SURROGA
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24, background: 'linear-gradient(135deg, #eff6ff 0%, #fff 60%)', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>🔁</span>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18, fontWeight: 800, color: '#0f172a',
            margin: 0, letterSpacing: '-0.01em'
          }}>
            Hai già un mutuo? Calcola se conviene la surroga
          </h3>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
          La surroga è gratuita per legge. Se i tassi attuali sono più bassi del tuo, cambiando banca puoi ridurre la rata senza costi. Ecco il risparmio stimato al tasso finale del simulatore sopra.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Rata mensile attuale</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>€</span>
              <input type="number" value={surrRataAttuale} onChange={(e) => setSurrRataAttuale(e.target.value)} style={{ ...inputStyle, paddingLeft: 28, fontWeight: 800 }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Debito residuo</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>€</span>
              <input type="number" value={surrResiduo} onChange={(e) => setSurrResiduo(e.target.value)} style={{ ...inputStyle, paddingLeft: 28, fontWeight: 800 }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Anni rimasti</label>
            <input type="number" min="1" max="30" value={surrAnniRimasti} onChange={(e) => setSurrAnniRimasti(parseInt(e.target.value) || 20)} style={inputStyle} />
          </div>
        </div>

        {surroga && (
          <div style={{
            padding: '18px 20px',
            background: surroga.conviene ? '#d1fae5' : '#f1f5f9',
            borderRadius: 12,
            border: `1px solid ${surroga.conviene ? '#6ee7b7' : '#cbd5e1'}`
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: surroga.conviene ? '#065f46' : '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {surroga.conviene ? '✅ Surroga conveniente' : 'ℹ️ Risparmio modesto'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Nuova rata stimata</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                  {formatEuro(surroga.rataNew)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Risparmio mensile</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: surroga.conviene ? '#059669' : '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                  {surroga.risparmioMensile > 0 ? '+' : ''}{formatEuro(Math.abs(surroga.risparmioMensile))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Risparmio totale (residuo)</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: surroga.conviene ? '#059669' : '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                  {surroga.risparmioTotale > 0 ? '+' : ''}{formatEuro(Math.abs(surroga.risparmioTotale))}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 12, lineHeight: 1.5, fontStyle: 'italic' }}>
              Stima al tasso finale {formatPerc(tassoFinale)} del simulatore principale. La surroga conviene tipicamente se il risparmio supera i 50€/mese, ma valuta caso per caso anche il costo opportunità (tempo, pratiche) anche se legalmente è gratuita.
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          DISCLAIMER
          ==================================================================== */}
      <div style={{
        padding: '20px 24px', background: '#f8fafc',
        border: '1px solid #e2e8f0', borderRadius: 16,
        fontSize: 11, color: '#64748b', lineHeight: 1.7
      }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, fontSize: 12 }}>
          ⚠️ Nota metodologica e disclaimer
        </div>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Parametri aggiornati aprile 2026</strong>. Tassi base (IRS per il fisso, Euribor 1M per il variabile) sono valori indicativi di mercato che cambiano quotidianamente: i tassi applicati concretamente dalle banche possono differire. Lo spread negoziato dipende da profilo reddituale, LTV, età, classe energetica dell'immobile e potere contrattuale del cliente.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>TAEG stimato semplificato.</strong> Il TAEG reale comunicato dalla banca include tutti i costi obbligatori (istruttoria, perizia, imposte, assicurazione incendio obbligatoria) secondo la formula di Direttiva 2014/17/UE. Il nostro calcolo è un'approssimazione educativa: richiedi sempre il <strong>Prospetto Informativo Europeo Standardizzato (PIES)</strong> alla banca per il TAEG ufficiale, obbligatorio per legge prima della firma.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Non siamo intermediari del credito né mediatori creditizi.</strong> SoldiBuoni non è iscritto all'OAM (Organismo Agenti e Mediatori) e non svolge attività di intermediazione creditizia ai sensi del D.Lgs. 141/2010. Questo strumento è informativo: per richiedere un mutuo rivolgiti direttamente alle banche, a mediatori creditizi iscritti OAM, o a comparatori autorizzati (es. MutuiOnline, Facile.it).
        </p>
        <p style={{ margin: 0 }}>
          <strong>La regola del 35%</strong> (rata/reddito netto mensile) è un'indicazione prudenziale riportata anche nelle guide Banca d'Italia: le banche generalmente non finanziano oltre il 33-35% del reddito netto del nucleo familiare. Questo parametro non è un limite di legge ma un criterio di sostenibilità per tutelare il mutuatario.
        </p>
      </div>

    </div>
  );
}

function CostoCell({ label, value, sub }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: '#f8fafc', borderRadius: 12,
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 18, fontWeight: 900, color: '#0f172a',
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