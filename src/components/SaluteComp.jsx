import React, { useState, useMemo } from 'react';

export function SaluteComp() {
  const [premioStr, setPremioStr] = useState('450');
  const [spesaMedicaStr, setSpesaMedicaStr] = useState('600');
  const [numVisite, setNumVisite] = useState(3);
  const [isMajorIncident, setIsMajorIncident] = useState(false);

  const risultati = useMemo(() => {
    const p = parseFloat(premioStr) || 0;
    const sm = parseFloat(spesaMedicaStr) || 0;
    const quotaUtente = (50 * numVisite) + (isMajorIncident ? 1200 : 0);
    const totaleCon = p + quotaUtente;
    const totaleSenza = sm + (isMajorIncident ? 12000 : 0);
    return { con: totaleCon, senza: totaleSenza, diff: totaleSenza - totaleCon };
  }, [premioStr, spesaMedicaStr, numVisite, isMajorIncident]);

  const inputStyle = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 12, fontWeight: 600, color: '#0f172a', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 };

  const formatEuro = (v) => `€ ${v.toLocaleString('it-IT')}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#0f172a', marginBottom: 16 }}>Valore Reale Polizza</h2>
        <p style={{ fontSize: 17, color: '#64748b', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>L'assicurazione non serve per le piccole spese. Calcola se ti conviene pagare il premio annuo o rischiare il pagamento privato.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 56, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
          <div><label style={labelStyle}>Premio Annuo Polizza</label><input type="number" value={premioStr} onChange={(e) => setPremioStr(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Spesa Medica Prevista</label><input type="number" value={spesaMedicaStr} onChange={(e) => setSpesaMedicaStr(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>N. Visite/Anno</label><input type="number" value={numVisite} onChange={(e) => setNumVisite(parseInt(e.target.value)||1)} style={inputStyle} /></div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button onClick={() => setIsMajorIncident(!isMajorIncident)} style={{ background: isMajorIncident ? '#ef4444' : '#f1f5f9', color: isMajorIncident ? '#fff' : '#0f172a', border: 'none', padding: '14px 28px', borderRadius: 16, fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}>
            {isMajorIncident ? '⚠️ Togli Grande Imprevisto' : '🚑 Simula Ricovero Grave (12.000€)'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, textAlign: 'center' }}>
          <div style={{ background: '#f8fafc', padding: 24, borderRadius: 24, border: '2px solid #e2e8f0' }}>
            <span style={labelStyle}>Paghi Tu</span>
            <div style={{ fontSize: 32, fontWeight: 900 }}>{formatEuro(risultati.senza)}</div>
          </div>
          <div style={{ background: risultati.diff > 0 ? '#f0fdf4' : '#fef2f2', padding: 24, borderRadius: 24, border: `2px solid ${risultati.diff > 0 ? '#10b981' : '#ef4444'}` }}>
            <span style={labelStyle}>Con Polizza</span>
            <div style={{ fontSize: 32, fontWeight: 900 }}>{formatEuro(risultati.con)}</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '2px solid #dc2626', borderRadius: 24, padding: '40px', position: 'relative', textAlign: 'center', boxShadow: '0 20px 40px -12px rgba(220,38,38,0.1)' }}>
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 18px', borderRadius: 30 }}>🛡️ Protezione Consigliata</div>
        <h3 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>UniSalute — Grandi Interventi</h3>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 24, maxWidth: 550, margin: '0 auto 24px', lineHeight: 1.6 }}>Proteggi i tuoi risparmi dai veri imprevisti. Rete convenzionata d'eccellenza e massimali fino a 100.000€ per ricovero.</p>
        <a href="https://www.unisalute.it" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#dc2626', color: '#fff', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 16 }}>Scopri l'Assicurazione →</a>
      </div>
    </div>
  );
}