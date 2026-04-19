import React, { useState, useMemo } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

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

  const inputStyle = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 12, fontFamily: 'inherit', fontWeight: 600, color: '#0f172a', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 };
  const formatEuro = (v) => `${v < 0 ? 'Guadagno: ' : ''}€ ${Math.abs(v).toLocaleString('it-IT', {minimumFractionDigits: 2})}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#0f172a', marginBottom: 16, lineHeight: 1.2 }}>
          Bilancio Bancario Reale
        </h2>
        <p style={{ fontSize: 17, color: '#64748b', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
          Il canone zero è spesso un'illusione. Inserisci la tua giacenza e le tue abitudini per calcolare se il tuo conto ti sta facendo perdere soldi.
        </p>
      </div>

      {/* IL TOOL CALCOLATORE */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 24, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <label style={labelStyle}>Giacenza Media (€)</label>
            <input type="number" value={giacenzaStr} onChange={(e) => setGiacenzaStr(e.target.value)} style={{...inputStyle, border: giacenza > 5000 ? '2px solid #f59e0b' : '1px solid #cbd5e1'}} />
            {giacenza > 5000 && <span style={{fontSize: 11, color: '#b45309', fontWeight: 700, marginTop: 6, display: 'block'}}>⚠️ Oltre 5.000€ paghi il Bollo Statale</span>}
          </div>
          <div><label style={labelStyle}>Bonifici Istantanei / Mese</label><input type="number" value={numBonifici} onChange={(e) => setNumBonifici(parseInt(e.target.value)||0)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Prelievi ATM Terzi / Mese</label><input type="number" value={numPrelievi} onChange={(e) => setNumPrelievi(parseInt(e.target.value)||0)} style={inputStyle} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`, gap: 24 }}>
          {risultati.map((off) => {
            const isWinner = off.costoAnnuale === minCosto;
            return (
              <div key={off.id} style={{ background: isWinner ? '#f0fdf4' : '#fff', border: `2px solid ${isWinner ? '#10b981' : '#e2e8f0'}`, borderRadius: 24, padding: 28, position: 'relative', boxShadow: isWinner ? '0 10px 30px -10px rgba(16,185,129,0.3)' : 'none' }}>
                {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>🥇 SCELTA OTTIMALE</div>}
                
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ ...inputStyle, fontWeight: 900, fontSize: 19, border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '2px solid #e2e8f0', borderRadius: 0, marginBottom: 24, color: '#0f172a' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Canone (€)</label><input type="number" step="0.1" value={off.canone} onChange={(e) => updateOfferta(off.id, 'canone', e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Tasso Lordo (%)</label><input type="number" step="0.1" value={off.tasso} onChange={(e) => updateOfferta(off.id, 'tasso', e.target.value)} style={inputStyle} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Costo Bonifico</label><input type="number" step="0.1" value={off.costoBonifico} onChange={(e) => updateOfferta(off.id, 'costoBonifico', e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Costo Prelievo</label><input type="number" step="0.1" value={off.costoPrelievo} onChange={(e) => updateOfferta(off.id, 'costoPrelievo', e.target.value)} style={inputStyle} /></div>
                  </div>
                </div>

                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Bilancio Annuo Reale</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: off.costoAnnuale < 0 ? '#10b981' : (isWinner ? '#10b981' : '#0f172a'), margin: '6px 0', lineHeight: 1 }}>{formatEuro(off.costoAnnuale)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Include Bollo, Commissioni e Tassazione</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEZIONE AFFILIATI NETTAMENTE SEPARATA */}
      <div style={{ marginTop: 80, borderTop: '1px solid #e2e8f0', paddingTop: 64, marginBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Le Analisi del Team</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#0f172a', marginTop: 8, marginBottom: 16 }}>Le Scelte Trasparenti</h2>
          <p style={{ fontSize: 16, color: '#475569', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
            Applicando le logiche del nostro calcolatore, abbiamo selezionato due tra le migliori soluzioni bancarie sul mercato per abbattere realmente i costi operativi quotidiani e massimizzare il rendimento. <em>(Partnership commerciali)</em>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
          
          {/* BOX BBVA */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '36px 32px', position: 'relative', boxShadow: '0 20px 40px -12px rgba(0,68,129,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#004481', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 18px', borderRadius: 30, whiteSpace: 'nowrap' }}>🏆 Miglior Rendimento</div>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>BBVA — Conto Online 3%</h3>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>Remunerazione fissa sul saldo senza vincoli, Cashback sugli acquisti e canone zero. Il 3% di interessi copre ampiamente il bollo statale.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, background: '#f8fafc', padding: '16px', borderRadius: 16, marginBottom: 24, border: '1px solid #f1f5f9' }}>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>INTERESSI</span><div style={{ fontSize: 18, fontWeight: 900, color: '#004481' }}>3% Annuo</div></div>
              <div style={{ width: 1, height: 30, background: '#e2e8f0' }}></div>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>OPERAZIONI</span><div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>GRATIS</div></div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <a href="https://www.financeads.net/tc.php?t=82784C5581131019T" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'block', background: '#004481', color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 15, marginBottom: 12, transition: '0.2s' }}>Vai al sito ufficiale BBVA →</a>
              <a href="/recensione-bbva" style={{ fontSize: 13, color: '#004481', fontWeight: 700, textDecoration: 'underline' }}>Leggi la nostra recensione completa →</a>
            </div>
          </div>

          {/* BOX HYPE */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '36px 32px', position: 'relative', boxShadow: '0 20px 40px -12px rgba(0,174,255,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#00AEFF', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 18px', borderRadius: 30, whiteSpace: 'nowrap' }}>⭐ La Carta Conto Smart</div>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>Hype — I 3 Piani</h3>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>L'alternativa per chi vuole gestire tutto da app. Azzera le commissioni sui prelievi ovunque nel mondo e include assicurazioni acquisti.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, background: '#f8fafc', padding: '16px', borderRadius: 16, marginBottom: 24, border: '1px solid #f1f5f9' }}>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>BONUS REALE</span><div style={{ fontSize: 18, fontWeight: 900, color: '#00AEFF' }}>Fino a 25€</div></div>
              <div style={{ width: 1, height: 30, background: '#e2e8f0' }}></div>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>PRELIEVI</span><div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>Gratis*</div></div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <a href="https://www.financeads.net/tc.php?t=82784C257247700T" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'block', background: '#00AEFF', color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 15, marginBottom: 12, transition: '0.2s' }}>Scopri l'offerta Hype →</a>
              <a href="/recensione-hype" style={{ fontSize: 13, color: '#00AEFF', fontWeight: 700, textDecoration: 'underline' }}>Confronta i 3 piani nel dettaglio →</a>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}