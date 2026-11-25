import { useEffect, useMemo, useState } from 'react';
import { sb } from '../../casa/sync.js';

// Pagina riservata: legge gli eventi anonimi tramite funzioni del database
// che rispondono solo agli account presenti nella tabella "amministratori".

const FASCE = [['giorno0', 'Primo giorno'], ['g1-7', '1–7 giorni'], ['g8-30', '8–30 giorni'], ['g31-90', '1–3 mesi'], ['g90+', 'Oltre 3 mesi']];
const COLONNE = [
  ['apertura', 'Aperture'], ['ritorni', 'Di chi torna'], ['app', 'Da app'], ['onboarding', 'Nuove case'],
  ['bolletta_letta', 'Bollette lette'], ['bolletta_errore', 'Letture fallite'], ['account', 'Accessi'], ['push_attivate', 'Notifiche attivate'],
];
const n0 = (n) => (n || 0).toLocaleString('it-IT');
const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');

function lunedi(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
const dataBreve = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

export default function Statistiche() {
  const [stato, setStato] = useState('carico');
  const [righe, setRighe] = useState([]);
  const [totali, setTotali] = useState({});

  useEffect(() => {
    (async () => {
      const { data: s } = await sb().auth.getSession();
      if (!s.session) return setStato('anonimo');
      const [ev, tot] = await Promise.all([sb().rpc('statistiche', { giorni: 120 }), sb().rpc('statistiche_totali')]);
      if (ev.error || tot.error) return setStato('errore');
      if (!tot.data?.length) return setStato('negato');
      setRighe(ev.data || []);
      setTotali(Object.fromEntries(tot.data.map((r) => [r.voce, Number(r.n)])));
      setStato('ok');
    })().catch(() => setStato('errore'));
  }, []);

  const calcolo = useMemo(() => {
    const oggi = new Date().toISOString().slice(0, 10);
    const da = (g) => new Date(Date.now() - g * 86400000).toISOString().slice(0, 10);
    const somma = (filtro) => righe.filter(filtro).reduce((t, r) => t + Number(r.n), 0);
    const ultimi = (g, nome, extra = () => true) => somma((r) => r.giorno > da(g) && r.nome === nome && extra(r));

    const settimane = new Map();
    for (const r of righe) {
      const k = lunedi(r.giorno);
      const s = settimane.get(k) || {};
      const n = Number(r.n);
      s[r.nome] = (s[r.nome] || 0) + n;
      if (r.nome === 'apertura') {
        if (r.dettaglio && !r.dettaglio.startsWith('giorno0')) s.ritorni = (s.ritorni || 0) + n;
        if (r.dettaglio?.includes('·app')) s.app = (s.app || 0) + n;
      }
      settimane.set(k, s);
    }
    const fasce = FASCE.map(([k, l]) => [l, ultimi(30, 'apertura', (r) => r.dettaglio?.startsWith(k))]);
    const maxFascia = Math.max(1, ...fasce.map((f) => f[1]));
    const imbuto = [
      ['Nuove case', ultimi(30, 'onboarding')],
      ['Bollette lette', ultimi(30, 'bolletta_letta')],
      ['Accessi con email', ultimi(30, 'account')],
      ['Notifiche attivate', ultimi(30, 'push_attivate')],
    ];
    return {
      oggi,
      aperture7: ultimi(7, 'apertura'),
      ritorni7: ultimi(7, 'apertura', (r) => r.dettaglio && !r.dettaglio.startsWith('giorno0')),
      app30: ultimi(30, 'apertura', (r) => r.dettaglio?.includes('·app')),
      aperture30: ultimi(30, 'apertura'),
      bollette30: ultimi(30, 'bolletta_letta'),
      errori30: ultimi(30, 'bolletta_errore'),
      settimane: [...settimane.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12),
      fasce, maxFascia, imbuto,
    };
  }, [righe]);

  if (stato === 'carico') return <div className="st-vuoto" aria-busy="true">Carico…</div>;
  if (stato === 'anonimo') return <div className="st-vuoto"><p>Accedi prima da <a href="/casa#/casa">La tua casa</a> con l'account del proprietario, poi torna qui.</p></div>;
  if (stato === 'negato') return <div className="st-vuoto"><p>Questo account non è abilitato a vedere le statistiche.</p></div>;
  if (stato === 'errore') return <div className="st-vuoto"><p>Lettura non riuscita. Controlla che la migrazione 2 sia stata eseguita su Supabase.</p></div>;

  const c = calcolo;
  return (
    <div className="st">
      <div className="st-kpi">
        <div><span>Aperture, 7 giorni</span><b className="num">{n0(c.aperture7)}</b><small>{pct(c.ritorni7, c.aperture7)} da chi torna</small></div>
        <div><span>Da app installata, 30 giorni</span><b className="num">{pct(c.app30, c.aperture30)}</b><small>{n0(c.app30)} su {n0(c.aperture30)}</small></div>
        <div><span>Bollette lette, 30 giorni</span><b className="num">{n0(c.bollette30)}</b><small>{c.errori30 ? (c.errori30 === 1 ? '1 lettura fallita' : `${n0(c.errori30)} letture fallite`) : 'nessuna lettura fallita'}</small></div>
        <div><span>Account in totale</span><b className="num">{n0(totali.account)}</b><small>{n0(totali.case)} case sincronizzate</small></div>
      </div>

      <div className="st-due">
        <section>
          <h2 className="st-h">Chi apre l'app, per anzianità <small>ultimi 30 giorni</small></h2>
          <ul className="st-barre">
            {c.fasce.map(([l, v]) => (
              <li key={l}><span>{l}</span><i><em style={{ width: (v / c.maxFascia) * 100 + '%' }} /></i><b className="num">{n0(v)}</b></li>
            ))}
          </ul>
          <p className="st-nota">Le aperture oltre il primo giorno sono il segnale che conta: vuol dire che l'app viene ripresa in mano.</p>
        </section>
        <section>
          <h2 className="st-h">Dal primo uso all'abitudine <small>ultimi 30 giorni</small></h2>
          <ol className="st-imbuto">
            {c.imbuto.map(([l, v], i) => (
              <li key={l}><span className="st-imbuto-n">{['I', 'II', 'III', 'IV'][i]}</span><span>{l}</span><b className="num">{n0(v)}</b></li>
            ))}
          </ol>
          <p className="st-nota">Totali: {n0(totali.documenti)} documenti, {n0(totali.spese_fisse)} spese fisse, {n0(totali.email_lunedi)} iscritti all'email del lunedì, {n0(totali.dispositivi_push)} dispositivi con notifiche.</p>
        </section>
      </div>

      <h2 className="st-h">Settimana per settimana</h2>
      <div className="st-tab-wrap">
        <table className="st-tab">
          <thead><tr><th>Settimana</th>{COLONNE.map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
          <tbody>
            {c.settimane.length ? c.settimane.map(([k, s]) => (
              <tr key={k}><td>dal {dataBreve(k)}</td>{COLONNE.map(([kk]) => <td key={kk} className="num">{s[kk] ? n0(s[kk]) : '·'}</td>)}</tr>
            )) : <tr><td colSpan={COLONNE.length + 1} className="st-nota">Ancora nessun evento registrato.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="st-nota">Conteggi anonimi senza cookie né identificativi: ogni riga è un evento, non una persona. Le visite da computer di sviluppo e dai test automatici non sono contate.</p>
    </div>
  );
}
