import React, { useState, useMemo, useRef } from 'react';

// ============================================================================
// INTERNET / FIBRA — CALCOLATORE OTTIMIZZATO
// ============================================================================

const PRESETS_PERMANENZA = [
  { label: '1 Anno', val: 12, sub: 'cambio spesso' },
  { label: '2 Anni', val: 24, sub: 'profilo standard' },
  { label: '4 Anni', val: 48, sub: 'fedeltà massima' }
];

const DEFAULT_OFFERS = [
  {
    id: 1, nome: 'Offerta "Promo" (es. WindTre)',
    canonePromo: '19.99', durataPromo: 12, canonePieno: '26.99',
    attivazione: '47.76', rataModem: '5.99', durataModem: 48,
    penaleRecesso: '25', velocita: '2.5 Gbps FTTH', serviziInclusi: 'Modem Wi-Fi 7, Amazon Prime 12 mesi'
  },
  {
    id: 2, nome: 'Alternativa trasparente (es. Iliad)',
    canonePromo: '24.99', durataPromo: 0, canonePieno: '24.99',
    attivazione: '39.99', rataModem: '0', durataModem: 0,
    penaleRecesso: '0', velocita: '5 Gbps FTTH', serviziInclusi: 'Modem incluso, no vincoli'
  }
];

const THEME = { primary: '#7c3aed', soft: '#ede9fe', bg: '#faf5ff' };

// ============================================================================
// MOTORE DI CALCOLO
// ============================================================================

