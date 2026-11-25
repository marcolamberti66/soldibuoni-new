// ─────────────────────────────────────────────────────────────
// L'email del lunedì: cosa esce questa settimana, cosa fare,
// cosa scade nel mese, un consiglio di stagione.
// Usata dalla funzione programmata e dall'anteprima su richiesta.
// ─────────────────────────────────────────────────────────────
import { oggiISO, addGiorni, eur, CATEGORIE } from './model.js';
import { calcolaAvvisi, calcolaScadenze } from './insights.js';
import { consigliDelMese } from './stagione.js';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const giorno = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Ritorna null se non c'è niente di utile da dire questa settimana. */
export function costruisciEmail(stato, { sito = 'https://soldibuoni.it', forza = false } = {}) {
  const oggi = oggiISO();
  const tra7 = addGiorni(oggi, 7), tra30 = addGiorni(oggi, 30);
  const scad = calcolaScadenze(stato, 40);
  const conImporto = (x) => (x.tipo === 'pagamento' || x.tipo === 'ricorrente') && Number(x.importo) > 0;
  const sett = scad.filter((x) => x.data >= oggi && x.data <= tra7);
  const totSett = sett.filter(conImporto).reduce((t, x) => t + Number(x.importo), 0);
  const mese = scad.filter((x) => x.data > tra7 && x.data <= tra30).slice(0, 6);
  const daFare = calcolaAvvisi(stato).filter((a) => a.livello !== 'info').slice(0, 4);
  const consiglio = consigliDelMese(stato.casa)[0];

  if (!forza && !sett.length && !daFare.length && !mese.length) return null;

  const subject = totSett > 0
    ? `Questa settimana escono ${eur(totSett)} per la casa`
    : daFare.length ? `${daFare.length === 1 ? 'Una cosa' : daFare.length + ' cose'} da sistemare in casa`
    : 'La tua casa questa settimana';

  const riga = (x) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e6e0d4;color:#6f6a5e;font-size:13px;white-space:nowrap;vertical-align:top;width:92px">${esc(giorno(x.data))}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e6e0d4;color:#17150f;font-size:15px">${esc(x.titolo)}${x.automatico ? '<br><span style="color:#6f6a5e;font-size:12.5px">addebito automatico</span>' : (conImporto(x) ? '<br><span style="color:#9b4220;font-size:12.5px">da pagare</span>' : '')}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e6e0d4;color:#17150f;font-size:15px;text-align:right;white-space:nowrap;vertical-align:top">${x.importo ? esc(eur(x.importo, 2)) : ''}</td>
    </tr>`;

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#f5f2ec;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#47433a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ec"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbfaf7;border:1px solid #17150f">
  <tr><td style="padding:26px 28px 8px">
    <p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6f6a5e">SoldiBuoni · la tua casa</p>
    <p style="margin:18px 0 4px;font-size:14px;color:#47433a">${totSett > 0 ? 'Questa settimana escono' : 'Questa settimana'}</p>
    <p style="margin:0 0 6px;font-family:'Bodoni 72',Didot,Georgia,serif;font-size:44px;line-height:1.05;color:#17150f">${totSett > 0 ? esc(eur(totSett, 2)) : 'nessun pagamento'}</p>
  </td></tr>
  ${sett.length ? `<tr><td style="padding:8px 28px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #17150f">${sett.map(riga).join('')}</table></td></tr>` : ''}
  ${daFare.length ? `<tr><td style="padding:22px 28px 0">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#9b4220;font-weight:600">Da fare</p>
    ${daFare.map((a) => `<p style="margin:10px 0 0;font-size:15px;line-height:1.45;color:#17150f"><strong>${esc(a.titolo)}</strong><br><span style="color:#47433a;font-size:14px">${esc(a.testo)}</span></p>`).join('')}
  </td></tr>` : ''}
  ${mese.length ? `<tr><td style="padding:22px 28px 0">
    <p style="margin:0 0 2px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6f6a5e">Nel resto del mese</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${mese.map(riga).join('')}</table>
  </td></tr>` : ''}
  ${consiglio ? `<tr><td style="padding:22px 28px 0">
    <div style="background:#ece7dd;padding:16px 18px">
      <p style="margin:0;font-size:15px;color:#17150f"><strong>${esc(consiglio.titolo)}</strong></p>
      <p style="margin:6px 0 0;font-size:14px;line-height:1.5">${esc(consiglio.testo)}</p>
    </div>
  </td></tr>` : ''}
  <tr><td style="padding:26px 28px 28px">
    <a href="${sito}/casa" style="display:inline-block;background:#17150f;color:#f5f2ec;text-decoration:none;padding:13px 22px;border-radius:999px;font-size:15px">Apri la tua casa</a>
  </td></tr>
</table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#6f6a5e">Ricevi questa email perché hai attivato l'email del lunedì su SoldiBuoni. Per non riceverla più, disattivala in <a href="${sito}/casa#/casa" style="color:#47433a">La casa</a>. Nessuna pubblicità, nessuna affiliazione.</p>
</td></tr></table></body></html>`;

  const text = [
    totSett > 0 ? `Questa settimana escono ${eur(totSett, 2)}.` : 'Questa settimana nessun pagamento.',
    ...sett.map((x) => `- ${giorno(x.data)}: ${x.titolo}${x.importo ? ' ' + eur(x.importo, 2) : ''}`),
    daFare.length ? '\nDa fare:' : '', ...daFare.map((a) => `- ${a.titolo}`),
    `\nApri la tua casa: ${sito}/casa`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

/** Ricompone lo stato dell'app a partire dalle righe del database. */
export function statoDaRighe({ casa, documenti, ricorrenti, promemoria }) {
  const pulisci = (r) => Object.fromEntries(Object.entries(r).filter(([k, v]) => v !== null && k !== 'user_id' && k !== 'casa_id'));
  return {
    casa: casa ? pulisci(casa) : null,
    documenti: (documenti || []).map(pulisci),
    ricorrenti: (ricorrenti || []).map(pulisci),
    promemoria: (promemoria || []).map(pulisci),
    avvisi_letti: {},
  };
}

export { CATEGORIE };
