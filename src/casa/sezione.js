// ─────────────────────────────────────────────────────────────
// "La sezione della mia casa": la tavola della home disegnata con
// i dati veri dell'utente, come immagine da condividere (1080×1350,
// il formato verticale di Instagram e degli stati WhatsApp).
// Ogni piano è alto quanto pesa la sua voce; mutuo o affitto sono
// le fondamenta, sotto terra.
// ─────────────────────────────────────────────────────────────
import { CATEGORIE } from './model.js';

const W = 1080, H = 1350;
const PAPER = '#f5f2ec', INK = '#17150f', INK2 = '#37332b', BRASS = '#84652d', LINE = 'rgba(23,21,15,.18)';
const DISPLAY = '"Bodoni Moda Variable", "Bodoni 72", Didot, Georgia, serif';
const UI = '"Schibsted Grotesk Variable", system-ui, -apple-system, "Segoe UI", sans-serif';
const FONDAMENTA = ['mutuo', 'affitto'];
const MAX_PIANI = 6;

const fmt = (n) => '€ ' + new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(Math.round(n));

function colore(cat) {
  const v = (CATEGORIE[cat] || CATEGORIE.altro).colore;
  const m = /var\((--[^)]+)\)/.exec(v);
  if (!m || typeof document === 'undefined') return v;
  return getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || '#8b8477';
}

/** voci: [{ cat, mensile }]. Restituisce i piani e le fondamenta da disegnare. */
export function pianiDa(voci) {
  const fond = voci.filter((v) => FONDAMENTA.includes(v.cat) && v.mensile > 0);
  let piani = voci.filter((v) => !FONDAMENTA.includes(v.cat) && v.mensile > 0).sort((a, b) => b.mensile - a.mensile);
  if (piani.length > MAX_PIANI) {
    const resto = piani.slice(MAX_PIANI - 1);
    piani = [...piani.slice(0, MAX_PIANI - 1), { cat: 'altro', label: 'Altre voci', mensile: resto.reduce((t, v) => t + v.mensile, 0) }];
  }
  return { fond, piani };
}

async function fontPronti() {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all([
    document.fonts.load(`400 80px ${DISPLAY}`), document.fonts.load(`italic 400 40px ${DISPLAY}`),
    document.fonts.load(`500 30px ${UI}`), document.fonts.load(`400 26px ${UI}`),
  ]).catch(() => {});
}

// Il simbolo € del Bodoni è troppo decorativo: lo scriviamo con il carattere dell'interfaccia.
function scriviValore(g, val, xDestra, y, size) {
  g.textAlign = 'left';
  const euro = val.startsWith('€ ');
  const numero = euro ? val.slice(2) : val;
  g.font = `400 ${size}px ${DISPLAY}`;
  const wn = g.measureText(numero).width;
  g.fillStyle = INK; g.fillText(numero, xDestra - wn, y);
  if (euro) {
    g.font = `400 ${Math.round(size * 0.52)}px ${UI}`;
    const we = g.measureText('€').width;
    g.fillStyle = INK2; g.fillText('€', xDestra - wn - we - size * 0.18, y);
  }
}

