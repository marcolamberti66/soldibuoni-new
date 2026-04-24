import React, { useState, useMemo } from 'react';

// ============================================================================
// CALCOLATORE STIPENDIO LORDO-NETTO 2026
// Aliquote Legge di Bilancio 2026 (L. 199/2025)
// INPS: circolare 8 del 03/02/2026 - massimale 122.295€ - soglia 1% aggiuntiva 56.224€
// ============================================================================

// --- COSTANTI FISCALI 2026 ---

// IRPEF 2026: secondo scaglione ridotto al 33% (era 35%)
const SCAGLIONI_IRPEF_2026 = [
  { fino: 28000, aliquota: 0.23 },
  { fino: 50000, aliquota: 0.33 },
  { fino: Infinity, aliquota: 0.43 }
];

// INPS dipendente 2026
const INPS_ALIQUOTA_BASE = 0.0919;          // 9,19% trattenuta standard dipendente
const INPS_ALIQUOTA_AGGIUNTIVA = 0.01;      // +1% sopra 56.224€/anno
const INPS_SOGLIA_AGGIUNTIVA = 56224;
const INPS_MASSIMALE_2026 = 122295;          // Oltre non si versano più contributi IVS

// Bonus integrativo (ex-Renzi) per redditi bassi
const BONUS_INTEGRATIVO_MAX = 1200;          // 100€/mese × 12 mesi
const BONUS_INTEGRATIVO_SOGLIA = 15000;      // Pieno fino a 15k
const BONUS_INTEGRATIVO_CUTOFF = 28000;      // Cessa a 28k (decalage lineare)

// No tax area 2026: 8.500€
const NO_TAX_AREA = 8500;

// Addizionali regionali 2026 (aliquota media per prima fascia)
// Fonte: Dipartimento Finanze MEF aggiornamento 2026 — verificare singolo comune
const ADDIZIONALI_REGIONALI = {
  'Abruzzo': 0.0173,
  'Basilicata': 0.0123,
  'Calabria': 0.0203,
  'Campania': 0.0203,
  'Emilia-Romagna': 0.0193,
  'Friuli-V.G.': 0.0123,
  'Lazio': 0.0333,
  'Liguria': 0.0213,
  'Lombardia': 0.0173,
  'Marche': 0.0173,
  'Molise': 0.0213,
  'Piemonte': 0.0258,
  'Puglia': 0.0213,
  'Sardegna': 0.0123,
  'Sicilia': 0.0123,
  'Toscana': 0.0173,
  'Trentino-A.A.': 0.0123,
  'Umbria': 0.0193,
  "Valle d'Aosta": 0.0123,
  'Veneto': 0.0123
};

// Addizionali comunali principali città 2026
const ADDIZIONALI_COMUNALI = {
  'Milano': 0.008,
  'Roma': 0.009,
  'Napoli': 0.008,
  'Torino': 0.008,
  'Bologna': 0.008,
  'Firenze': 0.002,
  'Genova': 0.008,
  'Altro': 0.006
};

const THEME = { primary: '#10b981', soft: '#d1fae5', bg: '#ecfdf5' };

// --- UTILS ---

function calcolaIrpefLorda(imponibile) {
  if (imponibile <= NO_TAX_AREA) return 0;
  let tassa = 0;
  let residuo = imponibile;
  let precedente = 0;
  for (const s of SCAGLIONI_IRPEF_2026) {
    const quota = Math.min(residuo, s.fino - precedente);
    if (quota <= 0) break;
    tassa += quota * s.aliquota;
    residuo -= quota;
    precedente = s.fino;
    if (residuo <= 0) break;
  }
  return tassa;
}

// Detrazione lavoro dipendente 2026 (D.Lgs. 216/2023 confermato)
function calcolaDetrazioneLavoro(redditoComplessivo) {
  if (redditoComplessivo <= 15000) return 1955;
  if (redditoComplessivo <= 28000) {
    // 1910 + 1190 × ((28000 - reddito) / 13000)
    return 1910 + 1190 * ((28000 - redditoComplessivo) / 13000);
  }
  if (redditoComplessivo <= 50000) {
    // 1910 × ((50000 - reddito) / 22000)
    return 1910 * ((50000 - redditoComplessivo) / 22000);
  }
  return 0;
}

