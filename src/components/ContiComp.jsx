import React, { useState, useMemo } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function ContiComp() {
  const [giacenzaStr, setGiacenzaStr] = useState('6000');
  const [numBonifici, setNumBonifici] = useState(2);
  const [numPrelievi, setNumPrelievi] = useState(2);

  const [offerte, setOfferte] = useState([
    { id: 1, nome: 'Conto Banca Tradizionale', canone: '5', tasso: '0', costoBonifico: '2.5', costoPrelievo: '2' },
    { id: 2, nome: 'Conto Online X', canone: '0', tasso: '0', costoBonifico: '0', costoPrelievo: '0' }
  ]);

  const giacenza = parseFloat(giacenzaStr) || 0;

  const calcolaCostoAnnuo = (off) => {
    const canoneAnnuale = (parseFloat(off.canone) || 0) * 12;
    const interessiLordi = giacenza * ((parseFloat(off.tasso) || 0) / 100);
    const interessiNetti = interessiLordi * 0.74; // Tassazione 26%
    const impostaBollo = giacenza > 5000 ? 34.20 : 0;
    
    const costiOperativi = ( (parseFloat(off.costoBonifico) || 0) * numBonifici + (parseFloat(off.costoPrelievo) || 0) * numPrelievi ) * 12;
    
    return canoneAnnuale + costiOperativi + impostaBollo - interessiNetti;
  };

  const risultati = useMemo(() => {
    return offerte.map(off => ({
      ...off,
      costoAnnuale: calcolaCostoAnnuo(off)
    }));
  }, [offerte, giacenza, numBonifici, numPrelievi]);

  const minCosto = Math.min(...risultati.map(r => r.costoAnnuale));

  const updateOfferta = (id, field, value) => {
    setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 10, fontFamily: 'inherit', fontWeight: 600, color: '#0f172a', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 };

  const formatEuro = (v) => `${v < 0 ? 'Guadagno: ' : ''}€ ${Math.abs(v).toLocaleString('it-IT', {minimumFractionDigits: 2})}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#0f172a', marginBottom: 12 }}>Il Tuo Bilancio Bancario Annuo</h2>
        <p style={{ fontSize: 16, color: '#475569', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
          Inserisci la tua giacenza e le tue abitudini di spesa. Scopri se il tuo conto "Gratis" ti sta costando più di un conto a pagamento con interessi.
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 48, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <label style={labelStyle}>Giacenza Media (€)</label>
            <input type="number" value={giacenzaStr} onChange={(e) => setGiacenzaStr(e.target.value)} style={{...inputStyle, border: giacenza > 5000 ? '2px solid #f59e0b' : '1px solid #cbd5e1'}} />
            {giacenza > 5000 && <span style={{fontSize: 10, color: '#b45309', fontWeight: 700, marginTop: 4, display: 'block'}}>⚠️ Oltre 5k paghi 34,20€ di Bollo statale</span>}
          </div>
          <div>
            <label style={labelStyle}>Bonifici Istantanei / Mese</label>
            <input type="number" value={numBonifici} onChange={(e) => setNumBonifici(parseInt(e.target.value)||0)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Prelievi Extra-Banca / Mese</label>
            <input type="number" value={numPrelievi} onChange={(e) => setNumPrelievi(parseInt(e.target.value)||0)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 24 }}>
          {risultati.map((off) => {
            const isWinner = off.costoAnnuale === minCosto;
            return (
              <div key={off.id} style={{ background: isWinner ? '#f0fdf4' : '#fff', border: `2px solid ${isWinner ? '#10b981' : '#e2e8f0'}`, borderRadius: 20, padding: 24, position: 'relative' }}>
                {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>🥇 SCELTA OTTIMALE</div>}
                
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ ...inputStyle, fontWeight: 900, fontSize: 18, border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '2px solid #e2e8f0', borderRadius: 0, marginBottom: 20 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Canone Mensile (€)</label><input type="number" step="0.1" value={off.canone} onChange={(e) => updateOfferta(off.id, 'canone', e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Tasso Lordo (%)</label><input type="number" step="0.1" value={off.tasso} onChange={(e) => updateOfferta(off.id, 'tasso', e.target.value)} style={inputStyle} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Costo Bonifico (€)</label><input type="number" step="0.1" value={off.costoBonifico} onChange={(e) => updateOfferta(off.id, 'costoBonifico', e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Costo Prelievo (€)</label><input type="number" step="0.1" value={off.costoPrelievo} onChange={(e) => updateOfferta(off.id, 'costoPrelievo', e.target.value)} style={inputStyle} /></div>
                  </div>
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Costo/Guadagno Annuo Reale</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: off.costoAnnuale < 0 ? '#10b981' : (isWinner ? '#10b981' : '#0f172a'), margin: '4px 0' }}>
                    {formatEuro(off.costoAnnuale)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Include Bollo, Commissioni e Tasse</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOX AFFILIATO BBVA */}
      <div style={{ background: '#004481', border: '2px solid #004481', borderRadius: 24, padding: '40px', position: 'relative', textAlign: 'center', color: '#fff', boxShadow: '0 20px 40px -12px rgba(0,68,129,0.3)' }}>
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#004481', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 20px', borderRadius: 30, whiteSpace: 'nowrap' }}>
          🏆 Il Conto più Redditizio 2026
        </div>
        <h3 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>BBVA — Conto Online 3%</h3>
        <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 32, maxWidth: 550, margin: '0 auto 32px', lineHeight: 1.6 }}>Azzera i costi di bollo e le commissioni sui bonifici istantanei. Con il 3% di remunerazione fissa sul saldo, il tuo conto diventa un investimento.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>CANONE / OPERAZIONI</span>
            <div style={{ fontSize: 24, fontWeight: 900 }}>€ 0,00 <span style={{ fontSize: 14, color: '#94a3b8' }}>/sempre</span></div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>RENDIMENTO SALDO</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399' }}>3% Annuo</div>
          </div>
        </div>

        <a href="https://www.financeads.net/tc.php?t=82784C5581131019T" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#fff', color: '#004481', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 16, textDecoration: 'none' }}>Apri Conto BBVA Gratis →</a>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 20 }}><em>Trasparenza Editoriale: Link affiliato. BBVA ci riconosce una commissione per ogni conto aperto, aiutandoci a mantenere questo strumento gratuito per te.</em></p>
      </div>
    </div>
  );
}