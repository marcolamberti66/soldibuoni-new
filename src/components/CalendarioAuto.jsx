import React, { useState, useMemo } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const SCADENZE_DEF = [
  { key: 'bollo',          icon: '💳', label: 'Bollo Auto',         hint: 'Scadenza annuale legata al mese di immatricolazione' },
  { key: 'revisione',      icon: '🔍', label: 'Revisione',          hint: 'Ogni 2 anni (la prima dopo 4 anni)' },
  { key: 'tagliando',      icon: '🔧', label: 'Tagliando',          hint: 'Ogni 15.000-30.000 km o 1-2 anni' },
  { key: 'gommeInvernali', icon: '🛞', label: 'Gomme invernali',    hint: 'Obbligo dal 15 novembre al 15 aprile' },
  { key: 'gommeEstive',    icon: '☀️', label: 'Gomme estive',        hint: 'Rimontaggio dal 15 aprile' },
];

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(iso) {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

export function CalendarioAuto({ color = '#F97316' }) {
  const [scadenze, setScadenze] = useState({
    bollo: '',
    revisione: '',
    tagliando: '',
    gommeInvernali: '',
    gommeEstive: '',
  });
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [targa, setTarga] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const scadenzeAttive = useMemo(() => {
    return SCADENZE_DEF
      .map(s => ({ ...s, date: scadenze[s.key] }))
      .filter(s => s.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [scadenze]);

  const numScadenze = scadenzeAttive.length;
  const canProceed = numScadenze > 0;

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nome || nome.trim().length < 2) {
      setError('Inserisci un nome valido');
      return;
    }
    if (!validateEmail(email)) {
      setError('Inserisci un indirizzo email valido');
      return;
    }

    const today = todayISO();
    const scadenzePayload = {};
    for (const s of SCADENZE_DEF) {
      if (scadenze[s.key] && scadenze[s.key] >= today) {
        scadenzePayload[s.key] = scadenze[s.key];
      }
    }

    if (Object.keys(scadenzePayload).length === 0) {
      setError('Aggiungi almeno una scadenza futura');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/brevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'car_reminder',
          email: email.trim().toLowerCase(),
          nome: nome.trim(),
          targa: targa.trim().toUpperCase() || undefined,
          scadenze: scadenzePayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l\'attivazione');
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Errore di connessione. Riprova tra qualche secondo.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setScadenze({ bollo: '', revisione: '', tagliando: '', gommeInvernali: '', gommeEstive: '' });
    setNome(''); setEmail(''); setTarga('');
    setShowForm(false);
    setSuccess(false);
    setError('');
  };

  // ═══════════ SUCCESS STATE ═══════════
  if (success) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderLeft: `5px solid ${color}`,
          borderRadius: 20,
          padding: '32px 28px',
          textAlign: 'center',
          animation: `fadeInUp 0.5s ${EASE}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>
            Promemoria attivati!
          </h2>
          <p style={{ fontSize: 15, color: '#475569', marginBottom: 24, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 24px' }}>
            Ti abbiamo inviato un'email di conferma a <strong style={{ color: '#0f172a' }}>{email}</strong>.<br />
            Riceverai un promemoria automatico <strong>7 giorni prima</strong> di ogni scadenza.
          </p>

          <div style={{ background: '#f8fafc', borderRadius: 14, padding: 20, textAlign: 'left', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
              Riepilogo scadenze {targa && `— ${targa.toUpperCase()}`}
            </div>
            {scadenzeAttive.map(s => (
              <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#334155' }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span> {s.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{formatDate(s.date)}</span>
              </div>
            ))}
          </div>

          <button
            onClick={reset}
            style={{
              background: color, color: '#fff', border: 'none',
              padding: '12px 24px', borderRadius: 12, fontSize: 14,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              transition: `all 0.2s ${EASE}`
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.92)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            Aggiungi un'altra auto →
          </button>
        </div>
      </div>
    );
  }

  // ═══════════ MAIN UI ═══════════
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* INTRO CARD */}
      <div style={{
        background: `linear-gradient(135deg, ${color}0f, ${color}04)`,
        border: `1px solid ${color}33`,
        borderRadius: 20,
        padding: '22px 26px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 32 }}>📬</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Come funziona
          </div>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
            Inserisci le date delle scadenze che vuoi monitorare, poi attiva i promemoria email. Ti avvertiamo <strong>7 giorni prima</strong> di ogni scadenza con i consigli per gestirla.
          </div>
        </div>
      </div>

      {/* STEP 1 — SCADENZE */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            <span style={{ color: color, marginRight: 6 }}>1.</span> Le tue scadenze
          </h2>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {numScadenze > 0 ? `${numScadenze} scadenz${numScadenze === 1 ? 'a' : 'e'} attiv${numScadenze === 1 ? 'a' : 'e'}` : 'Almeno una richiesta'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {SCADENZE_DEF.map(s => {
            const value = scadenze[s.key];
            const gg = daysUntil(value);
            const isSet = !!value;

            return (
              <label
                key={s.key}
                style={{
                  display: 'block',
                  background: isSet ? `${color}08` : '#f8fafc',
                  border: `1px solid ${isSet ? color + '40' : '#e2e8f0'}`,
                  borderRadius: 14,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: `all 0.2s ${EASE}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10, lineHeight: 1.4 }}>{s.hint}</div>
                <input
                  type="date"
                  min={todayISO()}
                  value={value}
                  onChange={(e) => setScadenze({ ...scadenze, [s.key]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: 13,
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    color: '#0f172a',
                    background: '#fff',
                    outline: 'none',
                    colorScheme: 'light',
                  }}
                />
                {isSet && gg !== null && (
                  <div style={{ fontSize: 11, marginTop: 6, color: gg < 0 ? '#dc2626' : gg <= 7 ? '#ea580c' : '#64748b', fontWeight: 600 }}>
                    {gg < 0 ? `⚠️ Scaduta da ${Math.abs(gg)} giorni` : gg === 0 ? '⚠️ Scade oggi' : `Tra ${gg} giorn${gg === 1 ? 'o' : 'i'}`}
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* STEP 2 — TOGGLE / EMAIL FORM */}
      {!showForm ? (
        <button
          disabled={!canProceed}
          onClick={() => setShowForm(true)}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: canProceed ? color : '#cbd5e1',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            fontSize: 15,
            fontWeight: 800,
            cursor: canProceed ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            transition: `all 0.25s ${EASE}`,
            boxShadow: canProceed ? `0 8px 20px -6px ${color}60` : 'none',
          }}
          onMouseEnter={e => { if (canProceed) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { if (canProceed) e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {canProceed ? 'Attiva i promemoria →' : 'Aggiungi almeno una scadenza'}
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              <span style={{ color: color, marginRight: 6 }}>2.</span> Dove ti mandiamo i promemoria
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
            >
              ← Modifica scadenze
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuo.indirizzo@email.it"
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 14,
                  border: '1px solid #cbd5e1', borderRadius: 10,
                  fontFamily: 'inherit', color: '#0f172a', outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                Nome *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Mario"
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 14,
                  border: '1px solid #cbd5e1', borderRadius: 10,
                  fontFamily: 'inherit', color: '#0f172a', outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                Targa <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opzionale)</span>
              </label>
              <input
                type="text"
                value={targa}
                onChange={(e) => setTarga(e.target.value.toUpperCase())}
                placeholder="AB123CD"
                maxLength={10}
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 14,
                  border: '1px solid #cbd5e1', borderRadius: 10,
                  fontFamily: 'inherit', color: '#0f172a', outline: 'none',
                  textTransform: 'uppercase',
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginBottom: 14 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: submitting ? '#94a3b8' : color,
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 800,
              cursor: submitting ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              transition: `all 0.2s ${EASE}`,
              boxShadow: `0 8px 20px -6px ${color}60`,
            }}
          >
            {submitting ? 'Attivazione in corso...' : `✓ Attiva promemoria per ${numScadenze} scadenz${numScadenze === 1 ? 'a' : 'e'}`}
          </button>

          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
            🔒 I tuoi dati vengono usati solo per inviarti i promemoria. Niente spam, niente pubblicità.<br />
            Puoi disiscriverti in qualsiasi momento dal link in fondo a ogni email.
          </p>
        </form>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
        }
      `}} />
    </div>
  );
}