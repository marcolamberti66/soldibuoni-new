import React, { useState, useMemo, useRef } from 'react';

// ============================================================================
// CONTI CORRENTI — CALCOLATORE OTTIMIZZATO
// ============================================================================

const PRESETS_PROFILO = [
  { label: 'Studente', sub: 'giacenza 2k', giacenza: 2000, bonifici: 1, prelievi: 2 },
  { label: 'Professionista', sub: 'giacenza 8k', giacenza: 8000, bonifici: 5, prelievi: 3 },
  { label: 'Famiglia', sub: 'giacenza 15k', giacenza: 15000, bonifici: 10, prelievi: 5 }
];

const DEFAULT_OFFERS = [
  {
    id: 1, nome: 'Il mio conto attuale',
    canone: '5', bolloPagato: false,
    tasso: '0', tassoPromo: '0', durataPromo: 0,
    costoBonifico: '2.0', costoPrelievo: '2', canoneCarta: '10',
    bonusBenvenuto: '0', cashbackAnnuo: '0', richiedeStipendio: false
  },
  {
    id: 2, nome: 'Conto da confrontare',
    canone: '0', bolloPagato: true,
    tasso: '1', tassoPromo: '3', durataPromo: 12,
    costoBonifico: '0', costoPrelievo: '0', canoneCarta: '0',
    bonusBenvenuto: '50', cashbackAnnuo: '30', richiedeStipendio: true
  }
];

const THEME = { primary: '#17150f', soft: '#ece7dd', bg: '#f5f2ec' };

// ============================================================================
// MOTORE DI CALCOLO
// ============================================================================

