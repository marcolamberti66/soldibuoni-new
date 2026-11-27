// Elenco unico delle guide: alimenta indice, "leggi anche", home e footer.
export const GUIDE = [
  { slug: 'bolletta-luce-media', eb: 'Luce', t: 'Quanto costa la luce al mese', d: 'Il prezzo ARERA di fine 2026, quanto si paga per consumo e come capire se la tua bolletta è cara.', tema: 'bollette', hub: 'bollette' },
  { slug: 'dividere-spese-casa', eb: 'Spese condivise', t: 'Come dividere le spese di casa', d: 'Parti uguali, in proporzione al reddito o per uso: tre metodi per coinquilini e coppie, e come pareggiare.', tema: 'casa', hub: 'famiglia' },
  { slug: 'costi-casa', eb: 'Casa', t: 'Tutte le spese fisse di una casa', d: 'La mappa completa delle spese ricorrenti e il modo giusto di calcolare il costo mensile reale.', tema: 'casa', hub: 'costi-casa' },
  { slug: 'spese-condominiali', eb: 'Condominio', t: 'Spese condominiali: come si dividono', d: 'Millesimi, spese ordinarie e straordinarie, cosa paga l\'inquilino e cosa il proprietario.', tema: 'casa', hub: 'costi-casa' },
  { slug: 'imu', eb: 'Tributi', t: 'IMU: chi la paga, quando e quanto', d: 'Prima casa, seconda casa, scadenze del 16 giugno e 16 dicembre, come si calcola.', tema: 'casa', hub: 'tasse-casa' },
  { slug: 'detrazione-interessi-mutuo', eb: 'Mutuo', t: 'Detrazione degli interessi del mutuo', d: 'Il 19% fino a 4.000 euro di interessi l\'anno: requisiti, spese detraibili, cointestatari.', tema: 'mutuo', hub: 'tasse-casa' },
  { slug: 'bolletta-luce', eb: 'Luce', t: 'Come leggere la bolletta della luce', d: 'Le quattro voci del totale, prezzo fisso o variabile, fasce orarie, cosa controllare.', tema: 'bollette', hub: 'bollette' },
  { slug: 'bolletta-gas', eb: 'Gas', t: 'Come leggere la bolletta del gas', d: 'Smc, scaglioni IVA, riscaldamento autonomo o centralizzato, letture stimate.', tema: 'bollette', hub: 'bollette' },
  { slug: 'conguaglio-bolletta', eb: 'Bollette', t: 'Conguaglio in bolletta: cos\'è e cosa fare', d: 'Perché arriva, come evitarlo con l\'autolettura, rateizzazione e prescrizione.', tema: 'bollette', hub: 'bollette' },
  { slug: 'tari', eb: 'Tributi', t: 'TARI: chi la paga e come si calcola', d: 'Quota fissa e variabile, scadenze comunali, riduzioni e il nuovo bonus del 25% con ISEE basso.', tema: 'casa', hub: 'tasse-casa' },
  { slug: 'mutuo-fisso-o-variabile', eb: 'Mutuo', t: 'Mutuo fisso o variabile: quale conviene', d: 'Tassi di fine 2026, quanto cambia la rata, il tasso di pareggio e quando il variabile ha senso.', tema: 'mutuo', hub: 'mutuo' },
  { slug: 'autolettura-contatore', eb: 'Bollette', t: 'Autolettura del contatore luce e gas', d: 'Quali cifre leggere, quando serve davvero e come evitare i conguagli.', tema: 'bollette', hub: 'bollette' },
  { slug: 'cambiare-fornitore-luce-gas', eb: 'Bollette', t: 'Cambiare fornitore di luce e gas', d: 'Gratis e senza interruzioni: cosa serve, i nuovi tempi dal 1° dicembre 2026 e quando conviene.', tema: 'bollette', hub: 'bollette' },
  { slug: 'internet-telefono', eb: 'Internet e telefono', t: 'Internet e telefono: la trappola della promozione', d: 'Canone promo e di listino, modem a rate, vincoli e quando cambiare.', tema: 'bollette', hub: 'bollette' },
];
// Pagina principale di ogni gruppo: usata nelle briciole di pane e nei link.
export const HUB = {
  bollette: { nome: 'Bollette', url: '/bollette' },
  'tasse-casa': { nome: 'Tasse sulla casa', url: '/tasse-casa' },
  'costi-casa': { nome: 'Costi della casa', url: '/costi-casa' },
  famiglia: { nome: 'Budget familiare', url: '/famiglia' },
  mutuo: { nome: 'Mutuo', url: '/mutuo' },
};
export const guida = (slug) => GUIDE.find((g) => g.slug === slug);
export const correlate = (slug, n = 3) => {
  const g = guida(slug);
  const stesse = GUIDE.filter((x) => x.slug !== slug && x.tema === g?.tema);
  const altre = GUIDE.filter((x) => x.slug !== slug && x.tema !== g?.tema);
  return [...stesse, ...altre].slice(0, n);
};
