import React, { useState, useMemo } from 'react';
import { ENERGY_PROVIDERS, GAS_PROVIDERS } from '../data.js';
import { ProviderRow, AffiliateRow, Badge } from './Comparators.jsx';

// Provider affiliati — esclusi dalle liste sotto
const AFFILIATE_NAMES_LUCE = ['Reset Energia'];
const AFFILIATE_NAMES_GAS = ['Eni Plenitude'];

// Provider da escludere sempre (irrilevanti o duplicati)
const EXCLUDED_NAMES = ['NeN', 'Nen', 'NEN', 'NeN Energia'];

// FIX: Injector sincronizzato con il nuovo layout premium (ombre dinamiche e bottoni outline)
function StyleInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      /* Hover avanzato per le ProviderCard */
      .provider-card { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
      .provider-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px -8px rgba(0,0,0,0.1) !important; border-color: #cbd5e1 !important; }
      
      /* Nuovo stile per il bottone secondario delle alternative */
      .btn-outline-premium { display: inline-block; font-size: 14px; font-weight: 700; color: var(--btn-color); padding: 10px 24px; border: 1.5px solid var(--btn-color); border-radius: 12px; text-decoration: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap; background: transparent; }
      .btn-outline-premium:hover { background: var(--btn-color); color: #fff; transform: translateY(-2px); box-shadow: 0 6px 16px -4px var(--btn-color); }

      /* Stile per i bottoni primari nei box affiliati */
      .btn-solid-premium { display: inline-block; text-align: center; font-size: 15px; font-weight: 700; color: #fff; background: var(--btn-bg); padding: 14px 24px; border-radius: 16px; text-decoration: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 8px 20px -6px var(--btn-bg); white-space: nowrap; }
      .btn-solid-premium:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px var(--btn-bg); filter: brightness(1.05); }
    `}} />
  );
}

function isExcluded(name) {
  const lower = name.toLowerCase();
  return EXCLUDED_NAMES.some(ex => lower.includes(ex.toLowerCase()));
}

export function LuceGasComp({ color = '#f59e0b' }) {
  const [activeTab, setActiveTab] = useState('gas');

  const [consumoLuce, setConsumoLuce] = useState(2700);
  const [consumoGas, setConsumoGas] = useState(1000);

  const sortedLuce = useMemo(() => {
    return ENERGY_PROVIDERS
      .filter(p => !AFFILIATE_NAMES_LUCE.includes(p.name) && !isExcluded(p.name))
      .map(p => ({ ...p, costoAnnuo: p.prezzo * consumoLuce + p.fisso * 12 }))
      .sort((a, b) => a.costoAnnuo - b.costoAnnuo);
  }, [consumoLuce]);

  const sortedGas = useMemo(() => {
    return GAS_PROVIDERS
      .filter(p => !AFFILIATE_NAMES_GAS.includes(p.name) && !isExcluded(p.name))
      .map(p => ({ ...p, costoAnnuo: p.prezzo * consumoGas + p.fisso * 12 }))
      .sort((a, b) => a.costoAnnuo - b.costoAnnuo);
  }, [consumoGas]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <StyleInjector />

      {/* 🏆 BOX AFFILIATO ENI PLENITUDE — SOPRA LE TAB */}
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

      {/* SELETTORE TAB — Gas prima, Luce dopo */}
      <div style={{ display: 'flex', background: '#f1f5f9', padding: 6, borderRadius: 20, marginBottom: 32, gap: 4 }}>
        <button onClick={() => setActiveTab('gas')}
          style={{ flex: 1, padding: '12px 24px', borderRadius: 16, border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer', transition: 'all 0.3s', background: activeTab === 'gas' ? '#fff' : 'transparent', color: activeTab === 'gas' ? '#dc2626' : '#64748b', boxShadow: activeTab === 'gas' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
          🔥 Gas
        </button>
        <button onClick={() => setActiveTab('luce')}
          style={{ flex: 1, padding: '12px 24px', borderRadius: 16, border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer', transition: 'all 0.3s', background: activeTab === 'luce' ? '#fff' : 'transparent', color: activeTab === 'luce' ? '#d97706' : '#64748b', boxShadow: activeTab === 'luce' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
          ⚡ Luce
        </button>
      </div>

      {/* VISTA GAS */}
      {activeTab === 'gas' && (
        <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: 24, padding: 28, border: '1px solid rgba(0,0,0,0.04)', marginBottom: 24 }}>
            <label style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 12 }}>
              Consumo annuo stimato: <span style={{ color: '#dc2626' }}>{consumoGas.toLocaleString('it-IT')} Smc</span>
            </label>
            <input type="range" min={200} max={2500} step={50} value={consumoGas} onChange={(e) => setConsumoGas(+e.target.value)} style={{ width: '100%', accentColor: '#dc2626', height: 8, background: '#e2e8f0', borderRadius: 4, outline: 'none' }} />
          </div>

          {sortedGas.map((p, i) => (
            <ProviderRow key={p.name} p={p} i={i} color="#dc2626">
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{p.name}</span>
                  {i === 0 && <Badge text="MIGLIORE" color="#dc2626" />}
                </div>
                <span style={{ fontSize: 13, color: '#64748b' }}>{p.tipo}</span>
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#94a3b8' }}>€/Smc</div><div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{p.prezzo.toFixed(2)}</div></div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16 }}><div style={{ fontSize: 11, color: '#94a3b8' }}>Stima annua</div><div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>€{Math.round(p.costoAnnuo)}</div></div>
              </div>
            </ProviderRow>
          ))}
        </div>
      )}

      {/* VISTA LUCE */}
      {activeTab === 'luce' && (
        <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: 24, padding: 28, border: '1px solid rgba(0,0,0,0.04)', marginBottom: 24 }}>
            <label style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 12 }}>
              Consumo annuo stimato: <span style={{ color: '#d97706' }}>{consumoLuce.toLocaleString('it-IT')} kWh</span>
            </label>
            <input type="range" min={1000} max={6000} step={100} value={consumoLuce} onChange={(e) => setConsumoLuce(+e.target.value)} style={{ width: '100%', accentColor: '#d97706', height: 8, background: '#e2e8f0', borderRadius: 4, outline: 'none' }} />
          </div>

          {sortedLuce.map((p, i) => (
            <ProviderRow key={p.name} p={p} i={i} color="#d97706">
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{p.name}</span>
                  {i === 0 && <Badge text="MIGLIORE" color="#d97706" />}
                </div>
                <span style={{ fontSize: 13, color: '#64748b' }}>{p.tipo}</span>
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#94a3b8' }}>€/kWh</div><div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{p.prezzo.toFixed(3)}</div></div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16 }}><div style={{ fontSize: 11, color: '#94a3b8' }}>Stima annua</div><div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>€{Math.round(p.costoAnnuo)}</div></div>
              </div>
            </ProviderRow>
          ))}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}}/>
    </div>
  );
}