import React, { useState, useEffect } from 'react';

export default function NewsletterSignup({ variant, prefilledInterests }) {
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [interessi, setInteressi] = useState(['energia', 'gas']);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [showPrefs, setShowPrefs] = useState(variant === 'landing');

  // Supporta interessi pre-selezionati via prop (es. da URL params /quanto-spendo)
  useEffect(() => {
    if (prefilledInterests && Array.isArray(prefilledInterests) && prefilledInterests.length > 0) {
      setInteressi(prefilledInterests);
      setShowPrefs(true);
    }
  }, [prefilledInterests]);

  const toggleInteresse = (id) => {
    setInteressi(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const categorie = [
    { id: 'energia', label: 'Luce', icon: '⚡' },
    { id: 'gas', label: 'Gas', icon: '🔥' },
    { id: 'internet', label: 'Internet', icon: '📡' },
    { id: 'rc_auto', label: 'RC Auto', icon: '🚗' },
    { id: 'mutuo', label: 'Mutuo', icon: '🏠' },
    { id: 'universita', label: 'Università', icon: '🎓' },
  ];

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return;
    setStatus('loading');

    try {
      const res = await fetch('https://soldibuoni.it/.netlify/functions/subscribe-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome, interessi }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{
        background: '#f0fdf4', borderRadius: 16, padding: '32px 24px',
        border: '1px solid #bbf7d0', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
        <p style={{
          fontSize: 20, fontWeight: 800, color: '#166534', marginBottom: 8,
          fontFamily: "'Playfair Display', serif"
        }}>
          Iscrizione confermata!
        </p>
        <p style={{ fontSize: 14, color: '#166534', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
          Grazie per esserti iscritto. Riceverai il primo Report Risparmio Mensile entro le prossime 4 settimane,
          con contenuti calibrati sui tuoi interessi selezionati. Controlla lo spam se non arriva.
        </p>
      </div>
    );
  }

  // ==========================================================================
  // VARIANT: COMPACT (homepage/footer)
  // ==========================================================================
  if (variant === 'compact') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        borderRadius: 16, padding: '28px 24px', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              📬 Report Risparmio Mensile
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              Ogni mese nella tua inbox: come sono cambiati i prezzi,
              le migliori offerte del momento, e consigli personalizzati.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
            <input
              type="email"
              placeholder="La tua email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 10,
                border: '1px solid #334155', background: '#1e293b',
                color: '#fff', fontSize: 14, fontFamily: 'inherit',
                outline: 'none', minWidth: 180,
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              style={{
                padding: '12px 24px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: status === 'loading' ? 'wait' : 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              {status === 'loading' ? 'Invio...' : 'Iscriviti gratis'}
            </button>
          </div>
        </div>
        {status === 'error' && (
          <p style={{ fontSize: 12, color: '#f87171', marginTop: 10 }}>
            Errore nell'iscrizione. Riprova tra qualche secondo.
          </p>
        )}
        <p style={{ fontSize: 11, color: '#475569', marginTop: 10 }}>
          Zero spam. Cancellati in un click. Massimo 1 email al mese.
        </p>
      </div>
    );
  }

  // ==========================================================================
  // VARIANT: LANDING (pagina dedicata /report-risparmio)
  // Preferenze sempre visibili, accetta prefilledInterests
  // ==========================================================================
  if (variant === 'landing') {
    return (
      <div style={{
        background: '#fff', borderRadius: 24, padding: '36px 32px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)',
      }}>

        {prefilledInterests && prefilledInterests.length > 0 && (
          <div style={{
            background: '#dbeafe', border: '1px solid #93c5fd',
            borderRadius: 12, padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: '#1e40af'
          }}>
            ✨ <strong>Abbiamo pre-selezionato i temi</strong> in base alle tue aree di risparmio principali. Puoi modificarli qui sotto.
          </div>
        )}

        <h2 style={{
          fontSize: 24, fontWeight: 800, color: '#0f172a',
          margin: '0 0 8px',
          fontFamily: "'Playfair Display', serif",
          letterSpacing: '-0.01em'
        }}>
          Iscriviti al Report Risparmio
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
          Una sola email al mese con le analisi che servono davvero. Gratuito, senza spam, cancellabile in un click.
        </p>

        {/* Email + nome */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            La tua email *
          </label>
          <input
            type="email"
            placeholder="tuonome@esempio.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              border: '1px solid #cbd5e1', fontSize: 15, fontFamily: 'inherit',
              outline: 'none', background: '#fff', boxSizing: 'border-box',
              fontWeight: 500
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nome (facoltativo)
          </label>
          <input
            type="text"
            placeholder="Come vuoi essere chiamato"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              border: '1px solid #cbd5e1', fontSize: 15, fontFamily: 'inherit',
              outline: 'none', background: '#fff', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Preferenze sempre visibili in landing */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            I temi che ti interessano di più
          </label>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8,
          }}>
            {categorie.map(c => {
              const active = interessi.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleInteresse(c.id)}
                  style={{
                    padding: '12px 10px', borderRadius: 12,
                    border: active ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    background: active ? '#dbeafe' : '#fff',
                    color: active ? '#1e40af' : '#64748b',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    lineHeight: 1.3
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{c.icon}</div>
                  <div>{c.label}</div>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
            Selezionane quanti vuoi. Il report conterrà sezioni dedicate agli argomenti che hai scelto.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={status === 'loading' || !email}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            fontSize: 16, fontWeight: 800,
            cursor: (status === 'loading' || !email) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            background: (status === 'loading' || !email)
              ? '#94a3b8'
              : '#3b82f6',
            color: '#fff',
            boxShadow: status === 'loading' ? 'none' : '0 10px 24px -6px rgba(59,130,246,0.5)',
          }}
        >
          {status === 'loading' ? '⏳ Iscrizione in corso...' : '📬 Iscriviti gratis al Report Mensile'}
        </button>

        {status === 'error' && (
          <p style={{ fontSize: 13, color: '#dc2626', marginTop: 12, textAlign: 'center' }}>
            ⚠️ Errore nell'iscrizione. Controlla l'email e riprova tra qualche secondo.
          </p>
        )}

        <div style={{
          marginTop: 16, padding: '12px 16px', background: '#f8fafc',
          borderRadius: 10, fontSize: 11, color: '#64748b', lineHeight: 1.5
        }}>
          🔒 Iscrivendoti accetti l'invio di 1 email al mese. Non condividiamo la tua email con terzi. Puoi cancellarti in qualsiasi momento con un click (link in ogni email).
        </div>

      </div>
    );
  }

  // ==========================================================================
  // VARIANT: DEFAULT (versione completa con preferenze nascoste)
  // ==========================================================================
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '28px 24px',
      border: '1px solid #e2e8f0',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📬</span>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>
          Report Risparmio Mensile
        </h3>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          Ricevi ogni mese un'analisi personalizzata: come sono cambiati i prezzi,
          dove puoi risparmiare, e le migliori offerte del momento.
        </p>
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          type="text"
          placeholder="Il tuo nome (facoltativo)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10,
            border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit',
            outline: 'none', background: '#f8fafc', marginBottom: 10,
          }}
        />
        <input
          type="email"
          placeholder="La tua email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10,
            border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit',
            outline: 'none', background: '#f8fafc',
          }}
        />
      </div>

      <button
        onClick={() => setShowPrefs(!showPrefs)}
        style={{
          background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
          color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
          marginBottom: 10, display: 'block',
        }}
      >
        {showPrefs ? '▾ Nascondi preferenze' : '▸ Personalizza gli argomenti'}
      </button>

      {showPrefs && (
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16,
          padding: '14px', background: '#f8fafc', borderRadius: 10,
        }}>
          {categorie.map(c => (
            <button
              key={c.id}
              onClick={() => toggleInteresse(c.id)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                background: interessi.includes(c.id) ? '#0f172a' : '#e2e8f0',
                color: interessi.includes(c.id) ? '#fff' : '#64748b',
                transition: 'all 0.2s',
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={status === 'loading' || !email}
        style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          fontSize: 15, fontWeight: 700,
          cursor: (status === 'loading' || !email) ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          background: (status === 'loading' || !email)
            ? '#94a3b8'
            : 'linear-gradient(135deg, #059669, #10b981)',
          color: '#fff',
          boxShadow: status === 'loading' ? 'none' : '0 4px 12px rgba(5,150,105,0.25)',
        }}
      >
        {status === 'loading' ? '⏳ Iscrizione in corso...' : '📬 Iscriviti — è gratis'}
      </button>

      {status === 'error' && (
        <p style={{ fontSize: 12, color: '#dc2626', marginTop: 10, textAlign: 'center' }}>
          Errore nell'iscrizione. Riprova tra qualche secondo.
        </p>
      )}

      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
        Zero spam. Massimo 1 email al mese. Cancellati in un click.
      </p>
    </div>
  );
}