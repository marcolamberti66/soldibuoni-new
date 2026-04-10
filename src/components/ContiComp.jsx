import React, { useState, useEffect, useMemo } from 'react';
import { CONTI_CORRENTI } from '../data.js';
import { ProviderRow, AffiliateRow } from './Comparators.jsx';

// Provider che appaiono nei box affiliati in cima — esclusi dalla lista sotto
const AFFILIATE_IDS = ['bbva', 'hype'];

export function ContiComp({ color = '#10b981' }) {
  const [conti, setConti] = useState(CONTI_CORRENTI);

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

  const bbvaData = useMemo(() => {
    return conti.find(c => c.id === 'bbva') || {
      link: "#", rendimento: "3% lordo", note: "Canone zero per sempre e cashback sugli acquisti."
    };
  }, [conti]);

  const hypeData = useMemo(() => {
    return conti.find(c => c.id === 'hype') || {
      link: "#", note: "Carta conto smart con gestione via app."
    };
  }, [conti]);

  // Escludi dalla lista sotto i provider che hanno il box affiliato in cima
  const filteredConti = useMemo(() => {
    return conti.filter(c => !AFFILIATE_IDS.includes(c.id));
  }, [conti]);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      
      {/* 🏆 BOX AFFILIATI IN PRIMO PIANO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>

        {/* BBVA */}
        <AffiliateRow 
          title="Miglior Conto per Rendimento"
          providerName="BBVA - Conto Online"
          description={bbvaData.note || "Il conto più remunerativo e flessibile del momento."}
          link={bbvaData.link}
          color="#004481"
          statsElement={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Rendimento</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#004481' }}>{bbvaData.rendimento || '3% annuo'}</div>
            </div>
          }
        />

        {/* HYPE */}
        <AffiliateRow 
          title="Miglior Conto Smart & Bonus"
          providerName="Hype - Carta Conto"
          description="Gestione via app, carta virtuale immediata e salvadanaio automatico. Bonus di benvenuto fino a 25€."
          link="https://www.financeads.net/tc.php?t=82784C257247700T"
          color="#00AEFF"
          statsElement={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Bonus Benvenuto</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#00AEFF' }}>Fino a 25€</div>
            </div>
          }
          priceElement={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Canone</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#00AEFF' }}>GRATIS</div>
            </div>
          }
        />

      </div>

      <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif", marginBottom: 20, textAlign: 'center' }}>Tutte le alternative di mercato</h3>

      {/* LISTA — senza i provider già nei box affiliati */}
      {filteredConti.map((c, i) => (
        <ProviderRow key={c.id || i} p={c} i={i} color={color}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{c.name}</span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{c.note}</p>
          </div>
          
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Rendimento</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{c.rendimento && c.rendimento !== '0%' ? c.rendimento : '-'}</div>
            </div>
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
