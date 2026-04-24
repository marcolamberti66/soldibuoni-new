import React, { useState, useEffect } from 'react';

// ============================================================================
// QUANTO SPENDO — Wizard potenziato con:
// - Landing intro
// - localStorage persistence
// - Benchmark medie italiane per slider
// - Risultati ordinati per priorità impatto
// - Piano d'azione in 3 mesi
// - Cross-link precompilati verso tool correlati
// - CTA Newsletter con interessi preselezionati
// ============================================================================

const STORAGE_KEY = 'soldibuoni_quantospendo_v2';
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const STEPS = ['Bollette', 'Auto & Servizi', 'Casa & Famiglia', 'Risultati'];

// Medie nazionali per categoria (riferimenti: ARERA, ACI, ABI 2025-2026)
const BENCHMARK = {
  luce: { media: 72, label: 'Media famiglia italiana' },
  gas: { media: 88, label: 'Media famiglia con riscaldamento autonomo' },
  internet: { media: 27, label: 'Offerta media fibra' },
  rcAuto: { media: 395, label: 'Premio medio ANIA' },
  carburante: { media: 140, label: 'Media automobilista italiano' },
  contoCosto: { media: 85, label: 'Canone medio conto tradizionale' },
  polizza: { media: 45, label: 'Polizza sanitaria individuale base' },
  rataCasa: { media: 650, label: 'Rata media mutuo prima casa' }
};

const STATE_INIZIALE = {
  luce: 70, gas: 80, riscaldamento: true, internet: 28,
  haAuto: true, rcAuto: 380, carburanteMese: 140,
  contoCosto: 60, haPolizza: false, polizza: 40,
  tipoCasa: 'mutuo', rataCasa: 650,
  haUni: false, retta: 2500,
};

// ============================================================================
// COMPONENTI UI
// ============================================================================

function Box({ title, children }) {
  return (
    <div className="qs-box">
      {title && <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 20, letterSpacing: '-0.01em' }}>{title}</h3>}
      {children}
    </div>
  );
}

function Sl({ label, value, onChange, min, max, step, prefix, suffix, color, benchmark }) {
  const [dragVal, setDragVal] = useState(value);
  useEffect(() => { setDragVal(value); }, [value]);

  const displayVal = step ? Math.round(dragVal / step) * step : dragVal;
  const display = (prefix || '') + displayVal.toLocaleString('it-IT') + (suffix || '');

  // Position del marker benchmark come %
  const benchmarkPct = benchmark ? ((benchmark.media - min) / (max - min)) * 100 : null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>{label}</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: color || '#059669', fontVariantNumeric: 'tabular-nums' }}>{display}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="range" min={min} max={max} step="1"
          value={dragVal}
          onChange={(e) => {
            const raw = +e.target.value;
            setDragVal(raw);
            const snapped = step ? Math.round(raw / step) * step : raw;
            onChange(snapped);
          }}
          style={{ width: '100%', accentColor: color || '#059669', height: 8, touchAction: 'none' }}
        />
        {/* Marker benchmark */}
        {benchmarkPct !== null && benchmarkPct >= 0 && benchmarkPct <= 100 && (
          <div style={{
            position: 'absolute', top: -6, left: `${benchmarkPct}%`,
            transform: 'translateX(-50%)',
            width: 2, height: 14,
            background: '#94a3b8',
            pointerEvents: 'none'
          }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
        <span>{(prefix || '') + min}</span>
        {benchmark && (
          <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
            📊 {benchmark.label}: {prefix || ''}{benchmark.media}{suffix || ''}
          </span>
        )}
        <span>{(prefix || '') + max + (suffix || '')}</span>
      </div>
    </div>
  );
}

function Pill({ options, value, onChange, color }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              flex: 1, minWidth: 80,
              padding: '12px 18px',
              borderRadius: 14,
              border: active ? `2px solid ${color || '#059669'}` : '1px solid #e2e8f0',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: active ? `${color || '#059669'}10` : '#fff',
              color: active ? '#0f172a' : '#64748b',
              textAlign: 'center',
              transition: `all 0.2s ${EASE}`
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Tog({ label, icon, checked, onChange, color }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', padding: '14px 18px',
        borderRadius: 14,
        border: checked ? `2px solid ${color || '#059669'}` : '1px solid #e2e8f0',
        background: checked ? `${color || '#059669'}08` : '#fff',
        cursor: 'pointer', fontSize: 15, fontWeight: 700,
        color: checked ? '#0f172a' : '#475569',
        marginBottom: 12, transition: `all 0.2s ${EASE}`
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        border: checked ? 'none' : '2px solid #cbd5e1',
        background: checked ? (color || '#059669') : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 900, fontSize: 13
      }}>
        {checked ? '✓' : ''}
      </div>
    </button>
  );
}