function calcolaCosti(off, permanenza) {
  var canonePromo = parseFloat(off.canonePromo) || 0;
  var durataPromo = parseInt(off.durataPromo) || 0;
  var canonePieno = parseFloat(off.canonePieno) || canonePromo;
  var attivazione = parseFloat(off.attivazione) || 0;
  var rataModem = parseFloat(off.rataModem) || 0;
  var durataModem = parseInt(off.durataModem) || 0;
  var penale = parseFloat(off.penaleRecesso) || 0;

  var mesiPromo = Math.min(permanenza, durataPromo);
  var mesiPieno = Math.max(0, permanenza - durataPromo);
  var totCanoni = canonePromo * mesiPromo + canonePieno * mesiPieno;

  var totModem = durataModem > 0 ? rataModem * durataModem : 0;
  var penaleApplicata = (durataModem > 0 && permanenza < durataModem) ? penale : 0;

  var totale = totCanoni + attivazione + totModem + penaleApplicata;
  var mensileEffettivo = permanenza > 0 ? totale / permanenza : 0;

  return {
    totCanoni, mesiPromo, mesiPieno, attivazione,
    totModem, penaleApplicata, totale, mensileEffettivo
  };
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function InternetComp() {
  const [permanenzaStr, setPermanenzaStr] = useState('24');
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

  const permanenza = parseInt(permanenzaStr) || 12;
  const t = THEME;

  const risultati = useMemo(
    () => offerte.map(off => ({
      ...off,
      calc: calcolaCosti(off, permanenza),
      calc12: calcolaCosti(off, 12),
      calc24: calcolaCosti(off, 24)
    })),
    [offerte, permanenza]
  );

  const minMensile = Math.min(...risultati.map(r => r.calc.mensileEffettivo));

  const updateOfferta = (id, field, value) =>
    setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));

  const aggiungiOfferta = () => {
    if (offerte.length >= 4) return;
    const nextId = Math.max(...offerte.map(o => o.id)) + 1;
    setOfferte([...offerte, {
      id: nextId, nome: `Offerta #${nextId}`,
      canonePromo: '24.99', durataPromo: 0, canonePieno: '24.99',
      attivazione: '0', rataModem: '0', durataModem: 0,
      penaleRecesso: '0', velocita: '', serviziInclusi: ''
    }]);
  };

  const rimuoviOfferta = (id) => {
    if (offerte.length <= 2) return;
    setOfferte(offerte.filter(o => o.id !== id));
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
        if (!aiText.trim()) throw new Error('Incolla prima il testo del contratto.');
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ mode: 'text', text: aiText });
      } else {
        if (!aiFile) throw new Error('Seleziona prima un file (immagine o PDF).');
        body = new FormData();
        body.append('mode', 'image');
        body.append('file', aiFile);
      }

      const res = await fetch('/api/extract-internet', { method: 'POST', headers, body });
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
          canonePromo: data.canonePromo != null ? String(data.canonePromo) : o.canonePromo,
          durataPromo: data.durataPromo ?? o.durataPromo,
          canonePieno: data.canonePieno != null ? String(data.canonePieno) : o.canonePieno,
          attivazione: data.attivazione != null ? String(data.attivazione) : o.attivazione,
          rataModem: data.rataModem != null ? String(data.rataModem) : o.rataModem,
          durataModem: data.durataModem ?? o.durataModem,
          penaleRecesso: data.penaleRecesso != null ? String(data.penaleRecesso) : o.penaleRecesso,
          velocita: data.velocita ?? o.velocita,
          serviziInclusi: data.serviziInclusi ?? o.serviziInclusi
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

  const formatEuro = (v, decimals) => {
    var d = typeof decimals === 'number' ? decimals : 2;
    return '€ ' + v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  const cardBase = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 };
  const miniLabel = { fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 };
  const miniInput = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums', fontSize: 14 };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      <style dangerouslySetInnerHTML={{__html:`
        @media(max-width:500px){
          .inet-wrap input[type=number] { width:100% !important; font-size:18px !important; }
          .inet-wrap button { padding:6px 8px !important; font-size:11px !important; }
        }
      `}}/>

      <div className="inet-wrap" style={{ ...cardBase, marginBottom: 28, padding: '36px 32px' }}>
        <label style={labelStyle}>Per quanti mesi terrai il contratto?</label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', background: '#f8fafc', padding: 6, borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <input type="number" value={permanenzaStr} onChange={(e) => setPermanenzaStr(e.target.value)}
            style={{ width: 120, padding: '10px 14px', fontSize: 20, border: '1px solid #cbd5e1', borderRadius: 12, fontWeight: 800, color: t.primary, background: '#fff', fontVariantNumeric: 'tabular-nums', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {PRESETS_PERMANENZA.map(p => {
              const active = permanenza === p.val;
              return (
                <button key={p.label} onClick={() => setPermanenzaStr(p.val.toString())}
                  style={{ background: active ? '#fff' : 'transparent', border: active ? `1px solid ${t.primary}` : '1px solid transparent', color: active ? t.primary : '#64748b', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'left', lineHeight: 1.2, boxShadow: active ? '0 2px 6px rgba(15,23,42,0.06)' : 'none' }}
                >
                  <div>{p.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>{p.sub}</div>
                </button>
              );
            })}
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 14, lineHeight: 1.5 }}>
          Il calcolatore stima il costo <strong>totale</strong> includendo canoni promo, canoni pieni, attivazione, rate modem ed eventuale penale di recesso anticipato.
        </p>

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
                Incolla qui la sintesi contrattuale dell'offerta internet/mobile. L'AI estrae rate del modem, attivazione, canone e vincoli inserendoli direttamente nel calcolatore.
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
                  placeholder="Esempio: Fibra a 19.99€ al mese per 12 mesi, poi 25.99€. Attivazione 39,90€. Modem incluso a 5,99€ per 48 mesi..."
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

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${offerte.length > 2 ? '290px' : '320px'}, 1fr))`, gap: 20, marginBottom: 16 }}>
        {risultati.map(off => {
          const isWinner = off.calc.mensileEffettivo === minMensile && off.calc.mensileEffettivo > 0 && offerte.length > 1;

          return (
            <div key={off.id} style={{ background: isWinner ? `linear-gradient(180deg, ${t.bg} 0%, #fff 60%)` : '#fff', border: `2px solid ${isWinner ? t.primary : '#e2e8f0'}`, borderRadius: 24, padding: 24, position: 'relative', boxShadow: isWinner ? `0 20px 40px -12px ${t.primary}30` : '0 4px 12px rgba(0,0,0,0.03)' }}>
              {isWinner && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: t.primary, color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${t.primary}50`, letterSpacing: '0.05em' }}>🏆 MIGLIOR RAPPORTO</div>}
              {offerte.length > 2 && <button onClick={() => rimuoviOfferta(off.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, padding: 4 }} title="Rimuovi offerta">×</button>}
              
              <input type="text" value={off.nome} onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)} style={{ fontWeight: 900, fontSize: 17, border: 'none', background: 'transparent', width: '100%', paddingBottom: 12, borderBottom: '2px solid #e2e8f0', marginBottom: 18, color: '#0f172a', outline: 'none' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>Canone mensile</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Promo (€)</label><input type="number" step="0.01" value={off.canonePromo} onChange={(e) => updateOfferta(off.id, 'canonePromo', e.target.value)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Durata (mesi)</label><input type="number" value={off.durataPromo} onChange={(e) => updateOfferta(off.id, 'durataPromo', parseInt(e.target.value) || 0)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Pieno (€)</label><input type="number" step="0.01" value={off.canonePieno} onChange={(e) => updateOfferta(off.id, 'canonePieno', e.target.value)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
                  </div>
                  {parseFloat(off.canonePieno) > parseFloat(off.canonePromo) && parseInt(off.durataPromo) > 0 && permanenza > parseInt(off.durataPromo) && (
                    <div style={{ fontSize: 11, color: '#b45309', marginTop: 8, fontWeight: 600, background: '#fef3c7', padding: '6px 8px', borderRadius: 6, border: '1px solid #fcd34d' }}>⚠️ Dopo {off.durataPromo} mesi il canone sale a € {parseFloat(off.canonePieno).toFixed(2)}/mese</div>
                  )}
                </div>

                <div><label style={miniLabel}>Attivazione una tantum (€)</label><input type="number" step="0.01" value={off.attivazione} onChange={(e) => updateOfferta(off.id, 'attivazione', e.target.value)} style={miniInput} /></div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>Rate modem / contributo</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Rata (€/mese)</label><input type="number" step="0.01" value={off.rataModem} onChange={(e) => updateOfferta(off.id, 'rataModem', e.target.value)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
                    <div><label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 3 }}>Durata (mesi)</label><input type="number" value={off.durataModem} onChange={(e) => updateOfferta(off.id, 'durataModem', parseInt(e.target.value) || 0)} style={{ ...miniInput, padding: '8px 10px', fontSize: 13 }} /></div>
                  </div>
                  {parseInt(off.durataModem) > 0 && permanenza < parseInt(off.durataModem) && (
                    <div style={{ fontSize: 11, color: '#b45309', marginTop: 8, fontWeight: 600, background: '#fef3c7', padding: '6px 8px', borderRadius: 6, border: '1px solid #fcd34d' }}>⚠️ Disdicendo dopo {permanenza} mesi saldi in unica soluzione il residuo di {parseInt(off.durataModem) - permanenza} rate</div>
                  )}
                </div>

                <div><label style={miniLabel}>Penale recesso anticipato (€)</label><input type="number" value={off.penaleRecesso} onChange={(e) => updateOfferta(off.id, 'penaleRecesso', e.target.value)} style={miniInput} /></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                  <div><label style={miniLabel}>Velocità dichiarata</label><input type="text" value={off.velocita} onChange={(e) => updateOfferta(off.id, 'velocita', e.target.value)} placeholder="es. 2.5 Gbps FTTH" style={{ ...miniInput, fontVariantNumeric: 'normal' }} /></div>
                  <div><label style={miniLabel}>Servizi inclusi</label><input type="text" value={off.serviziInclusi} onChange={(e) => updateOfferta(off.id, 'serviziInclusi', e.target.value)} placeholder="es. Prime, DAZN, modem Wi-Fi 7" style={{ ...miniInput, fontVariantNumeric: 'normal' }} /></div>
                </div>
              </div>

              <div style={{ marginTop: 22, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Mensile effettivo su {permanenza} mesi</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: isWinner ? t.primary : '#0f172a', margin: '6px 0', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{formatEuro(off.calc.mensileEffettivo)}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Totale: <strong>{formatEuro(off.calc.totale, 0)}</strong></div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: 8, fontSize: 11, color: '#475569' }}>12 mesi: <strong style={{ color: '#0f172a' }}>{formatEuro(off.calc12.totale, 0)}</strong></div>
                  <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: 8, fontSize: 11, color: '#475569' }}>24 mesi: <strong style={{ color: '#0f172a' }}>{formatEuro(off.calc24.totale, 0)}</strong></div>
                </div>

                <div style={{ marginTop: 14, fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', background: '#f8fafc', padding: '10px 12px', borderRadius: 8 }}>
                  {off.calc.mesiPromo > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Canoni promo ({off.calc.mesiPromo}m)</span><span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {(parseFloat(off.canonePromo) * off.calc.mesiPromo).toFixed(0)}</span></div>}
                  {off.calc.mesiPieno > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Canoni listino ({off.calc.mesiPieno}m)</span><span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {(parseFloat(off.canonePieno) * off.calc.mesiPieno).toFixed(0)}</span></div>}
                  {off.calc.attivazione > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Attivazione</span><span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {off.calc.attivazione.toFixed(0)}</span></div>}
                  {off.calc.totModem > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rate modem ({off.durataModem}m)</span><span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {off.calc.totModem.toFixed(0)}</span></div>}
                  {off.calc.penaleApplicata > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309' }}><span>Penale recesso</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>€ {off.calc.penaleApplicata.toFixed(0)}</span></div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {offerte.length < 4 && (
        <button onClick={aggiungiOfferta} style={{ display: 'block', margin: '0 auto 28px', background: '#fff', border: '2px dashed #cbd5e1', color: '#475569', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Aggiungi un'offerta da confrontare ({offerte.length}/4)</button>
      )}

      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 48, lineHeight: 1.6, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
        <em>Il calcolatore modella il passaggio automatico dal canone promozionale al canone a listino alla scadenza della promo, il costo di attivazione, le rate residue del modem in caso di recesso anticipato (saldo in unica soluzione) e l'eventuale penale. Non include costi extra per chiamate a consumo, roaming, servizi aggiuntivi opzionali o costi di disattivazione amministrativa. Questo strumento è una stima indicativa e non costituisce consulenza contrattuale.</em>
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
          Una offerta fibra e una mobile selezionate dal nostro team dopo analisi di coperture, transizioni promo→listino e vincoli contrattuali.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

          {/* ========== CARD 1: WINDTRE FIBRA ========== */}
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
              background: '#f97316', color: '#fff', fontSize: 10, fontWeight: 800,
              textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20,
              display: 'inline-block', marginBottom: 12, letterSpacing: '0.08em'
            }}>Categoria: fibra FTTH consumer</div>

            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              WindTre
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', fontFamily: "'DM Serif Display', 'Playfair Display', serif" }}>
              Super Fibra
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>
              Selezionata il <strong>15 ottobre 2025</strong>
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
              background: '#e2e8f0', borderRadius: 12, overflow: 'hidden',
              marginBottom: 16, border: '1px solid #e2e8f0'
            }}>
              {[
                { l: 'Canone promo', v: '19,99 €', h: true },
                { l: 'Canone listino', v: '26,99 €', h: false },
                { l: 'Durata promo', v: '12 mesi', h: false },
                { l: 'Velocità', v: '2,5 Gbps', h: true },
                { l: 'Modem', v: 'Wi-Fi 7 incluso', h: true },
                { l: 'Servizi extra', v: 'Prime 12m', h: true }
              ].map((item, i) => (
                <div key={i} style={{ background: '#fff', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{item.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: item.h ? '#16a34a' : '#0f172a' }}>{item.v}</div>
                </div>
              ))}
            </div>

            <a href="/recensione-windtre" style={{
              display: 'block', background: '#fff', color: '#0f172a',
              border: '2px solid #0f172a', padding: '12px', borderRadius: 10,
              fontWeight: 800, fontSize: 13, textDecoration: 'none',
              textAlign: 'center', marginBottom: 8
            }}>📖 Leggi l'analisi dei vincoli →</a>
            <a href="https://www.awin1.com/cread.php?awinmid=27760&awinaffid=2811530"
              target="_blank" rel="noopener noreferrer sponsored nofollow"
              style={{
                display: 'block', background: '#f97316', color: '#fff',
                padding: '12px', borderRadius: 10, fontWeight: 800, fontSize: 13,
                textDecoration: 'none', textAlign: 'center'
              }}>Scopri WindTre Super Fibra →</a>
          </div>

          {/* ========== CARD 2: LYCA MOBILE ========== */}
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
              background: '#0ea5e9', color: '#fff', fontSize: 10, fontWeight: 800,
              textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20,
              display: 'inline-block', marginBottom: 12, letterSpacing: '0.08em'
            }}>Categoria: offerta mobile MVNO</div>

            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Lyca Mobile (rete Vodafone)
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', fontFamily: "'DM Serif Display', 'Playfair Display', serif" }}>
              Portin 5G 599
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>
              Selezionata il <strong>15 ottobre 2025</strong>
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
              background: '#e2e8f0', borderRadius: 12, overflow: 'hidden',
              marginBottom: 16, border: '1px solid #e2e8f0'
            }}>
              {[
                { l: 'Canone', v: '5,99 €/m', h: true },
                { l: 'Giga', v: '150 GB 5G', h: true },
                { l: 'Minuti', v: 'Illimitati', h: true },
                { l: 'Rete', v: 'Vodafone', h: false },
                { l: 'Vincoli', v: 'Nessuno', h: true },
                { l: 'Tipo', v: 'Portabilità', h: false }
              ].map((item, i) => (
                <div key={i} style={{ background: '#fff', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{item.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: item.h ? '#16a34a' : '#0f172a' }}>{item.v}</div>
                </div>
              ))}
            </div>

            <a href="/recensione-lyca" style={{
              display: 'block', background: '#fff', color: '#0f172a',
              border: '2px solid #0f172a', padding: '12px', borderRadius: 10,
              fontWeight: 800, fontSize: 13, textDecoration: 'none',
              textAlign: 'center', marginBottom: 8
            }}>📖 Dettagli e roaming UE →</a>
            <a href="https://www.awin1.com/cread.php?awinmid=118793&awinaffid=2811530"
              target="_blank" rel="noopener noreferrer sponsored nofollow"
              style={{
                display: 'block', background: '#0ea5e9', color: '#fff',
                padding: '12px', borderRadius: 10, fontWeight: 800, fontSize: 13,
                textDecoration: 'none', textAlign: 'center'
              }}>Attiva Lyca Mobile →</a>
          </div>

        </div>

        {/* Disclaimer compliant */}
        <div style={{
          background: '#fafbfc', border: '1px solid #e2e8f0',
          borderRadius: 12, padding: '14px 16px', marginTop: 20
        }}>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: '#0f172a' }}>Trasparenza commerciale.</strong> Questa sezione contiene link di affiliazione: se attivi un servizio attraverso i nostri collegamenti, riceviamo una commissione dall'operatore senza alcun costo aggiuntivo per te.
            La selezione editoriale è indipendente e non determinata dall'importo della commissione: la metodologia di valutazione è descritta nelle analisi linkate sopra.
            Le condizioni indicate (canoni, velocità, servizi, durata promo) sono quelle pubblicate dagli operatori alla data riportata su ciascuna scheda; verifica sempre le condizioni aggiornate sul sito ufficiale prima di sottoscrivere, con particolare attenzione al canone a listino applicato dopo la scadenza della promo.
          </p>
        </div>
      </div>

    </div>
  );
}