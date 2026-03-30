import React, { useState } from 'react';

export function AnalizzaBolletta({ color = '#059669' }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (e) => {
    const selected = e.target.files ? e.target.files[0] : null;
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setStatus('idle');
      setResult(null);
    } else if (selected) {
      alert('Per favore carica un file PDF nativo.');
    }
  };

  const analyze = async () => {
    if (!file || !gdprConsent) return;
    setStatus('sanitizing');
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Pdf = reader.result.split(',')[1];
      setTimeout(async () => {
        setStatus('analyzing');
        try {
          const res = await fetch('https://soldibuoni.it/.netlify/functions/analyze-bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdf: base64Pdf, filename: file.name })
          });
          if (!res.ok) throw new Error('Errore server');
          const data = await res.json();
          setResult(data);
          setStatus('success');
        } catch (err) {
          setStatus('error');
        }
      }, 1800); 
    };
  };

  return (
    <div className="pdf-analyzer-wrapper" style={{ '--primary': color }}>
      <style dangerouslySetInnerHTML={{__html:`
        .pdf-analyzer-wrapper { max-width: 680px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .glass-box { background: rgba(255,255,255,0.85); backdrop-filter: blur(24px); border-radius: 32px; padding: 40px; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08); }
        .drop-area { border: 2px dashed #cbd5e1; border-radius: 24px; padding: 48px 24px; text-align: center; background: rgba(248,250,252,0.5); cursor: pointer; transition: all 0.3s ease; position: relative; }
        .drop-area.drag-active { border-color: var(--primary); background: rgba(5,150,105,0.05); transform: scale(1.02); }
        .drop-area:hover { border-color: var(--primary); }
        .icon-pulse { font-size: 48px; margin-bottom: 16px; display: inline-block; animation: float 3s ease-in-out infinite; }
        .btn-analyze { background: var(--primary); color: #fff; width: 100%; padding: 18px; border-radius: 16px; font-weight: 800; font-size: 16px; border: none; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 25px -5px var(--primary); margin-top: 24px; }
        .btn-analyze:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; transform: none; }
        .btn-analyze:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px var(--primary); }
        
        .result-card { background: #fff; border-radius: 20px; padding: 24px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }
        .result-highlight { border: 2px solid var(--primary); background: linear-gradient(to bottom right, #fff, rgba(5,150,105,0.05)); }
        
        .btn-switcho { background: linear-gradient(135deg, #10b981, #059669); color: #fff; text-decoration: none; display: block; text-align: center; padding: 20px; border-radius: 20px; font-weight: 800; font-size: 18px; box-shadow: 0 10px 30px -5px rgba(5,150,105,0.6); transition: all 0.3s; position: relative; overflow: hidden; margin-top: 32px; }
        .btn-switcho::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%); opacity: 0; transition: opacity 0.3s; }
        .btn-switcho:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 15px 40px -5px rgba(5,150,105,0.8); }
        .btn-switcho:hover::after { opacity: 1; animation: rotate 3s linear infinite; }
        
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        @keyframes rotate { 100% { transform: rotate(360deg); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
      `}}/>

      <div className="glass-box">
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: '#0f172a', marginBottom: 12, textAlign: 'center', fontWeight: 800 }}>
          L'Intelligenza Artificiale che taglia le tue bollette.
        </h2>
        <p style={{ color: '#64748b', fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 1.6 }}>
          Carica il PDF. Il nostro modello estrae i costi, cancella i dati sensibili istantaneamente e calcola il tuo spreco annuale.
        </p>

        {status === 'idle' || status === 'error' ? (
          <div style={{ animation: 'popIn 0.4s ease-out' }}>
            <div 
              className={`drop-area ${isDragging ? 'drag-active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile({target: {files: e.dataTransfer.files}}); }}
            >
              <input type="file" accept="application/pdf" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} />
              <span className="icon-pulse">📄</span>
              <h3 style={{ fontSize: 18, color: '#0f172a', fontWeight: 700, margin: '0 0 8px' }}>
                {file ? file.name : 'Trascina qui il PDF della bolletta'}
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Oppure clicca per sfogliare (Max 5MB)</p>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'flex-start', background: '#f8fafc', padding: 16, borderRadius: 16 }}>
              <input type="checkbox" id="gdpr" checked={gdprConsent} onChange={(e) => setGdprConsent(e.target.checked)} style={{ width: 20, height: 20, accentColor: color, cursor: 'pointer', marginTop: 2 }} />
              <label htmlFor="gdpr" style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, cursor: 'pointer' }}>
                Consenso Privacy: <strong>Nessun dato verrà salvato.</strong> Il PDF viene processato in RAM e distrutto istantaneamente dopo la lettura.
              </label>
            </div>

            <button onClick={analyze} disabled={!file || !gdprConsent} className="btn-analyze">
              Analizza la mia bolletta ora →
            </button>
            
            {status === 'error' && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: 16, borderRadius: 16, marginTop: 16, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
                ⚠️ Formato non supportato. Inserisci un PDF originale del fornitore.
              </div>
            )}
          </div>
        ) : status === 'success' && result ? (
          <div style={{ animation: 'popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#047857', padding: '16px 24px', borderRadius: 20, textAlign: 'center', fontWeight: 800, fontSize: 18, marginBottom: 24 }}>
              ✨ Diagnosi Completata
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="result-card">
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1 }}>Costo Attuale</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>€{result.prezzoUnitario}<span style={{fontSize: 16, fontWeight: 600, color: '#94a3b8'}}>/{result.unita}</span></div>
                <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700 }}>Fornitore: {result.fornitore}</div>
              </div>

              <div className="result-card result-highlight">
                <div style={{ fontSize: 11, color: color, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1 }}>Spreco Annuale</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: color, margin: '8px 0', lineHeight: 1 }}>
                  €{result.risparmioAnnuo}
                </div>
                <div style={{ fontSize: 13, color: '#047857', fontWeight: 600, lineHeight: 1.4, marginTop: 8 }}>
                  💡 {result.consiglio || 'Passando alla migliore offerta sul mercato.'}
                </div>
              </div>
            </div>

            {/* ── CTA AFFILIAZIONE SWITCHO ── */}
            <a href="[INSERISCI_LINK_SWITCHO]" target="_blank" rel="noopener noreferrer" className="btn-switcho">
              ⚡ Cambia fornitore gratis in 2 click con Switcho
              <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
                Carichi la bolletta, fanno tutto loro, zero burocrazia.
              </span>
            </a>

            <button onClick={() => {setStatus('idle'); setFile(null); setResult(null); setGdprConsent(false);}} style={{ background: 'none', border: 'none', color: '#94a3b8', width: '100%', padding: 16, marginTop: 16, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              ↺ Analizza un'altra bolletta
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', animation: 'popIn 0.3s ease-out' }}>
            <div style={{ fontSize: 56, animation: 'spin-slow 3s linear infinite', marginBottom: 24, display: 'inline-block' }}>⚙️</div>
            <h3 style={{ color: '#0f172a', fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>
              {status === 'sanitizing' ? 'Anonimizzazione Dati...' : 'Elaborazione AI...'}
            </h3>
            <div style={{ background: '#f1f5f9', borderRadius: 100, height: 6, width: 200, margin: '0 auto', overflow: 'hidden' }}>
              <div style={{ background: color, height: '100%', width: status === 'sanitizing' ? '40%' : '85%', transition: 'width 1s ease-in-out' }}></div>
            </div>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 16 }}>
              {status === 'sanitizing' ? 'Distruzione dei dati personali in corso (GDPR)' : 'Lettura fornitore e confronto con i prezzi live...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
