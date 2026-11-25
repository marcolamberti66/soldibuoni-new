import { useEffect, useState } from 'react';
import { useAccount, creaInvito, personeCasa, rimuoviPersona, invitoValido } from '../../casa/sync.js';
import Account from './Account.jsx';
import { Icona } from './ui.jsx';

async function condividiLink(link) {
  const testo = 'Ti ho invitato nella nostra casa su SoldiBuoni: bollette, mutuo e scadenze in un posto solo. Apri il link e accedi con la tua email.';
  if (navigator.share) {
    try { await navigator.share({ title: 'La nostra casa su SoldiBuoni', text: testo, url: link }); return 'condiviso'; }
    catch (e) { if (e?.name === 'AbortError') return 'annullato'; }
  }
  try { await navigator.clipboard.writeText(link); return 'copiato'; } catch { return 'mostra'; }
}

/** Scheda nella sezione Casa: chi vive qui e invito. */
export function SchedaCondivisa({ vai }) {
  const acc = useAccount();
  const [persone, setPersone] = useState([]);
  const [invito, setInvito] = useState(null);
  const [msg, setMsg] = useState(null);
  const [occupato, setOccupato] = useState(false);

  const ricarica = () => personeCasa().then(setPersone).catch(() => {});
  useEffect(() => { if (acc.utente && acc.stato === 'ok') ricarica(); }, [acc.utente?.id, acc.stato]);

  const io = acc.utente?.id;
  const sonoProprietario = persone.some((p) => p.proprietario && p.user_id === io);
  const altri = persone.filter((p) => p.user_id !== io);

  async function invita() {
    setMsg(null); setOccupato(true);
    try {
      const inv = invito || await creaInvito();
      setInvito(inv);
      const esito = await condividiLink(inv.link);
      if (esito === 'copiato') setMsg('Link copiato: incollalo in un messaggio a chi vive con te.');
    } catch (e) { setMsg(e.message); }
    finally { setOccupato(false); }
  }

  async function togli(p) {
    const tu = p.user_id === io;
    if (!confirm(tu ? 'Uscire da questa casa condivisa? Su questo dispositivo resta una copia dei dati come casa tua.' : `Togliere ${p.email} dalla casa? Non vedrà più bollette e scadenze.`)) return;
    try { await rimuoviPersona(p.user_id); ricarica(); }
    catch (e) { setMsg(e.message); }
  }

  return (
    <div className="ca-card ca-tel ca-cond">
      <p className="ca-acc-k">Chi vive qui</p>
      <h3 className="ca-acc-t">Una casa, due telefoni.</h3>
      <p className="ca-muted">Invita chi vive con te: vedete le stesse bollette e scadenze, e ognuno riceve i propri avvisi. Chi aggiunge una bolletta la aggiunge per entrambi.</p>

      {!acc.utente ? (
        <div className="ca-cond-req">
          <Icona nome="chiave" size={18} />
          <span>Per condividere la casa serve l'accesso con email, qui sopra.</span>
        </div>
      ) : (
        <>
          <ul className="ca-cond-list">
            {persone.length === 0 && <li className="ca-muted small">Carico…</li>}
            {persone.map((p) => (
              <li key={p.user_id}>
                <span className="ca-cond-av" aria-hidden="true">{(p.email || '?').slice(0, 1).toUpperCase()}</span>
                <span className="ca-cond-m"><strong>{p.user_id === io ? 'Tu' : p.email}</strong><small>{p.proprietario ? 'ha creato la casa' : 'invitato'}{p.user_id === io ? ` · ${p.email}` : ''}</small></span>
                {((sonoProprietario && p.user_id !== io) || (!p.proprietario && p.user_id === io)) && (
                  <button className="ca-link muted" onClick={() => togli(p)}>{p.user_id === io ? 'Esci' : 'Togli'}</button>
                )}
              </li>
            ))}
          </ul>
          <div className="ca-data-act">
            <button className="btn btn-ink" disabled={occupato} onClick={invita}>
              <Icona nome="condividi" size={17} /> {occupato ? 'Preparo l\'invito…' : altri.length ? 'Invita un\'altra persona' : 'Invita chi vive con te'}
            </button>
          </div>
          {invito && (
            <p className="ca-cond-link">
              <span>Link d'invito, valido 7 giorni e per una persona:</span>
              <code>{invito.link}</code>
            </p>
          )}
        </>
      )}
      {msg && <p className="ca-muted small" role="status" style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}

/** Schermata di chi apre un link d'invito senza aver ancora fatto l'accesso. */
export function InvitoCasa({ codice, conCasa }) {
  const [valido, setValido] = useState(null);
  useEffect(() => { invitoValido(codice).then(setValido).catch(() => setValido(false)); }, [codice]);

  return (
    <section className="ca-invcasa" aria-labelledby="ca-invcasa-t">
      <p className="ca-pp-k">Invito</p>
      <h1 id="ca-invcasa-t" className="display ca-onb-t">Ti hanno invitato<br /><em>in una casa.</em></h1>
      {valido === false ? (
        <p className="ca-onb-s">Questo invito è scaduto o è già stato usato. Chiedi a chi te l'ha mandato di crearne uno nuovo dalla sezione Casa.</p>
      ) : (
        <>
          <p className="ca-onb-s">Su SoldiBuoni chi vive insieme vede le stesse bollette, la rata del mutuo, il condominio e le scadenze, e ognuno riceve i propri avvisi.
            {conCasa ? ' I dati che hai già inserito su questo telefono si aggiungono alla casa condivisa.' : ''}</p>
          <Account variante="invito" />
        </>
      )}
    </section>
  );
}
