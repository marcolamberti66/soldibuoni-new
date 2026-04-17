import React, { useState, useEffect, useMemo } from 'react';
import { CONTI_CORRENTI } from '../data.js';
import { ProviderRow, AffiliateRow } from './Comparators.jsx';

// Provider che appaiono nei box affiliati in cima — esclusi dalla lista sotto
const AFFILIATE_IDS = ['bbva', 'hype'];

// FIX: Injector sincronizzato con il nuovo layout premium (ombre dinamiche e bottoni outline)
function StyleInjector() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      /* Hover avanzato per le ProviderCard */
      .provider-card { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
      .provider-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px -8px rgba(0,0,0,0.1) !important; border-color: #cbd5e1 !important; }
      
      /* Nuovo stile per il bottone secondario delle alternative */
      .btn-outline-premium { display: inline-block; font-size: 14px; font-weight: 700; color: var(--btn-color); padding: 10px 24px; border: 1.5px solid var(--btn-color); border-radius: 12px; text-decoration: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap; background: transparent; }
      .btn-outline-premium:hover { background: var(--btn-color); color: #fff; transform: translateY(-2px); box-shadow: 0 6px 16px -4px var(--btn-color); }

      /* Stile per i bottoni primari nei box affiliati */
      .btn-solid-premium { display: inline-block; text-align: center; font-size: 15px; font-weight: 700; color: #fff; background: var(--btn-bg); padding: 14px 24px; border-radius: 16px; text-decoration: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 8px 20px -6px var(--btn-bg); white-space: nowrap; }
      .btn-solid-premium:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -6px var(--btn-bg); filter: brightness(1.05); }
    `}} />
  );
}

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
    return conti.find(c => c.id === 'bbva') || { rendimento: "3% annuo" };
  }, [conti]);

  const hypeData = useMemo(() => {
    return conti.find(c => c.id === 'hype') || {};
  }, [conti]);

  // Escludi dalla lista sotto i provider che hanno il box affiliato in cima
  const filteredConti = useMemo(() => {
    return conti.filter(c => !AFFILIATE_IDS.includes(c.id));
  }, [conti]);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <StyleInjector />
      
      {/* 🏆 BOX AFFILIATI IN PRIMO PIANO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>

        {/* BBVA */}
        <AffiliateRow 
          title="MIGLIOR CONTO ONLINE 2026"
          providerName="BBVA - Conto Online"
          description={
            <span>
              Canone zero per sempre, remunerazione sul saldo senza vincoli e cashback sugli acquisti. La scelta più intelligente oggi.
              <br/><br/>
              <a href="/recensione-bbva" style={{ color: '#004481', fontWeight: 700, textDecoration: 'underline' }}>
                Leggi la nostra analisi completa →
              </a>
            </span>
          }
          link="https://www.financeads.net/tc.php?t=82784C5581131019T"
          color="#004481"
          statsElement={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Rendimento</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#004481' }}>{bbvaData.rendimento || '3% annuo'}</div>
            </div>
          }
          priceElement={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Canone</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>GRATIS</div>
            </div>
          }
        />

        {/* HYPE */}
        <AffiliateRow 
          title="LA CARTA CONTO PIÙ SCARICATA"
          providerName="Hype - Tutte le versioni"
          description="Hype offre 3 piani distinti: dal conto Base gratuito alle versioni Next e Premium. Scopri quale versione si adatta meglio alle tue esigenze, i bonus di benvenuto attivi e i vantaggi esclusivi per chi viaggia o vuole azzerare le commissioni."
          link="/recensione-hype"
          color="#00AEFF"
          ctaText="Confronta i 3 piani Hype →"
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
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', width: 100, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Rendimento</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{c.rendimento && c.rendimento !== '0%' ? c.rendimento : '-'}</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.06)', width: 130, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Vantaggio</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', lineHeight: 1.3 }}>{c.vantaggioPrincipale}</div>
            </div>
          </div>
        </ProviderRow>
      ))}
    </div>
  );
}