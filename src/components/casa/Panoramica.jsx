import { useMemo, useState } from 'react';
import { azioni } from '../../casa/store.js';
import { CATEGORIE, ORDINE, GRUPPI, vociAttese, costoMensile, eur, num, dataBreve, giorniTra, oggiISO, addGiorni } from '../../casa/model.js';
import { calcolaAvvisi, calcolaScadenze } from '../../casa/insights.js';
import { consigliDelMese } from '../../casa/stagione.js';
import { scaricaCalendario } from '../../casa/calendario.js';
import { Icona, IconaCategoria } from './ui.jsx';
import PrimiPassi, { primiPassiChiusi } from './PrimiPassi.jsx';
import { RiepilogoConti } from './Dividi.jsx';
import Account from './Account.jsx';
import { useAccount } from '../../casa/sync.js';
import { vociCosto, calendarioAnno, nomeMese } from '../../casa/cruscotto.js';
import { stimaCasa } from '../../data/stima-casa.js';

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
  const acc = useAccount();
  const costi = useMemo(() => vociCosto(stato), [stato]);
  const cal = useMemo(() => calendarioAnno(stato), [stato]);
  const avvisi = useMemo(() => calcolaAvvisi(stato), [stato]);
  const [meseSel, setMeseSel] = useState(null);
  const nome = stato.casa?.nome || 'La tua casa';
  const nDoc = stato.documenti.length + stato.ricorrenti.length;
  const mancanti = vociAttese(stato.casa).filter((c) => !costi.voci.find((v) => v.cat === c));
  const salva = !acc.utente && <div className="ca-salva"><Account /></div>;

  // Casa ancora vuota: la stima per una casa come questa, finché non arrivano i dati veri.
  if (!nDoc) {
    const st = stimaCasa({ citta: stato.casa?.citta, persone: stato.casa?.persone, riscaldamento: stato.casa?.riscaldamento });
    return (
      <section className="ca-page">
        {salva}
        <PrimiPassi stato={stato} vai={vai} vuota />
        <div className="ca-card ca-stima">
          <p className="ca-dash-k">Intanto, una stima</p>
          <p className="ca-stima-n"><span className="num">{eur(st.mese)}</span> al mese di luce, gas e TARI</p>
          <p className="ca-muted">Per una casa come la tua{st.citta ? ` a ${st.citta.citta}` : ''}, ai prezzi ARERA di questo trimestre. Ogni documento che carichi sostituisce la stima con il dato vero.</p>
          <div className="ca-stima-v">
            {st.voci.map((v) => <span key={v.cat}><IconaCategoria cat={v.cat} size={28} /> {v.label} <b className="num">{eur(v.anno / 12)}</b></span>)}
          </div>
        </div>
        <Completa mancanti={vociAttese(stato.casa)} vai={vai} />
      </section>
    );
  }

  const oggi = oggiISO();
  const tutte = calcolaScadenze(stato, 45);
  const tra30 = addGiorni(oggi, 30);
  const conImporto = (x) => (x.tipo === 'pagamento' || x.tipo === 'ricorrente') && Number(x.importo) > 0;
  const mese = tutte.filter((x) => x.data >= oggi && x.data <= tra30 && conImporto(x));
  const totMese = mese.reduce((t, x) => t + Number(x.importo), 0);
  const autoMese = mese.filter((x) => x.automatico).reduce((t, x) => t + Number(x.importo), 0);
  const prossime = tutte.filter((x) => x.data >= oggi).slice(0, 5);
  const daFare = avvisi.filter((x) => x.livello !== 'info');
  const daSapere = avvisi.filter((x) => x.livello === 'info');
  const consigli = consigliDelMese(stato.casa);
  const picchi = cal.mesi.filter((m) => m.picco).sort((a, b) => b.totale - a.totale);
  const sel = meseSel ? cal.mesi.find((m) => m.chiave === meseSel) : null;

  return (
    <section className="ca-page ca-dash">
      <header className="ca-week">
        <p className="eyebrow">{nome}</p>
        <h1 className="display ca-week-t">
          {totMese > 0
            ? <>Nei prossimi 30 giorni escono <span className="ca-week-n">{eur(totMese)}</span></>
            : <>Nei prossimi 30 giorni<br /><em>nessun pagamento.</em></>}
        </h1>
        <p className="ca-muted ca-week-s">
          {totMese > 0 && autoMese > 0 && <><span className="num">{eur(autoMese)}</span> con addebito automatico. </>}
          {prossime[0] && <>Il prossimo: {prossime[0].titolo}, {dataBreve(prossime[0].data)}.</>}
        </p>
      </header>

      {salva}
      <PrimiPassi stato={stato} vai={vai} />

      <section className="ca-dash-s" aria-labelledby="dash-costo">
        <div className="ca-h2-row"><h2 className="ca-h2" id="dash-costo">Quanto costa la casa</h2></div>
        <div className="ca-card ca-costo">
          <p className="ca-costo-tot"><span className="num">{eur(costi.totale)}</span> l'anno <span className="ca-costo-m">· <span className="num">{eur(costi.totale / 12)}</span> al mese</span></p>
          <div className="ca-stack" role="img" aria-label={costi.voci.map((v) => `${v.label} ${Math.round(v.quota)}%`).join(', ')}>
            {costi.voci.map((v) => <span key={v.cat} style={{ flexGrow: v.anno, background: CATEGORIE[v.cat].colore }} />)}
          </div>
          <div className="ca-split">
            {costi.gruppi.map((g) => <div key={g.g}><span className="ca-kpi-l">{g.label}</span><span className="num">{eur(g.anno)}</span></div>)}
          </div>
          <div className="ca-list ca-costo-list">
            {costi.voci.map((v) => (
              <button className="ca-row ca-costo-r" key={v.cat} onClick={() => vai('voce/' + v.cat)}>
                <IconaCategoria cat={v.cat} size={34} />
                <span className="ca-row-main">
                  <span className="ca-row-t">{v.label} <span className="ca-quota num">{Math.round(v.quota)}%</span></span>
                  <span className="ca-row-s">
                    {v.andamento ? <Var v={v.andamento.var} testo="sull'anno prima" />
                      : v.confronto ? <Var v={v.confronto.var} testo={'rispetto alla ' + v.confronto.testo} neutro />
                      : v.fonte === 'ricorrente' ? 'spesa fissa' : 'dalle bollette'}
                  </span>
                </span>
                <span className="ca-costo-v"><span className="num">{eur(v.anno)}</span><small className="num">{eur(v.mensile)}/mese</small></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="ca-dash-s" aria-labelledby="dash-anno">
        <div className="ca-h2-row"><h2 className="ca-h2" id="dash-anno">Quando pesa</h2><span className="ca-muted small">prossimi 12 mesi</span></div>
        <div className="ca-card ca-cal">
          <p className="ca-cal-s">
            {picchi.length
              ? <>Il mese più pesante è <b>{nomeMese(picchi[0].chiave, true)}</b>: <span className="num">{eur(picchi[0].totale)}</span>, per {picchi[0].voci.slice(0, 2).map((v) => v.titolo).join(' e ')}.{picchi.length > 1 && <> Poi {picchi.slice(1, 3).map((m) => nomeMese(m.chiave, true)).join(' e ')}.</>}</>
              : <>Nessun mese fuori scala: in media <span className="num">{eur(cal.totale / 12)}</span> al mese.</>}
          </p>
          <div className="ca-cal-g" role="list">
            {cal.mesi.map((m) => (
              <button key={m.chiave} role="listitem" className={'ca-cal-m' + (m.picco ? ' picco' : '') + (meseSel === m.chiave ? ' on' : '')}
                onClick={() => setMeseSel(meseSel === m.chiave ? null : m.chiave)}
                aria-label={`${nomeMese(m.chiave, true)}: ${eur(m.totale)}${m.stimato > 0 ? `, di cui ${eur(m.stimato)} stimati` : ''}`}>
                <span className="ca-cal-b">
                  <i className="st" style={{ height: (cal.max ? (m.stimato / cal.max) * 100 : 0) + '%' }} />
                  <i className="ce" style={{ height: (cal.max ? (m.certo / cal.max) * 100 : 0) + '%' }} />
                </span>
                <span className="ca-cal-l">{nomeMese(m.chiave)}</span>
              </button>
            ))}
          </div>
          <p className="ca-cal-leg"><span><i className="ce" /> rate e scadenze note</span><span><i className="st" /> bollette, in media</span></p>
          {sel && (
            <div className="ca-cal-det">
              <p className="ca-cal-dt">{nomeMese(sel.chiave, true)} · <span className="num">{eur(sel.totale)}</span></p>
              {sel.voci.length ? sel.voci.map((v, i) => (
                <p key={i} className="ca-cal-dr"><IconaCategoria cat={v.cat} size={24} /><span>{v.titolo}{v.tipo === 'certo' && v.data ? ' · ' + dataBreve(v.data) : ''}</span><b className="num">{eur(v.importo)}</b></p>
              )) : <p className="ca-muted">Niente in programma.</p>}
            </div>
          )}
        </div>
      </section>

      <div className="ca-cols">
        <div>
          <h2 className="ca-h2">Da fare {daFare.length > 0 && <span className="ca-count num">{daFare.length}</span>}</h2>
          {daFare.length ? <div className="ca-avs">{daFare.map((a) => <Avviso key={a.id} a={a} vai={vai} />)}</div>
            : <div className="ca-card ca-empty-s"><Icona nome="ok" size={20} /> Niente da fare per ora.</div>}

          <div className="ca-h2-row">
            <h2 className="ca-h2">Prossime scadenze</h2>
            {prossime.length > 0 && <button className="ca-link" onClick={() => scaricaCalendario(stato)}>Aggiungi al calendario</button>}
          </div>
          {prossime.length ? <div className="ca-card flush ca-list">{prossime.map((x) => <RigaScadenza key={x.id} s={x} onApri={() => vai('scadenze')} />)}</div>
            : <div className="ca-card ca-empty-s">Nessuna scadenza nei prossimi 45 giorni.</div>}
          {daSapere.length > 0 && <>
            <h2 className="ca-h2">Da sapere</h2>
            <div className="ca-avs">{daSapere.map((a) => <Avviso key={a.id} a={a} vai={vai} />)}</div>
          </>}
        </div>
        <div>
          <RiepilogoConti stato={stato} vai={vai} />
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
          {mancanti.length > 0 && <Completa mancanti={mancanti} vai={vai} />}
        </div>
      </div>
    </section>
  );
}

function Var({ v, testo, neutro }) {
  const r = Math.round(v);
  if (Math.abs(r) < 3) return <span className="ca-var">in linea {testo.replace(/^rispetto alla /, 'con la ').replace(/^sull'anno prima$/, "con l'anno prima")}</span>;
  return <span className={'ca-var ' + (neutro ? 'n' : r > 0 ? 'su' : 'giu')}>{r > 0 ? '▲' : '▼'} {Math.abs(r)}% {testo}</span>;
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
