import React, { useState, useMemo } from 'react';
import { INDICI_MERCATO } from '../data.js';

const PRESETS = {
  luce: [
    { label: '1 Persona', val: 1500 },
    { label: '2 Persone', val: 2700 },
    { label: '4 Persone', val: 4000 }
  ],
  gas: [
    { label: '1 Persona', val: 400 },
    { label: '2 Persone', val: 1000 },
    { label: '4 Persone', val: 1400 }
  ]
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
  const nomeIndice = tipoEnergia === 'luce' ? 'PUN' : 'PSV';
  const unita = tipoEnergia === 'luce' ? 'kWh' : 'Smc';
  const themeColor = tipoEnergia === 'luce' ? '#d97706' : '#dc2626';
  const grossUp = tipoEnergia === 'luce' ? 1.55 : 1.45;

  const calcolaCosto = (off) => {
    const prezzo = parseFloat(off.prezzo) || 0;
    const fisso = parseFloat(off.fisso) || 0;
    const sconto = parseFloat(off.sconto) || 0;
    const costoMateria = off.tipo === 'fisso' ? prezzo * consumo : (indiceAttuale + prezzo) * consumo;
    const nettoFornitore = (costoMateria + fisso) - sconto;
    const totaleBolletta = nettoFornitore * grossUp;
    const quotaStatoRete = totaleBolletta - nettoFornitore;
    return {
      nettoFornitore: nettoFornitore,
      quotaStatoRete: quotaStatoRete > 0 ? quotaStatoRete : 0,
      totale: totaleBolletta > 0 ? totaleBolletta : 0
    };
  };

  const risultati = useMemo(() => offerte.map(off => ({ ...off, calcoli: calcolaCosto(off) })), [offerte, consumo, tipoEnergia]);
  const minTotale = Math.min(...risultati.map(r => r.calcoli.totale));

  const addOfferta = () => {
    if (offerte.length < 3) {
      const newId = Math.max(0, ...offerte.map(o => o.id)) + 1;
      setOfferte([...offerte, { id: newId, nome: 'Nuova offerta', tipo: 'fisso', prezzo: tipoEnergia === 'luce' ? '0.14' : '0.45', fisso: '120', sconto: '0', penali: false }]);
    }
  };

  const removeOfferta = (id) => setOfferte(offerte.filter(o => o.id !== id));
  const updateOfferta = (id, field, value) => setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));

  const inputStyle = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 12, fontFamily: 'inherit', fontWeight: 600, color: '#0f172a', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 };
  const helperStyle = { display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 };
  const formatEuro = (v) => `€ ${Math.max(0, v).toLocaleString('it-IT', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;

  const eniPrezzoUnitario = tipoEnergia === 'luce' ? 0.1881 : 0.7050;
  const eniCRAS = (((eniPrezzoUnitario * consumo) + 90) - 54) * grossUp;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#0f172a', marginBottom: 16, lineHeight: 1.2 }}>Costo Reale Annuo Stimato (CRAS)</h2>
        <p style={{ fontSize: 16, color: '#475569', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
          Scopri quanto pagherai <em>veramente</em>. Inserisci i dati dei contratti per smascherare i costi nascosti e confrontare le offerte in modo matematico.
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 64, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <div>
              <label style={labelStyle}>1. Cosa vuoi confrontare?</label>
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 6, borderRadius: 14, gap: 4 }}>
                <button onClick={() => handleTipoCambio('luce')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', background: tipoEnergia === 'luce' ? '#fff' : 'transparent', color: tipoEnergia === 'luce' ? '#d97706' : '#64748b', boxShadow: tipoEnergia === 'luce' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none', transition: '0.2s' }}>⚡ Luce</button>
                <button onClick={() => handleTipoCambio('gas')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', background: tipoEnergia === 'gas' ? '#fff' : 'transparent', color: tipoEnergia === 'gas' ? '#dc2626' : '#64748b', boxShadow: tipoEnergia === 'gas' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none', transition: '0.2s' }}>🔥 Gas</button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>2. Consumo Annuo Stimato ({unita})</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="number" value={consumoStr} onChange={(e) => setConsumoStr(e.target.value)} style={{ ...inputStyle, width: 110, fontSize: 20, color: themeColor }} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PRESETS[tipoEnergia].map(p => (
                    <button key={p.label} onClick={() => setConsumoStr(p.val.toString())} style={{ background: consumo === p.val ? `${themeColor}15` : '#f8fafc', border: `1px solid ${consumo === p.val ? themeColor : '#e2e8f0'}`, color: consumo === p.val ? themeColor : '#475569', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{...labelStyle, fontSize: 13}}>3. Inserisci i dati dei contratti</label>
          {offerte.length < 3 && (<button onClick={addOfferta} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>+ Aggiungi Offerta</button>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 24 }}>
          {risultati.map((off) => {
            const isWinner = off.calcoli.totale === minTotale && off.calcoli.totale > 0;
            return (
              <div key={off.id} style={{ background: isWinner ? `${themeColor}08` : '#fff', border: `2px solid ${isWinner ? themeColor : '#cbd5e1'}`, borderRadius: 20, padding: 24, position: 'relative', transition: '0.3s', boxShadow: isWinner ? `0 10px 30px -10px ${themeColor}40` : 'none' }}>
                {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: themeColor, color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>🥇 PIÙ CONVENIENTE</div>}
                {offerte.length > 1 && (<button onClick={() => removeOfferta(off.id)} style={{ position: 'absolute', top: 16, right: 16, background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>×</button>)}
                
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ ...inputStyle, fontWeight: 900, fontSize: 18, border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '2px solid #e2e8f0', borderRadius: 0, marginBottom: 20, color: '#0f172a' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', background: '#f8fafc', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <button onClick={() => updateOfferta(off.id, 'tipo', 'fisso')} style={{ flex: 1, padding: '8px', border: 'none', background: off.tipo === 'fisso' ? themeColor : 'transparent', color: off.tipo === 'fisso' ? '#fff' : '#64748b', fontSize: 13, fontWeight: 800, borderRadius: 8, cursor: 'pointer', transition: '0.2s' }}>Prezzo Fisso</button>
                    <button onClick={() => updateOfferta(off.id, 'tipo', 'variabile')} style={{ flex: 1, padding: '8px', border: 'none', background: off.tipo === 'variabile' ? themeColor : 'transparent', color: off.tipo === 'variabile' ? '#fff' : '#64748b', fontSize: 13, fontWeight: 800, borderRadius: 8, cursor: 'pointer', transition: '0.2s' }}>Variabile</button>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>{off.tipo === 'fisso' ? 'Prezzo bloccato' : 'Spread (Sovrapprezzo)'}</label>
                    <div style={{ position: 'relative', marginTop: 6 }}>
                      <input type="number" step="0.001" value={off.prezzo} onChange={(e) => updateOfferta(off.id, 'prezzo', e.target.value)} style={{ ...inputStyle, paddingRight: 60 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>€/{unita}</span>
                    </div>
                    {off.tipo === 'variabile' && (<span style={{...helperStyle, color: themeColor, fontWeight: 600}}>+ {nomeIndice} di {INDICI_MERCATO.ultimoAggiornamento} ({indiceAttuale} €) inserito in automatico.</span>)}
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>Costi Fissi Commerciali</label>
                    <div style={{ position: 'relative', marginTop: 6 }}>
                      <input type="number" value={off.fisso} onChange={(e) => updateOfferta(off.id, 'fisso', e.target.value)} style={{ ...inputStyle, paddingRight: 70 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>€/anno</span>
                    </div>
                    <span style={helperStyle}>Cerca la voce PCV/QVD. Moltiplica x12 se il valore è mensile.</span>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>Sconti di Benvenuto</label>
                    <div style={{ position: 'relative', marginTop: 6 }}>
                      <input type="number" value={off.sconto} onChange={(e) => updateOfferta(off.id, 'sconto', e.target.value)} style={{ ...inputStyle, paddingLeft: 28, color: '#166534' }} />
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#166534', fontWeight: 800 }}>- €</span>
                    </div>
                  </div>

                  <div style={{ background: off.penali ? '#fef2f2' : '#f8fafc', padding: 12, borderRadius: 10, border: `1px solid ${off.penali ? '#fecaca' : '#e2e8f0'}` }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: off.penali ? '#991b1b' : '#475569', cursor: 'pointer', fontWeight: 700 }}>
                      <input type="checkbox" checked={off.penali} onChange={(e) => updateOfferta(off.id, 'penali', e.target.checked)} style={{ width: 18, height: 18, accentColor: '#dc2626' }} />
                      Prevede penali di recesso?
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `2px dashed ${isWinner ? themeColor : '#cbd5e1'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}><span>Quota Fornitore:</span><span style={{ fontWeight: 700 }}>{formatEuro(off.calcoli.nettoFornitore)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 16 }}><span>Stima Tasse/Trasporto:</span><span style={{ fontWeight: 700 }}>+ {formatEuro(off.calcoli.quotaStatoRete)}</span></div>
                  <div style={{ textAlign: 'center', background: isWinner ? themeColor : '#f1f5f9', color: isWinner ? '#fff' : '#0f172a', padding: '16px', borderRadius: 16 }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px', opacity: 0.9 }}>Costo Totale (CRAS)</div>
                    <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.1, margin: '4px 0' }}>{formatEuro(off.calcoli.totale)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: 20, borderRadius: 16, marginTop: 32, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
          <strong>ℹ️ Metodo di Calcolo (CRAS):</strong> I fornitori pubblicizzano solo la Materia Prima (metà bolletta). Noi vi sommiamo i Costi Fissi e applichiamo un moltiplicatore statistico nazionale (+55% Luce, +45% Gas) per simulare Trasporto, Oneri, Accise e IVA e darti la stima finale.
        </div>
      </div>

      {/* SEZIONE LE ANALISI DEL TEAM */}
      <div style={{ marginTop: 80, borderTop: '1px solid #e2e8f0', paddingTop: 64, marginBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Le Analisi del Team</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#0f172a', marginTop: 8, marginBottom: 16 }}>Le Scelte Trasparenti</h2>
          <p style={{ fontSize: 16, color: '#475569', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
            Tra i tanti fornitori analizzati, abbiamo selezionato l'offerta che unisce la sicurezza del prezzo bloccato a condizioni contrattuali oneste (zero penali). <em>(Partnership commerciale)</em>
          </p>
        </div>

        <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 24, padding: '36px 40px', position: 'relative', boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.15)', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '6px 18px', borderRadius: 30, whiteSpace: 'nowrap' }}>★ Miglior Offerta Dual</div>
          <h3 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>Eni Plenitude — Fixa Time Smart</h3>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>Prezzo bloccato 12 mesi, zero penali e sconti reali sui costi fissi unendo luce e gas. Un'offerta estremamente solida.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, background: '#f8fafc', padding: '20px 32px', borderRadius: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>TUO CONSUMO ({unita})</span><div style={{ fontSize: 20, fontWeight: 900, color: themeColor }}>{consumoStr}</div></div>
            <div style={{ width: 1, background: '#cbd5e1' }}></div>
            <div style={{ textAlign: 'center' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>CRAS PLENITUDE</span><div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{formatEuro(eniCRAS)} <span style={{fontSize: 14, fontWeight: 700, color: '#64748b'}}>/anno</span></div></div>
          </div>
          <div>
            <a href="https://www.awin1.com/cread.php?awinmid=9529&awinaffid=2811530" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 16, textDecoration: 'none', marginBottom: 12 }}>Vai all'offerta ufficiale →</a>
            <br />
            <a href="/recensione-eni" style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, textDecoration: 'underline' }}>Leggi la nostra recensione completa →</a>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20, marginBottom: 0 }}><em>Trasparenza Editoriale: Questo è un link affiliato. Se attivi l'offerta, i fornitori ci riconoscono una commissione senza alcun costo aggiuntivo per te.</em></p>
        </div>
      </div>

    </div>
  );
}