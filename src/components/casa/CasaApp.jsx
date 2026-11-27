import { useEffect, useMemo, useState } from 'react';
import { useCasa, azioni, prendiInAttesa, ciSonoInAttesa } from '../../casa/store.js';
import { conta } from '../../casa/dispositivo.js';
import { avviaSync, useAccount, usaInvito, invitoInAttesa, ricordaInvito, chiudiAvvisoInvito } from '../../casa/sync.js';
import { InvitoCasa } from './Condivisa.jsx';
import { useApertura } from '../../casa/dispositivo.js';
import { calcolaAvvisi } from '../../casa/insights.js';
import { Icona } from './ui.jsx';
import Panoramica from './Panoramica.jsx';
import Aggiungi from './Aggiungi.jsx';
import Voce from './Voce.jsx';
import Dividi from './Dividi.jsx';
import { Scadenze, Archivio, Casa, Benvenuto } from './Altre.jsx';

function useRotta() {
  const leggi = () => (typeof location === 'undefined' ? '' : location.hash.replace(/^#\/?/, ''));
  const [r, setR] = useState(leggi);
  useEffect(() => {
    const f = () => { setR(leggi()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return r;
}

const TABS = [
  { r: '', l: 'Panoramica', i: 'panoramica' },
  { r: 'scadenze', l: 'Scadenze', i: 'calendario' },
  { r: 'aggiungi', l: 'Aggiungi', i: 'piu', primario: true },
  { r: 'dividi', l: 'Dividi', i: 'dividi', soloCondivisa: true },
  { r: 'archivio', l: 'Spese', i: 'archivio' },
  { r: 'casa', l: 'Impostazioni', i: 'casa' },
];
// "Dividi" compare quando in casa vive più di una persona (o i conti sono già iniziati).
const conDividi = (s) => (Number(s.casa?.persone) || 1) > 1 || s.conviventi.length > 0;

export default function CasaApp() {
  const stato = useCasa();
  const rotta = useRotta();
  const [pronto, setPronto] = useState(false);
  useApertura();
  const acc = useAccount();
  const [invito, setInvito] = useState(null);
  useEffect(() => {
    // Link d'invito: /casa?invito=CODICE. Il codice resta in memoria anche se l'accesso
    // passa dal link nell'email, che riporta su /casa senza parametri.
    const q = new URLSearchParams(location.search);
    const codice = q.get('invito');
    if (codice && /^[A-Za-z2-9]{8}$/.test(codice)) {
      q.delete('invito');
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
      usaInvito(codice);
    }
    setInvito(invitoInAttesa());
    setPronto(true);
    avviaSync();
  }, []);
  useEffect(() => { if (acc.utente) setInvito(invitoInAttesa()); }, [acc.utente?.id, acc.stato]);
  // Chi ha già una casa e controlla una bolletta dalla pagina pubblica: la ritrova qui.
  useEffect(() => {
    if (!stato.casa || !ciSonoInAttesa()) return;
    const l = prendiInAttesa();
    if (l.length) { azioni.aggiungiDocumenti(l); conta('controllo_casa', l.length); }
  }, [!!stato.casa]);
  const [percorso, query] = rotta.split('?');
  const parametri = new URLSearchParams(query || '');
  const vai = (r) => { location.hash = '#/' + r; };
  const nAvvisi = useMemo(() => calcolaAvvisi(stato).filter((a) => a.livello !== 'info').length, [stato]);

  if (!pronto) return <div className="ca-boot" aria-busy="true" />;
  if (invito && !acc.utente) {
    return (
      <div className="ca ca-solo"><div className="ca-main">
        <InvitoCasa codice={invito} conCasa={!!stato.casa} />
        <button className="ca-link muted ca-invcasa-no" onClick={() => { ricordaInvito(null); setInvito(null); }}>Non ora, continua senza invito</button>
      </div></div>
    );
  }
  if (!stato.casa && acc.utente && acc.stato === 'salvataggio') {
    return <div className="ca ca-solo"><div className="ca-main"><p className="ca-sync-wait" aria-busy="true">Recupero la tua casa…</p></div></div>;
  }
  if (!stato.casa) return <div className="ca ca-solo"><div className="ca-main"><Benvenuto /></div></div>;

  let vista;
  if (percorso.startsWith('voce/')) vista = <Voce cat={percorso.slice(5)} stato={stato} vai={vai} />;
  else if (percorso === 'aggiungi') vista = <Aggiungi key={rotta} parametri={parametri} vai={vai} />;
  else if (percorso === 'scadenze') vista = <Scadenze stato={stato} vai={vai} />;
  else if (percorso === 'archivio') vista = <Archivio stato={stato} vai={vai} />;
  else if (percorso === 'dividi') vista = <Dividi stato={stato} vai={vai} />;
  else if (percorso === 'casa') vista = <Casa stato={stato} vai={vai} />;
  else vista = <Panoramica stato={stato} vai={vai} />;

  const attiva = (t) => (t.r === '' ? percorso === '' || percorso.startsWith('voce/') : percorso === t.r);

  return (
    <div className="ca">
      <nav className="ca-tabs" aria-label="Sezioni">
        {TABS.filter((t) => !t.soloCondivisa || conDividi(stato) || percorso === 'dividi').map((t) => (
          <a key={t.r} href={'#/' + t.r} className={'ca-tab' + (attiva(t) ? ' on' : '') + (t.primario ? ' prim' : '')} aria-current={attiva(t) ? 'page' : undefined}>
            <span className="ca-tab-i">
              <Icona nome={t.i} size={t.primario ? 22 : 21} />
              {t.r === 'scadenze' && nAvvisi > 0 && <b className="ca-dot" aria-label={`${nAvvisi} avvisi`} />}
            </span>
            <span className="ca-tab-l">{t.l}</span>
          </a>
        ))}
      </nav>
      <div className="ca-main">
        {acc.invito && (
          <div className={'ca-alert ' + (acc.invito.ok ? 'ok' : 'warn')} role="status" style={{ marginBottom: 18 }}>
            <Icona nome={acc.invito.ok ? 'ok' : 'info'} size={18} />
            <span>{acc.invito.ok ? 'Sei nella casa condivisa: bollette e scadenze sono le stesse per tutti.' : acc.invito.errore}</span>
            <button className="ca-icon-btn" aria-label="Chiudi" onClick={chiudiAvvisoInvito}><Icona nome="chiudi" size={16} /></button>
          </div>
        )}
        {vista}
      </div>
    </div>
  );
}
