import React, { useState } from 'react';

export function AnalizzaBolletta({ color = '#059669' }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, sanitizing, analyzing, success, error
  const [result, setResult] = useState(null);
  const [gdprConsent, setGdprConsent] = useState(false);

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setStatus('idle');
      setResult(null);
    } else {
      alert('Per favore carica un file PDF valido.');
    }
  };

  const analyze = async () => {
    if (!file) return;
    if (!gdprConsent) {
      alert('Devi accettare i termini di privacy per procedere.');
      return;
    }

    // Fase 1: Trust building (Sanitizzazione visuale)
    setStatus('sanitizing');
    
    // Convertiamo in Base64 per inviarlo al tuo backend
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Pdf = reader.result.split(',')[1];

      setTimeout(async () => {
        // Fase 2: Chiamata reale all'API
        setStatus('analyzing');
        try {
          const res = await fetch('https://soldibuoni.it/.netlify/functions/analyze-bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Qui usiamo le chiavi esatte che si aspetta il tuo script GitHub
            body: JSON.stringify({ pdf: base64Pdf, filename: file.name })
          });

          if (!res.ok) throw new Error('Errore di analisi dal server');
          
          const data = await res.json();
          setResult(data);
          setStatus('success');
        } catch (err) {
          console.error("Errore durante l'analisi:", err);
          setStatus('error');
        }
      }, 1500); // 1.5s di "sanitizzazione" finta per trust psicologico
    };
  };

  return (
    <div style={{ maxWidth: 650, margin: '0 auto' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>
          Analizzatore Bollette con AI
        </h2>
        <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
          Carica il PDF della tua bolletta Luce o Gas. La nostra AI estrarrà i dati, distruggerà il file e ti dirà se stai pagando troppo rispetto al mercato.
        </p>

        {status === 'idle' || status === 'error' ? (
          <>
            <div 
              style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: 40, textAlign: 'center', background: '#f8fafc', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = color}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <input type="file" accept="application/pdf" onChange={handleFile} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
              <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
              <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>
                {file ? file.name : 'Clicca o trascina il PDF qui'}
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Solo file PDF nativi (max 5MB)</p>
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input type="checkbox" id="gdpr" checked={gdprConsent} onChange={(e) => setGdprConsent(e.target.checked)} style={{ marginTop: 4, cursor: 'pointer', width: 18, height: 18 }} />
              <label htmlFor="gdpr" style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, cursor: 'pointer' }}>
                Acconsento al trattamento temporaneo della mia bolletta. Confermo di aver compreso che <strong>il file non verrà salvato in nessun database</strong> e sarà distrutto immediatamente dopo la lettura.
              </label>
            </div>

            <button 
              onClick={analyze} 
              disabled={!file || !gdprConsent}
              style={{ background: (!file || !gdprConsent) ? '#cbd5e1' : color, color: '#fff', width: '100%', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: 16, border: 'none', marginTop: 20, cursor: (!file || !gdprConsent) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              Analizza la mia bolletta
            </button>
            {status === 'error' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginTop: 16, textAlign: 'center' }}>
                <p style={{ color: '#dc2626', fontSize: 13, margin: 0, fontWeight: 600 }}>⚠️ Errore di lettura dal server.</p>
                <p style={{ color: '#991b1b', fontSize: 12, margin: '4px 0 0' }}>Assicurati che sia una bolletta in PDF originale e non una scansione illeggibile.</p>
              </div>
            )}
          </>
        ) : status === 'success' && result ? (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, marginBottom: 20, textAlign: 'center' }}>
              <h3 style={{ color: '#166534', margin: '0 0 8px', fontSize: 18 }}>Analisi Completata!</h3>
              <p style={{ color: '#15803d', fontSize: 14, margin: 0 }}>L'AI ha processato i tuoi consumi.</p>
            </div>
            
            {/* Box Analisi AI discorsiva */}
            <div style={{ padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#475569', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🤖</span> Il responso dell'AI
              </div>
              <p style={{ color: '#0f172a', fontSize: 15, margin: 0, lineHeight: 1.6 }}>{result.analisi}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>I tuoi dati attuali</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                  €{result.prezzoUnitario}<span style={{fontSize: 14, fontWeight: 600}}>/{result.unita}</span>
                </div>
                <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{result.fornitore}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Contratto: {result.tipoContratto}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Costo Fisso: €{result.costoFisso}/mese</div>
              </div>

              <div style={{ padding: 16, background: '#fff', borderRadius: 10, border: `2px solid ${color}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, color: color, textTransform: 'uppercase', fontWeight: 700 }}>Risparmio potenziale</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                  €{result.risparmioAnnuo}<span style={{fontSize: 14, fontWeight: 600}}>/anno</span>
                </div>
                <div style={{ fontSize: 13, color: '#15803d', fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>
                  💡 {result.consiglio}
                </div>
              </div>
            </div>

            <a 
              href={`/${result.tipo === 'gas' ? 'gas' : 'energia'}`} 
              style={{ display: 'block', background: '#0f172a', color: '#fff', textAlign: 'center', padding: '16px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.target.style.background = '#1e293b'}
              onMouseOut={(e) => e.target.style.background = '#0f172a'}
            >
              Confronta le offerte {result.tipo === 'gas' ? 'Gas' : 'Luce'} →
            </a>
            
            <button onClick={() => {setStatus('idle'); setFile(null); setResult(null); setGdprConsent(false);}} style={{ background: 'none', border: 'none', color: '#64748b', width: '100%', padding: '16px', marginTop: 8, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              Analizza un'altra bolletta
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ fontSize: 44, animation: 'spin 2s linear infinite', marginBottom: 20 }}>⚙️</div>
            <h3 style={{ color: '#0f172a', fontSize: 18, margin: '0 0 8px' }}>
              {status === 'sanitizing' ? 'Anonimizzazione dati...' : 'L\'AI sta analizzando i costi...'}
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              {status === 'sanitizing' ? 'Rimozione dei dati sensibili (GDPR) in corso' : 'Lettura fornitore, prezzi unitari e stima del risparmio'}
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}