import React, { useState, useMemo } from 'react';

const EASE_FLUID = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function CalcolatoreStipendio({ color = '#10b981' }) {
  const [ral, setRal] = useState(25000);
  const [mensilita, setMensilita] = useState(13);
  const [regione, setRegione] = useState('Lombardia');

  const risultati = useMemo(() => {
    // Calcolo semplificato INPS (es. 9.19%)
    const inps = ral * 0.0919;
    const imponibile = ral - inps;
    
    // Scaglioni IRPEF 2024-2026 (fino 28k 23%, 28k-50k 35%, oltre 43%)
    let irpef = 0;
    if (imponibile <= 28000) {
      irpef = imponibile * 0.23;
    } else if (imponibile <= 50000) {
      irpef = (28000 * 0.23) + ((imponibile - 28000) * 0.35);
    } else {
      irpef = (28000 * 0.23) + (22000 * 0.35) + ((imponibile - 50000) * 0.43);
    }

    // Addizionali regionali stimate (media 1.5%)
    const addizionali = imponibile * 0.015;
    
    // Bonus/Detrazioni semplificate (es. bonus lavoro dipendente)
    let detrazioni = 0;
    if (ral <= 15000) detrazioni = 1955;
    else if (ral <= 28000) detrazioni = 1910 + 1190 * ((28000 - ral) / 13000);
    else if (ral <= 50000) detrazioni = 1910 * ((50000 - ral) / 22000);

    const irpefNetta = Math.max(0, irpef - detrazioni);
    const nettoAnnuo = ral - inps - irpefNetta - addizionali;
    const nettoMensile = nettoAnnuo / mensilita;

    return { nettoMensile: Math.round(nettoMensile), inps: Math.round(inps), irpef: Math.round(irpefNetta) };
  }, [ral, mensilita, regione]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: 24, padding: 32, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>1. Inserisci i dati del contratto</h3>
        
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
            <span>RAL (Reddito Annuo Lordo):</span>
            <span style={{ color: color, fontSize: 20 }}>€ {ral.toLocaleString('it-IT')}</span>
          </label>
          <input type="range" min={10000} max={100000} step={1000} value={ral} onChange={(e) => setRal(+e.target.value)} style={{ width: '100%', accentColor: color, height: 8, background: '#e2e8f0', borderRadius: 4, outline: 'none', marginTop: 16 }} />
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'block' }}>Mensilità</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[12, 13, 14].map(m => (
                <button key={m} onClick={() => setMensilita(m)} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', background: mensilita === m ? color : '#fff', color: mensilita === m ? '#fff' : '#64748b', fontWeight: 600, cursor: 'pointer', transition: `all 0.3s ${EASE_FLUID}` }}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'block' }}>Regione</label>
            <select value={regione} onChange={(e) => setRegione(e.target.value)} style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', background: '#f8fafc', fontSize: 15, outline: 'none' }}>
              <option value="Lombardia">Lombardia</option>
              <option value="Lazio">Lazio</option>
              <option value="Campania">Campania</option>
              <option value="Veneto">Veneto</option>
              <option value="Altro">Altra Regione</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 24, padding: 32, border: '1px solid rgba(0,0,0,0.04)', textAlign: 'center', marginBottom: 24, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1 }}>Stipendio Netto Mensile Stimato</div>
        <div style={{ fontSize: 64, fontWeight: 900, color: color, margin: '8px 0' }}>€ {risultati.nettoMensile.toLocaleString('it-IT')}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
          <span>INPS annuo: € {risultati.inps.toLocaleString('it-IT')}</span>
          <span>IRPEF netta annua: € {risultati.irpef.toLocaleString('it-IT')}</span>
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)`, borderRadius: 24, padding: 24, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Non farti erodere lo stipendio!</h4>
          <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>Accredita la busta paga su un conto che ti paga il 4% annuo o ti azzera il canone.</p>
        </div>
        <a href="/conti-correnti" style={{ background: color, color: '#fff', padding: '12px 24px', borderRadius: 100, fontWeight: 700, textDecoration: 'none' }}>Scopri i Migliori Conti →</a>
      </div>
    </div>
  );
}
