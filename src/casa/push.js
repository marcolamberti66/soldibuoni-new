// ─────────────────────────────────────────────────────────────
// Testo della notifica push del giorno. Regola: al massimo una
// notifica al giorno, e solo se c'è qualcosa che cambia cosa fai
// oggi. Nessuna notifica "di cortesia".
//   · oggi scade/addebita qualcosa;
//   · tra 2 giorni scade un pagamento da fare a mano;
//   · tra 30 e 7 giorni finiscono le condizioni di un'offerta;
//   · tra 180 e 30 giorni finisce l'affitto (preavviso di disdetta);
//   · promemoria del giorno;
//   · il lunedì, se non c'è altro, il totale della settimana.
// ─────────────────────────────────────────────────────────────
import { calcolaScadenze } from './insights.js';
import { oggiISO, addGiorni, eur } from './model.js';

const conImporto = (x) => (x.tipo === 'pagamento' || x.tipo === 'ricorrente') && Number(x.importo) > 0;

function frase(x, quando) {
  const imp = conImporto(x) ? ' · ' + eur(x.importo, 2) : '';
  if (x.tipo === 'fine_condizioni') return `${x.titolo} ${quando}: è il momento di confrontare.`;
  if (x.tipo === 'fine_contratto') return `${x.titolo} ${quando}: controlla i termini di disdetta.`;
  if (x.tipo === 'promemoria') return x.titolo;
  if (x.automatico) return `${x.titolo}${imp} · addebito automatico ${quando}`;
  return `${x.titolo}${imp} · da pagare ${quando}`;
}

export function costruisciPush(stato, { oggi = oggiISO(), sito = 'https://soldibuoni.it' } = {}) {
  if (!stato?.casa) return null;
  const scad = calcolaScadenze(stato, 200);
  const at = (n) => addGiorni(oggi, n);
  const righe = [];

  for (const x of scad) {
    if (x.data === oggi && x.tipo !== 'fine_condizioni' && x.tipo !== 'fine_contratto') righe.push({ p: 0, t: frase(x, 'oggi'), x });
    else if (x.data === at(2) && (x.tipo === 'pagamento' || x.tipo === 'ricorrente') && !x.automatico) righe.push({ p: 1, t: frase(x, 'dopodomani'), x });
    else if (x.tipo === 'fine_condizioni' && (x.data === at(30) || x.data === at(7))) righe.push({ p: 2, t: frase(x, x.data === at(7) ? 'tra una settimana' : 'tra un mese'), x });
    else if (x.tipo === 'fine_contratto' && (x.data === at(180) || x.data === at(30))) righe.push({ p: 2, t: frase(x, x.data === at(30) ? 'tra un mese' : 'tra sei mesi'), x });
  }

  if (!righe.length) {
    const lunedi = new Date(oggi + 'T12:00:00Z').getUTCDay() === 1;
    if (!lunedi) return null;
    const sett = scad.filter((x) => x.data >= oggi && x.data <= at(6) && conImporto(x));
    const tot = sett.reduce((t, x) => t + Number(x.importo), 0);
    if (!tot) return null;
    return {
      titolo: `Questa settimana escono ${eur(tot)}`,
      corpo: sett.slice(0, 3).map((x) => x.titolo).join(' · ') + (sett.length > 3 ? ` e altre ${sett.length - 3}` : ''),
      url: sito + '/casa?origine=push#/scadenze',
      tag: 'sb-' + oggi,
    };
  }

  righe.sort((a, b) => a.p - b.p);
  const prima = righe[0];
  const soloUna = righe.length === 1;
  const titolo = soloUna
    ? (prima.p === 0 ? 'Oggi in casa' : prima.p === 1 ? 'Tra due giorni' : 'Da tenere d\'occhio')
    : `${righe.length} cose per la casa`;
  return {
    titolo,
    corpo: righe.slice(0, 3).map((r) => r.t).join('\n'),
    url: sito + '/casa?origine=push#/' + (soloUna && prima.x.categoria && prima.p === 2 ? 'voce/' + prima.x.categoria : 'scadenze'),
    tag: 'sb-' + oggi,
  };
}
