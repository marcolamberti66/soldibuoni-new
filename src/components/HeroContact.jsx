import React, { useState } from 'react';

export default function HeroContact() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

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
        throw new Error("Errore nell'invio");
      }
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="sb-form sb-form-success">
        <div className="sb-form-success-mark">✓</div>
        <h4 className="sb-form-success-title">Messaggio inviato.</h4>
        <p className="sb-form-success-text">
          Ti risponderemo all'indirizzo indicato nei giorni lavorativi successivi.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="sb-form-success-again"
        >
          Scrivi un altro messaggio
        </button>
      </div>
    );
  }

  return (
    <form className="sb-form" onSubmit={handleSubmit}>
      <label className="sb-form-label" htmlFor="sb-hc-email">
        Scrivici · risposta in 1-2 giorni lavorativi
      </label>

      <input
        id="sb-hc-email"
        type="email"
        className="sb-form-input"
        placeholder="La tua email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'loading'}
        required
      />

      <textarea
        className="sb-form-input sb-form-textarea"
        rows="3"
        placeholder="Es: perché il costo annuo della bolletta è più alto di quanto mi era stato promesso?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={status === 'loading'}
        required
      />

      <button
        type="submit"
        className="sb-form-submit"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Invio in corso…' : 'Invia messaggio →'}
      </button>

      {status === 'error' && (
        <div className="sb-form-error">
          Si è verificato un errore. Riprova più tardi.
        </div>
      )}
    </form>
  );
}