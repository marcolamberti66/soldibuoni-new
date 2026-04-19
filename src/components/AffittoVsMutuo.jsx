import React, { useState, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════
// COSTANTI CHE POTREBBERO DOVER ESSERE AGGIORNATE NEL TEMPO
// ═══════════════════════════════════════════════════════════
const SPESE_NOTARIO_PRIMA = 0.02;
const SPESE_NOTARIO_SECONDA = 0.10;
const AGENZIA_COMPRAVENDITA = 0.03;
const MANUTENZIONE_ANNUA = 0.01;
const IMU_SECONDA_CASA = 0.0086;
const INFLAZIONE_CANONE = 0.015;

export function AffittoVsMutuo({ color = '#10b981' }) {
  // Usiamo stringhe per evitare i NaN quando l'utente cancella i campi
  const [canoneStr, setCanoneStr] = useState('800');
  const [prezzoCasaStr, setPrezzoCasaStr] = useState('250000');
  const [anticipoStr, setAnticipoStr] = useState('50000');
  const [tassoStr, setTassoStr] = useState('3.2');
  const [durataMutuoStr, setDurataMutuoStr] = useState('25');
  const [rendimentoAltStr, setRendimentoAltStr] = useState('4');
  
  const [tipoCasa, setTipoCasa] = useState('prima');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [hoverAnno, setHoverAnno] = useState(null);

  const risultati = useMemo(() => {
    // Parsing sicuro
    const canone = parseFloat(canoneStr) || 0;
    const prezzoCasa = parseFloat(prezzoCasaStr) || 0;
    const anticipo = parseFloat(anticipoStr) || 0;
    const tasso = parseFloat(tassoStr) || 0;
    const durataMutuo = Math.max(1, parseInt(durataMutuoStr) || 1); // Evita divisioni per zero
    const rendimentoAlt = parseFloat(rendimentoAltStr) || 0;

    const capitale = Math.max(0, prezzoCasa - anticipo);
    const n = durataMutuo * 12;
    const i = tasso / 100 / 12;
    
    const rataMensile = i > 0 
      ? (capitale * i) / (1 - Math.pow(1 + i, -n))
      : capitale / n;
    
    const aliqNotarile = tipoCasa === 'prima' ? SPESE_NOTARIO_PRIMA : SPESE_NOTARIO_SECONDA;
    const speseAcquisto = prezzoCasa * (aliqNotarile + AGENZIA_COMPRAVENDITA);
    
    const imuAnnua = tipoCasa === 'prima' ? 0 : prezzoCasa * IMU_SECONDA_CASA;
    const manutenzioneAnnua = prezzoCasa * MANUTENZIONE_ANNUA;
    
    const orizzonte = 30;
    const dati = [];
    
    let equityAccumulata = anticipo;
    let costoAffittoCumul = 0;
    
    // FIX GRAVISSIMO: Il costo cumulato DEVE includere l'anticipo versato, 
    // altrimenti la sottrazione dell'equity produce costi negativi fittizi.
    let costoMutuoCumul = anticipo + speseAcquisto; 
    
    let canoneAnno = canone;
    let debitoResiduo = capitale;
    let anticipoInvestito = anticipo;
    
    for (let anno = 1; anno <= orizzonte; anno++) {
      // 1. Logica Affitto
      costoAffittoCumul += canoneAnno * 12;
      anticipoInvestito *= (1 + rendimentoAlt / 100);
      canoneAnno *= (1 + INFLAZIONE_CANONE);
      
      // 2. Logica Mutuo
      let quotaCapitaleAnno = 0;
      if (anno <= durataMutuo) {
        for (let mese = 0; mese < 12; mese++) {
          const interessiMese = debitoResiduo * i;
          const capitaleMese = rataMensile - interessiMese;
          quotaCapitaleAnno += capitaleMese;
          debitoResiduo = Math.max(0, debitoResiduo - capitaleMese);
        }
        costoMutuoCumul += (rataMensile * 12) + imuAnnua + manutenzioneAnnua;
        equityAccumulata += quotaCapitaleAnno;
      } else {
        costoMutuoCumul += imuAnnua + manutenzioneAnnua;
      }
      
      // Costo Netto = (Tutti i soldi usciti) - (Valore degli asset accumulati)
      const costoNettoAffitto = costoAffittoCumul - (anticipoInvestito - anticipo);
      const costoNettoMutuo = costoMutuoCumul - equityAccumulata;
      
      dati.push({
        anno,
        Affitto: Math.round(costoNettoAffitto),
        Acquisto: Math.round(costoNettoMutuo),
      });
    }
    
    let breakEven = null;
    for (let k = 0; k < dati.length; k++) {
      if (dati[k].Acquisto < dati[k].Affitto) {
        breakEven = dati[k].anno;
        break;
      }
    }
    
    return {
      rataMensile: Math.round(rataMensile),
      speseAcquisto: Math.round(speseAcquisto),
      imuAnnua: Math.round(imuAnnua),
      manutenzioneAnnua: Math.round(manutenzioneAnnua),
      dati,
      breakEven,
    };
  }, [canoneStr, prezzoCasaStr, anticipoStr, tassoStr, durataMutuoStr, rendimentoAltStr, tipoCasa]);

  // ════ CALCOLI PER IL GRAFICO SVG ════
  const chart = useMemo(() => {
    const W = 680;
    const H = 300;
    const PAD_L = 60;
    const PAD_R = 20;
    const PAD_T = 20;
    const PAD_B = 40;
    
    const dati = risultati.dati;
    const allValues = dati.flatMap(d => [d.Affitto, d.Acquisto]);
    const minY = Math.min(...allValues, 0);
    const maxY = Math.max(...allValues);
    const rangeY = maxY - minY || 1;
    const minX = 1;
    const maxX = dati.length;
    
    const xScale = (anno) => PAD_L + ((anno - minX) / (maxX - minX)) * (W - PAD_L - PAD_R);
    const yScale = (val) => PAD_T + ((maxY - val) / rangeY) * (H - PAD_T - PAD_B);
    
    const pathAffitto = dati.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${xScale(d.anno)} ${yScale(d.Affitto)}`).join(' ');
    const pathAcquisto = dati.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${xScale(d.anno)} ${yScale(d.Acquisto)}`).join(' ');
    
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => minY + t * rangeY);
    const xTicks = [1, 5, 10, 15, 20, 25, 30];
    
    return { W, H, PAD_L, PAD_R, PAD_T, PAD_B, xScale, yScale, pathAffitto, pathAcquisto, yTicks, xTicks };
  }, [risultati.dati]);

  const handleInteraction = (clientX, rect) => {
    const x = ((clientX - rect.left) / rect.width) * chart.W;
    if (x < chart.PAD_L || x > chart.W - chart.PAD_R) {
      setHoverAnno(null);
      return;
    }
    const annoApprox = Math.round(1 + ((x - chart.PAD_L) / (chart.W - chart.PAD_L - chart.PAD_R)) * 29);
    setHoverAnno(Math.max(1, Math.min(30, annoApprox)));
  };

  const inputStyle = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #e2e8f0', borderRadius: 12, fontFamily: 'inherit', color: '#0f172a', background: '#fff', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 };

  const formatEuro = (v) => `€ ${v.toLocaleString('it-IT')}`;
  const formatEuroCompact = (v) => Math.abs(v) >= 1000 ? `${Math.round(v/1000)}k` : v.toString();

  const verdetto = risultati.breakEven 
    ? `L'acquisto diventa più conveniente dall'anno ${risultati.breakEven}`
    : 'Nel tuo orizzonte di 30 anni, l\'affitto resta matematicamente più conveniente';

  const hoverData = hoverAnno ? risultati.dati.find(d => d.anno === hoverAnno) : null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* INPUT PANEL */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '28px 24px', marginBottom: 24, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>1. I tuoi parametri</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div>
            <label style={labelStyle}>Canone mensile affitto</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={canoneStr} onChange={(e) => setCanoneStr(e.target.value)} style={{...inputStyle, paddingLeft: 32, fontWeight: 700, color: '#dc2626'}} />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Prezzo casa target</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={prezzoCasaStr} onChange={(e) => setPrezzoCasaStr(e.target.value)} style={{...inputStyle, paddingLeft: 32, fontWeight: 700, color: color}} />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Anticipo (Cash disponibile)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={anticipoStr} onChange={(e) => setAnticipoStr(e.target.value)} style={{...inputStyle, paddingLeft: 32}} />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tasso mutuo (TAN)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" step="0.1" value={tassoStr} onChange={(e) => setTassoStr(e.target.value)} style={{...inputStyle, paddingRight: 32}} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>%</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Durata mutuo</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={durataMutuoStr} onChange={(e) => setDurataMutuoStr(e.target.value)} style={{...inputStyle, paddingRight: 45}} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>anni</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Rendimento investimenti</label>
            <div style={{ position: 'relative' }}>
              <input type="number" step="0.1" value={rendimentoAltStr} onChange={(e) => setRendimentoAltStr(e.target.value)} style={{...inputStyle, paddingRight: 32}} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>%</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <label style={labelStyle}>Tipo di abitazione</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', background: '#f1f5f9', padding: 6, borderRadius: 14, gap: 4, maxWidth: 400 }}>
            <button 
              onClick={() => setTipoCasa('prima')} 
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                background: tipoCasa === 'prima' ? '#fff' : 'transparent',
                color: tipoCasa === 'prima' ? color : '#64748b',
                boxShadow: tipoCasa === 'prima' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >Prima casa</button>
            <button 
              onClick={() => setTipoCasa('seconda')} 
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                background: tipoCasa === 'seconda' ? '#fff' : 'transparent',
                color: tipoCasa === 'seconda' ? color : '#64748b',
                boxShadow: tipoCasa === 'seconda' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >Seconda casa</button>
          </div>
        </div>
      </div>

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
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>
          {verdetto}
        </div>
      </div>

      {/* METRICHE CHIAVE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Rata mensile</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.rataMensile)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Spese acquisto (Sunk)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.speseAcquisto)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Tasse annue (IMU)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.imuAnnua)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Manutenzione annua</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.manutenzioneAnnua)}</div>
        </div>
      </div>

      {/* GRAFICO SVG */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '28px 24px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Costo Netto (Soldi Persi) nel tempo</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Più la linea è bassa, meglio è. Il costo dell'affitto è ridotto dagli interessi maturati dall'anticipo investito in borsa.</p>
        
        <div style={{ position: 'relative', width: '100%' }}>
          <svg 
            viewBox={`0 0 ${chart.W} ${chart.H}`} 
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
            onMouseLeave={() => setHoverAnno(null)}
            onMouseMove={(e) => handleInteraction(e.clientX, e.currentTarget.getBoundingClientRect())}
            onTouchMove={(e) => handleInteraction(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
            onTouchStart={(e) => handleInteraction(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          >
            {chart.yTicks.map((v, idx) => (
              <g key={`ygrid-${idx}`}>
                <line x1={chart.PAD_L} y1={chart.yScale(v)} x2={chart.W - chart.PAD_R} y2={chart.yScale(v)} stroke="#f1f5f9" strokeWidth="1" />
                <text x={chart.PAD_L - 8} y={chart.yScale(v) + 4} fontSize="11" fill="#94a3b8" textAnchor="end" fontWeight="500">{formatEuroCompact(v)}</text>
              </g>
            ))}
            
            {chart.xTicks.map((t, idx) => (
              <text key={`xtick-${idx}`} x={chart.xScale(t)} y={chart.H - chart.PAD_B + 20} fontSize="11" fill="#94a3b8" textAnchor="middle" fontWeight="600">{t}</text>
            ))}
            <text x={chart.W / 2} y={chart.H - 4} fontSize="11" fill="#94a3b8" textAnchor="middle" fontWeight="700">Anni</text>
            
            {risultati.breakEven && (
              <g>
                <line x1={chart.xScale(risultati.breakEven)} y1={chart.PAD_T} x2={chart.xScale(risultati.breakEven)} y2={chart.H - chart.PAD_B} stroke={color} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
                <text x={chart.xScale(risultati.breakEven)} y={chart.PAD_T - 6} fontSize="11" fontWeight="800" fill={color} textAnchor="middle">Break-even ({risultati.breakEven})</text>
              </g>
            )}
            
            <path d={chart.pathAffitto} stroke="#dc2626" strokeWidth="3" fill="none" strokeLinejoin="round" />
            <path d={chart.pathAcquisto} stroke={color} strokeWidth="3" fill="none" strokeLinejoin="round" />
            
            {hoverData && (
              <g>
                <line x1={chart.xScale(hoverAnno)} y1={chart.PAD_T} x2={chart.xScale(hoverAnno)} y2={chart.H - chart.PAD_B} stroke="#cbd5e1" strokeWidth="1" />
                <circle cx={chart.xScale(hoverAnno)} cy={chart.yScale(hoverData.Affitto)} r="5" fill="#dc2626" stroke="#fff" strokeWidth="2" />
                <circle cx={chart.xScale(hoverAnno)} cy={chart.yScale(hoverData.Acquisto)} r="5" fill={color} stroke="#fff" strokeWidth="2" />
              </g>
            )}
          </svg>
          
          {hoverData && (
            <div style={{ 
              position: 'absolute', top: -10, right: 10, background: '#fff', border: '1px solid #e2e8f0', 
              borderRadius: 12, padding: '12px 16px', fontSize: 13, boxShadow: '0 10px 20px rgba(0,0,0,0.08)', pointerEvents: 'none', minWidth: 180
            }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>Anno {hoverAnno}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>● Affitto</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatEuro(hoverData.Affitto)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ color: color, fontWeight: 600 }}>● Acquisto</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatEuro(hoverData.Acquisto)}</span>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16, fontSize: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontWeight: 600 }}>
            <span style={{ width: 16, height: 4, background: '#dc2626', borderRadius: 4 }}></span>
            Costo Affitto
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontWeight: 600 }}>
            <span style={{ width: 16, height: 4, background: color, borderRadius: 4 }}></span>
            Costo Acquisto
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 16, padding: '20px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
        <strong>ℹ️ Logica della simulazione</strong>
        <div style={{ display: disclaimerOpen ? 'block' : '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 8 }}>
          Il grafico mostra i "Soldi a fondo perduto" (Sunk Costs). Per il mutuo includono: interessi passivi, tasse, spese notarili e manutenzione. Non calcoliamo il rimborso del capitale, perché diventa un tuo asset (la casa). Per l'affitto includiamo i canoni rivalutati all'inflazione, a cui però SOTTRAIAMO gli interessi maturati dall'anticipo se fosse stato investito (costo opportunità). L'incrocio delle linee rappresenta il "Punto di Pareggio" (Break-even). Non sono calcolate rivalutazioni del valore dell'immobile né agevolazioni o detrazioni specifiche.
        </div>
        <button onClick={() => setDisclaimerOpen(!disclaimerOpen)} style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 800, fontSize: 13, padding: 0, marginTop: 8, cursor: 'pointer', textDecoration: 'underline' }}>
          {disclaimerOpen ? 'Comprimi il testo ↑' : 'Leggi tutta la nota ↓'}
        </button>
      </div>

    </div>
  );
}