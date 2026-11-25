import { useEffect, useState } from 'react';
import { immagineSezione } from '../../casa/sezione.js';
import { conta } from '../../casa/dispositivo.js';
import { Foglio, Icona, Scelta } from './ui.jsx';

/** Pulsante + foglio: la sezione della casa come immagine da condividere. */
export default function SezioneCasa({ voci }) {
  const [aperto, setAperto] = useState(false);
  const [importi, setImporti] = useState(true);
  const [img, setImg] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!aperto) return;
    let vivo = true, url = null;
    setImg(null);
    immagineSezione(voci, { importi }).then((r) => { url = r.url; if (vivo) setImg(r); });
    return () => { vivo = false; if (url) URL.revokeObjectURL(url); };
  }, [aperto, importi, voci]);

  async function condividi() {
    if (!img) return;
    setMsg(null);
    const file = new File([img.blob], 'la-mia-casa-soldibuoni.png', { type: 'image/png' });
    const testo = 'La sezione economica della mia casa. Fatta con soldibuoni.it';
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: testo }); conta('sezione_condivisa', importi ? 'importi' : 'percentuali'); return; }
      catch (e) { if (e?.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = img.url; a.download = file.name; a.click();
    conta('sezione_condivisa', 'download');
    setMsg('Immagine scaricata.');
  }

  if (voci.length < 2) return null;
  return (
    <>
      <button className="ca-sez-btn" onClick={() => setAperto(true)}>
        <span className="ca-sez-ico" aria-hidden="true"><Icona nome="casa" size={18} /></span>
        <span><strong>La sezione della tua casa</strong><small>Un'immagine da condividere, con importi o solo percentuali</small></span>
        <Icona nome="freccia" size={16} />
      </button>
      <Foglio aperto={aperto} onChiudi={() => setAperto(false)} titolo="La sezione della tua casa"
        piede={<button className="btn btn-ink" disabled={!img} onClick={condividi}><Icona nome="condividi" size={17} /> Condividi l'immagine</button>}>
        <Scelta nome="Cosa mostrare" colonne={2} valore={importi} onChange={setImporti}
          opzioni={[{ v: true, l: 'Con gli importi' }, { v: false, l: 'Solo percentuali' }]} />
        <div className="ca-sez-prev">
          {img ? <img src={img.url} alt="Anteprima: la sezione economica della tua casa" /> : <span className="ca-sez-wait" aria-busy="true">Disegno…</span>}
        </div>
        <p className="ca-muted small" style={{ marginTop: 10 }}>{msg || 'L\'immagine si crea sul tuo telefono: non la riceviamo né la salviamo.'}</p>
      </Foglio>
    </>
  );
}