function calcolaBilancio(off, giacenza, numBonifici, numPrelievi, stipendioOk, anno) {
  var canone = parseFloat(off.canone) || 0;
  var tassoStd = parseFloat(off.tasso) || 0;
  var tassoPromo = parseFloat(off.tassoPromo) || 0;
  var durataPromo = parseInt(off.durataPromo) || 0;
  var cBonifico = parseFloat(off.costoBonifico) || 0;
  var cPrelievo = parseFloat(off.costoPrelievo) || 0;
  var cCarta = parseFloat(off.canoneCarta) || 0;
  var bonus = parseFloat(off.bonusBenvenuto) || 0;
  var cashback = parseFloat(off.cashbackAnnuo) || 0;

  var canoneEffettivo = canone;
  if (off.richiedeStipendio && !stipendioOk && canone < 2) {
    canoneEffettivo = 5;
  }

  var canoneAnnuo = canoneEffettivo * 12;
  var canoneCartaAnnuo = cCarta;

  var bollo = (giacenza > 5000 && !off.bolloPagato) ? 34.20 : 0;
  var operazioni = (cBonifico * numBonifici + cPrelievo * numPrelievi) * 12;

  var tassoApplicato;
  if (anno === 1 && durataPromo > 0) {
    var mesiPromo = Math.min(durataPromo, 12);
    var mesiStd = 12 - mesiPromo;
    tassoApplicato = (tassoPromo * mesiPromo + tassoStd * mesiStd) / 12;
  } else {
    tassoApplicato = tassoStd;
  }
  var interessiLordi = giacenza * (tassoApplicato / 100);
  var interessiNetti = interessiLordi * 0.74; 

  var bonusApplicato = anno === 1 ? bonus : 0;
  var bilancio = canoneAnnuo + canoneCartaAnnuo + bollo + operazioni - interessiNetti - cashback - bonusApplicato;

  return {
    canoneAnnuo, canoneCarta: canoneCartaAnnuo, bollo, operazioni,
    interessiNetti, cashback, bonus: bonusApplicato, tassoApplicato, bilancio
  };
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function ContiComp() {
  const [giacenzaStr, setGiacenzaStr] = useState('6000');
  const [numBonifici, setNumBonifici] = useState(2);
  const [numPrelievi, setNumPrelievi] = useState(2);
  const [stipendioOk, setStipendioOk] = useState(true);
  const [offerte, setOfferte] = useState(DEFAULT_OFFERS);

  // --- STATI AI ---
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState('text');
  const [aiText, setAiText] = useState('');
  const [aiFile, setAiFile] = useState(null);
  const [aiTargetId, setAiTargetId] = useState(2);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSuccess, setAiSuccess] = useState(null);
  const fileRef = useRef(null);

  const giacenza = parseFloat(giacenzaStr) || 0;
  const t = THEME;

  const risultati = useMemo(
    () => offerte.map(off => ({
      ...off,
      anno1: calcolaBilancio(off, giacenza, numBonifici, numPrelievi, stipendioOk, 1),
      anno2: calcolaBilancio(off, giacenza, numBonifici, numPrelievi, stipendioOk, 2)
    })),
    [offerte, giacenza, numBonifici, numPrelievi, stipendioOk]
  );

  const minBilancio = Math.min(...risultati.map(r => r.anno1.bilancio));

  const updateOfferta = (id, field, value) =>
    setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));

  const aggiungiOfferta = () => {
    if (offerte.length >= 4) return;
    const nextId = Math.max(...offerte.map(o => o.id)) + 1;
    setOfferte([...offerte, {
      id: nextId, nome: `Conto #${nextId}`,
      canone: '0', bolloPagato: false,
      tasso: '0', tassoPromo: '0', durataPromo: 0,
      costoBonifico: '0', costoPrelievo: '0', canoneCarta: '0',
      bonusBenvenuto: '0', cashbackAnnuo: '0', richiedeStipendio: false
    }]);
  };

  const rimuoviOfferta = (id) => {
    if (offerte.length <= 2) return;
    setOfferte(offerte.filter(o => o.id !== id));
  };

  const applicaPreset = (p) => {
    setGiacenzaStr(p.giacenza.toString());
    setNumBonifici(p.bonifici);
    setNumPrelievi(p.prelievi);
  };

  // --- FUNZIONE ESTRAZIONE AI ---
  const extractAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(null);

    try {
      let body;
      let headers = {};

      if (aiMode === 'text') {
        if (!aiText.trim()) throw new Error('Incolla prima il testo del foglio informativo.');
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ mode: 'text', text: aiText });
      } else {
        if (!aiFile) throw new Error('Seleziona prima un file (immagine o PDF).');
        body = new FormData();
        body.append('mode', 'image');
        body.append('file', aiFile);
      }

      const res = await fetch('/api/extract-conto', { method: 'POST', headers, body });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Errore ${res.status}`);
      }
      const data = await res.json();

      setOfferte(prev => prev.map(o => {
        if (o.id !== aiTargetId) return o;
        return {
          ...o,
          nome: data.nome ?? o.nome,
          canone: data.canone != null ? String(data.canone) : o.canone,
          bolloPagato: data.bolloPagato ?? o.bolloPagato,
          tasso: data.tasso != null ? String(data.tasso) : o.tasso,
          tassoPromo: data.tassoPromo != null ? String(data.tassoPromo) : o.tassoPromo,
          durataPromo: data.durataPromo ?? o.durataPromo,
          costoBonifico: data.costoBonifico != null ? String(data.costoBonifico) : o.costoBonifico,
          costoPrelievo: data.costoPrelievo != null ? String(data.costoPrelievo) : o.costoPrelievo,
          canoneCarta: data.canoneCarta != null ? String(data.canoneCarta) : o.canoneCarta,
          bonusBenvenuto: data.bonusBenvenuto != null ? String(data.bonusBenvenuto) : o.bonusBenvenuto,
          cashbackAnnuo: data.cashbackAnnuo != null ? String(data.cashbackAnnuo) : o.cashbackAnnuo,
          richiedeStipendio: data.richiedeStipendio ?? o.richiedeStipendio
        };
      }));

      setAiSuccess('Dati estratti! Verifica i campi prima di considerare il risultato definitivo.');
      setAiText('');
      setAiFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const formatEuro = (v) => `€ ${Math.abs(v).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const cardBase = { background: '#fbfaf7', border: '1px solid #e6e0d4', borderRadius: 24, padding: '32px 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#47433a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 };
  const miniLabel = { fontSize: 11, fontWeight: 800, color: '#47433a', display: 'block', marginBottom: 4 };
  const miniInput = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d6cfc1', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums', fontSize: 14 };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: 'var(--f-ui)' }}>

      <div style={{ ...cardBase, marginBottom: 28, padding: '36px 32px' }}>
        <style dangerouslySetInnerHTML={{__html:`
          .cc-profili { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
          .cc-inputs { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:20px; }
          @media(max-width:500px){
            .cc-profili { gap:6px; }
            .cc-profili button { padding:8px 6px !important; font-size:12px !important; }
            .cc-inputs { grid-template-columns:1fr 1fr; gap:12px; }
            .cc-inputs .cc-full { grid-column:1/-1; }
          }
        `}}/>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Profilo d'uso tipico</label>
          <div className="cc-profili">
            {PRESETS_PROFILO.map(p => {
              const active = giacenza === p.giacenza && numBonifici === p.bonifici && numPrelievi === p.prelievi;
              return (
                <button key={p.label} onClick={() => applicaPreset(p)}
                  style={{
                    background: active ? '#fbfaf7' : '#f5f2ec',
                    border: active ? `1px solid ${t.primary}` : '1px solid #e6e0d4',
                    color: active ? t.primary : '#47433a',
                    padding: '10px 8px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center', lineHeight: 1.2,
                    boxShadow: active ? '0 2px 6px rgba(23,21,15,0.06)' : 'none', fontFamily: 'inherit'
                  }}
                >
                  <div>{p.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>{p.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="cc-inputs">
          <div className="cc-full">
            <label style={labelStyle}>Giacenza media (€)</label>
            <input type="number" value={giacenzaStr} onChange={(e) => setGiacenzaStr(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', fontSize: 18, fontWeight: 800,
                border: giacenza > 5000 ? `2px solid #84652d` : '1px solid #d6cfc1',
                borderRadius: 12, color: t.primary, boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums', outline: 'none'
              }} />
            {giacenza > 5000 && (
              <div style={{ fontSize: 11, color: '#84652d', fontWeight: 700, marginTop: 6 }}>
                Oltre 5.000€ scatta il bollo statale (34,20€/anno) se non pagato dalla banca
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Bonifici / mese</label>
            <input type="number" value={numBonifici} onChange={(e) => setNumBonifici(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '12px 14px', fontSize: 16, fontWeight: 700, border: '1px solid #d6cfc1', borderRadius: 12, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={labelStyle}>Prelievi / mese</label>
            <input type="number" value={numPrelievi} onChange={(e) => setNumPrelievi(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '12px 14px', fontSize: 16, fontWeight: 700, border: '1px solid #d6cfc1', borderRadius: 12, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={labelStyle}>Accrediti lo stipendio?</label>
            <div style={{ display: 'flex', background: '#f5f2ec', padding: 4, borderRadius: 12, border: '1px solid #e6e0d4' }}>
              {[{ v: true, l: 'Sì' }, { v: false, l: 'No' }].map(opt => (
                <button key={opt.l} onClick={() => setStipendioOk(opt.v)}
                  style={{
                    flex: 1, padding: '10px', border: 'none', background: stipendioOk === opt.v ? t.primary : 'transparent',
                    color: stipendioOk === opt.v ? '#fbfaf7' : '#6f6a5e', fontWeight: 800, fontSize: 13, borderRadius: 8, cursor: 'pointer'
                  }}
                >{opt.l}</button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#6f6a5e', marginTop: 6, lineHeight: 1.4 }}>
              Molti conti a canone zero lo azzerano solo con stipendio accreditato
            </div>
          </div>
        </div>

        {/* ============== AI EXTRACTION TOGGLE ============== */}
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px dashed #e6e0d4' }}>
          <button onClick={() => setAiOpen(!aiOpen)}
            style={{ width: '100%', background: aiOpen ? '#17150f' : `linear-gradient(135deg, #17150f 0%, #26231b 100%)`, color: '#fbfaf7', border: 'none', padding: '14px 20px', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, boxShadow: '0 8px 20px -8px rgba(23,21,15,0.5)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 6, fontSize: 10, letterSpacing: '0.1em' }}>BETA</span>
              <span>Compila in automatico con l'AI</span>
            </span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{aiOpen ? 'Chiudi' : 'Apri →'}</span>
          </button>

          {aiOpen && (
            <div style={{ marginTop: 16, background: '#17150f', borderRadius: 16, padding: 24, color: '#fbfaf7' }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 16px', color: '#d6cfc1' }}>
                Incolla qui il foglio informativo o la pagina dei costi del conto. L'AI estrae tassi, commissioni e canoni inserendoli direttamente nel calcolatore.
              </p>

              <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.06)', padding: 4, borderRadius: 10, marginBottom: 14 }}>
                {[{ k: 'text', label: 'Incolla testo' }, { k: 'image', label: 'Carica immagine/PDF' }].map(m => (
                  <button key={m.k} onClick={() => setAiMode(m.k)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', background: aiMode === m.k ? '#fbfaf7' : 'transparent', color: aiMode === m.k ? '#17150f' : '#8f897c', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >{m.label}</button>
                ))}
              </div>

              {aiMode === 'text' ? (
                <textarea value={aiText} onChange={(e) => setAiText(e.target.value)}
                  placeholder="Esempio: Conto X a zero spese. Bonifici istantanei 1,50€. Prelievi gratis. Tasso del 4% annuo lordo per i primi 12 mesi..."
                  rows={5} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fbfaf7', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                />
              ) : (
                <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={(e) => setAiFile(e.target.files?.[0] || null)} style={{ color: '#d6cfc1', fontSize: 13 }} />
                  {aiFile && <div style={{ marginTop: 10, fontSize: 12, color: '#8f897c' }}>Selezionato: <strong style={{ color: '#fbfaf7' }}>{aiFile.name}</strong> ({Math.round(aiFile.size / 1024)} KB)</div>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ fontSize: 12, color: '#d6cfc1', fontWeight: 700 }}>Inserisci come →</label>
                <select value={aiTargetId} onChange={(e) => setAiTargetId(parseInt(e.target.value))}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fbfaf7', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
                >
                  {offerte.map(o => <option key={o.id} value={o.id} style={{ color: '#17150f' }}>{o.nome}</option>)}
                </select>
                <button onClick={extractAI} disabled={aiLoading}
                  style={{ marginLeft: 'auto', background: aiLoading ? '#47433a' : t.primary, color: '#fbfaf7', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: aiLoading ? 'wait' : 'pointer', boxShadow: `0 4px 12px ${t.primary}40` }}
                >
                  {aiLoading ? 'Analizzando...' : 'Estrai e compila →'}
                </button>
              </div>

              {aiError && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(155,66,32,0.15)', border: '1px solid rgba(155,66,32,0.3)', borderRadius: 8, fontSize: 13, color: '#e8c4b2' }}>{aiError}</div>}
              {aiSuccess && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(44,90,67,0.15)', border: '1px solid rgba(44,90,67,0.3)', borderRadius: 8, fontSize: 13, color: '#c6d8cb' }}>{aiSuccess}</div>}
              <p style={{ fontSize: 11, color: '#6f6a5e', marginTop: 14, lineHeight: 1.5, fontStyle: 'italic' }}>L'estrazione AI è uno strumento di assistenza: verifica sempre i campi compilati.</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${offerte.length > 2 ? '280px' : '320px'}, 1fr))`, gap: 20, marginBottom: 16 }}>
        {risultati.map(off => {
          const isWinner = off.anno1.bilancio === minBilancio && offerte.length > 1;
          const bilancio = off.anno1.bilancio;
          const isGuadagno = bilancio < 0;

          return (
            <div key={off.id} style={{ background: isWinner ? `linear-gradient(180deg, ${t.bg} 0%, #fbfaf7 60%)` : '#fbfaf7', border: `2px solid ${isWinner ? t.primary : '#e6e0d4'}`, borderRadius: 24, padding: 24, position: 'relative', boxShadow: isWinner ? `0 20px 40px -12px ${t.primary}30` : '0 4px 12px rgba(0,0,0,0.03)' }}>
              {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: t.primary, color: '#fbfaf7', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${t.primary}50`, letterSpacing: '0.05em' }}>SCELTA OTTIMALE</div>}
              {offerte.length > 2 && <button onClick={() => rimuoviOfferta(off.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: '#8f897c', cursor: 'pointer', fontSize: 18, padding: 4 }} title="Rimuovi offerta">×</button>}
              
              <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ fontWeight: 900, fontSize: 17, border: 'none', background: 'transparent', width: '100%', paddingBottom: 12, borderBottom: '2px solid #e6e0d4', marginBottom: 18, color: '#17150f', outline: 'none' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><label style={miniLabel}>Canone (€/mese)</label><input type="number" step="0.1" value={off.canone} onChange={(e) => updateOfferta(off.id, 'canone', e.target.value)} style={miniInput} /></div>
                  <div><label style={miniLabel}>Canone carta (€/anno)</label><input type="number" step="1" value={off.canoneCarta} onChange={(e) => updateOfferta(off.id, 'canoneCarta', e.target.value)} style={miniInput} /></div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: '#f5f2ec', borderRadius: 10, border: '1px solid #e6e0d4' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#47433a', flex: 1 }}>La banca paga il bollo (34,20€)?</label>
                  <button onClick={() => updateOfferta(off.id, 'bolloPagato', !off.bolloPagato)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + (off.bolloPagato ? '#2c5a43' : '#d6cfc1'), background: off.bolloPagato ? '#e1ebe3' : '#fbfaf7', color: off.bolloPagato ? '#234a37' : '#6f6a5e', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{off.bolloPagato ? 'Sì' : 'No'}</button>
                </div>

                <div style={{ padding: '12px', background: '#f5f2ec', borderRadius: 10, border: '1px solid #e6e0d4' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#47433a', textTransform: 'uppercase', marginBottom: 8 }}>Interessi su giacenza</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#6f6a5e', display: 'block', marginBottom: 3 }}>Promo (% lordo)</label><input type="number" step="0.1" value={off.tassoPromo} onChange={(e) => updateOfferta(off.id, 'tassoPromo', e.target.value)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#6f6a5e', display: 'block', marginBottom: 3 }}>Durata (mesi)</label><input type="number" value={off.durataPromo} onChange={(e) => updateOfferta(off.id, 'durataPromo', parseInt(e.target.value) || 0)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#6f6a5e', display: 'block', marginBottom: 3 }}>Standard (%)</label><input type="number" step="0.1" value={off.tasso} onChange={(e) => updateOfferta(off.id, 'tasso', e.target.value)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><label style={miniLabel}>Costo bonifico (€)</label><input type="number" step="0.1" value={off.costoBonifico} onChange={(e) => updateOfferta(off.id, 'costoBonifico', e.target.value)} style={miniInput} /></div>
                  <div><label style={miniLabel}>Costo prelievo (€)</label><input type="number" step="0.1" value={off.costoPrelievo} onChange={(e) => updateOfferta(off.id, 'costoPrelievo', e.target.value)} style={miniInput} /></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><label style={miniLabel}>Bonus benvenuto (€)</label><input type="number" value={off.bonusBenvenuto} onChange={(e) => updateOfferta(off.id, 'bonusBenvenuto', e.target.value)} style={miniInput} /></div>
                  <div><label style={miniLabel}>Cashback annuo (€)</label><input type="number" value={off.cashbackAnnuo} onChange={(e) => updateOfferta(off.id, 'cashbackAnnuo', e.target.value)} style={miniInput} /></div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: '#f5f2ec', borderRadius: 10, border: '1px solid #e6e0d4' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#47433a', flex: 1 }}>Richiede accredito stipendio?</label>
                  <button onClick={() => updateOfferta(off.id, 'richiedeStipendio', !off.richiedeStipendio)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + (off.richiedeStipendio ? '#84652d' : '#d6cfc1'), background: off.richiedeStipendio ? '#efe5cf' : '#fbfaf7', color: off.richiedeStipendio ? '#6b5124' : '#6f6a5e', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{off.richiedeStipendio ? 'Sì' : 'No'}</button>
                </div>
                {off.richiedeStipendio && !stipendioOk && <div style={{ fontSize: 11, color: '#84652d', background: '#efe5cf', padding: '8px 10px', borderRadius: 8, fontWeight: 600, border: '1px solid #d9c49b' }}>Senza stipendio accreditato questo conto perde l'azzeramento del canone</div>}
              </div>

              <div style={{ marginTop: 22, paddingTop: 20, borderTop: '2px dashed #d6cfc1', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6f6a5e', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Bilancio anno 1</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: isGuadagno ? '#2c5a43' : (isWinner ? t.primary : '#17150f'), margin: '6px 0', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {isGuadagno ? '+' : ''}€ {Math.abs(bilancio).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: 12, color: '#6f6a5e' }}>{isGuadagno ? 'Guadagno netto' : 'Costo netto'} · anno 2: {off.anno2.bilancio < 0 ? '+' : ''}€ {Math.abs(off.anno2.bilancio).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>

                <div style={{ marginTop: 14, fontSize: 11, color: '#6f6a5e', display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', background: '#f5f2ec', padding: '10px 12px', borderRadius: 8 }}>
                  {off.anno1.canoneAnnuo > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Canone conto</span><span style={{ fontWeight: 700, color: '#17150f', fontVariantNumeric: 'tabular-nums' }}>€ {off.anno1.canoneAnnuo.toFixed(0)}</span></div>}
                  {off.anno1.canoneCarta > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Canone carta</span><span style={{ fontWeight: 700, color: '#17150f', fontVariantNumeric: 'tabular-nums' }}>€ {off.anno1.canoneCarta.toFixed(0)}</span></div>}
                  {off.anno1.bollo > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bollo statale</span><span style={{ fontWeight: 700, color: '#17150f', fontVariantNumeric: 'tabular-nums' }}>€ {off.anno1.bollo.toFixed(0)}</span></div>}
                  {off.anno1.operazioni > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Commissioni operazioni</span><span style={{ fontWeight: 700, color: '#17150f', fontVariantNumeric: 'tabular-nums' }}>€ {off.anno1.operazioni.toFixed(0)}</span></div>}
                  {off.anno1.interessiNetti > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2c5a43' }}><span>Interessi netti ({off.anno1.tassoApplicato.toFixed(2)}%)</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>− € {off.anno1.interessiNetti.toFixed(0)}</span></div>}
                  {off.anno1.cashback > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2c5a43' }}><span>Cashback</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>− € {off.anno1.cashback.toFixed(0)}</span></div>}
                  {off.anno1.bonus > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2c5a43' }}><span>Bonus benvenuto</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>− € {off.anno1.bonus.toFixed(0)}</span></div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {offerte.length < 4 && (
        <button onClick={aggiungiOfferta} style={{ display: 'block', margin: '0 auto 28px', background: '#fbfaf7', border: '2px dashed #d6cfc1', color: '#47433a', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Aggiungi un conto da confrontare ({offerte.length}/4)</button>
      )}

      <p style={{ fontSize: 11, color: '#8f897c', textAlign: 'center', marginBottom: 48, lineHeight: 1.6, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
        <em><strong style={{ color: '#6f6a5e' }}>Come leggo il risultato?</strong> Il numero finale (positivo = guadagno, negativo = costo) somma tutto quello che paghi alla banca in un anno (canone, carta, commissioni operazioni) e sottrae quello che la banca ti dà (interessi netti al 74% dopo tasse, cashback, bonus). Se la tua giacenza supera i 5.000€ c'è anche il bollo statale di 34,20€/anno, a meno che la banca non lo paghi per te. Non sono incluse spese rare come F24, MAV o bollettini.</em>
      </p>


    </div>
  );
}