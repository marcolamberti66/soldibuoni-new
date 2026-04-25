import React, { useState } from 'react';

const EASE_FLUID = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function TrovaBonus({ color = '#f59e0b' }) {
  const [step, setStep] = useState(1);
  const [dati, setDati] = useState({ eta: 30, isee: 'medio', figli: 'no', casa: 'affitto', lavoro: 'dipendente' });

  const calcolaBonus = () => {
    const b = [];
    if (dati.figli === 'si') b.push({ nome: 'Assegno Unico Universale', desc: 'Sostegno mensile per ogni figlio a carico.', valore: 'Fino a 200€/mese', link: 'https://www.inps.it/prestazioni-servizi/assegno-unico-e-universale-per-i-figli-a-carico' });
    if (dati.eta < 36 && dati.casa === 'nessuna' && dati.isee !== 'alto') b.push({ nome: 'Agevolazioni Mutuo Prima Casa Under 36', desc: 'Esenzione imposte di registro, ipotecaria e catastale.', valore: 'Migliaia di €', link: 'https://www.agenziaentrate.gov.it/portale/web/guest/agevolazioni-prima-casa-under-36' });
    if (dati.casa === 'affitto' && dati.isee === 'basso') b.push({ nome: 'Bonus Affitto / Detrazione Canone', desc: 'Detrazione IRPEF per chi vive in affitto.', valore: 'Fino a 300€/anno', link: 'https://www.agenziaentrate.gov.it/portale/web/guest/detrazione-canoni-di-locazione' });
    if (dati.eta <= 35) b.push({ nome: 'Carta Giovani Nazionale', desc: 'Sconti su trasporti, cultura e servizi.', valore: 'Sconti Vari', link: 'https://giovani2030.it/iniziativa/carta-giovani-nazionale/' });
    if (dati.lavoro === 'piva') b.push({ nome: 'Forfettario (Start-up)', desc: 'Tassazione agevolata al 5% per le nuove P.IVA per 5 anni.', valore: 'Risparmio enorme', link: 'https://www.agenziaentrate.gov.it/portale/web/guest/regime-forfettario-il-regime-agevolato-imprese' });
    if (dati.isee === 'basso') b.push({ nome: 'Bonus Bollette / Idrico', desc: 'Sconto automatico in bolletta per disagio economico.', valore: 'Variabile', link: 'https://www.arera.it/consumatori/bonus-sociale' });
    return b;
  };

  const OptionBtn = ({ label, field, val }) => {
    const active = dati[field] === val;
    return (
      <button className="tb-opt" onClick={() => setDati({...dati, [field]: val})} style={{ borderColor: active ? color : '#e2e8f0', background: active ? `${color}11` : '#fff' }}>{label}</button>
    );
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .tb-opt { flex:1; min-width:0; padding:12px 8px; border-radius:12px; border:2px solid; color:#0f172a; font-weight:700; font-size:14px; cursor:pointer; transition:all 0.3s ${EASE_FLUID}; font-family:inherit; text-align:center; line-height:1.2; }
        .tb-row { display:flex; gap:8px; }
        .tb-card { background:#fff; border-radius:20px; padding:32px 28px; border:1px solid rgba(0,0,0,0.04); box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); }
        @media(max-width:500px){
          .tb-opt { padding:10px 6px; font-size:12px; border-radius:10px; }
          .tb-row { gap:6px; }
          .tb-card { padding:24px 18px; }
        }
      `}} />
      {step === 1 && (
        <div className="tb-card" style={{ animation: 'fadeInUp 0.4s' }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>Scopri a quali Bonus hai diritto</h3>
          <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 28, fontSize: 14 }}>Rispondi a 4 semplici domande anonime.</p>
          
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>Età: <span style={{color}}>{dati.eta} anni</span></label>
            <input type="range" min={18} max={80} value={dati.eta} onChange={(e) => setDati({...dati, eta: +e.target.value})} style={{ width: '100%', accentColor: color }} />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10, display: 'block' }}>Hai figli a carico?</label>
            <div className="tb-row"><OptionBtn label="Sì" field="figli" val="si" /><OptionBtn label="No" field="figli" val="no" /></div>
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10, display: 'block' }}>Fascia ISEE stimata</label>
            <div className="tb-row"><OptionBtn label="Basso (<15k)" field="isee" val="basso" /><OptionBtn label="Medio (15-30k)" field="isee" val="medio" /><OptionBtn label="Alto (>30k)" field="isee" val="alto" /></div>
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10, display: 'block' }}>Situazione Lavorativa</label>
            <div className="tb-row"><OptionBtn label="Dipendente" field="lavoro" val="dipendente" /><OptionBtn label="Partita IVA" field="lavoro" val="piva" /></div>
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
                  <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#64748b' }}>{b.desc}</p>
                  {/* MODIFICA: Link ufficiale aggiunto qui */}
                  <a href={b.link} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: color, textDecoration: 'none' }}>Fonte istituzionale →</a>
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