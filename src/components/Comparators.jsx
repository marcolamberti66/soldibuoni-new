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

const EASE_FLUID = 'cubic-bezier(0.16, 1, 0.3, 1)';

// ── COMPONENTE RIGA NORMALE ──
export function ProviderRow({ p, i, color, children }) {
  const finalLink = p.link || `https://www.google.com/search?q=${encodeURIComponent(p.name + " offerta sito ufficiale")}`;

  return (
    <div
      className="provider-card"
      style={{
        background: '#fff',
        borderRadius: 24,
        padding: '24px 28px',
        marginBottom: 16,
        border: '1px solid rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        transition: `all 0.4s ${EASE_FLUID}`,
        animation: `fadeInUp 0.5s ${EASE_FLUID} ${i * 0.05}s both`,
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 280 }}>
        {children}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <a
          href={finalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline-premium"
          style={{ '--btn-color': color }}
        >
          Vedi l'offerta →
        </a>
      </div>
    </div>
  );
}

// ── COMPONENTE RIGA AFFILIAZIONE (SCELTA SOLDIBUONI) ──
export function AffiliateRow({ title, providerName, description, link, priceElement, statsElement, color }) {
  return (
    <div
      className="affiliate-card"
      style={{
        background: `linear-gradient(145deg, #ffffff, rgba(255,255,255,0.9))`,
        borderRadius: 24,
        padding: '2px', // Bordo luminoso gradient
        marginBottom: 24,
        backgroundClip: 'padding-box',
        position: 'relative',
        animation: `fadeInUp 0.5s ${EASE_FLUID} both`,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 24, zIndex: 0,
        background: `linear-gradient(135deg, #FBBF24, ${color}, #FBBF24)`,
        opacity: 0.3,
      }}></div>
      
      <div style={{
        background: '#fff', borderRadius: 22, padding: '24px 28px',
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        position: 'relative', zIndex: 1,
        boxShadow: `0 10px 30px -10px ${color}40`,
      }}>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 6, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              🏆 {title}
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{providerName}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{description}</div>
        </div>

        {statsElement && (
          <div className="comparator-stats" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {statsElement}
            <div style={{ textAlign: 'center', minWidth: 80, borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16 }}>
              {priceElement}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, width: '100%', marginTop: 10 }}>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-solid-premium"
            style={{ '--btn-bg': color, width: '100%' }}
          >
            Scopri l'Offerta in Evidenza →
          </a>
        </div>
      </div>
    </div>
  );
}

export function Badge({ text, color }) {
  return (
    <span
      style={{
        background: `${color}1A`,
        color: color,
        fontSize: 10,
        fontWeight: 800,
        padding: '4px 10px',
        borderRadius: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
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

  useEffect(() => {
    async function fetchPrices() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices", { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return;
        const payload = await res.json();
        const validEnergia = Array.isArray(payload?.data?.energia) ? payload.data.energia.filter(p => typeof p.prezzo === 'number') : [];
        if (validEnergia.length >= 3) {
          setProviders(validEnergia);
          setIsLive(true);
        }
      } catch (err) { }
    }
    fetchPrices();
  }, []);

  const sorted = useMemo(() => {
    let w = providers.map((p) => ({ ...p, costoAnnuo: p.prezzo * consumo + p.fisso * 12 }));
    if (filtroTipo === 'fisso') w = w.filter((p) => p.tipo && p.tipo.toLowerCase().startsWith('fisso'));
    if (filtroTipo === 'variabile') w = w.filter((p) => p.tipo && p.tipo.toLowerCase().startsWith('variabil'));
    return sort === 'costo' ? w.sort((a, b) => a.costoAnnuo - b.costoAnnuo) : w.sort((a, b) => a.prezzo - b.prezzo);
  }, [consumo, sort, filtroTipo, providers]);

  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Comparatore Luce</h2>
      
      <div className="comp-controls glass-panel">
        <label className="comp-label">Consumo annuo: <span style={{ color }}>{consumo.toLocaleString()} kWh</span></label>
        <input type="range" min={1000} max={6000} step={100} value={consumo} onChange={(e) => setConsumo(+e.target.value)} className="custom-slider" style={{'--slider-color': color}} />
        <div className="comp-range-labels"><span>1.000</span><span>6.000 kWh</span></div>
        
        <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
          {[['tutti', 'Tutte'], ['fisso', 'Prezzo Fisso'], ['variabile', 'Prezzo Variabile']].map(([v, l]) => (
            <button key={v} onClick={() => setFiltroTipo(v)} className={`filter-btn ${filtroTipo === v ? 'active' : ''}`} style={{'--active-bg': color}}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── CARD AFFILIAZIONE ENERGIA ── */}
      <AffiliateRow 
        title="Scelta di SoldiBuoni"
        providerName="Reset Energia"
        description="Tariffa green 100% chiara, gestione smart e zero costi nascosti. Ideale per abbattere la bolletta."
        link="[INSERISCI_LINK_RESET_ENERGIA]"
        color={color}
        statsElement={
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Vantaggio</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Prezzo Ingrosso</div>
            </div>
          </>
        }
        priceElement={
          <>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Attivazione</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: color }}>Gratis</div>
          </>
        }
      />

      {sorted.map((p, i) => (
        <ProviderRow key={(p.name || '') + p.tipo + p.prezzo} p={p} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{p.name}</span>
              {i === 0 && <Badge text="PIÙ ECONOMICA" color={color} />}
              {p.verde && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>🌿 Green</span>}
            </div>
            <span style={{ fontSize: 13, color: '#64748b' }}>{p.tipo} {p.offerName ? ' — ' + p.offerName : ''}</span>
          </div>
          <div className="comparator-stats" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>€/kWh</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{p.prezzo.toFixed(3)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Fisso/mese</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>€{p.fisso}</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 80, borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Stima annua</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: color }}>€{Math.round(p.costoAnnuo)}</div>
            </div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}

export function GasComp({ color }) {
  const [consumo, setConsumo] = useState(1000);
  const [filtroTipo, setFiltroTipo] = useState('tutti');
  const [providers, setProviders] = useState(GAS_PROVIDERS);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices");
        if (!res.ok) return;
        const payload = await res.json();
        if (payload?.data?.gas) setProviders(payload.data.gas);
      } catch (err) { }
    }
    fetchPrices();
  }, []);

  const sorted = useMemo(() => {
    let w = providers.map((p) => ({ ...p, costoAnnuo: p.prezzo * consumo + p.fisso * 12 }));
    if (filtroTipo !== 'tutti') w = w.filter((p) => p.tipo && p.tipo.toLowerCase().includes(filtroTipo));
    return w.sort((a, b) => a.costoAnnuo - b.costoAnnuo);
  }, [consumo, filtroTipo, providers]);

  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Comparatore Gas</h2>
      <div className="comp-controls glass-panel">
        <label className="comp-label">Consumo annuo: <span style={{ color }}>{consumo.toLocaleString()} Smc</span></label>
        <input type="range" min={200} max={2500} step={50} value={consumo} onChange={(e) => setConsumo(+e.target.value)} className="custom-slider" style={{'--slider-color': color}} />
        <div className="comp-range-labels"><span>200</span><span>2.500 Smc</span></div>
      </div>
      {sorted.map((p, i) => (
        <ProviderRow key={(p.name || '') + p.tipo + p.prezzo} p={p} i={i} color={color}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{p.name}</span>
              {i === 0 && <Badge text="MIGLIORE" color={color} />}
            </div>
            <span style={{ fontSize: 13, color: '#64748b' }}>{p.tipo}</span>
          </div>
          <div className="comparator-stats" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>€/Smc</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{p.prezzo.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 80, borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Stima annua</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: color }}>€{Math.round(p.costoAnnuo)}</div>
            </div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}

export function InternetComp({ color }) {
  const [providers, setProviders] = useState(INTERNET_PROVIDERS);
  
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices");
        if (!res.ok) return;
        const payload = await res.json();
        if (payload?.data?.internet) setProviders(payload.data.internet);
      } catch (err) { }
    }
    fetchPrices();
  }, []);

  const sorted = [...providers].sort((a, b) => a.prezzo - b.prezzo);

  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Comparatore Internet & Fibra</h2>

      {/* ── CARD AFFILIAZIONE INTERNET ── */}
      <AffiliateRow 
        title="Offerta in Evidenza"
        providerName="Wind Tre"
        description="Super Fibra FTTH alla massima velocità. Modem incluso e zero vincoli nascosti per la tua casa."
        link="[INSERISCI_LINK_WIND_TRE]"
        color={color}
        statsElement={
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Velocità Fino a</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>2.5 Gbps</div>
          </div>
        }
        priceElement={
          <>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Prezzo Speciale</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: color }}>Vedi Sito</div>
          </>
        }
      />

      {sorted.map((p, i) => (
        <ProviderRow key={p.name} p={p} i={i} color={color}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 13, color: '#64748b' }}>{p.note}</span>
          </div>
          <div className="comparator-stats" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Velocità</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{p.velocita}</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 80, borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>€/mese</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: color }}>€{p.prezzo.toFixed(2)}</div>
            </div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}

