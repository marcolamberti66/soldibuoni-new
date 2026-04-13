import React, { useState, useEffect } from 'react';

const STEPS = ['Bollette', 'Auto & Servizi', 'Casa & Famiglia', 'Risultati'];
const EASE_FLUID = 'cubic-bezier(0.16, 1, 0.3, 1)';

// ── COMPONENTI UI PREMIUM ──

function Box({ title, children }) {
  return (
    <div className="glass-box step-anim">
      {title && <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 24, letterSpacing: '-0.3px' }}>{title}</h3>}
      {children}
    </div>
  );
}

// FIX FLUIDITÀ: Il componente Slider ora gestisce uno stato visivo fluido e uno logico a scatti
function Sl({ label, value, onChange, min, max, step, prefix, suffix, color }) {
  const [dragVal, setDragVal] = useState(value);

  // Sincronizza il pallino se il valore viene resettato alla fine del percorso
  useEffect(() => {
    setDragVal(value);
  }, [value]);

  // Calcola il valore da mostrare a schermo rispettando il "salto" (step) richiesto
  const displayVal = step ? Math.round(dragVal / step) * step : dragVal;
  const display = (prefix || '') + displayVal.toLocaleString() + (suffix || '');

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>{label}</span>
        <span style={{ fontSize: 24, fontWeight: 800, color: color || 'var(--primary)' }}>{display}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step="1" // TRUCCO: Forziamo il browser a far scorrere il pallino sempre fluido (1 a 1)
        value={dragVal}
        onChange={(e) => {
          const raw = +e.target.value;
          setDragVal(raw); // Aggiorniamo la posizione del pallino in tempo reale in modo fluido
          const snapped = step ? Math.round(raw / step) * step : raw;
          onChange(snapped); // Passiamo al sistema di calcolo generale il valore "a scatti"
        }}
        className="big-slider" 
        style={{ '--slider-color': color || 'var(--primary)' }} 
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
        <span>{(prefix || '') + min}</span><span>{(prefix || '') + max + (suffix || '')}</span>
      </div>
    </div>
  );
}

function Pill({ options, value, onChange, color }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} className={`pill-btn ${value === o.id ? 'active' : ''}`} style={{ '--active-bg': color || 'var(--primary)' }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Tog({ label, icon, checked, onChange, color }) {
  return (
    <button onClick={() => onChange(!checked)} className={`tog-btn ${checked ? 'active' : ''}`} style={{ '--active-bg': color || 'var(--primary)' }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      <div className={`tog-checkbox ${checked ? 'checked' : ''}`}>
        {checked ? '✓' : ''}
      </div>
    </button>
  );
}

function SavRow({ icon, label, annuo, risparmio, color, link, linkText }) {
  const pct = risparmio > 0 ? Math.min(100, (risparmio / annuo) * 100) : 0;
  return (
    <div className="sav-row">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24, background: `${color}1A`, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>{icon}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{label}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Spesa Annua</span>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>€{Math.round(annuo).toLocaleString()}</div>
        </div>
      </div>
      
      {risparmio > 10 ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: color, background: `${color}1A`, padding: '4px 12px', borderRadius: 100 }}>
              💡 Risparmio: €{Math.round(risparmio)}/anno
            </span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: '100%', borderRadius: 6, background: color, width: pct + '%', transition: 'width 0.8s ease-out' }} />
          </div>
          {link && (
            <a href={link} className="btn-sav-link" style={{ '--btn-bg': color }}>
              {linkText || 'Confronta offerte →'}
            </a>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>✓ Spesa ottimizzata nella media</div>
      )}
    </div>
  );
}

// ── LOGICA PRINCIPALE (Astro usa l'export non di default) ──

