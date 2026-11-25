import { useMemo, useRef, useState } from 'react';
import { azioni } from '../../casa/store.js';
import { CATEGORIE, ORDINE, RISCALDAMENTO, FREQUENZE, dataDoc, eur, dataBreve, oggiISO, addGiorni } from '../../casa/model.js';
import { calcolaAvvisi, calcolaScadenze } from '../../casa/insights.js';
import { Campo, Foglio, Icona, IconaCategoria, Scelta } from './ui.jsx';
import { RigaDocumento, SchedaDocumento, SchedaRicorrente } from './Documento.jsx';
import { Testata } from './Aggiungi.jsx';
import { Avviso, RigaScadenza } from './Panoramica.jsx';

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
      <Testata titolo="Scadenze" sotto="Pagamenti, fine promozioni e rinnovi, in ordine." destra={<button className="btn btn-line ca-sm" onClick={() => setNuovo(true)}><Icona nome="piu" size={16} /> Promemoria</button>} />

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
      <Testata titolo="La casa" sotto="Pochi dati che rendono più precisi confronti e avvisi." />

      <div className="ca-card">
        <Campo label="Nome"><input defaultValue={casa.nome || ''} placeholder="La mia casa" onBlur={(e) => set('nome')(e.target.value.trim() || null)} /></Campo>
        <div className="ca-grid2">
          <Campo label="CAP"><input inputMode="numeric" maxLength={5} defaultValue={casa.cap || ''} onBlur={(e) => set('cap')(e.target.value.replace(/\D/g, '') || null)} /></Campo>
          <Campo label="Metri quadri"><input inputMode="numeric" defaultValue={casa.mq || ''} onBlur={(e) => set('mq')(Number(e.target.value) || null)} /></Campo>
        </div>
        <p className="ca-field-l">Persone in casa</p>
        <Scelta nome="Persone" valore={casa.persone} onChange={set('persone')} opzioni={[1, 2, 3, 4, 5].map((n) => ({ v: n, l: n === 5 ? '5+' : String(n) }))} colonne={5} />
        <p className="ca-field-l" style={{ marginTop: 18 }}>Riscaldamento</p>
        <Scelta nome="Riscaldamento" valore={casa.riscaldamento} onChange={set('riscaldamento')} opzioni={Object.entries(RISCALDAMENTO).map(([v, l]) => ({ v, l }))} colonne={2} />
      </div>

      <div className="ca-h2-row">
        <h2 className="ca-h2">Spese fisse senza bolletta</h2>
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
      ) : <div className="ca-card ca-empty-s">Condominio, TARI, assicurazione casa: aggiungile per avere il costo completo.</div>}

      <h2 className="ca-h2">I tuoi dati</h2>
      <div className="ca-card ca-data">
        <p><Icona nome="lucchetto" size={18} /> Per ora i dati restano solo su questo dispositivo, nel browser. Nessun server li conserva. Con gli account, in arrivo, potrai sincronizzarli tra telefono e computer.</p>
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

// ── Onboarding: tre tocchi ──────────────────────────────────
export function Benvenuto() {
  const [persone, setPersone] = useState(null);
  const [risc, setRisc] = useState(null);
  const [cap, setCap] = useState('');
  const pronto = persone && risc;
  return (
    <section className="ca-page ca-onb">
      <p className="eyebrow">Benvenuto</p>
      <h1 className="display ca-onb-t">Due domande sulla casa,<br /><em>poi pensiamo noi ai conti.</em></h1>

      <div className="ca-onb-q">
        <p className="ca-onb-l"><span className="num">01</span> Quante persone ci vivono?</p>
        <Scelta nome="Persone" valore={persone} onChange={setPersone} opzioni={[1, 2, 3, 4, 5].map((n) => ({ v: n, l: n === 5 ? '5+' : String(n) }))} colonne={5} />
      </div>
      <div className="ca-onb-q">
        <p className="ca-onb-l"><span className="num">02</span> Come si scalda?</p>
        <Scelta nome="Riscaldamento" valore={risc} onChange={setRisc} colonne={2} opzioni={[
          { v: 'gas_autonomo', l: 'Caldaia a gas', sub: 'autonoma', icona: 'gas' },
          { v: 'centralizzato', l: 'Centralizzato', sub: 'del condominio', icona: 'condominio' },
          { v: 'pompa_calore', l: 'Pompa di calore', sub: 'o elettrico', icona: 'luce' },
          { v: 'altro', l: 'Altro', sub: 'o non so', icona: 'altro' },
        ]} />
      </div>
      <div className="ca-onb-q">
        <p className="ca-onb-l"><span className="num">03</span> CAP <span className="ca-muted">facoltativo</span></p>
        <input className="ca-onb-cap num" inputMode="numeric" maxLength={5} value={cap} onChange={(e) => setCap(e.target.value.replace(/\D/g, ''))} placeholder="20100" aria-label="CAP" />
      </div>

      <button className="btn btn-ink ca-onb-go" disabled={!pronto}
        onClick={() => { azioni.creaCasa({ persone, riscaldamento: risc, cap: cap || null }); location.hash = '#/aggiungi'; }}>
        Continua e carica una bolletta <Icona nome="freccia" size={18} />
      </button>
      <p className="ca-privacy"><Icona nome="lucchetto" size={16} /> Nessuna registrazione. I dati restano sul tuo dispositivo.</p>
    </section>
  );
}