// Bonus integrativo (100€/mese) 2026 per redditi medio-bassi
function calcolaBonusIntegrativo(redditoComplessivo, irpefLorda, detrazione) {
  // Requisito: IRPEF lorda > detrazioni (altrimenti sei incapiente)
  if (irpefLorda <= detrazione) return 0;
  if (redditoComplessivo <= BONUS_INTEGRATIVO_SOGLIA) return BONUS_INTEGRATIVO_MAX;
  if (redditoComplessivo <= BONUS_INTEGRATIVO_CUTOFF) {
    // Decalage lineare tra 15k e 28k
    const frac = (BONUS_INTEGRATIVO_CUTOFF - redditoComplessivo) / (BONUS_INTEGRATIVO_CUTOFF - BONUS_INTEGRATIVO_SOGLIA);
    return Math.round(BONUS_INTEGRATIVO_MAX * frac);
  }
  return 0;
}

// Detrazione figli a carico (stima semplificata post-AUU 2022)
// Dopo marzo 2022 i figli minori passano ad Assegno Unico; in dichiarazione restano i figli 21+
function calcolaDetrazioneFigli(nFigliOver21) {
  // Nel 2026 per figli 21+ a carico: 950€ × figlio (decalage con reddito ma semplifichiamo)
  return nFigliOver21 * 700; // stima media dopo decalage
}

