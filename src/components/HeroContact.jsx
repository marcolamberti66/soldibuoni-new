import React, { useState } from 'react';

// Inietto il CSS direttamente qui per bypassare i blocchi di Astro 
// e garantire che il design sia identico al millimetro all'originale
function StyleInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      .hero-contact-box {
        background: #ffffff;
        border-radius: 14px;
        padding: 18px 20px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        width: 100%;
        box-sizing: border-box;
      }
      .hero-contact-box label {
        font-size: 12px;
        font-weight: 700;
        color: #64748b; /* var(--text-muted) */
        text-transform: uppercase;
        letter-spacing: 1px;
        display: block;
        margin-bottom: 8px;
      }
      .hero-contact-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        resize: none; /* Rimuove la barra di ridimensionamento dinamica */
        color: #334155; /* var(--text-body) */
        transition: border 0.2s;
        box-sizing: border-box;
        margin-bottom: 12px;
      }
      .hero-contact-input:focus {
        border-color: #3b82f6; /* var(--accent-blue) */
      }
      .hero-contact-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .hero-contact-email {
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 13px;
        outline: none;
        width: 180px;
      }
      .hero-contact-send {
        width: 100%;
        background: #0f172a; /* var(--navy-900) */
        color: white;
        border: none;
        padding: 12px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.1s, background 0.2s;
      }
      .hero-contact-send:hover {
        background: #1e293b;
      }
      .hero-contact-send:active {
        transform: scale(0.98);
      }

      @media (max-width: 600px) {
        .hero-contact-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        .hero-contact-email {
          width: 100%;
        }
      }
    `}} />
  );
}

export default function HeroContact() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/send-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message, source: 'homepage_hero' }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('');
        setEmail('');
      } else {
        throw new Error('Errore nell\'invio');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="hero-contact-box" style={{ textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
        <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Messaggio inviato!</h4>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
          Ti risponderemo all'indirizzo email indicato entro 24 ore.
        </p>
        <button 
          onClick={() => setStatus('idle')}
          style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '600', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
        >
          Scrivi un altro messaggio
        </button>
      </div>
    );
  }

  return (
    <form className="hero-contact-box" onSubmit={handleSubmit}>
      <StyleInjector />
      <div className="hero-contact-row">
        <label style={{ marginBottom: 0 }}>💬 Scrivici — ti rispondiamo entro 24h</label>
        <input 
          type="email"
          className="hero-contact-email"
          placeholder="La tua email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          required
        />
      </div>
      <textarea 
        className="hero-contact-input" 
        rows="2" 
        placeholder="Es: Perché il costo annuo della mia bolletta è più alto di quello che mi era stato promesso?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={status === 'loading'}
        required
      ></textarea>
      <button 
        type="submit" 
        className="hero-contact-send"
        disabled={status === 'loading'}
        style={{ opacity: status === 'loading' ? 0.7 : 1 }}
      >
        {status === 'loading' ? 'Invio in corso...' : 'Invia messaggio →'}
      </button>
      {status === 'error' && (
        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
          Si è verificato un errore. Riprova più tardi.
        </div>
      )}
    </form>
  );
}