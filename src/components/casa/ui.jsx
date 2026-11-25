import { useEffect, useRef } from 'react';
import { CATEGORIE } from '../../casa/model.js';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

const PATHS = {
  luce: <><path {...P} d="M9 18h6M10 21h4" /><path {...P} d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" /></>,
  gas: <path {...P} d="M12 3c.5 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2.4 1.3-3.9 2.5-5 .2 1.6 1 2.6 2 3 .3-3.3-.8-6.2.5-8.5Z" />,
  internet: <><path {...P} d="M3 9.5a13 13 0 0 1 18 0M6 13a8.5 8.5 0 0 1 12 0M9 16.5a4 4 0 0 1 6 0" /><circle cx="12" cy="19.5" r="1" fill="currentColor" /></>,
  mobile: <><rect {...P} x="7" y="3" width="10" height="18" rx="2.2" /><path {...P} d="M11 18h2" /></>,
  acqua: <path {...P} d="M12 3.5S6 10 6 14a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5Z" />,
  tari: <><path {...P} d="M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13" /></>,
  condominio: <><rect {...P} x="5" y="3.5" width="14" height="17" rx="1" /><path {...P} d="M9 7.5h1M14 7.5h1M9 11h1M14 11h1M9 14.5h1M14 14.5h1M11 20.5v-3h2v3" /></>,
  altro: <><circle {...P} cx="12" cy="12" r="8.5" /><path {...P} d="M8.5 12h7M12 8.5v7" /></>,
  mutuo: <><path {...P} d="M3 10 12 4l9 6M5 10v9h14v-9" /><path {...P} d="M12 11.5v5M13.6 12.6c-.3-.5-.9-.8-1.6-.8-1 0-1.7.5-1.7 1.2 0 1.6 3.4.9 3.4 2.5 0 .7-.7 1.2-1.7 1.2-.8 0-1.4-.3-1.7-.8" /></>,
  chiave: <><circle {...P} cx="8" cy="15" r="4" /><path {...P} d="M11 12l8-8M16 7l2.5 2.5M14 9l2 2" /></>,
  scudo: <path {...P} d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6Z" />,
  chiaveinglese: <path {...P} d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 1-2-2Z" />,
  documento: <><path {...P} d="M7 3.5h7l4 4v13H7Z" /><path {...P} d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6" /></>,
  casa: <><path {...P} d="M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5Z" /><path {...P} d="M10 20v-5h4v5" /></>,
  calendario: <><rect {...P} x="4" y="5" width="16" height="15" rx="2" /><path {...P} d="M4 10h16M9 3v4M15 3v4" /></>,
  piu: <path {...P} d="M12 5v14M5 12h14" />,
  archivio: <><rect {...P} x="4" y="4" width="16" height="5" rx="1" /><path {...P} d="M5.5 9v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9M10 13h4" /></>,
  panoramica: <><path {...P} d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  freccia: <path {...P} d="M9 6l6 6-6 6" />,
  indietro: <path {...P} d="M15 6l-6 6 6 6" />,
  chiudi: <path {...P} d="M6 6l12 12M18 6 6 18" />,
  upload: <><path {...P} d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path {...P} d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" /></>,
  camera: <><path {...P} d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2.5h6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" /><circle {...P} cx="12" cy="13" r="3.5" /></>,
  matita: <path {...P} d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17Z" />,
  ok: <path {...P} d="M5 12.5 10 17 19 7.5" />,
  allerta: <><path {...P} d="M12 4 2.8 19.5h18.4Z" /><path {...P} d="M12 10v4.5" /><circle cx="12" cy="17" r=".9" fill="currentColor" /></>,
  info: <><circle {...P} cx="12" cy="12" r="8.5" /><path {...P} d="M12 11v5" /><circle cx="12" cy="8" r=".9" fill="currentColor" /></>,
  lucchetto: <><rect {...P} x="5" y="10.5" width="14" height="10" rx="2" /><path {...P} d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  cestino: <><path {...P} d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.2a1 1 0 0 0 1 .8h6.4a1 1 0 0 0 1-.8L17 7" /></>,
  campanella: <><path {...P} d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15Z" /><path {...P} d="M10 20.5a2 2 0 0 0 4 0" /></>,
  condividi: <><path {...P} d="M12 14.5V3.5M8.5 7 12 3.5 15.5 7" /><path {...P} d="M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17.5 10H16" /></>,
  aggiungihome: <><rect {...P} x="4" y="4" width="16" height="16" rx="3.5" /><path {...P} d="M12 8.5v7M8.5 12h7" /></>,
  telefono: <><rect {...P} x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path {...P} d="M10.5 5h3" /><circle cx="12" cy="18.3" r=".9" fill="currentColor" /></>,
  ripeti: <><path {...P} d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5" /><path {...P} d="M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" /></>,
};

