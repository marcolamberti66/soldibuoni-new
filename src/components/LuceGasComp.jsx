import React, { useState, useMemo } from 'react';
import { INDICI_MERCATO } from '../data.js';

const PRESETS = {
  luce: [{ label: '1 Persona', val: 1500 }, { label: '2 Persone', val: 2700 }, { label: '4 Persone', val: 4000 }],
  gas: [{ label: '1 Persona', val: 400 }, { label: '2 Persone', val: 1000 }, { label: '4 Persone', val: 1400 }]
};

const DEFAULT_OFFERS = {
  luce: [
    { id: 1, nome: 'La mia offerta attuale', tipo: 'fisso', prezzo: '0.14', fisso: '144', sconto: '0', penali: false },
    { id: 2, nome: 'Offerta trovata online', tipo: 'variabile', prezzo: '0.02', fisso: '120', sconto: '0', penali: false }
  ],
  gas: [
    { id: 1, nome: 'La mia offerta attuale', tipo: 'fisso', prezzo: '0.45', fisso: '144', sconto: '0', penali: false },
    { id: 2, nome: 'Offerta trovata online', tipo: 'variabile', prezzo: '0.05', fisso: '120', sconto: '0', penali: false }
  ]
};

export function LuceGasComp() {
  const [tipoEnergia, setTipoEnergia] = useState('luce');
  const [consumoStr, setConsumoStr] = useState('2700');
  const [offerte, setOfferte] = useState(DEFAULT_OFFERS.luce);

  const handleTipoCambio = (tipo) => {
    setTipoEnergia(tipo);
    setConsumoStr(tipo === 'luce' ? '2700' : '1000');
    setOfferte(DEFAULT_OFFERS[tipo]);
  };

  const consumo = parseFloat(consumoStr) || 0;
  const indiceAttuale = tipoEnergia === 'luce' ? INDICI_MERCATO.PUN : INDICI_MERCATO.PSV;
  const unita = tipoEnergia === 'luce' ? 'kWh' : 'Smc';
  const themeColor = tipoEnergia === 'luce' ? '#d97706' : '#dc2626';
  const grossUp = tipoEnergia === 'luce' ? 1.55 : 1.45;

  const risultati = useMemo(() => offerte.map(off => {
    const p = parseFloat(off.prezzo) || 0;
    const f = parseFloat(off.fisso) || 0;
    const s = parseFloat(off.sconto) || 0;
    const netto = ((off.tipo === 'fisso' ? p : indiceAttuale + p) * consumo + f) - s;
    return { ...off, calcoli: { totale: netto * grossUp, nettoFornitore: netto } };
  }), [offerte, consumo, tipoEnergia]);

  const minTotale = Math.min(...risultati.map(r => r.calcoli.totale));
  const updateOfferta = (id, field, value) => setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));

  const eniCRAS = ((( (tipoEnergia === 'luce' ? 0.1881 : 0.7050) * consumo) + 90) - 54) * grossUp;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      {/* TOOL CALCOLATORE */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 48, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>1. Materia</label>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 6, borderRadius: 14, gap: 4 }}>
              <button onClick={() => handleTipoCambio('luce')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', background: tipoEnergia === 'luce' ? '#fff' : 'transparent', color: tipoEnergia === 'luce' ? '#d97706' : '#64748b', boxShadow: tipoEnergia === 'luce' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>⚡ Luce</button>
              <button onClick={() => handleTipoCambio('gas')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', background: tipoEnergia === 'gas' ? '#fff' : 'transparent', color: tipoEnergia === 'gas' ? '#dc2626' : '#64748b', boxShadow: tipoEnergia === 'gas' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>🔥 Gas</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>2. Consumo ({unita})</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="number" value={consumoStr} onChange={(e) => setConsumoStr(e.target.value)} style={{ width: 110, padding: '12px 14px', fontSize: 18, border: '1px solid #cbd5e1', borderRadius: 12, fontWeight: 600, color: themeColor }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {PRESETS[tipoEnergia].map(p => (
                  <button key={p.label} onClick={() => setConsumoStr(p.val.toString())} style={{ background: consumo === p.val ? `${themeColor}15` : '#f8fafc', border: `1px solid ${consumo === p.val ? themeColor : '#e2e8f0'}`, color: consumo === p.val ? themeColor : '#475569', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 24 }}>
          {risultati.map((off) => {
            const isWinner = off.calcoli.totale === minTotale && off.calcoli.totale > 0;
            return (
              <div key={off.id} style={{ background: isWinner ? `${themeColor}08` : '#fff', border: `2px solid ${isWinner ? themeColor : '#cbd5e1'}`, borderRadius: 24, padding: 28, position: 'relative' }}>
                {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: themeColor, color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>🥇 PIÙ CONVENIENTE</div>}
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ fontWeight: 900, fontSize: 18, border: 'none', background: 'transparent', width: '100%', paddingBottom: 12, borderBottom: '2px solid #e2e8f0', marginBottom: 20, color: '#0f172a' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', background: '#f8fafc', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <button onClick={() => updateOfferta(off.id, 'tipo', 'fisso')} style={{ flex: 1, padding: '8px', border: 'none', background: off.tipo === 'fisso' ? themeColor : 'transparent', color: off.tipo === 'fisso' ? '#fff' : '#64748b', fontSize: 13, fontWeight: 800, borderRadius: 8, cursor: 'pointer' }}>Fisso</button>
                    <button onClick={() => updateOfferta(off.id, 'tipo', 'variabile')} style={{ flex: 1, padding: '8px', border: 'none', background: off.tipo === 'variabile' ? themeColor : 'transparent', color: off.tipo === 'variabile' ? '#fff' : '#64748b', fontSize: 13, fontWeight: 800, borderRadius: 8, cursor: 'pointer' }}>Variabile</button>
                  </div>
                  <div><label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>Prezzo/Spread (€/{unita})</label><input type="number" step="0.001" value={off.prezzo} onChange={(e) => updateOfferta(off.id, 'prezzo', e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1' }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>Costi Fissi (€/Anno)</label><input type="number" value={off.fisso} onChange={(e) => updateOfferta(off.id, 'fisso', e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1' }} /></div>
                </div>
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Costo Totale (CRAS)</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: isWinner ? themeColor : '#0f172a', margin: '4px 0' }}>€ {Math.round(off.calcoli.totale).toLocaleString('it-IT')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOX SELEZIONE DEL TEAM */}
      <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 24, padding: '36px 40px', position: 'relative', boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.15)', textAlign: 'center', maxWidth: 740, margin: '0 auto' }}>
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '6px 18px', borderRadius: 30, whiteSpace: 'nowrap' }}>★ La Selezione del Team</div>
        <h3 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>Eni Plenitude — Fixa Time Smart</h3>
        <p style={{ fontSize: 16, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>Prezzo bloccato 12 mesi, zero penali e sconti dual fuel. Un'offerta trasparente e solida.</p>
        
        {/* CONFRONTO DINAMICO */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, background: '#f8fafc', padding: '20px 32px', borderRadius: 16, marginBottom: 24, flexWrap: 'wrap', border: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>TUO CONSUMO</span><div style={{ fontSize: 20, fontWeight: 900, color: themeColor }}>{consumoStr} {unita}</div></div>
          <div style={{ width: 1, background: '#cbd5e1' }}></div>
          <div style={{ textAlign: 'center' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>CRAS PLENITUDE</span><div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>€ {Math.round(eniCRAS).toLocaleString('it-IT')} /anno</div></div>
        </div>

        <a href="https://www.awin1.com/cread.php?awinmid=9529&awinaffid=2811530" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 16, textDecoration: 'none', marginBottom: 12 }}>Scopri l'offerta Eni →</a>
        <br/><a href="/recensione-eni" style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, textDecoration: 'underline' }}>Leggi l'analisi completa del team →</a>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 20 }}><em>Trasparenza: Questo è un link affiliato. Se attivi l'offerta, riceviamo una commissione senza alcun costo per te.</em></p>
      </div>

    </div>
  );
}