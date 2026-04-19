import React, { useState, useMemo } from 'react';
import { INDICI_MERCATO } from '../data.js';

export function LuceGasComp() {
  const [tipoEnergia, setTipoEnergia] = useState('luce');
  const [consumoStr, setConsumoStr] = useState('2700');
  const [offerte, setOfferte] = useState([
    { id: 1, nome: 'Contratto Attuale', tipo: 'fisso', prezzo: '0.15', fisso: '120', sconto: '0', penali: false },
    { id: 2, nome: 'Nuova Proposta', tipo: 'variabile', prezzo: '0.02', fisso: '144', sconto: '0', penali: false }
  ]);

  const consumo = parseFloat(consumoStr) || 0;
  const indiceAttuale = tipoEnergia === 'luce' ? INDICI_MERCATO.PUN : INDICI_MERCATO.PSV;
  const unita = tipoEnergia === 'luce' ? 'kWh' : 'Smc';
  const themeColor = tipoEnergia === 'luce' ? '#d97706' : '#dc2626';
  const grossUp = tipoEnergia === 'luce' ? 1.55 : 1.45;

  const risultati = useMemo(() => {
    return offerte.map(off => {
      const p = parseFloat(off.prezzo) || 0;
      const f = parseFloat(off.fisso) || 0;
      const s = parseFloat(off.sconto) || 0;
      const netto = ((off.tipo === 'fisso' ? p : indiceAttuale + p) * consumo + f) - s;
      const totale = netto * grossUp;
      return { ...off, totale: totale > 0 ? totale : 0, netto };
    });
  }, [offerte, consumo, tipoEnergia]);

  const minTotale = Math.min(...risultati.map(r => r.totale));

  const updateOfferta = (id, field, value) => setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));
  const inputStyle = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 12, fontWeight: 600, color: '#0f172a', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 };

  const formatEuro = (v) => `€ ${Math.round(v).toLocaleString('it-IT')}`;

  // Calcolo CRAS Dinamico Eni Plenitude
  const eniCRAS = (((tipoEnergia === 'luce' ? 0.188 : 0.705) * consumo) + 90 - 54) * grossUp;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#0f172a', marginBottom: 16 }}>Costo Reale Annuo Stimato</h2>
        <p style={{ fontSize: 17, color: '#64748b', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>Smaschera i costi nascosti. Calcola quanto pagherai davvero alla fine dell'anno, comprese tasse e oneri di sistema.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 56, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <label style={labelStyle}>Cosa vuoi calcolare?</label>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 6, borderRadius: 14, gap: 4 }}>
              <button onClick={() => setTipoEnergia('luce')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', background: tipoEnergia === 'luce' ? '#fff' : 'transparent', color: tipoEnergia === 'luce' ? '#d97706' : '#64748b', boxShadow: tipoEnergia === 'luce' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>⚡ Luce</button>
              <button onClick={() => setTipoEnergia('gas')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', background: tipoEnergia === 'gas' ? '#fff' : 'transparent', color: tipoEnergia === 'gas' ? '#dc2626' : '#64748b', boxShadow: tipoEnergia === 'gas' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>🔥 Gas</button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Consumo Annuo ({unita})</label>
            <input type="number" value={consumoStr} onChange={(e) => setConsumoStr(e.target.value)} style={{ ...inputStyle, fontSize: 18, color: themeColor }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 24 }}>
          {risultati.map((off) => {
            const isWinner = off.totale === minTotale && off.totale > 0;
            return (
              <div key={off.id} style={{ background: isWinner ? `${themeColor}08` : '#fff', border: `2px solid ${isWinner ? themeColor : '#e2e8f0'}`, borderRadius: 24, padding: 28, position: 'relative', boxShadow: isWinner ? `0 10px 30px -10px ${themeColor}40` : 'none' }}>
                {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: themeColor, color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>🥇 PIÙ CONVENIENTE</div>}
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ ...inputStyle, fontWeight: 900, fontSize: 18, border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '2px solid #e2e8f0', borderRadius: 0, marginBottom: 20 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div style={{ display: 'flex', background: '#f8fafc', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <button onClick={() => updateOfferta(off.id, 'tipo', 'fisso')} style={{ flex: 1, padding: '8px', border: 'none', background: off.tipo === 'fisso' ? themeColor : 'transparent', color: off.tipo === 'fisso' ? '#fff' : '#64748b', fontSize: 13, fontWeight: 800, borderRadius: 8, cursor: 'pointer' }}>Fisso</button>
                    <button onClick={() => updateOfferta(off.id, 'tipo', 'variabile')} style={{ flex: 1, padding: '8px', border: 'none', background: off.tipo === 'variabile' ? themeColor : 'transparent', color: off.tipo === 'variabile' ? '#fff' : '#64748b', fontSize: 13, fontWeight: 800, borderRadius: 8, cursor: 'pointer' }}>Variabile</button>
                  </div>
                  <div><label style={labelStyle}>Prezzo/Spread</label><input type="number" step="0.001" value={off.prezzo} onChange={(e) => updateOfferta(off.id, 'prezzo', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Costi Fissi (Anno)</label><input type="number" value={off.fisso} onChange={(e) => updateOfferta(off.id, 'fisso', e.target.value)} style={inputStyle} /></div>
                </div>
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Totale Bolletta Stimato</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: isWinner ? themeColor : '#0f172a', margin: '6px 0' }}>{formatEuro(off.totale)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Include Tasse e Oneri</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOX AFFILIATO PREMIUM */}
      <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 24, padding: '36px 40px', position: 'relative', boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.15)', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '6px 18px', borderRadius: 30, whiteSpace: 'nowrap' }}>★ La Selezione del Team</div>
        <h3 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>Eni Plenitude — Fixa Time Smart</h3>
        <p style={{ fontSize: 16, color: '#64748b', marginBottom: 24, maxWidth: 550, margin: '0 auto 24px', lineHeight: 1.6 }}>Prezzo bloccato 12 mesi, zero penali e sconti reali sui costi fissi. L'alternativa più sicura del mercato.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, background: '#f8fafc', padding: '20px 32px', borderRadius: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'left' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>TUO CONSUMO</span><div style={{ fontSize: 20, fontWeight: 900, color: themeColor }}>{consumoStr} {unita}</div></div>
          <div style={{ width: 1, height: 40, background: '#cbd5e1' }}></div>
          <div style={{ textAlign: 'left' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>CRAS PLENITUDE</span><div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{formatEuro(eniCRAS)} /anno</div></div>
        </div>
        <a href="https://www.awin1.com/cread.php?awinmid=9529&awinaffid=2811530" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Vai all'offerta ufficiale →</a>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>Trasparenza: Link affiliato. Ci aiuta a mantenere i tool gratuiti per te.</p>
      </div>
    </div>
  );
}