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
  const [canone, setCanone] = useState(800);
  const [prezzoCasa, setPrezzoCasa] = useState(250000);
  const [anticipo, setAnticipo] = useState(50000);
  const [tasso, setTasso] = useState(3.2);
  const [durataMutuo, setDurataMutuo] = useState(25);
  const [rendimentoAlt, setRendimentoAlt] = useState(4);
  const [tipoCasa, setTipoCasa] = useState('prima');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [hoverAnno, setHoverAnno] = useState(null);

  const risultati = useMemo(() => {
    const capitale = prezzoCasa - anticipo;
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
    let costoMutuoCumul = speseAcquisto;
    let canoneAnno = canone;
    let debitoResiduo = capitale;
    let anticipoInvestito = anticipo;
    
    for (let anno = 1; anno <= orizzonte; anno++) {
      costoAffittoCumul += canoneAnno * 12;
      anticipoInvestito *= (1 + rendimentoAlt / 100);
      canoneAnno *= (1 + INFLAZIONE_CANONE);
      
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
  }, [canone, prezzoCasa, anticipo, tasso, durataMutuo, rendimentoAlt, tipoCasa]);

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
    
    const pathAffitto = dati.map((d, idx) => 
      `${idx === 0 ? 'M' : 'L'} ${xScale(d.anno)} ${yScale(d.Affitto)}`
    ).join(' ');
    
    const pathAcquisto = dati.map((d, idx) => 
      `${idx === 0 ? 'M' : 'L'} ${xScale(d.anno)} ${yScale(d.Acquisto)}`
    ).join(' ');
    
    // Tick asse Y: 4 valori ben distribuiti
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => minY + t * rangeY);
    
    // Tick asse X: ogni 5 anni
    const xTicks = [1, 5, 10, 15, 20, 25, 30];
    
    return { W, H, PAD_L, PAD_R, PAD_T, PAD_B, xScale, yScale, pathAffitto, pathAcquisto, yTicks, xTicks };
  }, [risultati.dati]);

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

  const formatEuro = (v) => `€${v.toLocaleString('it-IT')}`;
  const formatEuroCompact = (v) => {
    if (Math.abs(v) >= 1000) return `${Math.round(v/1000)}k`;
    return v.toString();
  };

  const verdetto = risultati.breakEven 
    ? `L'acquisto diventa più conveniente dopo ${risultati.breakEven} anni`
    : 'Nel tuo orizzonte di 30 anni, affittare resta più conveniente';

  const hoverData = hoverAnno ? risultati.dati.find(d => d.anno === hoverAnno) : null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      
      {/* INPUT PANEL */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>I tuoi dati</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          
          <div>
            <label style={labelStyle}>Canone mensile attuale</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={canone} onChange={(e) => setCanone(Number(e.target.value) || 0)} style={{...inputStyle, paddingLeft: 28}} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Prezzo casa target</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={prezzoCasa} onChange={(e) => setPrezzoCasa(Number(e.target.value) || 0)} style={{...inputStyle, paddingLeft: 28}} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Anticipo disponibile</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={anticipo} onChange={(e) => setAnticipo(Number(e.target.value) || 0)} style={{...inputStyle, paddingLeft: 28}} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tasso mutuo (TAN)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" step="0.1" value={tasso} onChange={(e) => setTasso(Number(e.target.value) || 0)} style={{...inputStyle, paddingRight: 28}} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>%</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Durata mutuo</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={durataMutuo} onChange={(e) => setDurataMutuo(Number(e.target.value) || 1)} style={{...inputStyle, paddingRight: 45}} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }}>anni</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Rendimento investimento alternativo</label>
            <div style={{ position: 'relative' }}>
              <input type="number" step="0.1" value={rendimentoAlt} onChange={(e) => setRendimentoAlt(Number(e.target.value) || 0)} style={{...inputStyle, paddingRight: 28}} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>%</span>
            </div>
          </div>

        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Tipo di casa</label>
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 4, borderRadius: 12, gap: 2 }}>
            <button 
              onClick={() => setTipoCasa('prima')} 
              style={{
                padding: '8px 18px', borderRadius: 9, border: 'none', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: tipoCasa === 'prima' ? '#fff' : 'transparent',
                color: tipoCasa === 'prima' ? color : '#64748b',
                boxShadow: tipoCasa === 'prima' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >Prima casa</button>
            <button 
              onClick={() => setTipoCasa('seconda')} 
              style={{
                padding: '8px 18px', borderRadius: 9, border: 'none', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: tipoCasa === 'seconda' ? '#fff' : 'transparent',
                color: tipoCasa === 'seconda' ? color : '#64748b',
                boxShadow: tipoCasa === 'seconda' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >Seconda casa</button>
          </div>
        </div>
      </div>

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
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif" }}>
          {verdetto}
        </div>
      </div>

      {/* METRICHE CHIAVE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Rata mensile</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.rataMensile)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Spese acquisto</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.speseAcquisto)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>IMU annua</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.imuAnnua)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Manut. annua</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.manutenzioneAnnua)}</div>
        </div>
      </div>

      {/* GRAFICO SVG */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Costo netto cumulato</h3>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Linea rossa: affitto (canoni pagati − rendimento dell'anticipo investito). Linea verde: acquisto (rata + spese − equity accumulata).</p>
        
        <div style={{ position: 'relative', width: '100%' }}>
          <svg 
            viewBox={`0 0 ${chart.W} ${chart.H}`} 
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onMouseLeave={() => setHoverAnno(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * chart.W;
              if (x < chart.PAD_L || x > chart.W - chart.PAD_R) {
                setHoverAnno(null);
                return;
              }
              const annoApprox = Math.round(1 + ((x - chart.PAD_L) / (chart.W - chart.PAD_L - chart.PAD_R)) * 29);
              setHoverAnno(Math.max(1, Math.min(30, annoApprox)));
            }}
          >
            {/* Griglia orizzontale */}
            {chart.yTicks.map((v, idx) => (
              <g key={`ygrid-${idx}`}>
                <line 
                  x1={chart.PAD_L} y1={chart.yScale(v)} 
                  x2={chart.W - chart.PAD_R} y2={chart.yScale(v)} 
                  stroke="#f1f5f9" strokeWidth="1" 
                />
                <text 
                  x={chart.PAD_L - 8} y={chart.yScale(v) + 4} 
                  fontSize="11" fill="#94a3b8" textAnchor="end"
                >
                  {formatEuroCompact(v)}
                </text>
              </g>
            ))}
            
            {/* Tick asse X */}
            {chart.xTicks.map((t, idx) => (
              <text 
                key={`xtick-${idx}`}
                x={chart.xScale(t)} y={chart.H - chart.PAD_B + 18} 
                fontSize="11" fill="#94a3b8" textAnchor="middle"
              >
                {t}
              </text>
            ))}
            <text 
              x={chart.W / 2} y={chart.H - 6} 
              fontSize="11" fill="#94a3b8" textAnchor="middle" fontWeight="600"
            >
              Anni
            </text>
            
            {/* Linea break-even */}
            {risultati.breakEven && (
              <g>
                <line 
                  x1={chart.xScale(risultati.breakEven)} y1={chart.PAD_T}
                  x2={chart.xScale(risultati.breakEven)} y2={chart.H - chart.PAD_B}
                  stroke={color} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6"
                />
                <text 
                  x={chart.xScale(risultati.breakEven)} y={chart.PAD_T - 4}
                  fontSize="11" fontWeight="700" fill={color} textAnchor="middle"
                >
                  Break-even: anno {risultati.breakEven}
                </text>
              </g>
            )}
            
            {/* Linea Affitto */}
            <path d={chart.pathAffitto} stroke="#dc2626" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            
            {/* Linea Acquisto */}
            <path d={chart.pathAcquisto} stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            
            {/* Hover indicator */}
            {hoverData && (
              <g>
                <line 
                  x1={chart.xScale(hoverAnno)} y1={chart.PAD_T}
                  x2={chart.xScale(hoverAnno)} y2={chart.H - chart.PAD_B}
                  stroke="#cbd5e1" strokeWidth="1"
                />
                <circle cx={chart.xScale(hoverAnno)} cy={chart.yScale(hoverData.Affitto)} r="4" fill="#dc2626" />
                <circle cx={chart.xScale(hoverAnno)} cy={chart.yScale(hoverData.Acquisto)} r="4" fill={color} />
              </g>
            )}
          </svg>
          
          {/* Tooltip esterno al SVG per leggibilità */}
          {hoverData && (
            <div style={{ 
              position: 'absolute', 
              top: 0, right: 0, 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: 10, 
              padding: '10px 14px', 
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              pointerEvents: 'none',
              minWidth: 160
            }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Anno {hoverAnno}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 2 }}>
                <span style={{ color: '#dc2626' }}>● Affitto</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatEuro(hoverData.Affitto)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color }}>● Acquisto</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatEuro(hoverData.Acquisto)}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Legenda sotto grafico */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 14, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
            <span style={{ width: 14, height: 2.5, background: '#dc2626', borderRadius: 2 }}></span>
            Affitto
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
            <span style={{ width: 14, height: 2.5, background: color, borderRadius: 2 }}></span>
            Acquisto
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 16, padding: '16px 20px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
        <strong>ℹ️ Cosa include e cosa no questa simulazione</strong>
        <div style={{ display: disclaimerOpen ? 'block' : '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 6 }}>
          Il calcolo <strong>include</strong>: rata mutuo, interessi, IMU (solo seconda casa), manutenzione stimata all'1%/anno, spese notarili e agenzia all'acquisto, indicizzazione ISTAT dei canoni (+1,5%/anno), costo opportunità dell'anticipo investito al rendimento alternativo scelto. <strong>Non include</strong>: rivalutazione immobiliare (variabile tra -2% e +4%/anno a seconda del mercato), vantaggi fiscali (detrazione interessi prima casa del 19% fino a 4.000€/anno), assicurazioni obbligatorie sul mutuo, spese condominiali (simmetriche: le paghi in entrambi gli scenari). Questo tool è uno strumento di orientamento, non di consulenza personalizzata.
        </div>
        <button onClick={() => setDisclaimerOpen(!disclaimerOpen)} style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 800, fontSize: 12, padding: 0, marginTop: 6, cursor: 'pointer', textDecoration: 'underline' }}>
          {disclaimerOpen ? 'Riduci ↑' : 'Leggi tutto ↓'}
        </button>
      </div>

    </div>
  );
}