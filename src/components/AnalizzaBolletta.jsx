import React, { useState, useRef, useMemo } from 'react';

// ============================================================================
// ANALIZZA BOLLETTA — Estrazione AI + diagnosi
// ============================================================================

// Prezzi medi di mercato (riferimenti per il confronto)
// Fonte: ARERA, medie trimestre in corso. Da aggiornare ogni trimestre.
const PREZZI_MEDI_MERCATO = {
  energia: {
    materiaMedio: 0.108,        // €/kWh medio mercato libero competitivo (apr 2026)
    materiaEconomico: 0.090,    // €/kWh migliori offerte variabili PUN+spread basso
    fissoMedio: 10,             // €/mese quota fissa media
    consumoAnnuoTipico: 2700    // kWh annui famiglia media
  },
  gas: {
    materiaMedio: 0.42,         // €/Smc medio mercato libero (apr 2026)
    materiaEconomico: 0.36,     // €/Smc migliori offerte variabili PSV+spread basso
    fissoMedio: 8,              // €/mese quota fissa media
    consumoAnnuoTipico: 1000    // Smc annui famiglia media
  }
};

const THEME = { primary: '#059669', soft: '#d1fae5', bg: '#ecfdf5' };

// Link affiliate Eni Plenitude (Awin)
const PLENITUDE_AFFILIATE_URL = 'https://www.awin1.com/cread.php?awinmid=9529&awinaffid=2811530&ued=https%3A%2F%2Fwww.eniplenitude.com%2F';

