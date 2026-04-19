import React, { useState, useMemo } from 'react';

const PRESETS_STAY = [
  { label: '1 Anno', val: 12, desc: 'Per chi cambia spesso' },
  { label: '2 Anni', val: 24, desc: 'Profilo standard' },
  { label: '4 Anni', val: 48, desc: 'Fedeltà massima' }
];

export function InternetComp() {
  const [permanenzaStr, setPermanenzaStr] = useState('24');
  const [offerte, setOfferte] = useState([
    { id: 1, nome: 'Offerta con Modem', canone: '24.90', attivazione: '39.90', rataModem: '5', durataModem: '48' },
    { id: 2, nome: 'Offerta Senza Vincoli', canone: '29.90', attivazione: '0', rataModem: '0', durataModem: '0' }
  ]);

  const permanenza = parseInt(permanenzaStr) || 24;

  const risultati = useMemo(() => {
    return offerte.map(off => {
      const c = parseFloat(off.canone) || 0;
      const a = parseFloat(off.attivazione) || 0;
      const rm = parseFloat(off.rataModem) || 0;
      const dm = parseInt(off.durataModem) || 0;
      const residuo = dm > permanenza ? (dm - permanenza) * rm : 0;
      const totale = (c * permanenza) + a + (Math.min(dm, permanenza) * rm) + residuo;
      return { ...off, mensileEffettivo: totale / permanenza };
    });
  }, [offerte, permanenza]);

  const minCosto = Math.min(...risultati.map(r => r.mensileEffettivo));
  const updateOfferta = (id, field, value) => setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));
  
  const inputStyle = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 12, fontWeight: 600, color: '#0f172a', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#0f172a', marginBottom: 16 }}>Costo Mensile Reale</h2>
        <p style={{ fontSize: 17, color: '#64748b', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>Il trucco è nel modem a rate. Calcola il costo ammortizzato includendo l'attivazione e la maxi-rata finale se cambi operatore.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 24, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <label style={labelStyle}>Quanti anni pensi di restare?</label>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {PRESETS_STAY.map(p => (
              <button key={p.val} onClick={() => setPermanenzaStr(p.val.toString())} style={{ flex: 1, padding: '14px', borderRadius: 12, border: `1px solid ${permanenza === p.val ? '#8b5cf6' : '#e2e8f0'}`, background: permanenza === p.val ? '#8b5cf6' : '#f8fafc', color: permanenza === p.val ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>{p.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 24 }}>
          {risultati.map((off) => {
            const isWinner = off.mensileEffettivo === minCosto;
            return (
              <div key={off.id} style={{ background: isWinner ? '#f5f3ff' : '#fff', border: `2px solid ${isWinner ? '#8b5cf6' : '#e2e8f0'}`, borderRadius: 24, padding: 28, position: 'relative' }}>
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ ...inputStyle, fontWeight: 900, fontSize: 18, border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '2px solid #e2e8f0', borderRadius: 0, marginBottom: 20 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div><label style={labelStyle}>Canone Mensile (€)</label><input type="number" step="0.01" value={off.canone} onChange={(e) => updateOfferta(off.id, 'canone', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Attivazione (€)</label><input type="number" step="0.01" value={off.attivazione} onChange={(e) => updateOfferta(off.id, 'attivazione', e.target.value)} style={inputStyle} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Rata Modem</label><input type="number" step="0.01" value={off.rataModem} onChange={(e) => updateOfferta(off.id, 'rataModem', e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Rate (Mesi)</label><input type="number" value={off.durataModem} onChange={(e) => updateOfferta(off.id, 'durataModem', e.target.value)} style={inputStyle} /></div>
                  </div>
                </div>
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Mensile Ammortizzato</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: isWinner ? '#8b5cf6' : '#0f172a', margin: '4px 0' }}>€ {off.mensileEffettivo.toFixed(2)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 80, borderTop: '1px solid #e2e8f0', paddingTop: 64, marginBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Le Analisi del Team</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#0f172a', marginTop: 8, marginBottom: 16 }}>Le Scelte Trasparenti</h2>
          <p style={{ fontSize: 16, color: '#475569', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>Basandoci sull'assenza di vincoli e di rate residue del modem, questa è la soluzione più limpida del mercato. <em>(Partnership commerciale)</em></p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '40px', position: 'relative', textAlign: 'center', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.05)', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 18px', borderRadius: 30 }}>⭐ Zero Sorprese</div>
          <h3 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>Iliad Fibra</h3>
          <p style={{ color: '#64748b', fontSize: 16, marginBottom: 24, lineHeight: 1.6 }}>Il prezzo che vedi è quello che pagherai. Nessuna maxi-rata finale o modem vincolante.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, background: '#f8fafc', padding: '20px', borderRadius: 16, marginBottom: 24, border: '1px solid #f1f5f9' }}>
            <div style={{ textAlign: 'left' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>CANONE</span><div style={{ fontSize: 24, fontWeight: 900 }}>€ 19,99 /m</div></div>
            <div style={{ width: 1, background: '#e2e8f0' }}></div>
            <div style={{ textAlign: 'left' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>VINCOLI</span><div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>Nessuno</div></div>
          </div>
          <a href="https://www.iliad.it/offerte-fibra.html" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 16, transition: '0.2s' }}>Scopri l'offerta reale →</a>
        </div>
      </div>
    </div>
  );
}