import React, { useState, useMemo } from 'react';
import { CONTI_CORRENTI } from '../data.js';
import { ProviderRow, AffiliateRow, Badge } from './Comparators.jsx';

export function ContiComp({ color = '#10b981' }) {
  const [filter, setFilter] = useState('all');

  const filteredConti = useMemo(() => {
    if (filter === 'all') return CONTI_CORRENTI;
    return CONTI_CORRENTI.filter(c => c.tags.includes(filter));
  }, [filter]);

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
        <ProviderRow key={c.id} p={c} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{c.name}</span>
              {c.canoneMensile === 0 && <Badge text="ZERO CANONE" color="#10b981" />}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{c.note}</p>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Bonus</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{c.vantaggioPrincipale}</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16, minWidth: 80 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Canone</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.canoneMensile === 0 ? '#10b981' : '#0f172a' }}>
                {c.canoneMensile === 0 ? 'GRATIS' : `€${c.canoneMensile}`}
              </div>
            </div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}
