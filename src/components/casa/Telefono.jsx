import { useEffect, useState } from 'react';
import { useAccount } from '../../casa/sync.js';
import { ambiente, useInstallazione, installa, apriScaricaApp, statoPush, attivaPush, disattivaPush, provaPush, conta } from '../../casa/dispositivo.js';
import { Foglio, Icona } from './ui.jsx';

const CHIAVE_RINVIO = 'sb_invito_app';
const GIORNI_RINVIO = 21;

function rinviato() {
  try {
    const t = Number(localStorage.getItem(CHIAVE_RINVIO) || 0);
    return Date.now() - t < GIORNI_RINVIO * 86400000;
  } catch { return false; }
}

/** Istruzioni per iPhone: Safari non ha un pulsante "Installa", serve la condivisione. */
export function IstruzioniIphone({ aperto, onChiudi }) {
  const a = ambiente();
  return (
    <Foglio aperto={aperto} onChiudi={onChiudi} titolo="Aggiungi alla schermata Home">
      {!a.safari && a.ios && (
        <p className="ca-alert warn" style={{ marginBottom: 16 }}><Icona nome="info" size={18} /><span>Su iPhone l'installazione funziona da <strong>Safari</strong>: apri soldibuoni.it/casa in Safari e segui i passaggi.</span></p>
      )}
      <ol className="ca-passi">
        <li>
          <span className="ca-passi-n">1</span>
          <span className="ca-passi-t">Tocca <strong>Condividi</strong> nella barra di Safari <span className="ca-passi-g" aria-hidden="true"><Icona nome="condividi" size={18} /></span></span>
        </li>
        <li>
          <span className="ca-passi-n">2</span>
          <span className="ca-passi-t">Scorri e scegli <strong>Aggiungi alla schermata Home</strong> <span className="ca-passi-g" aria-hidden="true"><Icona nome="aggiungihome" size={18} /></span></span>
        </li>
        <li>
          <span className="ca-passi-n">3</span>
          <span className="ca-passi-t">Apri <strong>SoldiBuoni</strong> dalla Home: da lì puoi attivare le notifiche.</span>
        </li>
      </ol>
      <p className="ca-muted small" style={{ marginTop: 18 }}>I dati restano gli stessi: l'app installata e il sito sono la stessa casa.</p>
    </Foglio>
  );
}

/** Invito in panoramica: installa l'app (se non lo è) o attiva le notifiche (se installata). */
export function InvitoApp({ vai, altrimenti = null }) {
  const a = ambiente();
  const acc = useAccount();
  const inst = useInstallazione();
  const [push, setPush] = useState(null);
  const [nascosto, setNascosto] = useState(rinviato);
  const [iphone, setIphone] = useState(false);

  useEffect(() => { if (a.standalone) statoPush().then(setPush); }, [a.standalone]);

  const chiudi = () => { try { localStorage.setItem(CHIAVE_RINVIO, String(Date.now())); } catch {} setNascosto(true); };
  if (nascosto) return altrimenti;

  let testo, azione, onAzione, icona = 'telefono';
  if (!a.standalone) {
    if (inst === 'pronta') {
      testo = <><strong>Tienila sul telefono.</strong> Si apre come un'app e ti avvisa il giorno delle scadenze.</>;
      azione = 'Installa'; onAzione = async () => { conta('invito_install', 'prompt'); await installa(); };
    } else if (a.ios) {
      testo = <><strong>Tienila sulla Home dell'iPhone.</strong> Si apre come un'app e ti avvisa il giorno delle scadenze.</>;
      azione = 'Come si fa'; onAzione = () => { conta('invito_install', 'ios'); apriScaricaApp('telefono'); };
    } else return altrimenti; // computer o browser senza installazione: niente invito
  } else {
    if (!acc.utente || push !== 'spente') return altrimenti;
    icona = 'campanella';
    testo = <><strong>Attiva le notifiche.</strong> Una al giorno al massimo, solo quando scade qualcosa.</>;
    azione = 'Attiva'; onAzione = () => vai('casa');
  }

  return (
    <>
      <div className="ca-invito ca-invito-app">
        <span className="ca-invito-ico"><Icona nome={icona} size={20} /></span>
        <div className="ca-invito-app-t">
          <p>{testo}</p>
          <button className="ca-link" onClick={onAzione}>{azione}</button>
        </div>
        <button className="ca-icon-btn" aria-label="Non ora" onClick={chiudi}><Icona nome="chiudi" size={16} /></button>
      </div>
      <IstruzioniIphone aperto={iphone} onChiudi={() => setIphone(false)} />
    </>
  );
}

