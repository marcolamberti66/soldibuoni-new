import { useEffect, useMemo, useState } from 'react';
import { stimaCasa } from '../data/stima-casa.js';
import { TARI, FONTE_TARI } from '../data/tari-2025.js';
import { ISTAT } from '../data/energia.js';
import '../styles/casa-stima.css';

// ─────────────────────────────────────────────────────────────
// La casa della home: una sezione architettonica in cui ogni piano è
// una voce di spesa. I piani con un dato pubblico (luce, gas, TARI)
// prendono altezza e importo dalla stima per comune e famiglia; quelli
// senza un dato affidabile (internet, acqua, condominio) restano
// tratteggiati: la cifra la mette chi crea la sua casa.
// Le fondamenta sono mutuo o affitto medi ISTAT (nazionali).
// ─────────────────────────────────────────────────────────────

const eur = (n) => { const x = Math.round(n); try { return x.toLocaleString('it-IT'); } catch { return String(x); } };
const RISC = [
  { v: 'gas_autonomo', l: 'Caldaia a gas' },
  { v: 'centralizzato', l: 'Centralizzato' },
  { v: 'pompa_calore', l: 'Pompa di calore' },
];
const FOND = {
  mutuo: { label: 'Mutuo', sub: 'le fondamenta', eur: ISTAT.rataMutuoMedia, nota: `Rata media delle famiglie con mutuo in Italia (${ISTAT.fonte.split(' – ')[0]}, ${ISTAT.anno}).`,
    cosa: 'La voce più pesante e più lunga: decenni di rate, con interessi che si possono detrarre al 19% sulla prima casa.',
    noi: 'Ti mostro rate residue, quota interessi e capitale, e la detrazione che recuperi nel 730.',
    guida: '/guida/detrazione-interessi-mutuo', g: 'Detrazione degli interessi del mutuo' },
  affitto: { label: 'Affitto', sub: 'in prestito', eur: ISTAT.affittoMedio, nota: `Affitto medio delle famiglie in affitto in Italia (${ISTAT.fonte.split(' – ')[0]}, ${ISTAT.anno}).`,
    cosa: 'Canone fisso, con aggiornamento ISTAT se previsto dal contratto. Le scadenze del contratto contano quanto la rata.',
    noi: 'Ti avviso sei mesi prima della fine del contratto, quando c\'è ancora tempo per la disdetta o per trattare.',
    guida: '/guida/costi-casa', g: 'Quanto costa davvero una casa' },
  proprieta: { label: 'Casa tua', sub: 'già pagata', eur: 0, nota: 'Niente rata né canone: restano IMU (se non è prima casa), manutenzione e assicurazione.',
    cosa: 'Senza mutuo le fondamenta non costano, ma la casa sì: manutenzione ordinaria e straordinaria, assicurazione, IMU sulle seconde case.',
    noi: 'Metto in calendario le scadenze di IMU, assicurazione e manutenzioni ricorrenti.',
    guida: '/guida/imu', g: 'IMU: chi la paga e quando' },
};
const TESTI = {
  internet: { label: 'Internet', c: 'var(--c-internet)', cosa: 'Fibra o FWA e, spesso, il telefono di casa. Canone fisso, ma i prezzi promozionali scadono e poi salgono.', noi: 'Segno la fine della promozione e ti avviso prima che il canone aumenti.', guida: '/guida/internet-telefono', g: 'Internet e telefono di casa' },
  luce: { label: 'Luce', c: 'var(--c-luce)', cosa: 'Energia, trasporto, oneri e imposte. Solo la prima parte dipende davvero dal fornitore.', noi: 'Leggo la bolletta da PDF o foto, calcolo il costo pieno per kWh e ti avviso quando scade il prezzo bloccato.', guida: '/guida/bolletta-luce', g: 'Come leggere la bolletta della luce' },
  gas: { label: 'Gas', c: 'var(--c-gas)', cosa: 'Con il riscaldamento autonomo è la voce più stagionale: in inverno può valere tre volte l\'estate.', noi: 'Riconosco i consumi stimati e i conguagli, e d\'inverno ti ricordo l\'autolettura.', guida: '/guida/bolletta-gas', g: 'Come leggere la bolletta del gas' },
  acqua: { label: 'Acqua', c: 'var(--c-acqua)', cosa: 'Bollette rare, spesso divise dal condominio: facile perderle di vista.', noi: 'La divido in quote mensili, così vedi il costo vero della casa mese per mese.', guida: '/guida/costi-casa', g: 'Tutte le spese fisse di una casa' },
  condominio: { label: 'Condominio', c: 'var(--c-condominio)', cosa: 'Rate ordinarie decise dal preventivo, più conguagli e straordinarie. Cambia molto da palazzo a palazzo.', noi: 'Leggo il preventivo o la rateizzazione, metto ogni rata in calendario e ti avviso dei conguagli.', guida: '/guida/spese-condominiali', g: 'Spese condominiali: chi paga cosa' },
  tari: { label: 'TARI', c: 'var(--c-tari)', cosa: 'La tassa rifiuti del comune: una o più rate l\'anno, calcolata su metri quadri e occupanti.', noi: 'Metto le rate in calendario e la divido in quote mensili.', guida: '/guida/tari', g: 'TARI: chi la paga e come si calcola' },
};
const ORDINE = ['internet', 'luce', 'gas', 'acqua', 'condominio', 'tari']; // dall'alto verso il basso
const SUOLO = 440, ALTEZZA = 292, MIN_NOTO = 46, H_IGNOTO = 38;

