import React, { useState, useMemo, useRef } from 'react';

// ============================================================================
// RC AUTO — CALCOLATORE OTTIMIZZATO
// ============================================================================

const PRESETS_COPERTURA = [
  { label: 'Solo Base', sub: 'auto vecchia', base: true, furto: false, cristalli: false, assistenza: false, infortuni: false, scatola: false },
  { label: 'Standard', sub: 'il minimo utile', base: true, furto: false, cristalli: true, assistenza: true, infortuni: true, scatola: false },
  { label: 'Full Optional', sub: 'auto nuova', base: true, furto: true, cristalli: true, assistenza: true, infortuni: true, scatola: false }
];

const DEFAULT_OFFERS = [
  {
    id: 1, nome: 'Compagnia A (Preventivo 1)',
    premioBase: '350',
    costoFurto: '120', costoCristalli: '40', costoAssistenza: '20', costoInfortuni: '35',
    scontoScatola: '40', franchigiaBase: '0',
    sospendibile: true
  },
  {
    id: 2, nome: 'Compagnia B (Preventivo 2)',
    premioBase: '290',
    costoFurto: '150', costoCristalli: '55', costoAssistenza: '15', costoInfortuni: '45',
    scontoScatola: '0', franchigiaBase: '250',
    sospendibile: false
  }
];

const THEME = { primary: '#e11d48', soft: '#ffe4e6', bg: '#fff1f2' };

// ============================================================================
// MOTORE DI CALCOLO
// ============================================================================

