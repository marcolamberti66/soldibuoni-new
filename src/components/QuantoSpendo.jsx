import React, { useState, useEffect, useMemo } from 'react';

const STEPS = ['Famiglia', 'Casa', 'Mobilità', 'Risultati'];

const CITY_ZONES = [
  { id: 'nord', label: 'Nord Italia', gasMultiplier: 1.1, affittoBase: 650 },
  { id: 'centro', label: 'Centro Italia', gasMultiplier: 1.0, affittoBase: 550 },
  { id: 'sud', label: 'Sud e Isole', gasMultiplier: 0.85, affittoBase: 400 },
];

const CONSUMO_LUCE_PERSONA = 900;
const CONSUMO_GAS_BASE = 400;
const CONSUMO_GAS_RISCALDAMENTO = 800;

function StepIndicator({ current, total, labels }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
      {labels.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
              background: i <= current ? 'linear-gradient(135deg, #0f172a, #334155)' : '#e2e8f0',
              color: i <= current ? '#fff' : '#94a3b8',
              transition: 'all 0.4s ease',
              boxShadow: i === current ? '0 0 0 4px rgba(15,23,42,0.15)' : 'none',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: i <= current ? '#0f172a' : '#94a3b8',
              transition: 'color 0.3s',
            }}>{label}</span>
          </div>
          {i < labels.length - 1 && (
            <div style={{
              width: 48, height: 2, margin: '0 4px',
              background: i < current ? '#0f172a' : '#e2e8f0',
              borderRadius: 2, transition: 'background 0.4s',
              marginBottom: 22,
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function CardWrapper({ children, title, subtitle }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '28px 24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      marginBottom: 16,
    }}>
      {title && <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{title}</h3>}
      {subtitle && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function SliderInput({ label, value, onChange, min, max, step, unit, color }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: color || '#0f172a' }}>
          {typeof value === 'number' ? value.toLocaleString() : value} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: color || '#0f172a' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()} {unit}</span>
      </div>
    </div>
  );
}

function PillSelect({ options, value, onChange, color }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          style={{
            padding: '9px 16px', borderRadius: 10, border: 'none',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            background: value === opt.id ? (color || '#0f172a') : '#f1f5f9',
            color: value === opt.id ? '#fff' : '#64748b',
            transition: 'all 0.2s',
          }}
        >
          {opt.icon && <span style={{ marginRight: 6 }}>{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleOption({ label, checked, onChange, icon }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 10, border: 'none',
        background: checked ? '#f0fdf4' : '#f8fafc',
        cursor: 'pointer', fontFamily: 'inherit', width: '100%',
        marginBottom: 8, transition: 'all 0.2s',
        outline: checked ? '2px solid #059669' : '1px solid #e2e8f0',
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: checked ? '#059669' : '#64748b', flex: 1, textAlign: 'left' }}>{label}</span>
      <div style={{
        width: 20, height: 20, borderRadius: 6,
        background: checked ? '#059669' : '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 12, fontWeight: 700,
      }}>
        {checked && '✓'}
      </div>
    </button>
  );
}

function StepFamiglia({ profilo, setProfilo }) {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <CardWrapper title="👨‍👩‍👧‍👦 La tua famiglia" subtitle="Quanti siete e dove vivete">
        <SliderInput
          label="Componenti del nucleo"
          value={profilo.componenti} onChange={(v) => setProfilo(p => ({ ...p, componenti: v }))}
          min={1} max={6} step={1} unit="persone" color="#6366F1"
        />
        <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Zona d'Italia</p>
        <PillSelect
          options={CITY_ZONES.map(z => ({ id: z.id, label: z.label }))}
          value={profilo.zona} onChange={(v) => setProfilo(p => ({ ...p, zona: v }))}
          color="#6366F1"
        />
        <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>ISEE familiare</p>
        <PillSelect
          options={[
            { id: 'basso', label: '< €15.000' },
            { id: 'medio', label: '€15-40.000' },
            { id: 'alto', label: '> €40.000' },
          ]}
          value={profilo.isee} onChange={(v) => setProfilo(p => ({ ...p, isee: v }))}
          color="#6366F1"
        />
      </CardWrapper>
    </div>
  );
}

