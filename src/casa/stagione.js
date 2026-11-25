// ─────────────────────────────────────────────────────────────
// Promemoria di stagione: cose da fare in casa legate al
// calendario, filtrate sul profilo della casa. Solo indicazioni
// stabili; date di legge solo dove sono fisse (IMU 16/6 e 16/12).
// ─────────────────────────────────────────────────────────────

const TUTTI = [
  {
    id: 'imu-saldo', mesi: [11, 12], quando: (c) => c.titolo !== 'affitto',
    titolo: 'IMU: saldo entro il 16 dicembre',
    testo: 'Riguarda seconde case, immobili non abitativi e abitazioni principali di lusso (A/1, A/8, A/9). Sulla prima casa ordinaria non è dovuta.',
    categoria: 'imu',
  },
  {
    id: 'imu-acconto', mesi: [5, 6], quando: (c) => c.titolo !== 'affitto',
    titolo: 'IMU: acconto entro il 16 giugno',
    testo: 'Vale per seconde case e immobili non abitativi. Se hai solo la prima casa ordinaria non devi nulla.',
    categoria: 'imu',
  },
  {
    id: 'autolettura-inverno', mesi: [11, 12, 1, 2, 3], quando: (c) => c.riscaldamento === 'gas_autonomo',
    titolo: 'D\'inverno, l\'autolettura del gas conviene',
    testo: 'Nei mesi freddi le stime sbagliano di più. Comunicare la lettura del contatore quando il fornitore apre la finestra evita conguagli pesanti in primavera.',
    categoria: 'gas',
  },
  {
    id: 'caldaia-autunno', mesi: [9, 10], quando: (c) => c.riscaldamento === 'gas_autonomo',
    titolo: 'Caldaia: manutenzione prima dell\'inverno',
    testo: 'La manutenzione periodica è obbligatoria con la cadenza indicata nel libretto d\'impianto. Farla prima dell\'accensione costa meno e ti evita l\'attesa dei mesi freddi.',
    categoria: 'manutenzione',
  },
  {
    id: 'interessi-mutuo', mesi: [1, 2, 3], quando: (c) => c.titolo === 'proprieta_mutuo',
    titolo: 'Certificazione interessi del mutuo',
    testo: 'Nei primi mesi dell\'anno la banca rende disponibile la certificazione degli interessi pagati: serve per la detrazione nel 730. Scaricala e conservala.',
    categoria: 'mutuo',
  },
  {
    id: '730-mutuo', mesi: [4, 5, 6], quando: (c) => c.titolo === 'proprieta_mutuo',
    titolo: '730: controlla gli interessi del mutuo',
    testo: 'Nel precompilato verifica che gli interessi passivi del mutuo sulla prima casa ci siano e siano corretti: valgono una detrazione del 19%.',
    categoria: 'mutuo',
  },
  {
    id: 'condizionatori', mesi: [5, 6], quando: () => true,
    titolo: 'Climatizzatori: filtri puliti prima dell\'estate',
    testo: 'Filtri sporchi fanno lavorare di più il compressore e consumare più energia. Si lavano con acqua tiepida in pochi minuti.',
    categoria: 'luce',
  },
  {
    id: 'rinnovi-gennaio', mesi: [12, 1], quando: () => true,
    titolo: 'Inizio anno: il momento dei ritocchi di prezzo',
    testo: 'Molti operatori telefonici e fornitori aggiornano i listini a inizio anno. Leggi le comunicazioni in arrivo: per le modifiche unilaterali hai diritto di recesso senza penali.',
    categoria: 'internet',
  },
  {
    id: 'affitto-ricevute', mesi: [1, 2, 3], quando: (c) => c.titolo === 'affitto',
    titolo: 'Affitto: conserva le ricevute per il 730',
    testo: 'Per chi vive in affitto nell\'abitazione principale esistono detrazioni che dipendono dal reddito e dal tipo di contratto. Tieni a portata contratto e prove di pagamento.',
    categoria: 'affitto',
  },
];

export function consigliDelMese(casa, data = new Date()) {
  const m = data.getMonth() + 1;
  return TUTTI.filter((t) => t.mesi.includes(m) && t.quando(casa || {}));
}
