import React, { useState, useMemo } from 'react';

// ============================================================================
// SALUTE COMP — Valutazione polizza integrativa basata su scenari di rischio
// No comparatore provider hardcoded (prezzi non verificabili in tempo reale).
// Approccio: checklist CCNL + simulazione 3 scenari + griglia di requisiti.
// ============================================================================

const THEME = { primary: '#dc2626', soft: '#fee2e2', bg: '#fef2f2' };

// Costi medi di riferimento prestazioni sanitarie private 2026 (fonte: medie indicative centri diagnostici)
const COSTI_PRIVATI = {
  visitaSpecialistica: 110,    // range 80-180 a seconda della specialità
  diagnosticaBase: 90,         // ecografia / esami del sangue / rx semplice
  odontoiatricaBase: 150,      // visita + igiene dentale annuale
  odontoiatricaEstesa: 1200,   // intervento di media entità (es. 2 otturazioni + panoramica)
  oculisticaBase: 120,         // visita + controllo pressione oculare
  chirurgiaLieve: 3000,        // es. intervento ambulatoriale
  ricoveroMedio: 8000,         // ricovero ospedaliero con intervento (es. appendicectomia)
  ricoveroGrave: 25000         // intervento complesso / lunga degenza
};

export function SaluteComp({ color = '#dc2626' }) {
  const [hasFondoCcnl, setHasFondoCcnl] = useState('non_so');
  const [premioStr, setPremioStr] = useState('400');
  const [nVisite, setNVisite] = useState(3);
  const [cureOdonto, setCureOdonto] = useState('base');
  const [persone, setPersone] = useState(1);
  const [eta, setEta] = useState(40);

  const t = THEME;
  const themeColor = color || t.primary;

  const risultati = useMemo(() => {
    const premio = parseFloat(premioStr) || 0;

    // Costo annuo "normale" senza polizza (scenario tipico)
    const costoVisiteSpec = nVisite * COSTI_PRIVATI.visitaSpecialistica;
    const costoDiagnostica = 2 * COSTI_PRIVATI.diagnosticaBase; // 2 esami/anno tipici
    const costoOdonto = cureOdonto === 'nulla' ? 0 :
                        cureOdonto === 'base' ? COSTI_PRIVATI.odontoiatricaBase :
                        COSTI_PRIVATI.odontoiatricaEstesa;
    const costoOcul = eta > 40 ? COSTI_PRIVATI.oculisticaBase : 0;

    const costoAnnoNormale = persone * (costoVisiteSpec + costoDiagnostica + costoOdonto + costoOcul);

    // Scenario imprevisto medio (chirurgia lieve, 1 volta)
    const costoImprevistoMedio = costoAnnoNormale + COSTI_PRIVATI.chirurgiaLieve;

    // Scenario ricovero grave (raro ma devastante economicamente)
    const costoRicoveroGrave = costoAnnoNormale + COSTI_PRIVATI.ricoveroGrave;

    // Con polizza: premio + compartecipazione stimata media 20% sulle prestazioni + franchigia tipica
    const franchigiaTipica = 300;
    const compartecipazione = 0.2;
    const costoConPolizzaNormale = premio + costoAnnoNormale * compartecipazione + (nVisite > 0 ? franchigiaTipica : 0);
    const costoConPolizzaImprevisto = premio + (costoAnnoNormale + COSTI_PRIVATI.chirurgiaLieve * 0.15) + franchigiaTipica;
    // In caso di ricovero grave in convenzione la polizza copre molto (stima 85-95%)
    const costoConPolizzaRicovero = premio + (costoAnnoNormale * compartecipazione) + (COSTI_PRIVATI.ricoveroGrave * 0.10) + franchigiaTipica;

    // Rapporto premio/benefit atteso (probabilità evento * risparmio vs attesa)
    // Evento raro: ~2-3% all'anno ricovero grave; ~10-15% chirurgia lieve
    const probabilitaRicoveroGrave = eta < 40 ? 0.015 : eta < 60 ? 0.025 : 0.045;
    const probabilitaChirurgia = 0.12;

    const valoreAtteso =
      costoAnnoNormale * (1 - probabilitaChirurgia - probabilitaRicoveroGrave) +
      costoImprevistoMedio * probabilitaChirurgia +
      costoRicoveroGrave * probabilitaRicoveroGrave;

    const valoreAttesoConPolizza =
      costoConPolizzaNormale * (1 - probabilitaChirurgia - probabilitaRicoveroGrave) +
      costoConPolizzaImprevisto * probabilitaChirurgia +
      costoConPolizzaRicovero * probabilitaRicoveroGrave;

    const differenzaAttesa = valoreAtteso - valoreAttesoConPolizza;

    // Giudizio
    let giudizio = 'neutro';
    if (differenzaAttesa > 400) giudizio = 'positivo';
    else if (differenzaAttesa < -200) giudizio = 'negativo';

    return {
      costoAnnoNormale: Math.round(costoAnnoNormale),
      costoImprevistoMedio: Math.round(costoImprevistoMedio),
      costoRicoveroGrave: Math.round(costoRicoveroGrave),
      costoConPolizzaNormale: Math.round(costoConPolizzaNormale),
      costoConPolizzaImprevisto: Math.round(costoConPolizzaImprevisto),
      costoConPolizzaRicovero: Math.round(costoConPolizzaRicovero),
      valoreAtteso: Math.round(valoreAtteso),
      valoreAttesoConPolizza: Math.round(valoreAttesoConPolizza),
      differenzaAttesa: Math.round(differenzaAttesa),
      giudizio,
      probabilitaRicoveroGrave
    };
  }, [premioStr, nVisite, cureOdonto, persone, eta]);

  const cardBase = {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24,
    padding: '32px 24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 800, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10
  };
  const inputStyle = {
    width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #cbd5e1',
    borderRadius: 12, boxSizing: 'border-box', color: '#0f172a', background: '#fff', outline: 'none'
  };
  const formatEuro = (v) => `€ ${Math.abs(Math.round(v)).toLocaleString('it-IT')}`;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====================================================================
          BLOCCO CRUCIALE: FONDO CCNL PRIMA DI TUTTO
          ==================================================================== */}
      <div style={{
        ...cardBase,
        marginBottom: 24,
        background: 'linear-gradient(135deg, #fef3c7 0%, #fff 60%)',
        border: '2px solid #f59e0b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0
          }}>
            Prima di tutto: hai già un fondo sanitario CCNL?
          </h2>
        </div>
        <p style={{ fontSize: 14, color: '#475569', margin: '0 0 18px', lineHeight: 1.6 }}>
          Il 70% dei lavoratori dipendenti italiani <strong>ha già un'integrativa sanitaria</strong> tramite il fondo previsto dal CCNL (Metasalute per metalmeccanici, FASI per dirigenti, Unisalute per molti altri CCNL del commercio e servizi, Fondo Est, Sanimoda...). <strong>Molti non lo sanno</strong> e pagano una seconda polizza privata duplicando la copertura.
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            { id: 'si', label: 'Sì, ce l\'ho', icon: '✓' },
            { id: 'no', label: 'No', icon: '✕' },
            { id: 'non_so', label: 'Non lo so', icon: '?' }
          ].map(o => {
            const active = hasFondoCcnl === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setHasFondoCcnl(o.id)}
                style={{
                  flex: '1 1 120px', padding: '12px 16px',
                  borderRadius: 12,
                  border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                  background: active ? t.bg : '#fff',
                  color: active ? '#0f172a' : '#64748b',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer'
                }}
              >
                <span style={{ marginRight: 6 }}>{o.icon}</span>{o.label}
              </button>
            );
          })}
        </div>

        {hasFondoCcnl === 'non_so' && (
          <div style={{
            padding: '14px 16px', background: 'rgba(255,255,255,0.8)',
            borderRadius: 12, fontSize: 13, color: '#78350f', lineHeight: 1.6
          }}>
            <strong>Come verificare:</strong> controlla la tua busta paga alla voce "contributi enti bilaterali" o "Fondo sanitario" (piccola trattenuta mensile), chiedi al tuo ufficio HR o al rappresentante sindacale, oppure controlla il tuo CCNL di categoria (cerca "fondo sanitario" nel testo). Se c'è, hai già accesso gratuito o quasi-gratuito a una copertura che tipicamente include ricoveri, specialistica e a volte odontoiatrica.
          </div>
        )}

        {hasFondoCcnl === 'si' && (
          <div style={{
            padding: '14px 16px', background: 'rgba(255,255,255,0.8)',
            borderRadius: 12, fontSize: 13, color: '#78350f', lineHeight: 1.6
          }}>
            <strong>Bene — prima di comprare un'altra polizza:</strong> richiedi al fondo CCNL il <strong>piano delle prestazioni</strong> (nomenclatore), leggi massimali per ricovero e specialistica, verifica se include familiari a carico, controlla la rete convenzionata nella tua città. Spesso una polizza privata aggiuntiva è utile <strong>solo</strong> per coperture non incluse (es. odontoiatrica completa, massimali più alti, rete più estesa). Calcolare la differenza di copertura prima di pagare il premio.
          </div>
        )}

        {hasFondoCcnl === 'no' && (
          <div style={{
            padding: '14px 16px', background: 'rgba(255,255,255,0.8)',
            borderRadius: 12, fontSize: 13, color: '#78350f', lineHeight: 1.6
          }}>
            <strong>Allora una polizza privata ha più senso da valutare.</strong> Considera che il Servizio Sanitario Nazionale resta la tua base primaria (gratuita, universale, con eccellenza su molte patologie gravi): la polizza privata serve principalmente per <strong>bypassare liste d'attesa</strong>, coprire odontoiatrica e ricoveri in strutture private. Usa il calcolatore qui sotto per valutare il rapporto premio/beneficio nel tuo caso specifico.
          </div>
        )}
      </div>

      {/* ====================================================================
          INPUT CALCOLATORE
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22, fontWeight: 800, color: '#0f172a',
          margin: '0 0 6px', letterSpacing: '-0.01em'
        }}>
          Analisi di rischio su tre scenari
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
          L'assicurazione sanitaria si valuta come un contratto di trasferimento del rischio: confronta cosa spenderesti in 3 scenari (anno normale, imprevisto medio, ricovero grave) con e senza polizza.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>

          <div>
            <label style={labelStyle}>Premio annuo polizza (€)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>€</span>
              <input
                type="number" min="0" step="50"
                value={premioStr}
                onChange={(e) => setPremioStr(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 28, fontWeight: 800, color: themeColor }}
              />
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Se non hai ancora una polizza, inserisci il preventivo che stai valutando
            </div>
          </div>

          <div>
            <label style={labelStyle}>Persone coperte</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4].map(n => {
                const active = persone === n;
                return (
                  <button
                    key={n}
                    onClick={() => setPersone(n)}
                    style={{
                      flex: 1, padding: '12px',
                      borderRadius: 12,
                      border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                      background: active ? t.bg : '#fff',
                      color: active ? '#0f172a' : '#64748b',
                      fontSize: 15, fontWeight: 800, cursor: 'pointer'
                    }}
                  >{n === 4 ? '4+' : n}</button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Età del titolare</label>
            <input
              type="number" min="18" max="85"
              value={eta}
              onChange={(e) => setEta(parseInt(e.target.value) || 40)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Visite specialistiche/anno</label>
            <input
              type="number" min="0" max="20"
              value={nVisite}
              onChange={(e) => setNVisite(parseInt(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Cure dentistiche annuali</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'nulla', label: 'Nessuna', sub: '€0' },
                { id: 'base', label: 'Igiene + visita', sub: '~€150' },
                { id: 'estesa', label: 'Lavori in corso', sub: '~€1.200+' }
              ].map(o => {
                const active = cureOdonto === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setCureOdonto(o.id)}
                    style={{
                      flex: '1 1 140px', padding: '10px 14px',
                      borderRadius: 12,
                      border: active ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                      background: active ? t.bg : '#fff',
                      color: active ? '#0f172a' : '#64748b',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      lineHeight: 1.3, textAlign: 'left'
                    }}
                  >
                    <div>{o.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 500, marginTop: 2 }}>{o.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ====================================================================
          RISULTATI: 3 SCENARI A CONFRONTO
          ==================================================================== */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20, fontWeight: 800, color: '#0f172a',
          margin: '0 0 16px', letterSpacing: '-0.01em'
        }}>
          I 3 scenari a confronto
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14
        }}>

          <ScenarioCard
            icon="🟢"
            titolo="Anno normale"
            descrizione="Visite di routine, niente imprevisti (circa 85% degli anni)"
            senzaPolizza={risultati.costoAnnoNormale}
            conPolizza={risultati.costoConPolizzaNormale}
            color={themeColor}
          />

          <ScenarioCard
            icon="🟡"
            titolo="Imprevisto medio"
            descrizione="Chirurgia ambulatoriale o ricovero breve (~12% degli anni)"
            senzaPolizza={risultati.costoImprevistoMedio}
            conPolizza={risultati.costoConPolizzaImprevisto}
            color={themeColor}
          />

          <ScenarioCard
            icon="🔴"
            titolo="Ricovero grave"
            descrizione={`Intervento complesso o lunga degenza (~${(risultati.probabilitaRicoveroGrave * 100).toFixed(1)}% degli anni)`}
            senzaPolizza={risultati.costoRicoveroGrave}
            conPolizza={risultati.costoConPolizzaRicovero}
            color={themeColor}
          />

        </div>

        {/* Verdetto */}
        <div style={{
          marginTop: 20,
          background: risultati.giudizio === 'positivo'
            ? 'linear-gradient(135deg, #d1fae5 0%, #fff 100%)'
            : risultati.giudizio === 'negativo'
              ? 'linear-gradient(135deg, #fee2e2 0%, #fff 100%)'
              : '#f8fafc',
          border: risultati.giudizio === 'positivo'
            ? '2px solid #10b981'
            : risultati.giudizio === 'negativo'
              ? '2px solid #ef4444'
              : '2px solid #cbd5e1',
          borderRadius: 20, padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 28 }}>
              {risultati.giudizio === 'positivo' ? '✅' : risultati.giudizio === 'negativo' ? '⚠️' : '📊'}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <h4 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18, fontWeight: 800, color: '#0f172a',
                margin: '0 0 6px'
              }}>
                {risultati.giudizio === 'positivo' && 'La polizza ha senso economico'}
                {risultati.giudizio === 'negativo' && 'La polizza costa più del valore atteso'}
                {risultati.giudizio === 'neutro' && 'Valutazione in equilibrio — decidi sui casi estremi'}
              </h4>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                Sul valore atteso (media ponderata dei 3 scenari), pagare il premio ti costa <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatEuro(risultati.valoreAttesoConPolizza)}/anno</strong>, mentre senza polizza ti aspetteresti di spendere <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatEuro(risultati.valoreAtteso)}/anno</strong>. Differenza attesa: <strong style={{ color: risultati.differenzaAttesa > 0 ? '#059669' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{risultati.differenzaAttesa > 0 ? '+' : ''}{formatEuro(Math.abs(risultati.differenzaAttesa))}/anno a favore della polizza</strong>.
              </p>
              <p style={{ fontSize: 12, color: '#64748b', margin: '10px 0 0', lineHeight: 1.6, fontStyle: 'italic' }}>
                ⓘ L'analisi sul valore atteso non è l'unico criterio: una polizza ha valore anche come protezione contro il caso estremo (ricovero grave da €25.000+) anche se non conviene "in media". È il concetto di assicurazione come scudo psicologico ed economico contro l'evento raro ma devastante.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CHECKLIST REQUISITI POLIZZA
          ==================================================================== */}
      <div style={{ ...cardBase, marginBottom: 24 }}>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20, fontWeight: 800, color: '#0f172a',
          margin: '0 0 6px', letterSpacing: '-0.01em'
        }}>
          Checklist: 8 cose da chiedere prima di firmare
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
          Non confrontare solo il premio. Queste sono le clausole che determinano se la polizza sarà davvero utile quando ti servirà.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ChecklistItem num="1" titolo="Massimale ricovero annuo" spec="Minimo €100.000. Sotto questa soglia un intervento complesso può superare la copertura." />
          <ChecklistItem num="2" titolo="Franchigia e scoperto" spec="Franchigia = importo che paghi tu prima che la polizza intervenga (tipico €150-500). Scoperto = % della spesa rimasta a tuo carico (tipico 10-20%)." />
          <ChecklistItem num="3" titolo="Rete convenzionata nella tua città" spec="In rete paghi poco o nulla. Fuori rete anticipi e chiedi rimborso parziale. Verifica che almeno 3-4 strutture della tua città siano convenzionate." />
          <ChecklistItem num="4" titolo="Periodi di carenza" spec="Tempo tra firma contratto e attivazione coperture: 3-6 mesi tipico per malattia, fino a 12 mesi per parto e odontoiatria. Non puoi firmare 'all'ultimo' se sai di avere esigenze imminenti." />
          <ChecklistItem num="5" titolo="Esclusioni e preesistenze" spec="Patologie già diagnosticate prima della stipula sono tipicamente escluse (a meno di polizze specifiche). Dichiara tutto onestamente: omissioni = rescissione in caso di sinistro." />
          <ChecklistItem num="6" titolo="Copertura odontoiatrica" spec="Spesso esclusa o limitata (max €500-1.500/anno). Se dentistica è la tua esigenza principale, verifica con attenzione: a volte una polizza solo-odontoiatrica costa meno." />
          <ChecklistItem num="7" titolo="Rinnovo e aumento con età" spec="La polizza è rinnovabile automaticamente o richiede rinnovo attivo? Il premio aumenta con l'età? Alcuni contratti raddoppiano il premio dopo i 60 anni." />
          <ChecklistItem num="8" titolo="Disdetta e recesso" spec="Normativa IVASS prevede recesso entro 14 giorni dalla firma (diritto di ripensamento). Leggi le condizioni di disdetta annuale: tempi di preavviso tipici 30-60 giorni prima della scadenza." />
        </div>

        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: t.bg, borderRadius: 12,
          fontSize: 12, color: '#991b1b', lineHeight: 1.6
        }}>
          <strong>💡 Da fare:</strong> richiedi la <strong>Nota Informativa IVASS</strong> (documento obbligatorio) e il <strong>Set Informativo completo</strong> con condizioni di polizza. Leggili prima di firmare. Per confronti tra offerte usa i preventivatori dei broker indipendenti (Facile.it, Segugio, 6sicuro) o rivolgiti a un broker IVASS.
        </div>
      </div>

      {/* ====================================================================
          DISCLAIMER LEGALE
          ==================================================================== */}
      <div style={{
        padding: '20px 24px', background: '#f8fafc',
        border: '1px solid #e2e8f0', borderRadius: 16,
        fontSize: 11, color: '#64748b', lineHeight: 1.7
      }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, fontSize: 12 }}>
          ⚠️ Nota metodologica e disclaimer
        </div>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Strumento educativo, non consulenza assicurativa.</strong> SoldiBuoni non è un broker IVASS né una compagnia di intermediazione assicurativa: questa analisi non costituisce consulenza ai sensi del D.Lgs. 209/2005 (Codice delle Assicurazioni) né raccomandazione di prodotto. Per scegliere una polizza concreta, rivolgiti a un broker IVASS iscritto al Registro Unico degli Intermediari (RUI), a un agente assicurativo autorizzato, oppure contatta direttamente le compagnie per preventivi personalizzati.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Valori stimati e non vincolanti.</strong> I costi medi delle prestazioni sanitarie private (visite specialistiche, diagnostica, ricoveri) sono indicativi e variano per struttura, città e complessità del caso. Le probabilità di evento sono medie di popolazione per fascia d'età, non stime individuali. Il tuo profilo specifico (condizioni di salute, storia familiare, stile di vita, professione) modifica in modo rilevante il calcolo del rischio reale.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Esclusioni comuni delle polizze integrative</strong>: patologie preesistenti, gravidanza e parto nel periodo di carenza, malattie croniche (diabete, cardiopatie, tumori) se diagnosticate prima della stipula, sport estremi, chirurgia estetica non ricostruttiva, cure dentistiche di natura estetica, medicina alternativa. Leggere sempre il set informativo e le condizioni generali di polizza prima della firma.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Il Servizio Sanitario Nazionale resta la base primaria di tutela per tutti i cittadini italiani.</strong> L'assicurazione integrativa non sostituisce il SSN ma lo affianca per prestazioni con liste d'attesa lunghe, strutture private o servizi non coperti (odontoiatria, oculistica avanzata). In caso di emergenza grave, il Pronto Soccorso pubblico garantisce assistenza gratuita e immediata.
        </p>
      </div>

    </div>
  );
}