/** Scheda nella sezione Casa: app installata e notifiche push. */
export function SchedaTelefono() {
  const a = ambiente();
  const acc = useAccount();
  const inst = useInstallazione();
  const [push, setPush] = useState(null);
  const [occupato, setOccupato] = useState(false);
  const [msg, setMsg] = useState(null);
  const [iphone, setIphone] = useState(false);

  const aggiornaStato = () => statoPush().then(setPush).catch(() => setPush('non-supportate'));
  useEffect(() => { aggiornaStato(); }, [acc.utente?.id]);

  const esegui = async (fn, ok) => {
    setMsg(null); setOccupato(true);
    try { await fn(); if (ok) setMsg(ok); }
    catch (e) { setMsg(e.message || 'Operazione non riuscita.'); }
    finally { setOccupato(false); aggiornaStato(); }
  };

  const etichettaStato = a.standalone ? 'Installata' : inst === 'installata' ? 'Installata' : 'Dal browser';

  return (
    <div className="ca-card ca-tel">
      <p className="ca-acc-k">Telefono</p>
      <h3 className="ca-acc-t">L'app, e un avviso quando serve.</h3>

      <div className="ca-tel-riga">
        <span className="ca-tel-ico"><Icona nome="telefono" size={20} /></span>
        <span className="ca-tel-main">
          <strong>App sul telefono</strong>
          <small className="ca-muted">{a.standalone
            ? 'Stai usando l\'app installata. Si aggiorna da sola.'
            : 'Un\'icona sulla Home, si apre a schermo intero e funziona anche senza rete.'}</small>
        </span>
        {a.standalone || inst === 'installata'
          ? <span className="ca-pill ok">{etichettaStato}</span>
          : <button className="btn btn-ink btn-sm" onClick={() => (inst === 'pronta' ? esegui(installa) : apriScaricaApp('telefono'))}>Scarica</button>}
      </div>

      <div className="ca-tel-riga">
        <span className="ca-tel-ico"><Icona nome="campanella" size={20} /></span>
        <span className="ca-tel-main">
          <strong>Notifiche</strong>
          <small className="ca-muted">{
            push === 'serve-app' ? 'Su iPhone arrivano solo dall\'app installata sulla Home.'
            : push === 'non-supportate' ? 'Questo browser non supporta le notifiche. Usa l\'email del lunedì.'
            : push === 'bloccate' ? 'Bloccate nelle impostazioni del telefono: riattivale lì per SoldiBuoni.'
            : !acc.utente ? 'Serve l\'accesso con email: le notifiche partono dai dati salvati nel tuo account.'
            : push === 'attive' ? 'Attive su questo dispositivo. Al massimo una al giorno, alle 8.'
            : 'Il giorno delle scadenze, due giorni prima dei pagamenti da fare a mano, un mese prima della fine delle offerte.'
          }</small>
        </span>
        {push === 'serve-app'
          ? <button className="btn btn-line btn-sm" onClick={() => apriScaricaApp('telefono')}>Installa</button>
          : acc.utente && (push === 'spente' || push === 'attive')
            ? (
              <label className="ca-switch" aria-label="Notifiche su questo dispositivo">
                <input type="checkbox" checked={push === 'attive'} disabled={occupato}
                  onChange={(e) => esegui(e.target.checked ? attivaPush : disattivaPush, e.target.checked ? 'Notifiche attive su questo dispositivo.' : 'Notifiche disattivate su questo dispositivo.')} />
                <span aria-hidden="true" />
              </label>
            ) : null}
      </div>

      {push === 'attive' && acc.utente && (
        <div className="ca-data-act">
          <button className="btn btn-line" disabled={occupato} onClick={() => esegui(provaPush, 'Notifica inviata: dovrebbe arrivare entro pochi secondi.')}>
            {occupato ? 'Invio…' : 'Mandami una notifica di prova'}
          </button>
        </div>
      )}
      {msg && <p className="ca-muted small" style={{ marginTop: 12 }} role="status">{msg}</p>}
      <IstruzioniIphone aperto={iphone} onChiudi={() => setIphone(false)} />
    </div>
  );
}
