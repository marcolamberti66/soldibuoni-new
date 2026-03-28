import React, { useState, useMemo, useEffect } from 'react';
import {
  ENERGY_PROVIDERS,
  GAS_PROVIDERS,
  INTERNET_PROVIDERS,
  INSURANCE_DATA,
  HEALTH_INSURANCE,
  PENSION_FUNDS,
  UNI_FACOLTA,
  UNI_DATA,
} from '../data.js';

let PRICES_LAST_UPDATED = null;
let PRICES_SOURCE = 'hardcoded';

export function ProviderRow({ p, i, color, children }) {
  // Fallback dinamico intelligente se manca il link ufficiale
  const finalLink = p.link || `https://www.google.com/search?q=${encodeURIComponent(p.name + " offerta sito ufficiale")}`;

  return (
    <div
      className="comparator-row"
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 8,
        border: i === 0 ? '2px solid ' + color : '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        animation: 'slideUp 0.3s ease-out ' + i * 0.04 + 's both',
      }}
    >
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          minWidth: 280,
        }}
      >
        {children}
      </div>

      <div
        style={{
          width: 130,
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
        }}
      >
        <a
          href={finalLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: color,
            fontWeight: 700,
            textDecoration: 'none',
            padding: '6px 14px',
            border: '2px solid ' + color,
            borderRadius: 8,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.target.style.background = color;
            e.target.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = color;
          }}
        >
          Vai all'offerta →
        </a>
      </div>
    </div>
  );
}

export function Badge({ text, color }) {
  return (
    <span
      style={{
        background: color,
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 10,
      }}
    >
      {text}
    </span>
  );
}

