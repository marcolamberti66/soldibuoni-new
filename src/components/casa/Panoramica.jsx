import { useMemo } from 'react';
import { azioni } from '../../casa/store.js';
import { CATEGORIE, ORDINE, costoMensile, eur, num, dataBreve, giorniTra, oggiISO } from '../../casa/model.js';
import { calcolaAvvisi, calcolaScadenze } from '../../casa/insights.js';
import { Icona, IconaCategoria } from './ui.jsx';

export function Avviso({ a, vai }) {
  const ico = a.livello === 'info' ? 'info' : 'allerta';
  return (
    <article className={'ca-av ' + a.livello}>
      <span className="ca-av-ico"><Icona nome={ico} size={18} /></span>
      <div className="ca-av-b">
        <h3>{a.titolo}</h3>
        <p>{a.testo}</p>
        <div className="ca-av-act">
          {a.azione?.tipo === 'vai' && <button className="ca-link" onClick={() => vai(a.azione.href.replace('#/', ''))}>{a.azione.label}</button>}
          {a.azione?.tipo === 'pagato' && <button className="ca-link" onClick={() => azioni.modificaDocumento(a.azione.docId, { pagato: true })}>{a.azione.label}</button>}
          <button className="ca-link muted" onClick={() => azioni.archiviaAvviso(a.id)}>Ho capito</button>
        </div>
      </div>
    </article>
  );
}

export function RigaScadenza({ s, onApri }) {
  const g = giorniTra(oggiISO(), s.data);
  const quando = g < 0 ? `${-g} gg fa` : g === 0 ? 'oggi' : g === 1 ? 'domani' : `tra ${g} gg`;
  const d = new Date(s.data + 'T00:00:00');
  return (
    <button className="ca-due" onClick={onApri}>
      <span className="ca-due-d"><b className="num">{d.getDate()}</b><small>{d.toLocaleDateString('it-IT', { month: 'short' })}</small></span>
      <span className="ca-row-main">
        <span className="ca-row-t">{s.titolo}</span>
        <span className="ca-row-s">
          {quando}
          {s.tipo === 'pagamento' || s.tipo === 'ricorrente' ? (s.automatico ? ' · addebito automatico' : ' · da pagare') : ''}
        </span>
      </span>
      {s.importo ? <span className="num ca-row-v">{eur(s.importo, 2)}</span> : <Icona nome="freccia" size={18} />}
    </button>
  );
}

export default function Panoramica({ stato, vai }) {
  const voci = useMemo(() =>
    ORDINE.map((cat) => ({ cat, ...(costoMensile(stato, cat) || {}) }))
      .filter((v) => v.mensile > 0)
      .sort((a, b) => b.mensile - a.mensile), [stato]);
  const totale = voci.reduce((s, v) => s + v.mensile, 0);
  const avvisi = useMemo(() => calcolaAvvisi(stato), [stato]);
  const scadenze = useMemo(() => calcolaScadenze(stato, 60).filter((s) => s.data >= oggiISO()).slice(0, 4), [stato]);
  const mancanti = ORDINE.filter((c) => c !== 'altro' && !voci.find((v) => v.cat === c));
  const nDoc = stato.documenti.length + stato.ricorrenti.length;
  const nome = stato.casa?.nome || 'La tua casa';

  if (!nDoc) {
    return (
      <section className="ca-page">
        <header className="ca-hero">
          <p className="eyebrow">{nome}</p>
          <h1 className="display ca-hero-t">Iniziamo dalla<br /><em>prima bolletta.</em></h1>
          <p className="ca-muted ca-hero-s">Carica una bolletta di luce o gas: in pochi secondi ne estraggo importo, consumi, prezzo e scadenze. Da lì costruiamo il quadro dei costi della casa.</p>
          <button className="btn btn-ink" onClick={() => vai('aggiungi')}><Icona nome="upload" size={18} /> Carica una bolletta</button>
        </header>
        <Completa mancanti={ORDINE.filter((c) => c !== 'altro')} vai={vai} />
      </section>
    );
  }

  return (
    <section className="ca-page">
      <header className="ca-hero">
        <p className="eyebrow">{nome} · costo medio</p>
        <p className="ca-total">
          <span className="ca-total-e">€</span><span className="num">{num(Math.round(totale))}</span><span className="ca-total-u">al mese</span>
        </p>
        <p className="ca-muted">Circa <span className="num">{eur(totale * 12)}</span> l'anno, calcolato su {nDoc} {nDoc === 1 ? 'voce' : 'voci'} registrate.</p>

        <div className="ca-stack" role="img" aria-label={voci.map((v) => `${CATEGORIE[v.cat].label} ${Math.round((v.mensile / totale) * 100)}%`).join(', ')}>
          {voci.map((v) => <span key={v.cat} style={{ flexGrow: v.mensile, background: CATEGORIE[v.cat].colore }} />)}
        </div>
      </header>

      <div className="ca-cols">
        <div>
          <h2 className="ca-h2">Dove vanno i soldi</h2>
          <div className="ca-list ca-card flush">
            {voci.map((v) => (
              <button className="ca-row" key={v.cat} onClick={() => vai('voce/' + v.cat)}>
                <IconaCategoria cat={v.cat} size={38} />
                <span className="ca-row-main">
                  <span className="ca-row-t">{CATEGORIE[v.cat].label}</span>
                  <span className="ca-row-s">{Math.round((v.mensile / totale) * 100)}% · {v.fonte === 'ricorrente' ? 'importo fisso' : 'da bollette'}</span>
                </span>
                <span className="ca-row-r"><span className="num ca-row-v">{eur(v.mensile)}</span><span className="ca-row-s">/mese</span></span>
                <Icona nome="freccia" size={18} className="ca-chev" />
              </button>
            ))}
          </div>
          {mancanti.length > 0 && <Completa mancanti={mancanti} vai={vai} />}
        </div>

        <div>
          <h2 className="ca-h2">Da sistemare {avvisi.length > 0 && <span className="ca-count num">{avvisi.length}</span>}</h2>
          {avvisi.length ? (
            <div className="ca-avs">
              {avvisi.slice(0, 4).map((a) => <Avviso key={a.id} a={a} vai={vai} />)}
              {avvisi.length > 4 && <button className="ca-link" onClick={() => vai('scadenze')}>Vedi tutti gli avvisi ({avvisi.length})</button>}
            </div>
          ) : (
            <div className="ca-card ca-empty-s"><Icona nome="ok" size={20} /> Niente da segnalare. Ti scriviamo qui quando qualcosa cambia.</div>
          )}

          <h2 className="ca-h2">Prossime scadenze</h2>
          {scadenze.length ? (
            <div className="ca-card flush ca-list">
              {scadenze.map((s) => <RigaScadenza key={s.id} s={s} onApri={() => vai('scadenze')} />)}
            </div>
          ) : (
            <div className="ca-card ca-empty-s">Nessuna scadenza nei prossimi 60 giorni.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function Completa({ mancanti, vai }) {
  return (
    <div className="ca-complete">
      <h2 className="ca-h2">Completa il quadro</h2>
      <p className="ca-muted">Più voci aggiungi, più il costo della casa è reale.</p>
      <div className="ca-chips">
        {mancanti.map((c) => (
          <button key={c} className="ca-chip" onClick={() => vai('aggiungi?cat=' + c)}>
            <Icona nome={CATEGORIE[c].icona} size={16} /> {CATEGORIE[c].label} <Icona nome="piu" size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}
