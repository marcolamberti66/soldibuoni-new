import React, { useState, useEffect, useMemo } from 'react';
import { CONTI_CORRENTI } from '../data.js';
import { ProviderRow, AffiliateRow } from './Comparators.jsx';

export function ContiComp({ color = '#10b981' }) {
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

  // Troviamo i dati aggiornati di BBVA dalla lista per usarli nel box in alto
  const bbvaData = useMemo(() => {
    return conti.find(c => c.id === 'bbva') || {
      link: "#",
      rendimento: "4%",
      note: "Canone zero per sempre, 4% di remunerazione sul saldo e cashback sugli acquisti."
    };
  }, [conti]);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      
      {/* 🏆 SCELTA TOP: BBVA (Link dinamico dal database) */}
      <AffiliateRow 
        title="Miglior Conto Online 2026"
        providerName="BBVA - Conto Online"
        description={bbvaData.note || "Il conto più remunerativo e flessibile del momento."}
        link={bbvaData.link}
        color={color}
        statsElement={
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Rendimento</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: color }}>{bbvaData.rendimento || '4% annuo'}</div>
          </div>
        }
      />

      {/* LISTA DINAMICA PULITA */}
      {conti.map((c, i) => (
        <ProviderRow key={c.id || i} p={c} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{c.name}</span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{c.note}</p>
          </div>
          
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {/* COLONNA: RENDIMENTO */}
            <div style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Rendimento</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{c.rendimento && c.rendimento !== '0%' ? c.rendimento : '-'}</div>
            </div>

            {/* COLONNA: VANTAGGIO */}
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 16, maxWidth: 160 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Vantaggio</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', lineHeight: 1.3 }}>{c.vantaggioPrincipale}</div>
            </div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}
