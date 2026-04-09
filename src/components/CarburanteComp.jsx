import React, { useState, useMemo } from 'react';
import { FUEL_PRICES } from '../data.js';
import { ProviderRow, AffiliateRow, Badge } from './Comparators.jsx'; 

const EASE_FLUID = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function CarburanteComp({ color = '#06b6d4' }) {
  const [kmAnnui, setKmAnnui] = useState(15000);
  const [currentFuel, setCurrentFuel] = useState('benzina');
  const [prices, setPrices] = useState(FUEL_PRICES);

  const costs = useMemo(() => {
    return Object.keys(prices).map(key => {
      const fuel = prices[key];
      let costoAnnuo = 0;
      if (key === 'elettrico') {
        costoAnnuo = (kmAnnui / 100) * fuel.defaultCons * fuel.price;
      } else {
        costoAnnuo = (kmAnnui / fuel.defaultCons) * fuel.price;
      }
      return { id: key, ...fuel, costoAnnuo: Math.round(costoAnnuo) };
    }).sort((a, b) => a.costoAnnuo - b.costoAnnuo);
  }, [kmAnnui, prices]);

  const maxCost = Math.max(...costs.map(c => c.costoAnnuo));

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      
      {/* PANNELLO DI CONTROLLO IDENTICO AI COMPARATORI */}
      <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: 24, padding: 32, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>1. Imposta la tua mobilità</h3>
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Chilometri percorsi all'anno:</span> 
            <span style={{ color: color, fontSize: 20 }}>{kmAnnui.toLocaleString('it-IT')} km</span>
          </label>
          <input type="range" min={5000} max={50000} step={1000} value={kmAnnui} onChange={(e) => setKmAnnui(+e.target.value)} style={{ width: '100%', accentColor: color, height: 8, background: '#e2e8f0', borderRadius: 4, outline: 'none', marginTop: 16, marginBottom: 8 }} />
        </div>
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12, display: 'block' }}>Cosa guidi attualmente?</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.keys(prices).map(key => (
              <button 
                key={key} onClick={() => setCurrentFuel(key)}
                style={{ padding: '10px 20px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.06)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: `all 0.3s ${EASE_FLUID}`, background: currentFuel === key ? color : '#fff', color: currentFuel === key ? '#fff' : '#64748b', flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <span>{prices[key].icon}</span> {prices[key].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGA AFFILIAZIONE */}
      <AffiliateRow 
        title="Consiglio di Mobilità" providerName="Telepass Plus" description="Salta le code in autostrada, paga i parcheggi e le strisce blu direttamente dall'app." link="[INSERISCI_LINK_TELEPASS]" color={color}
        priceElement={<><div style={{ fontSize: 11, color: '#94a3b8' }}>Canone 1° anno</div><div style={{ fontSize: 18, fontWeight: 800, color: color }}>Gratis</div></>}
      />

      <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif", marginBottom: 20 }}>Spesa Stimata Annuale</h3>

      {/* RISULTATI (Usa le ProviderRow degli altri comparatori) */}
      {costs.map((c, i) => (
        <ProviderRow key={c.id} p={{ name: c.label, link: null }} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{c.icon}</span>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 18 }}>{c.label}</span>
              {currentFuel === c.id && <Badge text="LA TUA AUTO" color="#475569" />}
              {i === 0 && <Badge text="PIÙ ECONOMICO" color={color} />}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 36px' }}>Prezzo medio: {c.price} {c.unit} • Consumo stima: {c.defaultCons} {c.id === 'elettrico' ? 'kWh/100km' : 'km/l'}</p>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16, minWidth: 100 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Spesa Annua</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: currentFuel === c.id ? '#0f172a' : color }}>€{c.costoAnnuo.toLocaleString('it-IT')}</div>
            </div>
          </div>
          <div style={{ width: '100%', background: '#f1f5f9', borderRadius: 8, height: 8, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: c.color, width: `${(c.costoAnnuo / maxCost) * 100}%`, borderRadius: 8, transition: 'width 0.5s ease' }}></div>
          </div>
        </ProviderRow>
      ))}
      <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 24, fontStyle: 'italic' }}>* Stime basate su consumi medi WLTP. L'elettricità si riferisce a ricarica domestica.</p>
    </div>
  );
}
