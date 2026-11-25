// Lato server: la casa di un utente (sua o condivisa) con tutti i suoi dati.
// Funziona sia con la chiave di servizio sia con il token dell'utente.
import { statoDaRighe } from './email.js';

export async function caricaStatoUtente(db, uid) {
  let casa = null;
  const m = await db.from('case_membri').select('casa_id').eq('user_id', uid).limit(1);
  if (!m.error && m.data?.[0]) {
    const r = await db.from('case').select('*').eq('id', m.data[0].casa_id).maybeSingle();
    casa = r.data || null;
  }
  if (!casa) {
    const r = await db.from('case').select('*').eq('user_id', uid).order('creato_il').limit(1);
    casa = r.data?.[0] || null;
  }
  if (!casa) return statoDaRighe({ casa: null, documenti: [], ricorrenti: [], promemoria: [] });
  const [documenti, ricorrenti, promemoria] = await Promise.all(
    ['documenti', 'ricorrenti', 'promemoria'].map((t) => db.from(t).select('*').eq('casa_id', casa.id)),
  );
  return statoDaRighe({ casa, documenti: documenti.data, ricorrenti: ricorrenti.data, promemoria: promemoria.data });
}
