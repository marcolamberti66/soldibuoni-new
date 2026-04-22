import React, { useState, useMemo, useRef } from 'react';

// ============================================================================
// RC AUTO — CALCOLATORE
// ============================================================================

const PRESETS_PROFILO = [
  { label: 'Città piccola', sub: 'premio basso ~400€', premioMedio: 400 },
  { label: 'Città media', sub: 'premio medio ~550€', premioMedio: 550 },
  { label: 'Metropoli sud', sub: 'premio alto ~700€', premioMedio: 700 }
];

const PRESETS_COPERTURA = [
  { label: 'Solo Base', sub: 'auto vecchia/poco valore', furto: false, cristalli: false, assistenza: false, infortuni: false, tutelaLegale: false },
  { label: 'Standard', sub: 'il minimo utile', furto: false, cristalli: true, assistenza: true, infortuni: true, tutelaLegale: false },
  { label: 'Full Optional', sub: 'auto nuova/valore alto', furto: true, cristalli: true, assistenza: true, infortuni: true, tutelaLegale: true }
];

const DEFAULT_OFFERS = [
  {
    id: 1, nome: 'Compagnia A (preventivo 1)',
    premioBase: '350',
    costoFurto: '120', costoCristalli: '40', costoAssistenza: '20', costoInfortuni: '35', costoTutelaLegale: '25',
    scontoScatola: '40', franchigiaBase: '0',
    massimale: '7.750.000', sospendibile: true
  },
  {
    id: 2, nome: 'Compagnia B (preventivo 2)',
    premioBase: '290',
    costoFurto: '150', costoCristalli: '55', costoAssistenza: '15', costoInfortuni: '45', costoTutelaLegale: '0',
    scontoScatola: '0', franchigiaBase: '250',
    massimale: '15.000.000', sospendibile: false
  }
];

const THEME = { primary: '#e11d48', soft: '#ffe4e6', bg: '#fff1f2' };

// Media nazionale IVASS Q3 2025: premio medio €437 (dato reale pubblico)
// Fonte: IVASS indagine IPER. Usato come riferimento nel benchmark.
const MEDIA_NAZIONALE_IVASS = 437;

// ============================================================================
// MOTORE DI CALCOLO
// Il premio finale e: premioBase + somma garanzie attive - sconto scatola
// Il "costo atteso" aggiunge franchigia ponderata per probabilita sinistro.
// ============================================================================

