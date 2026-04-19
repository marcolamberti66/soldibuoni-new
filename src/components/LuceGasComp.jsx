import React, { useState, useMemo } from 'react';
import { INDICI_MERCATO } from '../data.js';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const PRESETS = {
  luce: [
    { label: '1 Persona', desc: 'Uso base, no clima', val: 1500 },
    { label: 'Famiglia (3-4)', desc: 'Elettrodomestici standard', val: 2700 },
    { label: 'Casa Elettrica', desc: 'Pompa calore o induzione', val: 4500 }
  ],
  gas: [
    { label: 'Solo Cottura/Acqua', desc: 'Senza riscaldamento', val: 400 },
    { label: 'Famiglia Standard', desc: 'Riscaldamento medio', val: 1000 },
    { label: 'Casa Grande', desc: 'Inverni rigidi / scarsa classe', val: 1800 }
  ]
};

export function LuceGasComp({ color = '#f59e0b' }) {
  const [tipoEnergia, setTipoEnergia] = useState('luce');
  const [consumoStr, setConsumoStr] = useState('2700');
  
  const [offerte, setOfferte] = useState([
    { id: 1, nome: 'La mia offerta attuale', tipo: 'fisso', prezzo: '0.15', fisso: '120', sconto: '0', penali: false },
    { id: 2, nome: 'Offerta trovata online', tipo: 'variabile', prezzo: '0.02', fisso: '144', sconto: '0', penali: false }
  ]);

  const consumo = parseFloat(consumoStr) || 0;
  const indiceAttuale = tipoEnergia === 'luce' ? INDICI_MERCATO.PUN : INDICI_MERCATO.PSV;
  const unita = tipoEnergia === 'luce' ? 'kWh' : 'Smc';
  const themeColor = tipoEnergia === 'luce' ? '#d97706' : '#dc2626';

  const calcolaCosto = (off) => {
    const prezzo = parseFloat(off.prezzo) || 0;
    const fisso = parseFloat(off.fisso) || 0;
    const sconto = parseFloat(off.sconto) || 0;
    
    const costoMateria = off.tipo === 'fisso' 
      ? prezzo * consumo 
      : (indiceAttuale + prezzo) * consumo;
      
    return (costoMateria + fisso - sconto);
  };

  const risultati = useMemo(() => {
    return offerte.map(off => ({
      ...off,
      costoReale: calcolaCosto(off)
    }));
  }, [offerte, consumo, tipoEnergia]);

  const minCosto = Math.min(...risultati.map(r => r.costoReale));

  const addOfferta = () => {
    if (offerte.length < 3) {
      const newId = Math.max(0, ...offerte.map(o => o.id)) + 1;
      setOfferte([...offerte, { id: newId, nome: 'Nuova offerta', tipo: 'fisso', prezzo: '0', fisso: '100', sconto: '0', penali: false }]);
    }
  };

  const removeOfferta = (id) => {
    setOfferte(offerte.filter(o => o.id !== id));
  };

  const updateOfferta = (id, field, value) => {
    setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #cbd5e1', borderRadius: 10, fontFamily: 'inherit', color: '#0f172a', background: '#fff', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 };

  const formatEuro = (v) => `€ ${Math.max(0, v).toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* HERO SECTION TOOL */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#0f172a', marginBottom: 12, lineHeight: 1.2 }}>
          Costo Reale Annuo Stimato
        </h2>
        <p style={{ fontSize: 16, color: '#475569', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Scopri quanto ti costa <em>veramente</em> la bolletta. Inserisci i dati dei contratti per smascherare i costi nascosti e confrontare le offerte in modo matematico e oggettivo.
        </p>
      </div>

      {/* TOOL CALCOLATORE */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 48, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        {/* STEP 1: IMPOSTAZIONI BASE */}
        <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>1. Cosa vuoi confrontare?</label>
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 6, borderRadius: 14, gap: 4 }}>
                <button onClick={() => { setTipoEnergia('luce'); setConsumoStr('2700'); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer', background: tipoEnergia === 'luce' ? '#fff' : 'transparent', color: tipoEnergia === 'luce' ? '#d97706' : '#64748b', boxShadow: tipoEnergia === 'luce' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>⚡ Luce</button>
                <button onClick={() => { setTipoEnergia('gas'); setConsumoStr('1000'); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer', background: tipoEnergia === 'gas' ? '#fff' : 'transparent', color: tipoEnergia === 'gas' ? '#dc2626' : '#64748b', boxShadow: tipoEnergia === 'gas' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>🔥 Gas</button>
              </div>
            </div>

            <div style={{ flex: 2, minWidth: 300 }}>
              <label style={labelStyle}>2. Consumo Annuo Stimato ({unita})</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="number" value={consumoStr} onChange={(e) => setConsumoStr(e.target.value)} style={{ ...inputStyle, width: 120, fontSize: 18, fontWeight: 800, color: themeColor }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PRESETS[tipoEnergia].map(p => (
                    <button key={p.label} onClick={() => setConsumoStr(p.val.toString())} title={p.desc} style={{ background: consumo === p.val ? `${themeColor}15` : '#f8fafc', border: `1px solid ${consumo === p.val ? themeColor : '#e2e8f0'}`, color: consumo === p.val ? themeColor : '#475569', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: INSERIMENTO OFFERTE */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={labelStyle}>3. Inserisci i dati dei contratti</label>
          {offerte.length < 3 && (
            <button onClick={addOfferta} style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Aggiungi Offerta</button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`, gap: 20 }}>
          {risultati.map((off) => {
            const isWinner = off.costoReale === minCosto && off.costoReale > 0;
            return (
              <div key={off.id} style={{ background: isWinner ? `${themeColor}08` : '#f8fafc', border: `2px solid ${isWinner ? themeColor : '#e2e8f0'}`, borderRadius: 20, padding: 20, position: 'relative', transition: '0.3s' }}>
                {isWinner && <div style={{ position: 'absolute', top: -12, left: 20, background: themeColor, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.5px' }}>🥇 PIÙ CONVENIENTE</div>}
                {offerte.length > 1 && (
                  <button onClick={() => removeOfferta(off.id)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 16 }}>×</button>
                )}
                
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ ...inputStyle, fontWeight: 800, fontSize: 16, border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '1px solid #e2e8f0', borderRadius: 0, marginBottom: 16 }} placeholder="Nome Offerta" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', background: '#fff', padding: 4, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <button onClick={() => updateOfferta(off.id, 'tipo', 'fisso')} style={{ flex: 1, padding: '6px', border: 'none', background: off.tipo === 'fisso' ? themeColor : 'transparent', color: off.tipo === 'fisso' ? '#fff' : '#64748b', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}>Fisso</button>
                    <button onClick={() => updateOfferta(off.id, 'tipo', 'variabile')} style={{ flex: 1, padding: '6px', border: 'none', background: off.tipo === 'variabile' ? themeColor : 'transparent', color: off.tipo === 'variabile' ? '#fff' : '#64748b', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}>Variabile</button>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{off.tipo === 'fisso' ? 'Prezzo bloccato' : 'Spread (sovrapprezzo)'}</label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" step="0.001" value={off.prezzo} onChange={(e) => updateOfferta(off.id, 'prezzo', e.target.value)} style={{ ...inputStyle, paddingRight: 50 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 12 }}>€/{unita}</span>
                    </div>
                    {off.tipo === 'variabile' && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>+ {tipoEnergia.toUpperCase()} attuale ({indiceAttuale} €)</div>}
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Costi Fissi Commerciali (PCV/QVD)</label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={off.fisso} onChange={(e) => updateOfferta(off.id, 'fisso', e.target.value)} style={{ ...inputStyle, paddingRight: 60 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 12 }}>€/anno</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Sconti di Benvenuto (Una tantum)</label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={off.sconto} onChange={(e) => updateOfferta(off.id, 'sconto', e.target.value)} style={{ ...inputStyle, paddingLeft: 24, color: '#166534' }} />
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#166534', fontWeight: 700 }}>- €</span>
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', cursor: 'pointer', marginTop: 4 }}>
                    <input type="checkbox" checked={off.penali} onChange={(e) => updateOfferta(off.id, 'penali', e.target.checked)} style={{ accentColor: '#dc2626' }} />
                    Il contratto prevede penali di recesso?
                  </label>
                </div>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Costo Netto Fornitore</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: isWinner ? themeColor : '#0f172a', lineHeight: 1.1, margin: '4px 0' }}>
                    {formatEuro(off.costoReale)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Escluse tasse e oneri di trasporto</div>
                </div>

                {off.penali && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 8, marginTop: 16, fontSize: 11, color: '#991b1b', textAlign: 'center', fontWeight: 600 }}>
                    ⚠️ Attenzione: Questa offerta prevede penali (es. 50-100€) se disdici prima della scadenza del vincolo.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* INFO VIA SEMPLICE */}
        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginTop: 24, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
          <strong>💡 Perché usiamo il "Costo Netto Fornitore"?</strong> Le imposte statali e i costi per il trasporto dell'energia sono fissati dall'Autorità (ARERA) e sono <strong>identici per tutti i fornitori</strong>. Il vero e unico modo per scoprire chi costa meno è confrontare esclusivamente i costi decisi dall'azienda (Materia prima + Costi fissi commerciali).
        </div>
      </div>


      {/* ================================================================= */}
      {/* BOX AFFILIATO PREMIUM (STILE HYPE/BBVA)                           */}
      {/* ================================================================= */}
      
      <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 24, padding: '32px 40px', position: 'relative', boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.15)', textAlign: 'center' }}>
        
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '6px 16px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#fbbf24' }}>★</span> La Selezione del Team
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8, fontFamily: "'DM Serif Display', serif" }}>
            Eni Plenitude — Fixa Time Smart
          </h3>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Un'offerta a prezzo bloccato trasparente, con sconti reali sui costi fissi e zero penali di recesso. 
          </p>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto 32px', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: 15, color: '#334155', lineHeight: 1.6, textAlign: 'left' }}>
          <li style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}><span style={{ flexShrink: 0 }}>✅</span><span><strong>Prezzo bloccato 12 mesi</strong> per proteggerti dai rincari invernali.</span></li>
          <li style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}><span style={{ flexShrink: 0 }}>✅</span><span><strong>Sconto di 108€</strong> (-54€ Luce, -54€ Gas) sui costi di commercializzazione se attivi entrambe.</span></li>
          <li style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}><span style={{ flexShrink: 0 }}>✅</span><span>Nessuna penale se decidi di cambiare fornitore prima della scadenza.</span></li>
        </ul>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, marginBottom: 32, background: '#f8fafc', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Luce Fissa</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>0,188 <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>€/kWh</span></span>
          </div>
          <div style={{ width: 1, height: 40, background: '#cbd5e1' }} className="hide-mobile"></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gas Fisso</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>0,705 <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>€/Smc</span></span>
          </div>
        </div>

        <div>
          {/* Sostituisci questo link con la tua pagina di recensione interna appena la crei, es: href="/recensioni/eni-plenitude" */}
          <a href="https://www.awin1.com/cread.php?awinmid=9529&awinaffid=2811530" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '16px 36px', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 8px 20px -6px rgba(15, 23, 42, 0.4)' }}>
            Vai all'offerta ufficiale →
          </a>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16, marginBottom: 0 }}>
            <em>Trasparenza: Questo è un link affiliato. Se attivi l'offerta, i fornitori ci riconoscono una commissione senza alcun costo aggiuntivo per te. Questo ci permette di mantenere gratuiti i calcolatori.</em>
          </p>
        </div>
        
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 650px) {
          .hide-mobile { display: none; }
        }
      `}}/>
    </div>
  );
}