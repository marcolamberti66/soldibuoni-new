import React, { useState, useMemo } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function CalendarioAuto({ color = '#f43f5e' }) {
  const [form, setForm] = useState({
    immatMese: '01', 
    immatAnno: new Date().getFullYear().toString(),
    ultimaRevMese: '', 
    ultimaRevAnno: '',
    ultimoTagliando: '',
    bolloMese: '01',
    nome: '', 
    email: '', 
    targa: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // IL CERVELLO CHE CALCOLA LE DATE IN AUTOMATICO (FIXATO E MIGLIORATO)
  const scadenzeCalcolate = useMemo(() => {
    const dates = {};
    const now = new Date();
    const currentYear = now.getFullYear();

    // 1. REVISIONE (4 anni la prima, poi ogni 2)
    const anniAuto = currentYear - parseInt(form.immatAnno);
    if (anniAuto < 4) {
      dates.revisione = new Date(parseInt(form.immatAnno) + 4, parseInt(form.immatMese), 0); // Fine mese
    } else if (form.ultimaRevAnno && form.ultimaRevMese) {
      dates.revisione = new Date(parseInt(form.ultimaRevAnno) + 2, parseInt(form.ultimaRevMese), 0);
    }

    // 2. BOLLO (Mese scadenza scelto dall'utente)
    let bDate = new Date(currentYear, parseInt(form.bolloMese), 0);
    if (bDate < now) bDate = new Date(currentYear + 1, parseInt(form.bolloMese), 0);
    dates.bollo = bDate;

    // 3. TAGLIANDO (12 mesi dall'ultimo O fallback sul mese di immatricolazione)
    if (form.ultimoTagliando) {
      // Parsing super sicuro per tutti i browser
      const parts = form.ultimoTagliando.split('-'); 
      if (parts.length === 3) {
        dates.tagliando = new Date(parseInt(parts[0]) + 1, parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    } else {
      // Fallback intelligente: fine del mese dell'immatricolazione (anniversario)
      let tYear = currentYear;
      let tDate = new Date(tYear, parseInt(form.immatMese), 0);
      if (tDate < now) tDate = new Date(tYear + 1, parseInt(form.immatMese), 0);
      dates.tagliando = tDate;
    }

    // 4. GOMME (Date fisse di legge: 15 Nov e 15 Apr)
    let gInv = new Date(currentYear, 10, 15);
    if (gInv < now) gInv.setFullYear(currentYear + 1);
    dates.gommeInvernali = gInv;

    let gEst = new Date(currentYear, 3, 15);
    if (gEst < now) gEst.setFullYear(currentYear + 1);
    dates.gommeEstive = gEst;

    return dates;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.nome) {
      setError('Nome ed Email sono obbligatori per attivare gli alert');
      return;
    }

    setError('');
    setSubmitting(true);

    const safeDate = (d) => d ? d.toISOString().split('T')[0] : undefined;

    // Usiamo esattamente le chiavi del tuo file originale per non rompere la tua API backend
    const scadenzePayload = {
      bollo: safeDate(scadenzeCalcolate.bollo),
      revisione: safeDate(scadenzeCalcolate.revisione),
      tagliando: safeDate(scadenzeCalcolate.tagliando),
      gommeInvernali: safeDate(scadenzeCalcolate.gommeInvernali),
      gommeEstive: safeDate(scadenzeCalcolate.gommeEstive),
    };

    try {
      const res = await fetch('/api/brevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'car_reminder',
          email: form.email.trim().toLowerCase(),
          nome: form.nome.trim(),
          targa: form.targa.trim().toUpperCase() || undefined,
          scadenze: scadenzePayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nella registrazione');
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Errore di connessione. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', fontSize: '14px', outline: 'none', fontFamily: 'inherit', color: '#0f172a' };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', animation: `fadeInUp 0.5s ${EASE}` }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>📧</div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Promemoria attivati!</h2>
        <p style={{ color: '#64748b', lineHeight: '1.6' }}>Riceverai un'email a <strong>{form.email}</strong> 7 giorni prima di ogni scadenza.</p>
        <button onClick={() => setSuccess(false)} style={{ marginTop: 24, background: color, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Calcola un'altra auto</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{__html: `@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}} />
      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 32, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', animation: `fadeInUp 0.4s ${EASE}` }}>
        
        <h3 style={{ marginBottom: 8, fontWeight: 800, fontSize: 20, color: '#0f172a' }}>📅 Scadenzario Personalizzato</h3>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Inserisci i dati del veicolo per ricevere gli alert via email.</p>
        
        {/* PARTE 1: DATI VEICOLO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Immatricolazione (Mese/Anno)</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <select style={{...inputStyle, flex: 1}} value={form.immatMese} onChange={e => setForm({...form, immatMese: e.target.value})}>
                {Array.from({length:12}, (_,i)=> (i+1).toString().padStart(2,'0')).map(m => <option key={m} value={m}>Mese {m}</option>)}
              </select>
              <input type="number" placeholder="Anno (es. 2021)" style={{...inputStyle, flex: 1}} value={form.immatAnno} onChange={e => setForm({...form, immatAnno: e.target.value})} />
            </div>
          </div>

          {(new Date().getFullYear() - parseInt(form.immatAnno)) >= 4 && (
            <div style={{ gridColumn: '1/-1', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Data ultima revisione (se fatta)</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <select style={{...inputStyle, background: '#fff'}} value={form.ultimaRevMese} onChange={e => setForm({...form, ultimaRevMese: e.target.value})}>
                  <option value="">Mese...</option>
                  {Array.from({length:12}, (_,i)=> (i+1).toString().padStart(2,'0')).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="number" placeholder="Anno" style={{...inputStyle, background: '#fff'}} value={form.ultimaRevAnno} onChange={e => setForm({...form, ultimaRevAnno: e.target.value})} />
              </div>
            </div>
          )}

          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Mese scadenza bollo</label>
            <select style={{...inputStyle, marginTop: 6}} value={form.bolloMese} onChange={e => setForm({...form, bolloMese: e.target.value})}>
              {['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'].map((m,i) => <option key={m} value={(i+1).toString().padStart(2,'0')}>{m}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Data ultimo tagliando (opzionale)</label>
            <input type="date" style={{...inputStyle, marginTop: 6}} value={form.ultimoTagliando} onChange={e => setForm({...form, ultimoTagliando: e.target.value})} />
          </div>
        </div>

        {/* PARTE 2: RIEPILOGO AUTOMATICO */}
        <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 16, marginBottom: 24, border: '1px solid #dcfce7' }}>
          <p style={{ marginBottom: 12, fontWeight: 800, color: '#166534', fontSize: 13 }}>Scadenze calcolate:</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, color: '#166534', fontSize: 14 }}>
            <li>🔍 Revisione: <strong>{scadenzeCalcolate.revisione?.toLocaleDateString('it-IT') || 'Nessun dato'}</strong></li>
            <li>💳 Bollo: <strong>Fine {scadenzeCalcolate.bollo?.toLocaleDateString('it-IT', {month:'long', year:'numeric'})}</strong></li>
            <li>🔧 Tagliando: <strong>{scadenzeCalcolate.tagliando?.toLocaleDateString('it-IT') || 'Nessun dato'}</strong> {form.ultimoTagliando === '' && <span style={{fontSize: 12, fontWeight: 500, color: '#15803d'}}>(Stimato su base immatricolazione)</span>}</li>
            <li>🛞 Cambio Gomme: <strong>15 Nov / 15 Apr</strong></li>
          </ul>
        </div>

        {/* PARTE 3: DATI UTENTE (MAIL!!) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24, padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>✉️ Ricevi i promemoria 7 giorni prima</h4>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>TUO NOME *</label><input placeholder="Es. Mario" required style={{...inputStyle, background:'#fff', marginTop:4}} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>LA TUA EMAIL *</label><input type="email" placeholder="nome@email.it" required style={{...inputStyle, background:'#fff', marginTop:4}} value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>TARGA (OPZIONALE)</label><input placeholder="AB123CD" style={{...inputStyle, background:'#fff', marginTop:4, textTransform:'uppercase'}} value={form.targa} onChange={e => setForm({...form, targa: e.target.value.toUpperCase()})} /></div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, fontSize: 13, color: '#b91c1c', marginBottom: 14 }}>⚠️ {error}</div>}

        <button type="submit" disabled={submitting} style={{ width: '100%', padding: 18, background: '#0f172a', color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: submitting ? 'wait' : 'pointer', transition: '0.2s' }}>
          {submitting ? 'Attivazione in corso...' : 'Attiva Promemoria Gratuiti →'}
        </button>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 14, textAlign: 'center' }}>🔒 Zero spam. Solo alert tecnici 7 giorni prima della scadenza.</p>
      </form>
    </div>
  );
}