function StepCasa({ profilo, setProfilo }) {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <CardWrapper title="⚡ Energia elettrica" subtitle="Quanto consumi e che contratto hai">
        <SliderInput
          label="Consumo annuo stimato"
          value={profilo.consumoLuce} onChange={(v) => setProfilo(p => ({ ...p, consumoLuce: v }))}
          min={1000} max={6000} step={100} unit="kWh" color="#F59E0B"
        />
        <SliderInput
          label="Prezzo attuale (se lo conosci)"
          value={profilo.prezzoLuce} onChange={(v) => setProfilo(p => ({ ...p, prezzoLuce: v }))}
          min={0.05} max={0.3} step={0.005} unit="€/kWh" color="#F59E0B"
        />
      </CardWrapper>
      <CardWrapper title="🔥 Gas naturale" subtitle="Riscaldamento e cottura">
        <ToggleOption
          label="Ho riscaldamento autonomo a gas"
          icon="🏠" checked={profilo.riscaldamento}
          onChange={(v) => setProfilo(p => ({ ...p, riscaldamento: v }))}
        />
        <SliderInput
          label="Consumo annuo stimato"
          value={profilo.consumoGas} onChange={(v) => setProfilo(p => ({ ...p, consumoGas: v }))}
          min={100} max={2500} step={50} unit="Smc" color="#EF4444"
        />
        <SliderInput
          label="Prezzo attuale (se lo conosci)"
          value={profilo.prezzoGas} onChange={(v) => setProfilo(p => ({ ...p, prezzoGas: v }))}
          min={0.2} max={1.0} step={0.01} unit="€/Smc" color="#EF4444"
        />
      </CardWrapper>
      <CardWrapper title="📡 Internet" subtitle="La tua connessione di casa">
        <SliderInput
          label="Quanto paghi al mese"
          value={profilo.prezzoInternet} onChange={(v) => setProfilo(p => ({ ...p, prezzoInternet: v }))}
          min={15} max={45} step={0.5} unit="€/mese" color="#8B5CF6"
        />
      </CardWrapper>
    </div>
  );
}

function StepMobilita({ profilo, setProfilo }) {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <CardWrapper title="🚗 Auto e trasporti">
        <ToggleOption
          label="Ho un'auto" icon="🚗"
          checked={profilo.haAuto}
          onChange={(v) => setProfilo(p => ({ ...p, haAuto: v }))}
        />
        {profilo.haAuto && (
          <div>
            <SliderInput
              label="Km percorsi all'anno"
              value={profilo.kmAnno} onChange={(v) => setProfilo(p => ({ ...p, kmAnno: v }))}
              min={3000} max={40000} step={1000} unit="km" color="#EC4899"
            />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Carburante</p>
            <PillSelect
              options={[
                { id: 'benzina', label: 'Benzina', icon: '⛽' },
                { id: 'diesel', label: 'Diesel', icon: '⛽' },
                { id: 'gpl', label: 'GPL', icon: '🟢' },
                { id: 'elettrico', label: 'Elettrico', icon: '🔌' },
              ]}
              value={profilo.carburante} onChange={(v) => setProfilo(p => ({ ...p, carburante: v }))}
              color="#EC4899"
            />
            <SliderInput
              label="RC Auto attuale (annua)"
              value={profilo.rcAuto} onChange={(v) => setProfilo(p => ({ ...p, rcAuto: v }))}
              min={200} max={800} step={10} unit="€/anno" color="#EC4899"
            />
          </div>
        )}
      </CardWrapper>
      <CardWrapper title="🎓 Istruzione">
        <ToggleOption
          label="Ho figli all'università" icon="🎓"
          checked={profilo.haUniversita}
          onChange={(v) => setProfilo(p => ({ ...p, haUniversita: v }))}
        />
        {profilo.haUniversita && (
          <div>
            <SliderInput
              label="Numero figli iscritti"
              value={profilo.figliUni} onChange={(v) => setProfilo(p => ({ ...p, figliUni: v }))}
              min={1} max={4} step={1} unit="" color="#6366F1"
            />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Tipo ateneo</p>
            <PillSelect
              options={[
                { id: 'pubblica', label: 'Pubblica' },
                { id: 'privata', label: 'Privata' },
              ]}
              value={profilo.tipoUni} onChange={(v) => setProfilo(p => ({ ...p, tipoUni: v }))}
              color="#6366F1"
            />
          </div>
        )}
      </CardWrapper>
    </div>
  );
}