// --- Helpers ---

function ScenarioCard({ icon, titolo, descrizione, senzaPolizza, conPolizza, color }) {
  const formatEuro = (v) => `€ ${Math.round(v).toLocaleString('it-IT')}`;
  const risparmio = senzaPolizza - conPolizza;
  const convienePolizza = risparmio > 0;
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid #e2e8f0', padding: 20,
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{titolo}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14, lineHeight: 1.4, minHeight: 28 }}>{descrizione}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Senza polizza</span>
          <span style={{ color: '#0f172a', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{formatEuro(senzaPolizza)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Con polizza</span>
          <span style={{ color: '#0f172a', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{formatEuro(conPolizza)}</span>
        </div>
        <div style={{
          marginTop: 6, padding: '6px 10px',
          background: convienePolizza ? '#d1fae5' : '#fee2e2',
          borderRadius: 8, fontSize: 11, fontWeight: 800,
          color: convienePolizza ? '#065f46' : '#991b1b', textAlign: 'center'
        }}>
          {convienePolizza
            ? `Polizza risparmia ${formatEuro(risparmio)}`
            : `Polizza costa ${formatEuro(-risparmio)} in più`}
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ num, titolo, spec }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '12px 14px',
      background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0'
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: '#dc2626', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 13, flexShrink: 0
      }}>{num}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{titolo}</div>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{spec}</div>
      </div>
    </div>
  );
}