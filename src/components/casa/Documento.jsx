import { useState } from 'react';
import { CATEGORIE, ORDINE, FREQUENZE, eur, num, dataBreve, mesiCoperti, parseNumero } from '../../casa/model.js';
import { Campo, Icona, IconaCategoria } from './ui.jsx';

const CATS_BOLLETTA = ORDINE.filter((c) => CATEGORIE[c].bolletta || c === 'altro');

/** Modulo di revisione/modifica di un documento (estratto o manuale). */
export function SchedaDocumento({ iniziale, onSalva, onScarta, etichettaSalva = 'Salva', compatta = false }) {
  const [d, setD] = useState(iniziale);
  const [dettagli, setDettagli] = useState(!compatta);
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
      <div className="ca-doc-hd">
        <IconaCategoria cat={d.categoria} size={44} />
        <div className="ca-doc-hd-t">
          <select className="ca-doc-cat" value={d.categoria} onChange={set('categoria')} aria-label="Categoria">
            {CATS_BOLLETTA.map((k) => <option key={k} value={k}>{CATEGORIE[k].label}</option>)}
          </select>
          <input className="ca-doc-forn" value={d.fornitore || ''} onChange={set('fornitore')} placeholder="Fornitore" aria-label="Fornitore" />
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

      <div className="ca-grid2">
        <Campo label="Periodo dal"><input type="date" value={d.periodo_dal || ''} onChange={set('periodo_dal')} /></Campo>
        <Campo label="al"><input type="date" value={d.periodo_al || ''} onChange={set('periodo_al')} /></Campo>
        <Campo label="Da pagare entro"><input type="date" value={d.scadenza_pagamento || ''} onChange={set('scadenza_pagamento')} /></Campo>
        {energia ? (
          <Campo label={`Consumo (${c.unita})`}><input inputMode="decimal" className="num" value={nv(d.consumo)} onChange={setNum('consumo')} /></Campo>
        ) : tlc ? (
          <Campo label="Canone mensile €"><input inputMode="decimal" className="num" value={nv(d.canone_mensile)} onChange={setNum('canone_mensile')} /></Campo>
        ) : <span />}
      </div>

      <label className="ca-check">
        <input type="checkbox" checked={!!d.domiciliazione} onChange={set('domiciliazione')} />
        <span>Addebito automatico su conto o carta</span>
      </label>

      {!dettagli ? (
        <button type="button" className="ca-link" onClick={() => setDettagli(true)}>Mostra tutti i dettagli</button>
      ) : (
        <div className="ca-grid2 ca-doc-more">
          <Campo label="Offerta"><input value={d.offerta || ''} onChange={set('offerta')} /></Campo>
          <Campo label={tlc ? 'Fine promozione' : 'Condizioni valide fino al'}><input type="date" value={d.fine_condizioni || ''} onChange={set('fine_condizioni')} /></Campo>
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
          <label className="ca-check"><input type="checkbox" checked={!!d.consumi_stimati} onChange={set('consumi_stimati')} /><span>Consumi stimati</span></label>
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
    setR((x) => ({ ...x, categoria: c, frequenza: x.id ? x.frequenza : FREQ_DEFAULT[c] || x.frequenza }));
  };
  const n = parseNumero;
  const valido = n(r.importo) > 0;
  const mutuo = r.categoria === 'mutuo';
  const affitto = r.categoria === 'affitto';
  const salva = (e) => {
    e.preventDefault();
    if (!valido) return;
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
        <Campo label={mutuo ? 'Rata €' : affitto ? 'Canone €' : 'Importo €'}><input inputMode="decimal" className="num" value={r.importo ?? ''} onChange={set('importo')} placeholder="0,00" /></Campo>
        <Campo label="Ogni">
          <select value={r.frequenza} onChange={set('frequenza')}>
            {Object.entries(FREQUENZE).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
          </select>
        </Campo>
        <Campo label="Prossima scadenza" hint="Ti avvisiamo prima"><input type="date" value={r.prossima_scadenza || ''} onChange={set('prossima_scadenza')} /></Campo>
        {mutuo || affitto
          ? <Campo label={mutuo ? 'Ultima rata' : 'Fine contratto'}><input type="date" value={r.data_fine || ''} onChange={set('data_fine')} /></Campo>
          : <span />}
      </div>
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
