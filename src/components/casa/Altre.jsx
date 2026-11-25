import { useMemo, useRef, useState } from 'react';
import { azioni } from '../../casa/store.js';
import { CATEGORIE, ORDINE, RISCALDAMENTO, FREQUENZE, TITOLO, parseNumero, dataDoc, eur, dataBreve, oggiISO, addGiorni } from '../../casa/model.js';
import { calcolaAvvisi, calcolaScadenze } from '../../casa/insights.js';
import { scaricaCalendario } from '../../casa/calendario.js';
import { Campo, Foglio, Icona, IconaCategoria, Scelta } from './ui.jsx';
import { RigaDocumento, SchedaDocumento, SchedaRicorrente } from './Documento.jsx';
import { Testata } from './Aggiungi.jsx';
import { Avviso, RigaScadenza } from './Panoramica.jsx';
import Account from './Account.jsx';

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
            <span className="num ca-month-tot">{eur(voci.reduce((t, s) => t + (Number(s.importo) || 0), 0))}</span>
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

// ── Archivio ────────────────────────────────────────────────
export function Archivio({ stato, vai }) {
  const [filtro, setFiltro] = useState('tutte');
  const [aperto, setAperto] = useState(null);
  const presenti = ORDINE.filter((c) => stato.documenti.some((d) => d.categoria === c));
  const docs = stato.documenti
    .filter((d) => filtro === 'tutte' || d.categoria === filtro)
    .sort((a, b) => (dataDoc(b) || '').localeCompare(dataDoc(a) || ''));
  const doc = aperto && stato.documenti.find((d) => d.id === aperto);
  return (
    <section className="ca-page">
      <Testata titolo="Archivio" sotto={`${stato.documenti.length} documenti registrati.`} />
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
        <div className="ca-card ca-empty-s">Ancora nessun documento. <button className="ca-link" onClick={() => vai('aggiungi')}>Carica la prima bolletta</button></div>
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
    </section>
  );
}

// ── Profilo della casa e dati ───────────────────────────────
export function Casa({ stato }) {
  const casa = stato.casa || {};
  const [ric, setRic] = useState(null);
  const inImp = useRef(null);
  const set = (k) => (v) => azioni.modificaCasa({ [k]: v });
  return (
    <section className="ca-page">
      <Testata titolo="La casa" sotto="Account, profilo della casa e spese fisse." />
      <Account />

      <div className="ca-card">
        <Campo label="Nome"><input defaultValue={casa.nome || ''} placeholder="La mia casa" onBlur={(e) => set('nome')(e.target.value.trim() || null)} /></Campo>
        <div className="ca-grid2">
          <Campo label="CAP"><input inputMode="numeric" maxLength={5} defaultValue={casa.cap || ''} onBlur={(e) => set('cap')(e.target.value.replace(/\D/g, '') || null)} /></Campo>
          <Campo label="Metri quadri"><input inputMode="numeric" defaultValue={casa.mq || ''} onBlur={(e) => set('mq')(Number(e.target.value) || null)} /></Campo>
        </div>
        <p className="ca-field-l">La casa è</p>
        <Scelta nome="Titolo" valore={casa.titolo} onChange={set('titolo')} colonne={3} opzioni={Object.entries(TITOLO).map(([v, l]) => ({ v, l }))} />
        <p className="ca-field-l" style={{ marginTop: 18 }}>Persone in casa</p>
        <Scelta nome="Persone" valore={casa.persone} onChange={set('persone')} opzioni={[1, 2, 3, 4, 5].map((n) => ({ v: n, l: n === 5 ? '5+' : String(n) }))} colonne={5} />
        <p className="ca-field-l" style={{ marginTop: 18 }}>Riscaldamento</p>
        <Scelta nome="Riscaldamento" valore={casa.riscaldamento} onChange={set('riscaldamento')} opzioni={Object.entries(RISCALDAMENTO).map(([v, l]) => ({ v, l }))} colonne={2} />
      </div>

      <div className="ca-h2-row">
        <h2 className="ca-h2">Spese fisse</h2>
        <button className="ca-link" onClick={() => setRic({})}>+ Aggiungi</button>
      </div>
      {stato.ricorrenti.length ? (
        <div className="ca-card flush ca-list">
          {stato.ricorrenti.map((r) => (
            <button className="ca-row" key={r.id} onClick={() => setRic(r)}>
              <IconaCategoria cat={r.categoria} size={36} />
              <span className="ca-row-main"><span className="ca-row-t">{r.nome || CATEGORIE[r.categoria]?.label}</span><span className="ca-row-s">{FREQUENZE[r.frequenza]?.label}</span></span>
              <span className="num ca-row-v">{eur(r.importo, 2)}</span>
            </button>
          ))}
        </div>
      ) : <div className="ca-card ca-empty-s">Mutuo o affitto, condominio, TARI, assicurazione: aggiungile per avere il costo completo.</div>}

      <h2 className="ca-h2">I tuoi dati</h2>
      <div className="ca-card ca-data">
        <p><Icona nome="lucchetto" size={18} /> Senza account i dati restano solo in questo browser. Con l'account sono salvati anche sul nostro database in Europa, visibili solo a te. Il file delle bollette non viene mai conservato.</p>
        <div className="ca-data-act">
          <button className="btn btn-line" onClick={azioni.esporta}>Esporta backup</button>
          <button className="btn btn-line" onClick={() => inImp.current.click()}>Importa backup</button>
          <input ref={inImp} type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files[0]; if (!f) return;
            try { await azioni.importa(f); alert('Backup importato.'); } catch { alert('File non valido.'); }
          }} />
          <button className="btn btn-line danger" onClick={() => { if (confirm('Cancellare tutti i dati della casa da questo dispositivo?')) azioni.azzera(); }}>Cancella tutto</button>
        </div>
      </div>

      <Foglio aperto={!!ric} onChiudi={() => setRic(null)} titolo="Spesa fissa">
        {ric && <SchedaRicorrente iniziale={ric} onSalva={(r) => { azioni.salvaRicorrente(r); setRic(null); }} onElimina={ric.id ? () => { azioni.eliminaRicorrente(ric.id); setRic(null); } : null} />}
      </Foglio>
    </section>
  );
}

