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
        padding: '2px', 
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

// ── COMPONENTE UNIVERSITÀ ──
export function IstruzioneComp({ color = '#475569' }) {
  const [facolta, setFacolta] = useState('Economia');
  const [livello, setLivello] = useState('med');
  
  const [uniData, setUniData] = useState(UNI_DATA);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices");
        if (!res.ok) return;
        const payload = await res.json();
        if (payload?.data?.universita && Object.keys(payload.data.universita).length > 0) {
          setUniData(payload.data.universita);
          setIsLive(true);
        }
      } catch (err) {}
    }
    fetchPrices();
  }, []);

  const data = Array.isArray(uniData[facolta]) ? uniData[facolta] : [];
  const sorted = useMemo(() => {
     return [...data].sort((a, b) => (Number(a[livello]) || 0) - (Number(b[livello]) || 0));
  }, [data, livello]);
  
  const maxVal = Math.max(...sorted.map((s) => Number(s[livello]) || 0), 1);

  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Confronto Rette Universitarie {isLive && <span style={{fontSize: 14, color: '#10b981'}}>● Live</span>}</h2>
      
      <div className="glass-panel" style={{ marginBottom: 24 }}>
        <label className="comp-label">Facoltà:</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {UNI_FACOLTA.map((f) => (
            <button key={f} onClick={() => setFacolta(f)} className={`filter-btn ${facolta === f ? 'active' : ''}`} style={{'--active-bg': color}}>{f}</button>
          ))}
        </div>

        <label className="comp-label">Fascia di reddito (ISEE):</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['min', 'ISEE Basso'], ['med', 'ISEE Medio'], ['max', 'ISEE Alto']].map(([v, l]) => (
            <button key={v} onClick={() => setLivello(v)} className={`filter-btn ${livello === v ? 'active' : ''}`} style={{'--active-bg': color, flex: 1}}>{l}</button>
          ))}
        </div>
      </div>

      {sorted.map((u, i) => (
        <div key={u.uni + i} className="provider-card" style={{ background: '#fff', borderRadius: 24, padding: '24px 28px', marginBottom: 16, border: '1px solid rgba(0,0,0,0.04)', animation: `fadeInUp 0.5s ${EASE_FLUID} ${i * 0.05}s both` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 18 }}>{u.uni}</span>
                {i === 0 && <Badge text="PIÙ ECONOMICA" color={color} />}
              </div>
              <span style={{ fontSize: 13, color: '#64748b' }}>📍 {u.citta} • {u.tipo}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Retta annua stima</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: color }}>€{(Number(u[livello]) || 0).toLocaleString('it-IT')}</div>
            </div>
          </div>
          
          <div style={{ background: '#f1f5f9', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', borderRadius: 8, background: `linear-gradient(90deg, ${color}88, ${color})`, width: `${((Number(u[livello]) || 0) / maxVal) * 100}%`, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
            <span>Min: €{(Number(u.min) || 0).toLocaleString('it-IT')}</span>
            <span>Max: €{(Number(u.max) || 0).toLocaleString('it-IT')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── COMPONENTE FONDI PENSIONE ──
export function PensioneComp({ color = '#0284c7' }) {
  const [funds, setFunds] = useState(PENSION_FUNDS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices");
        if (!res.ok) return;
        const payload = await res.json();
        const valid = Array.isArray(payload?.data?.pensione) ? payload.data.pensione.filter(p => p.costo !== undefined) : [];
        if (valid.length >= 3) { setFunds(valid); setIsLive(true); }
      } catch (err) {}
    }
    fetchPrices();
  }, []);

  const sorted = useMemo(() => [...funds].sort((a, b) => (Number(a.costo) || 0) - (Number(b.costo) || 0)), [funds]);

  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Comparatore Fondi Pensione {isLive && <span style={{fontSize: 14, color: '#10b981'}}>● Live</span>}</h2>
      
      {sorted.map((p, i) => (
        <ProviderRow key={p.name} p={p} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{p.name}</span>
              {i === 0 && <Badge text="MIGLIOR ISC" color={color} />}
            </div>
            <span style={{ fontSize: 13, color: '#64748b' }}>{p.tipo} • {p.note}</span>
          </div>
          <div className="comparator-stats" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#94a3b8' }}>ISC (10 anni)</div><div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{p.costo}%</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#94a3b8' }}>Rend. 10a</div><div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>+{p.rendimento10y}%</div></div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}

// ── COMPONENTE ASSICURAZIONE SANITARIA ──
export function SaluteComp({ color = '#ea580c' }) {
  const [piano, setPiano] = useState('standard');
  const [healthData, setHealthData] = useState(HEALTH_INSURANCE);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices");
        if (!res.ok) return;
        const payload = await res.json();
        if (Array.isArray(payload?.data?.salute)) {
           setHealthData(payload.data.salute);
           setIsLive(true);
        }
      } catch (err) {}
    }
    fetchPrices();
  }, []);

  const sorted = useMemo(() => {
      return [...healthData].sort((a, b) => (Number(a[piano]) || 0) - (Number(b[piano]) || 0));
  }, [piano, healthData]);
  
  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Comparatore Assicurazioni Sanitarie {isLive && <span style={{fontSize: 14, color: '#10b981'}}>● Live</span>}</h2>
      <div className="glass-panel" style={{ marginBottom: 24 }}>
        <label className="comp-label">Livello di copertura desiderato:</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['base', 'Base'], ['standard', 'Standard'], ['premium', 'Premium']].map(([v, l]) => (
            <button key={v} onClick={() => setPiano(v)} className={`filter-btn ${piano === v ? 'active' : ''}`} style={{'--active-bg': color, flex: 1}}>{l}</button>
          ))}
        </div>
      </div>
      {sorted.map((p, i) => (
        <ProviderRow key={p.name} p={p} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{p.name}</span>
              {i === 0 && <Badge text="MIGLIORE" color={color} />}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {p.dentale && <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: 8, fontWeight: 700 }}>🦷 Dentale</span>}
              {p.oculistica && <span style={{ fontSize: 10, background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: 8, fontWeight: 700 }}>👁️ Oculistica</span>}
              {p.ricovero && <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: 8, fontWeight: 700 }}>🏥 Ricovero</span>}
            </div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16, minWidth: 80 }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>€/mese</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: color }}>€{Number(p[piano]) || 0}</div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}

