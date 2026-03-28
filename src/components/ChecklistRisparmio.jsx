import React, { useState } from 'react';

const CHECKLIST_ITEMS = [
  {
    id: 'isee',
    category: 'Documenti',
    icon: '📋',
    title: 'Calcola il tuo ISEE',
    desc: 'Il CAF lo fa gratis. Senza ISEE paghi il massimo su tutto: università, bonus, agevolazioni.',
    savings: 'Fino a €2.000/anno',
    savingsNum: 800,
    link: null,
    difficulty: 'facile',
    time: '30 min al CAF',
  },
  {
    id: 'bolletta_luce',
    category: 'Bollette',
    icon: '⚡',
    title: 'Confronta la tariffa luce',
    desc: 'Controlla il prezzo €/kWh sulla bolletta e confrontalo con le migliori offerte di oggi.',
    savings: '€100-300/anno',
    savingsNum: 200,
    link: '/energia',
    difficulty: 'facile',
    time: '10 minuti',
  },
  {
    id: 'bolletta_gas',
    category: 'Bollette',
    icon: '🔥',
    title: 'Confronta la tariffa gas',
    desc: 'Controlla il prezzo €/Smc e il costo fisso mensile. Cambiare fornitore è gratuito.',
    savings: '€80-250/anno',
    savingsNum: 150,
    link: '/gas',
    difficulty: 'facile',
    time: '10 minuti',
  },
  {
    id: 'internet',
    category: 'Bollette',
    icon: '📡',
    title: 'Verifica offerta internet',
    desc: 'Se paghi più di €25/mese per FTTH, stai pagando troppo. Iliad è a €19.99 senza vincoli.',
    savings: '€60-150/anno',
    savingsNum: 80,
    link: '/internet',
    difficulty: 'facile',
    time: '5 minuti',
  },
  {
    id: 'rc_auto',
    category: 'Auto',
    icon: '🚗',
    title: 'Confronta la RC Auto',
    desc: 'Cerca preventivi 3-4 settimane prima della scadenza. Puoi disdire fino al giorno prima via PEC.',
    savings: '€50-200/anno',
    savingsNum: 100,
    link: '/rc_auto',
    difficulty: 'media',
    time: '20 minuti',
  },
  {
    id: 'scatola_nera',
    category: 'Auto',
    icon: '📦',
    title: 'Valuta la scatola nera',
    desc: 'Riduce il premio RC del 10-20%. Se guidi poco e bene, è un ottimo affare.',
    savings: '€30-80/anno',
    savingsNum: 50,
    link: '/rc_auto',
    difficulty: 'facile',
    time: '5 minuti',
  },
  {
    id: 'bollo',
    category: 'Auto',
    icon: '💳',
    title: 'Segna le scadenze veicolo',
    desc: 'Bollo, revisione, tagliando, gomme. Attiva i promemoria automatici per non prendere multe.',
    savings: 'Evita multe €173-694',
    savingsNum: 100,
    link: '/bollo_revisione',
    difficulty: 'facile',
    time: '5 minuti',
  },
  {
    id: 'carburante',
    category: 'Auto',
    icon: '⛽',
    title: 'Usa pompe bianche + self',
    desc: 'Pompe no-logo costano 10-15 cent/litro in meno. Evita l\'autostrada. Sempre self-service.',
    savings: '€120-250/anno',
    savingsNum: 150,
    link: '/carburante',
    difficulty: 'facile',
    time: 'Abitudine',
  },
  {
    id: 'tfr',
    category: 'Previdenza',
    icon: '📊',
    title: 'Destina il TFR al fondo pensione',
    desc: 'Tassazione 9-15% vs 23-43% in azienda. Contributo datore di lavoro gratis. Deducibilità IRPEF.',
    savings: '€1.000-2.000/anno fiscale',
    savingsNum: 500,
    link: '/tfr_pensione',
    difficulty: 'media',
    time: '1 ora in HR',
  },
  {
    id: 'deducibilita',
    category: 'Previdenza',
    icon: '🏦',
    title: 'Massimizza la deducibilità',
    desc: 'Fino a €5.164/anno deducibili dal fondo pensione. Su reddito €35.000 risparmi ~€1.800 IRPEF.',
    savings: '€500-1.800/anno IRPEF',
    savingsNum: 800,
    link: '/tfr_pensione',
    difficulty: 'media',
    time: '30 minuti',
  },
  {
    id: 'acqua',
    category: 'Casa',
    icon: '💧',
    title: 'Installa riduttori di flusso',
    desc: 'Costano €2-5, riducono il consumo del 30-50%. Investimento ~€20 per tutta la casa.',
    savings: '€50-100/anno',
    savingsNum: 60,
    link: '/acqua',
    difficulty: 'facile',
    time: '15 minuti',
  },
  {
    id: 'mutuo',
    category: 'Casa',
    icon: '🏠',
    title: 'Valuta la surroga del mutuo',
    desc: 'La surroga è gratuita per legge. Se i tassi sono scesi di 0.5%+, puoi risparmiare migliaia.',
    savings: '€1.000-5.000/anno',
    savingsNum: 1500,
    link: '/mutuo',
    difficulty: 'impegnativa',
    time: '2-3 settimane',
  },
];

