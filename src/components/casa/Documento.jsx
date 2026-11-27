import { useState } from 'react';
import { CATEGORIE, ORDINE, FREQUENZE, eur, num, dataBreve, mesiCoperti, parseNumero } from '../../casa/model.js';
import { Campo, Icona, IconaCategoria } from './ui.jsx';

const CATS_BOLLETTA = ORDINE.filter((c) => CATEGORIE[c].bolletta || c === 'altro');

/** Modulo di revisione/modifica di un documento (estratto o manuale). */
export function SchedaDocumento({ iniziale, onSalva, onScarta, etichettaSalva = 'Salva', compatta = false }) {
  const [d, setD] = useState(iniziale);
  // I dettagli servono solo al controllo della bolletta: chiusi di default, aperti se c'è già qualcosa da rivedere.
  const CAMPI_EXTRA = ['consumo', 'canone_mensile', 'offerta', 'fine_condizioni', 'prezzo_materia', 'tipo_prezzo', 'quota_fissa_mese', 'potenza_kw', 'consumi_stimati', 'conguaglio'];
  const compilati = CAMPI_EXTRA.filter((k) => iniziale[k] != null && iniziale[k] !== '' && iniziale[k] !== false).length;
  const [dettagli, setDettagli] = useState(false);
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setD((x) => ({ ...x, [k]: v === '' ? null : v }));
  };
  // I campi numerici tengono il testo digitato (virgola italiana) e diventano numeri al salvataggio.
  const setNum = (k) => (e) => {
    const v = e.target.value.replace(/[^\d.,]/g, '');
    setD((x) => ({ ...x, [k]: v === '' ? null : v }));
  };
  const nv = (v) => (v == null ? '' : typeof v === 'number' ? String(v).replace('.', ',') : v);
  const aNum = parseNumero;
  const c = CATEGORIE[d.categoria] || CATEGORIE.altro;
  const energia = d.categoria === 'luce' || d.categoria === 'gas' || d.categoria === 'acqua';
  const tlc = d.categoria === 'internet' || d.categoria === 'mobile';
  const NUMERICI = ['importo', 'consumo', 'canone_mensile', 'prezzo_materia', 'quota_fissa_mese', 'potenza_kw'];
  const valido = aNum(d.importo) > 0 && d.categoria;

  const salva = (e) => {
    e.preventDefault();
    if (!valido) return;
    const out = { ...d };
    for (const k of NUMERICI) out[k] = aNum(out[k]);
    if (energia && !out.unita) out.unita = c.unita;
    onSalva(out);
  };

  return (
    <form className="ca-doc" onSubmit={salva}>
      <div className="ca-doc-tipi" role="radiogroup" aria-label="Tipo di bolletta">
        {CATS_BOLLETTA.map((k) => (
          <button
            key={k} type="button" role="radio" aria-checked={d.categoria === k}
            className={'ca-doc-tipo' + (d.categoria === k ? ' on' : '')}
            onClick={() => setD((x) => ({ ...x, categoria: k }))}
          >
            <Icona nome={CATEGORIE[k].icona} size={16} />
            <span>{k === 'mobile' ? 'Cellulare' : CATEGORIE[k].label}</span>
          </button>
        ))}
      </div>

      <div className="ca-doc-hd">
        <IconaCategoria cat={d.categoria} size={44} />
        <div className="ca-doc-hd-t">
          <input className="ca-doc-forn" value={d.fornitore || ''} onChange={set('fornitore')} placeholder="Fornitore (facoltativo)" aria-label="Fornitore" />
        </div>
        {d.fonte === 'ai' && d.affidabilita && (
          <span className={'ca-pill ' + (d.affidabilita === 'alta' ? 'ok' : d.affidabilita === 'bassa' ? 'warn' : '')}>
            Lettura {d.affidabilita}
          </span>
        )}
      </div>

      <div className="ca-doc-importo">
        <span className="ca-doc-eur">€</span>
        <input
          className="num" inputMode="decimal" aria-label="Importo totale"
          value={nv(d.importo)} onChange={setNum('importo')} placeholder="0,00"
        />
      </div>

      <Campo label="Da pagare entro" hint="Ti avvisiamo qualche giorno prima">
        <input type="date" value={d.scadenza_pagamento || ''} onChange={set('scadenza_pagamento')} />
      </Campo>
      <div className="ca-grid2">
        <Campo label="Periodo dal"><input type="date" value={d.periodo_dal || ''} onChange={set('periodo_dal')} /></Campo>
        <Campo label="al"><input type="date" value={d.periodo_al || ''} onChange={set('periodo_al')} /></Campo>
      </div>

      <label className="ca-check">
        <input type="checkbox" checked={!!d.domiciliazione} onChange={set('domiciliazione')} />
        <span>Si paga da sola (addebito su conto o carta)</span>
      </label>

      {!dettagli ? (
        <button type="button" className="ca-doc-extra" onClick={() => setDettagli(true)} aria-expanded="false">
          <span className="ca-doc-extra-t">
            {energia ? 'Consumi e prezzi' : 'Offerta e scadenze'}
            {compilati > 0 && <span className="ca-doc-extra-n">{compilati} {compilati === 1 ? 'dato letto' : 'dati letti'}</span>}
          </span>
          <span className="ca-doc-extra-d">
            Facoltativo. {energia ? 'Serve a controllare se paghi il giusto e ad avvisarti quando scade il prezzo.' : 'Serve ad avvisarti quando finisce la promozione.'}
          </span>
          <Icona nome="piu" size={18} />
        </button>
      ) : (
        <div className="ca-grid2 ca-doc-more">
          {energia ? (
            <Campo label={`Consumo (${c.unita})`}><input inputMode="decimal" className="num" value={nv(d.consumo)} onChange={setNum('consumo')} /></Campo>
          ) : tlc ? (
            <Campo label="Canone mensile €"><input inputMode="decimal" className="num" value={nv(d.canone_mensile)} onChange={setNum('canone_mensile')} /></Campo>
          ) : null}
          <Campo label={tlc ? 'Fine promozione' : 'Condizioni valide fino al'}><input type="date" value={d.fine_condizioni || ''} onChange={set('fine_condizioni')} /></Campo>
          <Campo label="Nome dell'offerta"><input value={d.offerta || ''} onChange={set('offerta')} /></Campo>
          {energia && d.categoria !== 'acqua' && <>
            <Campo label={`Prezzo energia €/${c.unita}`} hint="Solo la materia prima, IVA esclusa"><input inputMode="decimal" className="num" value={nv(d.prezzo_materia)} onChange={setNum('prezzo_materia')} /></Campo>
            <Campo label="Tipo di prezzo">
              <select value={d.tipo_prezzo || ''} onChange={set('tipo_prezzo')}>
                <option value="">Non so</option><option value="fisso">Fisso</option><option value="variabile">Variabile</option><option value="tutela">Tutela / vulnerabili</option>
              </select>
            </Campo>
            <Campo label="Quota fissa €/mese"><input inputMode="decimal" className="num" value={nv(d.quota_fissa_mese)} onChange={setNum('quota_fissa_mese')} /></Campo>
            {d.categoria === 'luce' && <Campo label="Potenza impegnata kW"><input inputMode="decimal" className="num" value={nv(d.potenza_kw)} onChange={setNum('potenza_kw')} /></Campo>}
          </>}
          {energia && <label className="ca-check"><input type="checkbox" checked={!!d.consumi_stimati} onChange={set('consumi_stimati')} /><span>Consumi stimati</span></label>}
          <label className="ca-check"><input type="checkbox" checked={!!d.conguaglio} onChange={set('conguaglio')} /><span>Contiene un conguaglio</span></label>
        </div>
      )}

      <div className="ca-doc-ft">
        {onScarta && <button type="button" className="btn btn-line" onClick={onScarta}>Scarta</button>}
        <button type="submit" className="btn btn-ink" disabled={!valido}>{etichettaSalva}</button>
      </div>
    </form>
  );
}