export function RCAutoComp({ color }) {
  const [garanzie, setGaranzie] = useState(['rc']);
  const toggle = (g) => setGaranzie((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const [insuranceData, setInsuranceData] = useState(INSURANCE_DATA);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices");
        if (!res.ok) return;
        const payload = await res.json();
        if (payload?.data?.rc_auto) setInsuranceData(payload.data.rc_auto);
      } catch (err) { }
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
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Comparatore RC Auto</h2>
      
      <div className="comp-controls glass-panel" style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Aggiungi garanzie accessorie:</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ id: 'furto', l: 'Furto/Incendio' }, { id: 'kasko', l: 'Kasko' }, { id: 'cristalli', l: 'Cristalli' }, { id: 'assistenza', l: 'Assistenza' }].map(g => (
            <button key={g.id} onClick={() => toggle(g.id)} className={`filter-btn ${garanzie.includes(g.id) ? 'active' : ''}`} style={{'--active-bg': color}}>
              {garanzie.includes(g.id) && '✓ '} {g.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── CARD AFFILIAZIONE RC AUTO ── */}
      <AffiliateRow 
        title="Scelta di SoldiBuoni"
        providerName="Prima Assicurazioni"
        description="L'assicurazione online più scelta in Italia. Gestione sinistri rapida 100% via app e prezzi imbattibili."
        link="[INSERISCI_LINK_PRIMA_ASSICURAZIONI]"
        color={color}
        statsElement={
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Preventivo in</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>1 Minuto</div>
          </div>
        }
        priceElement={
          <>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Calcolo online</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: color }}>Gratuito</div>
          </>
        }
      />

      {sorted.map((p, i) => (
        <ProviderRow key={p.name} p={p} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 13, color: '#64748b' }}>{p.note}</span>
          </div>
          <div className="comparator-stats" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', minWidth: 80, borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Stima mercato</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: color }}>€{p.tot}</div>
            </div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}