function calcolaPremio(off, coperture) {
  var base = parseFloat(off.premioBase) || 0;
  var furto = parseFloat(off.costoFurto) || 0;
  var cristalli = parseFloat(off.costoCristalli) || 0;
  var assistenza = parseFloat(off.costoAssistenza) || 0;
  var infortuni = parseFloat(off.costoInfortuni) || 0;
  var scontoScatola = parseFloat(off.scontoScatola) || 0;

  var totaleGaranzie = 0;
  if (coperture.furto) totaleGaranzie += furto;
  if (coperture.cristalli) totaleGaranzie += cristalli;
  if (coperture.assistenza) totaleGaranzie += assistenza;
  if (coperture.infortuni) totaleGaranzie += infortuni;

  var totaleSconti = 0;
  if (coperture.scatola) totaleSconti += scontoScatola;

  var premioFinale = base + totaleGaranzie - totaleSconti;
  if (premioFinale < 0) premioFinale = 0;

  return {
    base,
    totaleGaranzie,
    totaleSconti,
    premioFinale
  };
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function RCAutoComp() {
  const [coperture, setCoperture] = useState(PRESETS_COPERTURA[1]); 
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

  const t = THEME;

  const risultati = useMemo(
    () => offerte.map(off => ({
      ...off,
      calc: calcolaPremio(off, coperture)
    })),
    [offerte, coperture]
  );

  const validPremi = risultati.map(r => r.calc.premioFinale).filter(p => p > 0);
  const minPremio = validPremi.length > 0 ? Math.min(...validPremi) : 0;

  const updateOfferta = (id, field, value) =>
    setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));

  const aggiungiOfferta = () => {
    if (offerte.length >= 4) return;
    const nextId = Math.max(...offerte.map(o => o.id)) + 1;
    setOfferte([...offerte, {
      id: nextId, nome: `Nuovo Preventivo #${nextId}`,
      premioBase: '300', costoFurto: '0', costoCristalli: '0', costoAssistenza: '0', costoInfortuni: '0',
      scontoScatola: '0', franchigiaBase: '0', sospendibile: false
    }]);
  };

  const rimuoviOfferta = (id) => {
    if (offerte.length <= 2) return;
    setOfferte(offerte.filter(o => o.id !== id));
  };

  const toggleCopertura = (campo) => {
    setCoperture({ ...coperture, [campo]: !coperture[campo] });
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
        if (!aiText.trim()) throw new Error('Incolla prima il testo del preventivo.');
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ mode: 'text', text: aiText });
      } else {
        if (!aiFile) throw new Error('Seleziona prima un file (immagine o PDF).');
        body = new FormData();
        body.append('mode', 'image');
        body.append('file', aiFile);
      }

      const res = await fetch('/api/extract-rcauto', { method: 'POST', headers, body });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error ? `${data.error}: ${data.detail}` : `Errore ${res.status}`);
      }

      setOfferte(prev => prev.map(o => {
        if (o.id !== aiTargetId) return o;
        return {
          ...o,
          nome: data.nome || o.nome,
          premioBase: data.premioBase != null ? String(data.premioBase) : o.premioBase,
          costoFurto: data.costoFurto != null ? String(data.costoFurto) : o.costoFurto,
          costoCristalli: data.costoCristalli != null ? String(data.costoCristalli) : o.costoCristalli,
          costoAssistenza: data.costoAssistenza != null ? String(data.costoAssistenza) : o.costoAssistenza,
          costoInfortuni: data.costoInfortuni != null ? String(data.costoInfortuni) : o.costoInfortuni,
          scontoScatola: data.scontoScatola != null ? String(data.scontoScatola) : o.scontoScatola,
          franchigiaBase: data.franchigiaBase != null ? String(data.franchigiaBase) : o.franchigiaBase,
          sospendibile: data.sospendibile ?? o.sospendibile
        };
      }));

      setAiSuccess('Dati estratti con successo! Verifica i campi inseriti.');
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

  const ToggleBtn = ({ active, label, onClick }) => (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 14px', borderRadius: 12, border: active ? `2px solid ${t.primary}` : '1px solid #cbd5e1',
      background: active ? t.soft : '#fff', color: active ? t.primary : '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer',
      boxShadow: active ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s'
    }}>
      <div style={{ fontSize: 16, marginBottom: 4 }}>{active ? '✅' : '⬜'}</div>
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      <div style={{ ...cardBase, marginBottom: 28, padding: '36px 32px' }}>
        <style dangerouslySetInnerHTML={{__html:`
          .rc-presets { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
          .rc-garanzie { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; }
          @media(max-width:500px){
            .rc-presets { gap:6px; }
            .rc-presets button { padding:8px 6px !important; font-size:12px !important; }
            .rc-garanzie { grid-template-columns:repeat(2,1fr); gap:6px; }
            .rc-garanzie button { padding:8px 6px !important; font-size:11px !important; }
          }
        `}}/>
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Pacchetti coperture veloci</label>
          <div className="rc-presets">
            {PRESETS_COPERTURA.map(p => {
              const active = coperture.label === p.label;
              return (
                <button key={p.label} onClick={() => setCoperture(p)}
                  style={{
                    background: active ? '#fff' : '#f8fafc', border: active ? `1px solid ${t.primary}` : '1px solid #e2e8f0',
                    color: active ? t.primary : '#475569', padding: '10px 8px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center', lineHeight: 1.2,
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

        <div>
          <label style={labelStyle}>Quali garanzie accessorie vuoi includere nel calcolo?</label>
          <div className="rc-garanzie">
            <ToggleBtn active={coperture.furto} label="Furto e Incendio" onClick={() => toggleCopertura('furto')} />
            <ToggleBtn active={coperture.cristalli} label="Cristalli" onClick={() => toggleCopertura('cristalli')} />
            <ToggleBtn active={coperture.assistenza} label="Assistenza Stradale" onClick={() => toggleCopertura('assistenza')} />
            <ToggleBtn active={coperture.infortuni} label="Infortuni Conducente" onClick={() => toggleCopertura('infortuni')} />
            <ToggleBtn active={coperture.scatola} label="Sconto Scatola Nera" onClick={() => toggleCopertura('scatola')} />
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 14, lineHeight: 1.5 }}>
            Accendi o spegni le garanzie: il calcolatore aggiornerà il premio finale in tempo reale su tutti i preventivi, permettendoti di confrontare pacchetti identici.
          </p>
        </div>

        {/* ============== AI EXTRACTION TOGGLE ============== */}
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px dashed #e2e8f0' }}>
          <button onClick={() => setAiOpen(!aiOpen)}
            style={{ width: '100%', background: aiOpen ? '#0f172a' : `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`, color: '#fff', border: 'none', padding: '14px 20px', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, boxShadow: '0 8px 20px -8px rgba(15,23,42,0.5)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 6, fontSize: 10, letterSpacing: '0.1em' }}>BETA</span>
              <span>✨ Inserisci un preventivo con l'AI</span>
            </span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{aiOpen ? '✕ Chiudi' : 'Apri →'}</span>
          </button>

          {aiOpen && (
            <div style={{ marginTop: 16, background: '#0f172a', borderRadius: 16, padding: 24, color: '#fff' }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 16px', color: '#cbd5e1' }}>
                Carica lo screenshot o il PDF di un preventivo (es. Prima, ConTe, Segugio). L'AI estrarrà il premio base e il costo delle singole garanzie accessorie per inserirle nel confronto.
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
                  placeholder="Esempio: Premio base RCA 280€. Furto e incendio 120€. Assistenza stradale 25€. Sconto scatola nera -30€..."
                  rows={5} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                />
              ) : (
                <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={(e) => setAiFile(e.target.files?.[0] || null)} style={{ color: '#cbd5e1', fontSize: 13 }} />
                  {aiFile && <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>Selezionato: <strong style={{ color: '#fff' }}>{aiFile.name}</strong></div>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 700 }}>Salva in →</label>
                <select value={aiTargetId} onChange={(e) => setAiTargetId(parseInt(e.target.value))}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
                >
                  {offerte.map(o => <option key={o.id} value={o.id} style={{ color: '#0f172a' }}>{o.nome}</option>)}
                </select>
                <button onClick={extractAI} disabled={aiLoading}
                  style={{ marginLeft: 'auto', background: aiLoading ? '#475569' : t.primary, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: aiLoading ? 'wait' : 'pointer', boxShadow: `0 4px 12px ${t.primary}40` }}
                >
                  {aiLoading ? 'Estrazione in corso...' : 'Estrai preventivo →'}
                </button>
              </div>

              {aiError && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, fontSize: 13, color: '#fecaca' }}>⚠️ {aiError}</div>}
              {aiSuccess && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, fontSize: 13, color: '#bbf7d0' }}>✓ {aiSuccess}</div>}
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 14, lineHeight: 1.5, fontStyle: 'italic' }}>L'estrazione AI è sperimentale: verifica sempre che i costi delle garanzie combacino con il PDF.</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${offerte.length > 2 ? '290px' : '320px'}, 1fr))`, gap: 20, marginBottom: 16 }}>
        {risultati.map(off => {
          const isWinner = off.calc.premioFinale === minPremio && off.calc.premioFinale > 0 && offerte.length > 1;

          return (
            <div key={off.id} style={{ background: isWinner ? `linear-gradient(180deg, ${t.bg} 0%, #fff 60%)` : '#fff', border: `2px solid ${isWinner ? t.primary : '#e2e8f0'}`, borderRadius: 24, padding: 24, position: 'relative', boxShadow: isWinner ? `0 20px 40px -12px ${t.primary}30` : '0 4px 12px rgba(0,0,0,0.03)' }}>
              {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: t.primary, color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${t.primary}50`, letterSpacing: '0.05em' }}>🏆 PREVENTIVO MIGLIORE</div>}
              {offerte.length > 2 && <button onClick={() => rimuoviOfferta(off.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, padding: 4 }} title="Rimuovi preventivo">×</button>}
              
              <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ fontWeight: 900, fontSize: 17, border: 'none', background: 'transparent', width: '100%', paddingBottom: 12, borderBottom: '2px solid #e2e8f0', marginBottom: 18, color: '#0f172a', outline: 'none' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Premio RCA Base</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>€</span>
                    <input type="number" step="1" value={off.premioBase} onChange={(e) => updateOfferta(off.id, 'premioBase', e.target.value)} style={{ ...miniInput, fontSize: 16, fontWeight: 800 }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ opacity: coperture.furto ? 1 : 0.4, transition: '0.2s' }}>
                    <label style={miniLabel}>Furto/Incendio (€)</label>
                    <input type="number" value={off.costoFurto} onChange={(e) => updateOfferta(off.id, 'costoFurto', e.target.value)} style={miniInput} disabled={!coperture.furto} />
                  </div>
                  <div style={{ opacity: coperture.cristalli ? 1 : 0.4, transition: '0.2s' }}>
                    <label style={miniLabel}>Cristalli (€)</label>
                    <input type="number" value={off.costoCristalli} onChange={(e) => updateOfferta(off.id, 'costoCristalli', e.target.value)} style={miniInput} disabled={!coperture.cristalli} />
                  </div>
                  <div style={{ opacity: coperture.assistenza ? 1 : 0.4, transition: '0.2s' }}>
                    <label style={miniLabel}>Assistenza (€)</label>
                    <input type="number" value={off.costoAssistenza} onChange={(e) => updateOfferta(off.id, 'costoAssistenza', e.target.value)} style={miniInput} disabled={!coperture.assistenza} />
                  </div>
                  <div style={{ opacity: coperture.infortuni ? 1 : 0.4, transition: '0.2s' }}>
                    <label style={miniLabel}>Infortuni Cond. (€)</label>
                    <input type="number" value={off.costoInfortuni} onChange={(e) => updateOfferta(off.id, 'costoInfortuni', e.target.value)} style={miniInput} disabled={!coperture.infortuni} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ opacity: coperture.scatola ? 1 : 0.4, transition: '0.2s' }}>
                    <label style={miniLabel}>Sconto Scatola (€)</label>
                    <input type="number" value={off.scontoScatola} onChange={(e) => updateOfferta(off.id, 'scontoScatola', e.target.value)} style={{ ...miniInput, color: '#16a34a', fontWeight: 800 }} disabled={!coperture.scatola} />
                  </div>
                  <div>
                    <label style={miniLabel}>Franchigia Base (€)</label>
                    <input type="number" value={off.franchigiaBase} onChange={(e) => updateOfferta(off.id, 'franchigiaBase', e.target.value)} style={miniInput} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', flex: 1 }}>Polizza Sospendibile?</label>
                  <button onClick={() => updateOfferta(off.id, 'sospendibile', !off.sospendibile)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + (off.sospendibile ? '#16a34a' : '#cbd5e1'), background: off.sospendibile ? '#dcfce7' : '#fff', color: off.sospendibile ? '#166534' : '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{off.sospendibile ? 'Sì' : 'No'}</button>
                </div>
              </div>

              <div style={{ marginTop: 22, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Premio Totale Annuo</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: isWinner ? t.primary : '#0f172a', margin: '6px 0', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {formatEuro(off.calc.premioFinale)}
                </div>

                <div style={{ marginTop: 14, fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', background: '#f8fafc', padding: '10px 12px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Premio RCA Base</span><span style={{ fontWeight: 700, color: '#0f172a' }}>€ {off.calc.base.toFixed(0)}</span></div>
                  {off.calc.totaleGaranzie > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Totale {Object.values(coperture).filter(v=>v===true).length - 1} Garanzie incluse</span><span style={{ fontWeight: 700, color: '#0f172a' }}>+ € {off.calc.totaleGaranzie.toFixed(0)}</span></div>}
                  {off.calc.totaleSconti > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}><span>Sconti applicati</span><span style={{ fontWeight: 700 }}>− € {off.calc.totaleSconti.toFixed(0)}</span></div>}
                  {parseFloat(off.franchigiaBase) > 0 && <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e2e8f0', color: '#b45309' }}>⚠️ Attenzione: franchigia/scoperto di € {off.franchigiaBase} a carico tuo in caso di sinistro.</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {offerte.length < 4 && (
        <button onClick={aggiungiOfferta} style={{ display: 'block', margin: '0 auto 28px', background: '#fff', border: '2px dashed #cbd5e1', color: '#475569', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Aggiungi un preventivo da confrontare ({offerte.length}/4)</button>
      )}

      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 48, lineHeight: 1.6, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
        <em>Il calcolatore elabora unicamente i parametri inseriti. Ricorda che il premio finale in un preventivo RC Auto dipende dalla tua Classe di Merito (Bonus/Malus), dai massimali scelti per la RCA e dalla presenza di scoperti e franchigie sulle garanzie accessorie (come il Furto e Incendio o gli Eventi Naturali). Verifica sempre il Set Informativo precontrattuale (DIP) sul sito della Compagnia.</em>
      </p>

    </div>
  );
}