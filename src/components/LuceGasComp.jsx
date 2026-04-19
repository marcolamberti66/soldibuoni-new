import React, { useState, useMemo } from 'react';
import { INDICI_MERCATO } from '../data.js';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const PRESETS = {
  luce: [
    { label: '1 Persona', desc: 'Uso base, no clima', val: 1500 },
    { label: 'Famiglia Standard', desc: 'Elettrodomestici classici', val: 2700 },
    { label: 'Casa Elettrica', desc: 'Pompa calore o induzione', val: 4500 }
  ],
  gas: [
    { label: 'Solo Cottura/Acqua', desc: 'Senza riscaldamento', val: 400 },
    { label: 'Famiglia Standard', desc: 'Riscaldamento medio', val: 1000 },
    { label: 'Casa Grande', desc: 'Inverni rigidi / scarsa classe', val: 1800 }
  ]
};

// Moltiplicatori medi statistici per stimare Oneri di Sistema, Trasporto, Accise e IVA
const GROSS_UP_LUCE = 1.55; 
const GROSS_UP_GAS = 1.45;

export function LuceGasComp({ color = '#0f172a' }) {
  const [tipoEnergia, setTipoEnergia] = useState('luce');
  const [consumoStr, setConsumoStr] = useState('2700');
  
  const [offerte, setOfferte] = useState([
    { id: 1, nome: 'La mia offerta attuale', tipo: 'fisso', prezzo: '0.15', fisso: '120', sconto: '0', penali: false },
    { id: 2, nome: 'Offerta trovata online', tipo: 'variabile', prezzo: '0.02', fisso: '144', sconto: '0', penali: false }
  ]);

  const consumo = parseFloat(consumoStr) || 0;
  const indiceAttuale = tipoEnergia === 'luce' ? INDICI_MERCATO.PUN : INDICI_MERCATO.PSV;
  const nomeIndice = tipoEnergia === 'luce' ? 'PUN' : 'PSV';
  const unita = tipoEnergia === 'luce' ? 'kWh' : 'Smc';
  const themeColor = tipoEnergia === 'luce' ? '#d97706' : '#dc2626';
  const grossUp = tipoEnergia === 'luce' ? GROSS_UP_LUCE : GROSS_UP_GAS;

  // Motore di calcolo bolletta realistica
  const calcolaCosto = (off) => {
    const prezzo = parseFloat(off.prezzo) || 0;
    const fisso = parseFloat(off.fisso) || 0;
    const sconto = parseFloat(off.sconto) || 0;
    
    // 1. Costo nudo della materia energia/gas
    const costoMateria = off.tipo === 'fisso' 
      ? prezzo * consumo 
      : (indiceAttuale + prezzo) * consumo;
      
    // 2. Costo netto che finisce in tasca al fornitore
    const nettoFornitore = (costoMateria + fisso) - sconto;
    
    // 3. Stima Totale Bolletta (aggiungendo Trasporto, Oneri, Accise, IVA)
    const totaleBolletta = nettoFornitore * grossUp;
    const quotaStatoRete = totaleBolletta - nettoFornitore;
      
    return {
      nettoFornitore: nettoFornitore,
      quotaStatoRete: quotaStatoRete > 0 ? quotaStatoRete : 0,
      totale: totaleBolletta > 0 ? totaleBolletta : 0
    };
  };

  const risultati = useMemo(() => {
    return offerte.map(off => ({
      ...off,
      calcoli: calcolaCosto(off)
    }));
  }, [offerte, consumo, tipoEnergia]);

  const minTotale = Math.min(...risultati.map(r => r.calcoli.totale));

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

  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid #cbd5e1', borderRadius: 10, fontFamily: 'inherit', color: '#0f172a', background: '#fff', outline: 'none', fontWeight: 600 };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 };
  const helperStyle = { display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 };

  const formatEuro = (v) => `€ ${Math.max(0, v).toLocaleString('it-IT', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;

  // Calcolo CRAS per l'offerta affiliata (Eni Plenitude) basato sui consumi in tempo reale
  const eniPrezzoUnitario = tipoEnergia === 'luce' ? 0.1881 : 0.7050;
  const eniFissoAnnuo = 90; // 7,50€ al mese
  const eniSconto = 54; // Sconto dual per singola fornitura
  const eniNettoFornitore = (eniPrezzoUnitario * consumo) + eniFissoAnnuo - eniSconto;
  const eniCRAS = eniNettoFornitore * grossUp;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* HERO SECTION TOOL */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#0f172a', marginBottom: 16, lineHeight: 1.2 }}>
          Costo Reale Annuo Stimato (CRAS)
        </h2>
        <p style={{ fontSize: 16, color: '#475569', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
          Scopri quanto pagherai <em>veramente</em> alla fine dell'anno, comprese tasse e oneri. Inserisci i dati dei contratti per smascherare i costi nascosti e confrontare le offerte in modo oggettivo.
        </p>
      </div>

      {/* TOOL CALCOLATORE */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', marginBottom: 48, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        {/* STEP 1: IMPOSTAZIONI BASE */}
        <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <div>
              <label style={labelStyle}>1. Cosa vuoi confrontare?</label>
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 6, borderRadius: 14, gap: 4 }}>
                <button onClick={() => { setTipoEnergia('luce'); setConsumoStr('2700'); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', background: tipoEnergia === 'luce' ? '#fff' : 'transparent', color: tipoEnergia === 'luce' ? '#d97706' : '#64748b', boxShadow: tipoEnergia === 'luce' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none', transition: '0.2s' }}>⚡ Luce</button>
                <button onClick={() => { setTipoEnergia('gas'); setConsumoStr('1000'); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', background: tipoEnergia === 'gas' ? '#fff' : 'transparent', color: tipoEnergia === 'gas' ? '#dc2626' : '#64748b', boxShadow: tipoEnergia === 'gas' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none', transition: '0.2s' }}>🔥 Gas</button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>2. Consumo Annuo Stimato ({unita})</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="number" value={consumoStr} onChange={(e) => setConsumoStr(e.target.value)} style={{ ...inputStyle, width: 120, fontSize: 20, color: themeColor }} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PRESETS[tipoEnergia].map(p => (
                    <button key={p.label} onClick={() => setConsumoStr(p.val.toString())} title={p.desc} style={{ background: consumo === p.val ? `${themeColor}15` : '#f8fafc', border: `1px solid ${consumo === p.val ? themeColor : '#e2e8f0'}`, color: consumo === p.val ? themeColor : '#475569', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: INSERIMENTO OFFERTE */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{...labelStyle, fontSize: 13}}>3. Inserisci i dati dei contratti</label>
          {offerte.length < 3 && (
            <button onClick={addOfferta} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>+ Aggiungi Offerta</button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 24 }}>
          {risultati.map((off) => {
            const isWinner = off.calcoli.totale === minTotale && off.calcoli.totale > 0;
            return (
              <div key={off.id} style={{ background: isWinner ? `${themeColor}08` : '#fff', border: `2px solid ${isWinner ? themeColor : '#cbd5e1'}`, borderRadius: 20, padding: 24, position: 'relative', transition: '0.3s', boxShadow: isWinner ? `0 10px 30px -10px ${themeColor}40` : 'none' }}>
                {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: themeColor, color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>🥇 PIÙ CONVENIENTE</div>}
                
                {offerte.length > 1 && (
                  <button onClick={() => removeOfferta(off.id)} style={{ position: 'absolute', top: 16, right: 16, background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>×</button>
                )}
                
                <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ ...inputStyle, fontWeight: 900, fontSize: 18, border: 'none', background: 'transparent', padding: '0 0 12px 0', borderBottom: '2px solid #e2e8f0', borderRadius: 0, marginBottom: 20, color: '#0f172a' }} placeholder="Nome Offerta" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* TIPO TARIFFA */}
                  <div style={{ display: 'flex', background: '#f8fafc', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <button onClick={() => updateOfferta(off.id, 'tipo', 'fisso')} style={{ flex: 1, padding: '8px', border: 'none', background: off.tipo === 'fisso' ? themeColor : 'transparent', color: off.tipo === 'fisso' ? '#fff' : '#64748b', fontSize: 13, fontWeight: 800, borderRadius: 8, cursor: 'pointer', transition: '0.2s' }}>Prezzo Fisso</button>
                    <button onClick={() => updateOfferta(off.id, 'tipo', 'variabile')} style={{ flex: 1, padding: '8px', border: 'none', background: off.tipo === 'variabile' ? themeColor : 'transparent', color: off.tipo === 'variabile' ? '#fff' : '#64748b', fontSize: 13, fontWeight: 800, borderRadius: 8, cursor: 'pointer', transition: '0.2s' }}>Variabile</button>
                  </div>

                  {/* PREZZO MATERIA PRIMA */}
                  <div>
                    <label style={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>{off.tipo === 'fisso' ? 'Prezzo bloccato' : 'Spread (Sovrapprezzo del fornitore)'}</label>
                    <div style={{ position: 'relative', marginTop: 6 }}>
                      <input type="number" step="0.001" value={off.prezzo} onChange={(e) => updateOfferta(off.id, 'prezzo', e.target.value)} style={{ ...inputStyle, paddingRight: 60 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>€/{unita}</span>
                    </div>
                    {off.tipo === 'variabile' && (
                      <span style={{...helperStyle, color: themeColor, fontWeight: 600}}>
                        + {nomeIndice} di {INDICI_MERCATO.ultimoAggiornamento} ({indiceAttuale} €) inserito in automatico.
                      </span>
                    )}
                    <span style={helperStyle}>Lo trovi nelle "Condizioni Economiche" del contratto. {off.tipo === 'variabile' && 'Cerca la voce Spread o Contributo al Consumo.'}</span>
                  </div>

                  {/* COSTI FISSI */}
                  <div>
                    <label style={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>Costi Fissi Commerciali (All'anno)</label>
                    <div style={{ position: 'relative', marginTop: 6 }}>
                      <input type="number" value={off.fisso} onChange={(e) => updateOfferta(off.id, 'fisso', e.target.value)} style={{ ...inputStyle, paddingRight: 70 }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>€/anno</span>
                    </div>
                    <span style={helperStyle}>Cerca la voce <strong>PCV</strong> (se luce) o <strong>QVD</strong> (se gas). Moltiplica per 12 se il valore nel contratto è mensile.</span>
                  </div>

                  {/* SCONTI */}
                  <div>
                    <label style={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>Eventuali Sconti (Una tantum)</label>
                    <div style={{ position: 'relative', marginTop: 6 }}>
                      <input type="number" value={off.sconto} onChange={(e) => updateOfferta(off.id, 'sconto', e.target.value)} style={{ ...inputStyle, paddingLeft: 28, color: '#166534' }} />
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#166534', fontWeight: 800 }}>- €</span>
                    </div>
                  </div>

                  {/* PENALI */}
                  <div style={{ background: off.penali ? '#fef2f2' : '#f8fafc', padding: 12, borderRadius: 10, border: `1px solid ${off.penali ? '#fecaca' : '#e2e8f0'}` }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: off.penali ? '#991b1b' : '#475569', cursor: 'pointer', fontWeight: 700 }}>
                      <input type="checkbox" checked={off.penali} onChange={(e) => updateOfferta(off.id, 'penali', e.target.checked)} style={{ width: 18, height: 18, accentColor: '#dc2626' }} />
                      Prevede penali di recesso?
                    </label>
                    {off.penali && <div style={{ fontSize: 11, color: '#991b1b', marginTop: 6, lineHeight: 1.4 }}>⚠️ Se cambi fornitore prima del termine (es. 24 mesi) pagherai una multa aggiuntiva non inclusa in questo calcolo.</div>}
                  </div>
                </div>

                {/* RISULTATO MATEMATICO */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `2px dashed ${isWinner ? themeColor : '#cbd5e1'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                    <span>Quota Fornitore (Materia + Fissi):</span>
                    <span style={{ fontWeight: 700 }}>{formatEuro(off.calcoli.nettoFornitore)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                    <span>Stima Tasse, Oneri e Trasporto:</span>
                    <span style={{ fontWeight: 700 }}>+ {formatEuro(off.calcoli.quotaStatoRete)}</span>
                  </div>
                  
                  <div style={{ textAlign: 'center', background: isWinner ? themeColor : '#f1f5f9', color: isWinner ? '#fff' : '#0f172a', padding: '16px', borderRadius: 16 }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px', opacity: 0.9 }}>Costo Totale Bolletta (CRAS)</div>
                    <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.1, margin: '4px 0' }}>
                      {formatEuro(off.calcoli.totale)}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>Stima complessiva annua finale</div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* DISCLAIMER METODOLOGIA */}
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: 20, borderRadius: 16, marginTop: 32, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
          <strong>ℹ️ Come funziona il nostro calcolo realistico (CRAS)?</strong><br/>
          I fornitori pubblicizzano solo il "Costo Materia Prima", che è circa la metà della bolletta. Il nostro calcolatore somma la Materia Prima ai Costi Fissi (PCV/QVD), e poi applica un moltiplicatore statistico nazionale (<strong>+55% per la Luce</strong>, <strong>+45% per il Gas</strong>) per simulare l'impatto reale di Trasporto, Gestione Contatore, Oneri di Sistema, Accise e IVA. Il risultato non spacca il centesimo, ma ti fornisce la stima più vicina alla realtà per non avere sorprese in fattura.
        </div>
      </div>


      {/* ================================================================= */}
      {/* BOX AFFILIATO PREMIUM                                             */}
      {/* ================================================================= */}
      
      <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 24, padding: '36px 40px', position: 'relative', boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.15)', textAlign: 'center' }}>
        
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '6px 16px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <span style={{ color: '#fbbf24' }}>★</span> L'Alternativa Scelta dal Team
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>
            Eni Plenitude — Fixa Time Smart
          </h3>
          <p style={{ fontSize: 16, color: '#475569', margin: 0, maxWidth: 550, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Se le offerte che hai calcolato non ti convincono, abbiamo analizzato per te una tariffa trasparente, con prezzo bloccato per 12 mesi e <strong>zero penali di recesso</strong>.
          </p>
        </div>

        {/* COMPARAZIONE DIRETTA DEL CRAS */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, margin: '32px auto', background: '#f8fafc', padding: '24px 32px', borderRadius: 16, border: '1px solid #e2e8f0', flexWrap: 'wrap', maxWidth: 600 }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Il tuo consumo</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: themeColor }}>{consumoStr} {unita}</span>
          </div>
          <div style={{ width: 1, height: 40, background: '#cbd5e1' }} className="hide-mobile"></div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CRAS Stimato Plenitude</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{formatEuro(eniCRAS)} <span style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>/anno</span></span>
          </div>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto 32px', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: 15, color: '#334155', lineHeight: 1.7, textAlign: 'left' }}>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}><span style={{ flexShrink: 0 }}>✅</span><span><strong>Prezzo bloccato 12 mesi</strong> per proteggerti dai rincari invernali.</span></li>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, margin: '12px 0' }}><span style={{ flexShrink: 0 }}>✅</span><span><strong>Sconto di 108€</strong> (-54€ Luce, -54€ Gas) sui costi fissi attivando l'offerta dual.</span></li>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}><span style={{ flexShrink: 0 }}>✅</span><span>Nessuna penale. Se trovi di meglio tra 6 mesi, puoi andartene a costo zero.</span></li>
        </ul>

        <div>
          {/* Link alla pagina di approfondimento in stile BBVA/Hype */}
          <a href="https://www.awin1.com/cread.php?awinmid=9529&awinaffid=2811530" target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '16px 40px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 8px 20px -6px rgba(15, 23, 42, 0.4)' }}>
            Vai all'offerta ufficiale →
          </a>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 20, maxWidth: 500, margin: '20px auto 0', lineHeight: 1.5 }}>
            <em>Trasparenza Editoriale: Questo è un link affiliato. Se decidi di attivare l'offerta passando da qui, i fornitori ci riconoscono una commissione senza alcun costo aggiuntivo per te. Questo ci permette di offrirti calcolatori indipendenti e senza pubblicità invasiva.</em>
          </div>
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