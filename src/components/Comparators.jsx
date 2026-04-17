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

// Nomi dei provider affiliati per categoria — esclusi dalla lista sotto il box
const AFFILIATE_NAMES_INTERNET = ['WindTre Super Fibra', 'WindTre'];
const AFFILIATE_NAMES_RC = ['Prima Assicurazioni'];

// Merge: prende i prezzi dal blob ma preserva i link dal fallback (data.js)
function mergeWithLinks(blobData, fallbackData) {
  const linkMap = {};
  fallbackData.forEach(p => { if (p.link) linkMap[p.name] = p.link; });
  return blobData.map(p => ({ ...p, link: p.link || linkMap[p.name] || null }));
}

// ── COMPONENTE RIGA NORMALE (PREMIUM LAYOUT) ──
export function ProviderRow({ p, i, color, children }) {
  const finalLink = p.link || `https://www.google.com/search?q=${encodeURIComponent(p.name + " offerta sito ufficiale")}`;

  return (
    <div
      className="provider-card"
      style={{
        background: '#fff',
        borderRadius: 20, 
        padding: '22px 28px',
        marginBottom: 16,
        border: '1px solid #e2e8f0', 
        borderLeft: `5px solid ${color}`, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)', 
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        transition: `all 0.3s ${EASE_FLUID}`,
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
export function AffiliateRow({ title, providerName, description, link, priceElement, statsElement, color, ctaText = "Scopri l'Offerta in Evidenza →" }) {
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
            {priceElement && (
              <div style={{ textAlign: 'center', minWidth: 80, borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16 }}>
                {priceElement}
              </div>
            )}
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
            {ctaText}
          </a>
        </div>
      </div>
    </div>
  );
}

export function Badge({ text, color }) {
  return (
    <span style={{ background: `${color}1A`, color: color, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {text}
    </span>
  );
}

// ── COMPONENTE UNIVERSITÀ (AGGIORNATO CON MENU A TENDINA) ──
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
        if (payload?.data?.universita && Object.keys(payload.data.universita).length > 0) { setUniData(payload.data.universita); setIsLive(true); }
      } catch (err) {}
    }
    fetchPrices();
  }, []);

  const data = Array.isArray(uniData[facolta]) ? uniData[facolta] : [];
  const sorted = useMemo(() => [...data].sort((a, b) => (Number(a[livello]) || 0) - (Number(b[livello]) || 0)), [data, livello]);
  const maxVal = Math.max(...sorted.map((s) => Number(s[livello]) || 0), 1);

  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Confronto Rette Universitarie {isLive && <span style={{fontSize: 14, color: '#10b981'}}>● Live</span>}</h2>
      
      <div className="glass-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          
          {/* Menu Tendina Facoltà */}
          <div style={{ flex: '1 1 240px' }}>
            <label className="comp-label">Seleziona la Facoltà:</label>
            <select 
              className="custom-select" 
              value={facolta} 
              onChange={(e) => setFacolta(e.target.value)}
              style={{ '--focus-color': color }}
            >
              {UNI_FACOLTA.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Menu Tendina ISEE */}
          <div style={{ flex: '1 1 240px' }}>
            <label className="comp-label">Fascia di reddito (ISEE):</label>
            <select 
              className="custom-select" 
              value={livello} 
              onChange={(e) => setLivello(e.target.value)}
              style={{ '--focus-color': color }}
            >
              <option value="min">ISEE Basso (sotto i 15.000€)</option>
              <option value="med">ISEE Medio (tra 15.000€ e 30.000€)</option>
              <option value="max">ISEE Alto (sopra i 30.000€)</option>
            </select>
          </div>

        </div>
      </div>

      {sorted.map((u, i) => (
        <div key={u.uni + i} className="provider-card" style={{ background: '#fff', borderRadius: 20, padding: '22px 28px', marginBottom: 16, border: '1px solid #e2e8f0', borderLeft: `5px solid ${color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', animation: `fadeInUp 0.5s ${EASE_FLUID} ${i * 0.05}s both`, transition: `all 0.3s ${EASE_FLUID}` }}>
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
        if (valid.length >= 3) { setFunds(mergeWithLinks(valid, PENSION_FUNDS)); setIsLive(true); }
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
        if (Array.isArray(payload?.data?.salute)) { setHealthData(mergeWithLinks(payload.data.salute, HEALTH_INSURANCE)); setIsLive(true); }
      } catch (err) {}
    }
    fetchPrices();
  }, []);
  const sorted = useMemo(() => [...healthData].sort((a, b) => (Number(a[piano]) || 0) - (Number(b[piano]) || 0)), [piano, healthData]);
  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Comparatore Assicurazioni Sanitarie {isLive && <span style={{fontSize: 14, color: '#10b981'}}>● Live</span>}</h2>
      <div className="glass-panel" style={{ marginBottom: 24 }}>
        <label className="comp-label">Livello di copertura desiderato:</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['base', 'Base'], ['standard', 'Standard'], ['premium', 'Premium']].map(([v, l]) => (<button key={v} onClick={() => setPiano(v)} className={`filter-btn ${piano === v ? 'active' : ''}`} style={{'--active-bg': color, flex: 1}}>{l}</button>))}
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
    const s = []; const now = new Date();
    if (form.immatricolazione) {
      const imm = new Date(form.immatricolazione);
      let nb = new Date(now.getFullYear(), imm.getMonth(), 1);
      if (nb < now) nb.setFullYear(nb.getFullYear() + 1);
      s.push({ tipo: 'Bollo Auto', data: nb, icon: '💳', desc: 'Pagamento annuale tassa di possesso' });
      let revDate = new Date(imm); revDate.setFullYear(revDate.getFullYear() + 4);
      if (revDate < now) { revDate = new Date(now.getFullYear(), imm.getMonth(), imm.getDate()); if (revDate < now) revDate.setFullYear(revDate.getFullYear() + 2); }
      s.push({ tipo: 'Revisione', data: revDate, icon: '🔍', desc: 'Controllo obbligatorio sicurezza e emissioni' });
    }
    let gi = new Date(now.getFullYear(), 10, 15); if (gi < now) gi.setFullYear(gi.getFullYear() + 1);
    s.push({ tipo: 'Gomme Invernali', data: gi, icon: '🛞', desc: 'Obbligo catene o pneumatici invernali' });
    s.sort((a, b) => a.data - b.data); setScadenze(s); setApiStatus('success');
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
            const days = Math.ceil((s.data - new Date()) / 86400000); const urgent = days < 30;
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 12, border: `1px solid ${urgent ? '#fecaca' : 'rgba(0,0,0,0.04)'}`, borderLeft: `6px solid ${urgent ? '#ef4444' : color}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: 32 }}>{s.icon}</span>
                <div style={{ flex: 1 }}><h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{s.tipo}</h4><p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{s.desc}</p></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 16, fontWeight: 800, color: urgent ? '#ef4444' : '#0f172a' }}>{s.data.toLocaleDateString('it-IT')}</div><div style={{ fontSize: 12, fontWeight: 600, color: urgent ? '#ef4444' : '#94a3b8' }}>{days > 0 ? `Tra ${days} giorni` : 'SCADUTA'}</div></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── INTERNET E ALTRI COMPONENTI OMITTED PER BREVITÀ ──
export function InternetComp({ color = '#8b5cf6' }) { return <div className="comp-container">Vedi file originale</div>; }
export function RCAutoComp({ color = '#ec4899' }) { return <div className="comp-container">Vedi file originale</div>; }
export function EnergiaComp({ color }) { return <div className="comp-container"><h2 className="comp-title">Vai su "Luce & Gas" dalla Homepage</h2></div>; }
export function GasComp({ color }) { return <div className="comp-container"><h2 className="comp-title">Vai su "Luce & Gas" dalla Homepage</h2></div>; }
export function GenericComp({ color }) { return <div className="glass-panel" style={{ textAlign: 'center', padding: 60 }}><div style={{ fontSize: 44, marginBottom: 14 }}>🚀</div><h3 style={{ color: '#0f172a', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>In Arrivo</h3><p style={{ color: '#64748b', fontSize: 15 }}>Stiamo applicando il nuovo design premium a questa sezione.</p></div>; }

// ── STILI GLOBALI (AGGIORNATI) ──
function StyleInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      .comp-container { max-width: 800px; margin: 0 auto; }
      .comp-title { font-family: 'Playfair Display',serif; font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.5px; }
      .glass-panel { background: rgba(255,255,255,0.7); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-radius: 24px; padding: 28px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); margin-bottom: 24px; }
      .comp-label { font-size: 15px; fontWeight: 700; color: #0f172a; display: block; margin-bottom: 12px; }
      
      /* Hover avanzato per le ProviderCard */
      .provider-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px -8px rgba(0,0,0,0.1) !important; border-color: #cbd5e1 !important; }
      
      /* Nuovo stile per i menu a tendina (select) */
      .custom-select {
        width: 100%;
        padding: 14px 18px;
        border-radius: 14px;
        border: 1px solid rgba(0,0,0,0.08);
        font-size: 15px;
        font-weight: 600;
        color: #0f172a;
        background-color: #fff;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 16px center;
        background-size: 18px;
        appearance: none;
        outline: none;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 2px 8px rgba(0,0,0,0.02);
      }
      .custom-select:hover {
        border-color: #cbd5e1;
      }
      .custom-select:focus {
        border-color: var(--focus-color, #475569);
        box-shadow: 0 0 0 3px rgba(71, 85, 105, 0.1);
      }

      /* Nuovo stile per il bottone secondario */
      .btn-outline-premium { display: inline-block; font-size: 14px; font-weight: 700; color: var(--btn-color); padding: 10px 24px; border: 1.5px solid var(--btn-color); border-radius: 12px; text-decoration: none; transition: all 0.3s ${EASE_FLUID}; white-space: nowrap; background: transparent; }
      .btn-outline-premium:hover { background: var(--btn-color); color: #fff; transform: translateY(-2px); box-shadow: 0 6px 16px -4px var(--btn-color); }
      
      .btn-solid-premium { display: inline-block; text-align: center; font-size: 15px; font-weight: 700; color: #fff; background: var(--btn-bg); padding: 14px 24px; border-radius: 16px; text-decoration: none; transition: all 0.3s ${EASE_FLUID}; box-shadow: 0 8px 20px -6px var(--btn-bg); }
      .btn-solid-premium:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px var(--btn-bg); filter: brightness(1.05); }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    `}} />
  );
}