import React, { useState, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════
// COSTANTI FISCALI — VERIFICA OGNI ANNO (gennaio)
// Riferimento: Legge di Bilancio e circolari Agenzia Entrate
// ═══════════════════════════════════════════════════════════

// Scaglioni IRPEF 2024-2026 (3 scaglioni)
const SCAGLIONI_IRPEF = [
  { fino: 28000, aliquota: 0.23 },
  { fino: 50000, aliquota: 0.35 },
  { fino: Infinity, aliquota: 0.43 },
];

const ADDIZIONALE_REGIONALE = 0.0173;   // media nazionale ~1,73%
const ADDIZIONALE_COMUNALE = 0.008;     // media ~0,8%
const INPS_GESTIONE_SEPARATA = 0.2607;  // 26,07% per chi non ha cassa propria
const SOGLIA_FORFETTARIO = 85000;
const ANNI_STARTUP = 5;
const ALIQUOTA_STARTUP = 0.05;
const ALIQUOTA_FORFETTARIO = 0.15;

// Coefficienti di redditività per gruppi ATECO
const CATEGORIE_ATECO = [
  { id: 'professioni', label: 'Professioni intellettuali', coeff: 0.78, desc: 'Consulenti, avvocati, ingegneri, architetti' },
  { id: 'servizi', label: 'Altre attività di servizi', coeff: 0.67, desc: 'Servizi alle imprese non specifici' },
  { id: 'commercio', label: 'Commercio al dettaglio e ingrosso', coeff: 0.40, desc: 'Vendita di beni' },
  { id: 'intermediari', label: 'Intermediari del commercio', coeff: 0.62, desc: 'Agenti di commercio' },
  { id: 'costruzioni', label: 'Costruzioni e attività immobiliari', coeff: 0.86, desc: 'Edilizia, agenzie immobiliari' },
  { id: 'ristorazione', label: 'Alberghi e ristorazione', coeff: 0.40, desc: 'Ristoranti, bar, B&B' },
];

function calcolaIrpef(imponibile) {
  let tassa = 0;
  let residuo = imponibile;
  let precedente = 0;
  
  for (const scaglione of SCAGLIONI_IRPEF) {
    const quota = Math.min(residuo, scaglione.fino - precedente);
    if (quota <= 0) break;
    tassa += quota * scaglione.aliquota;
    residuo -= quota;
    precedente = scaglione.fino;
    if (residuo <= 0) break;
  }
  return tassa;
}

export function ForfettarioVsOrdinario({ color = '#6366f1' }) {
  const [fatturato, setFatturato] = useState(40000);
  const [categoria, setCategoria] = useState('professioni');
  const [anniAttivita, setAnniAttivita] = useState(2);
  const [spese, setSpese] = useState(3000);
  const [haCassaPropria, setHaCassaPropria] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const catSelected = CATEGORIE_ATECO.find(c => c.id === categoria) || CATEGORIE_ATECO[0];

  const risultati = useMemo(() => {
    const eligibile = fatturato <= SOGLIA_FORFETTARIO;
    const startup = anniAttivita <= ANNI_STARTUP;
    const aliquotaForf = startup ? ALIQUOTA_STARTUP : ALIQUOTA_FORFETTARIO;
    
    // ══════ FORFETTARIO ══════
    const redditoImponibileForf = fatturato * catSelected.coeff;
    const inpsForf = haCassaPropria ? 0 : redditoImponibileForf * INPS_GESTIONE_SEPARATA;
    // Nel forfettario l'INPS si deduce dal reddito imponibile
    const imponibileTassabileForf = Math.max(0, redditoImponibileForf - inpsForf);
    const impostaSostitutivaForf = imponibileTassabileForf * aliquotaForf;
    const nettoForf = fatturato - spese - inpsForf - impostaSostitutivaForf;
    
    // ══════ ORDINARIO ══════
    const redditoOrdinario = Math.max(0, fatturato - spese);
    const inpsOrd = haCassaPropria ? 0 : redditoOrdinario * INPS_GESTIONE_SEPARATA;
    const imponibileIrpef = Math.max(0, redditoOrdinario - inpsOrd);
    const irpef = calcolaIrpef(imponibileIrpef);
    const addReg = imponibileIrpef * ADDIZIONALE_REGIONALE;
    const addCom = imponibileIrpef * ADDIZIONALE_COMUNALE;
    const totImposteOrd = irpef + addReg + addCom;
    const nettoOrd = fatturato - spese - inpsOrd - totImposteOrd;
    
    const differenza = nettoForf - nettoOrd;
    const convieneForf = differenza > 0;
    
    return {
      eligibile,
      startup,
      aliquotaForf,
      forf: {
        redditoImponibile: Math.round(redditoImponibileForf),
        inps: Math.round(inpsForf),
        imposta: Math.round(impostaSostitutivaForf),
        netto: Math.round(nettoForf),
      },
      ord: {
        reddito: Math.round(redditoOrdinario),
        inps: Math.round(inpsOrd),
        irpef: Math.round(irpef),
        addRegionale: Math.round(addReg),
        addComunale: Math.round(addCom),
        totImposte: Math.round(totImposteOrd),
        netto: Math.round(nettoOrd),
      },
      differenza: Math.round(differenza),
      convieneForf,
    };
  }, [fatturato, categoria, anniAttivita, spese, haCassaPropria, catSelected]);

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    fontFamily: 'inherit',
    color: '#0f172a',
    background: '#fff',
    outline: 'none'
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 6
  };

  const formatEuro = (v) => `€${Math.round(v).toLocaleString('it-IT')}`;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      
      {/* INPUT PANEL */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>La tua situazione</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          
          <div>
            <label style={labelStyle}>Fatturato annuo previsto</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={fatturato} onChange={(e) => setFatturato(Number(e.target.value) || 0)} style={{...inputStyle, paddingLeft: 28}} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Spese deducibili stimate</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={spese} onChange={(e) => setSpese(Number(e.target.value) || 0)} style={{...inputStyle, paddingLeft: 28}} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Anni di attività</label>
            <input type="number" value={anniAttivita} onChange={(e) => setAnniAttivita(Number(e.target.value) || 0)} style={inputStyle} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Categoria di attività</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{...inputStyle, cursor: 'pointer'}}>
              {CATEGORIE_ATECO.map(c => (
                <option key={c.id} value={c.id}>{c.label} (coefficiente {Math.round(c.coeff * 100)}%)</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, paddingLeft: 2 }}>{catSelected.desc}</div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Contributi previdenziali</label>
            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 4, borderRadius: 12, gap: 2 }}>
              <button 
                onClick={() => setHaCassaPropria(false)} 
                style={{
                  padding: '8px 18px', borderRadius: 9, border: 'none', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: !haCassaPropria ? '#fff' : 'transparent',
                  color: !haCassaPropria ? color : '#64748b',
                  boxShadow: !haCassaPropria ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s'
                }}
              >Gestione Separata INPS</button>
              <button 
                onClick={() => setHaCassaPropria(true)} 
                style={{
                  padding: '8px 18px', borderRadius: 9, border: 'none', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: haCassaPropria ? '#fff' : 'transparent',
                  color: haCassaPropria ? color : '#64748b',
                  boxShadow: haCassaPropria ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s'
                }}
              >Cassa di categoria</button>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, paddingLeft: 2 }}>Se hai cassa propria (avvocati, medici, ingegneri, ecc.) seleziona "Cassa di categoria" — l'INPS non viene calcolato.</div>
          </div>

        </div>
      </div>

      {/* ELIGIBILITÀ */}
      {!risultati.eligibile && (
        <div style={{ background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 16, padding: '14px 20px', marginBottom: 24, fontSize: 13, color: '#991b1b' }}>
          <strong>⚠️ Fatturato oltre soglia forfettario.</strong> Con fatturato superiore a {formatEuro(SOGLIA_FORFETTARIO)} il regime forfettario non è accessibile. Il confronto mostrato è solo teorico.
        </div>
      )}

      {/* VERDETTO */}
      <div style={{ 
        background: `linear-gradient(135deg, ${color}12, ${color}04)`, 
        border: `1px solid ${color}40`, 
        borderRadius: 20, 
        padding: '24px 28px', 
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Verdetto</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif", marginBottom: 6 }}>
          {risultati.convieneForf 
            ? `Il forfettario ti fa risparmiare ${formatEuro(Math.abs(risultati.differenza))}/anno`
            : `L'ordinario ti fa risparmiare ${formatEuro(Math.abs(risultati.differenza))}/anno`}
        </div>
        {risultati.startup && risultati.convieneForf && (
          <div style={{ fontSize: 13, color: '#059669', fontWeight: 700 }}>
            ✨ Stai beneficiando dell'aliquota start-up al 5% (primi 5 anni)
          </div>
        )}
      </div>

      {/* CONFRONTO A DUE COLONNE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
        
        {/* FORFETTARIO */}
        <div style={{ 
          background: '#fff', 
          border: risultati.convieneForf ? `2px solid ${color}` : '1px solid #e2e8f0', 
          borderRadius: 20, 
          padding: 24,
          position: 'relative'
        }}>
          {risultati.convieneForf && (
            <div style={{ position: 'absolute', top: -10, left: 20, background: color, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.8px' }}>
              MIGLIORE
            </div>
          )}
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Regime Forfettario</h3>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>
            Aliquota {Math.round(risultati.aliquotaForf * 100)}% · coefficiente {Math.round(catSelected.coeff * 100)}%
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Reddito imponibile</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatEuro(risultati.forf.redditoImponibile)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>− Contributi INPS</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatEuro(risultati.forf.inps)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>− Imposta sostitutiva</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatEuro(risultati.forf.imposta)}</span>
            </div>
            <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Netto annuo</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: risultati.convieneForf ? color : '#0f172a' }}>{formatEuro(risultati.forf.netto)}</span>
            </div>
          </div>
        </div>

        {/* ORDINARIO */}
        <div style={{ 
          background: '#fff', 
          border: !risultati.convieneForf ? `2px solid ${color}` : '1px solid #e2e8f0', 
          borderRadius: 20, 
          padding: 24,
          position: 'relative'
        }}>
          {!risultati.convieneForf && (
            <div style={{ position: 'absolute', top: -10, left: 20, background: color, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.8px' }}>
              MIGLIORE
            </div>
          )}
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Regime Ordinario</h3>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>
            IRPEF progressiva + addizionali
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Reddito imponibile</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatEuro(risultati.ord.reddito)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>− Contributi INPS</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatEuro(risultati.ord.inps)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>− IRPEF</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatEuro(risultati.ord.irpef)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>− Add. regionale + comunale</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatEuro(risultati.ord.addRegionale + risultati.ord.addComunale)}</span>
            </div>
            <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Netto annuo</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: !risultati.convieneForf ? color : '#0f172a' }}>{formatEuro(risultati.ord.netto)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* DISCLAIMER */}
      <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 16, padding: '16px 20px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
        <strong>ℹ️ Nota sulle stime</strong>
        <div style={{ display: disclaimerOpen ? 'block' : '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 6 }}>
          Il calcolo usa: scaglioni IRPEF 2024-2026, addizionali medie nazionali (regionale 1,73%, comunale 0,8% — verifica quelle reali del tuo comune/regione), aliquota Gestione Separata INPS al 26,07%. Il coefficiente di redditività è semplificato per macrocategorie: il tuo codice ATECO specifico potrebbe avere un coefficiente diverso di ±5-10 punti. Non sono incluse: detrazioni per carichi di famiglia, deduzioni specifiche, rimborsi spese professionali, bonus fiscali territoriali. I risultati sono indicativi e non sostituiscono il parere di un commercialista.
        </div>
        <button onClick={() => setDisclaimerOpen(!disclaimerOpen)} style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 800, fontSize: 12, padding: 0, marginTop: 6, cursor: 'pointer', textDecoration: 'underline' }}>
          {disclaimerOpen ? 'Riduci ↑' : 'Leggi tutto ↓'}
        </button>
      </div>

    </div>
  );
}