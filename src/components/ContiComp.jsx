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

const THEME = { primary: '#059669', soft: '#d1fae5', bg: '#ecfdf5' };

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

  const cardBase = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 };
  const miniLabel = { fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 };
  const miniInput = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums', fontSize: 14 };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

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
                    background: active ? '#fff' : '#f8fafc',
                    border: active ? `1px solid ${t.primary}` : '1px solid #e2e8f0',
                    color: active ? t.primary : '#475569',
                    padding: '10px 8px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center', lineHeight: 1.2,
                    boxShadow: active ? '0 2px 6px rgba(15,23,42,0.06)' : 'none', fontFamily: 'inherit'
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
                border: giacenza > 5000 ? `2px solid #f59e0b` : '1px solid #cbd5e1',
                borderRadius: 12, color: t.primary, boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums', outline: 'none'
              }} />
            {giacenza > 5000 && (
              <div style={{ fontSize: 11, color: '#b45309', fontWeight: 700, marginTop: 6 }}>
                ⚠️ Oltre 5.000€ scatta il bollo statale (34,20€/anno) se non pagato dalla banca
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Bonifici / mese</label>
            <input type="number" value={numBonifici} onChange={(e) => setNumBonifici(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '12px 14px', fontSize: 16, fontWeight: 700, border: '1px solid #cbd5e1', borderRadius: 12, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={labelStyle}>Prelievi / mese</label>
            <input type="number" value={numPrelievi} onChange={(e) => setNumPrelievi(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '12px 14px', fontSize: 16, fontWeight: 700, border: '1px solid #cbd5e1', borderRadius: 12, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={labelStyle}>Accrediti lo stipendio?</label>
            <div style={{ display: 'flex', background: '#f8fafc', padding: 4, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              {[{ v: true, l: 'Sì' }, { v: false, l: 'No' }].map(opt => (
                <button key={opt.l} onClick={() => setStipendioOk(opt.v)}
                  style={{
                    flex: 1, padding: '10px', border: 'none', background: stipendioOk === opt.v ? t.primary : 'transparent',
                    color: stipendioOk === opt.v ? '#fff' : '#64748b', fontWeight: 800, fontSize: 13, borderRadius: 8, cursor: 'pointer'
                  }}
                >{opt.l}</button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, lineHeight: 1.4 }}>
              Molti conti a canone zero lo azzerano solo con stipendio accreditato
            </div>
          </div>
        </div>

        {/* ============== AI EXTRACTION TOGGLE ============== */}
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px dashed #e2e8f0' }}>
          <button onClick={() => setAiOpen(!aiOpen)}
            style={{ width: '100%', background: aiOpen ? '#0f172a' : `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`, color: '#fff', border: 'none', padding: '14px 20px', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, boxShadow: '0 8px 20px -8px rgba(15,23,42,0.5)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 6, fontSize: 10, letterSpacing: '0.1em' }}>BETA</span>
              <span>✨ Compila in automatico con l'AI</span>
            </span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{aiOpen ? '✕ Chiudi' : 'Apri →'}</span>
          </button>

          {aiOpen && (
            <div style={{ marginTop: 16, background: '#0f172a', borderRadius: 16, padding: 24, color: '#fff' }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 16px', color: '#cbd5e1' }}>
                Incolla qui il foglio informativo o la pagina dei costi del conto. L'AI estrae tassi, commissioni e canoni inserendoli direttamente nel calcolatore.
              </p>

              <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.06)', padding: 4, borderRadius: 10, marginBottom: 14 }}>
                {[{ k: 'text', label: '📝 Incolla testo' }, { k: 'image', label: '📸 Carica immagine/PDF' }].map(m => (
                  <button key={m.k} onClick={() => setAiMode(m.k)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', background: aiMode === m.k ? '#fff' : 'transparent', color: aiMode === m.k ? '#0f172a' : '#94a3b8', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >{m.label}</button>
                ))}
              </div>

              {aiMode === 'text' ? (
                <textarea value={aiText} onChange={(e) => setAiText(e.target.value)}
                  placeholder="Esempio: Conto X a zero spese. Bonifici istantanei 1,50€. Prelievi gratis. Tasso del 4% annuo lordo per i primi 12 mesi..."
                  rows={5} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                />
              ) : (
                <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={(e) => setAiFile(e.target.files?.[0] || null)} style={{ color: '#cbd5e1', fontSize: 13 }} />
                  {aiFile && <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>Selezionato: <strong style={{ color: '#fff' }}>{aiFile.name}</strong> ({Math.round(aiFile.size / 1024)} KB)</div>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 700 }}>Inserisci come →</label>
                <select value={aiTargetId} onChange={(e) => setAiTargetId(parseInt(e.target.value))}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
                >
                  {offerte.map(o => <option key={o.id} value={o.id} style={{ color: '#0f172a' }}>{o.nome}</option>)}
                </select>
                <button onClick={extractAI} disabled={aiLoading}
                  style={{ marginLeft: 'auto', background: aiLoading ? '#475569' : t.primary, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: aiLoading ? 'wait' : 'pointer', boxShadow: `0 4px 12px ${t.primary}40` }}
                >
                  {aiLoading ? 'Analizzando...' : 'Estrai e compila →'}
                </button>
              </div>

              {aiError && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, fontSize: 13, color: '#fecaca' }}>⚠️ {aiError}</div>}
              {aiSuccess && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, fontSize: 13, color: '#bbf7d0' }}>✓ {aiSuccess}</div>}
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 14, lineHeight: 1.5, fontStyle: 'italic' }}>L'estrazione AI è uno strumento di assistenza: verifica sempre i campi compilati.</p>
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
            <div key={off.id} style={{ background: isWinner ? `linear-gradient(180deg, ${t.bg} 0%, #fff 60%)` : '#fff', border: `2px solid ${isWinner ? t.primary : '#e2e8f0'}`, borderRadius: 24, padding: 24, position: 'relative', boxShadow: isWinner ? `0 20px 40px -12px ${t.primary}30` : '0 4px 12px rgba(0,0,0,0.03)' }}>
              {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: t.primary, color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${t.primary}50`, letterSpacing: '0.05em' }}>🏆 SCELTA OTTIMALE</div>}
              {offerte.length > 2 && <button onClick={() => rimuoviOfferta(off.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, padding: 4 }} title="Rimuovi offerta">×</button>}
              
              <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ fontWeight: 900, fontSize: 17, border: 'none', background: 'transparent', width: '100%', paddingBottom: 12, borderBottom: '2px solid #e2e8f0', marginBottom: 18, color: '#0f172a', outline: 'none' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><label style={miniLabel}>Canone (€/mese)</label><input type="number" step="0.1" value={off.canone} onChange={(e) => updateOfferta(off.id, 'canone', e.target.value)} style={miniInput} /></div>
                  <div><label style={miniLabel}>Canone carta (€/anno)</label><input type="number" step="1" value={off.canoneCarta} onChange={(e) => updateOfferta(off.id, 'canoneCarta', e.target.value)} style={miniInput} /></div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', flex: 1 }}>La banca paga il bollo (34,20€)?</label>
                  <button onClick={() => updateOfferta(off.id, 'bolloPagato', !off.bolloPagato)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + (off.bolloPagato ? '#16a34a' : '#cbd5e1'), background: off.bolloPagato ? '#dcfce7' : '#fff', color: off.bolloPagato ? '#166534' : '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{off.bolloPagato ? 'Sì' : 'No'}</button>
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>Interessi su giacenza</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Promo (% lordo)</label><input type="number" step="0.1" value={off.tassoPromo} onChange={(e) => updateOfferta(off.id, 'tassoPromo', e.target.value)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Durata (mesi)</label><input type="number" value={off.durataPromo} onChange={(e) => updateOfferta(off.id, 'durataPromo', parseInt(e.target.value) || 0)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Standard (%)</label><input type="number" step="0.1" value={off.tasso} onChange={(e) => updateOfferta(off.id, 'tasso', e.target.value)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
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

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', flex: 1 }}>Richiede accredito stipendio?</label>
                  <button onClick={() => updateOfferta(off.id, 'richiedeStipendio', !off.richiedeStipendio)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + (off.richiedeStipendio ? '#d97706' : '#cbd5e1'), background: off.richiedeStipendio ? '#fef3c7' : '#fff', color: off.richiedeStipendio ? '#92400e' : '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{off.richiedeStipendio ? 'Sì' : 'No'}</button>
                </div>
                {off.richiedeStipendio && !stipendioOk && <div style={{ fontSize: 11, color: '#b45309', background: '#fef3c7', padding: '8px 10px', borderRadius: 8, fontWeight: 600, border: '1px solid #fcd34d' }}>⚠️ Senza stipendio accreditato questo conto perde l'azzeramento del canone</div>}
              </div>

              <div style={{ marginTop: 22, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Bilancio anno 1</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: isGuadagno ? '#059669' : (isWinner ? t.primary : '#0f172a'), margin: '6px 0', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {isGuadagno ? '+' : ''}€ {Math.abs(bilancio).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{isGuadagno ? 'Guadagno netto' : 'Costo netto'} · anno 2: {off.anno2.bilancio < 0 ? '+' : ''}€ {Math.abs(off.anno2.bilancio).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>

                <div style={{ marginTop: 14, fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', background: '#f8fafc', padding: '10px 12px', borderRadius: 8 }}>
                  {off.anno1.canoneAnnuo > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Canone conto</span><span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {off.anno1.canoneAnnuo.toFixed(0)}</span></div>}
                  {off.anno1.canoneCarta > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Canone carta</span><span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {off.anno1.canoneCarta.toFixed(0)}</span></div>}
                  {off.anno1.bollo > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bollo statale</span><span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {off.anno1.bollo.toFixed(0)}</span></div>}
                  {off.anno1.operazioni > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Commissioni operazioni</span><span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {off.anno1.operazioni.toFixed(0)}</span></div>}
                  {off.anno1.interessiNetti > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}><span>Interessi netti ({off.anno1.tassoApplicato.toFixed(2)}%)</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>− € {off.anno1.interessiNetti.toFixed(0)}</span></div>}
                  {off.anno1.cashback > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}><span>Cashback</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>− € {off.anno1.cashback.toFixed(0)}</span></div>}
                  {off.anno1.bonus > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}><span>Bonus benvenuto</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>− € {off.anno1.bonus.toFixed(0)}</span></div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {offerte.length < 4 && (
        <button onClick={aggiungiOfferta} style={{ display: 'block', margin: '0 auto 28px', background: '#fff', border: '2px dashed #cbd5e1', color: '#475569', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Aggiungi un conto da confrontare ({offerte.length}/4)</button>
      )}

      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 48, lineHeight: 1.6, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
        <em><strong style={{ color: '#64748b' }}>Come leggo il risultato?</strong> Il numero finale (positivo = guadagno, negativo = costo) somma tutto quello che paghi alla banca in un anno (canone, carta, commissioni operazioni) e sottrae quello che la banca ti dà (interessi netti al 74% dopo tasse, cashback, bonus). Se la tua giacenza supera i 5.000€ c'è anche il bollo statale di 34,20€/anno, a meno che la banca non lo paghi per te. Non sono incluse spese rare come F24, MAV o bollettini.</em>
      </p>

      {/* ==================================================================
          BLOCCO 3 — AFFILIATE (riscritto per compliance)
          ================================================================== */}
      <div style={{
        background: '#fff', border: '2px solid #0f172a', borderRadius: 24,
        padding: '36px 28px 32px', position: 'relative',
        boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.18)'
      }}>
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.15em',
          padding: '6px 18px', borderRadius: 30, whiteSpace: 'nowrap'
        }}>★ La selezione del Team</div>

        <p style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 32, marginTop: 18, lineHeight: 1.6, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Due conti selezionati dal nostro team — uno per massimizzare il rendimento sulla giacenza, uno per azzerare le commissioni operative.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

          {/* ========== CARD 1: BBVA ========== */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 20, padding: '24px 22px', position: 'relative'
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <span style={{
                background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 800,
                letterSpacing: '0.1em', padding: '4px 8px', borderRadius: 4, border: '1px solid #fcd34d'
              }}>#ADV</span>
              <span style={{
                background: '#fff', color: '#475569', fontSize: 10, fontWeight: 700,
                padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0'
              }}>Link affiliato</span>
            </div>

            <div style={{
              background: '#004481', color: '#fff', fontSize: 10, fontWeight: 800,
              textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20,
              display: 'inline-block', marginBottom: 12, letterSpacing: '0.08em'
            }}>Categoria: rendimento giacenza</div>

            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              BBVA Italia
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', fontFamily: "'DM Serif Display', 'Playfair Display', serif" }}>
              Conto Online
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>
              Selezionato il <strong>15 ottobre 2025</strong>
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
              background: '#e2e8f0', borderRadius: 12, overflow: 'hidden',
              marginBottom: 16, border: '1px solid #e2e8f0'
            }}>
              {[
                { l: 'Canone', v: '0 €', h: true },
                { l: 'Interessi', v: '3,00%', h: true },
                { l: 'Bollo', v: 'Escluso', h: false },
                { l: 'Durata promo', v: '12 mesi', h: false },
                { l: 'Operazioni', v: 'Gratis', h: true },
                { l: 'Richiede stipendio', v: 'No', h: true }
              ].map((item, i) => (
                <div key={i} style={{ background: '#fff', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{item.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: item.h ? '#16a34a' : '#0f172a' }}>{item.v}</div>
                </div>
              ))}
            </div>

            <a href="/recensione-bbva" style={{
              display: 'block', background: '#fff', color: '#0f172a',
              border: '2px solid #0f172a', padding: '12px', borderRadius: 10,
              fontWeight: 800, fontSize: 13, textDecoration: 'none',
              textAlign: 'center', marginBottom: 8
            }}>📖 Leggi l'analisi del team →</a>
            <a href="https://www.financeads.net/tc.php?t=82784C5581131019T"
              target="_blank" rel="noopener noreferrer sponsored nofollow"
              style={{
                display: 'block', background: '#004481', color: '#fff',
                padding: '12px', borderRadius: 10, fontWeight: 800, fontSize: 13,
                textDecoration: 'none', textAlign: 'center'
              }}>Vai al sito BBVA →</a>
          </div>

          {/* ========== CARD 2: HYPE ========== */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 20, padding: '24px 22px', position: 'relative'
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <span style={{
                background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 800,
                letterSpacing: '0.1em', padding: '4px 8px', borderRadius: 4, border: '1px solid #fcd34d'
              }}>#ADV</span>
              <span style={{
                background: '#fff', color: '#475569', fontSize: 10, fontWeight: 700,
                padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0'
              }}>Link affiliato</span>
            </div>

            <div style={{
              background: '#00AEFF', color: '#fff', fontSize: 10, fontWeight: 800,
              textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20,
              display: 'inline-block', marginBottom: 12, letterSpacing: '0.08em'
            }}>Categoria: operatività mobile</div>

            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Hype (gruppo illimity)
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', fontFamily: "'DM Serif Display', 'Playfair Display', serif" }}>
              Carta conto con 3 piani
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>
              Selezionato il <strong>15 ottobre 2025</strong>
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
              background: '#e2e8f0', borderRadius: 12, overflow: 'hidden',
              marginBottom: 16, border: '1px solid #e2e8f0'
            }}>
              {[
                { l: 'Canone base', v: '0 €', h: true },
                { l: 'Bonus benvenuto', v: 'Fino 25 €', h: true },
                { l: 'Bollo', v: 'Incluso', h: true },
                { l: 'Interessi', v: 'Nessuno', h: false },
                { l: 'Prelievi', v: 'Gratis*', h: true },
                { l: 'Gestione', v: 'App-only', h: false }
              ].map((item, i) => (
                <div key={i} style={{ background: '#fff', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{item.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: item.h ? '#16a34a' : '#0f172a' }}>{item.v}</div>
                </div>
              ))}
            </div>

            <a href="/recensione-hype" style={{
              display: 'block', background: '#fff', color: '#0f172a',
              border: '2px solid #0f172a', padding: '12px', borderRadius: 10,
              fontWeight: 800, fontSize: 13, textDecoration: 'none',
              textAlign: 'center', marginBottom: 8
            }}>📖 Confronta i 3 piani nell'analisi →</a>
            <a href="https://www.financeads.net/tc.php?t=82784C257247700T"
              target="_blank" rel="noopener noreferrer sponsored nofollow"
              style={{
                display: 'block', background: '#00AEFF', color: '#fff',
                padding: '12px', borderRadius: 10, fontWeight: 800, fontSize: 13,
                textDecoration: 'none', textAlign: 'center'
              }}>Vai al sito Hype →</a>
          </div>

        </div>

        {/* Disclaimer compliant */}
        <div style={{
          background: '#fafbfc', border: '1px solid #e2e8f0',
          borderRadius: 12, padding: '14px 16px', marginTop: 20
        }}>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: '#0f172a' }}>Trasparenza commerciale.</strong> Questa sezione contiene link di affiliazione: se apri un conto attraverso i nostri collegamenti, riceviamo una commissione dall'istituto senza alcun costo aggiuntivo per te.
            La selezione editoriale è indipendente e non determinata dall'importo della commissione: la metodologia di valutazione è descritta nelle analisi linkate sopra.
            Le condizioni indicate (canoni, tassi, bonus, condizioni operative) sono quelle pubblicate dagli istituti alla data riportata su ciascuna scheda; verifica sempre le condizioni aggiornate sul sito ufficiale prima di sottoscrivere.
            *Gratuità dei prelievi Hype soggetta alle condizioni del piano scelto.
          </p>
        </div>
      </div>

    </div>
  );
}