// ── COMPONENTE SCADENZARIO AUTO ──
export function CalendarioAuto({ color = '#f43f5e' }) {
  const [form, setForm] = useState({ targa: '', immatricolazione: '', ultimoTagliando: '', email: '', nome: '' });
  const [scadenze, setScadenze] = useState(null);
  const [apiStatus, setApiStatus] = useState('idle');

  const calcola = async () => {
    if (!form.email || !form.email.includes('@')) { alert('Inserisci un indirizzo email valido'); return; }
    if (!form.immatricolazione) { alert('Inserisci la data di immatricolazione'); return; }

    const s = [];
    const now = new Date();
    
    if (form.immatricolazione) {
      const imm = new Date(form.immatricolazione);
      let nb = new Date(now.getFullYear(), imm.getMonth(), 1);
      if (nb < now) nb.setFullYear(nb.getFullYear() + 1);
      s.push({ tipo: 'Bollo Auto', data: nb, icon: '💳', desc: 'Pagamento annuale tassa di possesso' });

      let revDate = new Date(imm);
      revDate.setFullYear(revDate.getFullYear() + 4);
      if (revDate < now) {
         revDate = new Date(now.getFullYear(), imm.getMonth(), imm.getDate());
         if (revDate < now) revDate.setFullYear(revDate.getFullYear() + 2);
      }
      s.push({ tipo: 'Revisione', data: revDate, icon: '🔍', desc: 'Controllo obbligatorio sicurezza e emissioni' });
    }
    
    let gi = new Date(now.getFullYear(), 10, 15);
    if (gi < now) gi.setFullYear(gi.getFullYear() + 1);
    s.push({ tipo: 'Gomme Invernali', data: gi, icon: '🛞', desc: 'Obbligo catene o pneumatici invernali' });

    s.sort((a, b) => a.data - b.data);
    setScadenze(s);
    setApiStatus('success'); 
  };

  const inputStyle = { padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', background: '#f8fafc', fontSize: '15px', fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'all 0.3s' };

  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Memo Scadenze Auto</h2>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 15 }}>Inserisci i dati del veicolo per generare il tuo scadenzario personalizzato.</p>
      
      <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}><label className="comp-label">Nome e Cognome *</label><input style={inputStyle} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Mario Rossi" /></div>
        <div style={{ gridColumn: '1 / -1' }}><label className="comp-label">Email per i promemoria *</label><input type="email" style={inputStyle} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="mario@email.it" /></div>
        <div><label className="comp-label">Targa</label><input style={inputStyle} value={form.targa} onChange={e => setForm({...form, targa: e.target.value.toUpperCase()})} placeholder="AB123CD" /></div>
        <div><label className="comp-label">Immatricolazione *</label><input type="date" style={inputStyle} value={form.immatricolazione} onChange={e => setForm({...form, immatricolazione: e.target.value})} /></div>
        
        <button onClick={calcola} className="btn-solid-premium" style={{ '--btn-bg': color, gridColumn: '1 / -1', marginTop: 16 }}>Genera Scadenzario →</button>
      </div>

      {scadenze && (
        <div style={{ marginTop: 32, animation: 'fadeInUp 0.5s ease-out' }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Le tue prossime scadenze</h3>
          {scadenze.map((s, i) => {
            const days = Math.ceil((s.data - new Date()) / 86400000);
            const urgent = days < 30;
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 12, border: `1px solid ${urgent ? '#fecaca' : 'rgba(0,0,0,0.04)'}`, borderLeft: `6px solid ${urgent ? '#ef4444' : color}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: 32 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{s.tipo}</h4>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{s.desc}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: urgent ? '#ef4444' : '#0f172a' }}>{s.data.toLocaleDateString('it-IT')}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: urgent ? '#ef4444' : '#94a3b8' }}>{days > 0 ? `Tra ${days} giorni` : 'SCADUTA'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── COMPONENTI INTERNET E RC AUTO ──
export function InternetComp({ color = '#8b5cf6' }) {
  const [filtroTipo, setFiltroTipo] = useState('tutti');
  const [providers, setProviders] = useState(INTERNET_PROVIDERS);
  
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices");
        if (!res.ok) return;
        const payload = await res.json();
        if (payload?.data?.internet) setProviders(payload.data.internet);
      } catch (err) {}
    }
    fetchPrices();
  }, []);

  const sorted = [...providers].sort((a, b) => a.prezzo - b.prezzo);

  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Comparatore Internet & Fibra</h2>

      <AffiliateRow 
        title="Offerta in Evidenza" providerName="Wind Tre" description="Super Fibra FTTH alla massima velocità. Modem incluso e zero vincoli nascosti per la tua casa." link="https://www.awin1.com/cread.php?awinmid=27760&awinaffid=2811530" color={color}
        statsElement={<div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#94a3b8' }}>Velocità Fino a</div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>2.5 Gbps</div></div>}
        priceElement={<><div style={{ fontSize: 11, color: '#94a3b8' }}>Prezzo Speciale</div><div style={{ fontSize: 18, fontWeight: 800, color: color }}>Vedi Sito</div></>}
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
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#94a3b8' }}>Velocità</div><div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{p.velocita}</div></div>
            <div style={{ textAlign: 'center', minWidth: 80, borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16 }}><div style={{ fontSize: 11, color: '#94a3b8' }}>€/mese</div><div style={{ fontSize: 22, fontWeight: 800, color: color }}>€{p.prezzo.toFixed(2)}</div></div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}

export function RCAutoComp({ color = '#ec4899' }) {
  const [garanzie, setGaranzie] = useState([]); 
  const toggle = (g) => setGaranzie((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const [insuranceData, setInsuranceData] = useState(INSURANCE_DATA);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices");
        if (!res.ok) return;
        const payload = await res.json();
        if (Array.isArray(payload?.data?.rc_auto)) {
          setInsuranceData(payload.data.rc_auto);
          setIsLive(true);
        }
      } catch (err) {}
    }
    fetchPrices();
  }, []);

  // Estrattore di sicurezza: se incontra roba tipo "450-650", estrae solo il 450
  const extractNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const match = String(val).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const sorted = useMemo(() => {
    return insuranceData.map((p) => {
      let baseRc = extractNumber(p.rc);
      let costFurto = extractNumber(p.furto);
      let costKasko = extractNumber(p.kasko);
      let costCristalli = extractNumber(p.cristalli);
      let costAssistenza = extractNumber(p.assistenza);

      let tot = baseRc;
      if (garanzie.includes('furto')) tot += costFurto;
      if (garanzie.includes('kasko')) tot += costKasko;
      if (garanzie.includes('cristalli')) tot += costCristalli;
      if (garanzie.includes('assistenza')) tot += costAssistenza;
      
      return { ...p, tot };
    }).sort((a, b) => a.tot - b.tot);
  }, [garanzie, insuranceData]);

  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Comparatore RC Auto {isLive && <span style={{fontSize: 14, color: '#10b981'}}>● Live</span>}</h2>
      
      <div className="comp-controls glass-panel" style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Aggiungi garanzie accessorie (Stima):</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ id: 'furto', l: 'Furto/Incendio' }, { id: 'kasko', l: 'Kasko' }, { id: 'cristalli', l: 'Cristalli' }, { id: 'assistenza', l: 'Assistenza' }].map(g => (
            <button key={g.id} onClick={() => toggle(g.id)} className={`filter-btn ${garanzie.includes(g.id) ? 'active' : ''}`} style={{'--active-bg': color}}>
              {garanzie.includes(g.id) && '✓ '} {g.l}
            </button>
          ))}
        </div>
      </div>

      <AffiliateRow 
        title="Scelta di SoldiBuoni" providerName="Prima Assicurazioni" description="L'assicurazione online più scelta in Italia. Gestione sinistri rapida 100% via app e prezzi imbattibili." link="[INSERISCI_LINK_PRIMA_ASSICURAZIONI]" color={color}
        statsElement={<div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#94a3b8' }}>Preventivo in</div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>1 Minuto</div></div>}
        priceElement={<><div style={{ fontSize: 11, color: '#94a3b8' }}>Calcolo online</div><div style={{ fontSize: 18, fontWeight: 800, color: color }}>Gratuito</div></>}
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
              <div style={{ fontSize: 22, fontWeight: 800, color: color }}>€{p.tot.toLocaleString('it-IT')}</div>
            </div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}

// ── VECCHI COMPONENTI (FALLBACK - PER NON ROMPERE VECCHIE PAGINE SE ESISTONO) ──
export function EnergiaComp({ color }) { return <div className="comp-container"><h2 className="comp-title">Vai su "Luce & Gas" dalla Homepage</h2></div>; }
export function GasComp({ color }) { return <div className="comp-container"><h2 className="comp-title">Vai su "Luce & Gas" dalla Homepage</h2></div>; }
export function GenericComp({ color }) { return <div className="glass-panel" style={{ textAlign: 'center', padding: 60 }}><div style={{ fontSize: 44, marginBottom: 14 }}>🚀</div><h3 style={{ color: '#0f172a', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>In Arrivo</h3><p style={{ color: '#64748b', fontSize: 15 }}>Stiamo applicando il nuovo design premium a questa sezione.</p></div>; }

// ── INJECTION STILI GLOBALI COMPONENTI ──
function StyleInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      .comp-container { max-width: 800px; margin: 0 auto; }
      .comp-title { font-family: 'Playfair Display',serif; font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.5px; }
      .glass-panel { background: rgba(255,255,255,0.7); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-radius: 24px; padding: 28px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); margin-bottom: 24px; }
      .comp-label { font-size: 15px; fontWeight: 700; color: #0f172a; display: block; margin-bottom: 12px; }
      
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