export function EnergiaComp({ color }) {
  const [consumo, setConsumo] = useState(2700);
  const [filtroTipo, setFiltroTipo] = useState('tutti');
  const [sort, setSort] = useState('costo');

  const [providers, setProviders] = useState(ENERGY_PROVIDERS);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices", { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!res.ok) return;
        const payload = await res.json();
        
        const validEnergia = Array.isArray(payload?.data?.energia) 
          ? payload.data.energia.filter(p => typeof p.prezzo === 'number' && !isNaN(p.prezzo)) 
          : [];

        if (validEnergia.length >= 3) {
          setProviders(validEnergia);
          setIsLive(true);
          if (payload?.lastUpdated) setLastUpdated(new Date(payload.lastUpdated));
        }
      } catch (err) {
        console.warn("⚠️ Backend non raggiungibile, uso fallback hardcoded.");
      }
    }
    fetchPrices();
  }, []);

  const sorted = useMemo(() => {
    let w = providers.map((p) => ({
      ...p,
      costoAnnuo: p.prezzo * consumo + p.fisso * 12,
    }));
    if (filtroTipo === 'fisso')
      w = w.filter((p) => p.tipo && p.tipo.toLowerCase().startsWith('fisso'));
    if (filtroTipo === 'variabile')
      w = w.filter(
        (p) => p.tipo && p.tipo.toLowerCase().startsWith('variabil')
      );
    return sort === 'costo'
      ? w.sort((a, b) => a.costoAnnuo - b.costoAnnuo)
      : w.sort((a, b) => a.prezzo - b.prezzo);
  }, [consumo, sort, filtroTipo, providers]);

  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 24,
          color: '#0f172a',
          marginBottom: 18,
        }}
      >
        Comparatore Tariffe Energia
      </h2>
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 22,
          border: '1px solid #e2e8f0',
          marginBottom: 20,
        }}
      >
        <label
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#0f172a',
            display: 'block',
            marginBottom: 8,
          }}
        >
          Consumo annuo:{' '}
          <span style={{ color: color }}>{consumo.toLocaleString()} kWh</span>
        </label>
        <input
          type="range"
          min={1000}
          max={6000}
          step={100}
          value={consumo}
          onChange={(e) => setConsumo(+e.target.value)}
          style={{ width: '100%', accentColor: color }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#94a3b8',
          }}
        >
          <span>1.000</span>
          <span>6.000 kWh</span>
        </div>
      </div>
      <div
        style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}
      >
        {[
          ['tutti', 'Tutte'],
          ['fisso', 'Prezzo Fisso'],
          ['variabile', 'Prezzo Variabile'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFiltroTipo(v)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: filtroTipo === v ? 'none' : '1px solid #e2e8f0',
              fontSize: 13,
              fontWeight: 600,
              background: filtroTipo === v ? color : '#fff',
              color: filtroTipo === v ? '#fff' : '#64748b',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          ['costo', 'Costo annuo'],
          ['prezzo', 'Prezzo kWh'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setSort(v)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              background: sort === v ? '#0f172a' : '#f1f5f9',
              color: sort === v ? '#fff' : '#94a3b8',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {sorted.length === 0 && (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
          Nessuna offerta trovata per questo filtro.
        </p>
      )}
      {sorted.map((p, i) => (
        <ProviderRow
          key={(p.name || '') + p.tipo + p.prezzo}
          p={p}
          i={i}
          color={color}
        >
          <div style={{ flex: 1, minWidth: 160 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                {p.name}
              </span>
              {i === 0 && <Badge text="BEST" color={color} />}
              {p.verde && (
                <span style={{ fontSize: 11, color: '#059669' }}>🌿 Green</span>
              )}
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {p.tipo}
              {p.offerName ? ' — ' + p.offerName : p.note ? ' — ' + p.note : ''}
            </span>
          </div>
          <div
            className="comparator-stats"
            style={{ display: 'flex', gap: 20, alignItems: 'center' }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>€/kWh</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                {p.prezzo.toFixed(3)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Fisso/mese</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                €{p.fisso}
              </div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Stima annua</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: color }}>
                €{Math.round(p.costoAnnuo)}
              </div>
            </div>
          </div>
        </ProviderRow>
      ))}
      <p
        style={{
          fontSize: 11,
          color: '#94a3b8',
          marginTop: 14,
          fontStyle: 'italic',
        }}
      >
        * Stime basate sul consumo indicato.
        {lastUpdated
          ? ' Prezzi aggiornati il ' + lastUpdated.toLocaleDateString('it-IT') + '.'
          : ' Dati indicativi.'}
        {isLive && (
          <span style={{ color: '#059669', marginLeft: 6 }}>● Live</span>
        )}
      </p>
    </div>
  );
}

export function GasComp({ color }) {
  const [consumo, setConsumo] = useState(1000);
  const [filtroTipo, setFiltroTipo] = useState('tutti');

  const [providers, setProviders] = useState(GAS_PROVIDERS);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices", { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!res.ok) return;
        const payload = await res.json();
        
        const validGas = Array.isArray(payload?.data?.gas) 
          ? payload.data.gas.filter(p => typeof p.prezzo === 'number' && !isNaN(p.prezzo)) 
          : [];

        if (validGas.length >= 3) {
          setProviders(validGas);
          setIsLive(true);
          if (payload?.lastUpdated) setLastUpdated(new Date(payload.lastUpdated));
        }
      } catch (err) {
        console.warn("⚠️ Backend non raggiungibile, uso fallback hardcoded.");
      }
    }
    fetchPrices();
  }, []);

  const sorted = useMemo(() => {
    let w = providers.map((p) => ({
      ...p,
      costoAnnuo: p.prezzo * consumo + p.fisso * 12,
    }));
    if (filtroTipo === 'fisso')
      w = w.filter((p) => p.tipo && p.tipo.toLowerCase().startsWith('fisso'));
    if (filtroTipo === 'variabile')
      w = w.filter(
        (p) => p.tipo && p.tipo.toLowerCase().startsWith('variabil')
      );
    return w.sort((a, b) => a.costoAnnuo - b.costoAnnuo);
  }, [consumo, filtroTipo, providers]);

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: '#0f172a', marginBottom: 18 }}>
        Comparatore Tariffe Gas
      </h2>
      <div style={{ background: '#fff', borderRadius: 14, padding: 22, border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 8 }}>
          Consumo annuo: <span style={{ color: color }}>{consumo.toLocaleString()} Smc</span>
        </label>
        <input type="range" min={200} max={2500} step={50} value={consumo} onChange={(e) => setConsumo(+e.target.value)} style={{ width: '100%', accentColor: color }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
          <span>200</span>
          <span>2.500 Smc</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          ['tutti', 'Tutte'],
          ['fisso', 'Prezzo Fisso'],
          ['variabile', 'Prezzo Variabile'],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setFiltroTipo(v)} style={{ padding: '8px 16px', borderRadius: 8, border: filtroTipo === v ? 'none' : '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, background: filtroTipo === v ? color : '#fff', color: filtroTipo === v ? '#fff' : '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
            {l}
          </button>
        ))}
      </div>
      {sorted.length === 0 && (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Nessuna offerta trovata per questo filtro.</p>
      )}
      {sorted.map((p, i) => (
        <ProviderRow key={(p.name || '') + p.tipo + p.prezzo} p={p} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{p.name}</span>
              {i === 0 && <Badge text="BEST" color={color} />}
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {p.tipo}
              {p.offerName ? ' — ' + p.offerName : p.note ? ' — ' + p.note : ''}
            </span>
          </div>
          <div className="comparator-stats" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>€/Smc</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{p.prezzo.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Fisso/mese</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>€{p.fisso}</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Stima annua</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: color }}>€{Math.round(p.costoAnnuo)}</div>
            </div>
          </div>
        </ProviderRow>
      ))}
      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 14, fontStyle: 'italic' }}>
        * Stime basate sul consumo indicato.
        {lastUpdated ? ' Prezzi aggiornati il ' + lastUpdated.toLocaleDateString('it-IT') + '.' : ' Dati indicativi.'}
        {isLive && <span style={{ color: '#059669', marginLeft: 6 }}>● Live</span>}
      </p>
    </div>
  );
}