function CostBar({ label, icon, attuale, ottimale, color, link, maxVal }) {
  const risparmio = attuale - ottimale;
  const pct = maxVal > 0 ? (attuale / maxVal) * 100 : 0;
  const pctOtt = maxVal > 0 ? (ottimale / maxVal) * 100 : 0;

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 20px',
      border: '1px solid #e2e8f0', marginBottom: 10,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
    onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{label}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>€{Math.round(attuale).toLocaleString()}</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>/anno</span>
        </div>
      </div>
      <div style={{ position: 'relative', background: '#f1f5f9', borderRadius: 6, height: 10, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          position: 'absolute', height: '100%', borderRadius: 6,
          background: color + '40', width: pct + '%',
          transition: 'width 0.8s ease',
        }} />
        <div style={{
          position: 'absolute', height: '100%', borderRadius: 6,
          background: 'linear-gradient(90deg, ' + color + '88, ' + color + ')',
          width: pctOtt + '%',
          transition: 'width 0.8s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {risparmio > 10 ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#f0fdf4', padding: '3px 10px', borderRadius: 8 }}>
            {'💰 Risparmio potenziale: €' + Math.round(risparmio).toLocaleString() + '/anno'}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Già ottimizzato ✓</span>
        )}
        {link && (
          <a href={link} style={{
            fontSize: 11, fontWeight: 700, color: color,
            textDecoration: 'none', padding: '4px 10px',
            border: '1.5px solid ' + color, borderRadius: 6,
          }}>
            Confronta →
          </a>
        )}
      </div>
    </div>
  );
}