export function AnalizzaBolletta({ color = '#059669' }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | analyzing | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const t = THEME;

  const handleFile = (f) => {
    if (!f) return;
    const maxBytes = 8 * 1024 * 1024;
    const okTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!okTypes.includes(f.type)) {
      setErrorMsg('Formato non supportato. Usa PDF, JPG, PNG o WebP. Se hai un HEIC da iPhone, convertilo prima.');
      return;
    }
    if (f.size > maxBytes) {
      setErrorMsg('File troppo grande (max 8 MB).');
      return;
    }
    setFile(f);
    setErrorMsg(null);
    setResult(null);
    setStatus('idle');
  };

  const onInputChange = (e) => {
    const f = e.target.files?.[0];
    handleFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  const analyze = async () => {
    if (!file) return;
    setStatus('analyzing');
    setErrorMsg(null);

    try {
      const body = new FormData();
      body.append('file', file);

      const res = await fetch('/api/extract-bill', { method: 'POST', body });

      if (!res.ok) {
        let msg = 'Errore ' + res.status;
        try {
          const errData = await res.json();
          msg = errData.error + (errData.detail ? ': ' + errData.detail : '');
        } catch (_) {
          const txt = await res.text();
          if (txt) msg = txt;
        }
        throw new Error(msg);
      }

      const data = await res.json();
      setResult(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Errore imprevisto');
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStatus('idle');
    setErrorMsg(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Calcolo della diagnosi una volta ottenuto il result
  const diagnosi = useMemo(() => {
    if (!result) return null;
    const tipo = result.tipo === 'dual' ? 'energia' : (result.tipo || 'energia');
    const ref = PREZZI_MEDI_MERCATO[tipo];
    if (!ref) return null;

    const prezzoUtente = parseFloat(result.prezzoMateria);
    const consumoAnnuo = parseFloat(result.consumoAnnuo) || ref.consumoAnnuoTipico;

    if (isNaN(prezzoUtente) || prezzoUtente <= 0) {
      return { affidabile: false, ref, consumoAnnuo };
    }

    const deltaMedio = (prezzoUtente - ref.materiaMedio) * consumoAnnuo;
    const risparmioVsEconomico = Math.max(0, (prezzoUtente - ref.materiaEconomico) * consumoAnnuo);

    let giudizio = 'allineato';
    if (prezzoUtente > ref.materiaMedio * 1.15) giudizio = 'caro';
    else if (prezzoUtente < ref.materiaEconomico * 1.05) giudizio = 'economico';

    return { affidabile: true, ref, consumoAnnuo, deltaMedio, risparmioVsEconomico, giudizio };
  }, [result]);

  const formatEuro = (v) => `€ ${Math.abs(Math.round(v)).toLocaleString('it-IT')}`;
  const formatUnit = (v, decimals = 3) => {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return parseFloat(v).toFixed(decimals);
  };

  // --- STILI ALLINEATI AGLI ALTRI TOOL ---
  const cardBase = {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24,
    padding: '32px 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====================================================================
          AREA UPLOAD
          ==================================================================== */}
      {status !== 'success' && (
        <div style={{ ...cardBase, marginBottom: 24 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22, fontWeight: 800, color: '#0f172a',
            margin: '0 0 6px', letterSpacing: '-0.01em'
          }}>
            Analizza la tua bolletta
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
            Carica la bolletta (PDF o foto leggibile): l'AI estrae fornitore, prezzo e consumo, poi confrontiamo con i prezzi medi di mercato.
          </p>

          {/* DROPZONE */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            style={{
              border: isDragging ? `2px dashed ${t.primary}` : '2px dashed #cbd5e1',
              borderRadius: 16,
              padding: '40px 24px',
              textAlign: 'center',
              background: isDragging ? t.bg : '#f8fafc',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
              onChange={onInputChange}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
            />
            <div style={{ fontSize: 42, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              {file ? file.name : 'Trascina la bolletta o clicca per caricare'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {file ? `${Math.round(file.size / 1024)} KB` : 'PDF, JPG, PNG, WebP · max 8 MB'}
            </div>
          </div>

          {/* TRASPARENZA (niente fake GDPR) */}
          <div style={{
            marginTop: 16, padding: '12px 16px',
            background: '#f8fafc', borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontSize: 12, color: '#475569', lineHeight: 1.6
          }}>
            <strong style={{ color: '#0f172a' }}>🔒 Trasparenza:</strong> il file viene letto in tempo reale dal nostro modello AI (Anthropic Claude) tramite API. <strong>Non salviamo il PDF</strong> né i dati estratti nei nostri database. Se la bolletta contiene dati sensibili (codice cliente, POD, indirizzo) che preferisci non condividere con un servizio AI, anonimizzali prima di caricarla.
          </div>

          {/* AZIONI */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <button
              onClick={analyze}
              disabled={!file || status === 'analyzing'}
              style={{
                flex: '1 1 240px',
                padding: '14px 24px',
                borderRadius: 12, border: 'none',
                background: !file || status === 'analyzing' ? '#cbd5e1' : t.primary,
                color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: !file || status === 'analyzing' ? 'not-allowed' : 'pointer',
                boxShadow: !file || status === 'analyzing' ? 'none' : `0 8px 20px -4px ${t.primary}60`,
                transition: 'all 0.2s'
              }}
            >
              {status === 'analyzing' ? 'Analisi in corso...' : 'Analizza la bolletta →'}
            </button>
            {file && (
              <button
                onClick={reset}
                style={{
                  padding: '14px 20px',
                  borderRadius: 12, border: '1px solid #cbd5e1',
                  background: '#fff', color: '#64748b',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >Cambia file</button>
            )}
          </div>

          {/* ERROR */}
          {errorMsg && (
            <div style={{
              marginTop: 14, padding: '12px 14px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, fontSize: 13, color: '#991b1b'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* LOADING */}
          {status === 'analyzing' && (
            <div style={{
              marginTop: 20, padding: '20px',
              background: t.bg, border: `1px solid ${t.primary}40`,
              borderRadius: 12, textAlign: 'center'
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>
                🔍 Estrazione dati in corso...
              </div>
              <div style={{ fontSize: 12, color: '#047857', lineHeight: 1.5 }}>
                L'AI sta leggendo fornitore, prezzo e consumo. Operazione tipica: 5-15 secondi.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          RISULTATI
          ==================================================================== */}
      {status === 'success' && result && (
        <>
          {/* Diagnosi sintetica */}
          <div style={{ ...cardBase, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
              <div>
                <div style={{
                  display: 'inline-block', padding: '4px 10px',
                  background: t.soft, color: '#065f46',
                  borderRadius: 6, fontSize: 10, fontWeight: 800,
                  letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8
                }}>
                  ✓ Diagnosi completata
                </div>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22, fontWeight: 800, color: '#0f172a',
                  margin: '0 0 4px'
                }}>
                  {result.fornitore || 'Fornitore non identificato'}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  {result.tipo === 'gas' ? '🔥 Bolletta gas' : result.tipo === 'dual' ? '⚡🔥 Dual (luce+gas)' : '⚡ Bolletta luce'}
                  {result.tipoContratto && ` · ${result.tipoContratto}`}
                  {result.periodoFatturazione && ` · ${result.periodoFatturazione}`}
                </p>
              </div>
              <button
                onClick={reset}
                style={{
                  padding: '8px 14px', borderRadius: 10,
                  border: '1px solid #cbd5e1', background: '#fff',
                  color: '#64748b', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer'
                }}
              >↺ Nuova analisi</button>
            </div>

            {/* Warning confidence bassa */}
            {result.confidence === 'bassa' && (
              <div style={{
                padding: '10px 14px', background: '#fef3c7',
                border: '1px solid #fcd34d', borderRadius: 10,
                fontSize: 12, color: '#92400e', marginTop: 14
              }}>
                ⚠️ <strong>Confidenza bassa:</strong> la bolletta era parzialmente illeggibile o i dati erano contraddittori. Verifica manualmente i valori sotto prima di trarre conclusioni.
              </div>
            )}

            {/* Grid dati estratti */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12, marginTop: 20
            }}>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>
                  Prezzo materia
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                  €{formatUnit(result.prezzoMateria)}
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 4 }}>
                    /{result.tipo === 'gas' ? 'Smc' : 'kWh'}
                  </span>
                </div>
              </div>

              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>
                  Consumo annuo
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                  {result.consumoAnnuo ? Math.round(result.consumoAnnuo).toLocaleString('it-IT') : '—'}
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 4 }}>
                    {result.tipo === 'gas' ? 'Smc' : 'kWh'}
                  </span>
                </div>
              </div>

              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>
                  Costo fisso
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                  €{formatUnit(result.costoFissoMensile, 2)}
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 4 }}>/mese</span>
                </div>
              </div>

              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>
                  Totale bolletta
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                  {formatEuro(result.totaleBolletta)}
                </div>
              </div>
            </div>
          </div>

          {/* Box confronto con mercato */}
          {diagnosi && diagnosi.affidabile && (
            <div style={{
              ...cardBase,
              marginBottom: 20,
              background: diagnosi.giudizio === 'caro'
                ? 'linear-gradient(135deg, #fef2f2 0%, #fff 60%)'
                : diagnosi.giudizio === 'economico'
                  ? `linear-gradient(135deg, ${t.bg} 0%, #fff 60%)`
                  : '#fff',
              border: diagnosi.giudizio === 'caro'
                ? '2px solid #f87171'
                : diagnosi.giudizio === 'economico'
                  ? `2px solid ${t.primary}`
                  : '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>
                  {diagnosi.giudizio === 'caro' ? '🚨' : diagnosi.giudizio === 'economico' ? '✅' : '📊'}
                </span>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0
                }}>
                  {diagnosi.giudizio === 'caro' && 'Stai pagando troppo'}
                  {diagnosi.giudizio === 'economico' && 'Sei su una buona offerta'}
                  {diagnosi.giudizio === 'allineato' && 'Prezzo in linea col mercato'}
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
                <div style={{ padding: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Tu paghi
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                    €{formatUnit(result.prezzoMateria)}
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 4 }}>
                      /{result.tipo === 'gas' ? 'Smc' : 'kWh'}
                    </span>
                  </div>
                </div>
                <div style={{ padding: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Media mercato
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                    €{formatUnit(diagnosi.ref.materiaMedio)}
                  </div>
                </div>
                <div style={{ padding: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Miglior offerta
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: t.primary, fontVariantNumeric: 'tabular-nums' }}>
                    €{formatUnit(diagnosi.ref.materiaEconomico)}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '14px 16px', background: 'rgba(255,255,255,0.9)',
                borderRadius: 12, fontSize: 14, color: '#334155', lineHeight: 1.6
              }}>
                {diagnosi.giudizio === 'caro' && (
                  <>Sul tuo consumo annuo di <strong>{Math.round(diagnosi.consumoAnnuo).toLocaleString('it-IT')} {result.tipo === 'gas' ? 'Smc' : 'kWh'}</strong>, passando a un'offerta competitiva potresti risparmiare circa <strong style={{ color: '#dc2626' }}>{formatEuro(diagnosi.risparmioVsEconomico)}/anno</strong> sulla sola componente materia (esclusi oneri e imposte, che sono uguali per tutti i fornitori).</>
                )}
                {diagnosi.giudizio === 'economico' && (
                  <>Il prezzo che paghi è allineato alle migliori offerte del mercato libero. Stai già risparmiando rispetto alla media. Comunque vale la pena rivedere la tua offerta ogni 12 mesi: le promozioni cambiano spesso.</>
                )}
                {diagnosi.giudizio === 'allineato' && (
                  <>Il tuo prezzo è in linea con la media del mercato libero. Le migliori offerte variabili sul mercato in questo momento sono circa €{formatUnit(diagnosi.ref.materiaEconomico)}/{result.tipo === 'gas' ? 'Smc' : 'kWh'}: cambiando potresti risparmiare fino a <strong>{formatEuro(diagnosi.risparmioVsEconomico)}/anno</strong>.</>
                )}
              </div>

              {/* SUGGERIMENTO CONTESTUALE PLENITUDE */}
              {diagnosi.giudizio !== 'economico' && diagnosi.risparmioVsEconomico > 30 && (() => {
                const prezzoPlenitude = result.tipo === 'gas' ? 0.705 : 0.188;
                const prezzoUtente = parseFloat(result.prezzoMateria);
                const risparmioPlenitude = Math.max(0, (prezzoUtente - prezzoPlenitude) * diagnosi.consumoAnnuo);
                if (risparmioPlenitude < 30) return null;
                return (
                  <div style={{
                    marginTop: 16,
                    background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
                    border: '2px solid #f59e0b',
                    borderRadius: 14,
                    padding: '20px 22px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>💡</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suggerimento basato sulla tua bolletta</span>
                    </div>
                    <div style={{ fontSize: 15, color: '#0f172a', lineHeight: 1.6, marginBottom: 12 }}>
                      Una delle offerte che monitoriamo, <strong>Eni Plenitude Fixa Time Smart</strong>, blocca il prezzo {result.tipo === 'gas' ? 'gas a €0,705/Smc' : 'luce a €0,188/kWh'} per 12 mesi. Sul tuo consumo annuo, il risparmio stimato sarebbe di circa <strong style={{ color: '#dc2626', fontSize: 18 }}>{formatEuro(risparmioPlenitude)}/anno</strong> sulla sola componente materia.
                    </div>
                    <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 12 }}>
                      <strong style={{ color: '#0f172a' }}>Calcolo:</strong> ({prezzoUtente.toFixed(3)} − {prezzoPlenitude.toFixed(3)}) × {Math.round(diagnosi.consumoAnnuo).toLocaleString('it-IT')} {result.tipo === 'gas' ? 'Smc' : 'kWh'} = {formatEuro(risparmioPlenitude)}/anno
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <a href="/recensione-eni" style={{
                        display: 'inline-block', padding: '10px 16px', borderRadius: 10,
                        background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1',
                        fontSize: 12, fontWeight: 800, textDecoration: 'none', flex: '1 1 auto', textAlign: 'center'
                      }}>📖 Leggi la recensione</a>
                      <a href="https://www.awin1.com/cread.php?awinmid=9529&awinaffid=2811530"
                        target="_blank" rel="noopener noreferrer sponsored nofollow"
                        style={{
                          display: 'inline-block', padding: '10px 16px', borderRadius: 10,
                          background: '#f59e0b', color: '#fff',
                          fontSize: 12, fontWeight: 800, textDecoration: 'none', flex: '1 1 auto', textAlign: 'center'
                        }}>Vai a Plenitude →</a>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 10, color: '#92400e', lineHeight: 1.5 }}>
                      <span style={{ background: '#fde68a', color: '#78350f', padding: '2px 6px', borderRadius: 3, fontWeight: 800, marginRight: 6 }}>#ADV</span>
                      Stima del solo costo materia. Il totale in bolletta include anche oneri di sistema, trasporto, distribuzione e imposte (uguali per tutti i fornitori). Verifica le condizioni aggiornate sul sito ufficiale prima di sottoscrivere.
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Diagnosi non affidabile */}
          {diagnosi && !diagnosi.affidabile && (
            <div style={{
              ...cardBase,
              marginBottom: 20,
              background: '#fffbeb', border: '2px solid #fbbf24'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>⚠️</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#92400e', margin: 0 }}>
                  Non riesco a confrontarti col mercato
                </h3>
              </div>
              <p style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6, margin: 0 }}>
                Il prezzo della materia non è stato estratto in modo affidabile dalla bolletta (spesso succede con offerte indicizzate PUN/PSV, dove la bolletta mostra solo "spread"). Prova a caricare una bolletta più recente o con il dettaglio delle componenti economiche più leggibile.
              </p>
            </div>
          )}

          {/* CTA AFFILIATE PLENITUDE */}
          <div style={{
            ...cardBase,
            marginBottom: 20,
            background: 'linear-gradient(135deg, #fff 0%, #fef3c7 100%)',
            border: '2px solid #fbbf24'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <div>
                <div style={{
                  display: 'inline-flex', gap: 6, alignItems: 'center', marginBottom: 10
                }}>
                  <span style={{
                    background: '#fbbf24', color: '#78350f',
                    fontSize: 10, fontWeight: 800,
                    padding: '3px 8px', borderRadius: 6,
                    letterSpacing: '0.05em'
                  }}>#ADV</span>
                  <span style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>
                    Link affiliato · Selezionato il 23 aprile 2026
                  </span>
                </div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20, fontWeight: 800, color: '#0f172a',
                  margin: '0 0 6px'
                }}>
                  Valuta un'alternativa: Eni Plenitude
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                  Fornitore italiano con offerte luce e gas sia fisse sia variabili, possibilità di pagamento RID/bollettino, app per monitoraggio consumi e servizio clienti in italiano. Verifica le condizioni economiche attuali direttamente sul sito.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 14, marginBottom: 16 }}>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: '#92400e', fontWeight: 700, marginBottom: 2 }}>Mercato</div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>Libero · fisso/variabile</div>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: '#92400e', fontWeight: 700, marginBottom: 2 }}>Copertura</div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>Nazionale</div>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: '#92400e', fontWeight: 700, marginBottom: 2 }}>Dual</div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>Luce + gas</div>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: '#92400e', fontWeight: 700, marginBottom: 2 }}>App</div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>iOS/Android</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a
                href="/luce-gas"
                style={{
                  flex: '1 1 200px',
                  padding: '12px 20px', borderRadius: 12,
                  background: '#fff', color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  fontSize: 13, fontWeight: 700,
                  textDecoration: 'none', textAlign: 'center'
                }}
              >Leggi analisi del team →</a>
              <a
                href={PLENITUDE_AFFILIATE_URL}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                style={{
                  flex: '1 1 200px',
                  padding: '12px 20px', borderRadius: 12,
                  background: '#fbbf24', color: '#78350f',
                  fontSize: 13, fontWeight: 800,
                  textDecoration: 'none', textAlign: 'center',
                  boxShadow: '0 8px 20px -6px rgba(251,191,36,0.5)'
                }}
              >Vedi offerte Plenitude →</a>
            </div>

            <p style={{ fontSize: 10, color: '#78350f', margin: '14px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
              Selezione editoriale indipendente. Potremmo ricevere una commissione se attivi un contratto tramite questo link, senza costi aggiuntivi per te. La commissione non determina la scelta del fornitore segnalato.
            </p>
          </div>

          {/* Azioni finali */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <a
              href="/luce-gas"
              style={{
                flex: '1 1 200px',
                padding: '14px 20px', borderRadius: 12,
                border: `2px solid ${t.primary}`, background: '#fff',
                color: t.primary, fontSize: 13, fontWeight: 800,
                textDecoration: 'none', textAlign: 'center'
              }}
            >🔍 Confronta tutte le offerte luce/gas</a>
            <button
              onClick={reset}
              style={{
                flex: '1 1 200px',
                padding: '14px 20px', borderRadius: 12,
                border: '1px solid #cbd5e1', background: '#fff',
                color: '#64748b', fontSize: 13, fontWeight: 700,
                cursor: 'pointer'
              }}
            >📄 Analizza un'altra bolletta</button>
          </div>
        </>
      )}

      {/* ====================================================================
          DISCLAIMER FINALE
          ==================================================================== */}
      <div style={{
        marginTop: 40, padding: '20px 24px',
        background: '#f8fafc', borderRadius: 16,
        border: '1px solid #e2e8f0',
        fontSize: 11, color: '#64748b', lineHeight: 1.7
      }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, fontSize: 12 }}>
          ⚠️ Nota metodologica e disclaimer
        </div>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Metodologia:</strong> i prezzi di mercato di confronto sono medie elaborate da dati pubblici ARERA e da monitoraggio delle principali offerte del mercato libero aggiornate al trimestre in corso. I valori confrontati sono riferiti alla sola componente <strong>materia energia/gas</strong>: oneri di sistema, trasporto e imposte (IVA, accise) sono uguali per tutti i fornitori e non sono oggetto di confronto.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Stime non vincolanti:</strong> il risparmio annuo indicato è una stima calcolata moltiplicando la differenza di prezzo unitario per il consumo annuo dichiarato in bolletta. Il risparmio reale dipende da variabili che non conosciamo: andamento del PUN/PSV per le offerte variabili, promo di benvenuto, bonus cashback, penali recesso dell'offerta attuale, condizioni di pagamento (RID vs bollettino).
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Non siamo consulenti energetici.</strong> Questo strumento è informativo e non costituisce consulenza ai sensi del Codice del Consumo. Per confronti ufficiali certificati, usa il <strong>Portale Offerte ARERA</strong> (portaleofferte.it), l'unico comparatore istituzionale gratuito previsto dalla normativa.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Trattamento dati:</strong> il file caricato viene trasmesso via HTTPS al servizio AI Anthropic per l'estrazione, non viene salvato nei nostri database. I dati anagrafici eventualmente presenti nella bolletta (nome, indirizzo, POD/PDR, codice cliente) non sono necessari al confronto: se vuoi, anonimizzali prima del caricamento.
        </p>
      </div>

    </div>
  );
}