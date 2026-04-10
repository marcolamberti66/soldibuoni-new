import React, { useState, useEffect, useMemo } from 'react';
import { CONTI_CORRENTI } from '../data.js';
import { ProviderRow, AffiliateRow, Badge } from './Comparators.jsx';

export function ContiComp({ color = '#10b981' }) {
  const [filter, setFilter] = useState('all');
  const [conti, setConti] = useState(CONTI_CORRENTI);

  // FETCH DAI DATI GOOGLE SHEETS TRAMITE NETLIFY BLOB
  useEffect(() => {
    async function fetchConti() {
      try {
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices");
        if (!res.ok) return;
        const payload = await res.json();
        
        if (Array.isArray(payload?.data?.conti_correnti)) {
          setConti(payload.data.conti_correnti);
        }
      } catch (err) {
        console.warn("Uso fallback hardcoded per i conti correnti.");
      }
    }
    fetchConti();
  }, []);

  // LOGICA FILTRI SMART
  const filteredConti = useMemo(() => {
    if (filter === 'all') return conti;
    
    return conti.filter(c => {
      // Normalizziamo i tag in una singola stringa minuscola per facilitare la ricerca
      const tagStr = (Array.isArray(c.tags) ? c.tags.join(' ') : (c.tags || '')).toLowerCase();
      const rendimento = (c.rendimento || '').toString();

      if (filter === 'zero_spese') return tagStr.includes('zero spese') || c.canoneMensile === 0;
      if (filter === 'remunerato_cashback') return tagStr.includes('cashback') || tagStr.includes('remuner') || rendimento !== '0%';
      if (filter === 'giovani') return tagStr.includes('under 30') || tagStr.includes('under 35') || tagStr.includes('giovani');
      if (filter === 'business') return tagStr.includes('business') || tagStr.includes('p.iva');
      
      return true;
    });
  }, [filter, conti]);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      
      {/* FILTRI SMART */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { id: 'all', l: 'Tutti i Conti' },
          { id: 'zero_spese', l: 'Zero Spese' },
          { id: 'remunerato_cashback', l: 'Remunerati / Cashback' },
          { id: 'giovani', l: 'Per Giovani' },
          { id: 'business', l: 'Business & P.IVA' }
        ].map(f => (
          <button 
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{ 
              padding: '10px 20px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.06)', 
              fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              background: filter === f.id ? color : '#fff',
              color: filter === f.id ? '#fff' : '#64748b',
              boxShadow: filter === f.id ? `0 4px 12px ${color}40` : 'none'
            }}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* 🏆 SCELTA TOP: BBVA (Solo se non filtrato per Business) */}
      {filter !== 'business' && (
        <AffiliateRow 
          title="Miglior Conto Online 2026"
          providerName="BBVA - Conto Online"
          description="Canone zero per sempre, 4% di remunerazione sul saldo e cashback sugli acquisti. La scelta più intelligente oggi."
          link="[INSERISCI_LINK_BBVA]"
          color={color}
          statsElement={<div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#94a3b8' }}>Rendimento</div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>4% annuo</div></div>}
          priceElement={<><div style={{ fontSize: 11, color: '#94a3b8' }}>Canone</div><div style={{ fontSize: 18, fontWeight: 800, color: color }}>GRATIS</div></>}
        />
      )}

      {/* LISTA DINAMICA */}
      {filteredConti.map((c, i) => (
        <ProviderRow key={c.id || i} p={c} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{c.name}</span>
              {c.canoneMensile === 0 && <Badge text="ZERO CANONE" color="#10b981" />}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{c.note}</p>
          </div>
          
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {/* NUOVA COLONNA: RENDIMENTO */}
            <div style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Rendimento</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{c.rendimento && c.rendimento !== '0%' ? c.rendimento : '-'}</div>
            </div>

            {/* VANTAGGIO */}
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16, maxWidth: 120 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Vantaggio</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', lineHeight: 1.2 }}>{c.vantaggioPrincipale}</div>
            </div>
            
            {/* CANONE MENSILE */}
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16, minWidth: 80 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Canone</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.canoneMensile === 0 ? '#10b981' : '#0f172a' }}>
                {c.canoneMensile === 0 ? 'GRATIS' : `€${c.canoneMensile.toLocaleString('it-IT')}`}
              </div>
            </div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}
