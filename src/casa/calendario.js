// ─────────────────────────────────────────────────────────────
// Esporta le scadenze della casa in un file .ics: un tocco e
// finiscono nel calendario del telefono, con un promemoria
// qualche giorno prima. Nessun account, nessun server.
// ─────────────────────────────────────────────────────────────
import { CATEGORIE, FREQUENZE, oggiISO, dataDoc } from './model.js';

const d8 = (iso) => iso.replace(/-/g, '');
const giornoDopo = (iso) => {
  const x = new Date(iso + 'T00:00:00'); x.setDate(x.getDate() + 1);
  return x.toISOString().slice(0, 10).replace(/-/g, '');
};
const esc = (t) => String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const eur = (n) => (n ? ' · € ' + Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');

function evento({ uid, data, titolo, descrizione, rrule, anticipo = 2 }) {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@soldibuoni.it`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    `DTSTART;VALUE=DATE:${d8(data)}`,
    `DTEND;VALUE=DATE:${giornoDopo(data)}`,
    `SUMMARY:${esc(titolo)}`,
    descrizione ? `DESCRIPTION:${esc(descrizione)}` : null,
    rrule ? `RRULE:${rrule}` : null,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(titolo)}`, `TRIGGER:-P${anticipo}D`, 'END:VALARM',
    'END:VEVENT',
  ].filter(Boolean).join('\r\n');
}

export function creaICS(stato) {
  const oggi = oggiISO();
  const ev = [];

  for (const d of stato.documenti) {
    if (d.scadenza_pagamento && d.scadenza_pagamento >= oggi && !d.pagato) {
      const c = CATEGORIE[d.categoria]?.label || 'Bolletta';
      ev.push(evento({
        uid: 'pag-' + d.id, data: d.scadenza_pagamento,
        titolo: `${d.domiciliazione ? 'Addebito' : 'Pagare'} ${c.toLowerCase()}${d.fornitore ? ' ' + d.fornitore : ''}${eur(d.importo)}`,
        descrizione: d.domiciliazione ? 'Addebito automatico: verifica la disponibilità sul conto.' : 'Da pagare entro oggi.',
      }));
    }
  }

  const ultimi = {};
  for (const d of stato.documenti) {
    if (!d.fine_condizioni) continue;
    if (!ultimi[d.categoria] || (dataDoc(d) || '') > (dataDoc(ultimi[d.categoria]) || '')) ultimi[d.categoria] = d;
  }
  for (const d of Object.values(ultimi)) {
    if (d.fine_condizioni < oggi) continue;
    const tlc = d.categoria === 'internet' || d.categoria === 'mobile';
    ev.push(evento({
      uid: 'cond-' + d.id, data: d.fine_condizioni, anticipo: 30,
      titolo: `${tlc ? 'Fine promozione' : 'Scadono le condizioni'} ${CATEGORIE[d.categoria]?.label.toLowerCase()}${d.fornitore ? ' · ' + d.fornitore : ''}`,
      descrizione: 'Controlla il nuovo prezzo e confronta prima del rinnovo.',
    }));
  }

  for (const r of stato.ricorrenti) {
    if (r.attiva === false || !r.prossima_scadenza) continue;
    const mesi = FREQUENZE[r.frequenza]?.mesi || 1;
    const until = r.data_fine ? `;UNTIL=${d8(r.data_fine)}` : '';
    ev.push(evento({
      uid: 'ric-' + r.id, data: r.prossima_scadenza,
      titolo: `${r.nome || CATEGORIE[r.categoria]?.label}${eur(r.importo)}`,
      descrizione: r.domiciliazione ? 'Addebito automatico.' : 'Da pagare.',
      rrule: `FREQ=MONTHLY;INTERVAL=${mesi}${until}`,
    }));
    if (r.categoria === 'affitto' && r.data_fine && r.data_fine >= oggi) {
      ev.push(evento({ uid: 'fine-' + r.id, data: r.data_fine, anticipo: 180, titolo: 'Scade il contratto di affitto', descrizione: 'Verifica i termini di disdetta o rinnovo nel contratto.' }));
    }
  }

  for (const p of stato.promemoria) {
    if (!p.fatto && p.data >= oggi) ev.push(evento({ uid: 'pro-' + p.id, data: p.data, titolo: p.titolo, anticipo: 3 }));
  }

  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SoldiBuoni//La tua casa//IT', 'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Casa · SoldiBuoni', ...ev, 'END:VCALENDAR',
  ].join('\r\n');
}

export function scaricaCalendario(stato) {
  const blob = new Blob([creaICS(stato)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'scadenze-casa.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
