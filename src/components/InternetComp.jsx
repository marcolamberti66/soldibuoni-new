import React, { useState, useMemo } from 'react';

const PRESETS_STAY = [
  { label: '1 Anno', val: 12, desc: 'Per chi cambia spesso' },
  { label: '2 Anni', val: 24, desc: 'Profilo standard' },
  { label: '4 Anni', val: 48, desc: 'Fedeltà massima' }
];

export function InternetComp() {
  const [permanenzaStr, setPermanenzaStr] = useState('24');
  const [offerte, setOfferte] = useState([
    { id: 1, nome: 'Offerta "Promo" (Es. WindTre)', canone: '19.99', attivazione: '47.76', rataModem: '5.99', durataModem: '48' },
    { id: 2, nome: 'Alternativa Libera (Es. Iliad)', canone: '24.99', attivazione: '39.99', rataModem: '0', durataModem: '0' }
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

  const inputStyle = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 12, fontFamily: 'inherit', fontWeight: 600, color: '#0f172a', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 };
  const helperStyle = { display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 };
  const formatEuro = (v) => `€ ${v.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#0f172a', marginBottom: 12 }}>Costo Mensile Reale Ammortizzato</h2>
        <p style={{ fontSize: 17, color: '#64748b', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
          Non farti ingannare dal canone promozionale. Calcola quanto pagherai davvero ogni mese includendo attivazione e rate residue del modem.
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
              <div key={off.id} style={{ background: isWinner ? '#f5f3ff' : '#fff', border: `2px solid ${isWinner ? '#8b5cf6' : '#e2e8f0'}`, borderRadius: 24, padding: 28, position: 'relative' }}>
                {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#8b5cf6', color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>🥇 MIGLIOR RAPPORTO</div>}
                
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ ...inputStyle, fontWeight: 900, fontSize: 18, border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '2px solid #e2e8f0', borderRadius: 0, marginBottom: 20 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div><label style={labelStyle}>Canone Mensile (€)</label><input type="number" step="0.01" value={off.canone} onChange={(e) => updateOfferta(off.id, 'canone', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Attivazione Totale Una Tantum (€)</label><input type="number" step="0.01" value={off.attivazione} onChange={(e) => updateOfferta(off.id, 'attivazione', e.target.value)} style={inputStyle} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Rata Modem (€/Mese)</label><input type="number" step="0.01" value={off.rataModem} onChange={(e) => updateOfferta(off.id, 'rataModem', e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Rate (N° Mesi)</label><input type="number" value={off.durataModem} onChange={(e) => updateOfferta(off.id, 'durataModem', e.target.value)} style={inputStyle} /></div>
                  </div>
                  <span style={helperStyle}>Se te ne vai prima della scadenza delle rate, pagherai il residuo in un'unica soluzione.</span>
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Costo Mensile Reale</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: isWinner ? '#8b5cf6' : '#0f172a', margin: '4px 0' }}>{formatEuro(off.mensileEffettivo)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Ammortizzato su {permanenza} mesi</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEZIONE LE ANALISI DEL TEAM */}
      <div style={{ marginTop: 80, borderTop: '1px solid #e2e8f0', paddingTop: 64, marginBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Le Analisi del Team</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#0f172a', marginTop: 8, marginBottom: 16 }}>Le Scelte Trasparenti</h2>
          <p style={{ fontSize: 16, color: '#475569', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
            Abbiamo analizzato coperture e costi nascosti per garantirti connessioni al top. <em>(Partnership commerciali)</em>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
          
          {/* BOX WINDTRE FIBRA */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '36px 32px', position: 'relative', boxShadow: '0 20px 40px -12px rgba(249,115,22,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#f97316', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 18px', borderRadius: 30, whiteSpace: 'nowrap' }}>📡 Miglior Copertura Fibra</div>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>WindTre Super Fibra</h3>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>Una delle reti più diffuse in Italia. L'offerta include la Fibra FTTH fino a 2.5 Gbps, il Modem Wi-Fi 7 di ultima generazione e Amazon Prime incluso per un anno.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, background: '#f8fafc', padding: '16px', borderRadius: 16, marginBottom: 24, border: '1px solid #f1f5f9' }}>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>CANONE (1° ANNO)</span><div style={{ fontSize: 18, fontWeight: 900, color: '#f97316' }}>€ 19,99 /m</div></div>
              <div style={{ width: 1, background: '#e2e8f0' }}></div>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>VELOCITÀ</span><div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>2.5 Gbps</div></div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <a href="https://www.awin1.com/cread.php?awinmid=27760&awinaffid=2811530" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'block', background: '#f97316', color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 15, marginBottom: 12, transition: '0.2s' }}>Scopri la Fibra WindTre →</a>
              <a href="/recensione-windtre" style={{ fontSize: 13, color: '#f97316', fontWeight: 700, textDecoration: 'underline' }}>Leggi l'analisi dei vincoli contrattuali →</a>
            </div>
          </div>

          {/* BOX LYCA MOBILE */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '36px 32px', position: 'relative', boxShadow: '0 20px 40px -12px rgba(14,165,233,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0ea5e9', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 18px', borderRadius: 30, whiteSpace: 'nowrap' }}>📱 Miglior Offerta Mobile</div>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>Lyca Mobile — Portin 5G 599</h3>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>Porta il tuo numero in Lyca Mobile e ottieni una montagna di Giga in 5G a un prezzo imbattibile. Minuti illimitati e navigazione garantita su rete Vodafone.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, background: '#f8fafc', padding: '16px', borderRadius: 16, marginBottom: 24, border: '1px solid #f1f5f9' }}>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>PACCHETTO</span><div style={{ fontSize: 18, fontWeight: 900, color: '#0ea5e9' }}>150 GB 5G</div></div>
              <div style={{ width: 1, background: '#e2e8f0' }}></div>
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>CANONE</span><div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>€ 5,99 /m</div></div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <a href="https://www.awin1.com/cread.php?awinmid=118793&awinaffid=2811530" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'block', background: '#0ea5e9', color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 15, marginBottom: 12, transition: '0.2s' }}>Attiva l'offerta Lyca Mobile →</a>
              <a href="/recensione-lyca" style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 700, textDecoration: 'underline' }}>Guarda i dettagli per viaggiare in UE →</a>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}