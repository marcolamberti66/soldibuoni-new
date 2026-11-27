import { prossimaRicorrenza } from '../../casa/insights.js';
import { useMemo, useState } from 'react';
import { azioni } from '../../casa/store.js';
import {
  CATEGORIE, RIFERIMENTO_ARERA, FREQUENZE, costoMensile, consumoAnnuo, costoUnitarioPieno,
  mesiCoperti, dataDoc, eur, num, dataBreve, meseAnno, quotaInteressi, oggiISO, parseISO,
} from '../../casa/model.js';
import { Barre, Foglio, Icona, IconaCategoria } from './ui.jsx';
import { RigaDocumento, SchedaDocumento, SchedaRicorrente } from './Documento.jsx';
import { Testata } from './Aggiungi.jsx';

const GUIDE = { luce: '/guida/bolletta-luce', gas: '/guida/bolletta-gas', internet: '/guida/internet-telefono', mobile: '/guida/internet-telefono' };

export default function Voce({ cat, stato, vai }) {
  const c = CATEGORIE[cat] || CATEGORIE.altro;
  const [aperto, setAperto] = useState(null);
  const [ricAperta, setRicAperta] = useState(null);
  const docs = useMemo(() => stato.documenti.filter((d) => d.categoria === cat).sort((a, b) => (dataDoc(b) || '').localeCompare(dataDoc(a) || '')), [stato, cat]);
  const ric = stato.ricorrenti.filter((r) => r.categoria === cat);
  const costo = costoMensile(stato, cat);
  const consumo = consumoAnnuo(stato, cat);
  const rif = RIFERIMENTO_ARERA[cat];
  const ultimo = docs[0];
  const unitPieno = ultimo && costoUnitarioPieno(ultimo);

  const barre = docs.filter((d) => d.periodo_al).slice(0, 8).reverse().map((d, i, arr) => ({
    etichetta: meseAnno(d.periodo_al), valore: d.importo / mesiCoperti(d), evidenzia: i === arr.length - 1,
  }));

  const doc = aperto && stato.documenti.find((d) => d.id === aperto);

  return (
    <section className="ca-page">
      <Testata
        titolo={c.label}
        sotto={ultimo?.fornitore ? `${ultimo.fornitore}${ultimo.offerta ? ' · ' + ultimo.offerta : ''}` : null}
        onIndietro={() => vai('')}
        destra={<IconaCategoria cat={cat} size={48} />}
      />

      <div className="ca-kpis">
        <div className="ca-kpi"><span className="ca-kpi-l">Al mese</span><span className="ca-kpi-v num">{eur(costo?.mensile)}</span></div>
        <div className="ca-kpi"><span className="ca-kpi-l">All'anno</span><span className="ca-kpi-v num">{eur(costo ? costo.mensile * 12 : null)}</span></div>
        {c.unita && consumo && <div className="ca-kpi"><span className="ca-kpi-l">{consumo.affidabile ? 'Consumo annuo' : 'Ritmo annuo'}</span><span className="ca-kpi-v num">{consumo ? num(consumo.annuo) : '—'}<small> {c.unita}</small></span>{consumo && <span className="ca-kpi-s">{consumo.fonte}</span>}</div>}
        {unitPieno && <div className="ca-kpi"><span className="ca-kpi-l">Costo pieno per {c.unita}</span><span className="ca-kpi-v num">{num(unitPieno, 3)} €</span><span className="ca-kpi-s">tutto incluso, ultima bolletta</span></div>}
      </div>

      {cat === 'mutuo' && ric[0] && <PannelloMutuo r={ric[0]} onModifica={() => setRicAperta(ric[0])} />}
      {cat === 'affitto' && ric[0] && (
        <div className="ca-card">
          <h2 className="ca-h3">Il tuo contratto di affitto</h2>
          <dl className="ca-dl">
            <div><dt>Canone</dt><dd className="num">{eur(ric[0].importo, 2)}</dd></div>
            <div><dt>Fine contratto</dt><dd>{ric[0].data_fine ? dataBreve(ric[0].data_fine) : 'non indicata'}</dd></div>
          </dl>
          <a className="ca-link" href="/affitto-vs-mutuo">Ti conviene comprare? Simula affitto contro mutuo →</a>
        </div>
      )}

      {barre.length >= 2 && (
        <div className="ca-card">
          <h2 className="ca-h3">Costo mensile per bolletta</h2>
          <Barre dati={barre} formato={(v) => eur(v)} colore={c.colore} />
        </div>
      )}

      {rif && consumo?.affidabile && (
        <div className="ca-card">
          <h2 className="ca-h3">I tuoi consumi rispetto al riferimento</h2>
          <div className="ca-meter">
            <div className="ca-meter-track">
              <span className="ca-meter-fill" style={{ width: Math.min(100, (consumo.annuo / (rif.annuo * 2)) * 100) + '%', background: c.colore }} />
              <span className="ca-meter-ref" style={{ left: '50%' }}><i>{num(rif.annuo)} {rif.unita}</i></span>
            </div>
            <p className="ca-muted small">{rif.nota}. È un riferimento di regolazione, non una media per numero di persone: usalo come ordine di grandezza.</p>
          </div>
        </div>
      )}

      {ultimo && (cat === 'luce' || cat === 'gas' || cat === 'internet' || cat === 'mobile') && (
        <div className="ca-card">
          <h2 className="ca-h3">Il tuo contratto</h2>
          <dl className="ca-dl">
            <div><dt>Fornitore</dt><dd>{ultimo.fornitore || '—'}</dd></div>
            {ultimo.tipo_prezzo && <div><dt>Prezzo</dt><dd>{ultimo.tipo_prezzo}</dd></div>}
            {ultimo.prezzo_materia && <div><dt>Componente energia</dt><dd className="num">{num(ultimo.prezzo_materia, 4)} €/{c.unita}</dd></div>}
            {ultimo.quota_fissa_mese != null && <div><dt>Quota fissa</dt><dd className="num">{eur(ultimo.quota_fissa_mese, 2)}/mese</dd></div>}
            {ultimo.potenza_kw && <div><dt>Potenza impegnata</dt><dd className="num">{num(ultimo.potenza_kw, 1)} kW</dd></div>}
            {ultimo.canone_mensile && <div><dt>Canone</dt><dd className="num">{eur(ultimo.canone_mensile, 2)}/mese</dd></div>}
            <div><dt>{cat === 'internet' || cat === 'mobile' ? 'Fine promozione' : 'Condizioni valide fino al'}</dt><dd>{ultimo.fine_condizioni ? dataBreve(ultimo.fine_condizioni) : 'non indicato'}</dd></div>
            <div><dt>Pagamento</dt><dd>{ultimo.domiciliazione ? 'addebito automatico' : 'manuale'}</dd></div>
          </dl>
          {GUIDE[cat] && <a className="ca-link" href={GUIDE[cat]}>Come leggere questa bolletta →</a>}
        </div>
      )}

      {ric.length > 0 && (
        <>
          <h2 className="ca-h2">Spese fisse</h2>
          <div className="ca-card flush ca-list">
            {ric.map((r) => (
              <button className="ca-row" key={r.id} onClick={() => setRicAperta(r)}>
                <IconaCategoria cat={r.categoria} size={36} />
                <span className="ca-row-main"><span className="ca-row-t">{r.nome || c.label}</span><span className="ca-row-s">{FREQUENZE[r.frequenza]?.label}{prossimaRicorrenza(r) ? ' · prossima ' + dataBreve(prossimaRicorrenza(r)) : ''}</span></span>
                <span className="num ca-row-v">{eur(r.importo, 2)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {(c.bolletta || docs.length > 0) && (<>
      <div className="ca-h2-row">
        <h2 className="ca-h2">Documenti</h2>
        <button className="ca-link" onClick={() => vai('aggiungi?cat=' + cat)}>+ Aggiungi</button>
      </div>
      {docs.length ? (
        <div className="ca-card flush ca-list">{docs.map((d) => <RigaDocumento key={d.id} d={d} onApri={() => setAperto(d.id)} />)}</div>
      ) : (
        <div className="ca-card ca-empty-s">Nessuna bolletta {c.label.toLowerCase()} ancora.</div>
      )}

      </>)}

      <Foglio aperto={!!doc} onChiudi={() => setAperto(null)} titolo="Modifica documento">
        {doc && <>
          <SchedaDocumento key={doc.id} iniziale={doc} onSalva={(x) => { azioni.modificaDocumento(doc.id, x); setAperto(null); }} />
          <div className="ca-sheet-extra">
            <label className="ca-check"><input type="checkbox" checked={!!doc.pagato} onChange={(e) => azioni.modificaDocumento(doc.id, { pagato: e.target.checked })} /><span>Già pagata</span></label>
            <button className="ca-link danger" onClick={() => { if (confirm('Eliminare questo documento?')) { azioni.eliminaDocumento(doc.id); setAperto(null); } }}>Elimina documento</button>
          </div>
        </>}
      </Foglio>
      <Foglio aperto={!!ricAperta} onChiudi={() => setRicAperta(null)} titolo="Spesa fissa">
        {ricAperta && <SchedaRicorrente iniziale={ricAperta} onSalva={(r) => { azioni.salvaRicorrente(r); setRicAperta(null); }} onElimina={() => { azioni.eliminaRicorrente(ricAperta.id); setRicAperta(null); }} />}
      </Foglio>
    </section>
  );
}

function mesiTra(a, b) {
  const x = parseISO(a), y = parseISO(b);
  return (y.getFullYear() - x.getFullYear()) * 12 + (y.getMonth() - x.getMonth());
}

function PannelloMutuo({ r, onModifica }) {
  const interessi = quotaInteressi(r);
  const rateResidue = r.data_fine ? Math.max(0, mesiTra(oggiISO(), r.data_fine) + 1) : null;
  const rata = Number(r.importo) || 0;
  const mancano = !r.tasso || !r.debito_residuo || !r.data_fine;
  return (
    <div className="ca-card">
      <h2 className="ca-h3">Il tuo mutuo</h2>
      <dl className="ca-dl">
        <div><dt>Rata</dt><dd className="num">{eur(rata, 2)}</dd></div>
        <div><dt>Tasso</dt><dd>{r.tasso ? <span className="num">{num(r.tasso, 2)}%</span> : '—'}{r.tipo_tasso ? ' ' + r.tipo_tasso : ''}</dd></div>
        <div><dt>Debito residuo</dt><dd className="num">{r.debito_residuo ? eur(r.debito_residuo) : '—'}</dd></div>
        <div><dt>Rate residue</dt><dd>{rateResidue != null ? <><span className="num">{rateResidue}</span> · fino a {dataBreve(r.data_fine)}</> : '—'}</dd></div>
        {interessi != null && rata > 0 && (
          <div className="ca-dl-wide"><dt>Composizione della prossima rata (stima)</dt>
            <dd>
              <div className="ca-split-bar"><span style={{ flexGrow: interessi }} /><span style={{ flexGrow: Math.max(0, rata - interessi) }} /></div>
              <span className="num">{eur(interessi)}</span> di interessi · <span className="num">{eur(Math.max(0, rata - interessi))}</span> di capitale
            </dd>
          </div>
        )}
      </dl>
      {r.prima_casa && <p className="ca-muted small">Mutuo sull'abitazione principale: gli interessi passivi sono detraibili al 19% nel 730, fino a 4.000 € di interessi l'anno. Conserva la certificazione annuale della banca.</p>}
      <div className="ca-av-act">
        {mancano && <button className="ca-link" onClick={onModifica}>Completa tasso, residuo e scadenza</button>}
        <a className="ca-link muted" href="/mutuo">Simulatore mutuo</a>
      </div>
    </div>
  );
}
