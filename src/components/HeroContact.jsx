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
      }
      .hero-contact-input:focus { border-color: #059669; }
      .hero-contact-send {
        margin-top: 10px;
        width: 100%;
        background: #059669; /* var(--green-600) */
        color: #fff;
        border: none;
        padding: 11px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.2s;
        box-sizing: border-box;
      }
      .hero-contact-send:hover { background: #047857; }
    `}} />
  );
}

export default function HeroContact() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/brevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'contact_message', 
          message: message 
        })
      });

      if (res.ok) {
        setStatus('success');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Errore di rete:", error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="hero-contact-box" style={{ textAlign: 'center', padding: '24px 20px' }}>
        <StyleInjector />
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>✅</div>
        <h4 style={{ margin: '0 0 8px 0', color: '#0c2340', fontSize: '16px' }}>Messaggio inviato!</h4>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Lo abbiamo ricevuto. Ti risponderemo il prima possibile.
        </p>
        <button 
          onClick={() => setStatus('idle')}
          style={{ marginTop: '16px', background: 'none', border: 'none', color: '#059669', fontWeight: 600, cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
        >
          Scrivi un altro messaggio
        </button>
      </div>
    );
  }

  return (
    <form className="hero-contact-box" onSubmit={handleSubmit}>
      <StyleInjector />
      <label>💬 Scrivici — ti rispondiamo entro 24h</label>
      <textarea 
        className="hero-contact-input" 
        rows="2" 
        placeholder="Es: Ho una bolletta da €180/mese, è troppo? Come posso risparmiare?"
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
        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          Oops! C'è stato un errore di rete. Riprova.
        </div>
      )}
    </form>
  );
}