import { useEffect, useRef, useState } from 'react';
import { conta } from '../../casa/dispositivo.js';
import { azioni } from '../../casa/store.js';
import { CATEGORIE } from '../../casa/model.js';
import { Icona, Percorso } from './ui.jsx';
import { SchedaDocumento, SchedaRicorrente } from './Documento.jsx';

// Le foto da telefono pesano 3–8 MB e su iPhone sono HEIC: le ridisegniamo
// in JPEG a 2000px. Più veloce da inviare, leggibile dal modello.
async function preparaFile(file) {
  if (file.type === 'application/pdf') return file;
  if (!file.type.startsWith('image/')) return file;
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.86));
    return new File([blob], (file.name || 'foto').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

async function leggi(file) {
  const fd = new FormData();
  fd.append('file', await preparaFile(file));
  const res = await fetch('/api/casa/estrai', { method: 'POST', body: fd });
  let body = null;
  try { body = await res.json(); } catch { /* risposta non JSON */ }
  if (!res.ok) throw new Error(body?.errore || 'Lettura non riuscita.');
  return body;
}

export default function Aggiungi({ parametri, vai }) {
  const preset = parametri.get('cat');
  const primo = parametri.get('primo') === '1';
  const presetRicorrente = preset && CATEGORIE[preset] && !CATEGORIE[preset].bolletta;
  const [fase, setFase] = useState(presetRicorrente ? 'ricorrente' : 'scegli');
  const [coda, setCoda] = useState([]);      // documenti da rivedere
  const [stato, setStato] = useState(null);  // { fatti, totale, errori: [] }
  const [salvati, setSalvati] = useState(0);
  const [sopra, setSopra] = useState(false);
  const inFile = useRef(null), inFoto = useRef(null);

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
        const r = await leggi(lista[i]);
        r.documenti.forEach((d) => trovati.push({ ...d, fonte: 'ai', affidabilita: r.affidabilita, _file: lista[i].name }));
      } catch (e) {
        errori.push({ nome: lista[i].name, msg: e.message });
      }
      setStato({ fatti: i + 1, totale: lista.length, errori: [...errori] });
    }
    if (trovati.length) conta('bolletta_letta', trovati.length);
    if (errori.length) conta('bolletta_errore', errori.length);
    if (!trovati.length && errori.length) {
      setCoda([{ categoria: preset && CATEGORIE[preset]?.bolletta ? preset : 'luce', fonte: 'manuale' }]);
    } else {
      setCoda(trovati);
    }
    setFase('revisione');
  }

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

  if (fase === 'ricorrente') {
    return (
      <section className="ca-page">
        <Testata titolo="Spesa senza bolletta" sotto="Condominio, TARI, assicurazione casa: basta importo e frequenza." onIndietro={() => setFase('scegli')} />
        <div className="ca-card">
          <SchedaRicorrente
            iniziale={{ categoria: preset && CATEGORIE[preset] ? preset : 'condominio' }}
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
          <p className="ca-muted">Estraggo importi, periodo, consumi e scadenze. Il file non viene salvato.</p>
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
          <SchedaDocumento key={coda.length + (d._file || '')} iniziale={d} compatta={d.fonte === 'ai'} onSalva={conferma} onScarta={avanza} etichettaSalva="Conferma" />
        </div>
      </section>
    );
  }

  if (fase === 'fatto' || (fase === 'revisione' && !coda.length)) {
    return (
      <section className="ca-page ca-center">
        <div className="ca-done">
          <span className="ca-done-ico"><Icona nome="ok" size={30} /></span>
          <p className="display ca-done-t">{salvati ? (salvati === 1 ? 'Aggiunta alla tua casa.' : `${salvati} documenti aggiunti.`) : 'Nessun documento salvato.'}</p>
          <div className="ca-done-act">
            <button className="btn btn-line" onClick={() => { setSalvati(0); setStato(null); setFase('scegli'); }}>Aggiungine un'altra</button>
            <button className="btn btn-ink" onClick={() => vai('')}>{primo ? 'Apri la tua panoramica' : 'Vai alla panoramica'}</button>
          </div>
          {primo && <p className="ca-muted ca-done-n">Passo 3 di 3: la panoramica è la pagina da riaprire ogni settimana.</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="ca-page">
      {primo && <Percorso passo={1} />}
      <Testata
        titolo={primo ? 'Ora la prima bolletta' : 'Aggiungi una spesa'}
        sotto={primo ? 'Luce o gas, PDF dall\'email o foto della carta: la leggo io in pochi secondi. È il modo più rapido per riempire la panoramica.' : 'Carica la bolletta così com\'è: PDF dall\'email o foto della carta.'}
      />
      {primo && <button className="ca-link ca-salta" onClick={() => vai('')}>Salta, la carico dopo: vai alla panoramica <Icona nome="freccia" size={16} /></button>}
      <div
        className={'ca-drop' + (sopra ? ' over' : '')}
        onDragOver={(e) => { e.preventDefault(); setSopra(true); }}
        onDragLeave={() => setSopra(false)}
        onDrop={(e) => { e.preventDefault(); setSopra(false); elabora(e.dataTransfer.files); }}
      >
        <span className="ca-drop-ico"><Icona nome="upload" size={28} /></span>
        <p className="display ca-drop-t"><span className="ca-hover-only">Trascina qui le bollette</span><span className="ca-touch-only">Carica le bollette</span></p>
        <p className="ca-muted">Anche più di una insieme. Leggiamo luce, gas, acqua, internet e telefono.</p>
        <div className="ca-drop-btns">
          <button className="btn btn-ink" onClick={() => inFile.current.click()}><Icona nome="upload" size={18} /> Scegli file</button>
          <button className="btn btn-line ca-only-touch" onClick={() => inFoto.current.click()}><Icona nome="camera" size={18} /> Scatta foto</button>
        </div>
        <input ref={inFile} type="file" accept="application/pdf,image/*" multiple hidden onChange={(e) => elabora(e.target.files)} />
        <input ref={inFoto} type="file" accept="image/*" capture="environment" hidden onChange={(e) => elabora(e.target.files)} />
      </div>
      <p className="ca-privacy"><Icona nome="lucchetto" size={16} /> Il file viene letto e scartato subito. Teniamo solo i numeri: niente nomi, indirizzi, POD, PDR o IBAN.</p>

      <div className="ca-alt">
        <button className="ca-alt-b" onClick={() => { setCoda([{ categoria: preset && CATEGORIE[preset]?.bolletta ? preset : 'luce', fonte: 'manuale' }]); setFase('revisione'); }}>
          <Icona nome="matita" /><span><strong>Inserisci a mano</strong><small>Se non hai il file sottomano</small></span><Icona nome="freccia" size={18} />
        </button>
        <button className="ca-alt-b" onClick={() => setFase('ricorrente')}>
          <Icona nome="ripeti" /><span><strong>Spesa senza bolletta</strong><small>Condominio, TARI, assicurazione</small></span><Icona nome="freccia" size={18} />
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
