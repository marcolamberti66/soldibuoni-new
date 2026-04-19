import React, { useState, useMemo } from 'react';

export function SaluteComp() {
  const [premioStr, setPremioStr] = useState('450');
  const [spesaMedicaStr, setSpesaMedicaStr] = useState('600');
  const [numVisite, setNumVisite] = useState(3);
  const [isMajorIncident, setIsMajorIncident] = useState(false);

  const risultati = useMemo(() => {
    const p = parseFloat(premioStr) || 0;
    const sm = parseFloat(spesaMedicaStr) || 0;
    const quotaUtente = (50 * numVisite) + (isMajorIncident ? 1200 : 0); // franchigie medie
    const totaleCon = p + quotaUtente;
    const totaleSenza = sm + (isMajorIncident ? 12000 : 0);
    return { con: totaleCon, senza: totaleSenza, diff: totaleSenza - totaleCon };
  }, [premioStr, spesaMedicaStr, numVisite, isMajorIncident]);

  const inputStyle = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 12, fontWeight: 600, color: '#0f172a', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 };
  const formatEuro = (v) => `€ ${v.toLocaleString('it-IT')}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#0f172a', marginBottom: 16 }}>Valore Reale Polizza</h2>
        <p style={{ fontSize: 17, color: '#64748b', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>L'assicurazione non serve per le visite di routine. Calcola se ti conviene pagare il premio annuo o rischiare il pagamento privato per difenderti dai grandi imprevisti.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 24, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <div><label style={labelStyle}>Premio Annuo Polizza</label><input type="number" value={premioStr} onChange={(e) => setPremioStr(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Spesa Medica Privata Stimata</label><input type="number" value={spesaMedicaStr} onChange={(e) => setSpesaMedicaStr(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>N. Visite all'Anno</label><input type="number" value={numVisite} onChange={(e) => setNumVisite(parseInt(e.target.value)||1)} style={inputStyle} /></div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button onClick={() => setIsMajorIncident(!isMajorIncident)} style={{ background: isMajorIncident ? '#ef4444' : '#f1f5f9', color: isMajorIncident ? '#fff' : '#0f172a', border: 'none', padding: '14px 28px', borderRadius: 16, fontWeight: 800, cursor: 'pointer', transition: '0.3s', fontSize: 15 }}>
            {isMajorIncident ? '⚠️ Togli Grande Imprevisto' : '🚑 Simula Ricovero Grave (12.000€)'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, textAlign: 'center' }}>
          <div style={{ background: '#f8fafc', padding: 24, borderRadius: 24, border: '2px solid #e2e8f0' }}>
            <span style={labelStyle}>Paghi Tu dal Privato</span>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', margin: '8px 0' }}>{formatEuro(risultati.senza)}</div>
          </div>
          <div style={{ background: risultati.diff > 0 ? '#f0fdf4' : '#fef2f2', padding: 24, borderRadius: 24, border: `2px solid ${risultati.diff > 0 ? '#10b981' : '#ef4444'}` }}>
            <span style={labelStyle}>Con Polizza Integrativa</span>
            <div style={{ fontSize: 36, fontWeight: 900, color: risultati.diff > 0 ? '#10b981' : '#ef4444', margin: '8px 0' }}>{formatEuro(risultati.con)}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 80, borderTop: '1px solid #e2e8f0', paddingTop: 64, marginBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Le Analisi del Team</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#0f172a', marginTop: 8, marginBottom: 16 }}>Le Scelte Trasparenti</h2>
          <p style={{ fontSize: 16, color: '#475569', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>Abbiamo selezionato soluzioni che si attivano sui grandi imprevisti (dove servono davvero) con massimali eccellenti. <em>(Partnership)</em></p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '40px', position: 'relative', textAlign: 'center', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.05)', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 18px', borderRadius: 30 }}>🛡️ Protezione Consigliata</div>
          <h3 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>UniSalute — Grandi Interventi</h3>
          <p style={{ color: '#64748b', fontSize: 16, marginBottom: 24, lineHeight: 1.6 }}>Proteggi i tuoi risparmi. Rete convenzionata d'eccellenza in Italia e massimali fino a 100.000€ per ricovero.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, background: '#f8fafc', padding: '20px', borderRadius: 16, marginBottom: 24, border: '1px solid #f1f5f9' }}>
            <div style={{ textAlign: 'left' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>MASSIMALE</span><div style={{ fontSize: 20, fontWeight: 900 }}>€ 100.000</div></div>
            <div style={{ width: 1, background: '#e2e8f0' }}></div>
            <div style={{ textAlign: 'left' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>RETE MEDICA</span><div style={{ fontSize: 20, fontWeight: 900, color: '#dc2626' }}>Top in Italia</div></div>
          </div>
          <a href="https://www.unisalute.it" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#dc2626', color: '#fff', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 16 }}>Scopri l'Assicurazione →</a>
        </div>
      </div>
    </div>
  );
}