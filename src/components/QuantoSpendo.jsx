import React, { useState } from 'react';

const STEPS = ['Bollette', 'Auto & Servizi', 'Casa & Famiglia', 'Risultati'];

function Bar({ current, total }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Step {current + 1} di {total}</span>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{STEPS[current]}</span>
      </div>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
        <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#059669,#10b981)', width: ((current + 1) / total * 100) + '%', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function Sl({ label, value, onChange, min, max, step, prefix, suffix, color }) {
  var display = (prefix || '') + value.toLocaleString() + (suffix || '');
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{label}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: color || '#059669' }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={function(e) { onChange(+e.target.value); }}
        style={{ width: '100%', accentColor: color || '#059669' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
        <span>{(prefix || '') + min}</span><span>{(prefix || '') + max + (suffix || '')}</span>
      </div>
    </div>
  );
}

function Pill({ options, value, onChange, color }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      {options.map(function(o) {
        return (
          <button key={o.id} onClick={function() { onChange(o.id); }} style={{
            padding: '9px 16px', borderRadius: 10, border: 'none',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            background: value === o.id ? (color || '#0f172a') : '#f1f5f9',
            color: value === o.id ? '#fff' : '#64748b', transition: 'all 0.2s',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function Tog({ label, icon, checked, onChange }) {
  return (
    <button onClick={function() { onChange(!checked); }} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '12px 16px', borderRadius: 10, border: 'none',
      background: checked ? '#f0fdf4' : '#f8fafc', cursor: 'pointer',
      fontFamily: 'inherit', marginBottom: 8, transition: 'all 0.2s',
      outline: checked ? '2px solid #059669' : '1px solid #e2e8f0',
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: checked ? '#059669' : '#64748b', flex: 1, textAlign: 'left' }}>{label}</span>
      <div style={{ width: 20, height: 20, borderRadius: 6, background: checked ? '#059669' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{checked ? '✓' : ''}</div>
    </button>
  );
}

function Box({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {title && <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{title}</h3>}
      {children}
    </div>
  );
}

function SavRow({ icon, label, annuo, risparmio, color, link, linkText }) {
  var pct = risparmio > 0 ? Math.min(100, (risparmio / annuo) * 100) : 0;
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #e2e8f0', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: risparmio > 10 ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{label}</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{'€' + Math.round(annuo).toLocaleString() + '/anno'}</span>
      </div>
      {risparmio > 10 ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#f0fdf4', padding: '2px 10px', borderRadius: 8 }}>
              {'💰 Puoi risparmiare circa €' + Math.round(risparmio) + '/anno'}
            </span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', borderRadius: 4, background: color, width: pct + '%', transition: 'width 0.6s' }} />
          </div>
          {link && (
            <a href={link} style={{
              display: 'block', textAlign: 'center', fontSize: 13, fontWeight: 700,
              color: '#fff', background: color, padding: '10px 16px', borderRadius: 10,
            }}>{linkText || 'Confronta offerte →'}</a>
          )}
        </div>
      ) : (
        <span style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginTop: 4 }}>✓ Nella media — nessun intervento urgente</span>
      )}
    </div>
  );
}

// ═══ STEP 1: BOLLETTE ═══
function S1({ d, set }) {
  return (
    <div>
      <Box title="⚡ Bolletta Luce (media mensile)">
        <Sl label="Quanto paghi al mese?" value={d.luce} onChange={function(v) { set(function(p) { return Object.assign({}, p, { luce: v }); }); }}
          min={20} max={200} step={5} prefix="€" color="#F59E0B" />
      </Box>
      <Box title="🔥 Bolletta Gas (media mensile)">
        <Sl label="Quanto paghi al mese?" value={d.gas} onChange={function(v) { set(function(p) { return Object.assign({}, p, { gas: v }); }); }}
          min={10} max={250} step={5} prefix="€" color="#EF4444" />
        <Tog label="Ho riscaldamento autonomo a gas" icon="🏠" checked={d.riscaldamento}
          onChange={function(v) { set(function(p) { return Object.assign({}, p, { riscaldamento: v }); }); }} />
      </Box>
      <Box title="📡 Internet (abbonamento mensile)">
        <Sl label="Quanto paghi al mese?" value={d.internet} onChange={function(v) { set(function(p) { return Object.assign({}, p, { internet: v }); }); }}
          min={15} max={50} step={1} prefix="€" color="#8B5CF6" />
      </Box>
    </div>
  );
}

// ═══ STEP 2: AUTO & SERVIZI ═══
function S2({ d, set }) {
  return (
    <div>
      <Box title="🚗 Auto">
        <Tog label="Ho un'auto" icon="🚗" checked={d.haAuto}
          onChange={function(v) { set(function(p) { return Object.assign({}, p, { haAuto: v }); }); }} />
        {d.haAuto && (
          <div style={{ marginTop: 14 }}>
            <Sl label="RC Auto (premio annuale)" value={d.rcAuto}
              onChange={function(v) { set(function(p) { return Object.assign({}, p, { rcAuto: v }); }); }}
              min={150} max={800} step={10} prefix="€" color="#EC4899" />
            <Sl label="Carburante al mese" value={d.carburanteMese}
              onChange={function(v) { set(function(p) { return Object.assign({}, p, { carburanteMese: v }); }); }}
              min={30} max={400} step={10} prefix="€" color="#84CC16" />
          </div>
        )}
      </Box>
      <Box title="💳 Conto Corrente">
        <Sl label="Costo annuo del conto (canone + carte + bolli)" value={d.contoCosto}
          onChange={function(v) { set(function(p) { return Object.assign({}, p, { contoCosto: v }); }); }}
          min={0} max={200} step={5} prefix="€" color="#10B981" />
      </Box>
      <Box title="🏥 Polizza Sanitaria">
        <Tog label="Ho una polizza sanitaria integrativa" icon="🏥" checked={d.haPolizza}
          onChange={function(v) { set(function(p) { return Object.assign({}, p, { haPolizza: v }); }); }} />
        {d.haPolizza && (
          <Sl label="Quanto paghi al mese?" value={d.polizza}
            onChange={function(v) { set(function(p) { return Object.assign({}, p, { polizza: v }); }); }}
            min={15} max={150} step={5} prefix="€" color="#14B8A6" />
        )}
      </Box>
    </div>
  );
}

// ═══ STEP 3: CASA & FAMIGLIA ═══
function S3({ d, set }) {
  return (
    <div>
      <Box title="🏠 Mutuo o Affitto">
        <Pill options={[
          { id: 'nessuno', label: 'Nessuno' },
          { id: 'mutuo', label: 'Mutuo' },
          { id: 'affitto', label: 'Affitto' },
        ]} value={d.tipoCasa} onChange={function(v) { set(function(p) { return Object.assign({}, p, { tipoCasa: v }); }); }} color="#10B981" />
        {(d.tipoCasa === 'mutuo' || d.tipoCasa === 'affitto') && (
          <Sl label={d.tipoCasa === 'mutuo' ? 'Rata mutuo mensile' : 'Affitto mensile'} value={d.rataCasa}
            onChange={function(v) { set(function(p) { return Object.assign({}, p, { rataCasa: v }); }); }}
            min={200} max={2000} step={50} prefix="€" color="#10B981" />
        )}
      </Box>
      <Box title="🎓 Università">
        <Tog label="Ho figli all'università" icon="🎓" checked={d.haUni}
          onChange={function(v) { set(function(p) { return Object.assign({}, p, { haUni: v }); }); }} />
        {d.haUni && (
          <Sl label="Retta universitaria annuale" value={d.retta}
            onChange={function(v) { set(function(p) { return Object.assign({}, p, { retta: v }); }); }}
            min={500} max={15000} step={250} prefix="€" color="#6366F1" />
        )}
      </Box>
    </div>
  );
}

// ═══ STEP 4: RISULTATI ═══
function S4({ d }) {
  var luceA = d.luce * 12;
  var gasA = d.gas * 12;
  var internetA = d.internet * 12;
  var rcA = d.haAuto ? d.rcAuto : 0;
  var carbA = d.haAuto ? d.carburanteMese * 12 : 0;
  var contoA = d.contoCosto;
  var polizzaA = d.haPolizza ? d.polizza * 12 : 0;
  var casaA = d.tipoCasa !== 'nessuno' ? d.rataCasa * 12 : 0;
  var uniA = d.haUni ? d.retta : 0;
  var totale = luceA + gasA + internetA + rcA + carbA + contoA + polizzaA + casaA + uniA;

  // Stime risparmio realistiche basate sulle migliori offerte
  var risLuce = Math.max(0, luceA - 50 * 12);
  var risGas = d.riscaldamento ? Math.max(0, gasA - 60 * 12) : Math.max(0, gasA - 20 * 12);
  var risInternet = Math.max(0, internetA - 18 * 12);
  var risRc = d.haAuto ? Math.max(0, rcA - 280) : 0;
  var risCarb = d.haAuto ? Math.round(carbA * 0.12) : 0;
  var risConto = Math.max(0, contoA);
  var risMutuo = d.tipoCasa === 'mutuo' && d.rataCasa > 500 ? Math.round(casaA * 0.08) : 0;
  var risPolizza = d.haPolizza ? Math.max(0, polizzaA - 300) : 0;

  var rispTotale = risLuce + risGas + risInternet + risRc + risCarb + risConto + risMutuo + risPolizza;

  var waText = '\uD83E\uDDEE La mia famiglia spende \u20AC' + Math.round(totale).toLocaleString() + '/anno!\n\uD83D\uDCB0 Potrei risparmiare \u20AC' + Math.round(rispTotale).toLocaleString() + '/anno.\n\nScopri quanto spendi tu \uD83D\uDC49 https://soldibuoni.it/quanto-spendo';
  var waUrl = 'https://wa.me/?text=' + encodeURIComponent(waText);

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 20,
        padding: '32px 24px', color: '#fff', marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>La tua famiglia spende</p>
        <div style={{ fontSize: 44, fontWeight: 800, marginBottom: 4, fontFamily: "'Playfair Display',serif" }}>
          {'\u20AC' + Math.round(totale).toLocaleString()}
          <span style={{ fontSize: 18, fontWeight: 400, color: '#94a3b8' }}>/anno</span>
        </div>
        {rispTotale > 20 && (
          <div style={{ marginTop: 16, background: 'rgba(5,150,105,0.15)', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(5,150,105,0.25)' }}>
            <p style={{ fontSize: 13, color: '#6ee7b7', marginBottom: 2 }}>Risparmio potenziale stimato</p>
            <p style={{ fontSize: 30, fontWeight: 800, color: '#34d399', fontFamily: "'Playfair Display',serif" }}>
              {'\u2212\u20AC' + Math.round(rispTotale).toLocaleString()}
              <span style={{ fontSize: 14, fontWeight: 400, color: '#6ee7b7' }}>/anno</span>
            </p>
            <p style={{ fontSize: 12, color: '#6ee7b7', marginTop: 4 }}>
              {'\u20AC' + Math.round(rispTotale / 12) + '/mese in pi\u00F9 nel tuo portafoglio'}
            </p>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 14, fontFamily: "'Playfair Display',serif" }}>Dove puoi risparmiare</h3>

      <SavRow icon="\u26A1" label="Energia Elettrica" annuo={luceA} risparmio={risLuce} color="#F59E0B" link="/luce-gas" linkText="Scopri le offerte Luce \u2192" />
      <SavRow icon="\uD83D\uDD25" label="Gas Naturale" annuo={gasA} risparmio={risGas} color="#EF4444" link="/luce-gas" linkText="Scopri le offerte Gas \u2192" />
      <SavRow icon="\uD83D\uDCE1" label="Internet" annuo={internetA} risparmio={risInternet} color="#8B5CF6" link="/internet" linkText="Trova la fibra migliore \u2192" />
      {d.haAuto && <SavRow icon="\uD83D\uDE97" label="RC Auto" annuo={rcA} risparmio={risRc} color="#EC4899" link="/rc_auto" linkText="Calcola preventivo \u2192" />}
      {d.haAuto && <SavRow icon="\u26FD" label="Carburante" annuo={carbA} risparmio={risCarb} color="#84CC16" link="/carburante" linkText="Calcola costo/km \u2192" />}
      <SavRow icon="\uD83D\uDCB3" label="Conto Corrente" annuo={contoA} risparmio={risConto} color="#10B981" link="/conti-correnti" linkText="Trova un conto a zero spese \u2192" />
      {d.haPolizza && <SavRow icon="\uD83C\uDFE5" label="Polizza Sanitaria" annuo={polizzaA} risparmio={risPolizza} color="#14B8A6" link="/salute" linkText="Confronta polizze \u2192" />}
      {d.tipoCasa === 'mutuo' && risMutuo > 50 && <SavRow icon="\uD83C\uDFE0" label="Mutuo (surroga)" annuo={casaA} risparmio={risMutuo} color="#0EA5E9" link="/mutuo" linkText="Simula la surroga \u2192" />}
      {d.tipoCasa === 'affitto' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #e2e8f0', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{'\uD83C\uDFE0'}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Affitto</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginLeft: 'auto' }}>{'\u20AC' + Math.round(casaA).toLocaleString() + '/anno'}</span>
          </div>
        </div>
      )}
      {d.haUni && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #e2e8f0', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{'\uD83C\uDF93'}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Universit\u00E0</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{'\u20AC' + Math.round(uniA).toLocaleString() + '/anno'}</span>
          </div>
          <a href="/istruzione" style={{ display: 'block', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#6366F1', marginTop: 10 }}>Confronta le rette \u2192</a>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: '1px solid #e2e8f0', marginTop: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Sfida amici e parenti</p>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Chi spende di meno?</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#25D366', color: '#fff', padding: '11px 22px',
            borderRadius: 10, fontSize: 14, fontWeight: 700,
          }}>{'\uD83D\uDCF1'} WhatsApp</a>
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 16, fontStyle: 'italic', textAlign: 'center' }}>
        * Stime indicative basate sulle medie di mercato e sulle migliori offerte disponibili.
      </p>
    </div>
  );
}

export default function QuantoSpendo() {
  var s = useState(0);
  var step = s[0];
  var setStep = s[1];

  var ds = useState({
    luce: 70, gas: 80, riscaldamento: true, internet: 28,
    haAuto: true, rcAuto: 380, carburanteMese: 150,
    contoCosto: 60, haPolizza: false, polizza: 40,
    tipoCasa: 'mutuo', rataCasa: 650,
    haUni: false, retta: 2500,
  });
  var d = ds[0];
  var set = ds[1];

  var isLast = step === STEPS.length - 1;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Bar current={step} total={STEPS.length} />

      {step === 0 && <S1 d={d} set={set} />}
      {step === 1 && <S2 d={d} set={set} />}
      {step === 2 && <S3 d={d} set={set} />}
      {step === 3 && <S4 d={d} />}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        {step > 0 && (
          <button onClick={function() { setStep(function(s) { return s - 1; }); }} style={{
            padding: '14px 24px', borderRadius: 10, border: '1px solid #e2e8f0',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            background: '#fff', color: '#64748b', flex: 1,
          }}>{'\u2190'} Indietro</button>
        )}
        {!isLast && (
          <button onClick={function() { setStep(function(s) { return s + 1; }); }} style={{
            padding: '14px 24px', borderRadius: 10, border: 'none',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            background: 'linear-gradient(135deg,#0f172a,#334155)', color: '#fff', flex: 2,
            transition: 'transform 0.2s',
          }}>{step === STEPS.length - 2 ? 'Calcola il mio risparmio \u2192' : 'Avanti \u2192'}</button>
        )}
        {isLast && (
          <button onClick={function() { setStep(0); }} style={{
            padding: '14px 24px', borderRadius: 10, border: '1px solid #e2e8f0',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            background: '#fff', color: '#64748b', flex: 1,
          }}>{'\u2190'} Ricalcola</button>
        )}
      </div>
    </div>
  );
}
