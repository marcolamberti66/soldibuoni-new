import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

// ═══════════════════════════════════════════════════════════
// COSTANTI CHE POTREBBERO DOVER ESSERE AGGIORNATE NEL TEMPO
// ═══════════════════════════════════════════════════════════
const SPESE_NOTARIO_PRIMA = 0.02;      // ~2% del valore per prima casa
const SPESE_NOTARIO_SECONDA = 0.10;    // ~10% per seconda casa (imposte più alte)
const AGENZIA_COMPRAVENDITA = 0.03;    // 3% lato compratore
const MANUTENZIONE_ANNUA = 0.01;       // 1% del valore immobile/anno
const IMU_SECONDA_CASA = 0.0086;       // 0,86% rendita catastale ~ proxy su valore commerciale
const INFLAZIONE_CANONE = 0.015;       // +1,5% annuo indicizzazione affitti (ISTAT)

export function AffittoVsMutuo({ color = '#10b981' }) {
  const [canone, setCanone] = useState(800);
  const [prezzoCasa, setPrezzoCasa] = useState(250000);
  const [anticipo, setAnticipo] = useState(50000);
  const [tasso, setTasso] = useState(3.2);
  const [durataMutuo, setDurataMutuo] = useState(25);
  const [rendimentoAlt, setRendimentoAlt] = useState(4);
  const [tipoCasa, setTipoCasa] = useState('prima');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const risultati = useMemo(() => {
    const capitale = prezzoCasa - anticipo;
    const n = durataMutuo * 12;
    const i = tasso / 100 / 12;
    
    // Rata mutuo (formula francese)
    const rataMensile = i > 0 
      ? (capitale * i) / (1 - Math.pow(1 + i, -n))
      : capitale / n;
    
    // Spese una tantum all'acquisto
    const aliqNotarile = tipoCasa === 'prima' ? SPESE_NOTARIO_PRIMA : SPESE_NOTARIO_SECONDA;
    const speseAcquisto = prezzoCasa * (aliqNotarile + AGENZIA_COMPRAVENDITA);
    
    // IMU: solo su seconda casa
    const imuAnnua = tipoCasa === 'prima' ? 0 : prezzoCasa * IMU_SECONDA_CASA;
    const manutenzioneAnnua = prezzoCasa * MANUTENZIONE_ANNUA;
    
    // Simulazione anno per anno
    const orizzonte = 30;
    const dati = [];
    let equityAccumulata = anticipo; // parti con l'anticipo versato
    let costoAffittoCumul = 0;
    let costoMutuoCumul = speseAcquisto; // spese una tantum all'inizio
    let canoneAnno = canone;
    let debitoResiduo = capitale;
    
    // Costo opportunità: anticipo investito in alternativa
    let anticipoInvestito = anticipo;
    
    for (let anno = 1; anno <= orizzonte; anno++) {
      // Affitto: pago canone + il mio anticipo "fittizio" cresce investito
      costoAffittoCumul += canoneAnno * 12;
      anticipoInvestito *= (1 + rendimentoAlt / 100);
      canoneAnno *= (1 + INFLAZIONE_CANONE);
      
      // Mutuo: pago rata + IMU + manutenzione, ma costruisco equity
      let quotaInteressiAnno = 0;
      let quotaCapitaleAnno = 0;
      
      if (anno <= durataMutuo) {
        // Durante il mutuo
        for (let mese = 0; mese < 12; mese++) {
          const interessiMese = debitoResiduo * i;
          const capitaleMese = rataMensile - interessiMese;
          quotaInteressiAnno += interessiMese;
          quotaCapitaleAnno += capitaleMese;
          debitoResiduo = Math.max(0, debitoResiduo - capitaleMese);
        }
        costoMutuoCumul += (rataMensile * 12) + imuAnnua + manutenzioneAnnua;
        equityAccumulata += quotaCapitaleAnno;
      } else {
        // Mutuo finito, paghi solo IMU e manutenzione
        costoMutuoCumul += imuAnnua + manutenzioneAnnua;
      }
      
      // Patrimonio netto affittuario = quello che ha investito l'anticipo - i canoni pagati
      // Ma per il confronto usiamo il "costo netto" di ogni scenario
      const costoNettoAffitto = costoAffittoCumul - (anticipoInvestito - anticipo);
      const costoNettoMutuo = costoMutuoCumul - equityAccumulata;
      
      dati.push({
        anno,
        Affitto: Math.round(costoNettoAffitto),
        Acquisto: Math.round(costoNettoMutuo),
      });
    }
    
    // Trova break-even
    let breakEven = null;
    for (let k = 0; k < dati.length; k++) {
      if (dati[k].Acquisto < dati[k].Affitto) {
        breakEven = dati[k].anno;
        break;
      }
    }
    
    return {
      rataMensile: Math.round(rataMensile),
      speseAcquisto: Math.round(speseAcquisto),
      imuAnnua: Math.round(imuAnnua),
      manutenzioneAnnua: Math.round(manutenzioneAnnua),
      dati,
      breakEven,
      costoFinaleAffitto: dati[dati.length - 1].Affitto,
      costoFinaleAcquisto: dati[dati.length - 1].Acquisto,
    };
  }, [canone, prezzoCasa, anticipo, tasso, durataMutuo, rendimentoAlt, tipoCasa]);

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    fontFamily: 'inherit',
    color: '#0f172a',
    background: '#fff',
    outline: 'none'
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 6
  };

  const formatEuro = (v) => `€${v.toLocaleString('it-IT')}`;

  const verdetto = risultati.breakEven 
    ? `L'acquisto diventa più conveniente dopo ${risultati.breakEven} anni`
    : 'Nel tuo orizzonte di 30 anni, affittare resta più conveniente';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      
      {/* INPUT PANEL */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>I tuoi dati</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          
          <div>
            <label style={labelStyle}>Canone mensile attuale</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={canone} onChange={(e) => setCanone(Number(e.target.value) || 0)} style={{...inputStyle, paddingLeft: 28}} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Prezzo casa target</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={prezzoCasa} onChange={(e) => setPrezzoCasa(Number(e.target.value) || 0)} style={{...inputStyle, paddingLeft: 28}} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Anticipo disponibile</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={anticipo} onChange={(e) => setAnticipo(Number(e.target.value) || 0)} style={{...inputStyle, paddingLeft: 28}} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>€</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tasso mutuo (TAN)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" step="0.1" value={tasso} onChange={(e) => setTasso(Number(e.target.value) || 0)} style={{...inputStyle, paddingRight: 28}} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>%</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Durata mutuo</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={durataMutuo} onChange={(e) => setDurataMutuo(Number(e.target.value) || 1)} style={{...inputStyle, paddingRight: 45}} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }}>anni</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Rendimento investimento alternativo</label>
            <div style={{ position: 'relative' }}>
              <input type="number" step="0.1" value={rendimentoAlt} onChange={(e) => setRendimentoAlt(Number(e.target.value) || 0)} style={{...inputStyle, paddingRight: 28}} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>%</span>
            </div>
          </div>

        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Tipo di casa</label>
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 4, borderRadius: 12, gap: 2 }}>
            <button 
              onClick={() => setTipoCasa('prima')} 
              style={{
                padding: '8px 18px', borderRadius: 9, border: 'none', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: tipoCasa === 'prima' ? '#fff' : 'transparent',
                color: tipoCasa === 'prima' ? color : '#64748b',
                boxShadow: tipoCasa === 'prima' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >Prima casa</button>
            <button 
              onClick={() => setTipoCasa('seconda')} 
              style={{
                padding: '8px 18px', borderRadius: 9, border: 'none', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: tipoCasa === 'seconda' ? '#fff' : 'transparent',
                color: tipoCasa === 'seconda' ? color : '#64748b',
                boxShadow: tipoCasa === 'seconda' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >Seconda casa</button>
          </div>
        </div>
      </div>

      {/* VERDETTO */}
      <div style={{ 
        background: `linear-gradient(135deg, ${color}12, ${color}04)`, 
        border: `1px solid ${color}40`, 
        borderRadius: 20, 
        padding: '24px 28px', 
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Verdetto</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif" }}>
          {verdetto}
        </div>
      </div>

      {/* METRICHE CHIAVE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Rata mensile</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.rataMensile)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Spese acquisto</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.speseAcquisto)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>IMU annua</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.imuAnnua)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Manut. annua</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{formatEuro(risultati.manutenzioneAnnua)}</div>
        </div>
      </div>

      {/* GRAFICO */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Costo netto cumulato</h3>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Linea rossa: affitto (canoni pagati − rendimento dell'anticipo investito). Linea verde: acquisto (rata + spese − equity accumulata).</p>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={risultati.dati} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="anno" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Anni', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${Math.round(v/1000)}k`} />
            <Tooltip formatter={(v) => formatEuro(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
            {risultati.breakEven && <ReferenceLine x={risultati.breakEven} stroke={color} strokeDasharray="4 4" label={{ value: `Break-even: anno ${risultati.breakEven}`, fill: color, fontSize: 11, fontWeight: 700, position: 'top' }} />}
            <Line type="monotone" dataKey="Affitto" stroke="#dc2626" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Acquisto" stroke={color} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* DISCLAIMER */}
      <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 16, padding: '16px 20px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
        <strong>ℹ️ Cosa include e cosa no questa simulazione</strong>
        <div style={{ display: disclaimerOpen ? 'block' : '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 6 }}>
          Il calcolo <strong>include</strong>: rata mutuo, interessi, IMU (solo seconda casa), manutenzione stimata all'1%/anno, spese notarili e agenzia all'acquisto, indicizzazione ISTAT dei canoni (+1,5%/anno), costo opportunità dell'anticipo investito al rendimento alternativo scelto. <strong>Non include</strong>: rivalutazione immobiliare (variabile tra -2% e +4%/anno a seconda del mercato), vantaggi fiscali (detrazione interessi prima casa del 19% fino a 4.000€/anno), assicurazioni obbligatorie sul mutuo, spese condominiali (simmetriche: le paghi in entrambi gli scenari). Questo tool è uno strumento di orientamento, non di consulenza personalizzata.
        </div>
        <button onClick={() => setDisclaimerOpen(!disclaimerOpen)} style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 800, fontSize: 12, padding: 0, marginTop: 6, cursor: 'pointer', textDecoration: 'underline' }}>
          {disclaimerOpen ? 'Riduci ↑' : 'Leggi tutto ↓'}
        </button>
      </div>

    </div>
  );
}