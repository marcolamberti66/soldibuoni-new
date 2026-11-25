// ─────────────────────────────────────────────────────────────
// Motore avvisi e scadenze. Regole deterministiche, ognuna con
// un id stabile (così un avviso archiviato non ricompare finché
// il fatto che lo genera non cambia).
// ─────────────────────────────────────────────────────────────
import {
  CATEGORIE, FREQUENZE, RIFERIMENTO_ARERA, oggiISO, giorniTra, addGiorni, parseISO,
  dataDoc, consumoAnnuo, costoUnitarioPieno, num, dataBreve, eur,
} from './model.js';

const ordineLivello = { urgente: 0, attenzione: 1, info: 2 };

function ultimiDue(docs, cat, campo) {
  const lista = docs
    .filter((d) => d.categoria === cat && Number(d[campo]) > 0)
    .sort((a, b) => (dataDoc(b) || '').localeCompare(dataDoc(a) || ''));
  return [lista[0], lista[1]];
}

function prossimaRicorrenza(r, oggi) {
  if (!r.prossima_scadenza) return null;
  let d = r.prossima_scadenza;
  const mesi = FREQUENZE[r.frequenza]?.mesi || 1;
  let guard = 0;
  while (d < oggi && guard++ < 120) {
    const x = parseISO(d); x.setMonth(x.getMonth() + mesi);
    d = x.toISOString().slice(0, 10);
  }
  return d;
}

export function calcolaScadenze(stato, orizzonteGiorni = 120) {
  const oggi = oggiISO();
  const fine = addGiorni(oggi, orizzonteGiorni);
  const out = [];

  for (const d of stato.documenti) {
    const cat = CATEGORIE[d.categoria]?.label || 'Spesa';
    if (d.scadenza_pagamento && !d.pagato && d.scadenza_pagamento >= addGiorni(oggi, -30) && d.scadenza_pagamento <= fine) {
      out.push({
        id: 'pag-' + d.id, data: d.scadenza_pagamento, categoria: d.categoria, tipo: 'pagamento', docId: d.id,
        titolo: `Pagamento ${cat.toLowerCase()}${d.fornitore ? ' · ' + d.fornitore : ''}`,
        importo: d.importo, automatico: !!d.domiciliazione,
      });
    }
  }

  // Fine condizioni: solo dall'ultimo documento per categoria
  for (const cat of Object.keys(CATEGORIE)) {
    const ultimo = stato.documenti
      .filter((d) => d.categoria === cat && d.fine_condizioni)
      .sort((a, b) => (dataDoc(b) || '').localeCompare(dataDoc(a) || ''))[0];
    if (ultimo && ultimo.fine_condizioni >= addGiorni(oggi, -30) && ultimo.fine_condizioni <= addGiorni(oggi, 400)) {
      out.push({
        id: 'cond-' + ultimo.id, data: ultimo.fine_condizioni, categoria: cat, tipo: 'fine_condizioni', docId: ultimo.id,
        titolo: (cat === 'internet' || cat === 'mobile' ? 'Fine promozione ' : 'Scadono le condizioni ') + CATEGORIE[cat].label.toLowerCase(),
      });
    }
  }

  for (const r of stato.ricorrenti) {
    if (r.attiva === false) continue;
    const d = prossimaRicorrenza(r, oggi);
    if (d && d <= fine) {
      out.push({
        id: 'ric-' + r.id + '-' + d, data: d, categoria: r.categoria, tipo: 'ricorrente', ricId: r.id,
        titolo: r.nome || CATEGORIE[r.categoria]?.label, importo: r.importo, automatico: !!r.domiciliazione,
      });
    }
  }

  for (const r of stato.ricorrenti) {
    if (r.attiva === false || !r.data_fine || r.categoria !== 'affitto') continue;
    if (r.data_fine >= addGiorni(oggi, -30) && r.data_fine <= addGiorni(oggi, Math.max(orizzonteGiorni, 400))) {
      out.push({ id: 'fine-' + r.id, data: r.data_fine, categoria: 'affitto', tipo: 'fine_contratto', ricId: r.id, titolo: 'Scade il contratto di affitto' });
    }
  }

  for (const p of stato.promemoria) {
    if (!p.fatto && p.data && p.data <= fine) {
      out.push({ id: 'pro-' + p.id, data: p.data, categoria: p.categoria || 'altro', tipo: 'promemoria', promId: p.id, titolo: p.titolo });
    }
  }

  return out.sort((a, b) => a.data.localeCompare(b.data));
}

