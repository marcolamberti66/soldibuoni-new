import React, { useState, useMemo } from 'react';

// ============================================================================
// FORFETTARIO VS ORDINARIO — Calcolatore comparativo
// Riferimenti normativi: Legge di Bilancio 2026, D.Lgs. 252/2005, Agenzia Entrate
// ============================================================================

// --- COSTANTI FISCALI 2026 (verifica a gennaio ogni anno) ---

// Scaglioni IRPEF 2024-2026 (3 scaglioni confermati dalla Legge di Bilancio 2026)
const SCAGLIONI_IRPEF = [
  { fino: 28000, aliquota: 0.23 },
  { fino: 50000, aliquota: 0.35 },
  { fino: Infinity, aliquota: 0.43 }
];

const ADDIZIONALE_REGIONALE_MEDIA = 0.0173;  // Media nazionale ~1,73%
const ADDIZIONALE_COMUNALE_MEDIA = 0.008;    // Media ~0,8%
const INPS_GESTIONE_SEPARATA = 0.2607;       // 26,07% per senza cassa
const INPS_GS_MINIMALE_2026 = 4208;          // Minimale contributivo GS 2026 (stima)
const INPS_COMMERCIANTI_FISSO = 4427;        // Contributo fisso artigiani/commercianti 2026 (stima)
const SOGLIA_FORFETTARIO = 85000;            // Soglia massima ricavi
const SOGLIA_USCITA_IMMEDIATA = 100000;      // Oltre questa esci dal regime nell'anno stesso
const ANNI_STARTUP = 5;
const ALIQUOTA_STARTUP = 0.05;
const ALIQUOTA_FORFETTARIO = 0.15;

// Coefficienti di redditività per gruppi ATECO (normativa forfettario)
const CATEGORIE_ATECO = [
  { id: 'professioni', label: 'Professioni intellettuali', coeff: 0.78, desc: 'Consulenti, avvocati, ingegneri, architetti, commercialisti' },
  { id: 'servizi', label: 'Altre attività di servizi', coeff: 0.67, desc: 'Servizi alle imprese, estetisti, parrucchieri, servizi vari' },
  { id: 'commercio', label: 'Commercio al dettaglio e ingrosso', coeff: 0.40, desc: 'Vendita di beni (negozi, e-commerce)' },
  { id: 'intermediari', label: 'Intermediari del commercio', coeff: 0.62, desc: 'Agenti di commercio, procacciatori' },
  { id: 'costruzioni', label: 'Costruzioni e attività immobiliari', coeff: 0.86, desc: 'Edilizia, agenzie immobiliari' },
  { id: 'ristorazione', label: 'Alberghi e ristorazione', coeff: 0.40, desc: 'Ristoranti, bar, B&B, affittacamere' },
  { id: 'industrie', label: 'Industrie alimentari', coeff: 0.40, desc: 'Produzione e trasformazione alimentare' }
];

const THEME = { primary: '#6366f1', soft: '#e0e7ff', bg: '#eef2ff' };