// Dummy fallbacks for other components to avoid breaking if imported
export function SaluteComp({ color }) { return <GenericComp />; }
export function IstruzioneComp({ color }) { return <GenericComp />; }
export function PensioneComp({ color }) { return <GenericComp />; }
export function CalendarioAuto({ color }) { return <GenericComp />; }

export function GenericComp({ color }) {
  return (
    <div className="glass-panel" style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>🚀</div>
      <h3 style={{ color: '#0f172a', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>In Arrivo</h3>
      <p style={{ color: '#64748b', fontSize: 15 }}>Stiamo applicando il nuovo design premium a questa sezione.</p>
    </div>
  );
}

// ── INJECTION STILI GLOBALI COMPONENTI ──
function StyleInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      .comp-container { max-width: 800px; margin: 0 auto; }
      .comp-title { font-family: 'Playfair Display',serif; font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.5px; }
      .glass-panel { background: rgba(255,255,255,0.7); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-radius: 24px; padding: 28px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); margin-bottom: 24px; }
      .comp-label { font-size: 15px; fontWeight: 700; color: #0f172a; display: block; margin-bottom: 12px; }
      .comp-range-labels { display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; font-weight: 500; margin-top: 8px; }
      
      .custom-slider { -webkit-appearance: none; width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; outline: none; }
      .custom-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: var(--slider-color); cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: transform 0.2s; }
      .custom-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
      
      .filter-btn { padding: 10px 20px; border-radius: 100px; border: 1px solid rgba(0,0,0,0.06); font-size: 14px; font-weight: 600; background: #fff; color: #64748b; cursor: pointer; transition: all 0.3s ${EASE_FLUID}; }
      .filter-btn:hover { background: #f8fafc; transform: translateY(-1px); }
      .filter-btn.active { background: var(--active-bg); color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      
      .provider-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08); border-color: rgba(0,0,0,0.08) !important; }
      
      .btn-outline-premium { display: inline-block; font-size: 14px; font-weight: 700; color: var(--btn-color); padding: 10px 20px; border: 2px solid var(--btn-color); border-radius: 14px; text-decoration: none; transition: all 0.3s ${EASE_FLUID}; white-space: nowrap; }
      .btn-outline-premium:hover { background: var(--btn-color); color: #fff; transform: translateY(-2px); box-shadow: 0 8px 16px -4px var(--btn-color); }
      
      .btn-solid-premium { display: inline-block; text-align: center; font-size: 15px; font-weight: 700; color: #fff; background: var(--btn-bg); padding: 14px 24px; border-radius: 16px; text-decoration: none; transition: all 0.3s ${EASE_FLUID}; box-shadow: 0 8px 20px -6px var(--btn-bg); }
      .btn-solid-premium:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px var(--btn-bg); filter: brightness(1.05); }

      @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    `}} />
  );
}
