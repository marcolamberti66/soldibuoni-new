import React, { useState } from 'react';

export function QuantoSpendo({ color = '#059669' }) {
  const [step, setStep] = useState(1);
  
  // Dati
  const [membri, setMembri] = useState(3);
  const [mq, setMq] = useState(90);
  const [luce, setLuce] = useState(2700);
  const [gas, setGas] = useState(1000);
  const [auto, setAuto] = useState(15000);

  // Costi base attuali (stimati alti come media italiana chi non cambia mai)
  const costoLuceKw = 0.28;
  const costoGasSmc = 1.15;
  const costoRcaBase = 550;
  
  // Costi target (offerte affiliate ottimali)
  const targetLuceKw = 0.12;
  const targetGasSmc = 0.45;
  const targetRcaBase = 350;

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const calculate = () => {
    const spesaLuce = luce * costoLuceKw;
    const spesaGas = gas * costoGasSmc;
    const spesaAuto = costoRcaBase + (auto * 0.12); // rca + benzina stimata
    
    const optLuce = luce * targetLuceKw;
    const optGas = gas * targetGasSmc;
    const optAuto = targetRcaBase + (auto * 0.12);

    const attuale = spesaLuce + spesaGas + spesaAuto;
    const ottimizzata = optLuce + optGas + optAuto;
    const risparmio = attuale - ottimizzata;

    return { attuale, ottimizzata, risparmio, dLuce: spesaLuce - optLuce, dGas: spesaGas - optGas, dAuto: spesaAuto - optAuto };
  };

  const res = step === 4 ? calculate() : null;

  return (
    <div className="wizard-wrapper" style={{ '--primary': color }}>
      <style dangerouslySetInnerHTML={{__html:`
        .wizard-wrapper { max-width: 700px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .wizard-glass { background: rgba(255,255,255,0.85); backdrop-filter: blur(24px); border-radius: 32px; padding: 48px; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08); min-height: 480px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; }
        
        .step-anim { animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        
        .wiz-title { font-family: 'Playfair Display',serif; font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 12px; line-height: 1.1; letter-spacing: -0.5px; }
        .wiz-sub { font-size: 16px; color: #64748b; margin-bottom: 40px; }
        
        .big-slider { -webkit-appearance: none; width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; outline: none; margin: 24px 0; }
        .big-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 32px; height: 32px; border-radius: 50%; background: var(--primary); cursor: pointer; box-shadow: 0 4px 12px rgba(5,150,105,0.3); border: 4px solid #fff; transition: transform 0.2s; }
        .big-slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
        .slider-val { font-size: 40px; font-weight: 800; color: var(--primary); text-align: center; font-variant-numeric: tabular-nums; }
        
        .btn-next { background: #0f172a; color: #fff; border: none; padding: 16px 32px; border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; width: 100%; margin-top: auto; }
        .btn-next:hover { background: var(--primary); transform: translateY(-2px); box-shadow: 0 10px 20px -5px var(--primary); }
        .btn-back { background: transparent; border: none; color: #94a3b8; font-size: 14px; font-weight: 600; cursor: pointer; position: absolute; top: 32px; left: 32px; }
        .btn-back:hover { color: #0f172a; }

        .progress-bar { position: absolute; top: 0; left: 0; height: 6px; background: var(--primary); transition: width 0.4s ease; }
        
        .res-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 32px; }
        .res-box { background: #f8fafc; border-radius: 20px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
        .res-box-highlight { background: rgba(16, 185, 129, 0.05); border: 2px solid var(--primary); }
        
        .btn-whatsapp { background: #25D366; color: #fff; padding: 14px 24px; border-radius: 16px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.2s; box-shadow: 0 8px 20px -6px rgba(37,211,102,0.5); }
        .btn-whatsapp:hover { transform: translateY(-2px); }
      `}}/>

      <div className="wizard-glass">
        {step < 4 && <div className="progress-bar" style={{ width: `${(step/4)*100}%` }}></div>}
        {step > 1 && step < 4 && <button className="btn-back" onClick={prevStep}>← Indietro</button>}

        {step === 1 && (
          <div className="step-anim">
            <h2 className="wiz-title">Com'è composta<br/>la tua famiglia?</h2>
            <p className="wiz-sub">Per calcolare i consumi medi corretti.</p>
            <div className="slider-val">{membri} Persone</div>
            <input type="range" min={1} max={6} value={membri} onChange={e => setMembri(+e.target.value)} className="big-slider" />
            <button className="btn-next" onClick={nextStep} style={{marginTop: 40}}>Continua →</button>
          </div>
        )}

        {step === 2 && (
          <div className="step-anim">
            <h2 className="wiz-title">Consumi di casa</h2>
            <p className="wiz-sub">Regola i valori se li conosci, o lascia la media calcolata.</p>
            
            <div style={{marginBottom: 32}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                <span style={{fontWeight: 700, color:'#0f172a'}}>Luce Annua</span>
                <span className="slider-val" style={{fontSize: 24}}>{luce} <span style={{fontSize:14, color:'#64748b'}}>kWh</span></span>
              </div>
              <input type="range" min={1000} max={6000} step={100} value={luce} onChange={e => setLuce(+e.target.value)} className="big-slider" />
            </div>

            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                <span style={{fontWeight: 700, color:'#0f172a'}}>Gas Annuo</span>
                <span className="slider-val" style={{fontSize: 24}}>{gas} <span style={{fontSize:14, color:'#64748b'}}>Smc</span></span>
              </div>
              <input type="range" min={200} max={2500} step={50} value={gas} onChange={e => setGas(+e.target.value)} className="big-slider" />
            </div>

            <button className="btn-next" onClick={nextStep} style={{marginTop: 40}}>Continua →</button>
          </div>
        )}

        {step === 3 && (
          <div className="step-anim">
            <h2 className="wiz-title">Veicoli e Mobilità</h2>
            <p className="wiz-sub">Quanti chilometri percorre l'auto principale?</p>
            
            <div className="slider-val">{auto.toLocaleString()} <span style={{fontSize:16, color:'#64748b'}}>km/anno</span></div>
            <input type="range" min={5000} max={40000} step={1000} value={auto} onChange={e => setAuto(+e.target.value)} className="big-slider" />
            
            <button className="btn-next" onClick={nextStep} style={{marginTop: 40}}>Calcola Risparmio ⚡</button>
          </div>
        )}

        {step === 4 && res && (
          <div className="step-anim" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}>🎉</div>
            <h2 className="wiz-title" style={{ fontSize: 28, marginBottom: 8 }}>Hai un tesoretto nascosto.</h2>
            <p className="wiz-sub" style={{ marginBottom: 32 }}>Ecco quanto stai regalando ai tuoi fornitori attuali.</p>

            <div className="res-box res-box-highlight" style={{ marginBottom: 24, padding: 32 }}>
              <div style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 800, color: color, letterSpacing: 1 }}>Spreco Recuperabile</div>
              <div style={{ fontSize: 56, fontWeight: 800, color: '#0f172a', margin: '8px 0', letterSpacing: -2 }}>
                €{Math.round(res.risparmio).toLocaleString()}
              </div>
              <div style={{ fontSize: 14, color: '#047857', fontWeight: 600 }}>Ogni singolo anno. Netto.</div>
            </div>

            <div className="res-grid">
              <div className="res-box">
                <div style={{ fontSize: 20 }}>⚡</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, margin: '8px 0 4px' }}>LUCE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>-€{Math.round(res.dLuce)}</div>
              </div>
              <div className="res-box">
                <div style={{ fontSize: 20 }}>🔥</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, margin: '8px 0 4px' }}>GAS</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>-€{Math.round(res.dGas)}</div>
              </div>
              <div className="res-box">
                <div style={{ fontSize: 20 }}>🚗</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, margin: '8px 0 4px' }}>RC AUTO</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>-€{Math.round(res.dAuto)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#risparmia" className="btn-next" style={{ width: 'auto', flex: 1, padding: '16px 24px', background: color }}>
                Taglia le Spese Ora →
              </a>
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`🧮 Ho appena scoperto che posso risparmiare €${Math.round(res.risparmio).toLocaleString()} all'anno sulle bollette!\n\nCalcola anche tu il tuo spreco qui 👉 https://soldibuoni.it/quanto-spendo`)}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-whatsapp"
              >
                Condividi su WhatsApp
              </a>
            </div>
            
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#94a3b8', padding: 16, marginTop: 16, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              Rifai il calcolo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