function StepRisultati({ profilo, liveData }) {
  const zona = CITY_ZONES.find(z => z.id === profilo.zona) || CITY_ZONES[0];

  const spesaLuceAttuale = profilo.consumoLuce * profilo.prezzoLuce + 10 * 12;
  const spesaGasAttuale = profilo.consumoGas * profilo.prezzoGas + 8 * 12;
  const spesaInternetAttuale = profilo.prezzoInternet * 12;

  const costoKmMap = { benzina: 0.11, diesel: 0.09, gpl: 0.065, elettrico: 0.035 };
  const costoKm = costoKmMap[profilo.carburante] || 0.1;
  const spesaCarburanteAttuale = profilo.haAuto ? profilo.kmAnno * costoKm : 0;
  const spesaRcAttuale = profilo.haAuto ? profilo.rcAuto : 0;

  const rettaMap = {
    pubblica: { basso: 156, medio: 1200, alto: 2800 },
    privata: { basso: 4000, medio: 7000, alto: 12000 },
  };
  const retta = profilo.haUniversita ? (rettaMap[profilo.tipoUni]?.[profilo.isee] || 1500) : 0;
  const spesaUniAttuale = retta * profilo.figliUni;

  let bestLuce = profilo.prezzoLuce;
  let bestGas = profilo.prezzoGas;
  let bestInternet = profilo.prezzoInternet;
  let bestRc = profilo.rcAuto;

  if (liveData?.energia?.length > 0) {
    const sorted = liveData.energia.map(p => p.prezzo * profilo.consumoLuce + (p.fisso || 0) * 12).sort((a, b) => a - b);
    if (sorted[0]) bestLuce = sorted[0] / profilo.consumoLuce;
  }
  if (liveData?.gas?.length > 0) {
    const sorted = liveData.gas.map(p => p.prezzo * profilo.consumoGas + (p.fisso || 0) * 12).sort((a, b) => a - b);
    if (sorted[0]) bestGas = sorted[0] / profilo.consumoGas;
  }
  if (liveData?.internet?.length > 0) {
    const prices = liveData.internet.map(p => p.prezzo).sort((a, b) => a - b);
    if (prices[0]) bestInternet = prices[0];
  }
  if (liveData?.rc_auto?.length > 0) {
    const rcs = liveData.rc_auto.map(p => p.rc).sort((a, b) => a - b);
    if (rcs[0]) bestRc = rcs[0];
  }

  const spesaLuceOttimale = profilo.consumoLuce * bestLuce;
  const spesaGasOttimale = profilo.consumoGas * bestGas;
  const spesaInternetOttimale = bestInternet * 12;
  const spesaRcOttimale = profilo.haAuto ? bestRc : 0;
  const spesaUniOttimale = spesaUniAttuale;

  const categorie = [
    { label: 'Energia Elettrica', icon: '⚡', attuale: spesaLuceAttuale, ottimale: spesaLuceOttimale, color: '#F59E0B', link: '/energia' },
    { label: 'Gas Naturale', icon: '🔥', attuale: spesaGasAttuale, ottimale: spesaGasOttimale, color: '#EF4444', link: '/gas' },
    { label: 'Internet', icon: '📡', attuale: spesaInternetAttuale, ottimale: spesaInternetOttimale, color: '#8B5CF6', link: '/internet' },
  ];

  if (profilo.haAuto) {
    categorie.push({ label: 'Carburante', icon: '⛽', attuale: spesaCarburanteAttuale, ottimale: spesaCarburanteAttuale * 0.85, color: '#84CC16', link: '/carburante' });
    categorie.push({ label: 'RC Auto', icon: '🚗', attuale: spesaRcAttuale, ottimale: spesaRcOttimale, color: '#EC4899', link: '/rc_auto' });
  }
  if (profilo.haUniversita) {
    categorie.push({ label: 'Università', icon: '🎓', attuale: spesaUniAttuale, ottimale: spesaUniOttimale, color: '#6366F1', link: '/istruzione' });
  }

  const totaleAttuale = categorie.reduce((s, c) => s + c.attuale, 0);
  const totaleOttimale = categorie.reduce((s, c) => s + c.ottimale, 0);
  const risparmioTotale = totaleAttuale - totaleOttimale;
  const maxVal = Math.max(...categorie.map(c => c.attuale));

  const waText = '\uD83E\uDDEE Ho calcolato la spesa della mia famiglia: \u20AC' + Math.round(totaleAttuale).toLocaleString() + '/anno!\n\uD83D\uDCB0 Potrei risparmiare \u20AC' + Math.round(risparmioTotale).toLocaleString() + '/anno.\n\nScopri quanto spendi tu \uD83D\uDC49 https://soldibuoni.it/quanto-spendo';
  const waUrl = 'https://wa.me/?text=' + encodeURIComponent(waText);

  const copyText = 'La mia famiglia spende \u20AC' + Math.round(totaleAttuale).toLocaleString() + '/anno. Potrei risparmiare \u20AC' + Math.round(risparmioTotale).toLocaleString() + '. Calcola il tuo: soldibuoni.it/quanto-spendo';

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 18, padding: '32px 28px', marginBottom: 20,
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -30, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.02)',
        }} />
        <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          La tua famiglia spende
        </p>
        <div style={{ fontSize: 44, fontWeight: 800, marginBottom: 4, fontFamily: "'Playfair Display',serif" }}>
          {'€' + Math.round(totaleAttuale).toLocaleString()}
          <span style={{ fontSize: 18, fontWeight: 400, color: '#94a3b8' }}>/anno</span>
        </div>
        {risparmioTotale > 20 && (
          <div style={{
            marginTop: 16, background: 'rgba(5,150,105,0.15)',
            borderRadius: 12, padding: '14px 18px',
            border: '1px solid rgba(5,150,105,0.25)',
          }}>
            <p style={{ fontSize: 13, color: '#6ee7b7', marginBottom: 2 }}>Risparmio potenziale con le offerte migliori</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#34d399', fontFamily: "'Playfair Display',serif" }}>
              {'−€' + Math.round(risparmioTotale).toLocaleString()}
              <span style={{ fontSize: 14, fontWeight: 400, color: '#6ee7b7' }}>/anno</span>
            </p>
            <p style={{ fontSize: 12, color: '#6ee7b7', marginTop: 4 }}>
              {'Equivale a €' + Math.round(risparmioTotale / 12) + '/mese in più nel tuo portafoglio'}
            </p>
          </div>
        )}
      </div>

      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#0f172a', marginBottom: 14 }}>
        Dettaglio per categoria
      </h3>
      {categorie.sort((a, b) => b.attuale - a.attuale).map((c, i) => (
        <CostBar key={c.label} {...c} maxVal={maxVal} />
      ))}

      <div style={{
        background: '#fff', borderRadius: 14, padding: '22px 24px',
        border: '1px solid #e2e8f0', marginTop: 16, textAlign: 'center',
      }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
          Condividi il risultato
        </p>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          Sfida amici e parenti: chi spende di meno?
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#25D366', color: '#fff', padding: '12px 24px',
              borderRadius: 10, fontSize: 14, fontWeight: 700,
              textDecoration: 'none', transition: 'transform 0.2s',
            }}
          >
            📱 WhatsApp
          </a>
          <button
            onClick={handleCopy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#f1f5f9', color: '#475569', padding: '12px 24px',
              borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'transform 0.2s',
            }}
          >
            {copied ? '✓ Copiato!' : '📋 Copia testo'}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 16, fontStyle: 'italic', textAlign: 'center' }}>
        * Stime basate sul tuo profilo e le migliori offerte disponibili oggi.
        I risparmi reali dipendono dal contratto attuale e dalle condizioni specifiche.
      </p>
    </div>
  );
}