export function Icona({ nome, size = 22, className, style }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className} style={style}>
      {PATHS[nome] || PATHS.altro}
    </svg>
  );
}

export function IconaCategoria({ cat, size = 40 }) {
  const c = CATEGORIE[cat] || CATEGORIE.altro;
  return (
    <span className="ca-cat-ico" style={{ '--cc': c.colore, width: size, height: size }}>
      <Icona nome={c.icona} size={Math.round(size * 0.52)} />
    </span>
  );
}

/** Bottom sheet su mobile, dialog centrato su desktop. */
export function Foglio({ aperto, onChiudi, titolo, children, piede }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!aperto) return;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onChiudi(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector('input,select,button,textarea')?.focus(), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [aperto]);
  if (!aperto) return null;
  return (
    <div className="ca-sheet-bg" onMouseDown={(e) => e.target === e.currentTarget && onChiudi()}>
      <div className="ca-sheet" role="dialog" aria-modal="true" aria-label={titolo} ref={ref}>
        <div className="ca-sheet-hd">
          <h2 className="ca-sheet-t">{titolo}</h2>
          <button className="ca-icon-btn" onClick={onChiudi} aria-label="Chiudi"><Icona nome="chiudi" /></button>
        </div>
        <div className="ca-sheet-body">{children}</div>
        {piede && <div className="ca-sheet-ft">{piede}</div>}
      </div>
    </div>
  );
}

export function Campo({ label, hint, children, id }) {
  return (
    <label className="ca-field" htmlFor={id}>
      <span className="ca-field-l">{label}</span>
      {children}
      {hint && <span className="ca-field-h">{hint}</span>}
    </label>
  );
}

export function Scelta({ opzioni, valore, onChange, nome, colonne }) {
  return (
    <div className={'ca-seg' + (colonne ? ' cols-' + colonne : '')} role="radiogroup" aria-label={nome}>
      {opzioni.map((o) => (
        <button
          type="button" key={o.v} role="radio" aria-checked={valore === o.v}
          className={'ca-seg-o' + (valore === o.v ? ' on' : '')}
          onClick={() => onChange(o.v)}
        >
          {o.icona && <Icona nome={o.icona} size={20} />}
          <span>{o.l}</span>
          {o.sub && <small>{o.sub}</small>}
        </button>
      ))}
    </div>
  );
}

/** Barre verticali minimali: [{ etichetta, valore, evidenzia }] */
export function Barre({ dati, altezza = 140, formato = (v) => v, colore = 'var(--ink)' }) {
  if (!dati.length) return null;
  const max = Math.max(...dati.map((d) => d.valore)) || 1;
  return (
    <div className="ca-bars" style={{ height: altezza + 40 }} role="img" aria-label={dati.map((d) => `${d.etichetta}: ${formato(d.valore)}`).join(', ')}>
      {dati.map((d, i) => (
        <div className="ca-bar-col" key={i}>
          <span className="ca-bar-v num">{formato(d.valore)}</span>
          <div className="ca-bar-track" style={{ height: altezza }}>
            <div className="ca-bar" style={{ height: `${Math.max(3, (d.valore / max) * 100)}%`, background: d.evidenzia ? colore : 'var(--line-strong)' }} />
          </div>
          <span className="ca-bar-l">{d.etichetta}</span>
        </div>
      ))}
    </div>
  );
}
