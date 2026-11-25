import { useEffect, useState } from 'react';
import { useAccount, inviaLink, verificaCodice, esci, leggiNotifiche, impostaNotifiche, emailDiProva } from '../../casa/sync.js';
import { Icona } from './ui.jsx';

/** Accesso con link via email, stato della sincronizzazione, email del lunedì. */
export default function Account({ variante } = {}) {
  const acc = useAccount();
  const [email, setEmail] = useState('');
  const [fase, setFase] = useState('modulo'); // modulo | inviato
  const [msg, setMsg] = useState(null);
  const [notif, setNotif] = useState(null);
  const [occupato, setOccupato] = useState(false);
  const [codice, setCodice] = useState('');

  useEffect(() => {
    if (acc.utente) leggiNotifiche().then((n) => setNotif(n ? n.email_avvisi : true)).catch(() => {});
  }, [acc.utente?.id]);

  if (!acc.utente) {
    return (
      <div className="ca-card ca-acc">
        <p className="ca-acc-k">{variante === 'rientro' ? 'Bentornato' : 'Account'}</p>
        <h3 className="ca-acc-t">{variante === 'rientro' ? 'Ritrova la tua casa.' : 'Ogni lunedì, la settimana della casa nella tua email.'}</h3>
        <p className="ca-muted">{variante === 'rientro'
          ? 'Scrivi l\'email con cui ti sei registrato: ti mandiamo un link, lo apri e i tuoi dati compaiono qui.'
          : 'Accedi con la tua email: i dati restano anche se cambi telefono o browser, e ogni lunedì ricevi il riepilogo. Niente password, ti mandiamo un link.'}</p>
        {fase === 'inviato' ? (
          <>
            <div className="ca-acc-ok">
              <Icona nome="ok" size={18} />
              <span>Abbiamo scritto a <strong>{email}</strong>. Inserisci qui il codice che trovi nell'email, oppure apri il link. Non arriva? Guarda nello spam.</span>
            </div>
            <form className="ca-acc-code" onSubmit={async (e) => {
              e.preventDefault(); setMsg(null); setOccupato(true);
              try { await verificaCodice(email.trim(), codice); }
              catch { setMsg('Codice non valido o scaduto. Controlla le cifre o chiedine uno nuovo.'); }
              finally { setOccupato(false); }
            }}>
              <input className="num" inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="Codice" value={codice}
                onChange={(e) => setCodice(e.target.value.replace(/\D/g, ''))} aria-label="Codice di accesso" />
              <button className="btn btn-ink" disabled={occupato || codice.length < 6}>{occupato ? 'Verifica…' : 'Entra'}</button>
            </form>
            <button className="ca-link muted ca-acc-again" onClick={() => { setFase('modulo'); setCodice(''); setMsg(null); }}>Usa un'altra email o richiedi un nuovo codice</button>
          </>
        ) : (
          <form className="ca-acc-f" onSubmit={async (e) => {
            e.preventDefault(); setMsg(null); setOccupato(true);
            try { await inviaLink(email.trim()); setFase('inviato'); }
            catch (err) { setMsg(/rate|limit/i.test(err.message) ? 'Troppe richieste ravvicinate: riprova tra qualche minuto.' : 'Invio non riuscito: controlla l\'indirizzo e riprova.'); }
            finally { setOccupato(false); }
          }}>
            <input type="email" required autoComplete="email" inputMode="email" placeholder="nome@email.it" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
            <button className="btn btn-ink" disabled={occupato}>{occupato ? 'Invio…' : 'Mandami il link'}</button>
          </form>
        )}
        {msg && <p className="ca-acc-err">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="ca-card ca-acc">
      <p className="ca-acc-k">Account</p>
      <p className="ca-acc-user"><strong>{acc.utente.email}</strong>
        <span className={'ca-pill ' + (acc.stato === 'ok' ? 'ok' : acc.stato === 'errore' ? 'warn' : '')}>
          {acc.stato === 'ok' ? 'Sincronizzato' : acc.stato === 'errore' ? 'Errore di sincronizzazione' : 'Sincronizzazione…'}
        </span>
      </p>
      {acc.stato === 'errore' && <p className="ca-acc-err">I dati sono al sicuro su questo dispositivo; riproviamo alla prossima modifica.</p>}
      <label className="ca-check ca-acc-toggle">
        <input type="checkbox" checked={!!notif} onChange={async (e) => { const v = e.target.checked; setNotif(v); try { await impostaNotifiche(v); } catch { setNotif(!v); } }} />
        <span><strong>Email del lunedì</strong><br /><small className="ca-muted">Cosa esce, cosa fare e cosa scade. Solo se c'è qualcosa da dire.</small></span>
      </label>
      <div className="ca-data-act">
        <button className="btn btn-line" disabled={occupato} onClick={async () => {
          setMsg(null); setOccupato(true);
          try { const r = await emailDiProva(); setMsg('Anteprima inviata a ' + r.a + '.'); }
          catch (e) { setMsg(e.message); }
          finally { setOccupato(false); }
        }}>{occupato ? 'Invio…' : 'Mandami un\'anteprima'}</button>
        <button className="btn btn-line" onClick={esci}>Esci</button>
      </div>
      {msg && <p className="ca-muted small" style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}

/** Invito discreto in panoramica, per chi non ha ancora un account. */
export function InvitoAccount({ vai }) {
  const acc = useAccount();
  const [chiuso, setChiuso] = useState(() => { try { return localStorage.getItem('sb_invito_account') === '1'; } catch { return false; } });
  if (acc.utente || chiuso) return null;
  return (
    <div className="ca-invito">
      <Icona nome="calendario" size={20} />
      <p><strong>Ricevi tutto questo ogni lunedì.</strong> Accedi con l'email: i dati restano anche se cambi telefono.</p>
      <button className="ca-link" onClick={() => vai('casa')}>Attiva</button>
      <button className="ca-icon-btn" aria-label="Chiudi" onClick={() => { try { localStorage.setItem('sb_invito_account', '1'); } catch {} setChiuso(true); }}><Icona nome="chiudi" size={16} /></button>
    </div>
  );
}
