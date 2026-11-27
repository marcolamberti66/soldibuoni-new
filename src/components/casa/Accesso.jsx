import Account from './Account.jsx';
import { Icona } from './ui.jsx';

/** Ingresso nell'app per chi non ha ancora una casa: si entra con l'email, senza password. */
export default function Accesso() {
  return (
    <section className="ca-acc-in">
      <p className="ca-acc-in-k">La tua casa</p>
      <h1 className="display ca-acc-in-t">Tutti i conti della casa,<br /><em>in un posto solo.</em></h1>
      <ul className="ca-acc-in-l">
        <li><Icona nome="panoramica" size={20} /><span><b>Quanto costa davvero</b>Ogni voce, il suo peso, se sale o scende, nei mesi in cui pesa.</span></li>
        <li><Icona nome="upload" size={20} /><span><b>Carichi, legge lei</b>Bollette, condominio, TARI, F24: PDF o foto, importi e scadenze in pochi secondi.</span></li>
        <li><Icona nome="calendario" size={20} /><span><b>Ogni lunedì, cosa esce</b>Un'email breve e un avviso prima di ogni pagamento.</span></li>
      </ul>
      <Account variante="accesso" />
      <p className="ca-acc-in-n">Gratis, senza password: ti mandiamo un codice. Nessuna pubblicità, nessuna affiliazione. <a href="/privacy">Privacy</a></p>
      <p className="ca-acc-in-n">Prima vuoi un'idea? <a href="/#stima">Stima quanto costa una casa come la tua</a>.</p>
    </section>
  );
}
