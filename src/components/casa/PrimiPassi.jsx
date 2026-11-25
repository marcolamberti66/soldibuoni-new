import { useEffect, useState } from 'react';
import { useAccount } from '../../casa/sync.js';
import { ambiente, useInstallazione, apriScaricaApp } from '../../casa/dispositivo.js';
import { Icona } from './ui.jsx';

const CHIUSO = 'sb_primi_passi_chiusi';
export const BENVENUTO = 'sb_benvenuto';

const leggi = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const scrivi = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };

/**
 * "Primi passi": il ponte tra le quattro domande e l'uso abituale.
 * Dice dove sei (la panoramica), cosa è già fatto e cosa manca, con un tocco per passo.
 */
export const primiPassiChiusi = () => leggi(CHIUSO) === '1';

export default function PrimiPassi({ stato, vai, vuota = false }) {
  const acc = useAccount();
  const inst = useInstallazione();
  const a = ambiente();
  const [chiuso, setChiuso] = useState(() => leggi(CHIUSO) === '1');
  const [benvenuto] = useState(() => leggi(BENVENUTO) === '1');
  // Il benvenuto resta finché la panoramica non è stata davvero vista (non solo montata
  // per un istante durante il passaggio dalle domande alla prima bolletta).
  useEffect(() => {
    if (!benvenuto) return;
    const t0 = Date.now();
    return () => { if (Date.now() - t0 > 1500) scrivi(BENVENUTO, null); };
  }, [benvenuto]);

  const bollette = stato.documenti.length;
  const fisse = stato.ricorrenti.length;
  const conMutuo = stato.casa?.titolo === 'proprieta_mutuo';
  const passi = [
    { id: 'casa', fatto: true, t: 'Casa impostata', s: 'Le quattro risposte iniziali. Puoi cambiarle dalla sezione Casa.', az: 'Modifica', fn: () => vai('casa') },
    { id: 'bolletta', fatto: bollette > 0, t: 'Carica una bolletta', s: 'Luce o gas, PDF o foto: leggo importo, consumi, prezzo e scadenze.', az: 'Carica', fn: () => vai('aggiungi') },
    { id: 'fisse', fatto: fisse > 0, t: conMutuo ? 'Rata del mutuo e condominio' : 'Spese fisse della casa', s: 'Le spese senza bolletta: bastano importo e frequenza.', az: 'Aggiungi', fn: () => vai('aggiungi?cat=' + (conMutuo && !stato.ricorrenti.some((r) => r.categoria === 'mutuo') ? 'mutuo' : 'condominio')) },
    { id: 'app', fatto: a.standalone || inst === 'installata', t: 'App sul telefono', s: 'Un\'icona sulla Home, si apre a schermo intero e funziona offline.', az: 'Scarica', fn: () => apriScaricaApp('primi-passi') },
    { id: 'avvisi', fatto: !!acc.utente, t: 'Avvisi e copia di sicurezza', s: 'Accedi con l\'email: ricevi l\'email del lunedì, le notifiche e ritrovi i dati su ogni dispositivo.', az: 'Attiva', fn: () => vai('casa') },
  ];
  const fatti = passi.filter((p) => p.fatto).length;
  if (chiuso || fatti === passi.length) return null;
  const prossimo = passi.find((p) => !p.fatto);

  return (
    <section className="ca-pp" aria-labelledby="ca-pp-t">
      <div className="ca-pp-head">
        <div>
          <p className="ca-pp-k">{benvenuto ? 'Fatto · questa è la tua panoramica' : 'Primi passi'}</p>
          <h2 id="ca-pp-t" className="ca-pp-t">{benvenuto ? <>La tua casa è pronta.<br /><em>Ora completiamo il quadro.</em></> : <>Completa il quadro <em>della casa.</em></>}</h2>
          {benvenuto
            ? <p className="ca-pp-s">Questa è la pagina da riaprire: ogni settimana ti dice cosa esce dal conto, cosa scade e cosa conviene fare. {vuota ? 'Per ora è vuota: il passo che la riempie è la prima bolletta.' : 'Più dati aggiungi, più gli avvisi sono precisi.'}</p>
            : vuota && <p className="ca-pp-s">La panoramica è ancora vuota. Carica una bolletta o inserisci le spese fisse: da quel momento qui trovi ogni settimana cosa esce, cosa scade e cosa fare.</p>}
        </div>
        <div className="ca-pp-prog" role="img" aria-label={`${fatti} passi su ${passi.length} completati`}>
          <b className="num">{fatti}<small>/{passi.length}</small></b>
          <i><em style={{ width: (fatti / passi.length) * 100 + '%' }} /></i>
        </div>
      </div>
      <ol className="ca-pp-list">
        {passi.map((p) => (
          <li key={p.id} className={(p.fatto ? 'fatto' : '') + (p === prossimo ? ' prossimo' : '')}>
            <button onClick={p.fn} disabled={p.fatto && p.id !== 'casa'}>
              <span className="ca-pp-c" aria-hidden="true">{p.fatto ? <Icona nome="ok" size={16} /> : null}</span>
              <span className="ca-pp-m"><strong>{p.t}</strong>{!p.fatto && <small>{p.s}</small>}</span>
              {!p.fatto && <span className={p === prossimo ? 'btn btn-ink btn-sm' : 'ca-pp-az'}>{p.az}</span>}
              <span className="ca-sr">{p.fatto ? 'completato' : 'da fare'}</span>
            </button>
          </li>
        ))}
      </ol>
      {fatti >= 2 && <button className="ca-link muted ca-pp-x" onClick={() => { scrivi(CHIUSO, '1'); setChiuso(true); }}>Nascondi i primi passi</button>}
    </section>
  );
}