/** Riga compatta di un documento in archivio. */
export function RigaDocumento({ d, onApri }) {
  const c = CATEGORIE[d.categoria] || CATEGORIE.altro;
  const mesi = mesiCoperti(d);
  return (
    <button className="ca-row" onClick={onApri}>
      <IconaCategoria cat={d.categoria} size={36} />
      <span className="ca-row-main">
        <span className="ca-row-t">{d.fornitore || c.label}</span>
        <span className="ca-row-s">
          {d.periodo_dal && d.periodo_al ? `${dataBreve(d.periodo_dal)} – ${dataBreve(d.periodo_al)}` : d.scadenza_pagamento ? 'Scadenza ' + dataBreve(d.scadenza_pagamento) : 'Senza date'}
          {d.consumo ? ` · ${num(d.consumo)} ${d.unita || c.unita || ''}` : ''}
        </span>
      </span>
      <span className="ca-row-r">
        <span className="num ca-row-v">{eur(d.importo, 2)}</span>
        {d.periodo_dal && d.periodo_al && mesi >= 1.5 && <span className="ca-row-s num">{eur(d.importo / mesi)}/mese</span>}
      </span>
    </button>
  );
}

const PLACEHOLDER = {
  mutuo: 'Mutuo prima casa', affitto: 'Canone di locazione', condominio: 'Spese condominiali', tari: 'TARI',
  imu: 'IMU', assicurazione: 'Polizza casa', manutenzione: 'Revisione caldaia',
};
const FREQ_DEFAULT = { mutuo: 'mensile', affitto: 'mensile', condominio: 'trimestrale', tari: 'annuale', imu: 'semestrale', assicurazione: 'annuale', manutenzione: 'annuale' };

