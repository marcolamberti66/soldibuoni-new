import React, { useState } from 'react';

const EASE_FLUID = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function TrovaBonus({ color = '#f59e0b' }) {
  const [step, setStep] = useState(1);
  const [dati, setDati] = useState({ eta: 30, isee: 'medio', figli: 'no', casa: 'affitto', lavoro: 'dipendente' });

  const calcolaBonus = () => {
    const b = [];
    if (dati.figli === 'si') b.push({ nome: 'Assegno Unico Universale', desc: 'Sostegno mensile per ogni figlio a carico.', valore: 'Fino a 200€/mese' });
    if (dati.eta < 36 && dati.casa === 'nessuna' && dati.isee !== 'alto') b.push({ nome: 'Agevolazioni Mutuo Prima Casa Under 36', desc: 'Esenzione imposte di registro, ipotecaria e catastale.', valore: 'Migliaia di €' });
    if (dati.casa === 'affitto' && dati.isee === 'basso') b.push({ nome: 'Bonus Affitto / Detrazione Canone', desc: 'Detrazione IRPEF per chi vive in affitto.', valore: 'Fino a 300€/anno' });
    if (dati.eta <= 35) b.push({ nome: 'Carta Giovani Nazionale', desc: 'Sconti su trasporti, cultura e servizi.', valore: 'Sconti Vari' });
    if (dati.lavoro === 'piva') b.push({ nome: 'Forfettario (Start-up)', desc: 'Tassazione agevolata al 5% per le nuove P.IVA per 5 anni.', valore: 'Risparmio enorme' });
    if (dati.isee === 'basso') b.push({ nome: 'Bonus Bollette / Idrico', desc: 'Sconto automatico in bolletta per disagio economico.', valore: 'Variabile' });
    return b;
  };

  const OptionBtn = ({ label, field, val }) => (
    <button onClick={() => setDati({...dati, [field]: val})} style={{ flex: 1, padding: '16px', borderRadius: 16, border: '2px solid', borderColor: dati[field] === val ? color : '#e2e8f0', background: dati[field] === val ? `${color}11` : '#fff', color: '#0f172a', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: `all 0.3s ${EASE_FLUID}` }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {step === 1 && (
        <div style={{ background: '#fff', borderRadius: 24, padding: 40, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', animation: 'fadeInUp 0.4s' }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>Scopri a quali Bonus hai diritto</h3>
          <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 32 }}>Rispondi a 4 semplici domande anonime.</p>
          
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>Età: <span style={{color}}>{dati.eta} anni</span></label>
            <input type="range" min={18} max={80} value={dati.eta} onChange={(e) => setDati({...dati, eta: +e.target.value})} style={{ width: '100%', accentColor: color }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 12, display: 'block' }}>Hai figli a carico?</label>
            <div style={{ display: 'flex', gap: 12 }}><OptionBtn label="Sì" field="figli" val="si" /><OptionBtn label="No" field="figli" val="no" /></div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 12, display: 'block' }}>Fascia ISEE stimata</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><OptionBtn label="Basso (< 15k)" field="isee" val="basso" /><OptionBtn label="Medio (15k - 30k)" field="isee" val="medio" /><OptionBtn label="Alto (> 30k)" field="isee" val="alto" /></div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 12, display: 'block' }}>Situazione Lavorativa</label>
            <div style={{ display: 'flex', gap: 12 }}><OptionBtn label="Dipendente" field="lavoro" val="dipendente" /><OptionBtn label="Partita IVA" field="lavoro" val="piva" /></div>
          </div>

          <button onClick={() => setStep(2)} style={{ width: '100%', background: color, color: '#fff', padding: '16px', borderRadius: 16, fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer' }}>Analizza il mio profilo →</button>
        </div>
      )}

      {step === 2 && (
        <div style={{ animation: 'fadeInUp 0.4s' }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Risultati dell'Analisi</h3>
          {calcolaBonus().map((b, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 24, borderLeft: `6px solid ${color}`, marginBottom: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{b.nome}</h4>
                  <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>{b.desc}</p>
                </div>
                <div style={{ background: `${color}11`, color: color, padding: '6px 12px', borderRadius: 10, fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>{b.valore}</div>
              </div>
            </div>
          ))}
          
          <button onClick={() => setStep(1)} style={{ background: 'transparent', color: '#64748b', border: 'none', fontWeight: 600, cursor: 'pointer', padding: '12px 0' }}>← Ricalcola</button>

          {dati.lavoro === 'piva' && (
            <div style={{ marginTop: 24, background: '#0f172a', borderRadius: 24, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div><h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: 16 }}>Sei un libero professionista?</h4><p style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>Apri o gestisci la tua P.IVA online pagando meno tasse.</p></div>
              <a href="[INSERISCI_LINK_FISCOZEN]" style={{ background: '#fff', color: '#0f172a', padding: '10px 20px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Scopri Fiscozen</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