export function QuantoSpendo({ color = '#059669' }) {
  const [step, setStep] = useState(0);

  // Stato Globale
  const [d, setD] = useState({
    luce: 70, gas: 80, riscaldamento: true, internet: 28,
    haAuto: true, rcAuto: 380, carburanteMese: 150,
    contoCosto: 60, haPolizza: false, polizza: 40,
    tipoCasa: 'mutuo', rataCasa: 650,
    haUni: false, retta: 2500,
  });

  const isLast = step === STEPS.length - 1;

  // ═══ STEP 1: BOLLETTE ═══
  const S1 = () => (
    <div>
      <Box title="⚡ Bolletta Luce (media mensile)">
        <Sl label="Quanto paghi al mese?" value={d.luce} onChange={(v) => setD({ ...d, luce: v })} min={20} max={200} step={5} prefix="€" color="#F59E0B" />
      </Box>
      <Box title="🔥 Bolletta Gas (media mensile)">
        <Sl label="Quanto paghi al mese?" value={d.gas} onChange={(v) => setD({ ...d, gas: v })} min={10} max={250} step={5} prefix="€" color="#EF4444" />
        <Tog label="Ho riscaldamento autonomo a gas" icon="🏠" checked={d.riscaldamento} onChange={(v) => setD({ ...d, riscaldamento: v })} color="#EF4444" />
      </Box>
      <Box title="📡 Internet Casa (mensile)">
        <Sl label="Quanto paghi al mese?" value={d.internet} onChange={(v) => setD({ ...d, internet: v })} min={15} max={50} step={1} prefix="€" color="#8B5CF6" />
      </Box>
    </div>
  );

  // ═══ STEP 2: AUTO E SERVIZI ═══
  const S2 = () => (
    <div>
      <Box title="🚗 Auto & Mobilità">
        <Tog label="Possiedo un'auto" icon="🚘" checked={d.haAuto} onChange={(v) => setD({ ...d, haAuto: v })} color="#EC4899" />
        {d.haAuto && (
          <div style={{ marginTop: 24, animation: 'slideIn 0.3s ease-out' }}>
            <Sl label="RC Auto (premio annuale)" value={d.rcAuto} onChange={(v) => setD({ ...d, rcAuto: v })} min={150} max={800} step={10} prefix="€" color="#EC4899" />
            <Sl label="Carburante al mese" value={d.carburanteMese} onChange={(v) => setD({ ...d, carburanteMese: v })} min={30} max={400} step={10} prefix="€" color="#06b6d4" />
          </div>
        )}
      </Box>
      <Box title="💳 Conto Corrente">
        <Sl label="Costo annuo (canone + carte + bolli)" value={d.contoCosto} onChange={(v) => setD({ ...d, contoCosto: v })} min={0} max={200} step={5} prefix="€" color="#10B981" />
      </Box>
      <Box title="🏥 Polizza Sanitaria">
        <Tog label="Ho una polizza sanitaria" icon="⚕️" checked={d.haPolizza} onChange={(v) => setD({ ...d, haPolizza: v })} color="#f97316" />
        {d.haPolizza && (
          <div style={{ marginTop: 24, animation: 'slideIn 0.3s ease-out' }}>
            <Sl label="Quanto paghi al mese?" value={d.polizza} onChange={(v) => setD({ ...d, polizza: v })} min={15} max={150} step={5} prefix="€" color="#f97316" />
          </div>
        )}
      </Box>
    </div>
  );

  // ═══ STEP 3: CASA E FAMIGLIA ═══
  const S3 = () => (
    <div>
      <Box title="🏠 Mutuo o Affitto">
        <Pill options={[{ id: 'nessuno', label: 'Nessuno' }, { id: 'mutuo', label: 'Mutuo' }, { id: 'affitto', label: 'Affitto' }]} value={d.tipoCasa} onChange={(v) => setD({ ...d, tipoCasa: v })} color="#3b82f6" />
        {(d.tipoCasa === 'mutuo' || d.tipoCasa === 'affitto') && (
          <div style={{ marginTop: 24, animation: 'slideIn 0.3s ease-out' }}>
            <Sl label={d.tipoCasa === 'mutuo' ? 'Rata mutuo mensile' : 'Affitto mensile'} value={d.rataCasa} onChange={(v) => setD({ ...d, rataCasa: v })} min={200} max={2000} step={50} prefix="€" color="#3b82f6" />
          </div>
        )}
      </Box>
      <Box title="🎓 Università">
        <Tog label="Ho figli all'università" icon="📚" checked={d.haUni} onChange={(v) => setD({ ...d, haUni: v })} color="#6366F1" />
        {d.haUni && (
          <div style={{ marginTop: 24, animation: 'slideIn 0.3s ease-out' }}>
            <Sl label="Retta universitaria annuale" value={d.retta} onChange={(v) => setD({ ...d, retta: v })} min={500} max={15000} step={250} prefix="€" color="#6366F1" />
          </div>
        )}
      </Box>
    </div>
  );

  // ═══ STEP 4: RISULTATI ═══
  const S4 = () => {
    const luceA = d.luce * 12;
    const gasA = d.gas * 12;
    const internetA = d.internet * 12;
    const rcA = d.haAuto ? d.rcAuto : 0;
    const carbA = d.haAuto ? d.carburanteMese * 12 : 0;
    const contoA = d.contoCosto;
    const polizzaA = d.haPolizza ? d.polizza * 12 : 0;
    const casaA = d.tipoCasa !== 'nessuno' ? d.rataCasa * 12 : 0;
    const uniA = d.haUni ? d.retta : 0;
    const totale = luceA + gasA + internetA + rcA + carbA + contoA + polizzaA + casaA + uniA;

    // Stime risparmio realistiche
    const risLuce = Math.max(0, luceA - 50 * 12);
    const risGas = d.riscaldamento ? Math.max(0, gasA - 60 * 12) : Math.max(0, gasA - 20 * 12);
    const risInternet = Math.max(0, internetA - 18 * 12);
    const risRc = d.haAuto ? Math.max(0, rcA - 280) : 0;
    const risCarb = d.haAuto ? Math.round(carbA * 0.12) : 0;
    const risConto = Math.max(0, contoA);
    const risMutuo = d.tipoCasa === 'mutuo' && d.rataCasa > 500 ? Math.round(casaA * 0.08) : 0;
    const risPolizza = d.haPolizza ? Math.max(0, polizzaA - 300) : 0;
    const rispTotale = risLuce + risGas + risInternet + risRc + risCarb + risConto + risMutuo + risPolizza;

    const waText = `🧮 La mia famiglia spende €${Math.round(totale).toLocaleString()}/anno in spese fisse!\n💡 Potrei risparmiare fino a €${Math.round(rispTotale).toLocaleString()}/anno.\n\nCalcola il tuo spreco su 👉 https://soldibuoni.it/quanto-spendo`;
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(waText);

    return (
      <div className="step-anim">
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 24, padding: '40px 32px', color: '#fff', marginBottom: 32, position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
          
          <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Spesa Fissa Annuale</p>
          <div style={{ fontSize: 56, fontWeight: 800, marginBottom: 8, fontFamily: "'Playfair Display',serif", letterSpacing: '-1px' }}>
            €{Math.round(totale).toLocaleString()}
          </div>
          
          {rispTotale > 20 && (
            <div style={{ marginTop: 24, background: 'rgba(16,185,129,0.15)', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(16,185,129,0.3)', backdropFilter: 'blur(12px)' }}>
              <p style={{ fontSize: 14, color: '#6ee7b7', fontWeight: 700, marginBottom: 4 }}>Spreco Recuperabile Stimato</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: '#34d399', fontFamily: "'Playfair Display',serif", letterSpacing: '-0.5px' }}>
                −€{Math.round(rispTotale).toLocaleString()}<span style={{ fontSize: 16, fontWeight: 600 }}>/anno</span>
              </p>
            </div>
          )}
        </div>

        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 20, fontFamily: "'Playfair Display',serif" }}>Il tuo Piano d'Azione</h3>

        <SavRow icon="⚡" label="Energia Elettrica" annuo={luceA} risparmio={risLuce} color="#F59E0B" link="/luce-gas" linkText="Migliori offerte Luce →" />
        <SavRow icon="🔥" label="Gas Naturale" annuo={gasA} risparmio={risGas} color="#EF4444" link="/luce-gas" linkText="Migliori offerte Gas →" />
        <SavRow icon="📡" label="Internet" annuo={internetA} risparmio={risInternet} color="#8B5CF6" link="/internet" linkText="Trova Fibra più veloce →" />
        {d.haAuto && <SavRow icon="🚗" label="RC Auto" annuo={rcA} risparmio={risRc} color="#EC4899" link="/rc_auto" linkText="Calcola RC Auto →" />}
        {d.haAuto && <SavRow icon="⛽" label="Carburante" annuo={carbA} risparmio={risCarb} color="#06b6d4" link="/carburante" linkText="Confronta Auto Elettrica →" />}
        <SavRow icon="💳" label="Conti Correnti" annuo={contoA} risparmio={risConto} color="#10B981" link="/conti-correnti" linkText="Apri conto a zero spese →" />
        {d.haPolizza && <SavRow icon="🏥" label="Polizza Sanitaria" annuo={polizzaA} risparmio={risPolizza} color="#f97316" link="/salute" linkText="Confronta Polizze →" />}
        {d.tipoCasa === 'mutuo' && risMutuo > 50 && <SavRow icon="🏠" label="Mutuo (Surroga)" annuo={casaA} risparmio={risMutuo} color="#3b82f6" link="/mutuo" linkText="Simula Surroga →" />}

        <div style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', border: '1px solid rgba(0,0,0,0.04)', marginTop: 32, textAlign: 'center', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
          <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Sfida amici e parenti</h4>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Invia il tuo risultato e scopri chi spende meno.</p>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-nav-primary" style={{ '--primary': '#25D366', width: '100%' }}>
            Invia su WhatsApp 💬
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="wizard-wrapper" style={{ '--primary': color }}>
      <style dangerouslySetInnerHTML={{__html:`
        .wizard-wrapper { max-width: 680px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .glass-box { background: rgba(255,255,255,0.7); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-radius: 24px; padding: 32px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); margin-bottom: 24px; }
        
        .big-slider { -webkit-appearance: none; width: 100%; height: 10px; background: #e2e8f0; border-radius: 5px; outline: none; margin: 12px 0; }
        .big-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; border-radius: 50%; background: var(--slider-color); cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 4px solid #fff; transition: transform 0.2s; }
        .big-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        
        .pill-btn { padding: 12px 20px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s ${EASE_FLUID}; flex: 1; text-align: center; background: #fff; color: #64748b; }
        .pill-btn.active { background: var(--active-bg); color: #fff; border-color: transparent; box-shadow: 0 8px 20px -6px var(--active-bg); }
        
        .tog-btn { display: flex; align-items: center; gap: 16px; width: 100%; padding: 16px 20px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); background: #fff; cursor: pointer; transition: all 0.3s ${EASE_FLUID}; font-size: 16px; font-weight: 700; color: #475569; margin-bottom: 12px; }
        .tog-btn.active { background: rgba(var(--active-bg-rgb), 0.05); border-color: var(--active-bg); color: #0f172a; }
        .tog-checkbox { width: 24px; height: 24px; border-radius: 8px; border: 2px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #fff; transition: all 0.2s; }
        .tog-checkbox.checked { background: var(--active-bg); border-color: var(--active-bg); }
        
        .btn-nav-primary { background: var(--primary); color: #fff; padding: 16px 32px; border-radius: 16px; font-size: 16px; font-weight: 800; cursor: pointer; border: none; transition: all 0.3s ${EASE_FLUID}; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px -6px var(--primary); text-decoration: none; }
        .btn-nav-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px var(--primary); filter: brightness(1.05); }
        .btn-nav-secondary { background: #fff; color: #64748b; padding: 16px 24px; border-radius: 16px; font-size: 15px; font-weight: 700; cursor: pointer; border: 1px solid rgba(0,0,0,0.06); transition: all 0.3s ${EASE_FLUID}; }
        .btn-nav-secondary:hover { background: #f8fafc; color: #0f172a; }

        .sav-row { background: #fff; border-radius: 24px; padding: 24px; border: 1px solid rgba(0,0,0,0.04); margin-bottom: 16px; transition: all 0.4s ${EASE_FLUID}; }
        .sav-row:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08); border-color: rgba(0,0,0,0.08); }
        .btn-sav-link { display: block; text-align: center; font-size: 14px; font-weight: 800; color: #fff; background: var(--btn-bg); padding: 12px 20px; border-radius: 12px; text-decoration: none; transition: all 0.3s; box-shadow: 0 4px 12px -4px var(--btn-bg); }
        .btn-sav-link:hover { transform: scale(1.02); filter: brightness(1.05); }

        .step-anim { animation: slideIn 0.4s ${EASE_FLUID} both; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
      `}}/>

      {/* HEADER PROGRESSO */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: 1 }}>Step {step + 1} di {STEPS.length}</span>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{STEPS[step]}</span>
        </div>
        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: color, width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width 0.5s ease-out' }} />
        </div>
      </div>

      {step === 0 && <S1 />}
      {step === 1 && <S2 />}
      {step === 2 && <S3 />}
      {step === 3 && <S4 />}

      {/* BOTTONIERA DI NAVIGAZIONE */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        {step > 0 && !isLast && (
          <button className="btn-nav-secondary" onClick={() => setStep(step - 1)}>← Indietro</button>
        )}
        {!isLast && (
          <button className="btn-nav-primary" style={{ flex: 1 }} onClick={() => setStep(step + 1)}>
            {step === STEPS.length - 2 ? 'Calcola il Risparmio ⚡' : 'Continua →'}
          </button>
        )}
        {isLast && (
          <button className="btn-nav-secondary" style={{ flex: 1 }} onClick={() => setStep(0)}>
            ↺ Ricalcola
          </button>
        )}
      </div>

    </div>
  );
}