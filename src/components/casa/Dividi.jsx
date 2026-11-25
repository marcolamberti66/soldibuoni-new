import { useEffect, useMemo, useState } from 'react';
import { azioni } from '../../casa/store.js';
import { useAccount, personeCasa } from '../../casa/sync.js';
import { conta } from '../../casa/dispositivo.js';
import { CATEGORIE, eur, dataBreve, oggiISO, parseNumero } from '../../casa/model.js';
import { ripartisci, scarto, saldi as calcolaSaldi, pareggio, idIo, impostaIo, daDividere, euro } from '../../casa/conti.js';
import { Foglio, Icona, IconaCategoria } from './ui.jsx';
import { Testata } from './Aggiungi.jsx';

// Voci tipiche di una casa divisa, oltre a quelle delle bollette.
const VOCI = [
  { v: 'spesa', l: 'Spesa e pulizie' }, { v: 'affitto', l: 'Affitto' }, { v: 'luce', l: 'Luce' }, { v: 'gas', l: 'Gas' },
  { v: 'internet', l: 'Internet' }, { v: 'condominio', l: 'Condominio' }, { v: 'acqua', l: 'Acqua' }, { v: 'tari', l: 'TARI' },
  { v: 'manutenzione', l: 'Casa e riparazioni' }, { v: 'altro', l: 'Altro' },
];
const etichetta = (cat) => VOCI.find((x) => x.v === cat)?.l || CATEGORIE[cat]?.label || 'Spesa';
const COLORI = ['var(--ink)', 'var(--brass)', 'var(--ok)', 'var(--c-internet)', 'var(--warn)', 'var(--c-condominio)', 'var(--c-acqua)', 'var(--c-mobile)'];

// Il simbolo € nel carattere dell'interfaccia: quello del Bodoni è troppo decorativo.
const Soldi = ({ v }) => <><span className="dv-e">€</span>{eur(v, 2).replace(/^€\s*/, '')}</>;

function Avatar({ p, i, size = 34 }) {
  return <span className="dv-av" style={{ background: COLORI[i % COLORI.length], width: size, height: size, fontSize: size * 0.48 }} aria-hidden="true">{(p?.nome || '?').slice(0, 1).toUpperCase()}</span>;
}

