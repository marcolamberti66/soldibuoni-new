import { useEffect, useMemo, useState } from 'react';
import { useCasa } from '../../casa/store.js';
import { calcolaAvvisi } from '../../casa/insights.js';
import { Icona } from './ui.jsx';
import Panoramica from './Panoramica.jsx';
import Aggiungi from './Aggiungi.jsx';
import Voce from './Voce.jsx';
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
  { r: 'archivio', l: 'Archivio', i: 'archivio' },
  { r: 'casa', l: 'Casa', i: 'casa' },
];

export default function CasaApp() {
  const stato = useCasa();
  const rotta = useRotta();
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  const [percorso, query] = rotta.split('?');
  const parametri = new URLSearchParams(query || '');
  const vai = (r) => { location.hash = '#/' + r; };
  const nAvvisi = useMemo(() => calcolaAvvisi(stato).filter((a) => a.livello !== 'info').length, [stato]);

  if (!pronto) return <div className="ca-boot" aria-busy="true" />;
  if (!stato.casa) return <div className="ca ca-solo"><div className="ca-main"><Benvenuto /></div></div>;

  let vista;
  if (percorso.startsWith('voce/')) vista = <Voce cat={percorso.slice(5)} stato={stato} vai={vai} />;
  else if (percorso === 'aggiungi') vista = <Aggiungi key={rotta} parametri={parametri} vai={vai} />;
  else if (percorso === 'scadenze') vista = <Scadenze stato={stato} vai={vai} />;
  else if (percorso === 'archivio') vista = <Archivio stato={stato} vai={vai} />;
  else if (percorso === 'casa') vista = <Casa stato={stato} />;
  else vista = <Panoramica stato={stato} vai={vai} />;

  const attiva = (t) => (t.r === '' ? percorso === '' || percorso.startsWith('voce/') : percorso === t.r);

  return (
    <div className="ca">
      <nav className="ca-tabs" aria-label="Sezioni">
        {TABS.map((t) => (
          <a key={t.r} href={'#/' + t.r} className={'ca-tab' + (attiva(t) ? ' on' : '') + (t.primario ? ' prim' : '')} aria-current={attiva(t) ? 'page' : undefined}>
            <span className="ca-tab-i">
              <Icona nome={t.i} size={t.primario ? 22 : 21} />
              {t.r === 'scadenze' && nAvvisi > 0 && <b className="ca-dot" aria-label={`${nAvvisi} avvisi`} />}
            </span>
            <span className="ca-tab-l">{t.l}</span>
          </a>
        ))}
      </nav>
      <div className="ca-main">{vista}</div>
    </div>
  );
}
