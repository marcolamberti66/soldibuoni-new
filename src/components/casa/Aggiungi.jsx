import { useEffect, useRef, useState } from 'react';
import { conta } from '../../casa/dispositivo.js';
import { azioni } from '../../casa/store.js';
import { CATEGORIE } from '../../casa/model.js';
import { Icona, Percorso } from './ui.jsx';
import { SchedaDocumento, SchedaRicorrente } from './Documento.jsx';
import { leggi } from '../../casa/lettura.js';
import { useAccount } from '../../casa/sync.js';
import Account from './Account.jsx';

export default function Aggiungi({ parametri, vai }) {
  const preset = parametri.get('cat');
  const primo = parametri.get('primo') === '1';
  const acc = useAccount();
  const presetRicorrente = preset && CATEGORIE[preset] && !CATEGORIE[preset].bolletta;
  const tipo = parametri.get('tipo');
  const [fase, setFase] = useState(tipo === 'unatantum' ? 'unatantum' : presetRicorrente || tipo === 'fissa' ? 'ricorrente' : 'scegli');
  const [coda, setCoda] = useState([]);      // documenti da rivedere
  const [stato, setStato] = useState(null);  // { fatti, totale, errori: [] }
  const [salvati, setSalvati] = useState(0);
  const [sopra, setSopra] = useState(false);
  // Per i riparti del condominio: cognome o numero di unità. Resta solo su questo dispositivo.
  const [rif, setRif] = useState(() => { try { return localStorage.getItem('sb_rif') || ''; } catch { return ''; } });
  const [mostraRif, setMostraRif] = useState(false);
  useEffect(() => { try { rif ? localStorage.setItem('sb_rif', rif) : localStorage.removeItem('sb_rif'); } catch {} }, [rif]);
  const inFile = useRef(null), inFoto = useRef(null);
  const inAvanzamento = useRef(false);

  // File arrivati da "Condividi → SoldiBuoni" (app installata): il service worker li ha messi in cache.
  useEffect(() => {
    if (parametri.get('condivisi') !== '1' || !('caches' in window)) return;
    (async () => {
      const c = await caches.open('sb-condivisi');
      const chiavi = await c.keys();
      const files = [];
      for (const k of chiavi) {
        const r = await c.match(k);
        const blob = await r.blob();
        files.push(new File([blob], decodeURIComponent(r.headers.get('x-nome') || 'documento'), { type: blob.type }));
        await c.delete(k);
      }
      history.replaceState(null, '', location.pathname + '#/aggiungi');
      if (files.length) { conta('condivisione', files.length); elabora(files); }
    })().catch(() => {});
  }, []);

  async function elabora(files) {
    const lista = [...files].slice(0, 10);
    if (!lista.length) return;
    setFase('lettura');
    setStato({ fatti: 0, totale: lista.length, errori: [] });
    const trovati = [], errori = [];
    for (let i = 0; i < lista.length; i++) {
      try {
        const r = await leggi(lista[i], { riferimento: rif.trim() });
        r.documenti.forEach((d) => trovati.push({ ...d, fonte: 'ai', affidabilita: r.affidabilita, _file: lista[i].name }));
        (r.spese || []).forEach((x) => trovati.push({
          _spesa: true, _file: lista[i].name, categoria: x.categoria, nome: x.descrizione,
          importo: x.importo ?? null, rate: x.tipo === 'rate' ? x.rate : null,
          frequenza: x.tipo === 'una_tantum' ? 'una_tantum' : x.frequenza || 'annuale',
          prossima_scadenza: x.data || null, data_fine: x.data_fine || null, tasso: x.tasso ?? null,
          tipo_tasso: x.tipo_tasso || null, debito_residuo: x.debito_residuo ?? null, domiciliazione: x.domiciliazione ?? null,
        }));
      } catch (e) {
        if (e.serveRiferimento) setMostraRif(true);
        errori.push({ nome: lista[i].name, msg: e.message });
      }
      setStato({ fatti: i + 1, totale: lista.length, errori: [...errori] });
    }
    if (trovati.length) conta('bolletta_letta', trovati.length);
    if (errori.length) conta('bolletta_errore', errori.length);
    if (!trovati.length && errori.length && errori.length === lista.length && mostraRifDopo(errori)) {
      setFase('scegli');
      return;
    }
    if (!trovati.length && errori.length) {
      setCoda([{ categoria: preset && CATEGORIE[preset]?.bolletta ? preset : 'luce', fonte: 'manuale' }]);
    } else {
      setCoda(trovati);
    }
    setFase('revisione');
  }

  function mostraRifDopo(errori) {
    // Un riparto senza riferimento: si torna al caricamento con il campo in vista e il messaggio.
    return errori.some((e) => /cognome o il numero|Non trovo "/.test(e.msg));
  }
  const confermaSpesa = (r) => {
    azioni.salvaRicorrente(r);
    conta('spesa_letta', r.categoria);
  };
  const conferma = (doc) => {
    const { _file, ...pulito } = doc;
    if (pulito.fonte !== 'ai') conta('voce_manuale', pulito.categoria);
    azioni.aggiungiDocumenti([pulito]);
    setSalvati((n) => n + 1);
    avanza();
  };
  const avanza = () => {
    if (coda.length <= 1) { setCoda([]); setFase('fatto'); }
    else setCoda(coda.slice(1));
  };

  if (fase === 'ricorrente' || fase === 'unatantum') {
    const una = fase === 'unatantum';
    return (
      <section className="ca-page">
        <Testata titolo={una ? 'Spesa una tantum' : 'Spesa fissa'}
          sotto={una ? 'Un conguaglio, una riparazione, una rata straordinaria: importo e data.' : 'Mutuo, condominio, TARI, assicurazione: importo e frequenza, oppure rate di importo diverso.'}
          onIndietro={() => setFase('scegli')} />
        <div className="ca-card">
          <SchedaRicorrente
            iniziale={{ categoria: preset && CATEGORIE[preset] && !CATEGORIE[preset].bolletta ? preset : una ? 'manutenzione' : 'condominio', ...(una ? { frequenza: 'una_tantum' } : {}) }}
            onSalva={(r) => { azioni.salvaRicorrente(r); conta('spesa_fissa', r.categoria); vai(''); }}
          />
        </div>
      </section>
    );
  }

  if (fase === 'lettura') {
    return (
      <section className="ca-page ca-center">
        <div className="ca-reading" aria-live="polite">
          <div className="ca-reading-doc" aria-hidden="true"><span /><span /><span /><span /><i /></div>
          <p className="display ca-reading-t">Sto leggendo {stato.totale > 1 ? `${stato.fatti + 1 > stato.totale ? stato.totale : stato.fatti + 1} di ${stato.totale}` : 'la bolletta'}…</p>
          <p className="ca-muted">Estraggo importi, rate, consumi e scadenze. Il file non viene salvato.</p>
        </div>
      </section>
    );
  }

  if (fase === 'revisione' && coda.length) {
    const d = coda[0];
    return (
      <section className="ca-page">
        <Testata
          titolo={d.fonte === 'ai' ? 'Controlla e conferma' : 'Inserisci i dati'}
          sotto={d.fonte === 'ai'
            ? `Ho letto ${d._file ? '«' + d._file + '»' : 'il documento'}. Correggi solo se qualcosa non torna.${coda.length > 1 ? ` (${coda.length} da confermare)` : ''}`
            : 'Basta l\'importo: il resto è facoltativo ma rende gli avvisi più precisi.'}
          onIndietro={() => { setCoda([]); setFase('scegli'); }}
        />
        {stato?.errori?.length > 0 && (
          <div className="ca-alert warn" role="status">
            <Icona nome="allerta" size={18} />
            <span>{stato.errori.map((e) => `${e.nome}: ${e.msg}`).join(' · ')}</span>
          </div>
        )}
        <div className="ca-card">
          {d._spesa ? <>
            <p className="ca-spesa-k">{d.rate?.length ? `${d.rate.length} rate trovate` : d.frequenza === 'una_tantum' ? 'Spesa una tantum' : 'Spesa fissa'} · controlla importi e date</p>
            <SchedaRicorrente key={coda.length + (d._file || '') + (d.nome || '')} iniziale={(({ _spesa, _file, ...x }) => x)(d)}
              onSalva={(r) => {
                confermaSpesa(r);
                // Con le rate, la scheda salva una voce per rata: si avanza una volta sola.
                if (!inAvanzamento.current) { inAvanzamento.current = true; setTimeout(() => { inAvanzamento.current = false; setSalvati((x) => x + 1); avanza(); }, 0); }
              }} />
            <button type="button" className="ca-link muted ca-spesa-salta" onClick={avanza}>Non mi interessa, salta</button>
          </> : (
            <SchedaDocumento key={coda.length + (d._file || '')} iniziale={d} compatta={d.fonte === 'ai'} onSalva={conferma} onScarta={avanza} etichettaSalva="Conferma" />
          )}
        </div>
      </section>
    );
  }

  if (fase === 'fatto' || (fase === 'revisione' && !coda.length)) {
    return (
      <section className="ca-page ca-center">
        <div className="ca-done">
          <span className="ca-done-ico"><Icona nome="ok" size={30} /></span>
          <p className="display ca-done-t">{salvati ? (salvati === 1 ? 'Aggiunto alla tua casa.' : `${salvati} voci aggiunte.`) : 'Nessuna voce salvata.'}</p>
          <div className="ca-done-act">
            <button className="btn btn-line" onClick={() => { setSalvati(0); setStato(null); setFase('scegli'); }}>Aggiungine un'altra</button>
            <button className="btn btn-ink" onClick={() => vai('')}>{primo ? 'Apri la tua panoramica' : 'Vai alla panoramica'}</button>
          </div>
          {primo && <p className="ca-muted ca-done-n">Passo 3 di 3: la panoramica è la pagina da riaprire ogni settimana.</p>}
        </div>
        {salvati > 0 && !acc.utente && <div className="ca-done-acc"><Account /></div>}
      </section>
    );
  }

  return (
    <section className="ca-page">
      {primo && <Percorso passo={1} />}
      <Testata
        titolo={primo ? 'Ora il primo documento' : 'Aggiungi una spesa'}
        sotto={primo ? 'Una bolletta, le rate del condominio, un avviso TARI: PDF o foto, lo leggo io in pochi secondi.' : 'Bollette, condominio, TARI, F24, mutuo: PDF o foto, li leggo io. Oppure inserisci a mano qui sotto.'}
      />
      {primo && <button className="ca-link ca-salta" onClick={() => vai('')}>Salta, la carico dopo: vai alla panoramica <Icona nome="freccia" size={16} /></button>}
      <div
        className={'ca-drop' + (sopra ? ' over' : '')}
        onDragOver={(e) => { e.preventDefault(); setSopra(true); }}
        onDragLeave={() => setSopra(false)}
        onDrop={(e) => { e.preventDefault(); setSopra(false); elabora(e.dataTransfer.files); }}
      >
        <span className="ca-drop-ico"><Icona nome="upload" size={28} /></span>
        <p className="display ca-drop-t"><span className="ca-hover-only">Trascina qui i documenti</span><span className="ca-touch-only">Carica un documento</span></p>
        <p className="ca-muted">Anche più di uno insieme. Bollette di luce, gas, acqua, internet e telefono; rate e conguagli del condominio, avvisi TARI, F24 IMU, piano del mutuo.</p>
        <div className="ca-drop-btns">
          <button className="btn btn-ink" onClick={() => inFile.current.click()}><Icona nome="upload" size={18} /> Scegli file</button>
          <button className="btn btn-line ca-only-touch" onClick={() => inFoto.current.click()}><Icona nome="camera" size={18} /> Scatta foto</button>
        </div>
        <input ref={inFile} type="file" accept="application/pdf,image/*" multiple hidden onChange={(e) => elabora(e.target.files)} />
        <input ref={inFoto} type="file" accept="image/*" capture="environment" hidden onChange={(e) => elabora(e.target.files)} />
      </div>
      {mostraRif || rif ? (
        <label className={'ca-rif' + (mostraRif ? ' evid' : '')}>
          <span>Documento del condominio con tutte le unità? Scrivi come compari: cognome o numero di unità.</span>
          <input value={rif} onChange={(e) => setRif(e.target.value)} placeholder="Es. Rossi, oppure 55 e 127" maxLength={80} />
          {stato?.errori?.length > 0 && mostraRif && <small>{stato.errori[0].msg}</small>}
        </label>
      ) : (
        <button type="button" className="ca-link muted ca-rif-apri" onClick={() => setMostraRif(true)}>Carichi il riparto del condominio, con tutte le unità?</button>
      )}
      <p className="ca-privacy"><Icona nome="lucchetto" size={16} /> Non salviamo il file: lo legge un servizio di AI (Anthropic), che lo cancella entro 30 giorni. Teniamo solo i numeri: niente nomi, indirizzi, POD, PDR o IBAN.</p>

      <div className="ca-alt">
        <button className="ca-alt-b" onClick={() => { setCoda([{ categoria: preset && CATEGORIE[preset]?.bolletta ? preset : 'luce', fonte: 'manuale' }]); setFase('revisione'); }}>
          <Icona nome="matita" /><span><strong>Inserisci a mano</strong><small>Se non hai il file sottomano</small></span><Icona nome="freccia" size={18} />
        </button>
        <button className="ca-alt-b" onClick={() => setFase('ricorrente')}>
          <Icona nome="ripeti" /><span><strong>Spesa fissa</strong><small>Mutuo, condominio, TARI, assicurazione</small></span><Icona nome="freccia" size={18} />
        </button>
        <button className="ca-alt-b" onClick={() => setFase('unatantum')}>
          <Icona nome="calendario" /><span><strong>Spesa una tantum</strong><small>Conguaglio, riparazione, straordinaria</small></span><Icona nome="freccia" size={18} />
        </button>
      </div>
    </section>
  );
}

export function Testata({ titolo, sotto, onIndietro, destra }) {
  return (
    <header className="ca-head">
      {onIndietro && <button className="ca-icon-btn ca-back" onClick={onIndietro} aria-label="Indietro"><Icona nome="indietro" /></button>}
      <div className="ca-head-t">
        <h1 className="display">{titolo}</h1>
        {sotto && <p className="ca-muted">{sotto}</p>}
      </div>
      {destra}
    </header>
  );
}