export default function QuantoSpendo() {
  const [step, setStep] = useState(0);
  const [liveData, setLiveData] = useState(null);

  const [profilo, setProfilo] = useState({
    componenti: 3,
    zona: 'nord',
    isee: 'medio',
    consumoLuce: 2700,
    prezzoLuce: 0.15,
    consumoGas: 1000,
    prezzoGas: 0.50,
    riscaldamento: true,
    prezzoInternet: 28,
    haAuto: true,
    kmAnno: 12000,
    carburante: 'benzina',
    rcAuto: 400,
    haUniversita: false,
    figliUni: 1,
    tipoUni: 'pubblica',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://soldibuoni.it/.netlify/functions/get-prices", { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return;
        const payload = await res.json();
        if (payload?.data) setLiveData(payload.data);
      } catch (err) {
        console.warn("Backend non raggiungibile, uso stime di mercato.");
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const zona = CITY_ZONES.find(z => z.id === profilo.zona) || CITY_ZONES[0];
    const base = CONSUMO_GAS_BASE + (profilo.componenti - 1) * 80;
    const riscaldamento = profilo.riscaldamento ? CONSUMO_GAS_RISCALDAMENTO * zona.gasMultiplier : 0;
    setProfilo(p => ({ ...p, consumoGas: Math.round(base + riscaldamento) }));
  }, [profilo.componenti, profilo.zona, profilo.riscaldamento]);

  useEffect(() => {
    setProfilo(p => ({ ...p, consumoLuce: CONSUMO_LUCE_PERSONA * profilo.componenti }));
  }, [profilo.componenti]);

  const isLast = step === STEPS.length - 1;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <StepIndicator current={step} total={STEPS.length} labels={STEPS} />

      {step === 0 && <StepFamiglia profilo={profilo} setProfilo={setProfilo} />}
      {step === 1 && <StepCasa profilo={profilo} setProfilo={setProfilo} />}
      {step === 2 && <StepMobilita profilo={profilo} setProfilo={setProfilo} />}
      {step === 3 && <StepRisultati profilo={profilo} liveData={liveData} />}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        {step > 0 && !isLast && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              padding: '14px 24px', borderRadius: 10, border: '1px solid #e2e8f0',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              background: '#fff', color: '#64748b', flex: 1,
            }}
          >
            ← Indietro
          </button>
        )}
        {!isLast && (
          <button
            onClick={() => setStep(s => s + 1)}
            style={{
              padding: '14px 24px', borderRadius: 10, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: 'linear-gradient(135deg, #0f172a, #334155)',
              color: '#fff', flex: 2,
              transition: 'transform 0.2s',
            }}
          >
            {step === STEPS.length - 2 ? 'Calcola il mio risparmio →' : 'Avanti →'}
          </button>
        )}
        {isLast && (
          <button
            onClick={() => setStep(0)}
            style={{
              padding: '14px 24px', borderRadius: 10, border: '1px solid #e2e8f0',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              background: '#fff', color: '#64748b', flex: 1,
            }}
          >
            ← Ricalcola con altri dati
          </button>
        )}
      </div>
    </div>
  );
}