// ── Onboarding: quattro tocchi ──────────────────────────────
export function Benvenuto() {
  const [accedi, setAccedi] = useState(false);
  const [titolo, setTitolo] = useState(null);
  const [rata, setRata] = useState('');
  const [persone, setPersone] = useState(null);
  const [risc, setRisc] = useState(null);
  const [cap, setCap] = useState('');
  const pronto = titolo && persone && risc;
  const conRata = titolo === 'proprieta_mutuo' || titolo === 'affitto';

  const vai = () => {
    azioni.creaCasa({ titolo, persone, riscaldamento: risc, cap: cap || null });
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
    location.hash = '#/aggiungi';
  };

  return (
    <section className="ca-page ca-onb">
      <p className="eyebrow">Benvenuto</p>
      <h1 className="display ca-onb-t">Quattro domande sulla casa,<br /><em>poi pensiamo noi ai conti.</em></h1>
      <div className="ca-onb-acc">
        {accedi ? <Account /> : (
          <p>Hai già un account? <button className="ca-link" onClick={() => setAccedi(true)}>Accedi e ritrova la tua casa</button></p>
        )}
      </div>

      <div className="ca-onb-q">
        <p className="ca-onb-l"><span className="num">01</span> La casa è</p>
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
        <p className="ca-onb-l"><span className="num">02</span> Quante persone ci vivono?</p>
        <Scelta nome="Persone" valore={persone} onChange={setPersone} opzioni={[1, 2, 3, 4, 5].map((n) => ({ v: n, l: n === 5 ? '5+' : String(n) }))} colonne={5} />
      </div>
      <div className="ca-onb-q">
        <p className="ca-onb-l"><span className="num">03</span> Come si scalda?</p>
        <Scelta nome="Riscaldamento" valore={risc} onChange={setRisc} colonne={2} opzioni={[
          { v: 'gas_autonomo', l: 'Caldaia a gas', sub: 'autonoma', icona: 'gas' },
          { v: 'centralizzato', l: 'Centralizzato', sub: 'del condominio', icona: 'condominio' },
          { v: 'pompa_calore', l: 'Pompa di calore', sub: 'o elettrico', icona: 'luce' },
          { v: 'altro', l: 'Altro', sub: 'o non so', icona: 'altro' },
        ]} />
      </div>
      <div className="ca-onb-q">
        <p className="ca-onb-l"><span className="num">04</span> CAP <span className="ca-muted">facoltativo</span></p>
        <input className="ca-onb-cap num" inputMode="numeric" maxLength={5} value={cap} onChange={(e) => setCap(e.target.value.replace(/\D/g, ''))} placeholder="20100" aria-label="CAP" />
      </div>

      <button className="btn btn-ink ca-onb-go" disabled={!pronto} onClick={vai}>
        Continua e carica una bolletta <Icona nome="freccia" size={18} />
      </button>
      <p className="ca-privacy"><Icona nome="lucchetto" size={16} /> Nessuna registrazione. I dati restano sul tuo dispositivo.</p>
    </section>
  );
}
