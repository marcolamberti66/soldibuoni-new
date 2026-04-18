import React, { useState, useMemo } from 'react';
import { ENERGY_PROVIDERS, GAS_PROVIDERS, INDICI_MERCATO } from '../data.js';
import { ProviderRow, AffiliateRow, Badge } from './Comparators.jsx';

const AFFILIATE_NAMES_LUCE = ['Reset Energia'];
const AFFILIATE_NAMES_GAS = ['Eni Plenitude'];
const EXCLUDED_NAMES = ['NeN', 'Nen', 'NEN', 'NeN Energia'];

const GROSS_UP_LUCE = 1.55; 
const GROSS_UP_GAS = 1.45;

function StyleInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      .provider-card { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
      .provider-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px -8px rgba(0,0,0,0.1) !important; border-color: #cbd5e1 !important; }
      .btn-outline-premium { display: inline-block; font-size: 14px; font-weight: 700; color: var(--btn-color); padding: 10px 24px; border: 1.5px solid var(--btn-color); border-radius: 12px; text-decoration: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap; background: transparent; }
      .btn-outline-premium:hover { background: var(--btn-color); color: #fff; transform: translateY(-2px); box-shadow: 0 6px 16px -4px var(--btn-color); }
      .btn-solid-premium { display: inline-block; text-align: center; font-size: 15px; font-weight: 700; color: #fff; background: var(--btn-bg); padding: 14px 24px; border-radius: 16px; text-decoration: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 8px 20px -6px var(--btn-bg); white-space: nowrap; }
      .btn-solid-premium:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px var(--btn-bg); filter: brightness(1.05); }
    `}} />
  );
}

function isExcluded(name) {
  const lower = name.toLowerCase();
  return EXCLUDED_NAMES.some(ex => lower.includes(ex.toLowerCase()));
}
function isFissa(tipoStr) {
  const s = (tipoStr || '').toLowerCase();
  return s.includes('fisso') || s.includes('fissa') || s.includes('fix');
}
function isVariabile(tipoStr) {
  const s = (tipoStr || '').toLowerCase();
  return s.includes('variabile') || s.includes('indicizzat');
}

// Segmented control button style
const segBtn = (isActive, activeColor) => ({
  padding: '8px 16px',
  borderRadius: 9,
  border: 'none',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  background: isActive ? '#fff' : 'transparent',
  color: isActive ? activeColor : '#64748b',
  boxShadow: isActive ? '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)' : 'none',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap'
});

const segTrack = {
  display: 'inline-flex',
  background: '#f1f5f9',
  padding: 3,
  borderRadius: 12,
  gap: 2
};

const segLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: '#64748b',
  letterSpacing: 1,
  textTransform: 'uppercase'
};

export function LuceGasComp({ color = '#f59e0b' }) {
  const [activeTab, setActiveTab] = useState('gas');
  const [tipoTariffa, setTipoTariffa] = useState('fissa'); 
  const [consumoLuce, setConsumoLuce] = useState(2700);
  const [consumoGas, setConsumoGas] = useState(1000);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const currentColor = activeTab === 'gas' ? '#dc2626' : '#d97706';

  const sortedLuce = useMemo(() => {
    return ENERGY_PROVIDERS
      .filter(p => !AFFILIATE_NAMES_LUCE.includes(p.name) && !isExcluded(p.name))
      .filter(p => tipoTariffa === 'fissa' ? isFissa(p.tipo) : isVariabile(p.tipo))
      .map(p => ({ ...p, costoAnnuo: (p.prezzo * consumoLuce + p.fisso * 12) * GROSS_UP_LUCE }))
      .sort((a, b) => a.costoAnnuo - b.costoAnnuo);
  }, [consumoLuce, tipoTariffa]);

  const sortedGas = useMemo(() => {
    return GAS_PROVIDERS
      .filter(p => !AFFILIATE_NAMES_GAS.includes(p.name) && !isExcluded(p.name))
      .filter(p => tipoTariffa === 'fissa' ? isFissa(p.tipo) : isVariabile(p.tipo))
      .map(p => ({ ...p, costoAnnuo: (p.prezzo * consumoGas + p.fisso * 12) * GROSS_UP_GAS }))
      .sort((a, b) => a.costoAnnuo - b.costoAnnuo);
  }, [consumoGas, tipoTariffa]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <StyleInjector />

      <div style={{ marginBottom: 40 }}>
        <AffiliateRow 
          title="OFFERTA LUCE + GAS COMBINATA"
          providerName="Eni Plenitude — Fixa Time Smart"
          description="Corrispettivi fissi 12 mesi. Sconto 108€ sui costi fissi con dual luce+gas. In omaggio Polizza Zurich Meteo Protetto (fino a 145€ di indennizzo)."
          link="https://www.awin1.com/cread.php?awinmid=9529&awinaffid=2811530"
          color="#E2001A"
          statsElement={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.5px' }}>LUCE</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>0,1881 <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>€/kWh</span></div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, letterSpacing: '0.5px' }}>GAS</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>0,7050 <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>€/Smc</span></div>
            </div>
          }
          priceElement={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.5px' }}>SCONTO DUAL</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#E2001A' }}>-108€/anno</div>
              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginTop: 4 }}>+ Polizza Zurich gratis</div>
            </div>
          }
        />
      </div>

      <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif", marginBottom: 20, textAlign: 'center' }}>Confronta le singole offerte</h3>

      <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 16, padding: '16px 20px', marginBottom: 24, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
        <strong>ℹ️ Nota sulle stime:</strong>
        <div style={{ display: disclaimerOpen ? 'block' : '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 4 }}>
          I prezzi del comparatore qui sotto sono <strong>stime del costo annuo totale</strong> (che includono oneri di sistema, trasporto, accise e IVA simulati tramite un moltiplicatore medio). Poiché le imposte e i costi di trasporto variano in base alla tua zona e agli scaglioni esatti, usa questi dati per confrontare la convenienza tra fornitori, ma verifica il costo preciso sul sito ufficiale. <em>L'offerta in evidenza in alto, invece, ha i prezzi della componente materia prima già verificati e aggiornati manualmente.</em>
        </div>
        <button onClick={() => setDisclaimerOpen(!disclaimerOpen)} style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 800, fontSize: 12, padding: 0, marginTop: 6, cursor: 'pointer', textDecoration: 'underline' }}>
          {disclaimerOpen ? 'Riduci ↑' : 'Leggi tutto ↓'}
        </button>
        <span style={{ fontSize: 11, opacity: 0.8, display: 'block', marginTop: 8 }}>Ultimo aggiornamento indici (PUN/PSV): {INDICI_MERCATO.ultimoAggiornamento}</span>
      </div>

      {/* ══════ FILTER BAR COMPATTA ══════ */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={segLabel}>Energia</span>
          <div style={segTrack}>
            <button onClick={() => setActiveTab('gas')} style={segBtn(activeTab === 'gas', '#dc2626')}>🔥 Gas</button>
            <button onClick={() => setActiveTab('luce')} style={segBtn(activeTab === 'luce', '#d97706')}>⚡ Luce</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={segLabel}>Tipo</span>
          <div style={segTrack}>
            <button onClick={() => setTipoTariffa('fissa')} style={segBtn(tipoTariffa === 'fissa', currentColor)}>🔒 Fissa</button>
            <button onClick={() => setTipoTariffa('variabile')} style={segBtn(tipoTariffa === 'variabile', currentColor)}>📈 Variabile</button>
          </div>
        </div>
      </div>

      {(activeTab === 'gas' ? sortedGas : sortedLuce).map((p, i) => (
        <ProviderRow key={p.name} p={p} i={i} color={activeTab === 'gas' ? "#dc2626" : "#d97706"}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{p.name}</span>
              {i === 0 && <Badge text="MIGLIORE" color={activeTab === 'gas' ? "#dc2626" : "#d97706"} />}
            </div>
            <span style={{ fontSize: 13, color: '#64748b' }}>{p.tipo}</span>
          </div>
          
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Stima annua</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: activeTab === 'gas' ? "#dc2626" : "#d97706", lineHeight: 1.1 }}>€{Math.round(p.costoAnnuo)}</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{p.prezzo.toFixed(activeTab === 'gas' ? 2 : 3)} €/{activeTab === 'gas' ? 'Smc' : 'kWh'}</div>
          </div>
        </ProviderRow>
      ))}
      <style dangerouslySetInnerHTML={{__html: `@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}}/>
    </div>
  );
}