/** Spesa ricorrente senza bolletta: mutuo, affitto, condominio, TARI, ... */
export function SchedaRicorrente({ iniziale, onSalva, onElimina }) {
  const cat0 = iniziale?.categoria || 'condominio';
  const [r, setR] = useState({ categoria: cat0, frequenza: FREQ_DEFAULT[cat0] || 'mensile', ...iniziale });
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setR((x) => ({ ...x, [k]: v === '' ? null : v }));
  };
  const setCat = (e) => {
    const c = e.target.value;
    setR((x) => ({ ...x, categoria: c, frequenza: x.id || x.frequenza === 'una_tantum' ? x.frequenza : FREQ_DEFAULT[c] || x.frequenza }));
  };
  const n = parseNumero;
  const mutuo = r.categoria === 'mutuo';
  const affitto = r.categoria === 'affitto';
  // Rate di importo diverso (es. condominio: 20% / 30% / 30% / 20%): ogni rata
  // diventa una spesa annuale con la sua data, così scadenze e costo medio tornano.
  const puoRate = !iniziale?.id && !mutuo && !affitto;
  const [aRate, setARate] = useState(false);
  const [rate, setRate] = useState(() => Array.from({ length: 4 }, () => ({ data: '', importo: '' })));
  const rateOk = rate.filter((x) => x.data && n(x.importo) > 0);
  const totRate = rateOk.reduce((t, x) => t + n(x.importo), 0);
  const valido = aRate ? rateOk.length > 0 : n(r.importo) > 0;
  const setRata = (i, k) => (e) => { const v = e.target.value; setRate((l) => l.map((x, j) => (j === i ? { ...x, [k]: v } : x))); };
  const salva = (e) => {
    e.preventDefault();
    if (!valido) return;
    if (aRate) {
      const base = r.nome || CATEGORIE[r.categoria]?.label;
      const ord = rateOk; // l'ordine in cui le inserisci è quello del preventivo
      ord.forEach((x, i) => onSalva({ categoria: r.categoria, nome: `Rata ${i + 1} di ${ord.length} · ${base}`, importo: n(x.importo), frequenza: 'annuale', prossima_scadenza: x.data, domiciliazione: !!r.domiciliazione }));
      return;
    }
    onSalva({ ...r, importo: n(r.importo), tasso: n(r.tasso), debito_residuo: n(r.debito_residuo) });
  };
  return (
    <form className="ca-doc" onSubmit={salva}>
      <div className="ca-grid2">
        <Campo label="Voce">
          <select value={r.categoria} onChange={setCat}>
            {ORDINE.filter((k) => !CATEGORIE[k].bolletta).map((k) => <option key={k} value={k}>{CATEGORIE[k].label}</option>)}
          </select>
        </Campo>
        <Campo label={mutuo ? 'Banca (facoltativo)' : 'Nome (facoltativo)'}><input value={r.nome || ''} onChange={set('nome')} placeholder={PLACEHOLDER[r.categoria] || ''} /></Campo>
        {!aRate && <>
          <Campo label={mutuo ? 'Rata €' : affitto ? 'Canone €' : 'Importo €'}><input inputMode="decimal" className="num" value={r.importo ?? ''} onChange={set('importo')} placeholder="0,00" /></Campo>
          <Campo label="Ogni">
            <select value={r.frequenza} onChange={set('frequenza')}>
              {Object.entries(FREQUENZE).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
            </select>
          </Campo>
          <Campo label={r.frequenza === 'una_tantum' ? 'Data' : 'Prossima scadenza'} hint="Ti avvisiamo prima"><input type="date" value={r.prossima_scadenza || ''} onChange={set('prossima_scadenza')} /></Campo>
          {mutuo || affitto
            ? <Campo label={mutuo ? 'Ultima rata' : 'Fine contratto'}><input type="date" value={r.data_fine || ''} onChange={set('data_fine')} /></Campo>
            : <span />}
        </>}
      </div>
      {puoRate && (
        <label className="ca-check"><input type="checkbox" checked={aRate} onChange={(e) => setARate(e.target.checked)} />
          <span>Rate di importo diverso<br /><small className="ca-muted">Per esempio il condominio: ogni rata con la sua data e il suo importo.</small></span></label>
      )}
      {aRate && (
        <div className="ca-rate">
          {rate.map((x, i) => (
            <div className="ca-rate-r" key={i}>
              <span className="ca-rate-n">{i + 1}</span>
              <input type="date" aria-label={`Data rata ${i + 1}`} value={x.data} onChange={setRata(i, 'data')} />
              <input inputMode="decimal" className="num" aria-label={`Importo rata ${i + 1}`} placeholder="0,00" value={x.importo} onChange={setRata(i, 'importo')} />
            </div>
          ))}
          <div className="ca-rate-ft">
            {rate.length < 12 && <button type="button" className="ca-link" onClick={() => setRate((l) => [...l, { data: '', importo: '' }])}>+ Aggiungi una rata</button>}
            {totRate > 0 && <span className="ca-muted small">Totale <strong className="num">{eur(totRate, 2)}</strong> l'anno · {eur(totRate / 12, 0)} al mese</span>}
          </div>
          <p className="ca-muted small">Le rate si ripetono ogni anno alle stesse date. Quando arriva il nuovo preventivo, aggiorna gli importi.</p>
        </div>
      )}
      {mutuo && (
        <div className="ca-grid2 ca-doc-more">
          <Campo label="Tasso (TAN %)"><input inputMode="decimal" className="num" value={r.tasso ?? ''} onChange={set('tasso')} placeholder="3,10" /></Campo>
          <Campo label="Tipo di tasso">
            <select value={r.tipo_tasso || ''} onChange={set('tipo_tasso')}>
              <option value="">Non so</option><option value="fisso">Fisso</option><option value="variabile">Variabile</option><option value="misto">Misto / con cap</option>
            </select>
          </Campo>
          <Campo label="Debito residuo €" hint="Dal piano di ammortamento o dall'app della banca"><input inputMode="decimal" className="num" value={r.debito_residuo ?? ''} onChange={set('debito_residuo')} /></Campo>
          <label className="ca-check" style={{ alignSelf: 'end', paddingBottom: 12 }}><input type="checkbox" checked={!!r.prima_casa} onChange={set('prima_casa')} /><span>Abitazione principale</span></label>
        </div>
      )}
      <label className="ca-check"><input type="checkbox" checked={!!r.domiciliazione} onChange={set('domiciliazione')} /><span>Addebito automatico</span></label>
      <div className="ca-doc-ft">
        {onElimina && <button type="button" className="btn btn-line" onClick={onElimina}><Icona nome="cestino" size={18} /> Elimina</button>}
        <button type="submit" className="btn btn-ink" disabled={!valido}>Salva</button>
      </div>
    </form>
  );
}