function SavRow({ icon, label, annuo, risparmio, color, link, linkText, priorita }) {
  const pct = annuo > 0 && risparmio > 0 ? Math.min(100, (risparmio / annuo) * 100) : 0;
  const priorColor = priorita === 'ALTA' ? '#dc2626' : priorita === 'MEDIA' ? '#f59e0b' : '#64748b';
  const priorBg = priorita === 'ALTA' ? '#fee2e2' : priorita === 'MEDIA' ? '#fef3c7' : '#f1f5f9';

  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 20,
      border: '1px solid #e2e8f0',
      marginBottom: 12,
      transition: `all 0.3s ${EASE}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 22, background: `${color}15`,
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 12
          }}>{icon}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {label}
              {priorita && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 8px',
                  borderRadius: 6, background: priorBg, color: priorColor,
                  textTransform: 'uppercase', letterSpacing: '0.04em'
                }}>{priorita}</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Spesa annua: <strong style={{ color: '#475569', fontVariantNumeric: 'tabular-nums' }}>€{Math.round(annuo).toLocaleString('it-IT')}</strong>
            </div>
          </div>
        </div>
      </div>

      {risparmio > 10 ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{
              fontSize: 12, fontWeight: 800, color,
              background: `${color}15`, padding: '5px 12px', borderRadius: 20
            }}>
              💡 Risparmio stimato €{Math.round(risparmio).toLocaleString('it-IT')}/anno
            </span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', borderRadius: 4, background: color, width: pct + '%', transition: 'width 0.8s ease-out' }} />
          </div>
          {link && (
            <a
              href={link}
              style={{
                display: 'block', textAlign: 'center',
                fontSize: 13, fontWeight: 800, color: '#fff',
                background: color, padding: '10px 20px', borderRadius: 10,
                textDecoration: 'none'
              }}
            >
              {linkText || 'Scopri di più →'}
            </a>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 8, fontSize: 12, color: '#059669', fontWeight: 600 }}>✓ Spesa già ottimizzata nella media</div>
      )}
    </div>
  );
}

// ============================================================================
// WIZARD PRINCIPALE
// ============================================================================

export function QuantoSpendo({ color = '#059669' }) {
  const [hasStarted, setHasStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [d, setD] = useState(STATE_INIZIALE);
  const [hasSavedData, setHasSavedData] = useState(false);

  // Carica da localStorage all'avvio
  useEffect(() => {
    try {
      const saved = window.localStorage?.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) {
          setD(parsed.data);
          setHasSavedData(true);
        }
      }
    } catch (e) { /* localStorage non disponibile */ }
  }, []);

  // Salva automaticamente quando l'utente è sui risultati
  useEffect(() => {
    if (hasStarted && step === STEPS.length - 1) {
      try {
        window.localStorage?.setItem(STORAGE_KEY, JSON.stringify({
          data: d,
          timestamp: Date.now()
        }));
      } catch (e) { /* ignore */ }
    }
  }, [d, step, hasStarted]);

  const isLast = step === STEPS.length - 1;

  // Calcoli
  const luceA = d.luce * 12;
  const gasA = d.gas * 12;
  const internetA = d.internet * 12;
  const rcA = d.haAuto ? d.rcAuto : 0;
  const carbA = d.haAuto ? d.carburanteMese * 12 : 0;
  const contoA = d.contoCosto;
  const polizzaA = d.haPolizza ? d.polizza * 12 : 0;
  const casaA = d.tipoCasa !== 'nessuno' ? d.rataCasa * 12 : 0;
  const uniA = d.haUni ? d.retta : 0;
  const totale = luceA + gasA + internetA + rcA + carbA + contoA + polizzaA + casaA + uniA;

  const risLuce = Math.max(0, luceA - 55 * 12);
  const risGas = d.riscaldamento ? Math.max(0, gasA - 65 * 12) : Math.max(0, gasA - 25 * 12);
  const risInternet = Math.max(0, internetA - 20 * 12);
  const risRc = d.haAuto ? Math.max(0, rcA - 290) : 0;
  const risCarb = d.haAuto ? Math.round(carbA * 0.10) : 0;
  const risConto = Math.max(0, contoA - 10);
  const risMutuo = d.tipoCasa === 'mutuo' && d.rataCasa > 500 ? Math.round(casaA * 0.08) : 0;
  const risPolizza = d.haPolizza && polizzaA > 540 ? Math.max(0, polizzaA - 480) : 0;
  const rispTotale = risLuce + risGas + risInternet + risRc + risCarb + risConto + risMutuo + risPolizza;

  // Cross-link URL params per precompilazione
  const linkMutuo = d.tipoCasa === 'mutuo'
    ? `/mutuo?rata=${d.rataCasa}&residuo=${Math.round(casaA * 8)}`
    : '/mutuo';

  // Categorie risultato (per ordinamento)
  const categorieRisultato = [
    { attivo: true, icon: '⚡', label: 'Energia Elettrica', annuo: luceA, risparmio: risLuce, color: '#f59e0b', link: '/luce-gas', linkText: 'Migliori offerte Luce →', ic: 'luce' },
    { attivo: true, icon: '🔥', label: 'Gas Naturale', annuo: gasA, risparmio: risGas, color: '#ef4444', link: '/luce-gas', linkText: 'Migliori offerte Gas →', ic: 'gas' },
    { attivo: true, icon: '📡', label: 'Internet', annuo: internetA, risparmio: risInternet, color: '#8b5cf6', link: '/internet', linkText: 'Confronta fibre →', ic: 'internet' },
    { attivo: d.haAuto, icon: '🚗', label: 'RC Auto', annuo: rcA, risparmio: risRc, color: '#ec4899', link: '/rc_auto', linkText: 'Calcola RC Auto →', ic: 'rc_auto' },
    { attivo: d.haAuto, icon: '⛽', label: 'Carburante', annuo: carbA, risparmio: risCarb, color: '#06b6d4', link: '/quanto-spendo', linkText: 'Ottimizza i consumi →', ic: 'carburante' },
    { attivo: true, icon: '💳', label: 'Conto Corrente', annuo: contoA, risparmio: risConto, color: '#10b981', link: '/conti-correnti', linkText: 'Conti a zero spese →', ic: 'conti' },
    { attivo: d.haPolizza, icon: '🏥', label: 'Polizza Sanitaria', annuo: polizzaA, risparmio: risPolizza, color: '#f97316', link: '/salute', linkText: 'Analisi polizza →', ic: 'salute' },
    { attivo: d.tipoCasa === 'mutuo' && risMutuo > 50, icon: '🏠', label: 'Mutuo (Surroga)', annuo: casaA, risparmio: risMutuo, color: '#3b82f6', link: linkMutuo, linkText: 'Simula surroga →', ic: 'mutuo' }
  ].filter(c => c.attivo);

  // Ordina per risparmio decrescente
  const categorieOrdinate = [...categorieRisultato].sort((a, b) => b.risparmio - a.risparmio);

  // Priorità dinamica
  categorieOrdinate.forEach(c => {
    if (c.risparmio >= 200) c.priorita = 'ALTA';
    else if (c.risparmio >= 80) c.priorita = 'MEDIA';
    else if (c.risparmio > 0) c.priorita = 'BASSA';
    else c.priorita = null;
  });

  // Top 3 categorie per piano 3 mesi
  const top3 = categorieOrdinate.filter(c => c.risparmio > 0).slice(0, 3);

  // Interessi precompilati per newsletter
  const interessiPreselezionati = top3.map(c => c.ic).filter(Boolean);

  const resetWizard = () => {
    try { window.localStorage?.removeItem(STORAGE_KEY); } catch (e) {}
    setD(STATE_INIZIALE);
    setHasSavedData(false);
    setHasStarted(false);
    setStep(0);
  };

  const waText = `🧮 La mia famiglia spende €${Math.round(totale).toLocaleString('it-IT')}/anno in spese fisse!\n💡 Potrei risparmiare fino a €${Math.round(rispTotale).toLocaleString('it-IT')}/anno.\n\nCalcola il tuo su 👉 https://soldibuoni.it/quanto-spendo`;
  const waUrl = 'https://wa.me/?text=' + encodeURIComponent(waText);

  // ==========================================================================
  // LANDING (prima dello step 0)
  // ==========================================================================
  if (!hasStarted) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        <div style={{
          background: '#fff', borderRadius: 24, padding: '40px 32px',
          border: '1px solid #e2e8f0', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.06)',
          textAlign: 'center', marginBottom: 20
        }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>💸</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 32, fontWeight: 900, color: '#0f172a',
            margin: '0 0 10px', letterSpacing: '-0.02em'
          }}>
            Quanto stai davvero spendendo?
          </h1>
          <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
            In 2 minuti scopri quanto la tua famiglia spende all'anno in <strong>spese fisse</strong> (bollette, auto, casa, servizi) e dove puoi risparmiare davvero. Nessun dato viene inviato: il calcolo avviene solo nel tuo browser.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>📊</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>Confronto con la media italiana</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>🎯</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>Piano d'azione in 3 mesi</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>🔗</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>Linkato agli altri strumenti</div>
            </div>
          </div>

          {hasSavedData && (
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 12, padding: '14px 16px', marginBottom: 20,
              textAlign: 'left'
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
                💾 Hai un'analisi salvata
              </div>
              <div style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 1.5 }}>
                Rilevati dati salvati nel tuo browser da una sessione precedente. Riprendi o ricomincia da zero.
              </div>
            </div>
          )}

          <button
            onClick={() => { setHasStarted(true); if (hasSavedData) setStep(STEPS.length - 1); }}
            style={{
              width: '100%', padding: '16px',
              background: color, color: '#fff',
              border: 'none', borderRadius: 14,
              fontSize: 16, fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 8px 20px -6px ${color}80`,
              fontFamily: 'inherit'
            }}
          >
            {hasSavedData ? 'Riprendi analisi salvata →' : 'Inizia l\'analisi →'}
          </button>

          {hasSavedData && (
            <button
              onClick={resetWizard}
              style={{
                marginTop: 10, background: 'transparent', border: 'none',
                color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                textDecoration: 'underline', fontFamily: 'inherit'
              }}
            >
              Ricomincia da zero
            </button>
          )}
        </div>

        <div style={{
          padding: '14px 18px', background: '#f8fafc',
          border: '1px solid #e2e8f0', borderRadius: 12,
          fontSize: 11, color: '#64748b', lineHeight: 1.6
        }}>
          🔒 <strong>Privacy:</strong> i tuoi dati restano solo sul tuo dispositivo (localStorage del browser). Non li inviamo a nessun server, non li associamo a te, non li condividiamo. Puoi cancellarli in qualsiasi momento con "Ricomincia da zero".
        </div>

      </div>
    );
  }

  // ==========================================================================
  // WIZARD ATTIVO
  // ==========================================================================
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      <style dangerouslySetInnerHTML={{__html:`
        .qs-box {
          background: #fff; border-radius: 20px; padding: 24px;
          border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          margin-bottom: 16px;
          animation: qsSlide 0.4s ${EASE} both;
        }
        @keyframes qsSlide {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}} />

      {/* HEADER PROGRESSO */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Step {step + 1} di {STEPS.length}
          </span>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{STEPS[step]}</span>
        </div>
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: color,
            width: `${((step + 1) / STEPS.length) * 100}%`,
            transition: 'width 0.5s ease-out'
          }} />
        </div>
      </div>

      {/* STEP 0 — Bollette */}
      {step === 0 && (
        <div>
          <Box title="⚡ Bolletta luce (media mensile)">
            <Sl label="Quanto paghi al mese?" value={d.luce} onChange={(v) => setD({ ...d, luce: v })} min={20} max={200} step={5} prefix="€" color="#f59e0b" benchmark={BENCHMARK.luce} />
          </Box>
          <Box title="🔥 Bolletta gas (media mensile)">
            <Sl label="Quanto paghi al mese?" value={d.gas} onChange={(v) => setD({ ...d, gas: v })} min={10} max={250} step={5} prefix="€" color="#ef4444" benchmark={BENCHMARK.gas} />
            <Tog label="Ho riscaldamento autonomo a gas" icon="🏠" checked={d.riscaldamento} onChange={(v) => setD({ ...d, riscaldamento: v })} color="#ef4444" />
          </Box>
          <Box title="📡 Internet casa (mensile)">
            <Sl label="Quanto paghi al mese?" value={d.internet} onChange={(v) => setD({ ...d, internet: v })} min={15} max={60} step={1} prefix="€" color="#8b5cf6" benchmark={BENCHMARK.internet} />
          </Box>
        </div>
      )}

      {/* STEP 1 — Auto & Servizi */}
      {step === 1 && (
        <div>
          <Box title="🚗 Auto & mobilità">
            <Tog label="Possiedo un'auto" icon="🚘" checked={d.haAuto} onChange={(v) => setD({ ...d, haAuto: v })} color="#ec4899" />
            {d.haAuto && (
              <div style={{ marginTop: 20 }}>
                <Sl label="RC Auto (premio annuale)" value={d.rcAuto} onChange={(v) => setD({ ...d, rcAuto: v })} min={150} max={900} step={10} prefix="€" color="#ec4899" benchmark={BENCHMARK.rcAuto} />
                <Sl label="Carburante al mese" value={d.carburanteMese} onChange={(v) => setD({ ...d, carburanteMese: v })} min={30} max={400} step={10} prefix="€" color="#06b6d4" benchmark={BENCHMARK.carburante} />
              </div>
            )}
          </Box>
          <Box title="💳 Conto corrente">
            <Sl label="Costo annuo (canone + carte + bolli)" value={d.contoCosto} onChange={(v) => setD({ ...d, contoCosto: v })} min={0} max={200} step={5} prefix="€" color="#10b981" benchmark={BENCHMARK.contoCosto} />
          </Box>
          <Box title="🏥 Polizza sanitaria">
            <Tog label="Ho una polizza sanitaria" icon="⚕️" checked={d.haPolizza} onChange={(v) => setD({ ...d, haPolizza: v })} color="#f97316" />
            {d.haPolizza && (
              <div style={{ marginTop: 20 }}>
                <Sl label="Quanto paghi al mese?" value={d.polizza} onChange={(v) => setD({ ...d, polizza: v })} min={15} max={150} step={5} prefix="€" color="#f97316" benchmark={BENCHMARK.polizza} />
              </div>
            )}
          </Box>
        </div>
      )}

      {/* STEP 2 — Casa & Famiglia */}
      {step === 2 && (
        <div>
          <Box title="🏠 Mutuo o affitto">
            <Pill
              options={[
                { id: 'nessuno', label: 'Nessuno' },
                { id: 'mutuo', label: 'Mutuo' },
                { id: 'affitto', label: 'Affitto' }
              ]}
              value={d.tipoCasa}
              onChange={(v) => setD({ ...d, tipoCasa: v })}
              color="#3b82f6"
            />
            {(d.tipoCasa === 'mutuo' || d.tipoCasa === 'affitto') && (
              <div style={{ marginTop: 20 }}>
                <Sl
                  label={d.tipoCasa === 'mutuo' ? 'Rata mutuo mensile' : 'Affitto mensile'}
                  value={d.rataCasa}
                  onChange={(v) => setD({ ...d, rataCasa: v })}
                  min={200} max={2500} step={50} prefix="€" color="#3b82f6"
                  benchmark={d.tipoCasa === 'mutuo' ? BENCHMARK.rataCasa : null}
                />
              </div>
            )}
          </Box>
          <Box title="🎓 Università">
            <Tog label="Ho figli all'università" icon="📚" checked={d.haUni} onChange={(v) => setD({ ...d, haUni: v })} color="#6366f1" />
            {d.haUni && (
              <div style={{ marginTop: 20 }}>
                <Sl label="Retta universitaria annuale" value={d.retta} onChange={(v) => setD({ ...d, retta: v })} min={500} max={15000} step={250} prefix="€" color="#6366f1" />
              </div>
            )}
          </Box>
        </div>
      )}

      {/* STEP 3 — Risultati */}
      {step === 3 && (
        <div>

          {/* HERO TOTALE */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            borderRadius: 24, padding: '36px 28px', color: '#fff',
            marginBottom: 24, position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              position: 'absolute', top: -50, right: -50,
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)'
            }} />

            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Spesa fissa annuale
            </div>
            <div style={{
              fontSize: 52, fontWeight: 900, marginBottom: 8,
              fontFamily: "'Playfair Display', serif",
              letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'
            }}>
              €{Math.round(totale).toLocaleString('it-IT')}
            </div>

            {rispTotale > 20 && (
              <div style={{
                marginTop: 20,
                background: 'rgba(16,185,129,0.15)',
                borderRadius: 14, padding: '18px 20px',
                border: '1px solid rgba(16,185,129,0.3)'
              }}>
                <div style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 700, marginBottom: 4 }}>
                  💡 Spreco recuperabile stimato
                </div>
                <div style={{
                  fontSize: 34, fontWeight: 900, color: '#34d399',
                  fontFamily: "'Playfair Display', serif",
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  −€{Math.round(rispTotale).toLocaleString('it-IT')}
                  <span style={{ fontSize: 15, fontWeight: 600 }}>/anno</span>
                </div>
              </div>
            )}
          </div>

          {/* CATEGORIE ORDINATE PER PRIORITÀ */}
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20, fontWeight: 800, color: '#0f172a',
            margin: '0 0 14px', letterSpacing: '-0.01em'
          }}>
            Le tue aree di risparmio (ordinate per impatto)
          </h3>

          {categorieOrdinate.map((c, i) => (
            <SavRow
              key={c.label + i}
              icon={c.icon}
              label={c.label}
              annuo={c.annuo}
              risparmio={c.risparmio}
              color={c.color}
              link={c.link}
              linkText={c.linkText}
              priorita={c.priorita}
            />
          ))}

          {/* PIANO D'AZIONE IN 3 MESI */}
          {top3.length > 0 && (
            <div style={{
              background: '#fff', borderRadius: 20, padding: 28,
              border: '1px solid #e2e8f0', marginTop: 24, marginBottom: 20,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20, fontWeight: 800, color: '#0f172a',
                margin: '0 0 6px', letterSpacing: '-0.01em'
              }}>
                🎯 Il tuo piano in 3 mesi
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
                Azioni concrete ordinate per impatto. Una cosa al mese, senza stress.
              </p>

              {top3.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, padding: '14px 0',
                  borderTop: i === 0 ? 'none' : '1px solid #f1f5f9'
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: c.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 14, flexShrink: 0
                  }}>
                    M{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>
                      Mese {i + 1}: {c.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                      Risparmio stimato <strong style={{ color: c.color }}>€{Math.round(c.risparmio).toLocaleString('it-IT')}/anno</strong>.{' '}
                      <a href={c.link} style={{ color: c.color, textDecoration: 'underline', fontWeight: 700 }}>
                        Vai al tool →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA NEWSLETTER CON INTERESSI PRECOMPILATI */}
          {interessiPreselezionati.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #fff 60%)',
              borderRadius: 20, padding: 24,
              border: '1px solid #bfdbfe', marginBottom: 20,
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', gap: 16, flexWrap: 'wrap'
            }}>
              <div style={{ flex: '1 1 260px' }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  📬 Ricevi alert mensili sulle tue 3 aree di spreco
                </h4>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Report Risparmio Mensile con prezzi aggiornati, migliori offerte e alert sulle categorie che ti interessano.
                </p>
              </div>
              <a
                href={`/report-risparmio?interessi=${interessiPreselezionati.join(',')}`}
                style={{
                  padding: '12px 20px', borderRadius: 12,
                  background: '#3b82f6', color: '#fff',
                  fontSize: 13, fontWeight: 800,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  boxShadow: '0 6px 16px -4px #3b82f680'
                }}
              >
                Iscriviti gratis →
              </a>
            </div>
          )}

          {/* SHARE WHATSAPP */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: 24,
            border: '1px solid #e2e8f0', marginBottom: 20,
            textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              Condividi il risultato
            </h4>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
              Sfida amici e parenti: chi spende meno?
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', padding: '12px 24px',
                background: '#25d366', color: '#fff',
                borderRadius: 12, fontSize: 14, fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              Invia su WhatsApp 💬
            </a>
          </div>

          {/* DISCLAIMER */}
          <div style={{
            padding: '16px 20px', background: '#f8fafc',
            border: '1px solid #e2e8f0', borderRadius: 12,
            fontSize: 11, color: '#64748b', lineHeight: 1.6, marginBottom: 20
          }}>
            <strong style={{ color: '#0f172a', fontSize: 12 }}>ⓘ Nota metodologica</strong>
            <p style={{ margin: '6px 0 0' }}>
              I benchmark sono medie indicative da fonti pubbliche (ARERA, ACI, ABI, ANIA) aggiornate 2025-2026, possono variare significativamente per zona, dimensione nucleo, consumo effettivo. I risparmi stimati rappresentano il potenziale ottenibile cambiando fornitore/offerta in condizioni tipiche, non garanzie: ogni offerta va verificata con preventivo personale. Lo strumento è educativo e non sostituisce analisi finanziaria personalizzata. I dati sono conservati solo sul tuo dispositivo (localStorage), non vengono inviati a server.
            </p>
          </div>
        </div>
      )}

      {/* NAVIGAZIONE */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        {step > 0 && !isLast && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              background: '#fff', color: '#64748b',
              padding: '14px 20px', borderRadius: 14,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              border: '1px solid #e2e8f0', fontFamily: 'inherit'
            }}
          >
            ← Indietro
          </button>
        )}
        {!isLast && (
          <button
            onClick={() => setStep(step + 1)}
            style={{
              flex: 1, background: color, color: '#fff',
              padding: '14px 24px', borderRadius: 14,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              border: 'none', boxShadow: `0 8px 20px -6px ${color}80`,
              fontFamily: 'inherit'
            }}
          >
            {step === STEPS.length - 2 ? 'Calcola il risparmio ⚡' : 'Continua →'}
          </button>
        )}
        {isLast && (
          <button
            onClick={resetWizard}
            style={{
              flex: 1, background: '#fff', color: '#64748b',
              padding: '14px 24px', borderRadius: 14,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              border: '1px solid #e2e8f0', fontFamily: 'inherit'
            }}
          >
            ↺ Ricalcola da zero
          </button>
        )}
      </div>

    </div>
  );
}