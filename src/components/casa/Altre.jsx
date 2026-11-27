import { useMemo, useRef, useState } from 'react';
import { azioni, prendiInAttesa, ciSonoInAttesa } from '../../casa/store.js';
import { CATEGORIE, ORDINE, RISCALDAMENTO, FREQUENZE, TITOLO, parseNumero, dataDoc, eur, dataBreve, oggiISO, addGiorni } from '../../casa/model.js';
import { calcolaAvvisi, calcolaScadenze, prossimaRicorrenza } from '../../casa/insights.js';
import { scaricaCalendario } from '../../casa/calendario.js';
import { Campo, Foglio, Icona, IconaCategoria, Percorso, Scelta } from './ui.jsx';
import { RigaDocumento, SchedaDocumento, SchedaRicorrente } from './Documento.jsx';
import { Testata } from './Aggiungi.jsx';
import { Avviso, RigaScadenza } from './Panoramica.jsx';
import Account from './Account.jsx';
import { SchedaTelefono } from './Telefono.jsx';
import { SchedaCondivisa } from './Condivisa.jsx';
import { useAccount, eliminaCasaRemota } from '../../casa/sync.js';
import { conta } from '../../casa/dispositivo.js';
import { TARI } from '../../data/tari-2025.js';

// ── Scadenze ────────────────────────────────────────────────
export function Scadenze({ stato, vai }) {
  const [nuovo, setNuovo] = useState(false);
  const lista = useMemo(() => calcolaScadenze(stato, 365), [stato]);
  const avvisi = useMemo(() => calcolaAvvisi(stato), [stato]);
  const oggi = oggiISO();
  const passate = lista.filter((s) => s.data < oggi);
  const future = lista.filter((s) => s.data >= oggi);
  const perMese = future.reduce((acc, s) => {
    const k = s.data.slice(0, 7);
    (acc[k] = acc[k] || []).push(s);
    return acc;
  }, {});

  const apri = (s) => {
    if (s.tipo === 'promemoria') {
      if (confirm(`Segnare «${s.titolo}» come fatto?`)) azioni.salvaPromemoria({ id: s.promId, fatto: true });
    } else vai('voce/' + s.categoria);
  };

  return (
    <section className="ca-page">
      <Testata titolo="Scadenze" sotto="Pagamenti, fine promozioni e rinnovi, in ordine." />
      <div className="ca-act-row">
        <button className="btn btn-ink ca-sm" onClick={() => scaricaCalendario(stato)}><Icona nome="calendario" size={16} /> Aggiungi al calendario</button>
        <button className="btn btn-line ca-sm" onClick={() => setNuovo(true)}><Icona nome="piu" size={16} /> Promemoria</button>
      </div>
      <p className="ca-muted small ca-act-note">Il file aggiunge tutte le scadenze al calendario del telefono, con un avviso qualche giorno prima. Se aggiungi nuove voci, scaricalo di nuovo.</p>

      {avvisi.length > 0 && <div className="ca-avs">{avvisi.map((a) => <Avviso key={a.id} a={a} vai={vai} />)}</div>}

      {passate.length > 0 && (
        <>
          <h2 className="ca-h2">Non ancora segnate come pagate</h2>
          <div className="ca-card flush ca-list">{passate.map((s) => <RigaScadenza key={s.id} s={s} onApri={() => apri(s)} />)}</div>
        </>
      )}

      {Object.keys(perMese).length ? Object.entries(perMese).map(([mese, voci]) => (
        <div key={mese}>
          <h2 className="ca-h2 ca-month">{new Date(mese + '-01T00:00:00').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            {voci.some((s) => Number(s.importo) > 0) && <span className="num ca-month-tot">{eur(voci.reduce((t, s) => t + (Number(s.importo) || 0), 0))}</span>}
          </h2>
          <div className="ca-card flush ca-list">{voci.map((s) => <RigaScadenza key={s.id} s={s} onApri={() => apri(s)} />)}</div>
        </div>
      )) : (
        <div className="ca-card ca-empty-s">Nessuna scadenza in arrivo. Le leggo dalle bollette che carichi, oppure aggiungi un promemoria.</div>
      )}

      <Foglio aperto={nuovo} onChiudi={() => setNuovo(false)} titolo="Nuovo promemoria">
        <Promemoria onSalva={(p) => { azioni.salvaPromemoria(p); setNuovo(false); }} />
      </Foglio>
    </section>
  );
}

function Promemoria({ onSalva }) {
  const [p, setP] = useState({ titolo: '', data: addGiorni(oggiISO(), 30), categoria: 'altro' });
  return (
    <form className="ca-doc" onSubmit={(e) => { e.preventDefault(); if (p.titolo && p.data) onSalva(p); }}>
      <Campo label="Cosa ricordare"><input value={p.titolo} onChange={(e) => setP({ ...p, titolo: e.target.value })} placeholder="Es. revisione caldaia" /></Campo>
      <div className="ca-grid2">
        <Campo label="Quando"><input type="date" value={p.data} onChange={(e) => setP({ ...p, data: e.target.value })} /></Campo>
        <Campo label="Voce">
          <select value={p.categoria} onChange={(e) => setP({ ...p, categoria: e.target.value })}>
            {ORDINE.map((k) => <option key={k} value={k}>{CATEGORIE[k].label}</option>)}
          </select>
        </Campo>
      </div>
      <div className="ca-doc-ft"><button className="btn btn-ink" disabled={!p.titolo}>Salva</button></div>
    </form>
  );
}

// ── Spese: fisse e a rate, una tantum, bollette ─────────────
const sottoRic = (r) => {
  const f = FREQUENZE[r.frequenza];
  if (f?.unaVolta) return r.prossima_scadenza ? 'una volta sola · ' + dataBreve(r.prossima_scadenza) : 'una volta sola';
  const d = prossimaRicorrenza(r);
  return (f?.label || '') + (d ? ' · prossima ' + dataBreve(d) : '');
};

function ListaRicorrenti({ voci, onApri }) {
  return (
    <div className="ca-card flush ca-list ca-list-wrap">
      {voci.map((r) => (
        <button className="ca-row" key={r.id} onClick={() => onApri(r)}>
          <IconaCategoria cat={r.categoria} size={36} />
          <span className="ca-row-main"><span className="ca-row-t">{r.nome || CATEGORIE[r.categoria]?.label}</span><span className="ca-row-s">{sottoRic(r)}</span></span>
          <span className="num ca-row-v">{eur(r.importo, 2)}</span>
        </button>
      ))}
    </div>
  );
}

export function Archivio({ stato, vai }) {
  const [filtro, setFiltro] = useState('tutte');
  const [aperto, setAperto] = useState(null);
  const [ric, setRic] = useState(null);
  const presenti = ORDINE.filter((c) => stato.documenti.some((d) => d.categoria === c));
  const docs = stato.documenti
    .filter((d) => filtro === 'tutte' || d.categoria === filtro)
    .sort((a, b) => (dataDoc(b) || '').localeCompare(dataDoc(a) || ''));
  const doc = aperto && stato.documenti.find((d) => d.id === aperto);
  const ordina = (a, b) => ORDINE.indexOf(a.categoria) - ORDINE.indexOf(b.categoria) || (a.prossima_scadenza || '').localeCompare(b.prossima_scadenza || '');
  const fisse = stato.ricorrenti.filter((r) => !FREQUENZE[r.frequenza]?.unaVolta).sort(ordina);
  const una = stato.ricorrenti.filter((r) => FREQUENZE[r.frequenza]?.unaVolta).sort((a, b) => (b.prossima_scadenza || '').localeCompare(a.prossima_scadenza || ''));
  const annuo = fisse.reduce((t, r) => t + (Number(r.importo) || 0) * 12 / (FREQUENZE[r.frequenza]?.mesi || 1), 0);
  return (
    <section className="ca-page">
      <Testata titolo="Spese" sotto="Tutto quello che hai inserito: spese fisse, una tantum e bollette." />

      <div className="ca-h2-row">
        <h2 className="ca-h2">Spese fisse e a rate</h2>
        <button className="ca-link" onClick={() => vai('aggiungi?tipo=fissa')}>+ Aggiungi</button>
      </div>
      {fisse.length ? <>
        <ListaRicorrenti voci={fisse} onApri={setRic} />
        <p className="ca-muted small ca-tot">In un anno <strong className="num">{eur(annuo, 0)}</strong>, cioè {eur(annuo / 12, 0)} al mese.</p>
      </> : <div className="ca-card ca-empty-s">Mutuo o affitto, condominio, TARI, assicurazione: aggiungile per avere il costo completo della casa.</div>}

      {una.length > 0 && <>
        <div className="ca-h2-row">
          <h2 className="ca-h2">Una tantum</h2>
          <button className="ca-link" onClick={() => vai('aggiungi?tipo=unatantum')}>+ Aggiungi</button>
        </div>
        <ListaRicorrenti voci={una} onApri={setRic} />
      </>}

      <div className="ca-h2-row">
        <h2 className="ca-h2">Bollette e documenti</h2>
        <button className="ca-link" onClick={() => vai('aggiungi')}>+ Carica</button>
      </div>
      {presenti.length > 1 && (
        <div className="ca-chips ca-filter" role="tablist">
          {['tutte', ...presenti].map((c) => (
            <button key={c} role="tab" aria-selected={filtro === c} className={'ca-chip' + (filtro === c ? ' on' : '')} onClick={() => setFiltro(c)}>
              {c === 'tutte' ? 'Tutte' : CATEGORIE[c].label}
            </button>
          ))}
        </div>
      )}
      {docs.length ? (
        <div className="ca-card flush ca-list">{docs.map((d) => <RigaDocumento key={d.id} d={d} onApri={() => setAperto(d.id)} />)}</div>
      ) : (
        <div className="ca-card ca-empty-s">Ancora nessuna bolletta. <button className="ca-link" onClick={() => vai('aggiungi')}>Carica la prima</button></div>
      )}
      <Foglio aperto={!!doc} onChiudi={() => setAperto(null)} titolo="Modifica documento">
        {doc && <>
          <SchedaDocumento key={doc.id} iniziale={doc} onSalva={(x) => { azioni.modificaDocumento(doc.id, x); setAperto(null); }} />
          <div className="ca-sheet-extra">
            <label className="ca-check"><input type="checkbox" checked={!!doc.pagato} onChange={(e) => azioni.modificaDocumento(doc.id, { pagato: e.target.checked })} /><span>Già pagata</span></label>
            <button className="ca-link danger" onClick={() => { if (confirm('Eliminare questo documento?')) { azioni.eliminaDocumento(doc.id); setAperto(null); } }}>Elimina documento</button>
          </div>
        </>}
      </Foglio>
      <Foglio aperto={!!ric} onChiudi={() => setRic(null)} titolo={ric && FREQUENZE[ric.frequenza]?.unaVolta ? 'Spesa una tantum' : 'Spesa fissa'}>
        {ric && <SchedaRicorrente key={ric.id || 'nuova'} iniziale={ric} onSalva={(r) => { azioni.salvaRicorrente(r); setRic(null); }} onElimina={ric.id ? () => { azioni.eliminaRicorrente(ric.id); setRic(null); } : null} />}
      </Foglio>
    </section>
  );
}

// ── Profilo della casa e dati ───────────────────────────────
function CancellaTutto() {
  const acc = useAccount();
  const [occupato, setOccupato] = useState(false);
  return (
    <button className="btn btn-line danger" disabled={occupato} onClick={async () => {
      const testo = acc.utente
        ? 'Cancellare la casa da questo dispositivo e dal tuo account? Se la casa è condivisa e l\'hai creata tu, sparisce anche per gli altri. Non si può annullare.'
        : 'Cancellare tutti i dati della casa da questo dispositivo?';
      if (!confirm(testo)) return;
      setOccupato(true);
      try { if (acc.utente) await eliminaCasaRemota(); azioni.azzera(); }
      catch (e) { alert(e.message); }
      finally { setOccupato(false); }
    }}>{occupato ? 'Cancello…' : 'Cancella tutto'}</button>
  );
}

function Sezione({ titolo, stato, aperta, children }) {
  return (
    <details className="ca-sez" open={aperta}>
      <summary><span className="ca-sez-t">{titolo}</span>{stato && <span className="ca-sez-s">{stato}</span>}<Icona nome="freccia" size={16} /></summary>
      <div className="ca-sez-b">{children}</div>
    </details>
  );
}

export function Casa({ stato, vai }) {
  const casa = stato.casa || {};
  const acc = useAccount();
  const inImp = useRef(null);
  const set = (k) => (v) => azioni.modificaCasa({ [k]: v });
  const profilo = [TITOLO[casa.titolo], casa.persone ? (casa.persone >= 5 ? '5+' : casa.persone) + (casa.persone === 1 ? ' persona' : ' persone') : null].filter(Boolean).join(' · ');
  return (
    <section className="ca-page">
      <Testata titolo="Altro" sotto="Strumenti, guide e impostazioni della casa." />

      <div className="ca-card flush ca-list ca-altro">
        <button className="ca-row" onClick={() => vai('dividi')}>
          <span className="ca-altro-i"><Icona nome="dividi" size={20} /></span>
          <span className="ca-row-main"><span className="ca-row-t">Dividi le spese</span><span className="ca-row-s">{stato.conviventi.length ? 'Chi deve a chi in casa' : 'Con chi vive con te: chi deve a chi'}</span></span>
          <Icona nome="freccia" size={18} />
        </button>
        <a className="ca-row" href="/guida">
          <span className="ca-altro-i"><Icona nome="libro" size={20} /></span>
          <span className="ca-row-main"><span className="ca-row-t">Guide</span><span className="ca-row-s">TARI, IMU, bollette, condominio, 730</span></span>
          <Icona nome="freccia" size={18} />
        </a>
        <a className="ca-row" href="/strumenti">
          <span className="ca-altro-i"><Icona nome="strumenti" size={20} /></span>
          <span className="ca-row-main"><span className="ca-row-t">Strumenti</span><span className="ca-row-s">Mutuo, affitto o mutuo, TARI della tua città</span></span>
          <Icona nome="freccia" size={18} />
        </a>
      </div>

      <h2 className="ca-h2">Impostazioni</h2>

      <Sezione titolo="Account e email del lunedì" stato={acc.utente ? acc.utente.email : 'Non attivo'}>
        <Account />
      </Sezione>
      <Sezione titolo="Chi vive qui" stato="Condividi la casa">
        <SchedaCondivisa />
      </Sezione>
      <Sezione titolo="Telefono" stato="App e notifiche">
        <SchedaTelefono />
      </Sezione>
      <Sezione titolo="Profilo della casa" stato={profilo}>
        <div className="ca-card ca-form">
          <Campo label="Nome"><input defaultValue={casa.nome || ''} placeholder="La mia casa" onBlur={(e) => set('nome')(e.target.value.trim() || null)} /></Campo>
          <div className="ca-grid2">
            <Campo label="Comune"><input list="ca-comuni-p" defaultValue={casa.citta || ''} placeholder="Milano" onBlur={(e) => set('citta')(e.target.value.trim() || null)} /><datalist id="ca-comuni-p">{TARI.map((t) => <option key={t.slug} value={t.citta} />)}</datalist></Campo>
            <Campo label="Metri quadri"><input inputMode="numeric" defaultValue={casa.mq || ''} onBlur={(e) => set('mq')(Number(e.target.value) || null)} /></Campo>
          </div>
          <p className="ca-field-l ca-form-h">La casa è</p>
          <Scelta nome="Titolo" valore={casa.titolo} onChange={set('titolo')} colonne={3} opzioni={Object.entries(TITOLO).map(([v, l]) => ({ v, l }))} />
          <p className="ca-field-l ca-form-h">Persone in casa</p>
          <Scelta nome="Persone" valore={casa.persone} onChange={set('persone')} opzioni={[1, 2, 3, 4, 5].map((n) => ({ v: n, l: n === 5 ? '5+' : String(n) }))} colonne={5} />
          <p className="ca-field-l ca-form-h">Riscaldamento</p>
          <Scelta nome="Riscaldamento" valore={casa.riscaldamento} onChange={set('riscaldamento')} opzioni={Object.entries(RISCALDAMENTO).map(([v, l]) => ({ v, l }))} colonne={2} />
        </div>
      </Sezione>
      <Sezione titolo="I tuoi dati" stato="Backup e cancellazione">
        <div className="ca-card ca-data">
          <p><Icona nome="lucchetto" size={18} /> Senza account i dati restano solo in questo browser. Con l'account sono salvati anche sul nostro database in Europa, visibili solo a te e a chi condivide la casa con te. Le bollette caricate non le conserviamo: le legge un servizio di AI che le cancella entro 30 giorni. <a href="/privacy">Informativa privacy</a></p>
          <div className="ca-data-act">
            <button className="btn btn-line" onClick={azioni.esporta}>Esporta backup</button>
            <button className="btn btn-line" onClick={() => inImp.current.click()}>Importa backup</button>
            <input ref={inImp} type="file" accept="application/json" hidden onChange={async (e) => {
              const f = e.target.files[0]; if (!f) return;
              try { await azioni.importa(f); alert('Backup importato.'); } catch { alert('File non valido.'); }
            }} />
            <CancellaTutto />
          </div>
        </div>
      </Sezione>
    </section>
  );
}

// ── Onboarding: quattro tocchi ──────────────────────────────
// Risposte date nella stima in home: l'onboarding parte già compilato.
const stimaSalvata = () => { try { return JSON.parse(localStorage.getItem('sb_stima')) || {}; } catch { return {}; } };

export function Benvenuto() {
  const [st0] = useState(stimaSalvata);
  const [titolo, setTitolo] = useState(st0.titolo || null);
  const [rata, setRata] = useState('');
  const [persone, setPersone] = useState(st0.persone || null);
  const [risc, setRisc] = useState(st0.riscaldamento || null);
  const [citta, setCitta] = useState(st0.citta || '');
  const pronto = titolo && persone && risc;
  const conRata = titolo === 'proprieta_mutuo' || titolo === 'affitto';

  const vai = () => {
    azioni.creaCasa({ titolo, persone, riscaldamento: risc, citta: citta.trim() || null });
    conta('onboarding', titolo);
    const importo = parseNumero(rata) || 0;
    if (conRata && importo > 0) {
      const oggi = new Date();
      const prossima = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 1).toISOString().slice(0, 10);
      azioni.salvaRicorrente({
        categoria: titolo === 'affitto' ? 'affitto' : 'mutuo', importo, frequenza: 'mensile',
        prossima_scadenza: prossima, prima_casa: titolo === 'proprieta_mutuo' ? true : undefined,
        domiciliazione: titolo === 'proprieta_mutuo' ? true : undefined,
      });
    }
    try { localStorage.setItem('sb_benvenuto', '1'); } catch {}
    // Arriva da "Controlla la tua bolletta": la bolletta è già letta, si va dritti alla panoramica.
    const attesa = prendiInAttesa();
    if (attesa.length) { azioni.aggiungiDocumenti(attesa); conta('controllo_casa', attesa.length); location.hash = '#/'; }
    else location.hash = '#/aggiungi?primo=1';
  };
  const risposte = [!!titolo, !!persone, !!risc].filter(Boolean).length;
  const ok = (v) => v ? <span className="ca-onb-ok" aria-label="risposta data"><Icona nome="ok" size={14} /></span> : null;

  return (
    <section className="ca-page ca-onb">
      <Percorso passo={0} />
      <h1 className="display ca-onb-t">La tua casa,<br /><em>in quattro risposte.</em></h1>
      <p className="ca-onb-s">Un minuto. Poi carichi un documento (o lo fai dopo) e si apre la <strong>tua casa</strong>: quanto costa, cosa esce questo mese, nei mesi in cui pesa.</p>

      <div className="ca-onb-q">
        <p className="ca-onb-l"><span className="ca-onb-n">I</span> La casa è {ok(titolo)}</p>
        <Scelta nome="Titolo" valore={titolo} onChange={setTitolo} colonne={3} opzioni={[
          { v: 'proprieta_mutuo', l: 'Di proprietà', sub: 'con mutuo', icona: 'mutuo' },
          { v: 'proprieta', l: 'Di proprietà', sub: 'senza mutuo', icona: 'casa' },
          { v: 'affitto', l: 'In affitto', sub: 'canone mensile', icona: 'chiave' },
        ]} />
        {conRata && (
          <label className="ca-onb-rata">
            <span>{titolo === 'affitto' ? 'Canone mensile' : 'Rata mensile del mutuo'} <span className="ca-muted">facoltativo</span></span>
            <span className="ca-onb-eur"><span>€</span><input className="num" inputMode="decimal" value={rata} onChange={(e) => setRata(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0" /></span>
          </label>
        )}
      </div>
      <div className="ca-onb-q">
        <p className="ca-onb-l"><span className="ca-onb-n">II</span> Quante persone ci vivono? {ok(persone)}</p>
        <Scelta nome="Persone" valore={persone} onChange={setPersone} opzioni={[1, 2, 3, 4, 5].map((n) => ({ v: n, l: n === 5 ? '5+' : String(n) }))} colonne={5} />
      </div>
      <div className="ca-onb-q">
        <p className="ca-onb-l"><span className="ca-onb-n">III</span> Come si scalda? {ok(risc)}</p>
        <Scelta nome="Riscaldamento" valore={risc} onChange={setRisc} colonne={2} opzioni={[
          { v: 'gas_autonomo', l: 'Caldaia a gas', sub: 'autonoma', icona: 'gas' },
          { v: 'centralizzato', l: 'Centralizzato', sub: 'del condominio', icona: 'condominio' },
          { v: 'pompa_calore', l: 'Pompa di calore', sub: 'o elettrico', icona: 'luce' },
          { v: 'altro', l: 'Altro', sub: 'o non so', icona: 'altro' },
        ]} />
      </div>
      <div className="ca-onb-q">
        <p className="ca-onb-l"><span className="ca-onb-n">IV</span> In che comune? <span className="ca-muted">facoltativo, per la TARI e i confronti</span></p>
        <input className="ca-onb-citta" list="ca-comuni" value={citta} onChange={(e) => setCitta(e.target.value)} placeholder="Milano" aria-label="Comune" maxLength={60} autoComplete="address-level2" />
        <datalist id="ca-comuni">{TARI.map((t) => <option key={t.slug} value={t.citta} />)}</datalist>
      </div>

      <div className="ca-onb-fine">
        <button className="btn btn-ink ca-onb-go" disabled={!pronto} onClick={vai}>
          {pronto ? <>Crea la mia casa <Icona nome="freccia" size={18} /></> : `Rispondi ancora a ${3 - risposte} ${3 - risposte === 1 ? 'domanda' : 'domande'}`}
        </button>
        <p className="ca-onb-dopo">{pronto ? 'Poi ti chiedo una bolletta da leggere. Puoi anche saltare.' : 'Le domande I, II e III sono obbligatorie, il resto no.'}</p>
      </div>
      <p className="ca-privacy"><Icona nome="lucchetto" size={16} /> I dati della casa sono visibili solo a te e a chi inviti. Server in Unione Europea.</p>
    </section>
  );
}