/** Disegna su un canvas e restituisce il canvas. opzioni.importi = false mostra solo le percentuali. */
export async function disegnaSezione(voci, { importi = true } = {}) {
  await fontPronti();
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const totale = voci.reduce((t, v) => t + v.mensile, 0) || 1;
  const { fond, piani } = pianiDa(voci);
  const valore = (n) => (importi ? fmt(n) : Math.round((n / totale) * 100) + '%');

  // fondo
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);

  // intestazione
  g.fillStyle = BRASS; g.font = `italic 400 34px ${DISPLAY}`; g.textBaseline = 'alphabetic';
  g.fillText('Tav. 01', 80, 118);
  g.fillStyle = INK2; g.font = `500 22px ${UI}`;
  g.letterSpacing = '4px';
  g.fillText('LA SEZIONE DELLA MIA CASA', 200, 116);
  g.letterSpacing = '0px';
  g.fillStyle = INK; g.font = `400 92px ${DISPLAY}`;
  if (importi) {
    g.font = `400 46px ${UI}`; g.fillStyle = INK2; g.fillText('€', 80, 222);
    const we = g.measureText('€').width;
    const cifra = fmt(totale).slice(2);
    g.font = `400 92px ${DISPLAY}`; g.fillStyle = INK; g.fillText(cifra, 80 + we + 14, 226);
    const w = 80 + we + 14 + g.measureText(cifra).width;
    g.fillStyle = BRASS; g.font = `italic 400 52px ${DISPLAY}`; g.fillText('al mese', w + 22, 226);
  } else {
    g.font = `400 80px ${DISPLAY}`; g.fillText('Dove va', 76, 206);
    const wd = g.measureText('Dove va ').width;
    g.fillStyle = BRASS; g.font = `italic 400 80px ${DISPLAY}`; g.fillText('ogni euro.', 76 + wd, 206);
  }

  // geometria della casa
  const x0 = 110, larg = 400, terra = 1000;
  const altPiani = 520, altFond = fond.length ? 170 : 0;
  const totPiani = piani.reduce((t, p) => t + p.mensile, 0) || 1;
  const min = 46;
  let hs = piani.map((p) => Math.max(min, (p.mensile / totPiani) * altPiani));
  const scala = altPiani / hs.reduce((t, h) => t + h, 0);
  hs = hs.map((h) => h * scala);
  const cima = terra - altPiani;

  // terreno
  g.fillStyle = 'rgba(87,82,70,.22)';
  for (let y = terra + 18; y < terra + 230; y += 22) for (let x = 20 + ((y / 22) % 2) * 11; x < W - 20; x += 22) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
  g.strokeStyle = INK; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(40, terra); g.lineTo(W - 40, terra); g.stroke();

  // tetto e camino
  g.lineWidth = 2.4; g.strokeStyle = INK;
  g.beginPath(); g.moveTo(x0 - 26, cima + 2); g.lineTo(x0 + larg / 2, cima - 150); g.lineTo(x0 + larg + 26, cima + 2); g.stroke();
  g.fillStyle = PAPER; g.fillRect(x0 + larg * 0.7, cima - 118, 36, 70); g.strokeRect(x0 + larg * 0.7, cima - 118, 36, 70);

  // etichette a destra: colonna fissa
  const xl = 600, xv = W - 80;
  const etichetta = (yMid, nome, val, sotto, grande) => {
    g.strokeStyle = 'rgba(87,82,70,.7)'; g.lineWidth = 1.4; g.setLineDash([3, 5]);
    g.beginPath(); g.moveTo(x0 + larg + 4, yMid); g.lineTo(xl - 14, yMid); g.stroke(); g.setLineDash([]);
    g.fillStyle = INK; g.font = `500 ${grande ? 32 : 29}px ${UI}`; g.textAlign = 'left';
    g.fillText(nome, xl, yMid + (sotto ? -2 : 10));
    if (sotto) { g.fillStyle = BRASS; g.font = `italic 400 26px ${DISPLAY}`; g.fillText(sotto, xl, yMid + 30); }
    scriviValore(g, val, xv, yMid + (grande ? 16 : 13), grande ? 50 : 40);
  };

  // piani, dall'alto: il più costoso in basso, appoggiato a terra
  const ordinati = [...piani].map((p, i) => ({ ...p, h: hs[i] })).reverse();
  let y = cima;
  for (const p of ordinati) {
    g.fillStyle = '#fbfaf7'; g.fillRect(x0, y, larg, p.h);
    g.strokeStyle = INK; g.lineWidth = 2.4; g.strokeRect(x0, y, larg, p.h);
    g.fillStyle = colore(p.cat); g.fillRect(x0, y, 12, p.h);
    if (p.h >= 70) {
      g.lineWidth = 1.6;
      for (const fx of [x0 + 70, x0 + larg - 120]) {
        const fy = y + 18, fh = p.h - 36;
        g.fillStyle = '#f1dfb4'; g.fillRect(fx, fy, 50, fh); g.strokeRect(fx, fy, 50, fh);
        g.beginPath(); g.moveTo(fx + 25, fy); g.lineTo(fx + 25, fy + fh); g.stroke();
      }
    }
    etichetta(y + p.h / 2, p.label || (CATEGORIE[p.cat] || CATEGORIE.altro).label, valore(p.mensile));
    y += p.h;
  }

  // fondamenta
  if (fond.length) {
    const f = fond.reduce((t, v) => t + v.mensile, 0);
    const affitto = fond.every((v) => v.cat === 'affitto');
    g.save();
    g.beginPath(); g.rect(x0, terra, larg, altFond); g.clip();
    g.strokeStyle = 'rgba(132,101,45,.55)'; g.lineWidth = 2;
    for (let k = -altFond; k < larg + altFond; k += 16) { g.beginPath(); g.moveTo(x0 + k, terra + altFond); g.lineTo(x0 + k + altFond, terra); g.stroke(); }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 2.4;
    if (affitto) g.setLineDash([12, 9]);
    g.strokeRect(x0, terra, larg, altFond); g.setLineDash([]);
    etichetta(terra + altFond / 2, affitto ? 'Affitto' : 'Mutuo', valore(f), affitto ? 'in prestito' : 'le fondamenta', true);
  }

  // firma
  g.fillStyle = INK; g.font = `400 40px ${DISPLAY}`; g.textAlign = 'left';
  g.fillText('Soldi', 80, H - 70);
  const ws = g.measureText('Soldi').width;
  g.fillStyle = BRASS; g.font = `italic 400 40px ${DISPLAY}`; g.fillText('Buoni', 80 + ws, H - 70);
  g.fillStyle = INK2; g.font = `400 24px ${UI}`; g.textAlign = 'right';
  g.fillText('soldibuoni.it · la casa, in conti chiari', W - 80, H - 76);
  g.textAlign = 'left';
  return cv;
}

export async function immagineSezione(voci, opzioni) {
  const cv = await disegnaSezione(voci, opzioni);
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  return { blob, url: URL.createObjectURL(blob) };
}
