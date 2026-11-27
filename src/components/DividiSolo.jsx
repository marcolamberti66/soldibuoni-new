import { useEffect, useMemo, useState } from 'react';
import { ripartisci, saldi, pareggio, euro } from '../casa/conti.js';

// Dividi le spese, versione libera: senza account, i dati restano nel browser.
// Stessa logica dei conti di "La tua casa" (centesimi interi, minimo di passaggi).
const CHIAVE = 'sb_dividi_solo';
const nuovoId = () => Math.random().toString(36).slice(2, 10);
const fmt = (n) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const numero = (v) => { const x = Number(String(v).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return Number.isFinite(x) ? x : 0; };

function iniziale() {
  try { const s = JSON.parse(localStorage.getItem(CHIAVE)); if (s?.persone?.length) return s; } catch {}
  return { persone: [{ id: nuovoId(), nome: '' }, { id: nuovoId(), nome: '' }], spese: [] };
}

export default function DividiSolo() {
  const [st, setSt] = useState(null);
  const [nuova, setNuova] = useState({ descrizione: '', importo: '', pagato_da: '', tra: null });
  useEffect(() => { setSt(iniziale()); }, []);
  useEffect(() => { if (st) try { localStorage.setItem(CHIAVE, JSON.stringify(st)); } catch {} }, [st]);

  const persone = st?.persone.filter((p) => p.nome.trim()) || [];
  const nome = (id) => st?.persone.find((p) => p.id === id)?.nome || '—';
  const conti = useMemo(() => {
    if (!st) return { s: {}, passaggi: [], totale: 0 };
    const movimenti = st.spese.map((x) => ({ tipo: 'spesa', importo: x.importo, pagato_da: x.pagato_da, quote: x.quote }));
    const s = saldi(movimenti, st.persone);
    return { s, passaggi: pareggio(s), totale: st.spese.reduce((t, x) => t + x.importo, 0) };
  }, [st]);

  if (!st) return <div className="dv-boot" aria-busy="true" />;

  const setPersona = (id, nome) => setSt((x) => ({ ...x, persone: x.persone.map((p) => (p.id === id ? { ...p, nome } : p)) }));
  const togliPersona = (id) => {
    if (st.spese.some((x) => x.pagato_da === id || id in (x.quote || {}))) { alert('Questa persona compare in una spesa: togli prima quella spesa.'); return; }
    setSt((x) => ({ ...x, persone: x.persone.filter((p) => p.id !== id) }));
  };
  const tra = nuova.tra || persone.map((p) => p.id);
  const pagante = nuova.pagato_da || persone[0]?.id || '';
  const importo = numero(nuova.importo);
  const valida = persone.length >= 2 && importo > 0 && pagante && tra.length > 0;

  const aggiungi = (e) => {
    e.preventDefault();
    if (!valida) return;
    const quote = ripartisci(importo, 'uguale', tra);
    setSt((x) => ({ ...x, spese: [{ id: nuovoId(), descrizione: nuova.descrizione.trim() || 'Spesa', importo, pagato_da: pagante, quote, data: new Date().toISOString().slice(0, 10) }, ...x.spese] }));
    setNuova({ descrizione: '', importo: '', pagato_da: pagante, tra: null });
  };
  const toggleTra = (id) => {
    const set = new Set(tra);
    set.has(id) ? set.delete(id) : set.add(id);
    setNuova((n) => ({ ...n, tra: [...set] }));
  };
  const testo = () => [
    `Conti di casa · totale ${fmt(conti.totale)}`,
    ...conti.passaggi.map((p) => `${nome(p.da)} dà ${fmt(p.importo)} a ${nome(p.a)}`),
    conti.passaggi.length ? '' : 'Siamo pari.',
    'Calcolato con soldibuoni.it/dividi',
  ].filter(Boolean).join('\n');
  const condividi = async () => {
    const t = testo();
    try { if (navigator.share) { await navigator.share({ text: t }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(t); alert('Riepilogo copiato: incollalo nella chat di casa.'); } catch { prompt('Copia il riepilogo:', t); }
  };

  return (
    <div className="dv">
      <section className="dv-card">
        <h2 className="dv-h"><span>1</span> Chi divide</h2>
        <div className="dv-pers">
          {st.persone.map((p, i) => (
            <div className="dv-p" key={p.id}>
              <input value={p.nome} onChange={(e) => setPersona(p.id, e.target.value)} placeholder={['Tu', 'Giulia', 'Marco', 'Sara'][i] || 'Nome'} aria-label={`Persona ${i + 1}`} maxLength={24} />
              {st.persone.length > 2 && <button type="button" className="dv-x" onClick={() => togliPersona(p.id)} aria-label={`Togli ${p.nome || 'persona'}`}>×</button>}
            </div>
          ))}
        </div>
        {st.persone.length < 10 && <button type="button" className="dv-link" onClick={() => setSt((x) => ({ ...x, persone: [...x.persone, { id: nuovoId(), nome: '' }] }))}>+ Aggiungi una persona</button>}
      </section>

      <section className="dv-card">
        <h2 className="dv-h"><span>2</span> Le spese</h2>
        {persone.length < 2 ? <p className="dv-muted">Scrivi almeno due nomi qui sopra.</p> : (
          <form className="dv-form" onSubmit={aggiungi}>
            <div className="dv-row">
              <label className="dv-f dv-f-w"><span>Cosa</span><input value={nuova.descrizione} onChange={(e) => setNuova({ ...nuova, descrizione: e.target.value })} placeholder="Bolletta luce, spesa, affitto…" maxLength={60} /></label>
              <label className="dv-f"><span>Quanto</span><input inputMode="decimal" className="num" value={nuova.importo} onChange={(e) => setNuova({ ...nuova, importo: e.target.value })} placeholder="0,00" /></label>
              <label className="dv-f"><span>Ha pagato</span>
                <select value={pagante} onChange={(e) => setNuova({ ...nuova, pagato_da: e.target.value })}>
                  {persone.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </label>
            </div>
            <fieldset className="dv-tra"><legend>Divisa tra</legend>
              {persone.map((p) => (
                <label key={p.id} className={'dv-chip' + (tra.includes(p.id) ? ' on' : '')}><input type="checkbox" checked={tra.includes(p.id)} onChange={() => toggleTra(p.id)} />{p.nome}</label>
              ))}
            </fieldset>
            <button className="btn btn-ink" disabled={!valida}>Aggiungi spesa</button>
          </form>
        )}
        {st.spese.length > 0 && (
          <ul className="dv-list">
            {st.spese.map((x) => (
              <li key={x.id}>
                <span className="dv-l-t">{x.descrizione}<small>pagata da {nome(x.pagato_da)} · tra {Object.keys(x.quote).length}</small></span>
                <span className="num dv-l-v">{fmt(x.importo)}</span>
                <button type="button" className="dv-x" aria-label={`Elimina ${x.descrizione}`} onClick={() => setSt((s) => ({ ...s, spese: s.spese.filter((y) => y.id !== x.id) }))}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dv-card dv-res" aria-live="polite">
        <h2 className="dv-h"><span>3</span> Chi deve a chi</h2>
        {!st.spese.length ? <p className="dv-muted">Aggiungi una spesa e qui compare il conto, con il minimo di passaggi di denaro.</p> : <>
          <p className="dv-tot">Totale speso <b className="num">{fmt(conti.totale)}</b></p>
          {conti.passaggi.length ? (
            <ul className="dv-pass">
              {conti.passaggi.map((p, i) => <li key={i}><b>{nome(p.da)}</b> dà <b className="num">{fmt(p.importo)}</b> a <b>{nome(p.a)}</b></li>)}
            </ul>
          ) : <p className="dv-pari">Siete pari.</p>}
          <div className="dv-sal">
            {st.persone.filter((p) => p.nome.trim()).map((p) => {
              const v = euro(conti.s[p.id] || 0);
              return <span key={p.id}>{p.nome}: <b className={'num ' + (v > 0 ? 'pos' : v < 0 ? 'neg' : '')}>{v > 0 ? '+' : ''}{fmt(v)}</b></span>;
            })}
          </div>
          <div className="dv-act">
            <button type="button" className="btn btn-ink" onClick={condividi}>Condividi il conto</button>
            <button type="button" className="btn btn-line" onClick={() => { if (confirm('Ricominciare da zero? Le spese inserite vengono cancellate.')) setSt({ ...st, spese: [] }); }}>Azzera le spese</button>
          </div>
        </>}
      </section>
    </div>
  );
}
