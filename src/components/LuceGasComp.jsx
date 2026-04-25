import React, { useState, useMemo, useRef } from 'react';
import { INDICI_MERCATO } from '../data.js';

// ============================================================================
// COSTANTI
// ============================================================================

const PRESETS = {
  luce: [
    { label: '1 Persona', val: 1500, sub: 'monolocale' },
    { label: '2 Persone', val: 2700, sub: 'medio' },
    { label: '4 Persone', val: 4000, sub: 'grande' }
  ],
  gas: [
    { label: 'Solo cottura', val: 200, sub: '~2 persone' },
    { label: 'Acqua calda', val: 600, sub: '+ scaldabagno' },
    { label: 'Riscaldamento', val: 1400, sub: 'autonomo' }
  ]
};

const DEFAULT_OFFERS = {
  luce: [
    { id: 1, nome: 'La mia offerta attuale', tipo: 'fisso', prezzo: '0.14', fisso: '144', scontoAnno: '0', scontoOneShot: '0', durata: 12, vincolo: false, note: '' },
    { id: 2, nome: 'Offerta da confrontare', tipo: 'variabile', prezzo: '0.02', fisso: '120', scontoAnno: '0', scontoOneShot: '0', durata: 12, vincolo: false, note: '' }
  ],
  gas: [
    { id: 1, nome: 'La mia offerta attuale', tipo: 'fisso', prezzo: '0.45', fisso: '144', scontoAnno: '0', scontoOneShot: '0', durata: 12, vincolo: false, note: '' },
    { id: 2, nome: 'Offerta da confrontare', tipo: 'variabile', prezzo: '0.05', fisso: '120', scontoAnno: '0', scontoOneShot: '0', durata: 12, vincolo: false, note: '' }
  ]
};

const THEME = {
  luce: { primary: '#d97706', soft: '#fef3c7', bg: '#fffbeb', emoji: '⚡' },
  gas:  { primary: '#dc2626', soft: '#fee2e2', bg: '#fef2f2', emoji: '🔥' }
};

// ============================================================================
// OFFERTA AFFILIATE — Eni Plenitude Fixa Time Smart
// I parametri seguono lo stesso schema delle offerte normali e passano per
// calcolaCRAS, così il confronto è coerente. Aggiorna questi numeri ogni
// volta che il fornitore modifica l'offerta (vedi nota in calendario).
// ============================================================================

const ENI_OFFER = {
  nome: 'Eni Plenitude — Fixa Time Smart',
  ultimoAggiornamento: '15 ottobre 2025',
  luce: {
    tipo: 'fisso',
    prezzo: '0.1881',     // €/kWh — prezzo materia bloccato
    fisso: '90',          // €/anno — costi commercializzazione
    scontoAnno: '54',     // €/anno — sconto ricorrente
    scontoOneShot: '0'
  },
  gas: {
    tipo: 'fisso',
    prezzo: '0.7050',     // €/Smc — prezzo materia bloccato
    fisso: '90',
    scontoAnno: '54',
    scontoOneShot: '0'
  }
};

// ============================================================================
// MOTORE DI CALCOLO
// Calcolo più granulare rispetto al singolo grossUp:
// - Separa trasporto fisso da quote variabili
// - Per il gas applica IVA 10% sotto 480 Smc, 22% sopra
// - Mantiene volutamente una stima (vedi disclaimer): la bolletta reale
//   dipende da regione, potenza impegnata, scaglione di consumo annuo,
//   classe contributiva e altre voci minori.
// ============================================================================

const COSTANTI_LUCE = {
  trasportoFisso: 85,           // €/anno (quota fissa + quota potenza tipica 3 kW)
  trasportoVariabile: 0.0089,   // €/kWh
  oneriSistema: 0.0115,         // €/kWh
  accisa: 0.0227,               // €/kWh
  iva: 0.10
};

const COSTANTI_GAS = {
  trasportoFisso: 50,           // €/anno
  trasportoVariabile: 0.10,     // €/Smc
  oneriSistema: 0.02,           // €/Smc (RE + UG aggregati)
  accisa: 0.155,                // €/Smc (scaglione tipico domestico)
  addizionaleRegionale: 0.022,  // €/Smc (media nazionale)
  ivaBassa: 0.10,               // primi 480 Smc
  ivaAlta: 0.22,                // oltre 480 Smc
  sogliaIva: 480
};

