import React, { useState, useMemo } from 'react';

// ============================================================================
// INTERESSE COMPOSTO — Simulatore con inflazione e tassazione
// Mostra valore nominale, netto post-tasse, valore reale aggiustato inflazione
// ============================================================================

const INFLAZIONE_ATTESA = 0.020;      // 2% target BCE
const TASSAZIONE_CAPITAL_GAIN = 0.26; // 26% per ETF azionari e obbligazioni non gov. italiane

export function InteresseComposto({ color = '#8b5cf6' }) {
  const [capitale, setCapitale] = useState(5000);
  const [versamento, setVersamento] = useState(200);
  const [anni, setAnni] = useState(15);
  const [tasso, setTasso] = useState(6);
  const [mostraReale, setMostraReale] = useState(true);

  const risultati = useMemo(() => {
    let totale = capitale;
    let versato = capitale;
    const curva = [{ anno: 0, nominale: capitale, versato }];

    for (let i = 1; i <= anni; i++) {
      totale = (totale + versamento * 12) * (1 + tasso / 100);
      versato += versamento * 12;
      curva.push({ anno: i, nominale: totale, versato });
    }

    const guadagnoLordo = totale - versato;
    const tasse = Math.max(0, guadagnoLordo) * TASSAZIONE_CAPITAL_GAIN;
    const nettoPostTasse = totale - tasse;

    const fattoreInflazione = Math.pow(1 + INFLAZIONE_ATTESA, anni);
    const valoreReale = nettoPostTasse / fattoreInflazione;

    return {
      nominale: Math.round(totale),
      versato: Math.round(versato),
      guadagnoLordo: Math.round(guadagnoLordo),
      tasse: Math.round(tasse),
      nettoPostTasse: Math.round(nettoPostTasse),
      valoreReale: Math.round(valoreReale),
      fattoreInflazione
    };
  }, [capitale, versamento, anni, tasso]);

  const percVersato = risultati.nominale > 0 ? (risultati.versato / risultati.nominale) * 100 : 100;
  const percInteressi = 100 - percVersato;

  const valoreMostrato = mostraReale ? risultati.valoreReale : risultati.nominale;
  const etichettaValore = mostraReale ? 'Valore reale (post inflazione + tasse)' : 'Capitale finale nominale';

  const formatEuro = (v) => `€ ${Math.round(v).toLocaleString('it-IT')}`;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====================================================================
          INPUT CARD
          ==================================================================== */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: 32,
        border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        marginBottom: 24
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28 }}>

          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
              <span>Capitale iniziale</span>
              <span style={{ color, fontVariantNumeric: 'tabular-nums' }}>{formatEuro(capitale)}</span>
            </label>
            <input
              type="range" min={0} max={200000} step={1000}
              value={capitale} onChange={(e) => setCapitale(+e.target.value)}
              style={{ width: '100%', accentColor: color, marginTop: 10 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
              <span>Versamento mensile (PAC)</span>
              <span style={{ color, fontVariantNumeric: 'tabular-nums' }}>{formatEuro(versamento)}</span>
            </label>
            <input
              type="range" min={0} max={2000} step={25}
              value={versamento} onChange={(e) => setVersamento(+e.target.value)}
              style={{ width: '100%', accentColor: color, marginTop: 10 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
              <span>Anni di investimento</span>
              <span style={{ color }}>{anni} anni</span>
            </label>
            <input
              type="range" min={1} max={50} step={1}
              value={anni} onChange={(e) => setAnni(+e.target.value)}
              style={{ width: '100%', accentColor: color, marginTop: 10 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
              <span>Rendimento annuo atteso</span>
              <span style={{ color }}>{tasso}%</span>
            </label>
            <input
              type="range" min={0.5} max={12} step={0.5}
              value={tasso} onChange={(e) => setTasso(+e.target.value)}
              style={{ width: '100%', accentColor: color, marginTop: 10 }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>
              Riferimenti storici: 2% conto deposito · 4-6% bilanciato · 7-8% azionario globale
            </div>
          </div>

        </div>
      </div>

      {/* ====================================================================
          TOGGLE NOMINALE / REALE
          ==================================================================== */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 14,
        background: '#f1f5f9', padding: 4, borderRadius: 12
      }}>
        <button
          onClick={() => setMostraReale(false)}
          style={{
            flex: 1, padding: '10px', borderRadius: 8, border: 'none',
            background: !mostraReale ? '#fff' : 'transparent',
            color: !mostraReale ? color : '#64748b',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: !mostraReale ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
          }}
        >
          💰 Valore nominale
        </button>
        <button
          onClick={() => setMostraReale(true)}
          style={{
            flex: 1, padding: '10px', borderRadius: 8, border: 'none',
            background: mostraReale ? '#fff' : 'transparent',
            color: mostraReale ? color : '#64748b',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: mostraReale ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
          }}
        >
          🛒 Valore reale (post inflazione 2% + tasse 26%)
        </button>
      </div>

      {/* ====================================================================
          VALORE FINALE HERO
          ==================================================================== */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: 32,
        border: '1px solid #e2e8f0', marginBottom: 24,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 18, fontWeight: 800, color: '#0f172a',
          textAlign: 'center', marginBottom: 4
        }}>{etichettaValore}</h3>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 52, fontWeight: 900, color,
          textAlign: 'center', marginBottom: 24,
          fontVariantNumeric: 'tabular-nums', lineHeight: 1
        }}>
          {formatEuro(valoreMostrato)}
        </div>

        {/* Bar versato vs interessi (sempre su nominale) */}
        <div style={{
          display: 'flex', height: 24, borderRadius: 8,
          overflow: 'hidden', marginBottom: 14,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ width: `${percVersato}%`, background: '#94a3b8', transition: 'width 0.5s' }} />
          <div style={{ width: `${percInteressi}%`, background: color, transition: 'width 0.5s' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ color: '#64748b' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#94a3b8', marginRight: 6 }} />
            Versato: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatEuro(risultati.versato)}</span>
          </div>
          <div style={{ color }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: color, marginRight: 6 }} />
            Interessi lordi: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatEuro(risultati.guadagnoLordo)}</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          BREAKDOWN
          ==================================================================== */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: 24,
        border: '1px solid #e2e8f0', marginBottom: 24,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Dal lordo al valore reale
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
          <Row label="Capitale finale nominale" value={formatEuro(risultati.nominale)} strong />
          <Row label="− Tasse capital gain (26% sul guadagno)" value={`− ${formatEuro(risultati.tasse)}`} color="#dc2626" />
          <div style={{ height: 1, background: '#e2e8f0' }} />
          <Row label="= Netto post tasse" value={formatEuro(risultati.nettoPostTasse)} strong color="#059669" />
          <Row label={`÷ Inflazione (${(risultati.fattoreInflazione).toFixed(2)}× in ${anni} anni)`} value="—" color="#64748b" />
          <div style={{ height: 1, background: '#e2e8f0' }} />
          <Row label="= Valore reale (potere d'acquisto di oggi)" value={formatEuro(risultati.valoreReale)} strong color={color} />
        </div>

        <div style={{
          marginTop: 18, padding: '12px 14px',
          background: '#fffbeb', borderRadius: 10,
          fontSize: 11, color: '#78350f', lineHeight: 1.6
        }}>
          <strong>ⓘ Il valore reale è il numero che conta davvero</strong>: ti dice quanto potere d'acquisto hai a fine simulazione nei prezzi di oggi. Un capitale nominale che "raddoppia" in 20 anni al 3,5% non batte l'inflazione al 2%: in termini reali hai guadagnato solo il 30%, non il 100%.
        </div>
      </div>

      {/* ====================================================================
          CTA SOBRIO
          ==================================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f3ff 0%, #fff 60%)',
        borderRadius: 20, padding: '24px',
        border: `1px solid ${color}30`,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 16,
        marginBottom: 24
      }}>
        <div style={{ flex: '1 1 280px' }}>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            Come scegliere l'asset allocation?
          </h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Il rendimento atteso dipende dal mix di strumenti finanziari. Vai al costruttore di portafoglio per vedere asset class, rendimenti storici e banda di confidenza.
          </p>
        </div>
        <a href="/investimenti" style={{
          padding: '12px 20px', borderRadius: 12,
          background: color, color: '#fff',
          fontSize: 13, fontWeight: 800,
          textDecoration: 'none', whiteSpace: 'nowrap',
          boxShadow: `0 6px 16px -4px ${color}50`
        }}>
          Costruisci portafoglio →
        </a>
      </div>

      {/* ====================================================================
          DISCLAIMER
          ==================================================================== */}
      <div style={{
        padding: '18px 22px', background: '#f8fafc',
        border: '1px solid #e2e8f0', borderRadius: 14,
        fontSize: 11, color: '#64748b', lineHeight: 1.7
      }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6, fontSize: 12 }}>
          ⚠️ Disclaimer
        </div>
        <p style={{ margin: '0 0 6px' }}>
          <strong>Strumento educativo, non consulenza.</strong> SoldiBuoni non è un consulente finanziario autorizzato CONSOB/OCF. Questo simulatore illustra il concetto di interesse composto ma non costituisce raccomandazione d'investimento.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <strong>Assunzioni del modello</strong>: rendimento annuo costante (nella realtà è volatile), capitalizzazione annuale, versamenti mensili sempre eseguiti, inflazione al 2% (target BCE — storicamente varia), capital gain al 26% forfettario (obbligazioni governative OCSE whitelist sono al 12,5%; commissioni broker non incluse).
        </p>
        <p style={{ margin: 0 }}>
          <strong>Le performance passate non sono indicative di quelle future.</strong> Il capitale investito in strumenti finanziari è soggetto a rischio di perdita. Consulta un consulente finanziario iscritto all'Albo OCF per decisioni personalizzate.
        </p>
      </div>

    </div>
  );
}

function Row({ label, value, color = '#0f172a', strong = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
      <span style={{ color: strong ? color : '#64748b', fontWeight: strong ? 800 : 500, flex: 1, fontSize: 13, lineHeight: 1.4 }}>
        {label}
      </span>
      <span style={{
        color, fontWeight: strong ? 900 : 700,
        fontSize: strong ? 16 : 14, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'
      }}>
        {value}
      </span>
    </div>
  );
}