export default function ChecklistRisparmio() {
  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem('soldibuoni_checklist');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [filter, setFilter] = useState('tutti');

  const toggle = (id) => {
    const next = checked.includes(id) ? checked.filter(x => x !== id) : [...checked, id];
    setChecked(next);
    try { localStorage.setItem('soldibuoni_checklist', JSON.stringify(next)); } catch {}
  };

  const categories = ['tutti', ...new Set(CHECKLIST_ITEMS.map(i => i.category))];
  const filtered = filter === 'tutti' ? CHECKLIST_ITEMS : CHECKLIST_ITEMS.filter(i => i.category === filter);
  const totalItems = CHECKLIST_ITEMS.length;
  const doneCount = checked.length;
  const pct = Math.round((doneCount / totalItems) * 100);
  const totalSavings = CHECKLIST_ITEMS.filter(i => checked.includes(i.id)).reduce((s, i) => s + i.savingsNum, 0);
  const potentialSavings = CHECKLIST_ITEMS.reduce((s, i) => s + i.savingsNum, 0);

  const diffColors = { facile: '#059669', media: '#f59e0b', impegnativa: '#dc2626' };

  return (
    <div>
      {/* PROGRESS HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        borderRadius: 18, padding: '28px 24px', color: '#fff',
        marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(5,150,105,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Il tuo progresso
            </p>
            <p style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Playfair Display',serif" }}>
              {doneCount}/{totalItems}
              <span style={{ fontSize: 16, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>completati</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Risparmio sbloccato</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#34d399', fontFamily: "'Playfair Display',serif" }}>
              {'€' + totalSavings.toLocaleString()}
            </p>
            <p style={{ fontSize: 11, color: '#64748b' }}>
              {'su €' + potentialSavings.toLocaleString() + ' potenziali'}
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6,
            background: 'linear-gradient(90deg, #059669, #34d399)',
            width: pct + '%', transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#64748b' }}>
          <span>{pct}% completato</span>
          {pct === 100 && <span style={{ color: '#34d399', fontWeight: 700 }}>🎉 Tutto fatto!</span>}
          {pct > 0 && pct < 100 && <span>{'Mancano ' + (totalItems - doneCount) + ' azioni'}</span>}
        </div>
      </div>

      {/* FILTRI */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              padding: '7px 14px', borderRadius: 8, border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              background: filter === c ? '#0f172a' : '#f1f5f9',
              color: filter === c ? '#fff' : '#64748b',
              transition: 'all 0.2s', textTransform: 'capitalize',
            }}
          >
            {c === 'tutti' ? 'Tutti' : c}
          </button>
        ))}
      </div>

      {/* ITEMS */}
      {filtered.map((item, i) => {
        const done = checked.includes(item.id);
        return (
          <div
            key={item.id}
            style={{
              background: '#fff', borderRadius: 14,
              padding: '18px 20px', marginBottom: 10,
              border: done ? '2px solid #059669' : '1px solid #e2e8f0',
              opacity: done ? 0.75 : 1,
              transition: 'all 0.3s',
              animation: 'fadeIn 0.3s ease-out ' + i * 0.03 + 's both',
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* Checkbox */}
              <button
                onClick={() => toggle(item.id)}
                style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  border: done ? 'none' : '2px solid #cbd5e1',
                  background: done ? '#059669' : '#fff',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', marginTop: 2,
                }}
              >
                {done && '✓'}
              </button>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{
                    fontSize: 15, fontWeight: 700, color: '#0f172a',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {item.title}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px',
                    borderRadius: 8, background: diffColors[item.difficulty] + '18',
                    color: diffColors[item.difficulty],
                  }}>
                    {item.difficulty}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 8 }}>
                  {item.desc}
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#f0fdf4', padding: '3px 10px', borderRadius: 6 }}>
                    {'💰 ' + item.savings}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {'⏱️ ' + item.time}
                  </span>
                  {item.link && (
                    <a href={item.link} style={{
                      fontSize: 11, fontWeight: 700, color: '#3b82f6',
                      textDecoration: 'none',
                    }}>
                      Vai al tool →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 16, fontStyle: 'italic', textAlign: 'center' }}>
        Il progresso viene salvato nel tuo browser. Nessun dato viene inviato ai nostri server.
      </p>
    </div>
  );
}