function calcolaCRAS({ tipo, prezzo, fisso, scontoAnno, scontoOneShot, indiceAttuale }, consumo, tipoEnergia) {
  const p = parseFloat(prezzo) || 0;
  const f = parseFloat(fisso) || 0;
  const sA = parseFloat(scontoAnno) || 0;
  const sO = parseFloat(scontoOneShot) || 0;

  // Componente materia (quella su cui agisce il fornitore)
  const prezzoUnitario = tipo === 'fisso' ? p : (indiceAttuale + p);
  const materiaEnergia = prezzoUnitario * consumo + f;

  let oneriEImposte;
  let costoNetto;

  if (tipoEnergia === 'luce') {
    const c = COSTANTI_LUCE;
    const trasporto = c.trasportoFisso + c.trasportoVariabile * consumo;
    const oneri = c.oneriSistema * consumo;
    const accise = c.accisa * consumo;
    const imponibile = materiaEnergia + trasporto + oneri + accise;
    const iva = imponibile * c.iva;
    oneriEImposte = trasporto + oneri + accise + iva;
    costoNetto = imponibile + iva;
  } else {
    const c = COSTANTI_GAS;
    const trasporto = c.trasportoFisso + c.trasportoVariabile * consumo;
    const oneri = c.oneriSistema * consumo;
    const accise = c.accisa * consumo;
    const addReg = c.addizionaleRegionale * consumo;
    const imponibile = materiaEnergia + trasporto + oneri + accise + addReg;

    // IVA scaglionata
    const consumoBasso = Math.min(consumo, c.sogliaIva);
    const consumoAlto = Math.max(0, consumo - c.sogliaIva);
    const quotaImponibilePerSmc = consumo > 0 ? imponibile / consumo : 0;
    const ivaBassa = consumoBasso * quotaImponibilePerSmc * c.ivaBassa;
    const ivaAlta = consumoAlto * quotaImponibilePerSmc * c.ivaAlta;
    const iva = ivaBassa + ivaAlta;

    oneriEImposte = trasporto + oneri + accise + addReg + iva;
    costoNetto = imponibile + iva;
  }

  // Sconti
  const totale = costoNetto - sA - sO;
  const totaleAnno2 = costoNetto - sA; // anno 2 senza one-shot

  return {
    materiaEnergia,
    oneriEImposte,
    scontiTotali: sA + sO,
    totale: Math.max(0, totale),
    totaleAnno2: Math.max(0, totaleAnno2)
  };
}

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