export function InternetComp({ color }) {
  const [filtroTipo, setFiltroTipo] = useState('tutti');

  const [providers, setProviders] = useState(INTERNET_PROVIDERS);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices", { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!res.ok) return;
        const payload = await res.json();
        
        const validInternet = Array.isArray(payload?.data?.internet) 
          ? payload.data.internet.filter(p => typeof p.prezzo === 'number' && !isNaN(p.prezzo)) 
          : [];

        if (validInternet.length >= 3) {
          setProviders(validInternet);
          setIsLive(true);
          if (payload?.lastUpdated) setLastUpdated(new Date(payload.lastUpdated));
        }
      } catch (err) {
        console.warn("⚠️ Backend non raggiungibile, uso fallback hardcoded.");
      }
    }
    fetchPrices();
  }, []);

  const sorted = useMemo(() => {
    let w = [...providers];
    if (filtroTipo !== 'tutti') w = w.filter((p) => p.tipo === filtroTipo);
    return w.sort((a, b) => a.prezzo - b.prezzo);
  }, [filtroTipo, providers]);

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: '#0f172a', marginBottom: 18 }}>
        Comparatore Offerte Internet
      </h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          ['tutti', 'Tutte'],
          ['FTTH', 'Fibra FTTH'],
          ['FWA', 'FWA Wireless'],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setFiltroTipo(v)} style={{ padding: '8px 16px', borderRadius: 8, border: filtroTipo === v ? 'none' : '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, background: filtroTipo === v ? color : '#fff', color: filtroTipo === v ? '#fff' : '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
            {l}
          </button>
        ))}
      </div>
      {sorted.length === 0 && (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Nessuna offerta trovata per questo filtro.</p>
      )}
      {sorted.map((p, i) => (
        <ProviderRow key={p.name} p={p} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{p.name}</span>
              {i === 0 && <Badge text="BEST" color={color} />}
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.note}</span>
          </div>
          <div className="comparator-stats" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Velocità</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{p.velocita}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Vincolo</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: p.vincolo === 'No' ? '#059669' : '#dc2626' }}>
                {p.vincolo}
              </div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>€/mese</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: color }}>€{p.prezzo.toFixed(2)}</div>
            </div>
          </div>
        </ProviderRow>
      ))}
      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 14, fontStyle: 'italic' }}>
        {lastUpdated ? 'Prezzi aggiornati il ' + lastUpdated.toLocaleDateString('it-IT') + '.' : 'Dati indicativi.'}
        {isLive && <span style={{ color: '#059669', marginLeft: 6 }}>● Live</span>}
      </p>
    </div>
  );
}