// Calcolo INPS con +1% oltre soglia e massimale
function calcolaInps(ral) {
  if (ral <= 0) return 0;
  if (ral <= INPS_SOGLIA_AGGIUNTIVA) {
    return ral * INPS_ALIQUOTA_BASE;
  }
  // Fino al massimale
  const ralTassabile = Math.min(ral, INPS_MASSIMALE_2026);
  const quotaBase = ralTassabile * INPS_ALIQUOTA_BASE;
  const eccedenza = Math.max(0, Math.min(ral, INPS_MASSIMALE_2026) - INPS_SOGLIA_AGGIUNTIVA);
  const quotaAggiuntiva = eccedenza * INPS_ALIQUOTA_AGGIUNTIVA;
  return quotaBase + quotaAggiuntiva;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function CalcolatoreStipendio({ color = '#10b981' }) {
  const [ral, setRal] = useState(28000);
  const [mensilita, setMensilita] = useState(13);
  const [regione, setRegione] = useState('Lombardia');
  const [comune, setComune] = useState('Milano');
  const [nFigliOver21, setNFigliOver21] = useState(0);

  const t = THEME;
  const themeColor = color || t.primary;

  const risultati = useMemo(() => {
    const inpsAnnuo = calcolaInps(ral);
    const imponibileFiscale = Math.max(0, ral - inpsAnnuo);

    const irpefLorda = calcolaIrpefLorda(imponibileFiscale);
    const detrazioneLavoro = calcolaDetrazioneLavoro(imponibileFiscale);
    const detrazioneFigli = calcolaDetrazioneFigli(nFigliOver21);
    const detrazioniTotali = detrazioneLavoro + detrazioneFigli;

    const irpefNetta = Math.max(0, irpefLorda - detrazioniTotali);

    const bonusIntegrativo = calcolaBonusIntegrativo(imponibileFiscale, irpefLorda, detrazioniTotali);

    const aliqReg = ADDIZIONALI_REGIONALI[regione] || 0.017;
    const aliqCom = ADDIZIONALI_COMUNALI[comune] || 0.006;

    // Addizionali si applicano se imponibile > no tax area regionale (semplificato)
    const addRegionale = imponibileFiscale > NO_TAX_AREA ? imponibileFiscale * aliqReg : 0;
    const addComunale = imponibileFiscale > NO_TAX_AREA ? imponibileFiscale * aliqCom : 0;

    const totaleTrattenute = inpsAnnuo + irpefNetta + addRegionale + addComunale;
    const nettoAnnuo = ral - totaleTrattenute + bonusIntegrativo;
    const nettoMensile = nettoAnnuo / mensilita;

    // Aliquota marginale (prossimo euro di RAL)
    let aliqMarginale = 0;
    if (imponibileFiscale <= NO_TAX_AREA) aliqMarginale = 0;
    else if (imponibileFiscale <= 28000) aliqMarginale = 0.23;
    else if (imponibileFiscale <= 50000) aliqMarginale = 0.33;
    else aliqMarginale = 0.43;
    aliqMarginale += aliqReg + aliqCom;
    // + 1% INPS per redditi sopra soglia
    if (ral > INPS_SOGLIA_AGGIUNTIVA && ral <= INPS_MASSIMALE_2026) aliqMarginale += INPS_ALIQUOTA_BASE + INPS_ALIQUOTA_AGGIUNTIVA;
    else if (ral <= INPS_MASSIMALE_2026) aliqMarginale += INPS_ALIQUOTA_BASE;

    const aliqMedia = ral > 0 ? (ral - nettoAnnuo) / ral : 0;

    return {
      inpsAnnuo: Math.round(inpsAnnuo),
      imponibileFiscale: Math.round(imponibileFiscale),
      irpefLorda: Math.round(irpefLorda),
      detrazioneLavoro: Math.round(detrazioneLavoro),
      detrazioneFigli: Math.round(detrazioneFigli),
      irpefNetta: Math.round(irpefNetta),
      bonusIntegrativo: Math.round(bonusIntegrativo),
      addRegionale: Math.round(addRegionale),
      addComunale: Math.round(addComunale),
      totaleTrattenute: Math.round(totaleTrattenute),
      nettoAnnuo: Math.round(nettoAnnuo),
      nettoMensile: Math.round(nettoMensile),
      aliqMarginale,
      aliqMedia
    };
  }, [ral, mensilita, regione, comune, nFigliOver21]);

  const formatEuro = (v) => `€ ${Math.round(v).toLocaleString('it-IT')}`;
  const formatPerc = (v) => `${(v * 100).toFixed(1)}%`;

  // --- STILI ---
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

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====================================================================
          INPUT PANEL
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22, fontWeight: 800, color: '#0f172a',
          margin: '0 0 6px', letterSpacing: '-0.01em'
        }}>
          Dal lordo al netto 2026
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
          Aliquote Legge di Bilancio 2026 con IRPEF 33% sul secondo scaglione, addizionali regionali e comunali reali, bonus in busta per redditi bassi.
        </p>

        {/* RAL slider */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <label style={labelStyle}>Retribuzione Annua Lorda (RAL)</label>
            <span style={{ fontSize: 22, fontWeight: 900, color: themeColor, fontVariantNumeric: 'tabular-nums' }}>
              {formatEuro(ral)}
            </span>
          </div>
          <input
            type="range" min={10000} max={200000} step={500}
            value={ral} onChange={(e) => setRal(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: themeColor, height: 6 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            <span>€10k</span><span>€200k</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>

          {/* Mensilità */}
          <div>
            <label style={labelStyle}>Mensilità</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[12, 13, 14].map(m => {
                const active = mensilita === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMensilita(m)}
                    style={{
                      flex: 1, padding: '12px',
                      borderRadius: 12,
                      border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                      background: active ? t.soft : '#fff',
                      color: active ? '#0f172a' : '#64748b',
                      fontSize: 15, fontWeight: 800, cursor: 'pointer'
                    }}
                  >{m}</button>
                );
              })}
            </div>
          </div>

          {/* Regione */}
          <div>
            <label style={labelStyle}>Regione di residenza</label>
            <select value={regione} onChange={(e) => setRegione(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {Object.keys(ADDIZIONALI_REGIONALI).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Comune */}
          <div>
            <label style={labelStyle}>Comune</label>
            <select value={comune} onChange={(e) => setComune(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {Object.keys(ADDIZIONALI_COMUNALI).map(c => (
                <option key={c} value={c}>{c === 'Altro' ? 'Altro (media nazionale)' : c}</option>
              ))}
            </select>
          </div>

          {/* Figli a carico 21+ */}
          <div>
            <label style={labelStyle}>Figli a carico over 21</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2, 3].map(n => {
                const active = nFigliOver21 === n;
                return (
                  <button
                    key={n}
                    onClick={() => setNFigliOver21(n)}
                    style={{
                      flex: 1, padding: '12px',
                      borderRadius: 12,
                      border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                      background: active ? t.soft : '#fff',
                      color: active ? '#0f172a' : '#64748b',
                      fontSize: 15, fontWeight: 800, cursor: 'pointer'
                    }}
                  >{n === 3 ? '3+' : n}</button>
                );
              })}
            </div>
          </div>

        </div>

        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, fontStyle: 'italic', marginTop: 8 }}>
          ⓘ I figli minori di 21 anni non rientrano più tra le detrazioni IRPEF dal 2022: sono coperti dall'Assegno Unico Universale (vedi tool dedicato).
        </div>
      </div>

      {/* ====================================================================
          NETTO HERO
          ==================================================================== */}
      <div style={{
        background: `linear-gradient(135deg, ${themeColor}12 0%, ${themeColor}04 100%)`,
        border: `2px solid ${themeColor}40`,
        borderRadius: 24, padding: '36px 24px', marginBottom: 24, textAlign: 'center'
      }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Netto mensile stimato ({mensilita} mensilità)
        </div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 52, fontWeight: 900, color: themeColor,
          lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums'
        }}>
          {formatEuro(risultati.nettoMensile)}
        </div>
        <div style={{ fontSize: 13, color: '#475569' }}>
          <strong>{formatEuro(risultati.nettoAnnuo)}</strong> netti annui · ti costa a fisco e previdenza il <strong>{formatPerc(risultati.aliqMedia)}</strong> del lordo
        </div>
        {risultati.bonusIntegrativo > 0 && (
          <div style={{
            display: 'inline-block',
            marginTop: 14, padding: '6px 14px',
            background: '#dcfce7', color: '#166534',
            fontSize: 12, fontWeight: 700, borderRadius: 20
          }}>
            ✨ Include bonus integrativo {formatEuro(risultati.bonusIntegrativo)}/anno
          </div>
        )}
      </div>

      {/* ====================================================================
          BREAKDOWN DETTAGLIATO
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h3 style={{
          fontSize: 16, fontWeight: 800, color: '#0f172a',
          margin: '0 0 20px', letterSpacing: '-0.01em'
        }}>
          Dove finiscono gli altri {formatEuro(risultati.totaleTrattenute - risultati.bonusIntegrativo)}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
          <BreakdownRow
            label="Contributi INPS (9,19% fino a €56.224, +1% oltre)"
            value={risultati.inpsAnnuo}
            color="#64748b"
          />
          <div style={{ height: 1, background: '#e2e8f0' }} />
          <BreakdownRow
            label="Imponibile fiscale (RAL − INPS)"
            value={risultati.imponibileFiscale}
            color="#0f172a"
            strong
          />
          <BreakdownRow
            label="IRPEF lorda (23% / 33% / 43%)"
            value={risultati.irpefLorda}
            color="#64748b"
          />
          {risultati.detrazioneLavoro > 0 && (
            <BreakdownRow
              label="− Detrazione lavoro dipendente"
              value={-risultati.detrazioneLavoro}
              color="#059669"
            />
          )}
          {risultati.detrazioneFigli > 0 && (
            <BreakdownRow
              label={`− Detrazione ${nFigliOver21} figli over 21 a carico`}
              value={-risultati.detrazioneFigli}
              color="#059669"
            />
          )}
          <BreakdownRow
            label="= IRPEF netta"
            value={risultati.irpefNetta}
            color="#dc2626"
            strong
          />
          <div style={{ height: 1, background: '#e2e8f0' }} />
          <BreakdownRow
            label={`Addizionale regionale (${regione})`}
            value={risultati.addRegionale}
            color="#64748b"
          />
          <BreakdownRow
            label={`Addizionale comunale (${comune})`}
            value={risultati.addComunale}
            color="#64748b"
          />
          {risultati.bonusIntegrativo > 0 && (
            <>
              <div style={{ height: 1, background: '#e2e8f0' }} />
              <BreakdownRow
                label="Bonus integrativo in busta"
                value={risultati.bonusIntegrativo}
                color="#059669"
                strong
              />
            </>
          )}
        </div>

        {/* Aliquote marginale + media */}
        <div style={{
          marginTop: 24, padding: '14px 16px',
          background: '#f8fafc', borderRadius: 12,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Aliquota media
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {formatPerc(risultati.aliqMedia)}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>% reale di tasse sul totale</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Aliquota marginale
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {formatPerc(risultati.aliqMarginale)}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>che perdi sul prossimo €1 di lordo</div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CTA SOBRIO VERSO CONTI-CORRENTI
          ==================================================================== */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 20, padding: '24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 280px' }}>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            Il tuo netto lavora se lo fai lavorare
          </h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Un conto corrente che remunera la liquidità aumenta il netto senza cambiare lavoro. Vedi il confronto tra i conti con interessi attivi.
          </p>
        </div>
        <a href="/conti-correnti" style={{
          padding: '12px 20px', borderRadius: 12,
          background: themeColor, color: '#fff',
          fontSize: 13, fontWeight: 800,
          textDecoration: 'none', whiteSpace: 'nowrap',
          boxShadow: `0 6px 16px -4px ${themeColor}60`
        }}>
          Confronta i conti →
        </a>
      </div>

      {/* ====================================================================
          DISCLAIMER LEGALE
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
          <strong>Parametri aggiornati al 2026</strong> (Legge di Bilancio 2026 n. 199/2025): IRPEF 23% fino a 28.000€, 33% da 28k a 50k (ridotto dal 35%), 43% oltre. Contributi INPS dipendente 9,19% con aggiunta dell'1% sulle retribuzioni oltre 56.224€ e massimale contributivo 122.295€ (circolare INPS 8/2026). No Tax Area 8.500€. Detrazione lavoro dipendente 1.955€ fino a 15k e decalage fino a 50k. Bonus integrativo in busta paga 100€/mese (1.200€/anno) per redditi fino a 15k con decalage fino a 28k.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Elementi NON calcolati</strong>: premi di produttività tassati al 1% (nuova aliquota 2026), welfare aziendale e fringe benefit (auto, buoni pasto, smart working), detrazioni per coniuge a carico, detrazioni 730 (spese mediche, mutuo, ristrutturazioni, fondo pensione), contratti CCNL dirigenti/quadri con trattamenti specifici, apprendistato (aliquota INPS ridotta 5,84%), aliquote dei comuni diversi da quelli elencati (applichiamo media nazionale 0,6%).
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Stima educativa, non busta paga reale.</strong> Il calcolo segue le regole generali del sostituto d'imposta, ma la tua busta paga reale può differire per conguagli, ratei, straordinari, mesi di assenza, bonus, premi, ticket restaurant e altre voci specifiche del tuo contratto. Per verifiche ufficiali consulta la busta paga reale fornita dal tuo datore di lavoro o un consulente del lavoro iscritto all'Albo.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Non siamo commercialisti né consulenti del lavoro</strong>: questo strumento è informativo e non costituisce consulenza fiscale personalizzata.
        </p>
      </div>

    </div>
  );
}

// --- Helper component per breakdown rows ---
function BreakdownRow({ label, value, color = '#64748b', strong = false }) {
  const formatEuro = (v) => `€ ${Math.abs(Math.round(v)).toLocaleString('it-IT')}`;
  const sign = value < 0 ? '−' : value > 0 ? '' : '';
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'baseline', gap: 10
    }}>
      <span style={{
        color,
        fontWeight: strong ? 700 : 500,
        fontSize: 13,
        lineHeight: 1.4,
        flex: 1
      }}>{label}</span>
      <span style={{
        color,
        fontWeight: strong ? 900 : 700,
        fontSize: strong ? 16 : 14,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap'
      }}>{sign === '−' ? '− ' : ''}{formatEuro(value)}</span>
    </div>
  );
}