import { useEffect, useMemo, useState } from 'react';
import { stimaCasa } from '../data/stima-casa.js';
import { TARI, FONTE_TARI } from '../data/tari-2025.js';

const eur = (n) => Math.round(n).toLocaleString('it-IT');
const COLORI = { luce: 'var(--c-luce, #c9a227)', gas: 'var(--c-gas, #b5643c)', tari: 'var(--c-tari, #5d7a5a)' };
const RISC = [
  { v: 'gas_autonomo', l: 'Caldaia a gas' },
  { v: 'centralizzato', l: 'Centralizzato' },
  { v: 'pompa_calore', l: 'Pompa di calore' },
];

export default function HomeStima() {
  const [q, setQ] = useState({ citta: '', persone: 3, riscaldamento: 'gas_autonomo', titolo: null });
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem('sb_stima')); if (s) setQ((x) => ({ ...x, ...s })); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem('sb_stima', JSON.stringify(q)); } catch {} }, [q]);
  const r = useMemo(() => stimaCasa(q), [q]);
  const max = Math.max(...r.voci.map((v) => v.anno));

  return (
    <div className="hs">
      <form className="hs-q" onSubmit={(e) => e.preventDefault()} aria-label="Dati della casa">
        <label className="hs-f hs-f-c">
          <span>Comune</span>
          <input list="hs-comuni" value={q.citta} onChange={(e) => setQ({ ...q, citta: e.target.value })} placeholder="Scrivi la tua città" autoComplete="address-level2" maxLength={60} />
          <datalist id="hs-comuni">{TARI.map((t) => <option key={t.slug} value={t.citta} />)}</datalist>
        </label>
        <fieldset className="hs-f">
          <legend>Persone</legend>
          <div className="hs-seg">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} aria-pressed={q.persone === n} className={q.persone === n ? 'on' : ''} onClick={() => setQ({ ...q, persone: n })}>{n === 5 ? '5+' : n}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="hs-f hs-f-r">
          <legend>Riscaldamento</legend>
          <div className="hs-seg">
            {RISC.map((o) => (
              <button type="button" key={o.v} aria-pressed={q.riscaldamento === o.v} className={q.riscaldamento === o.v ? 'on' : ''} onClick={() => setQ({ ...q, riscaldamento: o.v })}>{o.l}</button>
            ))}
          </div>
        </fieldset>
      </form>

      <div className="hs-r" aria-live="polite">
        <p className="hs-k">Luce, gas e TARI{r.citta ? ` a ${r.citta.citta}` : ''}</p>
        <p className="hs-n"><span className="hs-eur">€</span>{eur(r.mese)}<small>al mese</small></p>
        <p className="hs-y">{eur(r.anno)} € l'anno per {r.persone === 5 ? '5 o più persone' : r.persone === 1 ? '1 persona' : r.persone + ' persone'}{q.riscaldamento === 'centralizzato' ? ', riscaldamento nel condominio' : ''}</p>
        <ul className="hs-v">
          {r.voci.map((v) => (
            <li key={v.cat}>
              <span className="hs-vl">{v.label}<small>{v.nota}</small></span>
              <span className="hs-vb" aria-hidden="true"><i style={{ width: (v.anno / max) * 100 + '%', background: COLORI[v.cat] }} /></span>
              <span className="hs-vv num">{eur(v.anno / 12)} €</span>
            </li>
          ))}
        </ul>
        {r.citta && (
          <p className="hs-cmp">La TARI di {r.citta.citta} è {r.citta.t25 > FONTE_TARI.media ? 'sopra' : r.citta.t25 < FONTE_TARI.media ? 'sotto' : 'in linea con'} la media dei capoluoghi ({FONTE_TARI.media} € per 3 persone in 100 m²). <a href={'/tari/' + r.citta.slug}>Il dettaglio</a></p>
        )}
        <a href="/casa" className="btn btn-ink btn-lg hs-cta">Con le tue bollette diventa la tua casa <span aria-hidden="true">→</span></a>
        <p className="hs-src">Stima con i prezzi ARERA di questo trimestre e la TARI 2025 di Cittadinanzattiva. Consumi per numero di persone e pompa di calore: nostre ipotesi. Mancano condominio, acqua, internet e rata: li aggiungi in La tua casa.</p>
      </div>
    </div>
  );
}
