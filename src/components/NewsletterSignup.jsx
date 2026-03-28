import React, { useState } from 'react';

export default function NewsletterSignup({ variant }) {
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [interessi, setInteressi] = useState(['energia', 'gas']);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [showPrefs, setShowPrefs] = useState(false);

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
        background: '#f0fdf4', borderRadius: 16, padding: '28px 24px',
        border: '1px solid #bbf7d0', textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
          Iscrizione confermata!
        </p>
        <p style={{ fontSize: 14, color: '#166534' }}>
          Ogni mese riceverai un report personalizzato con le migliori offerte e i consigli per risparmiare.
        </p>
      </div>
    );
  }

  // Versione compatta per homepage/footer
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

  // Versione completa con preferenze
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
