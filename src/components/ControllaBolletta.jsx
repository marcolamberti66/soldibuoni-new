import { useEffect, useRef, useState } from 'react';
import { leggi } from '../casa/lettura.js';
import { mettiInAttesa } from '../casa/store.js';
import { conta } from '../casa/dispositivo.js';
import { CATEGORIE, RIFERIMENTO_ARERA, costoUnitarioPieno, eur, num, dataBreve, oggiISO } from '../casa/model.js';
import { Icona, IconaCategoria } from './casa/ui.jsx';

// ─────────────────────────────────────────────────────────────
// "Controlla la tua bolletta": un PDF o una foto, dieci secondi,
// nessuna registrazione. Il risultato dice quanto paghi davvero e
// cosa conviene fare; poi propone di tenerla d'occhio nella casa.
// ─────────────────────────────────────────────────────────────

const FASI = ['Riconosco il fornitore', 'Leggo periodo e consumi', 'Separo energia, rete e imposte', 'Cerco le scadenze'];
const giorniTra = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const energia = (d) => d.categoria === 'luce' || d.categoria === 'gas';

function osservazioni(d) {
  const out = [];
  const oggi = oggiISO();
  const u = d.unita || (d.categoria === 'gas' ? 'Smc' : 'kWh');
  const pieno = costoUnitarioPieno(d);

  if (pieno && Number(d.prezzo_materia) > 0) {
    const quota = Math.round(((Number(d.prezzo_materia) * Number(d.consumo)) / Number(d.importo)) * 100);
    if (quota > 0 && quota < 100) {
      out.push({ l: 'info', t: `La materia prima, ${eur(d.prezzo_materia, 3)}/${u}, pesa circa il ${quota}% della bolletta.`,
        s: 'È l\'unica parte su cui i fornitori si fanno concorrenza: trasporto, oneri e imposte sono uguali per tutti.' });
    }
  }

  if (d.fine_condizioni) {
    const g = giorniTra(oggi, d.fine_condizioni);
    if (g < 0) out.push({ l: 'warn', t: `Le condizioni economiche sono scadute il ${dataBreve(d.fine_condizioni)}.`,
      s: 'Probabilmente stai pagando il prezzo di rinnovo: controlla la comunicazione del fornitore e confronta.', g: '/guida/cambiare-fornitore-luce-gas' });
    else if (g <= 90) out.push({ l: 'warn', t: `Il prezzo cambia tra ${g} giorni, il ${dataBreve(d.fine_condizioni)}.`,
      s: 'È il momento giusto per confrontare: cambiare fornitore è gratis e non interrompe la fornitura.', g: '/guida/cambiare-fornitore-luce-gas' });
    else out.push({ l: 'ok', t: `Prezzo valido fino al ${dataBreve(d.fine_condizioni)}.`, s: 'Nessuna fretta: conviene ricontrollare un mese prima di quella data.' });
  }

  if (d.consumi_stimati) out.push({ l: 'warn', t: 'I consumi di questa bolletta sono stimati.',
    s: d.categoria === 'gas' ? 'Manda l\'autolettura alla prossima finestra: eviti il conguaglio.' : 'Se succede spesso, chiedi al fornitore una lettura effettiva.', g: '/guida/autolettura-contatore' });

  if (d.conguaglio) out.push({ l: 'info', t: 'Questa bolletta contiene un conguaglio.',
    s: 'Ricalcola i consumi passati sulla base di una lettura reale. Controlla il periodo a cui si riferisce.', g: '/guida/conguaglio-bolletta' });

  const rif = RIFERIMENTO_ARERA[d.categoria];
  if (rif && Number(d.consumo_annuo_dichiarato) > 0) {
    const diff = Math.round((Number(d.consumo_annuo_dichiarato) / rif.annuo - 1) * 100);
    out.push({ l: 'info', t: `Consumi in un anno: ${num(d.consumo_annuo_dichiarato)} ${rif.unita}, ${Math.abs(diff) < 5 ? 'in linea con il cliente tipo ARERA' : diff > 0 ? `${diff}% in più del cliente tipo ARERA` : `${-diff}% in meno del cliente tipo ARERA`}.`,
      s: rif.nota + '. Dipende molto da quante persone vivono in casa e da come ti riscaldi.' });
  }

  if (d.tipo_prezzo === 'variabile') out.push({ l: 'info', t: 'Hai un prezzo variabile.', s: 'Segue il mercato all\'ingrosso mese per mese: d\'inverno può salire.' });
  if (d.tipo_prezzo === 'fisso' && !d.fine_condizioni) out.push({ l: 'info', t: 'Hai un prezzo fisso, ma in bolletta non trovo fino a quando.', s: 'Cerca la data nel contratto o nell\'area clienti: dopo quella data il prezzo cambia.' });

  if (d.scadenza_pagamento) {
    const g = giorniTra(oggi, d.scadenza_pagamento);
    if (g >= 0) out.push({ l: d.domiciliazione ? 'ok' : 'info', t: d.domiciliazione ? `Addebito automatico il ${dataBreve(d.scadenza_pagamento)}.` : `Da pagare entro il ${dataBreve(d.scadenza_pagamento)}.`, s: g <= 7 ? `Mancano ${g} giorni.` : null });
  }
  return out;
}