export function LuceGasComp() {
  const [tipoEnergia, setTipoEnergia] = useState('luce');
  const [consumoStr, setConsumoStr] = useState('2700');
  const [permanenza, setPermanenza] = useState(12);
  const [offerte, setOfferte] = useState(DEFAULT_OFFERS.luce);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState('text'); // 'text' | 'image'
  const [aiText, setAiText] = useState('');
  const [aiFile, setAiFile] = useState(null);
  const [aiTargetId, setAiTargetId] = useState(2);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSuccess, setAiSuccess] = useState(null);
  const fileRef = useRef(null);

  const handleTipoCambio = (tipo) => {
    setTipoEnergia(tipo);
    setConsumoStr(tipo === 'luce' ? '2700' : '1000');
    setOfferte(DEFAULT_OFFERS[tipo]);
    setAiOpen(false);
  };

  const consumo = parseFloat(consumoStr) || 0;
  const indiceAttuale = tipoEnergia === 'luce' ? INDICI_MERCATO.PUN : INDICI_MERCATO.PSV;
  const unita = tipoEnergia === 'luce' ? 'kWh' : 'Smc';
  const t = THEME[tipoEnergia];

  const risultati = useMemo(
    () => offerte.map(off => {
      const calc = calcolaCRAS({ ...off, indiceAttuale }, consumo, tipoEnergia);
      const anniPerm = permanenza / 12;
      const costoTotPerm = anniPerm <= 1
        ? calc.totale
        : calc.totale + calc.totaleAnno2 * (anniPerm - 1);
      return { ...off, calcoli: calc, costoTotPerm };
    }),
    [offerte, consumo, tipoEnergia, indiceAttuale, permanenza]
  );

  const minTotale = Math.min(...risultati.map(r => r.costoTotPerm));

  const updateOfferta = (id, field, value) =>
    setOfferte(offerte.map(o => o.id === id ? { ...o, [field]: value } : o));

  const aggiungiOfferta = () => {
    if (offerte.length >= 4) return;
    const nextId = Math.max(...offerte.map(o => o.id)) + 1;
    setOfferte([...offerte, {
      id: nextId,
      nome: `Offerta #${nextId}`,
      tipo: 'fisso',
      prezzo: '0.13',
      fisso: '120',
      scontoAnno: '0',
      scontoOneShot: '0',
      durata: 12,
      vincolo: false,
      note: ''
    }]);
  };

  const rimuoviOfferta = (id) => {
    if (offerte.length <= 2) return;
    setOfferte(offerte.filter(o => o.id !== id));
  };

  // ==========================================================================
  // ESTRAZIONE AI (richiede endpoint backend /api/extract-offer)
  // Vedi snippet Astro accanto al file per la wiring lato server.
  // ==========================================================================

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
        body = JSON.stringify({ mode: 'text', text: aiText, tipoEnergia });
      } else {
        if (!aiFile) throw new Error('Seleziona prima un file (immagine o PDF).');
        body = new FormData();
        body.append('mode', 'image');
        body.append('tipoEnergia', tipoEnergia);
        body.append('file', aiFile);
      }

      const res = await fetch('/api/extract-offer', { method: 'POST', headers, body });
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

      // Aggiorna l'offerta target con i campi estratti (solo quelli presenti)
      setOfferte(prev => prev.map(o => {
        if (o.id !== aiTargetId) return o;
        return {
          ...o,
          nome: data.nome ?? o.nome,
          tipo: data.tipo ?? o.tipo,
          prezzo: data.prezzo != null ? String(data.prezzo) : o.prezzo,
          fisso: data.fisso != null ? String(data.fisso) : o.fisso,
          scontoAnno: data.scontoAnno != null ? String(data.scontoAnno) : o.scontoAnno,
          scontoOneShot: data.scontoOneShot != null ? String(data.scontoOneShot) : o.scontoOneShot,
          durata: data.durata ?? o.durata,
          vincolo: data.vincolo ?? o.vincolo,
          note: data.note ?? o.note
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

  // Calcolo CRAS Eni Plenitude — passa attraverso lo stesso motore delle altre offerte
  const eniOfferData = ENI_OFFER[tipoEnergia];
  const eniRisultato = useMemo(
    () => calcolaCRAS({ ...eniOfferData, indiceAttuale }, consumo, tipoEnergia),
    [eniOfferData, consumo, tipoEnergia, indiceAttuale]
  );
  const eniCRAS = eniRisultato.totale;

  // ==========================================================================
  // STILI CONDIVISI
  // ==========================================================================

  const cardBase = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 24,
    padding: '32px 24px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      <style dangerouslySetInnerHTML={{__html:`
        .lg-top-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:32px; }
        .lg-consumo-box { display:flex; gap:12px; align-items:stretch; background:#f8fafc; padding:6px; border-radius:16px; border:1px solid #e2e8f0; }
        .lg-consumo-chips { display:flex; gap:6px; flex:1; flex-wrap:wrap; align-items:center; }
        .lg-perm-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:20px; }
        @media(max-width:500px){
          .lg-top-grid { grid-template-columns:1fr; gap:20px; }
          .lg-consumo-box { flex-direction:column; gap:8px; }
          .lg-consumo-box input { width:100% !important; font-size:18px !important; }
          .lg-consumo-chips { gap:4px; }
          .lg-consumo-chips button { padding:6px 8px !important; font-size:11px !important; }
          .lg-perm-grid { gap:6px; }
          .lg-perm-grid button { padding:8px 4px !important; font-size:11px !important; }
        }
      `}}/>

      {/* ====================================================================
          BLOCCO 1 — SELETTORI PREMIUM (materia + consumo + permanenza)
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 28, padding: '36px 32px' }}>

        <div className="lg-top-grid">

          {/* MATERIA — segmented premium */}
          <div>
            <label style={labelStyle}>1 · Cosa vuoi confrontare</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0,
              background: '#f8fafc',
              padding: 6,
              borderRadius: 16,
              border: '1px solid #e2e8f0'
            }}>
              {['luce', 'gas'].map(tipo => {
                const active = tipoEnergia === tipo;
                const tipoTheme = THEME[tipo];
                return (
                  <button
                    key={tipo}
                    onClick={() => handleTipoCambio(tipo)}
                    style={{
                      position: 'relative',
                      padding: '14px 12px',
                      borderRadius: 12,
                      border: 'none',
                      cursor: 'pointer',
                      background: active ? '#fff' : 'transparent',
                      color: active ? tipoTheme.primary : '#64748b',
                      fontWeight: 800,
                      fontSize: 15,
                      letterSpacing: '0.01em',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: active ? '0 4px 12px rgba(15,23,42,0.08), 0 1px 0 rgba(255,255,255,0.9) inset' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{tipoTheme.emoji}</span>
                    <span style={{ textTransform: 'capitalize' }}>{tipo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONSUMO — input + chips */}
          <div>
            <label style={labelStyle}>2 · Il tuo consumo annuo ({unita})</label>
            <div className="lg-consumo-box">
              <input
                type="number"
                value={consumoStr}
                onChange={(e) => setConsumoStr(e.target.value)}
                style={{
                  width: 120,
                  padding: '10px 14px',
                  fontSize: 20,
                  border: '1px solid #cbd5e1',
                  borderRadius: 12,
                  fontWeight: 800,
                  color: t.primary,
                  background: '#fff',
                  outline: 'none',
                  fontVariantNumeric: 'tabular-nums',
                  boxSizing: 'border-box'
                }}
              />
              <div className="lg-consumo-chips">
                {PRESETS[tipoEnergia].map(p => {
                  const active = consumo === p.val;
                  return (
                    <button
                      key={p.label}
                      onClick={() => setConsumoStr(p.val.toString())}
                      style={{
                        background: active ? '#fff' : 'transparent',
                        border: active ? `1px solid ${t.primary}` : '1px solid transparent',
                        color: active ? t.primary : '#64748b',
                        padding: '8px 12px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        boxShadow: active ? '0 2px 6px rgba(15,23,42,0.06)' : 'none',
                        lineHeight: 1.2,
                        fontFamily: 'inherit'
                      }}
                    >
                      <div>{p.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>{p.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* PERMANENZA — per quanti mesi terrai il contratto */}
        <div style={{ marginTop: 24 }}>
          <label style={labelStyle}>3 · Per quanto tempo terrai il contratto?</label>
          <div className="lg-perm-grid">
            {[
              { val: 12, label: '1 Anno', sub: 'cambio spesso' },
              { val: 24, label: '2 Anni', sub: 'profilo standard' },
              { val: 36, label: '3 Anni', sub: 'fedeltà' }
            ].map(p => {
              const active = permanenza === p.val;
              return (
                <button
                  key={p.val}
                  onClick={() => setPermanenza(p.val)}
                  style={{
                    background: active ? '#fff' : '#f8fafc',
                    border: active ? `1px solid ${t.primary}` : '1px solid #e2e8f0',
                    color: active ? t.primary : '#475569',
                    padding: '10px 8px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    boxShadow: active ? '0 2px 6px rgba(15,23,42,0.06)' : 'none',
                    fontFamily: 'inherit'
                  }}
                >
                  <div>{p.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>{p.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============== AI EXTRACTION TOGGLE ============== */}
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px dashed #e2e8f0' }}>
          <button
            onClick={() => setAiOpen(!aiOpen)}
            style={{
              width: '100%',
              background: aiOpen ? '#0f172a' : `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
              color: '#fff',
              border: 'none',
              padding: '14px 20px',
              borderRadius: 14,
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              boxShadow: '0 8px 20px -8px rgba(15,23,42,0.5)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 10,
                letterSpacing: '0.1em'
              }}>BETA</span>
              <span>✨ Compila in automatico con l'AI</span>
            </span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{aiOpen ? '✕ Chiudi' : 'Apri →'}</span>
          </button>

          {aiOpen && (
            <div style={{
              marginTop: 16,
              background: '#0f172a',
              borderRadius: 16,
              padding: 24,
              color: '#fff'
            }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 16px', color: '#cbd5e1' }}>
                Incolla qui il riepilogo economico della tua nuova offerta (testo dal sito del fornitore o screenshot della scheda informativa).
                L'AI estrae prezzo, costi fissi e sconti, e li inserisce in un'offerta a tua scelta.
              </p>

              {/* Mode selector */}
              <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.06)', padding: 4, borderRadius: 10, marginBottom: 14 }}>
                {[{ k: 'text', label: '📝 Incolla testo' }, { k: 'image', label: '📸 Carica immagine/PDF' }].map(m => (
                  <button
                    key={m.k}
                    onClick={() => setAiMode(m.k)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: aiMode === m.k ? '#fff' : 'transparent',
                      color: aiMode === m.k ? '#0f172a' : '#94a3b8',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >{m.label}</button>
                ))}
              </div>

              {aiMode === 'text' ? (
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Esempio: Offerta XYZ Plenitude. Prezzo bloccato 24 mesi. Componente energia 0,128 €/kWh. Quota fissa commercializzazione 12 €/mese. Sconto benvenuto una tantum 50€. Nessun vincolo di permanenza..."
                  rows={5}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    padding: 14,
                    color: '#fff',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              ) : (
                <div style={{
                  border: '2px dashed rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  padding: 24,
                  textAlign: 'center'
                }}>
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

              {/* Target offer + Action */}
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 700 }}>Inserisci come →</label>
                <select
                  value={aiTargetId}
                  onChange={(e) => setAiTargetId(parseInt(e.target.value))}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700
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
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: aiLoading ? 'wait' : 'pointer',
                    boxShadow: `0 4px 12px ${t.primary}40`
                  }}
                >
                  {aiLoading ? 'Analizzando...' : 'Estrai e compila →'}
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
                L'estrazione AI è uno strumento di assistenza: può commettere errori, ignorare clausole o interpretare male le condizioni economiche. Verifica sempre i campi compilati prima di basare una decisione sul risultato.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          BLOCCO 2 — CARDS DI CONFRONTO
          ==================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${offerte.length > 2 ? '260px' : '300px'}, 1fr))`, gap: 20, marginBottom: 16 }}>
        {risultati.map((off) => {
          const isWinner = off.costoTotPerm === minTotale && off.costoTotPerm > 0 && offerte.length > 1;
          return (
            <div
              key={off.id}
              style={{
                background: isWinner ? `linear-gradient(180deg, ${t.bg} 0%, #fff 60%)` : '#fff',
                border: `2px solid ${isWinner ? t.primary : '#e2e8f0'}`,
                borderRadius: 24,
                padding: 24,
                position: 'relative',
                boxShadow: isWinner
                  ? `0 20px 40px -12px ${t.primary}30`
                  : '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'all 0.3s ease'
              }}
            >
              {isWinner && (
                <div style={{
                  position: 'absolute',
                  top: -14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: t.primary,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  boxShadow: `0 4px 12px ${t.primary}50`,
                  letterSpacing: '0.05em'
                }}>🏆 LA PIÙ CONVENIENTE</div>
              )}

              {offerte.length > 2 && (
                <button
                  onClick={() => rimuoviOfferta(off.id)}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: 4,
                    borderRadius: 6
                  }}
                  title="Rimuovi offerta"
                >×</button>
              )}

              <input
                type="text"
                value={off.nome}
                onChange={(e) => updateOfferta(off.id, 'nome', e.target.value)}
                style={{
                  fontWeight: 900,
                  fontSize: 17,
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  paddingBottom: 12,
                  borderBottom: '2px solid #e2e8f0',
                  marginBottom: 18,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Tipo prezzo */}
                <div style={{ display: 'flex', background: '#f8fafc', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  {['fisso', 'variabile'].map(tp => (
                    <button
                      key={tp}
                      onClick={() => updateOfferta(off.id, 'tipo', tp)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        background: off.tipo === tp ? t.primary : 'transparent',
                        color: off.tipo === tp ? '#fff' : '#64748b',
                        fontSize: 12,
                        fontWeight: 800,
                        borderRadius: 8,
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >{tp}</button>
                  ))}
                </div>

                {/* Prezzo / Spread */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
                    {off.tipo === 'fisso' ? `Prezzo materia (€/${unita})` : `Spread su ${tipoEnergia === 'luce' ? 'PUN' : 'PSV'} (€/${unita})`}
                  </label>
                  <input
                    type="number" step="0.001"
                    value={off.prezzo}
                    onChange={(e) => updateOfferta(off.id, 'prezzo', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums' }}
                  />
                </div>

                {/* Costi fissi */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Costi fissi commercializzazione (€/anno)</label>
                  <input
                    type="number"
                    value={off.fisso}
                    onChange={(e) => updateOfferta(off.id, 'fisso', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums' }}
                  />
                </div>

                {/* Sconti — ora editabili */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Sconto annuo (€)</label>
                    <input
                      type="number"
                      value={off.scontoAnno}
                      onChange={(e) => updateOfferta(off.id, 'scontoAnno', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Bonus benvenuto (€)</label>
                    <input
                      type="number"
                      value={off.scontoOneShot}
                      onChange={(e) => updateOfferta(off.id, 'scontoOneShot', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums' }}
                    />
                  </div>
                </div>

                {/* Durata + vincolo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Durata blocco (mesi)</label>
                    <select
                      value={off.durata}
                      onChange={(e) => updateOfferta(off.id, 'durata', parseInt(e.target.value))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box', background: '#fff' }}
                    >
                      {[12, 24, 36].map(d => <option key={d} value={d}>{d} mesi</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Vincolo</label>
                    <button
                      onClick={() => updateOfferta(off.id, 'vincolo', !off.vincolo)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        background: off.vincolo ? '#fee2e2' : '#dcfce7',
                        color: off.vincolo ? '#991b1b' : '#166534',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >{off.vincolo ? 'Sì' : 'No'}</button>
                  </div>
                </div>
              </div>

              {/* RISULTATO */}
              <div style={{
                marginTop: 22,
                paddingTop: 20,
                borderTop: '2px dashed #cbd5e1',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                  Costo totale anno 1 (CRAS)
                </div>
                <div style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: isWinner ? t.primary : '#0f172a',
                  margin: '6px 0',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em'
                }}>
                  € {Math.round(off.calcoli.totale).toLocaleString('it-IT')}
                </div>
                {(parseFloat(off.scontoOneShot) || 0) > 0 && (
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Anno 2: € {Math.round(off.calcoli.totaleAnno2).toLocaleString('it-IT')} <span style={{ opacity: 0.6 }}>(senza bonus)</span>
                  </div>
                )}
                {permanenza > 12 && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: isWinner ? `${t.primary}10` : '#f0f9ff', borderRadius: 8, fontSize: 13, fontWeight: 800, color: isWinner ? t.primary : '#0369a1' }}>
                    Totale su {permanenza / 12} anni: € {Math.round(off.costoTotPerm).toLocaleString('it-IT')}
                  </div>
                )}

                {/* Breakdown */}
                <div style={{ marginTop: 14, fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', background: '#f8fafc', padding: '10px 12px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Materia ({tipoEnergia})</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {Math.round(off.calcoli.materiaEnergia).toLocaleString('it-IT')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Oneri + imposte stimati</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>€ {Math.round(off.calcoli.oneriEImposte).toLocaleString('it-IT')}</span>
                  </div>
                  {off.calcoli.scontiTotali > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                      <span>Sconti applicati</span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>− € {Math.round(off.calcoli.scontiTotali).toLocaleString('it-IT')}</span>
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
            display: 'block',
            margin: '0 auto 28px',
            background: '#fff',
            border: '2px dashed #cbd5e1',
            color: '#475569',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >+ Aggiungi un'offerta da confrontare ({offerte.length}/4)</button>
      )}

      {/* DISCLAIMER CALCOLATORE */}
      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 48, lineHeight: 1.6, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
        <em>
          Il CRAS (Costo Reale Annuo Stimato) include la nostra stima per trasporto, oneri di sistema, accise e IVA (10% per la luce; 10% per i primi 480 Smc di gas, 22% oltre).
          La bolletta reale può differire in base a regione, potenza impegnata, scaglioni di consumo annuo, tariffe locali di distribuzione e altre voci accessorie.
          Questo strumento è una stima indicativa e non costituisce consulenza finanziaria, fiscale o energetica.
        </em>
      </p>

      {/* ====================================================================
          BLOCCO 3 — OFFERTA AFFILIATE (riscritta per compliance)
          ==================================================================== */}
      <div style={{
        background: '#fff',
        border: '2px solid #0f172a',
        borderRadius: 24,
        padding: '36px 28px 32px',
        position: 'relative',
        boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.18)'
      }}>

        {/* TAG ADV — visibile in alto a sinistra */}
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          gap: 6
        }}>
          <span style={{
            background: '#fef3c7',
            color: '#92400e',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.1em',
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #fcd34d'
          }}>#ADV</span>
          <span style={{
            background: '#f1f5f9',
            color: '#475569',
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #e2e8f0'
          }}>Link affiliato</span>
        </div>

        {/* Badge selezione del team */}
        <div style={{
          position: 'absolute',
          top: -14,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0f172a',
          color: '#fff',
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          padding: '6px 18px',
          borderRadius: 30,
          whiteSpace: 'nowrap'
        }}>★ La selezione del Team</div>

        {/* HEADER OFFERTA */}
        <div style={{ textAlign: 'center', marginTop: 18, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Eni Plenitude
          </div>
          <h3 style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#0f172a',
            margin: 0,
            fontFamily: "'DM Serif Display', 'Playfair Display', serif",
            letterSpacing: '-0.01em'
          }}>Fixa Time Smart</h3>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 8, marginBottom: 0 }}>
            Selezionata dal nostro team il <strong>{ENI_OFFER.ultimoAggiornamento}</strong> nella categoria "prezzo bloccato senza vincoli"
          </p>
        </div>

        {/* SCHEDA TECNICA */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 1,
          background: '#e2e8f0',
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 20,
          border: '1px solid #e2e8f0'
        }}>
          {[
            { label: 'Tipologia', value: 'Prezzo fisso', highlight: false },
            { label: 'Durata blocco', value: '12 mesi', highlight: false },
            { label: 'Vincolo permanenza', value: 'Nessuno', highlight: true },
            { label: 'Penali recesso', value: '0 €', highlight: true },
            { label: 'Indicizzazione', value: 'No', highlight: false },
            { label: 'Sconto dual fuel', value: 'Disponibile', highlight: true }
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: item.highlight ? '#16a34a' : '#0f172a' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* CONFRONTO CRAS DINAMICO */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 20,
          background: '#f8fafc',
          padding: '20px 24px',
          borderRadius: 16,
          marginBottom: 24,
          alignItems: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per il tuo consumo</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: t.primary, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
              {parseFloat(consumoStr).toLocaleString('it-IT')} {unita}
            </div>
          </div>
          <div style={{ width: 1, background: '#cbd5e1', height: 50 }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CRAS stimato Plenitude</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
              € {Math.round(eniCRAS).toLocaleString('it-IT')}
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}> /anno</span>
            </div>
          </div>
        </div>

        {/* DOPPIO CTA — analisi prima, attivazione dopo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginBottom: 18 }}>

          {/* CTA primario: ANALISI (ora più prominente) */}
          <a
            href="/recensione-eni"
            style={{
              display: 'block',
              background: '#fff',
              color: '#0f172a',
              border: '2px solid #0f172a',
              padding: '14px 36px',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 15,
              textDecoration: 'none',
              width: '100%',
              maxWidth: 460,
              textAlign: 'center',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease'
            }}
          >
            📖 Leggi prima l'analisi completa del team →
          </a>

          {/* CTA secondario: ATTIVAZIONE */}
          <a
            href="https://www.awin1.com/cread.php?awinmid=9529&awinaffid=2811530"
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            style={{
              display: 'block',
              background: '#0f172a',
              color: '#fff',
              padding: '14px 36px',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 15,
              textDecoration: 'none',
              width: '100%',
              maxWidth: 460,
              textAlign: 'center',
              boxSizing: 'border-box',
              boxShadow: '0 8px 20px -8px rgba(15,23,42,0.5)'
            }}
          >
            Vai al sito Eni Plenitude →
          </a>

          <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
            Il link al fornitore contiene un codice di affiliazione tracciato
          </span>
        </div>

        {/* DISCLAIMER COMPLIANT */}
        <div style={{
          background: '#fafbfc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '14px 16px',
          marginTop: 12
        }}>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: '#0f172a' }}>Trasparenza commerciale.</strong> Questa sezione contiene un link di affiliazione: se attivi un contratto attraverso il nostro collegamento, riceviamo una commissione dal fornitore senza alcun costo aggiuntivo per te.
            La selezione editoriale è indipendente e non determinata dall'importo della commissione: la nostra metodologia di valutazione è descritta nell'analisi linkata sopra.
            Le condizioni economiche indicate (prezzo, durata, sconti, vincoli) sono quelle pubblicate dal fornitore alla data riportata sopra; verifica sempre le condizioni aggiornate sul sito ufficiale di Eni Plenitude prima di sottoscrivere qualsiasi contratto.
            Il calcolo del CRAS è una stima orientativa e non sostituisce la lettura della scheda informativa e delle condizioni generali di fornitura.
          </p>
        </div>
      </div>

    </div>
  );
}