// ── prima configurazione: chi divide le spese ───────────────
function Persone({ stato, onFatto }) {
  const acc = useAccount();
  const n = Math.min(6, Math.max(2, Number(stato.casa?.persone) || 2));
  const [nomi, setNomi] = useState(() => Array.from({ length: n }, () => ''));
  useEffect(() => {
    if (!acc.utente) return;
    personeCasa().then((ps) => {
      const altri = ps.filter((p) => p.user_id !== acc.utente.id).map((p) => (p.email || '').split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      if (altri.length) setNomi((v) => v.map((x, i) => x || (i > 0 ? altri[i - 1] || '' : '')));
    }).catch(() => {});
  }, [acc.utente?.id]);
  const validi = nomi.map((x) => x.trim()).filter(Boolean);

  function salva() {
    const io = { id: crypto.randomUUID(), nome: nomi[0].trim() || 'Io', account_id: acc.utente?.id || null };
    azioni.salvaConvivente(io);
    impostaIo(io.id);
    nomi.slice(1).map((x) => x.trim()).filter(Boolean).forEach((nome) => azioni.salvaConvivente({ id: crypto.randomUUID(), nome }));
    conta('dividi_attivato', String(validi.length));
    onFatto?.();
  }

  return (
    <div className="ca-card dv-setup">
      <p className="ca-acc-k">Per cominciare</p>
      <h3 className="ca-acc-t">Con chi dividi le spese?</h3>
      <p className="ca-muted">Bastano i nomi. Non serve che abbiano un account: i conti li tieni tu, e se condividi la casa li vedete tutti.</p>
      <div className="dv-nomi">
        {nomi.map((v, i) => (
          <label key={i} className="dv-nome">
            <span className="dv-av" style={{ background: COLORI[i % COLORI.length] }} aria-hidden="true">{(v || (i === 0 ? 'T' : String(i + 1))).slice(0, 1).toUpperCase()}</span>
            <input value={v} maxLength={40} placeholder={i === 0 ? 'Il tuo nome' : `Persona ${i + 1}`} aria-label={i === 0 ? 'Il tuo nome' : `Nome persona ${i + 1}`}
              onChange={(e) => setNomi(nomi.map((x, k) => (k === i ? e.target.value : x)))} />
            {i > 1 && <button className="ca-icon-btn" aria-label="Togli" onClick={() => setNomi(nomi.filter((_, k) => k !== i))}><Icona nome="chiudi" size={15} /></button>}
          </label>
        ))}
      </div>
      {nomi.length < 8 && <button className="ca-link" onClick={() => setNomi([...nomi, ''])}>+ Aggiungi una persona</button>}
      <div className="ca-data-act">
        <button className="btn btn-ink" disabled={validi.length < 2 || !nomi[0].trim()} onClick={salva}>Iniziamo</button>
      </div>
    </div>
  );
}

// ── scheda di una spesa ──────────────────────────────────────
function SchedaSpesa({ aperta, iniziale, persone, io, onChiudi }) {
  const [descr, setDescr] = useState('');
  const [importo, setImporto] = useState('');
  const [data, setData] = useState(oggiISO());
  const [pagatoDa, setPagatoDa] = useState(io);
  const [categoria, setCategoria] = useState('spesa');
  const [modo, setModo] = useState('uguali');
  const [chi, setChi] = useState(persone.map((p) => p.id));
  const [valori, setValori] = useState({});

  useEffect(() => {
    if (!aperta) return;
    const m = iniziale || {};
    setDescr(m.descrizione || ''); setImporto(m.importo != null ? String(m.importo).replace('.', ',') : '');
    setData(m.data || oggiISO()); setPagatoDa(m.pagato_da || io); setCategoria(m.categoria || 'spesa');
    setModo(m.modo || 'uguali');
    const ids = m.quote ? Object.keys(m.quote) : persone.map((p) => p.id);
    setChi(ids);
    setValori(m.modo === 'importi' && m.quote ? Object.fromEntries(Object.entries(m.quote).map(([k, v]) => [k, String(v).replace('.', ',')])) : m.valori || {});
  }, [aperta]);

  const tot = parseNumero(importo) || 0;
  const valNum = Object.fromEntries(chi.map((id) => [id, modo === 'importi' ? parseNumero(valori[id]) || 0 : Number(String(valori[id] ?? (modo === 'quote' ? 1 : '')).replace(',', '.')) || 0]));
  const quote = ripartisci(tot, modo, chi, modo === 'quote' ? Object.fromEntries(chi.map((id) => [id, valori[id] == null ? 1 : valNum[id]])) : valNum);
  const resto = modo === 'importi' ? scarto(tot, quote) : 0;
  const ok = tot > 0 && chi.length > 0 && pagatoDa && Math.abs(resto) < 0.005 && Object.keys(quote).length > 0;

  function salva() {
    azioni.salvaMovimento({
      ...(iniziale?.id ? { id: iniziale.id } : {}),
      tipo: 'spesa', descrizione: descr.trim() || etichetta(categoria), importo: euro(Math.round(tot * 100)), data,
      pagato_da: pagatoDa, quote, modo, categoria,
      documento_id: iniziale?.documento_id || null, ricorrente_id: iniziale?.ricorrente_id || null,
    });
    if (!iniziale?.id) conta('spesa_divisa', modo);
    onChiudi();
  }

  const togglePersona = (id) => setChi(chi.includes(id) ? chi.filter((x) => x !== id) : [...chi, id]);

  return (
    <Foglio aperto={aperta} onChiudi={onChiudi} titolo={iniziale?.id ? 'Modifica spesa' : 'Nuova spesa divisa'}
      piede={<div className="dv-piede">
        {iniziale?.id && <button className="btn btn-line danger" onClick={() => { if (confirm('Eliminare questa spesa?')) { azioni.eliminaMovimento(iniziale.id); onChiudi(); } }}>Elimina</button>}
        <button className="btn btn-ink" disabled={!ok} onClick={salva}>Salva</button>
      </div>}>
      <div className="dv-form">
        <label className="dv-importo">
          <span>€</span>
          <input inputMode="decimal" placeholder="0,00" value={importo} onChange={(e) => setImporto(e.target.value)} aria-label="Importo" autoFocus={!iniziale} />
        </label>
        <input className="dv-descr" placeholder="Descrizione (facoltativa)" value={descr} maxLength={80} onChange={(e) => setDescr(e.target.value)} aria-label="Descrizione" />
        <div className="dv-riga">
          <label className="dv-campo"><span>Voce</span>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>{VOCI.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}</select>
          </label>
          <label className="dv-campo"><span>Data</span><input type="date" value={data} onChange={(e) => setData(e.target.value)} /></label>
        </div>

        <p className="dv-k">Ha pagato</p>
        <div className="dv-chips" role="radiogroup" aria-label="Ha pagato">
          {persone.map((p, i) => (
            <button key={p.id} role="radio" aria-checked={pagatoDa === p.id} className={'dv-chip' + (pagatoDa === p.id ? ' on' : '')} onClick={() => setPagatoDa(p.id)}>
              <Avatar p={p} i={i} size={22} />{p.id === io ? 'Tu' : p.nome}
            </button>
          ))}
        </div>

        <p className="dv-k">Come si divide</p>
        <div className="dv-chips" role="radiogroup" aria-label="Come si divide">
          {[['uguali', 'In parti uguali'], ['importi', 'Importi esatti'], ['quote', 'A quote']].map(([v, l]) => (
            <button key={v} role="radio" aria-checked={modo === v} className={'dv-chip dv-chip-t' + (modo === v ? ' on' : '')} onClick={() => { setModo(v); setValori({}); }}>{l}</button>
          ))}
        </div>
        {modo === 'quote' && <p className="ca-muted small dv-aiuto">Per esempio 2 a chi ha la camera doppia e 1 agli altri.</p>}

        <ul className="dv-parti">
          {persone.map((p, i) => {
            const dentro = chi.includes(p.id);
            return (
              <li key={p.id} className={dentro ? '' : 'fuori'}>
                <button className="dv-parti-p" onClick={() => togglePersona(p.id)} aria-pressed={dentro}>
                  <span className={'dv-check' + (dentro ? ' on' : '')} aria-hidden="true">{dentro && <Icona nome="ok" size={13} />}</span>
                  <Avatar p={p} i={i} size={26} /><span>{p.id === io ? 'Tu' : p.nome}</span>
                </button>
                {dentro && modo !== 'uguali' && (
                  <input className="dv-val" inputMode="decimal" aria-label={`${modo === 'quote' ? 'Quota' : 'Importo'} di ${p.nome}`}
                    placeholder={modo === 'quote' ? '1' : '0,00'} value={valori[p.id] ?? ''} onChange={(e) => setValori({ ...valori, [p.id]: e.target.value })} />
                )}
                <span className="num dv-parte">{dentro && quote[p.id] != null ? eur(quote[p.id], 2) : '—'}</span>
              </li>
            );
          })}
        </ul>
        {modo === 'importi' && tot > 0 && Math.abs(resto) >= 0.005 && (
          <p className="dv-resto" role="status">{resto > 0 ? `Mancano ${eur(resto, 2)} da assegnare` : `Hai assegnato ${eur(-resto, 2)} in più`}</p>
        )}
      </div>
    </Foglio>
  );
}

// ── sezione principale ───────────────────────────────────────
export default function Dividi({ stato, vai }) {
  const acc = useAccount();
  const [scheda, setScheda] = useState(null); // null | {} | movimento
  const [gestisci, setGestisci] = useState(false);
  const [msg, setMsg] = useState(null);
  const attivi = stato.conviventi.filter((c) => c.attivo !== false);
  const tutti = stato.conviventi;
  const io = idIo(tutti, acc.utente?.id);
  const indice = (id) => tutti.findIndex((c) => c.id === id);
  const nome = (id) => (id === io ? 'Tu' : tutti.find((c) => c.id === id)?.nome || '—');

  // Se ho un account e nessuna persona è legata a me, chiedo chi sono (casa condivisa).
  const senzaMe = acc.utente && tutti.length >= 2 && !tutti.some((c) => c.account_id === acc.utente.id);

  const saldiC = useMemo(() => calcolaSaldi(stato.movimenti, tutti), [stato.movimenti, tutti]);
  const passaggi = useMemo(() => pareggio(saldiC), [saldiC]);
  const proposte = useMemo(() => daDividere(stato).slice(0, 4), [stato]);
  const storico = useMemo(() => [...stato.movimenti].sort((a, b) => (b.data || '').localeCompare(a.data || '') || (b.creato_il || '').localeCompare(a.creato_il || '')), [stato.movimenti]);
  const mio = saldiC[io] || 0;

  if (attivi.length < 2) {
    return (
      <section className="dv">
        <Testa />
        <Persone stato={stato} />
      </section>
    );
  }

  async function ricorda(t) {
    const testo = `Ciao ${nome(t.da)}, per le spese di casa ${t.a === io ? 'mi devi' : `devi a ${nome(t.a)}`} ${eur(t.importo, 2)}. Il dettaglio è su SoldiBuoni.`;
    conta('sollecito');
    if (navigator.share) { try { await navigator.share({ text: testo }); return; } catch (e) { if (e?.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(testo); setMsg('Messaggio copiato: incollalo dove preferisci.'); } catch { setMsg(testo); }
  }
  function pagato(t) {
    if (!confirm(`Confermi che ${nome(t.da)} ha dato ${eur(t.importo, 2)} a ${nome(t.a) === 'Tu' ? 'te' : nome(t.a)}?`)) return;
    azioni.salvaMovimento({ tipo: 'rimborso', importo: t.importo, pagato_da: t.da, a_chi: t.a, data: oggiISO(), descrizione: 'Rimborso' });
    conta('rimborso');
  }
  const daProposta = (p) => setScheda({
    descrizione: p.tipo === 'documento' ? [CATEGORIE[p.categoria]?.label, p.d.fornitore].filter(Boolean).join(' · ') : (p.r.nome || CATEGORIE[p.categoria]?.label),
    importo: p.importo, data: p.data, categoria: VOCI.some((x) => x.v === p.categoria) ? p.categoria : 'altro', pagato_da: io,
    documento_id: p.tipo === 'documento' ? p.id : null, ricorrente_id: p.tipo === 'ricorrente' ? p.id : null,
  });

  return (
    <section className="dv">
      <Testa />

      {senzaMe && (
        <div className="ca-card dv-chi">
          <p><strong>Chi sei tu in questi conti?</strong> Così ti mostriamo cosa devi dare o ricevere.</p>
          <div className="dv-chips">
            {attivi.map((p) => (
              <button key={p.id} className="dv-chip" onClick={() => { azioni.salvaConvivente({ id: p.id, account_id: acc.utente.id }); impostaIo(p.id); }}>
                <Avatar p={p} i={indice(p.id)} size={22} />{p.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dv-top">
        <div className={'ca-card dv-mio ' + (mio > 0 ? 'pos' : mio < 0 ? 'neg' : '')}>
          <p className="dv-k">{mio > 0 ? 'Devi ricevere' : mio < 0 ? 'Devi dare' : 'Sei in pari'}</p>
          <p className="dv-mio-v num"><Soldi v={Math.abs(mio) / 100} /></p>
          <button className="btn btn-ink dv-add" onClick={() => setScheda({})}><Icona nome="piu" size={17} /> Aggiungi una spesa</button>
        </div>
        <div className="ca-card dv-saldi">
          <p className="dv-k">Saldi</p>
          <ul>
            {tutti.filter((p) => p.attivo !== false || (saldiC[p.id] || 0) !== 0).map((p) => {
              const v = saldiC[p.id] || 0;
              return (
                <li key={p.id}>
                  <Avatar p={p} i={indice(p.id)} />
                  <span className="dv-saldi-n">{p.id === io ? 'Tu' : p.nome}</span>
                  <span className={'num dv-saldi-v ' + (v > 0 ? 'pos' : v < 0 ? 'neg' : '')}>{v === 0 ? 'in pari' : (v > 0 ? 'riceve ' : 'deve ') + eur(Math.abs(v) / 100, 2)}</span>
                </li>
              );
            })}
          </ul>
          <button className="ca-link muted" onClick={() => setGestisci(true)}>Persone</button>
        </div>
      </div>

      {passaggi.length > 0 && <>
        <h2 className="ca-h2">Per mettervi in pari</h2>
        <div className="ca-card dv-pareggio">
          {passaggi.map((t, k) => (
            <div key={k} className="dv-pass">
              <span className="dv-pass-chi">
                <Avatar p={tutti.find((c) => c.id === t.da)} i={indice(t.da)} size={28} />
                <span className="dv-freccia" aria-hidden="true">→</span>
                <Avatar p={tutti.find((c) => c.id === t.a)} i={indice(t.a)} size={28} />
                <span className="dv-pass-t"><strong>{nome(t.da)}</strong> {t.da === io ? 'dai' : 'dà'} a <strong>{nome(t.a) === 'Tu' ? 'te' : nome(t.a)}</strong></span>
              </span>
              <span className="num dv-pass-v"><Soldi v={t.importo} /></span>
              <span className="dv-pass-a">
                {t.da !== io && <button className="ca-link" onClick={() => ricorda(t)}>Ricorda</button>}
                <button className="btn btn-line btn-sm" onClick={() => pagato(t)}>Segna pagato</button>
              </span>
            </div>
          ))}
          {msg && <p className="ca-muted small" role="status">{msg}</p>}
        </div>
      </>}

      {proposte.length > 0 && <>
        <h2 className="ca-h2">Da dividere</h2>
        <div className="ca-list dv-prop">
          {proposte.map((p) => (
            <button key={p.tipo + p.id} className="ca-row" onClick={() => daProposta(p)}>
              <IconaCategoria cat={p.categoria} size={34} />
              <span className="ca-row-main">
                <span className="ca-row-t">{p.tipo === 'documento' ? `Bolletta ${CATEGORIE[p.categoria]?.label.toLowerCase() || ''}` : (p.r.nome || CATEGORIE[p.categoria]?.label)}</span>
                <span className="ca-row-s">{p.tipo === 'documento' ? (p.d.fornitore || 'dalla bolletta caricata') : 'spesa fissa di questo mese'}</span>
              </span>
              <span className="num ca-row-v">{eur(p.importo, 2)}</span>
              <span className="dv-prop-a">Dividi</span>
            </button>
          ))}
        </div>
      </>}

      <h2 className="ca-h2">Movimenti</h2>
      {storico.length === 0 ? (
        <div className="ca-card ca-empty-s">Ancora nessuna spesa divisa. Aggiungi la spesa del supermercato, l'affitto o una bolletta: i saldi si aggiornano da soli.</div>
      ) : (
        <div className="ca-list dv-storico">
          {storico.slice(0, 60).map((m) => {
            const miaParte = m.tipo === 'spesa' ? Number(m.quote?.[io] || 0) : 0;
            return (
              <button key={m.id} className="ca-row" onClick={() => m.tipo === 'spesa' ? setScheda(m) : (confirm('Eliminare questo rimborso?') && azioni.eliminaMovimento(m.id))}>
                {m.tipo === 'rimborso'
                  ? <span className="dv-rimb" aria-hidden="true"><Icona nome="ok" size={16} /></span>
                  : <IconaCategoria cat={VOCI.some((x) => x.v === m.categoria) && CATEGORIE[m.categoria] ? m.categoria : 'altro'} size={34} />}
                <span className="ca-row-main">
                  <span className="ca-row-t">{m.tipo === 'rimborso' ? `${nome(m.pagato_da)} → ${nome(m.a_chi)}` : (m.descrizione || etichetta(m.categoria))}</span>
                  <span className="ca-row-s">{dataBreve(m.data)} · {m.tipo === 'rimborso' ? 'rimborso' : `ha pagato ${nome(m.pagato_da) === 'Tu' ? 'tu' : nome(m.pagato_da)}`}{miaParte ? ` · la tua parte ${eur(miaParte, 2)}` : ''}</span>
                </span>
                <span className="num ca-row-v">{eur(m.importo, 2)}</span>
              </button>
            );
          })}
        </div>
      )}

      <SchedaSpesa aperta={!!scheda} iniziale={scheda && Object.keys(scheda).length ? scheda : null} persone={attivi} io={io} onChiudi={() => setScheda(null)} />
      <Foglio aperto={gestisci} onChiudi={() => setGestisci(false)} titolo="Chi divide le spese">
        <GestionePersone stato={stato} io={io} />
      </Foglio>
    </section>
  );
}

function Testa() {
  return <Testata titolo="Dividi" sotto="Chi paga cosa e chi deve a chi, tra coinquilini o in coppia. Con il minimo di passaggi per mettervi in pari." />;
}

function GestionePersone({ stato, io }) {
  const [nuovo, setNuovo] = useState('');
  return (
    <div className="dv-gest">
      <ul className="dv-gest-l">
        {stato.conviventi.filter((c) => c.attivo !== false).map((p, i) => (
          <li key={p.id}>
            <Avatar p={p} i={stato.conviventi.indexOf(p)} />
            <input value={p.nome} maxLength={40} aria-label="Nome" onChange={(e) => azioni.salvaConvivente({ id: p.id, nome: e.target.value })} />
            {p.id === io ? <span className="ca-pill">tu</span> : (
              <span className="dv-gest-a">
                <button className="ca-link muted" onClick={() => impostaIo(p.id) || location.reload()}>Sono io</button>
                <button className="ca-link muted" onClick={() => confirm(`Togliere ${p.nome}? Le spese già registrate restano nei conti.`) && azioni.eliminaConvivente(p.id)}>Togli</button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <form className="dv-gest-add" onSubmit={(e) => { e.preventDefault(); if (!nuovo.trim()) return; azioni.salvaConvivente({ id: crypto.randomUUID(), nome: nuovo.trim() }); setNuovo(''); }}>
        <input value={nuovo} maxLength={40} placeholder="Nome di una nuova persona" onChange={(e) => setNuovo(e.target.value)} aria-label="Nuova persona" />
        <button className="btn btn-ink btn-sm" disabled={!nuovo.trim()}>Aggiungi</button>
      </form>
      <p className="ca-muted small">Chi esce di casa si toglie da qui: le spese passate restano nei saldi finché non siete in pari.</p>
    </div>
  );
}

/** In panoramica: a che punto sono i conti, oppure l'invito a cominciare. */
export function RiepilogoConti({ stato, vai }) {
  const acc = useAccount();
  const attivi = stato.conviventi.filter((c) => c.attivo !== false);
  const persone = Number(stato.casa?.persone) || 1;
  if (attivi.length < 2) {
    if (persone < 2) return null;
    return (
      <button className="ca-sez-btn dv-invito" onClick={() => vai('dividi')}>
        <span className="ca-sez-ico" aria-hidden="true"><Icona nome="dividi" size={18} /></span>
        <span><strong>Dividete le spese di casa</strong><small>Chi paga cosa e chi deve a chi, senza fogli di calcolo</small></span>
        <Icona nome="freccia" size={16} />
      </button>
    );
  }
  const io = idIo(stato.conviventi, acc.utente?.id);
  const s = calcolaSaldi(stato.movimenti, stato.conviventi);
  const mio = s[io] || 0;
  const nome = (id) => stato.conviventi.find((c) => c.id === id)?.nome || '—';
  const miei = pareggio(s).filter((t) => t.da === io || t.a === io);
  return (
    <button className="ca-sez-btn dv-riep" onClick={() => vai('dividi')}>
      <span className="ca-sez-ico" aria-hidden="true"><Icona nome="dividi" size={18} /></span>
      <span>
        <strong>{mio === 0 ? 'Conti di casa in pari' : mio > 0 ? `Devi ricevere ${eur(mio / 100, 2)}` : `Devi dare ${eur(-mio / 100, 2)}`}</strong>
        <small>{miei.length ? miei.slice(0, 2).map((t) => (t.a === io ? `${nome(t.da)} ti deve ${eur(t.importo, 2)}` : `devi ${eur(t.importo, 2)} a ${nome(t.a)}`)).join(' · ') : 'Aggiungi le spese comuni quando capitano'}</small>
      </span>
      <Icona nome="freccia" size={16} />
    </button>
  );
}
