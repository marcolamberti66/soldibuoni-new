import React, { useState, useMemo, useEffect } from 'react';
import {
  INTERNET_PROVIDERS,
  INSURANCE_DATA,
  HEALTH_INSURANCE,
  UNI_FACOLTA,
  UNI_DATA,
} from '../data.js';

const EASE_FLUID = 'cubic-bezier(0.16, 1, 0.3, 1)';
const AFFILIATE_NAMES_INTERNET = ['WindTre Super Fibra', 'WindTre'];

function mergeWithLinks(blobData, fallbackData) {
  const linkMap = {};
  fallbackData.forEach(p => { if (p.link) linkMap[p.name] = p.link; });
  return blobData.map(p => ({ ...p, link: p.link || linkMap[p.name] || null }));
}

export function ProviderRow({ p, i, color, children }) {
  const finalLink = p.link || `https://www.google.com/search?q=${encodeURIComponent(p.name + " offerta sito ufficiale")}`;
  return (
    <div className="provider-card" style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', marginBottom: 16, border: '1px solid #e2e8f0', borderLeft: `5px solid ${color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, transition: `all 0.3s ${EASE_FLUID}`, animation: `fadeInUp 0.5s ${EASE_FLUID} ${i * 0.05}s both`, position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', flex: 1, alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, width: '100%', flexWrap: 'nowrap' }}>
        {children}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, width: '100%', marginTop: 8 }}>
        <a href={finalLink} target="_blank" rel="noopener noreferrer" className="btn-outline-premium" style={{ '--btn-color': color, width: '100%', textAlign: 'center' }}>Vedi l'offerta →</a>
      </div>
    </div>
  );
}

export function AffiliateRow({ title, providerName, description, link, priceElement, statsElement, color, ctaText = "Scopri l'Offerta in Evidenza →" }) {
  return (
    <div className="affiliate-card" style={{ background: `linear-gradient(145deg, #ffffff, rgba(255,255,255,0.9))`, borderRadius: 24, padding: '2px', marginBottom: 24, backgroundClip: 'padding-box', position: 'relative', animation: `fadeInUp 0.5s ${EASE_FLUID} both` }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 24, zIndex: 0, background: `linear-gradient(135deg, #FBBF24, ${color}, #FBBF24)`, opacity: 0.3 }}></div>
      <div style={{ background: '#fff', borderRadius: 22, padding: '24px 28px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1, boxShadow: `0 10px 30px -10px ${color}40` }}>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 6, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: 1 }}>🏆 {title}</span></div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{providerName}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{description}</div>
        </div>
        {statsElement && (
          <div className="comparator-stats" style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'space-between', width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 8 }}>
            {statsElement}
            {priceElement && (<div style={{ textAlign: 'right' }}>{priceElement}</div>)}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, width: '100%', marginTop: 10 }}><a href={link} target="_blank" rel="noopener noreferrer" className="btn-solid-premium" style={{ '--btn-bg': color, width: '100%' }}>{ctaText}</a></div>
      </div>
    </div>
  );
}