export function RCAutoComp({ color }) {
  const [garanzie, setGaranzie] = useState(['rc']);
  const toggle = (g) =>
    setGaranzie((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  const [insuranceData, setInsuranceData] = useState(INSURANCE_DATA);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices", { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return;
        const payload = await res.json();
        const valid = Array.isArray(payload?.data?.rc_auto)
          ? payload.data.rc_auto.filter(p => typeof p.rc === 'number' && !isNaN(p.rc))
          : [];
        if (valid.length >= 3) {
          setInsuranceData(valid);
          setIsLive(true);
          if (payload?.lastUpdated) setLastUpdated(new Date(payload.lastUpdated));
        }
      } catch (err) {
        console.warn("⚠️ Backend non raggiungibile per RC Auto, uso fallback.");
      }
    }
    fetchPrices();
  }, []);

  const sorted = useMemo(() => {
    return insuranceData.map((p) => {
      let tot = p.rc;
      if (garanzie.includes('furto')) tot += p.furto;
      if (garanzie.includes('kasko')) tot += p.kasko;
      if (garanzie.includes('cristalli')) tot += p.cristalli;
      if (garanzie.includes('assistenza')) tot += p.assistenza;
      return { ...p, tot };
    }).sort((a, b) => a.tot - b.tot);
  }, [garanzie, insuranceData]);

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: 24, borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#0f172a' }}>Aggiungi garanzie (Stima)</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { id: 'furto', label: 'Furto/Incendio' },
            { id: 'kasko', label: 'Kasko' },
            { id: 'cristalli', label: 'Cristalli' },
            { id: 'assistenza', label: 'Assistenza' }
          ].map(g => (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: garanzie.includes(g.id) ? `2px solid ${color}` : '1px solid #cbd5e1',
                background: garanzie.includes(g.id) ? `${color}14` : '#fff',
                color: garanzie.includes(g.id) ? color : '#475569',
                transition: 'all 0.2s'
              }}
            >
              {garanzie.includes(g.id) && '✓ '} {g.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        {sorted.map((p, i) => (
          <div key={i} style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 18, color: '#0f172a' }}>{p.name}</strong>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{p.note}</p>
            </div>
            <div style={{ textAlign: 'right', flex: '1 1 150px' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Premio medio annuo</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>€{p.tot}</div>
            </div>
            <a 
              href={p.link || `https://www.google.com/search?q=${encodeURIComponent(p.name + " assicurazione rc auto preventivo ufficiale")}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ background: color, color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', minWidth: '180px', transition: 'transform 0.2s' }} 
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} 
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              Calcola Preventivo Esatto
            </a>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b' }}>
        <p style={{ margin: 0 }}>
          * I prezzi mostrati sono stime calcolate su medie di mercato (Profilo standard, Classe 1, Milano). 
          <strong> Clicca su "Calcola Preventivo Esatto" per l'offerta reale.</strong>
        </p>
        <div>
          {lastUpdated ? 'Aggiornato il ' + lastUpdated.toLocaleDateString('it-IT') : ''}
          {isLive && <span style={{ color: '#0284c7', marginLeft: 8, fontWeight: 600, padding: '4px 8px', background: '#e0f2fe', borderRadius: 4 }}>📊 Stima di Mercato</span>}
        </div>
      </div>
    </div>
  );
}

export function SaluteComp({ color }) {
  const [piano, setPiano] = useState('standard');
  const sorted = useMemo(
    () => [...HEALTH_INSURANCE].sort((a, b) => a[piano] - b[piano]),
    [piano]
  );
  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 24,
          color: '#0f172a',
          marginBottom: 18,
        }}
      >
        Comparatore Assicurazioni Sanitarie
      </h2>
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 22,
          border: '1px solid #e2e8f0',
          marginBottom: 20,
        }}
      >
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#0f172a',
            marginBottom: 10,
          }}
        >
          Livello di copertura:
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            ['base', 'Base'],
            ['standard', 'Standard'],
            ['premium', 'Premium'],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setPiano(v)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                background: piano === v ? color : '#f1f5f9',
                color: piano === v ? '#fff' : '#64748b',
                cursor: 'pointer',
                fontFamily: 'inherit',
                flex: 1,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {sorted.map((p, i) => (
        <ProviderRow key={p.name} p={p} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                {p.name}
              </span>
              {i === 0 && <Badge text="BEST" color={color} />}
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.note}</span>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {p.dentale && (
                <span
                  style={{
                    fontSize: 10,
                    background: '#dcfce7',
                    color: '#166534',
                    padding: '1px 6px',
                    borderRadius: 8,
                  }}
                >
                  Dentale
                </span>
              )}
              {p.oculistica && (
                <span
                  style={{
                    fontSize: 10,
                    background: '#dbeafe',
                    color: '#1e40af',
                    padding: '1px 6px',
                    borderRadius: 8,
                  }}
                >
                  Oculistica
                </span>
              )}
              {p.ricovero && (
                <span
                  style={{
                    fontSize: 10,
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '1px 6px',
                    borderRadius: 8,
                  }}
                >
                  Ricovero
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>€/mese</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: color }}>
              €{p[piano]}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              €{(p[piano] * 12).toLocaleString()}/anno
            </div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}

export function IstruzioneComp({ color }) {
  const [facolta, setFacolta] = useState('Economia');
  const [livello, setLivello] = useState('med');
  
  const [uniData, setUniData] = useState(UNI_DATA);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices", { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!res.ok) return;
        const payload = await res.json();
        
        if (payload?.data?.universita && Object.keys(payload.data.universita).length > 0) {
          setUniData(payload.data.universita);
          setIsLive(true);
          if (payload?.lastUpdated) setLastUpdated(new Date(payload.lastUpdated));
        }
      } catch (err) {
        console.warn("⚠️ Backend non raggiungibile per Università, uso fallback hardcoded.");
      }
    }
    fetchPrices();
  }, []);

  const data = uniData[facolta] || [];
  const sorted = useMemo(
    () => [...data].sort((a, b) => a[livello] - b[livello]),
    [data, livello]
  );
  const maxVal = Math.max(...sorted.map((s) => s[livello]), 1);

  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 24,
          color: '#0f172a',
          marginBottom: 18,
        }}
      >
        Comparatore Costi Universitari
      </h2>
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 22,
          border: '1px solid #e2e8f0',
          marginBottom: 14,
        }}
      >
        <label
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#0f172a',
            display: 'block',
            marginBottom: 8,
          }}
        >
          Facoltà:
        </label>
        <div
          className="facolta-pills"
          style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}
        >
          {UNI_FACOLTA.map((f) => (
            <button
              key={f}
              onClick={() => setFacolta(f)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                background: facolta === f ? color : '#f1f5f9',
                color: facolta === f ? '#fff' : '#64748b',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 22,
          border: '1px solid #e2e8f0',
          marginBottom: 20,
        }}
      >
        <label
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#0f172a',
            display: 'block',
            marginBottom: 8,
          }}
        >
          Livello ISEE:
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            ['min', 'Minimo'],
            ['med', 'Medio'],
            ['max', 'Massimo'],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setLivello(v)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                background: livello === v ? color : '#f1f5f9',
                color: livello === v ? '#fff' : '#64748b',
                cursor: 'pointer',
                fontFamily: 'inherit',
                flex: 1,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {sorted.map((u, i) => (
        <div
          key={u.uni}
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 8,
            border: i === 0 ? '2px solid ' + color : '1px solid #e2e8f0',
            animation: 'slideUp 0.3s ease-out ' + i * 0.04 + 's both',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}
                >
                  {u.uni}
                </span>
                {i === 0 && <Badge text="PIÙ ECONOMICA" color={color} />}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 8,
                    background: u.tipo === 'Pubblica' ? '#dcfce7' : '#fef3c7',
                    color: u.tipo === 'Pubblica' ? '#166534' : '#92400e',
                  }}
                >
                  {u.tipo}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{u.citta}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Retta annua</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: color }}>
                €{u[livello].toLocaleString()}
              </div>
            </div>
          </div>
          <div
            style={{
              background: '#f1f5f9',
              borderRadius: 6,
              height: 7,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 6,
                background:
                  'linear-gradient(90deg, ' + color + '88, ' + color + ')',
                width: (u[livello] / maxVal) * 100 + '%',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
              fontSize: 11,
              color: '#94a3b8',
            }}
          >
            <span>Min: €{u.min.toLocaleString()}</span>
            <span>Med: €{u.med.toLocaleString()}</span>
            <span>Max: €{u.max.toLocaleString()}</span>
          </div>
        </div>
      ))}
      <p
        style={{
          fontSize: 11,
          color: '#94a3b8',
          marginTop: 14,
          fontStyle: 'italic',
        }}
      >
        {lastUpdated
          ? ' Dati aggiornati il ' + lastUpdated.toLocaleDateString('it-IT') + '.'
          : ' Dati A.A. 2025/2026.'}
        {isLive && (
          <span style={{ color: '#059669', marginLeft: 6 }}>● Live</span>
        )}
      </p>
    </div>
  );
}

export function PensioneComp({ color }) {
  const [funds, setFunds] = useState(PENSION_FUNDS);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices", { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return;
        const payload = await res.json();
        const valid = Array.isArray(payload?.data?.pensione)
          ? payload.data.pensione.filter(p => typeof p.costo === 'number' && !isNaN(p.costo))
          : [];
        if (valid.length >= 3) {
          setFunds(valid);
          setIsLive(true);
          if (payload?.lastUpdated) setLastUpdated(new Date(payload.lastUpdated));
        }
      } catch (err) {
        console.warn("⚠️ Backend non raggiungibile per Pensione, uso fallback.");
      }
    }
    fetchPrices();
  }, []);

  const sorted = useMemo(
    () => [...funds].sort((a, b) => a.costo - b.costo),
    [funds]
  );
  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 24,
          color: '#0f172a',
          marginBottom: 18,
        }}
      >
        Comparatore Fondi Pensione
      </h2>
      {sorted.map((p, i) => (
        <ProviderRow key={p.name} p={p} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                {p.name}
              </span>
              {i === 0 && <Badge text="BEST" color={color} />}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 8,
                  background:
                    p.tipo === 'Negoziale'
                      ? '#dcfce7'
                      : p.tipo === 'Aperto'
                      ? '#dbeafe'
                      : '#fef3c7',
                  color:
                    p.tipo === 'Negoziale'
                      ? '#166534'
                      : p.tipo === 'Aperto'
                      ? '#1e40af'
                      : '#92400e',
                }}
              >
                {p.tipo}
              </span>
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.note}</span>
          </div>
          <div
            className="comparator-stats"
            style={{ display: 'flex', gap: 16, alignItems: 'center' }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>ISC</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                {p.costo}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Rend. 5a</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#059669' }}>
                +{p.rendimento5y}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Rend. 10a</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#059669' }}>
                +{p.rendimento10y}%
              </div>
            </div>
          </div>
        </ProviderRow>
      ))}
      <p
        style={{
          fontSize: 11,
          color: '#94a3b8',
          marginTop: 14,
          fontStyle: 'italic',
        }}
      >
        {lastUpdated
          ? 'Dati aggiornati il ' + lastUpdated.toLocaleDateString('it-IT') + '.'
          : 'Dati indicativi.'}
        {isLive && <span style={{ color: '#059669', marginLeft: 6 }}>● Live</span>}
      </p>
    </div>
  );
}

export function CalendarioAuto({ color }) {
  const [form, setForm] = useState({
    targa: '',
    immatricolazione: '',
    ultimoTagliando: '',
    kmAttuali: '',
    ultimaRevisione: '',
    email: '',
    nome: '',
  });
  const [scadenze, setScadenze] = useState(null);
  const [apiStatus, setApiStatus] = useState('idle');

  const calcola = async () => {
    if (!form.email || !form.email.includes('@')) {
      alert('Inserisci un indirizzo email valido');
      return;
    }
    if (!form.nome) {
      alert('Inserisci il tuo nome');
      return;
    }
    if (!form.immatricolazione) {
      alert('Inserisci la data di immatricolazione');
      return;
    }

    const s = [];
    const now = new Date();
    const scadenzeDates = {};

    if (form.immatricolazione) {
      const imm = new Date(form.immatricolazione);
      let nb = new Date(now.getFullYear(), imm.getMonth(), 1);
      if (nb < now) nb.setFullYear(nb.getFullYear() + 1);
      s.push({
        tipo: 'Bollo Auto',
        data: nb,
        icon: '💳',
        desc: 'Pagamento annuale tassa di possesso',
      });
      scadenzeDates.bollo = nb.toISOString().split('T')[0];

      let revDate;
      const ur = form.ultimaRevisione ? new Date(form.ultimaRevisione) : null;
      if (ur) {
        revDate = new Date(ur);
        revDate.setFullYear(revDate.getFullYear() + 2);
      } else {
        revDate = new Date(imm);
        revDate.setFullYear(revDate.getFullYear() + 4);
      }
      if (revDate < now) revDate.setFullYear(revDate.getFullYear() + 2);
      s.push({
        tipo: 'Revisione',
        data: revDate,
        icon: '🔍',
        desc: 'Controllo obbligatorio sicurezza e emissioni',
      });
      scadenzeDates.revisione = revDate.toISOString().split('T')[0];
    }
    if (form.ultimoTagliando) {
      const ut = new Date(form.ultimoTagliando);
      ut.setFullYear(ut.getFullYear() + 1);
      if (ut < now) ut.setFullYear(now.getFullYear() + 1);
      s.push({
        tipo: 'Tagliando',
        data: ut,
        icon: '🔧',
        desc: 'Manutenzione programmata (ogni 15.000 km o 12 mesi)',
      });
      scadenzeDates.tagliando = ut.toISOString().split('T')[0];
    }
    let gi = new Date(now.getFullYear(), 10, 15);
    if (gi < now) gi.setFullYear(gi.getFullYear() + 1);
    s.push({
      tipo: 'Cambio gomme invernali',
      data: gi,
      icon: '🛞',
      desc: 'Obbligo pneumatici invernali o catene (15 nov - 15 apr)',
    });
    scadenzeDates.gommeInvernali = gi.toISOString().split('T')[0];

    let ge = new Date(now.getFullYear(), 3, 15);
    if (ge < now) ge.setFullYear(ge.getFullYear() + 1);
    s.push({
      tipo: 'Cambio gomme estive',
      data: ge,
      icon: '☀️',
      desc: 'Fine obbligo pneumatici invernali',
    });
    scadenzeDates.gommeEstive = ge.toISOString().split('T')[0];

    s.sort((a, b) => a.data - b.data);
    setScadenze(s);

    setApiStatus('loading');
    try {
      const res = await fetch('/api/brevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'car_reminder',
          email: form.email,
          nome: form.nome,
          targa: form.targa,
          scadenze: scadenzeDates,
        }),
      });
      if (res.ok) {
        setApiStatus('success');
      } else {
        setApiStatus('error');
      }
    } catch (e) {
      setApiStatus('error');
    }
  };

  const is_ = {
    padding: '11px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    background: '#f8fafc',
  };
  return (
    <div>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 24,
          color: '#0f172a',
          marginBottom: 6,
        }}
      >
        Calendario Manutenzione Auto
      </h2>
      <p
        style={{
          color: '#64748b',
          fontSize: 14,
          marginBottom: 20,
          lineHeight: 1.6,
        }}
      >
        Inserisci i dati del veicolo e ricevi promemoria via email una settimana
        prima di ogni scadenza.
      </p>
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 24,
          border: '1px solid #e2e8f0',
          marginBottom: 20,
        }}
      >
        <div
          className="calendar-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                display: 'block',
                marginBottom: 3,
              }}
            >
              Nome *
            </label>
            <input
              style={is_}
              placeholder="Mario Rossi"
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                display: 'block',
                marginBottom: 3,
              }}
            >
              Email *
            </label>
            <input
              type="email"
              style={is_}
              placeholder="mario@email.it"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                display: 'block',
                marginBottom: 3,
              }}
            >
              Targa
            </label>
            <input
              style={is_}
              placeholder="AB123CD"
              value={form.targa}
              onChange={(e) =>
                setForm((p) => ({ ...p, targa: e.target.value.toUpperCase() }))
              }
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                display: 'block',
                marginBottom: 3,
              }}
            >
              Data immatricolazione *
            </label>
            <input
              type="date"
              style={is_}
              value={form.immatricolazione}
              onChange={(e) =>
                setForm((p) => ({ ...p, immatricolazione: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                display: 'block',
                marginBottom: 3,
              }}
            >
              Ultimo tagliando
            </label>
            <input
              type="date"
              style={is_}
              value={form.ultimoTagliando}
              onChange={(e) =>
                setForm((p) => ({ ...p, ultimoTagliando: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                display: 'block',
                marginBottom: 3,
              }}
            >
              Ultima revisione
            </label>
            <input
              type="date"
              style={is_}
              value={form.ultimaRevisione}
              onChange={(e) =>
                setForm((p) => ({ ...p, ultimaRevisione: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                display: 'block',
                marginBottom: 3,
              }}
            >
              Km attuali
            </label>
            <input
              type="number"
              style={is_}
              placeholder="85000"
              value={form.kmAttuali}
              onChange={(e) =>
                setForm((p) => ({ ...p, kmAttuali: e.target.value }))
              }
            />
          </div>
        </div>
        <button
          onClick={calcola}
          disabled={apiStatus === 'loading'}
          style={{
            background:
              apiStatus === 'loading'
                ? '#94a3b8'
                : 'linear-gradient(135deg, ' + color + ', ' + color + 'cc)',
            color: '#fff',
            border: 'none',
            padding: '13px 28px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            cursor: apiStatus === 'loading' ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            marginTop: 18,
            width: '100%',
          }}
        >
          {apiStatus === 'loading'
            ? 'Invio in corso...'
            : 'Calcola Scadenze & Attiva Promemoria'}
        </button>
      </div>
      {scadenze && (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 20,
              color: '#0f172a',
              marginBottom: 14,
            }}
          >
            Le tue prossime scadenze
          </h3>
          {scadenze.map((s, i) => {
            const days = Math.ceil((s.data - new Date()) / 86400000);
            const urgent = days < 30;
            return (
              <div
                key={i}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 8,
                  border: '1px solid ' + (urgent ? '#fecaca' : '#e2e8f0'),
                  borderLeft: '4px solid ' + (urgent ? '#dc2626' : color),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  animation: 'slideUp 0.3s ease-out ' + i * 0.08 + 's both',
                }}
              >
                <span style={{ fontSize: 26 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      color: '#0f172a',
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 1,
                    }}
                  >
                    {s.tipo}
                  </h4>
                  <p style={{ color: '#64748b', fontSize: 12 }}>{s.desc}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: urgent ? '#dc2626' : '#0f172a',
                    }}
                  >
                    {s.data.toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: urgent ? '#dc2626' : '#64748b',
                    }}
                  >
                    {days > 0 ? 'tra ' + days + ' giorni' : 'SCADUTA'}
                  </div>
                </div>
              </div>
            );
          })}
          {apiStatus === 'success' && (
            <div
              style={{
                background: '#f0fdf4',
                borderRadius: 12,
                padding: 18,
                marginTop: 14,
                border: '1px solid #bbf7d0',
              }}
            >
              <p style={{ color: '#166534', fontSize: 14 }}>
                ✅ <strong>Promemoria attivati!</strong> Abbiamo inviato
                un'email di conferma con il riepilogo a{' '}
                <strong>{form.email}</strong>. Riceverai un promemoria una
                settimana prima di ogni scadenza.
              </p>
            </div>
          )}
          {apiStatus === 'error' && (
            <div
              style={{
                background: '#fef2f2',
                borderRadius: 12,
                padding: 18,
                marginTop: 14,
                border: '1px solid #fecaca',
              }}
            >
              <p style={{ color: '#991b1b', fontSize: 14 }}>
                ⚠️ Le scadenze sono state calcolate correttamente, ma si è
                verificato un errore nell'attivazione dei promemoria email.
                Riprova più tardi o contattaci.
              </p>
            </div>
          )}
          {apiStatus === 'loading' && (
            <div
              style={{
                background: '#f0f9ff',
                borderRadius: 12,
                padding: 18,
                marginTop: 14,
                border: '1px solid #bae6fd',
              }}
            >
              <p style={{ color: '#0c4a6e', fontSize: 14 }}>
                ⏳ Attivazione promemoria in corso...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GenericComp({ color }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 36,
        border: '1px solid #e2e8f0',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 14 }}>🚧</div>
      <h3
        style={{
          color: '#0f172a',
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Comparatore in arrivo
      </h3>
      <p
        style={{
          color: '#64748b',
          fontSize: 14,
          maxWidth: 380,
          margin: '0 auto',
        }}
      >
        Questa sezione è in fase di sviluppo. Registrati per una notifica.
      </p>
    </div>
  );
}