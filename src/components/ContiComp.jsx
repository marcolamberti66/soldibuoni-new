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

  // ============================================================================
  // SUGGERIMENTO CONTESTUALE — confronto con BBVA e Hype basato sui numeri reali
  // ============================================================================
  const suggerimento = useMemo(() => {
    // Profilo BBVA: canone 0, tasso 3% lordo, bollo escluso, bonifici e prelievi >100€ gratis
    const bbvaBilancio = calcolaBilancio({
      canone: '0', bolloPagato: true,
      tasso: '3', tassoPromo: '3', durataPromo: 0,
      costoBonifico: '0', costoPrelievo: numPrelievi > 0 ? '0.5' : '0',
      canoneCarta: '0', bonusBenvenuto: '0', cashbackAnnuo: giacenza < 1000 ? '50' : '0',
      richiedeStipendio: false
    }, giacenza, numBonifici, numPrelievi, stipendioOk, 1).bilancio;

    // Profilo Hype Next: canone 2.90/mese = 34.80/anno, no interessi, prelievi gratis ITA
    const hypeBilancio = calcolaBilancio({
      canone: '2.90', bolloPagato: true,
      tasso: '0', tassoPromo: '0', durataPromo: 0,
      costoBonifico: '0', costoPrelievo: '0',
      canoneCarta: '0', bonusBenvenuto: stipendioOk ? '20' : '0', cashbackAnnuo: '0',
      richiedeStipendio: false
    }, giacenza, numBonifici, numPrelievi, stipendioOk, 1).bilancio;

    // Trova il bilancio peggiore tra le offerte dell'utente
    const peggioreUtente = Math.max(...risultati.map(r => r.anno1.bilancio));
    const miglioreUtente = minBilancio;

    // Solo mostra suggerimento se BBVA o Hype sono significativamente migliori (>50€/anno)
    const bbvaDelta = peggioreUtente - bbvaBilancio;
    const hypeDelta = peggioreUtente - hypeBilancio;

    let consiglio = null;
    if (giacenza >= 2000 && bbvaDelta > 50 && bbvaBilancio < miglioreUtente - 30) {
      consiglio = {
        nome: 'BBVA Conto Online',
        bilancio: bbvaBilancio,
        delta: peggioreUtente - bbvaBilancio,
        motivo: giacenza >= 5000
          ? `Con la tua giacenza di € ${giacenza.toLocaleString('it-IT')}, gli interessi al 3% lordo (~2,22% netto) compensano il bollo statale e azzerano i costi.`
          : `Bonifici e prelievi gratis (sopra 100€), zero canone, e gli interessi al 3% iniziano subito a maturare.`,
        link: 'https://www.financeads.net/tc.php?t=82784C5581131019T',
        review: '/recensione-bbva',
        color: '#004481'
      };
    } else if (giacenza < 3000 && stipendioOk && hypeDelta > 30 && hypeBilancio < miglioreUtente - 20) {
      consiglio = {
        nome: 'Hype Next',
        bilancio: hypeBilancio,
        delta: peggioreUtente - hypeBilancio,
        motivo: `Con accredito stipendio e bassa giacenza, Hype Next conviene: prelievi gratis illimitati in Italia, bonus 20€ all'apertura, gestione 100% app.`,
        link: 'https://www.financeads.net/tc.php?t=82784C257267132T',
        review: '/recensione-hype',
        color: '#00AEFF'
      };
    }

    return consiglio;
  }, [giacenza, numBonifici, numPrelievi, stipendioOk, risultati, minBilancio]);

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

      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 28, lineHeight: 1.6, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
        <em><strong style={{ color: '#64748b' }}>Come leggo il risultato?</strong> Il numero finale (positivo = guadagno, negativo = costo) somma tutto quello che paghi alla banca in un anno (canone, carta, commissioni operazioni) e sottrae quello che la banca ti dà (interessi netti al 74% dopo tasse, cashback, bonus). Se la tua giacenza supera i 5.000€ c'è anche il bollo statale di 34,20€/anno, a meno che la banca non lo paghi per te. Non sono incluse spese rare come F24, MAV o bollettini.</em>
      </p>

      {/* ==================================================================
          BLOCCO CONTESTUALE — Suggerimento basato sui numeri inseriti
          ================================================================== */}
      {giacenza > 0 && (() => {
        // BBVA simulato: canone 0, tasso 3% lordo, bonifici gratis, prelievi gratis ≥100€, bollo escluso
        const bbvaInteressiLordi = giacenza * 0.03;
        const bbvaInteressiNetti = bbvaInteressiLordi * 0.74;
        const bbvaCanoneAnnuo = 0;
        const bbvaBollo = giacenza > 5000 ? 0 : 0; // BBVA escluso
        const bbvaCashbackPromo = giacenza > 0 ? Math.min(200 * 0.04, 8) : 0; // primo mese
        const bbvaBilancio = bbvaCanoneAnnuo + bbvaBollo - bbvaInteressiNetti - bbvaCashbackPromo;

        const miglioreAttuale = risultati.reduce((min, r) => r.anno1.bilancio < min.anno1.bilancio ? r : min, risultati[0]);
        const differenza = miglioreAttuale.anno1.bilancio - bbvaBilancio;

        const conviene = differenza > 30; // soglia minima per suggerimento
        const profilo = giacenza < 3000 ? 'piccolo' : giacenza < 10000 ? 'medio' : 'grande';

        if (!conviene) {
          return (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: '18px 22px', marginBottom: 36, maxWidth: 720, margin: '0 auto 36px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#166534', marginBottom: 6 }}>✓ Il tuo conto attuale è già competitivo</div>
              <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                Sui tuoi numeri (giacenza € {giacenza.toLocaleString('it-IT')}) il conto migliore tra quelli che hai messo a confronto è già allineato al mercato. Non vale la pena cambiare per pochi euro.
              </div>
            </div>
          );
        }

        return (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '2px solid #10b981',
            borderRadius: 16,
            padding: '24px 26px',
            marginBottom: 36,
            maxWidth: 720,
            margin: '0 auto 36px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>💡</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suggerimento basato sui tuoi numeri</span>
            </div>

            <div style={{ fontSize: 16, color: '#0f172a', lineHeight: 1.6, marginBottom: 14 }}>
              Con una giacenza di <strong>€ {giacenza.toLocaleString('it-IT')}</strong>, aprire <strong>BBVA</strong> potrebbe farti guadagnare circa <strong style={{ color: '#059669', fontSize: 19 }}>+€ {Math.round(differenza).toLocaleString('it-IT')}/anno</strong> rispetto alla soluzione migliore che hai confrontato.
            </div>

            <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
              <strong style={{ color: '#0f172a' }}>Come abbiamo calcolato:</strong> giacenza {giacenza.toLocaleString('it-IT')}€ × 3% lordo = € {Math.round(bbvaInteressiLordi)} interessi annui, − 26% tasse = <strong>€ {Math.round(bbvaInteressiNetti)} netti</strong>. Canone €0, bonifici e prelievi (≥100€) gratis, bollo a carico della banca.
              {profilo === 'piccolo' && <div style={{ marginTop: 6, color: '#92400e' }}>⚠️ Con giacenza sotto 3.000€ il vantaggio è limitato. Valuta se hai liquidità extra da depositare.</div>}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="/recensione-bbva" style={{
                display: 'inline-block', padding: '10px 18px', borderRadius: 10,
                background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1',
                fontSize: 12, fontWeight: 800, textDecoration: 'none', flex: '1 1 auto', textAlign: 'center'
              }}>📖 Leggi prima la recensione</a>
              <a href="https://www.financeads.net/tc.php?t=82784C5581131019T"
                target="_blank" rel="noopener noreferrer sponsored nofollow"
                style={{
                  display: 'inline-block', padding: '10px 18px', borderRadius: 10,
                  background: '#10b981', color: '#fff',
                  fontSize: 12, fontWeight: 800, textDecoration: 'none', flex: '1 1 auto', textAlign: 'center'
                }}>Vai a BBVA →</a>
            </div>

            <div style={{ marginTop: 12, fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 3, fontWeight: 800, marginRight: 6 }}>#ADV</span>
              Stima orientativa. Il tasso BBVA al 3% è soggetto a modifica dall'istituto. Verifica le condizioni aggiornate sul sito ufficiale prima di agire. Il link a BBVA è affiliato: SoldiBuoni riceve una commissione senza costi aggiuntivi per te.
            </div>
          </div>
        );
      })()}

      {/* ==================================================================
          BLOCCO 2.5 — SUGGERIMENTO CONTESTUALE basato sui numeri inseriti
          ================================================================== */}
      {suggerimento && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #fff 60%)',
          border: `1px solid ${suggerimento.color}30`,
          borderRadius: 20, padding: '24px 26px',
          marginBottom: 28,
          position: 'relative'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', border: `1px solid ${suggerimento.color}`,
            color: suggerimento.color, fontSize: 11, fontWeight: 800,
            padding: '5px 12px', borderRadius: 20, marginBottom: 14,
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            💡 Per il tuo profilo
          </div>

          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', fontFamily: "'Playfair Display', serif" }}>
              {suggerimento.bilancio < 0
                ? <>Con <strong style={{ color: suggerimento.color }}>{suggerimento.nome}</strong> guadagneresti <strong>€ {Math.abs(Math.round(suggerimento.bilancio))}/anno</strong></>
                : <>Con <strong style={{ color: suggerimento.color }}>{suggerimento.nome}</strong> spenderesti solo <strong>€ {Math.round(suggerimento.bilancio)}/anno</strong></>
              }
            </h3>
            <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
              Risparmio stimato vs il tuo conto peggiore in lista: <strong style={{ color: '#059669' }}>€ {Math.round(suggerimento.delta)}/anno</strong>
            </p>
          </div>

          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>
            {suggerimento.motivo}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={suggerimento.review} style={{
              background: '#fff', color: '#0f172a',
              border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: 10,
              fontSize: 13, fontWeight: 700, textDecoration: 'none'
            }}>📖 Leggi l'analisi</a>
            <a href={suggerimento.link}
              target="_blank" rel="noopener noreferrer sponsored nofollow"
              style={{
                background: suggerimento.color, color: '#fff',
                padding: '10px 18px', borderRadius: 10,
                fontSize: 13, fontWeight: 800, textDecoration: 'none'
              }}>Vai al sito {suggerimento.nome.split(' ')[0]} →</a>
          </div>

          <p style={{ fontSize: 10, color: '#94a3b8', margin: '14px 0 0', lineHeight: 1.5 }}>
            <em>Stima calcolata sui dati che hai inserito sopra (giacenza, bonifici, prelievi). Le condizioni reali possono variare: verifica sempre sul sito ufficiale prima di aprire un conto. <strong>#ADV — link affiliato</strong></em>
          </p>
        </div>
      )}

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

        <p style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 14, marginTop: 18, lineHeight: 1.6, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Due conti che monitoriamo da mesi: uno per chi vuole rendimento sulla liquidità, uno per chi vuole un secondo conto da app.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28, fontSize: 12, color: '#475569' }}>
          <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 20 }}><strong style={{ color: '#0f172a' }}>BBVA</strong> per la liquidità (3% lordo)</span>
          <span style={{ color: '#cbd5e1' }}>·</span>
          <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 20 }}><strong style={{ color: '#0f172a' }}>Hype</strong> per l'operatività mobile</span>
        </div>

        {/* DECISION MATRIX — BBVA vs Hype */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 14, padding: '16px 18px', marginBottom: 24
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
            Quale dei due scegliere?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div style={{ background: '#fff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#004481', marginBottom: 6 }}>→ Scegli BBVA se</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                <li>Hai più di 3.000€ di giacenza media</li>
                <li>Vuoi rendimento sulla liquidità</li>
                <li>Prelievi raramente, sempre {`>`} 100€</li>
              </ul>
            </div>
            <div style={{ background: '#fff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#00AEFF', marginBottom: 6 }}>→ Scegli Hype se</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                <li>Hai bassa giacenza (sotto 3.000€)</li>
                <li>Prelevi spesso piccole somme</li>
                <li>Cerchi un secondo conto da app</li>
              </ul>
            </div>
          </div>
        </div>

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

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#004481', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, fontFamily: "'DM Serif Display', serif",
                flexShrink: 0
              }}>B</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', fontFamily: "'DM Serif Display', 'Playfair Display', serif", lineHeight: 1.1 }}>
                  BBVA Italia
                </div>
                <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                  Conto Online
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>
              <strong>Aggiornato aprile 2026</strong>
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
              background: '#e2e8f0', borderRadius: 12, overflow: 'hidden',
              marginBottom: 12, border: '1px solid #e2e8f0'
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

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 11, color: '#9a3412', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 800, marginBottom: 4, color: '#7c2d12' }}>⚠ Non aprire BBVA se:</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>Hai bisogno di versare contanti o assegni regolarmente</li>
                <li>Vuoi una filiale fisica per assistenza</li>
                <li>Prelevi spesso piccole somme (sotto 100€)</li>
              </ul>
            </div>

            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, padding: '10px 12px', marginBottom: 12
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚠️ Non per te se
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: '#7f1d1d', lineHeight: 1.5 }}>
                <li>Versi spesso contanti o assegni</li>
                <li>Prelievi piccole somme sotto i 100€</li>
                <li>Ti serve una filiale fisica</li>
              </ul>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#00AEFF', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, fontFamily: "'DM Serif Display', serif",
                flexShrink: 0
              }}>H</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', fontFamily: "'DM Serif Display', 'Playfair Display', serif", lineHeight: 1.1 }}>
                  Hype
                </div>
                <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                  Carta conto · 3 piani
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>
              <strong>Aggiornato aprile 2026</strong> · gruppo illimity
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
              background: '#e2e8f0', borderRadius: 12, overflow: 'hidden',
              marginBottom: 12, border: '1px solid #e2e8f0'
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

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 11, color: '#9a3412', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 800, marginBottom: 4, color: '#7c2d12' }}>⚠ Hype non è per te se:</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>Cerchi rendimento sulla giacenza (no interessi)</li>
                <li>Devi ricevere assegni o versare contanti spesso</li>
                <li>Vuoi investire seriamente (commissioni alte rispetto a broker dedicati)</li>
              </ul>
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