// --- UTILS ---
function calcolaIrpef(imponibile) {
  if (imponibile <= 0) return 0;
  let tassa = 0;
  let residuo = imponibile;
  let precedente = 0;
  for (const s of SCAGLIONI_IRPEF) {
    const quota = Math.min(residuo, s.fino - precedente);
    if (quota <= 0) break;
    tassa += quota * s.aliquota;
    residuo -= quota;
    precedente = s.fino;
    if (residuo <= 0) break;
  }
  return tassa;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function ForfettarioVsOrdinario({ color }) {
  const [fatturatoStr, setFatturatoStr] = useState('40000');
  const [speseStr, setSpeseStr] = useState('3000');
  const [anniAttivitaStr, setAnniAttivitaStr] = useState('2');
  const [categoria, setCategoria] = useState('professioni');
  const [tipoInps, setTipoInps] = useState('gestione_separata'); // gestione_separata | cassa_propria | commercianti
  const t = THEME;
  const themeColor = color || t.primary;

  const catSelected = CATEGORIE_ATECO.find(c => c.id === categoria) || CATEGORIE_ATECO[0];

  const risultati = useMemo(() => {
    const fatturato = parseFloat(fatturatoStr) || 0;
    const spese = parseFloat(speseStr) || 0;
    const anniAttivita = parseInt(anniAttivitaStr) || 0;

    const oltre100k = fatturato > SOGLIA_USCITA_IMMEDIATA;
    const eligibile = fatturato <= SOGLIA_FORFETTARIO;
    const sopraSoglia85k = fatturato > SOGLIA_FORFETTARIO && fatturato <= SOGLIA_USCITA_IMMEDIATA;
    const startup = anniAttivita <= ANNI_STARTUP;
    const aliquotaForf = startup ? ALIQUOTA_STARTUP : ALIQUOTA_FORFETTARIO;

    // ══════ FORFETTARIO ══════
    const redditoImponibileForf = fatturato * catSelected.coeff;

    // INPS forfettario
    let inpsForf = 0;
    if (tipoInps === 'gestione_separata') {
      // Gestione Separata: 26,07% sul reddito imponibile, con minimale
      inpsForf = Math.max(redditoImponibileForf * INPS_GESTIONE_SEPARATA, INPS_GS_MINIMALE_2026);
      // Se reddito imponibile zero, minimale comunque dovuto solo se tassato > 0
      if (redditoImponibileForf <= 0) inpsForf = 0;
    } else if (tipoInps === 'commercianti') {
      // Artigiani/Commercianti: contributo fisso + aliquota su eccedente
      inpsForf = INPS_COMMERCIANTI_FISSO;
      // Semplificazione: non calcoliamo l'eccedente oltre il minimale imponibile
    }
    // cassa_propria: inps = 0 (paga alla propria cassa, che non calcoliamo)

    const imponibileTassabileForf = Math.max(0, redditoImponibileForf - inpsForf);
    const impostaSostitutivaForf = imponibileTassabileForf * aliquotaForf;
    const nettoForf = fatturato - spese - inpsForf - impostaSostitutivaForf;

    // ══════ ORDINARIO ══════
    const redditoOrdinario = Math.max(0, fatturato - spese);
    let inpsOrd = 0;
    if (tipoInps === 'gestione_separata') {
      inpsOrd = Math.max(redditoOrdinario * INPS_GESTIONE_SEPARATA, INPS_GS_MINIMALE_2026);
      if (redditoOrdinario <= 0) inpsOrd = 0;
    } else if (tipoInps === 'commercianti') {
      inpsOrd = INPS_COMMERCIANTI_FISSO;
    }
    const imponibileIrpef = Math.max(0, redditoOrdinario - inpsOrd);
    const irpef = calcolaIrpef(imponibileIrpef);
    const addReg = imponibileIrpef * ADDIZIONALE_REGIONALE_MEDIA;
    const addCom = imponibileIrpef * ADDIZIONALE_COMUNALE_MEDIA;
    const totImposteOrd = irpef + addReg + addCom;
    const nettoOrd = fatturato - spese - inpsOrd - totImposteOrd;

    const differenza = nettoForf - nettoOrd;
    const convieneForf = differenza > 0 && eligibile;

    return {
      eligibile, sopraSoglia85k, oltre100k, startup, aliquotaForf,
      forf: {
        redditoImponibile: Math.round(redditoImponibileForf),
        inps: Math.round(inpsForf),
        imposta: Math.round(impostaSostitutivaForf),
        netto: Math.round(nettoForf)
      },
      ord: {
        reddito: Math.round(redditoOrdinario),
        inps: Math.round(inpsOrd),
        irpef: Math.round(irpef),
        addRegionale: Math.round(addReg),
        addComunale: Math.round(addCom),
        totImposte: Math.round(totImposteOrd),
        netto: Math.round(nettoOrd)
      },
      differenza: Math.round(differenza),
      convieneForf
    };
  }, [fatturatoStr, categoria, anniAttivitaStr, speseStr, tipoInps, catSelected]);

  // --- STILI BASE ---
  const cardBase = {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24,
    padding: '32px 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 800, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10
  };
  const inputStyle = {
    width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1',
    borderRadius: 12, boxSizing: 'border-box', color: '#0f172a', background: '#fff', outline: 'none'
  };
  const formatEuro = (v) => `€ ${Math.round(v).toLocaleString('it-IT')}`;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      <style dangerouslySetInnerHTML={{__html:`
        .fvo-card { padding:32px 24px; }
        .fvo-grid-inputs { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:20px; margin-bottom:20px; }
        .fvo-results { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:18px; }
        @media(max-width:500px){
          .fvo-card { padding:20px 16px !important; }
          .fvo-card h2 { font-size:18px !important; }
          .fvo-grid-inputs { grid-template-columns:1fr 1fr !important; gap:12px !important; }
          .fvo-grid-inputs > .fvo-full { grid-column:1/-1; }
          .fvo-results { grid-template-columns:1fr !important; gap:14px !important; }
          .fvo-results .fvo-num { font-size:24px !important; }
        }
      `}}/>

      {/* ====================================================================
          INPUT PANEL
          ==================================================================== */}
      <div className="fvo-card" style={{ ...cardBase, marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22, fontWeight: 800, color: '#0f172a',
          margin: '0 0 6px', letterSpacing: '-0.01em'
        }}>
          Simulatore regime fiscale
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
          Inserisci fatturato annuo, spese reali, anni di attività e categoria: il calcolatore confronta il netto in regime forfettario vs ordinario.
        </p>

        <div className="fvo-grid-inputs">

          <div>
            <label style={labelStyle}>Fatturato annuo previsto (€)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700, fontSize: 15 }}>€</span>
              <input
                type="number" min="0" step="1000"
                value={fatturatoStr}
                onChange={(e) => setFatturatoStr(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 30, fontWeight: 800, color: themeColor }}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Spese reali stimate (€)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700, fontSize: 15 }}>€</span>
              <input
                type="number" min="0" step="100"
                value={speseStr}
                onChange={(e) => setSpeseStr(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 30 }}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Anni dalla apertura P.IVA</label>
            <input
              type="number" min="0" max="50"
              value={anniAttivitaStr}
              onChange={(e) => setAnniAttivitaStr(e.target.value)}
              style={inputStyle}
            />
            {parseInt(anniAttivitaStr) <= ANNI_STARTUP && (
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                ✓ Aliquota startup agevolata 5% attiva
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Categoria di attività (coefficiente redditività)</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer', paddingRight: 40 }}
          >
            {CATEGORIE_ATECO.map(c => (
              <option key={c.id} value={c.id}>
                {c.label} — coeff. {Math.round(c.coeff * 100)}%
              </option>
            ))}
          </select>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{catSelected.desc}</div>
        </div>

        <div>
          <label style={labelStyle}>Contribuzione previdenziale</label>
          <div style={{
            display: 'flex', flexWrap: 'wrap',
            background: '#f1f5f9', padding: 6, borderRadius: 14, gap: 4
          }}>
            {[
              { id: 'gestione_separata', label: 'Gestione Separata INPS', sub: 'freelance senza cassa' },
              { id: 'cassa_propria', label: 'Cassa Professionale', sub: 'avvocati, medici, ingegneri' },
              { id: 'commercianti', label: 'Commercianti/Artigiani', sub: 'contributo fisso' }
            ].map(o => {
              const active = tipoInps === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setTipoInps(o.id)}
                  style={{
                    flex: '1 1 130px', padding: '10px 12px',
                    borderRadius: 10, border: 'none',
                    background: active ? '#fff' : 'transparent',
                    color: active ? themeColor : '#64748b',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    boxShadow: active ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s', textAlign: 'left', lineHeight: 1.2
                  }}
                >
                  <div>{o.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.7 }}>{o.sub}</div>
                </button>
              );
            })}
          </div>
          {tipoInps === 'cassa_propria' && (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>
              ⓘ Per le casse professionali i contributi variano molto (5-18%): il calcolatore non li include. Aggiungili manualmente alle "spese reali" se vuoi un risultato completo.
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          WARNING SOGLIE
          ==================================================================== */}
      {risultati.oltre100k && (
        <div style={{
          background: '#fee2e2', border: '2px solid #dc2626',
          borderRadius: 16, padding: '16px 20px', marginBottom: 24
        }}>
          <div style={{ fontWeight: 900, color: '#991b1b', fontSize: 15, marginBottom: 6 }}>
            🚨 Oltre la soglia di uscita immediata (€100.000)
          </div>
          <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.6 }}>
            Superare i €100.000 di fatturato annuo comporta la <strong>cessazione immediata del regime forfettario nello stesso anno</strong>. Dovrai applicare l'IVA alle fatture emesse dopo il superamento e tassazione IRPEF ordinaria sull'intero reddito dell'anno. Il confronto sotto è puramente teorico.
          </div>
        </div>
      )}

      {risultati.sopraSoglia85k && !risultati.oltre100k && (
        <div style={{
          background: '#fef3c7', border: '2px solid #f59e0b',
          borderRadius: 16, padding: '16px 20px', marginBottom: 24
        }}>
          <div style={{ fontWeight: 900, color: '#92400e', fontSize: 15, marginBottom: 6 }}>
            ⚠️ Oltre la soglia di accesso (€85.000)
          </div>
          <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
            Con un fatturato tra €85.000 e €100.000 <strong>resti in forfettario per l'anno in corso</strong>, ma dal 1° gennaio successivo passi automaticamente al regime ordinario. Programma in anticipo il passaggio (apertura conto IVA, numerazione fatture, software di contabilità).
          </div>
        </div>
      )}

      {/* ====================================================================
          VERDETTO
          ==================================================================== */}
      <div style={{
        background: `linear-gradient(135deg, ${themeColor}12, ${themeColor}04)`,
        border: `2px solid ${themeColor}40`,
        borderRadius: 24, padding: '28px 24px', marginBottom: 24, textAlign: 'center'
      }}>
        <div style={{
          fontSize: 11, color: '#64748b', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10
        }}>
          Confronto netto annuo
        </div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22, fontWeight: 800, color: '#0f172a',
          marginBottom: 8, lineHeight: 1.3
        }}>
          {!risultati.eligibile
            ? `Con questo fatturato non puoi usare il forfettario`
            : risultati.convieneForf
              ? `Il Forfettario ti fa risparmiare ${formatEuro(Math.abs(risultati.differenza))}/anno`
              : `L'Ordinario ti fa risparmiare ${formatEuro(Math.abs(risultati.differenza))}/anno`}
        </div>
        {risultati.startup && risultati.convieneForf && risultati.eligibile && (
          <div style={{
            display: 'inline-block',
            fontSize: 12, color: '#059669', fontWeight: 800,
            background: '#dcfce7', padding: '6px 14px', borderRadius: 20, marginTop: 6
          }}>
            ✨ Aliquota startup 5% attiva (primi 5 anni)
          </div>
        )}
      </div>

      {/* ====================================================================
          CONFRONTO A DUE COLONNE
          ==================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, marginBottom: 24
      }}>

        {/* FORFETTARIO */}
        <div style={{
          background: '#fff',
          border: risultati.convieneForf && risultati.eligibile
            ? `2px solid ${themeColor}`
            : !risultati.eligibile
              ? '1px solid #fecaca'
              : '1px solid #e2e8f0',
          borderRadius: 24, padding: 24, position: 'relative',
          opacity: !risultati.eligibile ? 0.6 : 1,
          boxShadow: risultati.convieneForf && risultati.eligibile
            ? `0 20px 40px -12px ${themeColor}30`
            : '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          {risultati.convieneForf && risultati.eligibile && (
            <div style={{
              position: 'absolute', top: -12, left: 20,
              background: themeColor, color: '#fff',
              fontSize: 10, fontWeight: 900,
              padding: '4px 12px', borderRadius: 20,
              letterSpacing: '0.05em'
            }}>🥇 SCELTA MIGLIORE</div>
          )}
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Regime Forfettario
          </h3>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>
            Imposta sostitutiva {Math.round(risultati.aliquotaForf * 100)}% · Base {Math.round(catSelected.coeff * 100)}% del fatturato
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Reddito imponibile forfettario</span>
              <span style={{ color: '#0f172a', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {formatEuro(risultati.forf.redditoImponibile)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Contributi INPS</span>
              <span style={{ color: '#dc2626', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                − {formatEuro(risultati.forf.inps)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Imposta sostitutiva</span>
              <span style={{ color: '#dc2626', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                − {formatEuro(risultati.forf.imposta)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Spese reali sostenute</span>
              <span style={{ color: '#dc2626', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                − {formatEuro(parseFloat(speseStr) || 0)}
              </span>
            </div>
            <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Netto in mano
              </span>
              <span style={{
                fontSize: 26, fontWeight: 900,
                color: risultati.convieneForf && risultati.eligibile ? themeColor : '#0f172a',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {formatEuro(risultati.forf.netto)}
              </span>
            </div>
          </div>
        </div>

        {/* ORDINARIO */}
        <div style={{
          background: '#fff',
          border: !risultati.convieneForf || !risultati.eligibile
            ? `2px solid ${themeColor}`
            : '1px solid #e2e8f0',
          borderRadius: 24, padding: 24, position: 'relative',
          boxShadow: !risultati.convieneForf || !risultati.eligibile
            ? `0 20px 40px -12px ${themeColor}30`
            : '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          {(!risultati.convieneForf || !risultati.eligibile) && (
            <div style={{
              position: 'absolute', top: -12, left: 20,
              background: themeColor, color: '#fff',
              fontSize: 10, fontWeight: 900,
              padding: '4px 12px', borderRadius: 20,
              letterSpacing: '0.05em'
            }}>🥇 SCELTA MIGLIORE</div>
          )}
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Regime Ordinario
          </h3>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>
            IRPEF a scaglioni + addizionali · spese deducibili
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Utile (fatturato − spese)</span>
              <span style={{ color: '#0f172a', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {formatEuro(risultati.ord.reddito)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Contributi INPS</span>
              <span style={{ color: '#dc2626', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                − {formatEuro(risultati.ord.inps)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>IRPEF (3 scaglioni)</span>
              <span style={{ color: '#dc2626', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                − {formatEuro(risultati.ord.irpef)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Addizionali regionale + comunale</span>
              <span style={{ color: '#dc2626', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                − {formatEuro(risultati.ord.addRegionale + risultati.ord.addComunale)}
              </span>
            </div>
            <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Netto in mano
              </span>
              <span style={{
                fontSize: 26, fontWeight: 900,
                color: !risultati.convieneForf || !risultati.eligibile ? themeColor : '#0f172a',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {formatEuro(risultati.ord.netto)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ====================================================================
          NOTA METODOLOGICA SEMPRE VISIBILE
          ==================================================================== */}
      <div style={{
        padding: '16px 20px', background: '#fffbeb',
        border: '1px solid #fbbf24', borderRadius: 14,
        fontSize: 12, color: '#78350f', lineHeight: 1.7, marginBottom: 24
      }}>
        <strong style={{ color: '#92400e', display: 'block', marginBottom: 6 }}>
          ℹ️ Come leggere questi numeri
        </strong>
        Il calcolatore confronta il <strong>netto in mano</strong> nei due regimi, sottraendo sempre dal fatturato le spese reali dichiarate (anche in forfettario, dove non sono deducibili fiscalmente ma le hai comunque sostenute). L'ordinario usa una media di addizionali regionale (1,73%) e comunale (0,8%): nel tuo comune possono essere più alte o più basse. <strong>Non sono incluse</strong>: IRAP (non si applica a contribuenti senza autonoma organizzazione), detrazioni personali (spese mediche, familiari a carico, mutuo prima casa, ristrutturazioni: valide solo in ordinario e possono ribaltare il risultato), IVA sulle vendite (il forfettario non la applica, l'ordinario sì ma la compensa su acquisti).
      </div>

      {/* ====================================================================
          DISCLAIMER LEGALE
          ==================================================================== */}
      <div style={{
        padding: '20px 24px', background: '#f8fafc',
        border: '1px solid #e2e8f0', borderRadius: 16,
        fontSize: 11, color: '#64748b', lineHeight: 1.7
      }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, fontSize: 12 }}>
          ⚠️ Disclaimer legale
        </div>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Strumento informativo, non consulenza fiscale.</strong> SoldiBuoni non è un commercialista iscritto all'ODCEC e non fornisce consulenza fiscale personalizzata ai sensi del D.Lgs. 139/2005. Questo simulatore offre un confronto approssimato basato sulle aliquote 2026 e su semplificazioni metodologiche.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Parametri aggiornati al 2026.</strong> Soglie di accesso al forfettario (€85.000), cessazione immediata (€100.000), soglia reddito dipendente (€35.000), aliquota startup 5% per 5 anni, imposta sostitutiva 15%, scaglioni IRPEF 23%/33%/43%, Gestione Separata INPS 26,07%, minimale contributivo stimato €4.208. Verifica sempre i valori correnti sul sito dell'Agenzia delle Entrate e dell'INPS: la Legge di Bilancio di ciascun anno può modificarli.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Elementi non calcolati</strong>: cause ostative (ex datori di lavoro, partecipazioni in società, spese dipendenti oltre €20.000), IRAP (non dovuta dai professionisti senza autonoma organizzazione), detrazioni personali (spese mediche, mutuo, familiari a carico, ristrutturazioni) applicabili solo all'ordinario, IVA sulle operazioni, contributi cassa propria (variabili per categoria professionale), addizionali regionali e comunali specifiche del tuo comune di residenza.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Consulta un professionista.</strong> Per decisioni reali sul regime fiscale rivolgiti a un commercialista iscritto ODCEC o a un consulente del lavoro iscritto all'Albo: solo loro possono valutare in modo vincolante le tue specifiche cause ostative, la tua situazione familiare e l'effetto delle detrazioni.
        </p>
      </div>

    </div>
  );
}