import React, { useState, useMemo } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const PRESETS_STAY = [
  { label: '1 Anno', val: 12, desc: 'Per chi cambia spesso' },
  { label: '2 Anni', val: 24, desc: 'Profilo standard' },
  { label: '4 Anni', val: 48, desc: 'Fedeltà massima' }
];

export function InternetComp() {
  const [permanenzaStr, setPermanenzaStr] = useState('24');
  const [offerte, setOfferte] = useState([
    { id: 1, nome: 'Offerta "Promo"', canone: '24.90', attivazione: '39.90', rataModem: '5', durataModem: '48' },
    { id: 2, nome: 'Alternativa B', canone: '29.90', attivazione: '0', rataModem: '0', durataModem: '0' }
  ]);

  const permanenza = parseInt(permanenzaStr) || 12;

  const calcolaMensileEffettivo = (off) => {
    const canone = parseFloat(off.canone) || 0;
    const attivazione = parseFloat(off.attivazione) || 0;
    const rataModem = parseFloat(off.rataModem) || 0;
    const durataModem = parseInt(off.durataModem) || 0;

    let totale = canone * permanenza;
    totale += attivazione;

    if (durataModem > 0) {
      const ratePagate = Math.min(permanenza, durataModem);
      const rateResidue = Math.max(0, durataModem - permanenza);
      totale += (ratePagate * rataModem) + (rateResidue * rataModem);
    }

    return totale / permanenza;
  };

  const risultati = useMemo(() => {
    return offerte.map(off => ({
      ...off,
      mensileEffettivo: calcolaMensileEffettivo(off)
    }));
  }, [offerte, permanenza]);

  const minCosto = Math.min(...risultati.map(r => r.mensileEffettivo));

  const updateOfferta = (id, field, value) => {
    setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 10, fontFamily: 'inherit', fontWeight: 600, color: '#0f172a', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 };
  const helperStyle = { display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 };

  const formatEuro = (v) => `€ ${v.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#0f172a', marginBottom: 12 }}>Costo Mensile Reale Ammortizzato</h2>
        <p style={{ fontSize: 16, color: '#475569', maxWidth: 650, margin: '0 auto' }}>
          Non farti ingannare dal canone pubblicizzato. Calcola quanto pagherai davvero ogni mese includendo attivazione e rate residue del modem se decidi di cambiare operatore.
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 48, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <label style={labelStyle}>Per quanto tempo pensi di tenere questo contratto?</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {PRESETS_STAY.map(p => (
              <button key={p.val} onClick={() => setPermanenzaStr(p.val.toString())} style={{ background: permanenza === p.val ? '#8b5cf6' : '#f8fafc', color: permanenza === p.val ? '#fff' : '#475569', border: `1px solid ${permanenza === p.val ? '#8b5cf6' : '#e2e8f0'}`, padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>
                {p.label} <span style={{ opacity: 0.8, fontWeight: 500, fontSize: 12, display: 'block' }}>{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 24 }}>
          {risultati.map((off) => {
            const isWinner = off.mensileEffettivo === minCosto && off.mensileEffettivo > 0;
            return (
              <div key={off.id} style={{ background: isWinner ? '#f5f3ff' : '#fff', border: `2px solid ${isWinner ? '#8b5cf6' : '#e2e8f0'}`, borderRadius: 20, padding: 24, position: 'relative' }}>
                {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#8b5cf6', color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>🥇 MIGLIOR RAPPORTO</div>}
                
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ ...inputStyle, fontWeight: 900, fontSize: 18, border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '2px solid #e2e8f0', borderRadius: 0, marginBottom: 20 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Canone Mensile (€)</label>
                    <input type="number" step="0.01" value={off.canone} onChange={(e) => updateOfferta(off.id, 'canone', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Costo Attivazione Una Tantum (€)</label>
                    <input type="number" step="0.01" value={off.attivazione} onChange={(e) => updateOfferta(off.id, 'attivazione', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Rata Modem (€)</label>
                      <input type="number" step="0.01" value={off.rataModem} onChange={(e) => updateOfferta(off.id, 'rataModem', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Rate (N° Mesi)</label>
                      <input type="number" value={off.durataModem} onChange={(e) => updateOfferta(off.id, 'durataModem', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <span style={helperStyle}>Attenzione: se cambi operatore prima di {off.durataModem} mesi, pagherai le rate residue del modem in un colpo solo.</span>
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Costo Mensile Reale</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: isWinner ? '#8b5cf6' : '#0f172a', margin: '4px 0' }}>
                    {formatEuro(off.mensileEffettivo)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Ammortizzato su {permanenza} mesi</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 24, padding: '40px', position: 'relative', textAlign: 'center', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)' }}>
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '6px 20px', borderRadius: 30, whiteSpace: 'nowrap' }}>
          ⭐ Scelta Trasparente del Team
        </div>
        <h3 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>Iliad Fibra — Zero Costi Nascosti</h3>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 32, maxWidth: 550, margin: '0 auto 32px', lineHeight: 1.6 }}>L'operatore che ha rivoluzionato il mercato eliminando il trucco del modem a rate e dei vincoli temporali. Il prezzo che vedi è quello che paghi.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>CANONE MENSILE</span>
            <div style={{ fontSize: 24, fontWeight: 900 }}>€ 19,99 <span style={{ fontSize: 14, color: '#64748b' }}>/mese</span></div>
            <span style={helperStyle}>Per utenti Iliad Mobile (o 24,99€)</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>MODEM & VINCOLI</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>Incluso / Zero</div>
            <span style={helperStyle}>Nessuna maxi-rata finale</span>
          </div>
        </div>

        <a href="https://www.iliad.it/offerte-fibra.html" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 16, textDecoration: 'none' }}>Scopri l'offerta senza trucchi →</a>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20 }}><em>Trasparenza Editoriale: Link affiliato. Se decidi di attivare Iliad tramite noi, riceviamo una commissione senza costi aggiuntivi per te.</em></p>
      </div>
    </div>
  );
}