export default function CasaStima() {
  const [q, setQ] = useState({ citta: '', persone: 3, riscaldamento: 'gas_autonomo', modo: 'mutuo' });
  const [attivo, setAttivo] = useState(null);
  const [sera, setSera] = useState(false);
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem('sb_stima')); if (s) setQ((x) => ({ ...x, ...s, modo: s.modo || (s.titolo === 'affitto' ? 'affitto' : s.titolo === 'proprieta' ? 'proprieta' : x.modo) })); } catch {}
    const h = new Date().getHours(); setSera(h >= 18 || h < 7);
  }, []);
  useEffect(() => {
    const titolo = q.modo === 'mutuo' ? 'proprieta_mutuo' : q.modo;
    try { localStorage.setItem('sb_stima', JSON.stringify({ ...q, titolo })); } catch {}
  }, [q]);

  const st = useMemo(() => stimaCasa(q), [q]);
  const fond = FOND[q.modo];

  // Voci: con importo (dalla stima) o tratteggiate (la cifra la mette l'utente).
  const voci = useMemo(() => {
    const da = Object.fromEntries(st.voci.map((v) => [v.cat, v]));
    return ORDINE.map((id) => {
      const v = da[id];
      if (v) return { id, ...TESTI[id], mese: v.anno / 12, nota: v.nota, fonte: v.fonte, url: v.url, noto: true };
      if (id === 'gas') {
        const nel = q.riscaldamento === 'centralizzato';
        return { id, ...TESTI.gas, label: nel ? 'Gas, nel condominio' : 'Niente gas', noto: false, vuoto: true,
          nota: nel ? 'Con il riscaldamento centralizzato il gas lo paghi nelle rate del condominio.' : 'Con la pompa di calore il riscaldamento pesa sulla luce.' };
      }
      return { id, ...TESTI[id], noto: false, nota: 'Non c\'è un dato pubblico affidabile per la tua città: la cifra la metti tu, o la leggo dal tuo documento, in La tua casa.' };
    });
  }, [st, q.riscaldamento]);

  // Geometria: i piani con importo si dividono lo spazio in proporzione.
  const geo = useMemo(() => {
    const noti = voci.filter((v) => v.noto);
    const somma = noti.reduce((t, v) => t + v.mese, 0) || 1;
    const spazio = ALTEZZA - voci.filter((v) => !v.noto).length * H_IGNOTO;
    let h = voci.map((v) => (v.noto ? Math.max(MIN_NOTO, (v.mese / somma) * spazio) : H_IGNOTO));
    const tot = h.reduce((t, x) => t + x, 0);
    if (tot > ALTEZZA) h = h.map((x) => (x * ALTEZZA) / tot);
    let y = SUOLO - ALTEZZA;
    return voci.map((v, i) => { const g = { ...v, y, h: h[i] }; y += h[i]; return g; });
  }, [voci]);

  const totale = st.mese + fond.eur;
  const top = SUOLO - ALTEZZA;
  const scelto = attivo === 'fondamenta' ? { ...fond, c: 'var(--brass)', mese: fond.eur, noto: true } : geo.find((v) => v.id === attivo);
  const scegli = (id) => setAttivo((a) => (a === id ? null : id));
  const tasti = (id) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scegli(id); }
    if (e.key === 'Escape') setAttivo(null);
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const ord = [...ORDINE, 'fondamenta'];
      const i = ord.indexOf(id);
      const n = ord[(i + (e.key === 'ArrowDown' ? 1 : -1) + ord.length) % ord.length];
      setAttivo(n);
      e.currentTarget.ownerSVGElement?.querySelector(`[data-voce="${n}"]`)?.focus();
    }
  };

  return (
    <div className="cs">
      <div className="cs-l">
        <p className="cs-kick"><span>N° 01</span> La tua casa, in un numero</p>
        <h1 className="display cs-t">Quanto costa<br />una casa <em>come la tua?</em></h1>
        <div className="cs-tot" aria-live="polite">
          <p className="cs-n"><span className="cs-eur">€</span>{eur(totale)}<small>al mese</small></p>
          <p className="cs-det">
            Luce, gas e TARI{st.citta ? ` a ${st.citta.citta}` : ''}: <b>{eur(st.mese)} €</b>
            {fond.eur > 0 && <> · {q.modo === 'mutuo' ? 'rata media del mutuo' : 'affitto medio'}: <b>{eur(fond.eur)} €</b></>}
          </p>
          <p className="cs-det2">Più internet, acqua e condominio, tratteggiati nella casa: quelli sono solo tuoi.</p>
        </div>
        <form className="cs-q" onSubmit={(e) => e.preventDefault()} aria-label="La tua casa">
          <label className="cs-f cs-f-c">
            <span>Comune</span>
            <input list="cs-comuni" value={q.citta} onChange={(e) => setQ({ ...q, citta: e.target.value })} placeholder="Scrivi la tua città" autoComplete="address-level2" maxLength={60} />
            <datalist id="cs-comuni">{TARI.map((t) => <option key={t.slug} value={t.citta} />)}</datalist>
          </label>
          <fieldset className="cs-f">
            <legend>Persone</legend>
            <div className="cs-seg">
              {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} aria-pressed={q.persone === n} className={q.persone === n ? 'on' : ''} onClick={() => setQ({ ...q, persone: n })}>{n === 5 ? '5+' : n}</button>)}
            </div>
          </fieldset>
          <fieldset className="cs-f">
            <legend>Riscaldamento</legend>
            <div className="cs-seg">
              {RISC.map((o) => <button type="button" key={o.v} aria-pressed={q.riscaldamento === o.v} className={q.riscaldamento === o.v ? 'on' : ''} onClick={() => setQ({ ...q, riscaldamento: o.v })}>{o.l}</button>)}
            </div>
          </fieldset>
        </form>
        <a href="/casa" className="btn btn-ink btn-lg cs-cta">Crea la tua casa, con le tue cifre <span aria-hidden="true">→</span></a>
      </div>

      <figure className={'tav' + (attivo ? ' scelto' : '') + (sera ? ' sera' : '')} data-modo={q.modo}>
        <div className="tav-top">
          <div className="tav-seg" role="radiogroup" aria-label="La casa è">
            {[['mutuo', 'Mutuo'], ['affitto', 'Affitto'], ['proprieta', 'Senza mutuo']].map(([m, l]) => (
              <button type="button" role="radio" key={m} aria-checked={q.modo === m} onClick={() => { setQ({ ...q, modo: m }); setAttivo('fondamenta'); }}>{l}</button>
            ))}
          </div>
          <p className="tav-hint" aria-hidden="true"><span className="tav-dot" /><span>Scegli un piano</span></p>
        </div>

        <svg viewBox="0 0 520 640" role="group" aria-labelledby="cs-svg-t">
          <title id="cs-svg-t">Sezione economica della casa: ogni piano è una voce di spesa. Seleziona un piano per la scheda.</title>
          <defs>
            <pattern id="cs-tratt" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--brass)" strokeWidth="1.2" />
            </pattern>
            <pattern id="cs-terreno" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="4" r="1" fill="var(--ink-3)" opacity=".5" /><circle cx="10" cy="10" r=".8" fill="var(--ink-3)" opacity=".45" />
            </pattern>
            <radialGradient id="cs-luce" cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#f3d38c" /><stop offset="1" stopColor="#d9a64a" /></radialGradient>
          </defs>

          <rect x="0" y={SUOLO} width="520" height="160" fill="url(#cs-terreno)" opacity=".55" />
          <line x1="0" y1={SUOLO} x2="520" y2={SUOLO} stroke="var(--ink)" strokeWidth="1.4" />

          {/* fondamenta */}
          <g className={'tav-p tav-f' + (attivo === 'fondamenta' ? ' on' : '')} style={{ '--i': 0 }} data-voce="fondamenta" tabIndex={0} role="button"
            aria-pressed={attivo === 'fondamenta'} aria-label={`${fond.label}: ${eur(fond.eur)} euro al mese`} onClick={() => scegli('fondamenta')} onKeyDown={tasti('fondamenta')}>
            <rect className="tav-hit" x="0" y={SUOLO} width="520" height="122" />
            <rect className="tav-f-hatch" x="30" y={SUOLO} width="236" height="120" fill={q.modo === 'proprieta' ? 'var(--paper-2)' : 'url(#cs-tratt)'} stroke="var(--ink)" strokeWidth="1.4" />
            <rect className="tav-f-fill" x="30" y={SUOLO} width="236" height="120" fill="var(--brass)" opacity=".06" />
            <line className="tav-lead" x1="266" y1="500" x2="296" y2="500" />
            <text className="tav-l" x="304" y="494">{fond.label}</text>
            <text className="tav-s" x="304" y="512">{fond.sub}</text>
            <text className="tav-v tav-v-big" x="510" y="508" textAnchor="end"><tspan className="tav-e">€</tspan> {eur(fond.eur)}</text>
          </g>

          {/* tetto e camino: salgono e scendono con la casa */}
          <g className="cs-tetto" style={{ transform: `translateY(${top - 150}px)` }}>
            <path className="tav-line" d="M18 152 L148 52 L278 152" fill="none" />
            <path className="tav-line" d="M30 150 L148 60 L266 150" fill="none" opacity=".35" />
            <rect className="tav-line" x="196" y="76" width="22" height="40" fill="var(--paper)" />
            <g className="tav-fumo" aria-hidden="true"><circle cx="207" cy="64" r="5" /><circle cx="214" cy="50" r="6.5" /><circle cx="208" cy="34" r="8" /></g>
          </g>

          {geo.map((p, i) => (
            <g key={p.id} className={'tav-p' + (p.noto ? '' : ' ignoto') + (attivo === p.id ? ' on' : '')} style={{ '--i': i + 1 }} data-voce={p.id} tabIndex={0} role="button"
              aria-pressed={attivo === p.id} aria-label={p.noto ? `${p.label}: ${eur(p.mese)} euro al mese` : `${p.label}: la cifra è tua`}
              onClick={() => scegli(p.id)} onKeyDown={tasti(p.id)}>
              <rect className="tav-hit" x="0" y={p.y} width="520" height={p.h} style={{ y: p.y, height: p.h }} />
              <rect className="tav-room" x="30" y={p.y} width="236" height={p.h} style={{ y: p.y, height: p.h }} stroke="var(--ink)" strokeWidth="1.4" strokeDasharray={p.noto ? undefined : '5 4'} />
              <rect className="tav-band" x="30" y={p.y} width="6" height={p.h} style={{ y: p.y, height: p.h }} fill={p.noto ? p.c : 'transparent'} />
              <g className="cs-fin" style={{ transform: `translateY(${p.y}px)` }}>
                {p.h > 52 ? <>
                  <rect className="tav-win" x="70" y="14" width="30" height={p.h - 28} style={{ height: p.h - 28 }} />
                  <rect className="tav-win" x="196" y="14" width="30" height={p.h - 28} style={{ height: p.h - 28 }} />
                </> : p.id === 'tari'
                  ? <><rect className="tav-win" x="70" y="11" width="30" height={Math.max(8, p.h - 22)} style={{ height: Math.max(8, p.h - 22) }} /><rect className="tav-door" x="133" y="10" width="30" height={p.h - 10} fill="none" stroke="var(--ink)" strokeWidth="1.2" /><rect className="tav-win" x="196" y="11" width="30" height={Math.max(8, p.h - 22)} style={{ height: Math.max(8, p.h - 22) }} /></>
                  : <rect className="tav-win" x="132" y="11" width="32" height={Math.max(8, p.h - 22)} style={{ height: Math.max(8, p.h - 22) }} />}
              </g>
              <g className="cs-lab" style={{ transform: `translateY(${p.y + p.h / 2}px)` }}>
                <line className="tav-lead" x1="266" y1="0" x2="296" y2="0" />
                <text className="tav-l" x="304" y="5">{p.label}</text>
                {p.noto
                  ? <text className="tav-v" x="510" y="6" textAnchor="end"><tspan className="tav-e">€</tspan> {eur(p.mese)}</text>
                  : <text className="tav-s cs-tua" x="510" y="5" textAnchor="end">{p.vuoto ? '—' : 'la tua cifra'}</text>}
              </g>
            </g>
          ))}

          <line x1="12" y1={top} x2="12" y2="560" stroke="var(--ink-3)" strokeWidth=".8" />
          <line x1="8" y1={top} x2="16" y2={top} stroke="var(--ink-3)" strokeWidth=".8" />
          <line x1="8" y1="560" x2="16" y2="560" stroke="var(--ink-3)" strokeWidth=".8" />

          <line x1="296" y1="590" x2="510" y2="590" stroke="var(--ink)" strokeWidth="1.4" />
          <text className="tav-l" x="304" y="620">Al mese</text>
          <text className="tav-v tav-v-big" x="510" y="624" textAnchor="end"><tspan className="tav-e">€</tspan> {eur(totale)}</text>
        </svg>

        <div className="tav-scheda" aria-live="polite">
          {!scelto ? (
            <div>
              <p className="tav-k"><span>Tav. 01</span> Sezione economica della tua casa</p>
              <p className="tav-vt">Ogni piano è una voce di spesa, alto quanto pesa. <strong>Toccane uno</strong> per vedere da dove viene il numero e cosa fa SoldiBuoni per tenerlo sotto controllo.</p>
            </div>
          ) : (
            <div className="tav-piena" key={attivo}>
              <div className="tav-sh">
                <p className="tav-k"><i className="tav-sw" style={{ background: scelto.c }} /><b>{scelto.label}</b></p>
                <button type="button" className="tav-x" onClick={() => setAttivo(null)} aria-label="Chiudi la scheda">
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" /></svg>
                </button>
              </div>
              {scelto.noto ? <>
                <p className="tav-num"><span className="num">€ {eur(scelto.mese)}</span><small>al mese · {totale ? Math.round((scelto.mese / totale) * 100) : 0}% del totale</small></p>
                <i className="tav-bar"><em style={{ width: (totale ? (scelto.mese / totale) * 100 : 0) + '%' }} /></i>
              </> : <p className="tav-num"><span className="num cs-tua-n">la tua cifra</span></p>}
              <p className="tav-nota">{scelto.nota}{scelto.fonte && <>{/[.!?]$/.test(scelto.nota || '') ? '' : '.'} Fonte: {scelto.url ? <a href={scelto.url} rel={scelto.url.startsWith('http') ? 'noopener' : undefined}>{scelto.fonte}</a> : scelto.fonte}.</>}</p>
              {attivo === 'tari' && st.citta && <p className="tav-nota">A {st.citta.citta} la TARI per 3 persone in 100 m² è {st.citta.t25} €, {st.citta.t25 > FONTE_TARI.media ? 'sopra' : st.citta.t25 < FONTE_TARI.media ? 'sotto' : 'in linea con'} la media dei capoluoghi ({FONTE_TARI.media} €).</p>}
              <p className="tav-cosa">{scelto.cosa}</p>
              <p className="tav-noi"><span>In SoldiBuoni</span><span>{scelto.noi}</span></p>
              {scelto.noto || scelto.vuoto
                ? <a className="tav-link" href={scelto.guida}>Guida: {scelto.g}</a>
                : <a className="tav-link" href="/casa">Metti la tua cifra in La tua casa →</a>}
            </div>
          )}
        </div>
        <figcaption>Luce e gas: prezzi ARERA di questo trimestre, consumi per numero di persone secondo nostre ipotesi. TARI: Cittadinanzattiva 2025. Mutuo e affitto: medie ISTAT nazionali.</figcaption>
      </figure>
    </div>
  );
}