export function Badge({ text, color }) {
  if (!text) return null;
  return <span style={{ background: `${color}1A`, color: color, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>{text}</span>;
}

export function IstruzioneComp({ color = '#475569' }) {
  const [facolta, setFacolta] = useState('Economia');
  const [livello, setLivello] = useState('med');
  const [discOpen, setDiscOpen] = useState(false);
  
  const uniData = UNI_DATA || {}; 
  const data = Array.isArray(uniData[facolta]) ? uniData[facolta] : [];
  const sorted = useMemo(() => [...data].sort((a, b) => (Number(a[livello]) || 0) - (Number(b[livello]) || 0)), [data, livello]);
  const maxVal = Math.max(...sorted.map((s) => Number(s[livello]) || 0), 1);

  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Confronto Rette Universitarie</h2>
      <div className="glass-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}><label className="comp-label">Seleziona la Facoltà:</label><select className="custom-select" value={facolta} onChange={(e) => setFacolta(e.target.value)}>{UNI_FACOLTA.map((f) => (<option key={f} value={f}>{f}</option>))}</select></div>
          <div style={{ flex: '1 1 240px' }}><label className="comp-label">Fascia di reddito (ISEE-U):</label><select className="custom-select" value={livello} onChange={(e) => setLivello(e.target.value)}><option value="min">ISEE Basso — No Tax Area (fino a 22k€)</option><option value="med">ISEE Medio — zona agevolata (22k€ - 30k€)</option><option value="max">ISEE Alto — contributo pieno (+30k€)</option></select></div>
        </div>
        <div style={{ marginTop: 18, padding: '14px 16px', background: `${color}0F`, borderRadius: 12, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
          <div style={{ display: discOpen ? 'block' : '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            La stima è <strong>altamente precisa per le fasce ISEE bassa (No Tax Area) e alta (contributo massimo)</strong>. Per la fascia agevolata (media), le università applicano da 4 a 9 scaglioni reali, quindi l'importo è una media indicativa da verificare. Nelle pubbliche, la No Tax Area paga solo ~156€ totali.
          </div>
          <button onClick={() => setDiscOpen(!discOpen)} style={{ background: 'none', border: 'none', color: '#334155', fontWeight: 800, fontSize: 12, padding: 0, marginTop: 8, cursor: 'pointer', textDecoration: 'underline' }}>{discOpen ? 'Riduci ↑' : 'Leggi tutto ↓'}</button>
        </div>
      </div>
      {sorted.map((u, i) => {
        const valore = Number(u[livello]) || 0;
        return (
          <div key={u.uni + i} className="provider-card" style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', marginBottom: 16, border: '1px solid #e2e8f0', borderLeft: `5px solid ${color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', animation: `fadeInUp 0.5s ${EASE_FLUID} ${i * 0.05}s both`, transition: `all 0.3s ${EASE_FLUID}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}><span style={{ fontWeight: 800, color: '#0f172a', fontSize: 18 }}>{u.uni}</span>{i === 0 && <Badge text="PIÙ ECONOMICA" color={color} />}</div>
                <span style={{ fontSize: 13, color: '#64748b' }}>📍 {u.citta} • {u.tipo}</span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Retta annua stimata</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: color }}>€{valore.toLocaleString('it-IT')}</div>
              </div>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 8 }}><div style={{ height: '100%', borderRadius: 8, background: `linear-gradient(90deg, ${color}88, ${color})`, width: `${(valore / maxVal) * 100}%`, transition: 'width 0.5s ease' }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export function InternetComp({ color = '#8b5cf6' }) {
  const [providers, setProviders] = useState(INTERNET_PROVIDERS);
  const sorted = [...providers].sort((a, b) => a.prezzo - b.prezzo);
  return (
    <div className="comp-container">
      <StyleInjector />
      <h2 className="comp-title">Comparatore Internet & Fibra</h2>
      {sorted.map((p, i) => (
        <ProviderRow key={p.name} p={p} i={i} color={color}>
          <div style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{p.name}</span></div><span style={{ fontSize: 13, color: '#64748b' }}>{p.note}</span></div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: color }}>€{p.prezzo.toFixed(2)}<span style={{fontSize:13, color:'#94a3b8'}}>/mese</span></div>
            <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 800, marginTop: 6, background: '#f1f5f9', padding: '4px 8px', borderRadius: 8 }}>⚡ {p.velocita}</div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}

function StyleInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      .comp-container { max-width: 800px; margin: 0 auto; }
      .comp-title { font-family: 'Playfair Display',serif; font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 24px; text-align: center; }
      .glass-panel { background: rgba(255,255,255,0.7); backdrop-filter: blur(24px); border-radius: 24px; padding: 24px; border: 1px solid rgba(0,0,0,0.04); }
      .custom-select { width: 100%; padding: 14px 18px; border-radius: 14px; border: 1px solid rgba(0,0,0,0.08); font-size: 15px; font-weight: 600; color: #0f172a; background-color: #fff; appearance: none; }
      .btn-outline-premium { display: inline-block; font-size: 14px; font-weight: 700; color: var(--btn-color); padding: 12px 24px; border: 1.5px solid var(--btn-color); border-radius: 12px; text-decoration: none; }
      .btn-solid-premium { display: inline-block; text-align: center; font-size: 15px; font-weight: 700; color: #fff; background: var(--btn-bg); padding: 14px 24px; border-radius: 16px; text-decoration: none; }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    `}} />
  );
}