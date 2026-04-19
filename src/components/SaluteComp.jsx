import React, { useState, useMemo } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function SaluteComp() {
  const [premioStr, setPremioStr] = useState('450');
  const [spesaMedicaStr, setSpesaMedicaStr] = useState('600');
  const [numVisite, setNumVisite] = useState(3);
  const [franchigiaStr, setFranchigiaStr] = useState('50');
  const [scopertoStr, setScopertoStr] = useState('20');
  const [isMajorIncident, setIsMajorIncident] = useState(false);

  const premio = parseFloat(premioStr) || 0;
  const spesaMedicaBase = parseFloat(spesaMedicaStr) || 0;
  const franchigia = parseFloat(franchigiaStr) || 0;
  const scoperto = (parseFloat(scopertoStr) || 0) / 100;
  
  const spesaTotaleIncident = isMajorIncident ? 12000 : 0;
  const spesaTotaleUtente = spesaMedicaBase + spesaTotaleIncident;

  const risultati = useMemo(() => {
    const costoSingolaVisita = spesaMedicaBase / Math.max(1, numVisite);
    const scopertoPerVisita = Math.max(franchigia, costoSingolaVisita * scoperto);
    const quotaUtenteOrdinaria = scopertoPerVisita * numVisite;

    const quotaUtenteIncident = isMajorIncident ? Math.max(500, spesaTotaleIncident * 0.1) : 0;

    const totaleConPolizza = premio + quotaUtenteOrdinaria + quotaUtenteIncident;
    const totaleSenzaPolizza = spesaTotaleUtente;

    return {
      conPolizza: totaleConPolizza,
      senzaPolizza: totaleSenzaPolizza,
      differenza: totaleSenzaPolizza - totaleConPolizza
    };
  }, [premio, spesaMedicaBase, numVisite, franchigia, scoperto, isMajorIncident]);

  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 10, fontFamily: 'inherit', fontWeight: 600, color: '#0f172a', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 };

  const formatEuro = (v) => `€ ${v.toLocaleString('it-IT', {maximumFractionDigits: 0})}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#0f172a', marginBottom: 12 }}>Valore Reale della Polizza Sanitaria</h2>
        <p style={{ fontSize: 16, color: '#475569', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
          Le assicurazioni non sono "gratis". Calcola se ti conviene pagare il premio annuo o rischiare di pagare di tasca tua, considerando franchigie e imprevisti gravi.
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 48, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <div><label style={labelStyle}>Premio Annuo Polizza (€)</label><input type="number" value={premioStr} onChange={(e) => setPremioStr(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Spesa Medica Ordinaria (€)</label><input type="number" value={spesaMedicaStr} onChange={(e) => setSpesaMedicaStr(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>N. Visite/Esami all'Anno</label><input type="number" value={numVisite} onChange={(e) => setNumVisite(parseInt(e.target.value)||1)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Franchigia fissa a visita (€)</label><input type="number" value={franchigiaStr} onChange={(e) => setFranchigiaStr(e.target.value)} style={inputStyle} /></div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button onClick={() => setIsMajorIncident(!isMajorIncident)} style={{ background: isMajorIncident ? '#ef4444' : '#f1f5f9', color: isMajorIncident ? '#fff' : '#0f172a', border: 'none', padding: '14px 28px', borderRadius: 16, fontWeight: 800, cursor: 'pointer', transition: '0.3s', fontSize: 15 }}>
            {isMajorIncident ? '⚠️ Togli Grande Imprevisto' : '🚑 Simula un Ricovero o Intervento Grave (12.000€)'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          <div style={{ background: '#f8fafc', padding: 24, borderRadius: 20, textAlign: 'center', border: '2px solid #e2e8f0' }}>
            <span style={labelStyle}>Senza Polizza (Paghi tu)</span>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', margin: '8px 0' }}>{formatEuro(risultati.senzaPolizza)}</div>
            <p style={{ fontSize: 12, color: '#64748b' }}>Costo totale sostenuto interamente di tasca tua</p>
          </div>
          <div style={{ background: risultati.differenza > 0 ? '#f0fdf4' : '#fef2f2', padding: 24, borderRadius: 20, textAlign: 'center', border: `2px solid ${risultati.differenza > 0 ? '#10b981' : '#ef4444'}` }}>
            <span style={labelStyle}>Con Polizza</span>
            <div style={{ fontSize: 36, fontWeight: 900, color: risultati.differenza > 0 ? '#10b981' : '#ef4444', margin: '8px 0' }}>{formatEuro(risultati.conPolizza)}</div>
            <p style={{ fontSize: 12, color: '#64748b' }}>Premio annuo pagato + Franchigie a tuo carico</p>
          </div>
        </div>

        <div style={{ marginTop: 24, padding: 20, background: '#f8fafc', borderRadius: 16, textAlign: 'center', color: '#0f172a', fontWeight: 800, fontSize: 16, border: '1px solid #e2e8f0' }}>
          {risultati.differenza > 0 
            ? `💡 In questo scenario la polizza ti ha salvato risparmiandoti ${formatEuro(risultati.differenza)}!` 
            : `💡 In questo scenario la polizza ti è costata ${formatEuro(Math.abs(risultati.differenza))} IN PIÙ rispetto all'andare privatamente senza assicurazione.`}
        </div>
      </div>

      {/* BOX AFFILIATO UNISALUTE */}
      <div style={{ background: '#fff', border: '2px solid #dc2626', borderRadius: 24, padding: '40px', position: 'relative', textAlign: 'center', boxShadow: '0 20px 40px -12px rgba(220,38,38,0.1)' }}>
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 20px', borderRadius: 30, whiteSpace: 'nowrap', letterSpacing: '1px' }}>
          🛡️ Protezione Patrimoniale Consigliata
        </div>
        <h3 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>UniSalute — Grandi Interventi</h3>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 32, maxWidth: 550, margin: '0 auto 32px', lineHeight: 1.6 }}>Non scegliere la polizza per farti rimborsare i 50€ del dentista. Sceglila per proteggere i risparmi di una vita dai grandi ricoveri imprevisti.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>MASSIMALE RICOVERI</span>
            <div style={{ fontSize: 24, fontWeight: 900 }}>€ 100.000 <span style={{ fontSize: 14, color: '#64748b' }}>/evento</span></div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>RETE CONVENZIONATA</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626' }}>Top in Italia</div>
          </div>
        </div>

        <a href="https://www.unisalute.it/prodotti-assicurativi" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#dc2626', color: '#fff', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 16, textDecoration: 'none' }}>Scopri l'assicurazione →</a>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20 }}><em>Trasparenza Editoriale: Link informativo. SoldiBuoni è indipendente. Verificare sempre le franchigie specifiche sul set informativo prima dell'acquisto.</em></p>
      </div>
    </div>
  );
}