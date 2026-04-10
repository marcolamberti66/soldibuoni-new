import React, { useState, useEffect, useMemo } from 'react';
import { ENERGY_PROVIDERS, GAS_PROVIDERS } from '../data.js';
import { ProviderRow, AffiliateRow, Badge } from './Comparators.jsx';

// Provider affiliati — esclusi dalle liste sotto
const AFFILIATE_NAMES_LUCE = ['Reset Energia'];
const AFFILIATE_NAMES_GAS = ['Eni Plenitude'];

function mergeWithLinks(blobData, fallbackData) {
  const linkMap = {};
  fallbackData.forEach(p => { if (p.link) linkMap[p.name] = p.link; });
  return blobData.map(p => ({ ...p, link: p.link || linkMap[p.name] || null }));
}

// FIX: Inietto il CSS mancante per far tornare i bottoni colorati nei box
function StyleInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      .btn-solid-premium { display: inline-block; text-align: center; font-size: 15px; font-weight: 700; color: #fff; background: var(--btn-bg); padding: 14px 24px; border-radius: 16px; text-decoration: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 8px 20px -6px var(--btn-bg); white-space: nowrap; }
      .btn-solid-premium:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px var(--btn-bg); filter: brightness(1.05); }
    `}} />
  );
}

export function LuceGasComp({ color = '#f59e0b' }) {
  const [activeTab, setActiveTab] = useState('gas');

  const [consumoLuce, setConsumoLuce] = useState(2700);
  const [providersLuce, setProvidersLuce] = useState(ENERGY_PROVIDERS);
  
  const [consumoGas, setConsumoGas] = useState(1000);
  const [providersGas, setProvidersGas] = useState(GAS_PROVIDERS);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices");
        if (!res.ok) return;
        const payload = await res.json();
        if (Array.isArray(payload?.data?.energia)) {
          setProvidersLuce(mergeWithLinks(payload.data.energia.filter(p => typeof p.prezzo === 'number'), ENERGY_PROVIDERS));
        }
        if (Array.isArray(payload?.data?.gas)) {
          setProvidersGas(mergeWithLinks(payload.data.gas.filter(p => typeof p.prezzo === 'number'), GAS_PROVIDERS));
        }
      } catch (err) { console.warn("Uso fallback hardcoded."); }
    }
    fetchPrices();
  }, []);

  const sortedLuce = useMemo(() => {
    return providersLuce
      .filter(p => !AFFILIATE_NAMES_LUCE.includes(p.name))
      .map(p => ({ ...p, costoAnnuo: p.prezzo * consumoLuce + p.fisso * 12 }))
      .sort((a, b) => a.costoAnnuo - b.costoAnnuo);
  }, [consumoLuce, providersLuce]);

  const sortedGas = useMemo(() => {
    return providersGas
      .filter(p => !AFFILIATE_NAMES_GAS.includes(p.name))
      .map(p => ({ ...p, costoAnnuo: p.prezzo * consumoGas + p.fisso * 12 }))
      .sort((a, b) => a.costoAnnuo - b.costoAnnuo);
  }, [consumoGas, providersGas]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <StyleInjector />

      {/* 🏆 BOX AFFILIATO ENI PLENITUDE — SOPRA LE TAB */}
      <div style={{ marginBottom: 40 }}>
        <AffiliateRow 
          title="OFFERTA LUCE + GAS COMBINATA"
          providerName="Eni Plenitude — Luce & Gas"
          description="Pacchetto combinato Luce + Gas con gestione digitale, buono spesa da 100€ e sicurezza di un grande gruppo. Offerte Fixa Time Smart e Trend Casa disponibili."
          link="https://www.awin1.com/cread.php?awinmid=9529&awinaffid=2811530"
          color="#E2001A"
          statsElement={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Promo Attiva</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#E2001A' }}>Buono 100€</div>
            </div>
          }
          priceElement={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Attivazione</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>GRATIS</div>
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