function calcolaPremio(off, coperture, scatolaAttiva, probabilitaSinistro) {
  var base = parseFloat(off.premioBase) || 0;
  var furto = parseFloat(off.costoFurto) || 0;
  var cristalli = parseFloat(off.costoCristalli) || 0;
  var assistenza = parseFloat(off.costoAssistenza) || 0;
  var infortuni = parseFloat(off.costoInfortuni) || 0;
  var tutela = parseFloat(off.costoTutelaLegale) || 0;
  var scontoScatola = parseFloat(off.scontoScatola) || 0;
  var franchigia = parseFloat(off.franchigiaBase) || 0;

  var totaleGaranzie = 0;
  var garanzieAttive = [];
  if (coperture.furto && furto > 0) { totaleGaranzie += furto; garanzieAttive.push({ nome: 'Furto/Incendio', costo: furto }); }
  if (coperture.cristalli && cristalli > 0) { totaleGaranzie += cristalli; garanzieAttive.push({ nome: 'Cristalli', costo: cristalli }); }
  if (coperture.assistenza && assistenza > 0) { totaleGaranzie += assistenza; garanzieAttive.push({ nome: 'Assistenza', costo: assistenza }); }
  if (coperture.infortuni && infortuni > 0) { totaleGaranzie += infortuni; garanzieAttive.push({ nome: 'Infortuni', costo: infortuni }); }
  if (coperture.tutelaLegale && tutela > 0) { totaleGaranzie += tutela; garanzieAttive.push({ nome: 'Tutela legale', costo: tutela }); }

  var totaleSconti = scatolaAttiva ? scontoScatola : 0;
  var premioFinale = base + totaleGaranzie - totaleSconti;
  if (premioFinale < 0) premioFinale = 0;

  // Costo atteso = premio + valore atteso delle franchigie pagate in caso di sinistro
  // Probabilita sinistro con colpa IVASS: ~5% annuo medio italiano
  var costoAtteso = premioFinale + (franchigia * probabilitaSinistro / 100);

  return { base, totaleGaranzie, totaleSconti, premioFinale, costoAtteso, garanzieAttive, franchigia };
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function RCAutoComp() {
  const [coperture, setCoperture] = useState({
    furto: false, cristalli: true, assistenza: true, infortuni: true, tutelaLegale: false
  });
  const [scatolaAttiva, setScatolaAttiva] = useState(false);
  const [probabilitaSinistro, setProbabilitaSinistro] = useState(5); // % annuo
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
      calc: calcolaPremio(off, coperture, scatolaAttiva, probabilitaSinistro)
    })),
    [offerte, coperture, scatolaAttiva, probabilitaSinistro]
  );

  const validPremi = risultati.map(r => r.calc.premioFinale).filter(p => p > 0);
  const minPremio = validPremi.length > 0 ? Math.min(...validPremi) : 0;

  const updateOfferta = (id, field, value) =>
    setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));

  const aggiungiOfferta = () => {
    if (offerte.length >= 4) return;
    const nextId = Math.max(...offerte.map(o => o.id)) + 1;
    setOfferte([...offerte, {
      id: nextId, nome: `Preventivo #${nextId}`,
      premioBase: '300', costoFurto: '0', costoCristalli: '0', costoAssistenza: '0',
      costoInfortuni: '0', costoTutelaLegale: '0',
      scontoScatola: '0', franchigiaBase: '0',
      massimale: '7.750.000', sospendibile: false
    }]);
  };

  const rimuoviOfferta = (id) => {
    if (offerte.length <= 2) return;
    setOfferte(offerte.filter(o => o.id !== id));
  };

  const applicaPresetCopertura = (p) => {
    setCoperture({
      furto: p.furto, cristalli: p.cristalli, assistenza: p.assistenza,
      infortuni: p.infortuni, tutelaLegale: p.tutelaLegale
    });
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
        body = JSON.stringify({ text: aiText });
      } else {
        if (!aiFile) throw new Error('Seleziona prima un file (immagine o PDF).');
        body = new FormData();
        body.append('file', aiFile);
      }

      const res = await fetch('/api/extract-rcauto', { method: 'POST', headers, body });
      if (!res.ok) {
        let errMsg = 'Errore ' + res.status;
        try {
          const errData = await res.json();
          errMsg = errData.error + (errData.detail ? ': ' + errData.detail : '');
        } catch (_) {
          const txt = await res.text();
          if (txt) errMsg = txt;
        }
        throw new Error(errMsg);
      }
      const data = await res.json();

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
          costoTutelaLegale: data.costoTutelaLegale != null ? String(data.costoTutelaLegale) : o.costoTutelaLegale,
          scontoScatola: data.scontoScatola != null ? String(data.scontoScatola) : o.scontoScatola,
          franchigiaBase: data.franchigiaBase != null ? String(data.franchigiaBase) : o.franchigiaBase,
          massimale: data.massimale || o.massimale,
          sospendibile: data.sospendibile != null ? data.sospendibile : o.sospendibile
        };
      }));

      let msg = 'Dati estratti! Verifica i campi compilati.';
      if (data.confidence === 'bassa') {
        msg = '⚠️ Dati estratti ma il documento era ambiguo. Controlla ogni campo con attenzione.';
      } else if (data.confidence === 'media') {
        msg = 'Dati estratti. Alcuni valori sono stati dedotti — verifica i campi principali.';
      }
      setAiSuccess(msg);
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

  const cardBase = {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24,
    padding: '32px 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 800, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10
  };
  const miniLabel = { fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 };
  const miniInput = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid #cbd5e1', boxSizing: 'border-box',
    fontVariantNumeric: 'tabular-nums', fontSize: 14
  };

  const ToggleBtn = ({ active, label, onClick, icon }) => (
    <button onClick={onClick} style={{
      padding: '10px 12px', borderRadius: 12,
      border: active ? `2px solid ${t.primary}` : '1px solid #cbd5e1',
      background: active ? t.soft : '#fff',
      color: active ? t.primary : '#64748b',
      fontWeight: 700, fontSize: 12, cursor: 'pointer',
      boxShadow: active ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
      transition: 'all 0.2s', textAlign: 'center', lineHeight: 1.2
    }}>
      <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}{active ? '' : ''}</div>
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====================================================================
          BLOCCO 1 — PROFILO COPERTURE
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 28, padding: '36px 32px' }}>

        {/* Preset coperture */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>1 · Scegli un pacchetto o configura</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESETS_COPERTURA.map(p => {
              const active = coperture.furto === p.furto && coperture.cristalli === p.cristalli &&
                             coperture.assistenza === p.assistenza && coperture.infortuni === p.infortuni &&
                             coperture.tutelaLegale === p.tutelaLegale;
              return (
                <button
                  key={p.label}
                  onClick={() => applicaPresetCopertura(p)}
                  style={{
                    background: active ? '#fff' : '#f8fafc',
                    border: active ? `1px solid ${t.primary}` : '1px solid #e2e8f0',
                    color: active ? t.primary : '#475569',
                    padding: '10px 14px', borderRadius: 12,
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    textAlign: 'left', lineHeight: 1.2,
                    boxShadow: active ? '0 2px 6px rgba(15,23,42,0.06)' : 'none'
                  }}
                >
                  <div>{p.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>{p.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle singole garanzie */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>2 · Garanzie accessorie da includere nel confronto</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            <ToggleBtn active={coperture.furto} label="Furto/Incendio" icon={coperture.furto ? '✅ ' : '⬜ '} onClick={() => toggleCopertura('furto')} />
            <ToggleBtn active={coperture.cristalli} label="Cristalli" icon={coperture.cristalli ? '✅ ' : '⬜ '} onClick={() => toggleCopertura('cristalli')} />
            <ToggleBtn active={coperture.assistenza} label="Assistenza" icon={coperture.assistenza ? '✅ ' : '⬜ '} onClick={() => toggleCopertura('assistenza')} />
            <ToggleBtn active={coperture.infortuni} label="Infortuni cond." icon={coperture.infortuni ? '✅ ' : '⬜ '} onClick={() => toggleCopertura('infortuni')} />
            <ToggleBtn active={coperture.tutelaLegale} label="Tutela legale" icon={coperture.tutelaLegale ? '✅ ' : '⬜ '} onClick={() => toggleCopertura('tutelaLegale')} />
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 12, lineHeight: 1.5 }}>
            Attivando o disattivando le garanzie qui sopra, il calcolatore ricalcola i premi di tutti i preventivi in tempo reale, permettendoti di confrontare pacchetti identici.
          </p>
        </div>

        {/* Scatola nera e probabilita sinistro */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📡 Applica sconto scatola nera?
              </label>
              <button
                onClick={() => setScatolaAttiva(!scatolaAttiva)}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid ' + (scatolaAttiva ? '#16a34a' : '#cbd5e1'),
                  background: scatolaAttiva ? '#dcfce7' : '#fff',
                  color: scatolaAttiva ? '#166534' : '#64748b',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer'
                }}
              >{scatolaAttiva ? 'Sì' : 'No'}</button>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Inserisci comunque lo sconto scatola di ogni preventivo nei box sotto. Questo toggle decide solo se applicarlo al calcolo o meno. <strong>Contro:</strong> la telematica monitora la guida 24/7 e i dati possono essere usati in caso di sinistro.
            </p>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
              🎯 Probabilità sinistro con colpa (%/anno)
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="range" min="0" max="20" step="1"
                value={probabilitaSinistro}
                onChange={(e) => setProbabilitaSinistro(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: t.primary }}
              />
              <span style={{ fontSize: 16, fontWeight: 800, color: t.primary, fontVariantNumeric: 'tabular-nums', minWidth: 40 }}>
                {probabilitaSinistro}%
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0', lineHeight: 1.4 }}>
              Media italiana ~5%. Usato per stimare il costo atteso includendo la franchigia.
            </p>
          </div>
        </div>

        {/* AI EXTRACTION TOGGLE */}
        <div style={{ paddingTop: 20, borderTop: '1px dashed #e2e8f0' }}>
          <button
            onClick={() => setAiOpen(!aiOpen)}
            style={{
              width: '100%',
              background: aiOpen ? '#0f172a' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#fff', border: 'none', padding: '14px 20px', borderRadius: 14,
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 10, boxShadow: '0 8px 20px -8px rgba(15,23,42,0.5)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 6, fontSize: 10, letterSpacing: '0.1em' }}>BETA</span>
              <span>✨ Carica un preventivo e compila con l'AI</span>
            </span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{aiOpen ? '✕ Chiudi' : 'Apri →'}</span>
          </button>

          {aiOpen && (
            <div style={{ marginTop: 16, background: '#0f172a', borderRadius: 16, padding: 24, color: '#fff' }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 16px', color: '#cbd5e1' }}>
                Incolla il testo del preventivo o carica lo screenshot/PDF (es. Prima, ConTe, Allianz Direct). L'AI estrae premio base, garanzie accessorie, franchigia e massimale.
              </p>

              <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.06)', padding: 4, borderRadius: 10, marginBottom: 14 }}>
                {[{ k: 'text', label: '📝 Incolla testo' }, { k: 'image', label: '📸 Carica immagine/PDF' }].map(m => (
                  <button key={m.k} onClick={() => setAiMode(m.k)}
                    style={{
                      flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none',
                      background: aiMode === m.k ? '#fff' : 'transparent',
                      color: aiMode === m.k ? '#0f172a' : '#94a3b8',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer'
                    }}
                  >{m.label}</button>
                ))}
              </div>

              {aiMode === 'text' ? (
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Esempio: Preventivo ConTe. Premio RCA 320€, massimale 7.750.000€. Furto e incendio 115€. Assistenza stradale 25€. Cristalli 45€. Sconto scatola nera -35€. Franchigia 0€."
                  rows={5}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: 14, color: '#fff',
                    fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none'
                  }}
                />
              ) : (
                <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                    style={{ color: '#cbd5e1', fontSize: 13 }}
                  />
                  {aiFile && (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
                      Selezionato: <strong style={{ color: '#fff' }}>{aiFile.name}</strong> ({Math.round(aiFile.size / 1024)} KB)
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 700 }}>Inserisci come →</label>
                <select
                  value={aiTargetId}
                  onChange={(e) => setAiTargetId(parseInt(e.target.value))}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', padding: '8px 12px', borderRadius: 8,
                    fontSize: 13, fontWeight: 700
                  }}
                >
                  {offerte.map(o => (
                    <option key={o.id} value={o.id} style={{ color: '#0f172a' }}>{o.nome}</option>
                  ))}
                </select>
                <button
                  onClick={extractAI}
                  disabled={aiLoading}
                  style={{
                    marginLeft: 'auto',
                    background: aiLoading ? '#475569' : t.primary,
                    color: '#fff', border: 'none',
                    padding: '10px 20px', borderRadius: 10,
                    fontWeight: 800, fontSize: 13,
                    cursor: aiLoading ? 'wait' : 'pointer',
                    boxShadow: `0 4px 12px ${t.primary}40`
                  }}
                >
                  {aiLoading ? 'Analisi in corso...' : 'Estrai e compila →'}
                </button>
              </div>

              {aiError && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, fontSize: 13, color: '#fecaca' }}>
                  ⚠️ {aiError}
                </div>
              )}
              {aiSuccess && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, fontSize: 13, color: '#bbf7d0' }}>
                  ✓ {aiSuccess}
                </div>
              )}

              <p style={{ fontSize: 11, color: '#64748b', marginTop: 14, lineHeight: 1.5, fontStyle: 'italic' }}>
                L'estrazione AI è uno strumento di assistenza: può commettere errori su preventivi complessi o con layout non standard. Verifica sempre i campi compilati.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          BLOCCO 2 — OFFERTE DA CONFRONTARE
          ==================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${offerte.length > 2 ? '290px' : '320px'}, 1fr))`, gap: 20, marginBottom: 16 }}>
        {risultati.map(off => {
          const isWinner = off.calc.premioFinale === minPremio && off.calc.premioFinale > 0 && offerte.length > 1;
          const deltaMedia = off.calc.premioFinale - MEDIA_NAZIONALE_IVASS;
          const percMedia = MEDIA_NAZIONALE_IVASS > 0 ? (deltaMedia / MEDIA_NAZIONALE_IVASS) * 100 : 0;

          return (
            <div
              key={off.id}
              style={{
                background: isWinner ? `linear-gradient(180deg, ${t.bg} 0%, #fff 60%)` : '#fff',
                border: `2px solid ${isWinner ? t.primary : '#e2e8f0'}`,
                borderRadius: 24, padding: 24, position: 'relative',
                boxShadow: isWinner ? `0 20px 40px -12px ${t.primary}30` : '0 4px 12px rgba(0,0,0,0.03)'
              }}
            >
              {isWinner && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: t.primary, color: '#fff', fontSize: 11, fontWeight: 800,
                  padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                  boxShadow: `0 4px 12px ${t.primary}50`, letterSpacing: '0.05em'
                }}>🏆 PREVENTIVO MIGLIORE</div>
              )}

              {offerte.length > 2 && (
                <button
                  onClick={() => rimuoviOfferta(off.id)}
                  style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, padding: 4 }}
                  title="Rimuovi preventivo"
                >×</button>
              )}

              <input
                type="text" value={off.nome}
                onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)}
                style={{
                  fontWeight: 900, fontSize: 17, border: 'none', background: 'transparent',
                  width: '100%', paddingBottom: 12, borderBottom: '2px solid #e2e8f0',
                  marginBottom: 18, color: '#0f172a', outline: 'none'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Premio RCA base + Massimale */}
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                    Premio RCA base (€/anno)
                  </label>
                  <input
                    type="number" step="1" value={off.premioBase}
                    onChange={(e) => updateOfferta(off.id, 'premioBase', e.target.value)}
                    style={{ ...miniInput, fontSize: 16, fontWeight: 800, color: '#0f172a' }}
                  />
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block', marginTop: 8, marginBottom: 3 }}>
                    Massimale danni a terzi (minimo legale 7.750.000 €)
                  </label>
                  <input
                    type="text" value={off.massimale}
                    onChange={(e) => updateOfferta(off.id, 'massimale', e.target.value)}
                    placeholder="es. 7.750.000 oppure 15.000.000"
                    style={{ ...miniInput, fontSize: 12, fontVariantNumeric: 'normal' }}
                  />
                </div>

                {/* Garanzie */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ opacity: coperture.furto ? 1 : 0.45, transition: '0.2s' }}>
                    <label style={miniLabel}>Furto/Incendio (€)</label>
                    <input type="number" value={off.costoFurto}
                      onChange={(e) => updateOfferta(off.id, 'costoFurto', e.target.value)}
                      style={miniInput} disabled={!coperture.furto} />
                  </div>
                  <div style={{ opacity: coperture.cristalli ? 1 : 0.45, transition: '0.2s' }}>
                    <label style={miniLabel}>Cristalli (€)</label>
                    <input type="number" value={off.costoCristalli}
                      onChange={(e) => updateOfferta(off.id, 'costoCristalli', e.target.value)}
                      style={miniInput} disabled={!coperture.cristalli} />
                  </div>
                  <div style={{ opacity: coperture.assistenza ? 1 : 0.45, transition: '0.2s' }}>
                    <label style={miniLabel}>Assistenza (€)</label>
                    <input type="number" value={off.costoAssistenza}
                      onChange={(e) => updateOfferta(off.id, 'costoAssistenza', e.target.value)}
                      style={miniInput} disabled={!coperture.assistenza} />
                  </div>
                  <div style={{ opacity: coperture.infortuni ? 1 : 0.45, transition: '0.2s' }}>
                    <label style={miniLabel}>Infortuni (€)</label>
                    <input type="number" value={off.costoInfortuni}
                      onChange={(e) => updateOfferta(off.id, 'costoInfortuni', e.target.value)}
                      style={miniInput} disabled={!coperture.infortuni} />
                  </div>
                  <div style={{ gridColumn: '1 / 3', opacity: coperture.tutelaLegale ? 1 : 0.45, transition: '0.2s' }}>
                    <label style={miniLabel}>Tutela legale (€)</label>
                    <input type="number" value={off.costoTutelaLegale}
                      onChange={(e) => updateOfferta(off.id, 'costoTutelaLegale', e.target.value)}
                      style={miniInput} disabled={!coperture.tutelaLegale} />
                  </div>
                </div>

                {/* Sconto scatola + franchigia */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={miniLabel}>
                      Sconto scatola (€) {!scatolaAttiva && <span style={{ fontWeight: 600, color: '#94a3b8', fontSize: 10 }}>· non attivo</span>}
                    </label>
                    <input type="number" value={off.scontoScatola}
                      onChange={(e) => updateOfferta(off.id, 'scontoScatola', e.target.value)}
                      style={{ ...miniInput, color: scatolaAttiva ? '#16a34a' : '#0f172a', fontWeight: scatolaAttiva ? 800 : 500 }}
                    />
                  </div>
                  <div>
                    <label style={miniLabel}>Franchigia (€)</label>
                    <input type="number" value={off.franchigiaBase}
                      onChange={(e) => updateOfferta(off.id, 'franchigiaBase', e.target.value)}
                      style={miniInput} />
                  </div>
                </div>

                {/* Toggle sospendibile */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', flex: 1 }}>Polizza sospendibile?</label>
                  <button
                    onClick={() => updateOfferta(off.id, 'sospendibile', !off.sospendibile)}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      border: '1px solid ' + (off.sospendibile ? '#16a34a' : '#cbd5e1'),
                      background: off.sospendibile ? '#dcfce7' : '#fff',
                      color: off.sospendibile ? '#166534' : '#64748b',
                      fontWeight: 700, fontSize: 12, cursor: 'pointer'
                    }}
                  >{off.sospendibile ? 'Sì' : 'No'}</button>
                </div>
              </div>

              {/* RISULTATO */}
              <div style={{ marginTop: 22, paddingTop: 20, borderTop: '2px dashed #cbd5e1', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                  Premio totale annuo
                </div>
                <div style={{
                  fontSize: 34, fontWeight: 900,
                  color: isWinner ? t.primary : '#0f172a',
                  margin: '6px 0', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em'
                }}>
                  {formatEuro(off.calc.premioFinale)}
                </div>

                {/* Benchmark media nazionale */}
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: percMedia <= -10 ? '#dcfce7' : (percMedia >= 20 ? '#fee2e2' : '#f1f5f9'),
                  color: percMedia <= -10 ? '#166534' : (percMedia >= 20 ? '#991b1b' : '#475569'),
                  marginBottom: 6
                }}>
                  {percMedia <= -10 && '✓ '}
                  {percMedia >= 20 && '⚠ '}
                  {deltaMedia >= 0 ? '+' : ''}{Math.round(percMedia)}% vs media nazionale IVASS (€{MEDIA_NAZIONALE_IVASS})
                </div>

                {/* Costo atteso con franchigia */}
                {off.calc.franchigia > 0 && (
                  <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>
                    Costo atteso con sinistro {probabilitaSinistro}%: <strong>{formatEuro(off.calc.costoAtteso)}</strong>
                  </div>
                )}

                {/* Breakdown */}
                <div style={{ marginTop: 14, fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', background: '#f8fafc', padding: '10px 12px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Premio RCA base</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {off.calc.base.toFixed(0)}</span>
                  </div>
                  {off.calc.garanzieAttive.map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>+ {g.nome}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {g.costo.toFixed(0)}</span>
                    </div>
                  ))}
                  {off.calc.totaleSconti > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                      <span>− Sconto scatola nera</span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>− € {off.calc.totaleSconti.toFixed(0)}</span>
                    </div>
                  )}
                  {off.calc.franchigia > 0 && (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e2e8f0', color: '#b45309', fontSize: 11 }}>
                      ⚠️ Franchigia di € {off.calc.franchigia.toFixed(0)} a tuo carico in caso di sinistro
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AGGIUNGI OFFERTA */}
      {offerte.length < 4 && (
        <button
          onClick={aggiungiOfferta}
          style={{
            display: 'block', margin: '0 auto 28px', background: '#fff',
            border: '2px dashed #cbd5e1', color: '#475569',
            padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer'
          }}
        >+ Aggiungi un preventivo da confrontare ({offerte.length}/4)</button>
      )}

      {/* DISCLAIMER */}
      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 48, lineHeight: 1.6, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
        <em>
          Il calcolatore elabora unicamente i parametri inseriti. Il premio effettivo dipende dalla tua classe di merito (bonus-malus), dalla provincia di residenza, dal massimale scelto, dalla presenza di franchigie o scoperti e dalle garanzie accessorie. La media nazionale di riferimento (€437) deriva dall'indagine IVASS IPER Q3 2025 sui contratti realmente stipulati. Verifica sempre il Set Informativo precontrattuale (DIP) sul sito della Compagnia prima di sottoscrivere.
        </em>
      </p>

    </div>
  );
}