export function calcolaAvvisi(stato) {
  const oggi = oggiISO();
  const casa = stato.casa || {};
  const av = [];

  // 1. Scadenze imminenti (pagamenti non domiciliati, fine condizioni)
  for (const s of calcolaScadenze(stato, 75)) {
    const g = giorniTra(oggi, s.data);
    if (s.tipo === 'pagamento' && !s.automatico && g <= 14) {
      av.push({
        id: s.id, livello: g < 0 ? 'urgente' : g <= 5 ? 'urgente' : 'attenzione', categoria: s.categoria,
        titolo: g < 0 ? `Pagamento scaduto da ${-g} giorni` : g === 0 ? 'Pagamento in scadenza oggi' : `Pagamento tra ${g} giorni`,
        testo: `${s.titolo}: ${eur(s.importo, 2)} entro il ${dataBreve(s.data)}. Se l'hai già pagata, segnala come pagata.`,
        azione: { tipo: 'pagato', docId: s.docId, label: 'Segna come pagata' },
      });
    }
    if (s.tipo === 'fine_condizioni' && g <= 60) {
      const tlc = s.categoria === 'internet' || s.categoria === 'mobile';
      av.push({
        id: s.id, livello: g <= 15 ? 'urgente' : 'attenzione', categoria: s.categoria,
        titolo: g < 0 ? `${s.titolo}: scadute il ${dataBreve(s.data)}` : `${s.titolo} tra ${g} giorni`,
        testo: tlc
          ? 'A fine promozione il canone passa di solito al prezzo di listino. È il momento di verificare il nuovo importo e, se serve, cambiare operatore.'
          : 'Dopo questa data il fornitore può applicare un nuovo prezzo: deve comunicartelo per iscritto in anticipo. Controlla posta ed email e confronta prima di accettare il rinnovo.',
        azione: { tipo: 'vai', href: '#/voce/' + s.categoria, label: 'Vedi dettagli' },
      });
    }
  }

  // Contratto di affitto in scadenza: i termini di disdetta sono lunghi
  for (const s of calcolaScadenze(stato, 400)) {
    if (s.tipo !== 'fine_contratto') continue;
    const g = giorniTra(oggi, s.data);
    if (g <= 210) {
      av.push({
        id: s.id + '-' + s.data, livello: g <= 60 ? 'urgente' : 'attenzione', categoria: 'affitto',
        titolo: g < 0 ? 'Contratto di affitto scaduto' : `Il contratto di affitto scade tra ${g} giorni`,
        testo: 'Disdetta e rinnovo hanno preavvisi lunghi, spesso sei mesi: rileggi il contratto per sapere entro quando devi comunicare le tue intenzioni.',
        azione: { tipo: 'vai', href: '#/voce/affitto', label: 'Vedi contratto' },
      });
    }
  }

  for (const cat of ['luce', 'gas']) {
    const label = CATEGORIE[cat].label.toLowerCase();
    const unita = CATEGORIE[cat].unita;

    // 2. Aumento del prezzo della materia prima tra le ultime due bollette
    const [a, b] = ultimiDue(stato.documenti, cat, 'prezzo_materia');
    if (a && b) {
      const delta = (a.prezzo_materia - b.prezzo_materia) / b.prezzo_materia;
      if (delta >= 0.1) {
        av.push({
          id: `prezzo-${cat}-${a.id}`, livello: 'attenzione', categoria: cat,
          titolo: `Prezzo ${label} salito del ${num(delta * 100)}%`,
          testo: `La componente energia è passata da ${num(b.prezzo_materia, 3)} a ${num(a.prezzo_materia, 3)} €/${unita}. ${a.tipo_prezzo === 'variabile' ? 'Con un prezzo variabile segue il mercato all\'ingrosso: verifica se il rialzo è generale o solo tuo.' : 'Con un prezzo fisso un aumento indica di solito un rinnovo delle condizioni.'}`,
          azione: { tipo: 'vai', href: '#/voce/' + cat, label: 'Confronta le bollette' },
        });
      }
    } else {
      const [x, y] = ultimiDue(stato.documenti, cat, 'consumo');
      const ux = x && costoUnitarioPieno(x), uy = y && costoUnitarioPieno(y);
      if (ux && uy && (ux - uy) / uy >= 0.15) {
        av.push({
          id: `unit-${cat}-${x.id}`, livello: 'info', categoria: cat,
          titolo: `Costo per ${unita} in aumento`,
          testo: `Tutto incluso hai pagato ${num(ux, 3)} €/${unita}, contro ${num(uy, 3)} della bolletta precedente. Parte della differenza può dipendere dai costi fissi su consumi più bassi.`,
          azione: { tipo: 'vai', href: '#/voce/' + cat, label: 'Vedi andamento' },
        });
      }
    }

    // 3. Ultima bolletta su consumi stimati / con conguaglio
    const ultimo = stato.documenti.filter((d) => d.categoria === cat).sort((p, q) => (dataDoc(q) || '').localeCompare(dataDoc(p) || ''))[0];
    if (ultimo?.consumi_stimati) {
      av.push({
        id: `stima-${ultimo.id}`, livello: 'info', categoria: cat,
        titolo: `Bolletta ${label} su consumi stimati`,
        testo: 'Stai pagando una stima, non quello che hai consumato. Comunica l\'autolettura al fornitore (app, sito o numero verde): eviti conguagli a sorpresa.',
      });
    }
    if (ultimo?.conguaglio) {
      av.push({
        id: `cong-${ultimo.id}`, livello: 'info', categoria: cat,
        titolo: `Conguaglio nella bolletta ${label}`,
        testo: 'Questa bolletta riallinea stime passate con i consumi reali. Se l\'importo è alto puoi chiedere la rateizzazione al fornitore.',
      });
    }

    // 4. Bolletta mancante (bimestrale attesa)
    if (ultimo && dataDoc(ultimo) && giorniTra(dataDoc(ultimo), oggi) > 80) {
      av.push({
        id: `manca-${cat}-${dataDoc(ultimo)}`, livello: 'info', categoria: cat,
        titolo: `Manca l'ultima bolletta ${label}`,
        testo: `L'ultima che hai caricato copre fino al ${dataBreve(dataDoc(ultimo))}. Aggiungila per tenere aggiornati costi e avvisi.`,
        azione: { tipo: 'vai', href: '#/aggiungi', label: 'Carica bolletta' },
      });
    }
  }

  // 5. Consumi rispetto al riferimento ARERA
  const luce = consumoAnnuo(stato, 'luce');
  if (luce?.affidabile && luce.annuo > RIFERIMENTO_ARERA.luce.annuo * 1.35) {
    av.push({
      id: `cons-luce-${Math.round(luce.annuo / 100)}`, livello: 'info', categoria: 'luce',
      titolo: 'Consumi di luce sopra il riferimento',
      testo: `Consumi circa ${num(luce.annuo)} kWh l'anno, contro i ${num(RIFERIMENTO_ARERA.luce.annuo)} del cliente tipo ARERA.${casa.riscaldamento === 'pompa_calore' ? ' Con una pompa di calore è normale stare sopra.' : ' Se in casa siete in pochi, conviene guardare scaldabagno elettrico, climatizzazione ed elettrodomestici vecchi.'}`,
    });
  }
  const gas = consumoAnnuo(stato, 'gas');
  if (gas?.affidabile && casa.riscaldamento === 'gas_autonomo' && gas.annuo > RIFERIMENTO_ARERA.gas.annuo * 1.35) {
    av.push({
      id: `cons-gas-${Math.round(gas.annuo / 100)}`, livello: 'info', categoria: 'gas',
      titolo: 'Consumi di gas sopra il riferimento',
      testo: `Circa ${num(gas.annuo)} Smc l'anno, contro i ${num(RIFERIMENTO_ARERA.gas.annuo)} del cliente tipo ARERA con riscaldamento autonomo. Zona climatica e metri quadri contano molto: prima di intervenire controlla taratura della caldaia e temperatura impostata.`,
    });
  }

  return av
    .filter((a) => !stato.avvisi_letti?.[a.id])
    .sort((x, y) => ordineLivello[x.livello] - ordineLivello[y.livello]);
}