function Referto({ d }) {
  const cat = CATEGORIE[d.categoria] || CATEGORIE.altro;
  const pieno = costoUnitarioPieno(d);
  const u = d.unita || (d.categoria === 'gas' ? 'Smc' : 'kWh');
  const oss = osservazioni(d);
  return (
    <article className="cb-ref">
      <header className="cb-ref-h">
        <IconaCategoria cat={d.categoria} />
        <div>
          <p className="cb-ref-k">{cat.label}{d.fornitore ? ` · ${d.fornitore}` : ''}</p>
          <p className="cb-ref-o">{d.offerta || 'Offerta non indicata'}{d.periodo_dal && d.periodo_al ? ` · dal ${dataBreve(d.periodo_dal)} al ${dataBreve(d.periodo_al)}` : ''}</p>
        </div>
      </header>

      {energia(d) && pieno ? (
        <div className="cb-big">
          <p className="cb-big-k">Quanto paghi davvero</p>
          <p className="cb-big-v"><span className="num"><span className="cb-e">€</span>{eur(pieno, 3).replace(/^€\s*/, '')}</span><small>al {u}, tutto compreso</small></p>
          <p className="cb-big-s">È il totale della bolletta diviso i consumi: energia, trasporto, oneri, imposte e quota fissa. È il numero giusto per confrontare offerte diverse.</p>
        </div>
      ) : null}

      <dl className="cb-kpi">
        <div><dt>Importo</dt><dd className="num">{eur(d.importo, 2)}</dd></div>
        {Number(d.consumo) > 0 && <div><dt>Consumo</dt><dd className="num">{num(d.consumo)} {u}</dd></div>}
        {Number(d.quota_fissa_mese) > 0 && <div><dt>Quota fissa</dt><dd className="num">{eur(d.quota_fissa_mese, 2)}/mese</dd></div>}
        {Number(d.canone_mensile) > 0 && <div><dt>Canone</dt><dd className="num">{eur(d.canone_mensile, 2)}/mese</dd></div>}
        {d.tipo_prezzo && <div><dt>Prezzo</dt><dd>{d.tipo_prezzo === 'tutela' ? 'tutela' : d.tipo_prezzo}</dd></div>}
      </dl>

      {oss.length > 0 && (
        <ul className="cb-oss">
          {oss.map((o, i) => (
            <li key={i} className={o.l}>
              <span className="cb-oss-i" aria-hidden="true"><Icona nome={o.l === 'warn' ? 'allerta' : o.l === 'ok' ? 'ok' : 'documento'} size={16} /></span>
              <span><strong>{o.t}</strong>{o.s && <small>{o.s}</small>}{o.g && <a href={o.g}>Approfondisci</a>}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function ControllaBolletta() {
  const [fase, setFase] = useState('vuota'); // vuota | lettura | fatto | errore
  const [docs, setDocs] = useState([]);
  const [errore, setErrore] = useState(null);
  const [passo, setPasso] = useState(0);
  const [sopra, setSopra] = useState(false);
  const inFile = useRef(null), inFoto = useRef(null), risultato = useRef(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => { setMobile(/Android|iPhone|iPad/.test(navigator.userAgent)); }, []);

  useEffect(() => {
    if (fase !== 'lettura') return;
    setPasso(0);
    const t = setInterval(() => setPasso((p) => Math.min(p + 1, FASI.length - 1)), 2200);
    return () => clearInterval(t);
  }, [fase]);

  async function controlla(file) {
    if (!file) return;
    setErrore(null); setFase('lettura');
    try {
      const r = await leggi(file);
      const lista = (r.documenti || []).map((d) => ({ ...d, fonte: 'ai', affidabilita: r.affidabilita }));
      if (!lista.length) throw new Error('Non trovo una bolletta in questo file. Prova con il PDF originale o una foto più nitida.');
      setDocs(lista); setFase('fatto');
      conta('controllo', lista[0].categoria);
      setTimeout(() => risultato.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } catch (e) {
      setErrore(e.message || 'Lettura non riuscita.'); setFase('errore');
      conta('controllo_errore');
    }
  }

  function tienila() {
    mettiInAttesa(docs);
    location.href = '/casa';
  }

  const drop = {
    onDragOver: (e) => { e.preventDefault(); setSopra(true); },
    onDragLeave: () => setSopra(false),
    onDrop: (e) => { e.preventDefault(); setSopra(false); controlla(e.dataTransfer.files[0]); },
  };

  return (
    <div className="cb">
      {(fase === 'vuota' || fase === 'errore') && (
        <div className={'cb-drop' + (sopra ? ' sopra' : '')} {...drop}>
          <span className="cb-drop-i" aria-hidden="true"><Icona nome="documento" size={26} /></span>
          <p className="cb-drop-t">{mobile ? 'Fotografa la bolletta o scegli il PDF' : 'Trascina qui la bolletta'}</p>
          <p className="cb-drop-s">Luce o gas, PDF dall'email o foto della carta. Leggiamo anche internet e acqua.</p>
          <div className="cb-drop-a">
            <button className="btn btn-ink" onClick={() => inFile.current.click()}><Icona nome="upload" size={17} /> Scegli il file</button>
            {mobile && <button className="btn btn-line" onClick={() => inFoto.current.click()}><Icona nome="camera" size={17} /> Scatta una foto</button>}
          </div>
          <input ref={inFile} type="file" accept="application/pdf,image/*" hidden onChange={(e) => controlla(e.target.files[0])} />
          <input ref={inFoto} type="file" accept="image/*" capture="environment" hidden onChange={(e) => controlla(e.target.files[0])} />
          {fase === 'errore' && <p className="cb-err" role="alert">{errore}</p>}
          <p className="cb-priv"><Icona nome="scudo" size={15} /> Il file viene letto e scartato subito: non lo salviamo. Niente registrazione.</p>
        </div>
      )}

      {fase === 'lettura' && (
        <div className="cb-drop cb-leggo" aria-live="polite" aria-busy="true">
          <span className="cb-spin" aria-hidden="true" />
          <ol className="cb-fasi">
            {FASI.map((f, i) => <li key={f} className={i < passo ? 'fatto' : i === passo ? 'ora' : ''}>{f}</li>)}
          </ol>
        </div>
      )}

      {fase === 'fatto' && (
        <div ref={risultato} className="cb-ris">
          {docs.map((d, i) => <Referto key={i} d={d} />)}
          <aside className="cb-cta">
            <p className="cb-cta-k">Il passo dopo</p>
            <h2 className="cb-cta-t">Tienila d'occhio <em>senza pensarci.</em></h2>
            <p>Crea la tua casa con questa bolletta già dentro: ti avvisiamo prima che il prezzo cambi, quando arriva un conguaglio e il giorno delle scadenze. Gratis, nessuno ci paga per farti cambiare fornitore.</p>
            <div className="cb-cta-a">
              <button className="btn btn-ink" onClick={tienila}>Crea la mia casa con questa bolletta <Icona nome="freccia" size={17} /></button>
              <button className="btn btn-line" onClick={() => { setDocs([]); setFase('vuota'); }}>Controlla un'altra bolletta</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
