import { useMemo } from 'react';
import { azioni } from '../../casa/store.js';
import { CATEGORIE, ORDINE, GRUPPI, vociAttese, costoMensile, eur, num, dataBreve, giorniTra, oggiISO, addGiorni } from '../../casa/model.js';
import { calcolaAvvisi, calcolaScadenze } from '../../casa/insights.js';
import { consigliDelMese } from '../../casa/stagione.js';
import { scaricaCalendario } from '../../casa/calendario.js';
import { Icona, IconaCategoria } from './ui.jsx';
import { InvitoAccount } from './Account.jsx';

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
  const mancanti = vociAttese(stato.casa).filter((c) => !voci.find((v) => v.cat === c));
  const perGruppo = Object.keys(GRUPPI).map((g) => ({ g, tot: voci.filter((v) => CATEGORIE[v.cat].gruppo === g).reduce((t, v) => t + v.mensile, 0) }));
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
        <Completa mancanti={vociAttese(stato.casa)} vai={vai} />
      </section>
    );
  }

  const oggi = oggiISO();
  const tra7 = addGiorni(oggi, 7), tra30 = addGiorni(oggi, 30);
  const tutte = calcolaScadenze(stato, 45);
  const conImporto = (x) => (x.tipo === 'pagamento' || x.tipo === 'ricorrente') && Number(x.importo) > 0;
  const settimana = tutte.filter((x) => x.data >= oggi && x.data <= tra7 && conImporto(x));
  const totSett = settimana.reduce((t, x) => t + Number(x.importo), 0);
  const mese = tutte.filter((x) => x.data >= oggi && x.data <= tra30 && conImporto(x));
  const totMese = mese.reduce((t, x) => t + Number(x.importo), 0);
  const autoMese = mese.filter((x) => x.automatico).reduce((t, x) => t + Number(x.importo), 0);
  const daFare = avvisi.filter((x) => x.livello !== 'info');
  const daSapere = avvisi.filter((x) => x.livello === 'info');
  const prossime = tutte.filter((x) => x.data >= oggi).slice(0, 5);
  const consigli = consigliDelMese(stato.casa);
  const fmtG = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

  return (
    <section className="ca-page">
      <header className="ca-week">
        <p className="eyebrow">{nome} · dal {fmtG(oggi)} al {fmtG(tra7)}</p>
        <h1 className="display ca-week-t">
          {totSett > 0
            ? <>Questa settimana escono <span className="ca-week-n">{eur(totSett)}</span></>
            : <>Questa settimana<br /><em>nessun pagamento.</em></>}
        </h1>
        <p className="ca-muted ca-week-s">
          {totMese > 0
            ? <>Nei prossimi 30 giorni: <span className="num">{eur(totMese)}</span> per la casa{autoMese > 0 && <>, di cui <span className="num">{eur(autoMese)}</span> con addebito automatico</>}.</>
            : 'Nei prossimi 30 giorni non ci sono pagamenti registrati.'}
        </p>
      </header>

      <InvitoAccount vai={vai} />

      <div className="ca-cols">
        <div>
          <h2 className="ca-h2">Da fare {daFare.length > 0 && <span className="ca-count num">{daFare.length}</span>}</h2>
          {daFare.length ? (
            <div className="ca-avs">{daFare.map((a) => <Avviso key={a.id} a={a} vai={vai} />)}</div>
          ) : (
            <div className="ca-card ca-empty-s"><Icona nome="ok" size={20} /> Niente da fare questa settimana.</div>
          )}

          <div className="ca-h2-row">
            <h2 className="ca-h2">Prossime scadenze</h2>
            {prossime.length > 0 && <button className="ca-link" onClick={() => scaricaCalendario(stato)}>Aggiungi al calendario</button>}
          </div>
          {prossime.length ? (
            <div className="ca-card flush ca-list">
              {prossime.map((x) => <RigaScadenza key={x.id} s={x} onApri={() => vai('scadenze')} />)}
            </div>
          ) : (
            <div className="ca-card ca-empty-s">Nessuna scadenza in arrivo.</div>
          )}

          {daSapere.length > 0 && <>
            <h2 className="ca-h2">Da sapere</h2>
            <div className="ca-avs">{daSapere.map((a) => <Avviso key={a.id} a={a} vai={vai} />)}</div>
          </>}
        </div>

        <div>
          {consigli.length > 0 && <>
            <h2 className="ca-h2">Questo mese in casa</h2>
            <div className="ca-tips">
              {consigli.slice(0, 2).map((t) => (
                <article className="ca-tip" key={t.id}>
                  <IconaCategoria cat={t.categoria} size={34} />
                  <div><h3>{t.titolo}</h3><p>{t.testo}</p></div>
                </article>
              ))}
            </div>
          </>}

          <h2 className="ca-h2">Quanto costa la casa</h2>
          <div className="ca-card ca-cost">
            <p className="ca-cost-tot"><span className="num">{eur(totale)}</span><span>al mese in media</span></p>
            <div className="ca-stack" role="img" aria-label={voci.map((v) => `${CATEGORIE[v.cat].label} ${Math.round((v.mensile / totale) * 100)}%`).join(', ')}>
              {voci.map((v) => <span key={v.cat} style={{ flexGrow: v.mensile, background: CATEGORIE[v.cat].colore }} />)}
            </div>
            <div className="ca-split">
              {perGruppo.map(({ g, tot }) => (
                <div key={g}><span className="ca-kpi-l">{GRUPPI[g]}</span><span className="num">{eur(tot)}</span></div>
              ))}
            </div>
            <div className="ca-list ca-cost-list">
              {voci.map((v) => (
                <button className="ca-row" key={v.cat} onClick={() => vai('voce/' + v.cat)}>
                  <IconaCategoria cat={v.cat} size={34} />
                  <span className="ca-row-main"><span className="ca-row-t">{CATEGORIE[v.cat].label}</span></span>
                  <span className="num ca-row-v">{eur(v.mensile)}</span>
                  <Icona nome="freccia" size={16} className="ca-chev" />
                </button>
              ))}
            </div>
          </div>
          {mancanti.length > 0 && <Completa mancanti={mancanti} vai={vai} />}
        </div>
      </div>
    </section>
  );
}

function Completa({ mancanti, vai }) {
  const gruppi = Object.keys(GRUPPI).map((g) => [g, mancanti.filter((c) => CATEGORIE[c].gruppo === g)]).filter(([, l]) => l.length);
  return (
    <div className="ca-complete">
      <h2 className="ca-h2">Completa il quadro</h2>
      <p className="ca-muted">Più voci aggiungi, più il costo della casa è reale.</p>
      {gruppi.map(([g, lista]) => (
        <div key={g} className="ca-complete-g">
          <p className="ca-complete-l">{GRUPPI[g]}</p>
          <div className="ca-chips">
            {lista.map((c) => (
              <button key={c} className="ca-chip" onClick={() => vai('aggiungi?cat=' + c)}>
                <Icona nome={CATEGORIE[c].icona} size={16} /> {CATEGORIE[c].label} <Icona nome="piu" size={14} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
