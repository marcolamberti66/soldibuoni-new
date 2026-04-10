import React, { useState, useMemo } from 'react';

export function InteresseComposto({ color = '#8b5cf6' }) {
  const [capitale, setCapitale] = useState(5000);
  const [versamento, setVersamento] = useState(200);
  const [anni, setAnni] = useState(15);
  const [tasso, setTasso] = useState(6);

  const risultati = useMemo(() => {
    let totale = capitale;
    let versato = capitale;
    
    for (let i = 0; i < anni; i++) {
      totale = (totale + (versamento * 12)) * (1 + (tasso / 100));
      versato += (versamento * 12);
    }
    
    const interessi = totale - versato;
    return { totale: Math.round(totale), versato: Math.round(versato), interessi: Math.round(interessi) };
  }, [capitale, versamento, anni, tasso]);

  const percVersato = (risultati.versato / risultati.totale) * 100;
  const percInteressi = (risultati.interessi / risultati.totale) * 100;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: 24, padding: 32, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', marginBottom: 32 }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}><span>Capitale iniziale:</span> <span style={{color}}>€ {capitale.toLocaleString('it-IT')}</span></label>
            {/* MODIFICA: max 200000 */}
            <input type="range" min={0} max={200000} step={1000} value={capitale} onChange={(e) => setCapitale(+e.target.value)} style={{ width: '100%', accentColor: color, marginTop: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}><span>Versamento mensile (PAC):</span> <span style={{color}}>€ {versamento.toLocaleString('it-IT')}</span></label>
            <input type="range" min={0} max={2000} step={50} value={versamento} onChange={(e) => setVersamento(+e.target.value)} style={{ width: '100%', accentColor: color, marginTop: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}><span>Anni di investimento:</span> <span style={{color}}>{anni} anni</span></label>
            {/* MODIFICA: max 60 */}
            <input type="range" min={1} max={60} step={1} value={anni} onChange={(e) => setAnni(+e.target.value)} style={{ width: '100%', accentColor: color, marginTop: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between' }}><span>Rendimento annuo atteso:</span> <span style={{color}}>{tasso}%</span></label>
            <input type="range" min={1} max={12} step={0.5} value={tasso} onChange={(e) => setTasso(+e.target.value)} style={{ width: '100%', accentColor: color, marginTop: 12 }} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 24, padding: 32, border: '1px solid rgba(0,0,0,0.04)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>Capitale Finale Stimato</h3>
        <div style={{ fontSize: 56, fontWeight: 900, color: color, textAlign: 'center', marginBottom: 32 }}>€ {risultati.totale.toLocaleString('it-IT')}</div>
        
        {/* Barra di proporzione */}
        <div style={{ display: 'flex', height: 24, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ width: `${percVersato}%`, background: '#94a3b8', transition: 'width 0.5s' }}></div>
          <div style={{ width: `${percInteressi}%`, background: color, transition: 'width 0.5s' }}></div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
          <div style={{ color: '#64748b' }}><span style={{display:'inline-block', width:12, height:12, borderRadius:4, background:'#94a3b8', marginRight:8}}></span>Capitale versato: € {risultati.versato.toLocaleString('it-IT')}</div>
          <div style={{ color: color }}><span style={{display:'inline-block', width:12, height:12, borderRadius:4, background:color, marginRight:8}}></span>Interessi generati: € {risultati.interessi.toLocaleString('it-IT')}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <a href="[INSERISCI_LINK_MONEYFARM_O_ALTRO]" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '16px 32px', borderRadius: 16, fontWeight: 700, textDecoration: 'none', fontSize: 16 }}>Metti a frutto i tuoi risparmi ora →</a>
      </div>
    </div>
  );
}