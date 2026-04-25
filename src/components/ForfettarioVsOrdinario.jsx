import React, { useState, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════
// COSTANTI FISCALI — VERIFICA OGNI ANNO (gennaio)
// Riferimento: Legge di Bilancio e circolari Agenzia Entrate
// ═══════════════════════════════════════════════════════════

// Scaglioni IRPEF 2024-2026 (3 scaglioni confermati)
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
  const [fatturatoStr, setFatturatoStr] = useState('40000');
  const [speseStr, setSpeseStr] = useState('3000');
  const [anniAttivitaStr, setAnniAttivitaStr] = useState('2');
  
  const [categoria, setCategoria] = useState('professioni');
  const [haCassaPropria, setHaCassaPropria] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const catSelected = CATEGORIE_ATECO.find(c => c.id === categoria) || CATEGORIE_ATECO[0];

  const risultati = useMemo(() => {
    // Parsing sicuro per evitare NaN quando si cancella il campo
    const fatturato = parseFloat(fatturatoStr) || 0;
    const spese = parseFloat(speseStr) || 0;
    const anniAttivita = parseInt(anniAttivitaStr) || 0;

    const eligibile = fatturato <= SOGLIA_FORFETTARIO;
    const startup = anniAttivita <= ANNI_STARTUP;
    const aliquotaForf = startup ? ALIQUOTA_STARTUP : ALIQUOTA_FORFETTARIO;
    
    // ══════ FORFETTARIO ══════
    const redditoImponibileForf = fatturato * catSelected.coeff;
    const inpsForf = haCassaPropria ? 0 : redditoImponibileForf * INPS_GESTIONE_SEPARATA;
    const imponibileTassabileForf = Math.max(0, redditoImponibileForf - inpsForf);
    const impostaSostitutivaForf = imponibileTassabileForf * aliquotaForf;
    // Il Netto Reale sottrae le spese vive sostenute, non quelle forfettarie
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
  }, [fatturatoStr, categoria, anniAttivitaStr, speseStr, haCassaPropria, catSelected]);

  const inputStyle = {
    width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #e2e8f0',
    borderRadius: 12, fontFamily: 'inherit', color: '#0f172a', background: '#fff', outline: 'none'
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6
  };

  const formatEuro = (v) => `€ ${Math.round(v).toLocaleString('it-IT')}`;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      <style dangerouslySetInnerHTML={{__html:`
        @media(max-width:500px){
          .fvo-panel { padding:20px 16px !important; }
          .fvo-panel h2 { font-size:16px !important; margin-bottom:18px !important; }
          .fvo-grid { grid-template-columns:1fr 1fr !important; gap:12px !important; }
          .fvo-grid > div[style*="gridColumn"] { grid-column:1/-1 !important; }
          .fvo-contrib button { padding:8px 6px !important; font-size:12px !important; }
          .fvo-result { padding:20px 16px !important; }
          .fvo-result-num { font-size:24px !important; }
        }
      `}}/>
      
      {/* INPUT PANEL */}
      <div className="fvo-panel" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '28px 24px', marginBottom: 24, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>1. Inserisci i tuoi dati</h2>
        
        <div className="fvo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          
          <div>
            <label style={labelStyle}>Fatturato annuo previsto</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={fatturatoStr} onChange={(e) => setFatturatoStr(e.target.value)} style={{...inputStyle, paddingLeft: 32, fontWeight: 700, color: color}} />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Spese deducibili stimate</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={speseStr} onChange={(e) => setSpeseStr(e.target.value)} style={{...inputStyle, paddingLeft: 32}} />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Da quanti anni hai aperto?</label>
            <input type="number" value={anniAttivitaStr} onChange={(e) => setAnniAttivitaStr(e.target.value)} style={inputStyle} min="0" />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Categoria di attività (Codice ATECO)</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{...inputStyle, cursor: 'pointer'}}>
              {CATEGORIE_ATECO.map(c => (
                <option key={c.id} value={c.id}>{c.label} (coeff. {Math.round(c.coeff * 100)}%)</option>
              ))}
            </select>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{catSelected.desc}</div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Contributi previdenziali</label>
            <div className="fvo-contrib" style={{ display: 'flex', flexWrap: 'wrap', background: '#f1f5f9', padding: 6, borderRadius: 14, gap: 4 }}>
              <button 
                onClick={() => setHaCassaPropria(false)} 
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', fontFamily: 'inherit',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  background: !haCassaPropria ? '#fff' : 'transparent',
                  color: !haCassaPropria ? color : '#64748b',
                  boxShadow: !haCassaPropria ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >Gestione Separata INPS</button>
              <button 
                onClick={() => setHaCassaPropria(true)} 
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', fontFamily: 'inherit',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  background: haCassaPropria ? '#fff' : 'transparent',
                  color: haCassaPropria ? color : '#64748b',
                  boxShadow: haCassaPropria ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >Cassa di Categoria</button>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Se hai una cassa professionale autonoma (avvocati, medici, architetti), seleziona "Cassa di Categoria". Il calcolatore ignorerà le aliquote INPS.</div>
          </div>

        </div>
      </div>

      {/* ELIGIBILITÀ */}
      {!risultati.eligibile && (
        <div style={{ background: '#fee2e2', border: '1px solid #f87171', borderRadius: 16, padding: '16px 20px', marginBottom: 24, fontSize: 14, color: '#991b1b', lineHeight: 1.5 }}>
          <strong>⚠️ Attenzione: hai superato la soglia!</strong><br/>
          Con un fatturato superiore a {formatEuro(SOGLIA_FORFETTARIO)} non puoi accedere al regime forfettario. Il confronto qui sotto è puramente teorico.
        </div>
      )}

      {/* VERDETTO */}
      <div style={{ 
        background: `linear-gradient(135deg, ${color}12, ${color}04)`, 
        border: `2px solid ${color}40`, 
        borderRadius: 24, 
        padding: '32px 24px', 
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Il Verdetto di SoldiBuoni</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif", marginBottom: 8, lineHeight: 1.2 }}>
          {risultati.convieneForf 
            ? `Il Forfettario ti fa risparmiare ${formatEuro(Math.abs(risultati.differenza))} netti all'anno.`
            : `L'Ordinario ti fa risparmiare ${formatEuro(Math.abs(risultati.differenza))} netti all'anno.`}
        </div>
        {risultati.startup && risultati.convieneForf && risultati.eligibile && (
          <div style={{ fontSize: 14, color: '#059669', fontWeight: 700, marginTop: 12, display: 'inline-block', background: '#dcfce7', padding: '6px 14px', borderRadius: 20 }}>
            ✨ Stai beneficiando dell'aliquota Start-up agevolata al 5%
          </div>
        )}
      </div>

      {/* CONFRONTO A DUE COLONNE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        
        {/* FORFETTARIO */}
        <div style={{ 
          background: '#fff', 
          border: risultati.convieneForf ? `2px solid ${color}` : '1px solid #e2e8f0', 
          borderRadius: 24, 
          padding: 28,
          position: 'relative'
        }}>
          {risultati.convieneForf && (
            <div style={{ position: 'absolute', top: -12, left: 24, background: color, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.5px' }}>
              🥇 SCELTA MIGLIORE
            </div>
          )}
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Regime Forfettario</h3>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Tassa fissa {Math.round(risultati.aliquotaForf * 100)}% su base {Math.round(catSelected.coeff * 100)}%
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Base Imponibile</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatEuro(risultati.forf.redditoImponibile)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Contributi INPS</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>− {formatEuro(risultati.forf.inps)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Imposta Sostitutiva</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>− {formatEuro(risultati.forf.imposta)}</span>
            </div>
            <div style={{ height: 1, background: '#e2e8f0', margin: '12px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Netto Annuo</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: risultati.convieneForf ? color : '#0f172a' }}>{formatEuro(risultati.forf.netto)}</span>
            </div>
          </div>
        </div>

        {/* ORDINARIO */}
        <div style={{ 
          background: '#fff', 
          border: !risultati.convieneForf ? `2px solid ${color}` : '1px solid #e2e8f0', 
          borderRadius: 24, 
          padding: 28,
          position: 'relative'
        }}>
          {!risultati.convieneForf && (
            <div style={{ position: 'absolute', top: -12, left: 24, background: color, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.5px' }}>
              🥇 SCELTA MIGLIORE
            </div>
          )}
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Regime Ordinario</h3>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            IRPEF a Scaglioni + Addizionali
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Base Imponibile (Utile)</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatEuro(risultati.ord.reddito)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Contributi INPS</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>− {formatEuro(risultati.ord.inps)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Totale IRPEF</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>− {formatEuro(risultati.ord.irpef)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Addizionali Locali</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>− {formatEuro(risultati.ord.addRegionale + risultati.ord.addComunale)}</span>
            </div>
            <div style={{ height: 1, background: '#e2e8f0', margin: '12px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Netto Annuo</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: !risultati.convieneForf ? color : '#0f172a' }}>{formatEuro(risultati.ord.netto)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* DISCLAIMER */}
      <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 16, padding: '20px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
        <strong>ℹ️ Nota metodologica sui calcoli</strong>
        <div style={{ display: disclaimerOpen ? 'block' : '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 8 }}>
          Il calcolatore utilizza gli scaglioni IRPEF in vigore (23% fino a 28k, 35% fino a 50k, 43% oltre 50k) e applica un'addizionale media nazionale. Sottraiamo l'INPS Gestione Separata (26,07%) per mostrare il tuo vero potere d'acquisto finale. Tieni presente che non stiamo calcolando le tue eventuali detrazioni personali (come spese mediche, ristrutturazioni o familiari a carico), le quali sono applicabili <strong>solo</strong> nel regime ordinario e potrebbero alterare questo risultato. Consulta sempre il tuo commercialista per la scelta finale.
        </div>
        <button onClick={() => setDisclaimerOpen(!disclaimerOpen)} style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 800, fontSize: 13, padding: 0, marginTop: 8, cursor: 'pointer', textDecoration: 'underline' }}>
          {disclaimerOpen ? 'Comprimi il testo ↑' : 'Leggi tutta la nota ↓'}
        </button>
      </div>

    </div>
  );
}