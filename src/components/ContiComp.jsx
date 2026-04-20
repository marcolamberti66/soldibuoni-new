import React, { useState, useMemo } from 'react';

export function ContiComp() {
  const [giacenzaStr, setGiacenzaStr] = useState('6000');
  const [numBonifici, setNumBonifici] = useState(2);
  const [numPrelievi, setNumPrelievi] = useState(2);

  const [offerte, setOfferte] = useState([
    { id: 1, nome: 'Il mio conto attuale', canone: '5', tasso: '0', costoBonifico: '2.0', costoPrelievo: '2' },
    { id: 2, nome: 'Alternativa Online', canone: '0', tasso: '0', costoBonifico: '0', costoPrelievo: '0' }
  ]);

  const giacenza = parseFloat(giacenzaStr) || 0;

  const calcolaCostoAnnuo = (off) => {
    const canoneAnnuale = (parseFloat(off.canone) || 0) * 12;
    const interessiLordi = giacenza * ((parseFloat(off.tasso) || 0) / 100);
    const interessiNetti = interessiLordi * 0.74; 
    const impostaBollo = giacenza > 5000 ? 34.20 : 0;
    const costiOperativi = ( (parseFloat(off.costoBonifico) || 0) * numBonifici + (parseFloat(off.costoPrelievo) || 0) * numPrelievi ) * 12;
    return canoneAnnuale + costiOperativi + impostaBollo - interessiNetti;
  };

  const risultati = useMemo(() => {
    return offerte.map(off => ({ ...off, costoAnnuale: calcolaCostoAnnuo(off) }));
  }, [offerte, giacenza, numBonifici, numPrelievi]);

  const minCosto = Math.min(...risultati.map(r => r.costoAnnuale));

  const updateOfferta = (id, field, value) => {
    setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const inputStyle = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 12, fontFamily: 'inherit', fontWeight: 600, color: '#0f172a', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 };
  const formatEuro = (v) => `${v < 0 ? 'Guadagno: ' : ''}€ ${Math.abs(v).toLocaleString('it-IT', {minimumFractionDigits: 2})}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* IL TOOL CALCOLATORE */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 48, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <label style={labelStyle}>Giacenza Media (€)</label>
            <input type="number" value={giacenzaStr} onChange={(e) => setGiacenzaStr(e.target.value)} style={{...inputStyle, border: giacenza > 5000 ? '2px solid #f59e0b' : '1px solid #cbd5e1'}} />
            {giacenza > 5000 && <span style={{fontSize: 11, color: '#b45309', fontWeight: 700, marginTop: 6, display: 'block'}}>⚠️ Oltre 5.000€ scatta il Bollo Statale (34,20€/anno)</span>}
          </div>
          <div><label style={labelStyle}>Bonifici Istantanei / Mese</label><input type="number" value={numBonifici} onChange={(e) => setNumBonifici(parseInt(e.target.value)||0)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Prelievi ATM Terzi / Mese</label><input type="number" value={numPrelievi} onChange={(e) => setNumPrelievi(parseInt(e.target.value)||0)} style={inputStyle} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {risultati.map((off) => {
            const isWinner = off.costoAnnuale === minCosto;
            return (
              <div key={off.id} style={{ background: isWinner ? '#f0fdf4' : '#fff', border: `2px solid ${isWinner ? '#10b981' : '#e2e8f0'}`, borderRadius: 24, padding: 28, position: 'relative', boxShadow: isWinner ? '0 10px 30px -10px rgba(16,185,129,0.3)' : 'none' }}>
                {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>🥇 SCELTA OTTIMALE</div>}
                
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ ...inputStyle, fontWeight: 900, fontSize: 19, border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '2px solid #e2e8f0', borderRadius: 0, marginBottom: 24, color: '#0f172a' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Canone (€/Mese)</label><input type="number" step="0.1" value={off.canone} onChange={(e) => updateOfferta(off.id, 'canone', e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Tasso Lordo (%)</label><input type="number" step="0.1" value={off.tasso} onChange={(e) => updateOfferta(off.id, 'tasso', e.target.value)} style={inputStyle} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Costo Bonifico (€)</label><input type="number" step="0.1" value={off.costoBonifico} onChange={(e) => updateOfferta(off.id, 'costoBonifico', e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Costo Prelievo (€)</label><input type="number" step="0.1" value={off.costoPrelievo} onChange={(e) => updateOfferta(off.id, 'costoPrelievo', e.target.value)} style={inputStyle} /></div>
                  </div>
                </div>

                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Bilancio Annuo Stimato</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: off.costoAnnuale < 0 ? '#10b981' : (isWinner ? '#10b981' : '#0f172a'), margin: '6px 0', lineHeight: 1 }}>{formatEuro(off.costoAnnuale)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Include Bollo, Commissioni e Tassazione</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DISCLAIMER CALCOLATORE */}
        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 24, lineHeight: 1.5, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
          <em>Nota: Il calcolo è una stima indicativa basata sui parametri inseriti. La tassazione degli interessi è calcolata al 26% (aliquota standard su rendimenti finanziari). L'imposta di bollo è applicata secondo la normativa vigente. Le condizioni effettive possono variare in base al contratto sottoscritto. Questo strumento non costituisce consulenza finanziaria.</em>
        </p>
      </div>

      {/* SEZIONE SELEZIONE DEL TEAM — STILE UNIFICATO */}
      <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 24, padding: '36px 28px', position: 'relative', boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.15)' }}>
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '6px 18px', borderRadius: 30, whiteSpace: 'nowrap' }}>★ La Selezione del Team</div>
        
        <p style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 32, marginTop: 8, lineHeight: 1.6, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Applicando le logiche del nostro calcolatore, abbiamo selezionato due soluzioni bancarie per ridurre i costi operativi e massimizzare il rendimento.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          
          {/* BOX BBVA */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '28px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#004481', color: '#fff', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '4px 12px', borderRadius: 20, display: 'inline-block', alignSelf: 'center', marginBottom: 16, letterSpacing: '0.5px' }}>🏆 Miglior Rendimento</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 10, fontFamily: "'DM Serif Display', serif" }}>BBVA — Conto Online</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>Remunerazione sul saldo senza vincoli, cashback sugli acquisti e canone zero.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, background: '#fff', padding: '14px', borderRadius: 14, marginBottom: 20, border: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>INTERESSI</span><div style={{ fontSize: 16, fontWeight: 900, color: '#004481' }}>3% Annuo</div></div>
              <div style={{ width: 1, height: 28, background: '#e2e8f0' }}></div>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>OPERAZIONI</span><div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>GRATIS</div></div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <a href="https://www.financeads.net/tc.php?t=82784C5581131019T" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'block', background: '#004481', color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 15, marginBottom: 10, textDecoration: 'none' }}>Vai al sito BBVA →</a>
              <a href="/recensione-bbva" style={{ fontSize: 13, color: '#004481', fontWeight: 700, textDecoration: 'underline' }}>Leggi la recensione →</a>
            </div>
          </div>

          {/* BOX HYPE */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '28px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#00AEFF', color: '#fff', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '4px 12px', borderRadius: 20, display: 'inline-block', alignSelf: 'center', marginBottom: 16, letterSpacing: '0.5px' }}>⭐ Carta Conto Smart</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 10, fontFamily: "'DM Serif Display', serif" }}>Hype — I 3 Piani</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>Gestisci tutto da app, azzera le commissioni sui prelievi e scegli il piano adatto a te.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, background: '#fff', padding: '14px', borderRadius: 14, marginBottom: 20, border: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>BONUS</span><div style={{ fontSize: 16, fontWeight: 900, color: '#00AEFF' }}>Fino a 25€</div></div>
              <div style={{ width: 1, height: 28, background: '#e2e8f0' }}></div>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>PRELIEVI</span><div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>Gratis*</div></div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <a href="https://www.financeads.net/tc.php?t=82784C257247700T" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'block', background: '#00AEFF', color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 15, marginBottom: 10, textDecoration: 'none' }}>Scopri Hype →</a>
              <a href="/recensione-hype" style={{ fontSize: 13, color: '#00AEFF', fontWeight: 700, textDecoration: 'underline' }}>Confronta i 3 piani →</a>
            </div>
          </div>

        </div>

        {/* DISCLAIMER AFFILIATI */}
        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 24, lineHeight: 1.5, marginBottom: 0 }}>
          <em>Trasparenza: Questa sezione contiene link affiliati (partnership commerciali). Se apri un conto tramite i nostri collegamenti, riceviamo una commissione dall'istituto senza alcun costo aggiuntivo per te. Le condizioni indicate (tassi, costi, bonus) si riferiscono a quanto pubblicato dagli istituti al momento della stesura e potrebbero subire variazioni. Verifica sempre le condizioni aggiornate sul sito ufficiale prima di sottoscrivere. *Prelievi gratuiti soggetti a condizioni del piano scelto.</em>
        </p>
      </div>

    </div>
  );
}