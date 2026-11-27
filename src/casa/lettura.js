// Lettura di una bolletta (PDF o foto) tramite /api/casa/estrai.
// Condivisa da "Aggiungi" e dalla pagina pubblica "Controlla la tua bolletta".

// Le foto da telefono pesano 3–8 MB e su iPhone sono HEIC: le ridisegniamo
// in JPEG a 2000px. Più veloce da inviare, leggibile dal modello.
export async function preparaFile(file) {
  if (file.type === 'application/pdf') return file;
  if (!file.type.startsWith('image/')) return file;
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.86));
    return new File([blob], (file.name || 'foto').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export async function leggi(file, { riferimento } = {}) {
  const fd = new FormData();
  fd.append('file', await preparaFile(file));
  if (riferimento) fd.append('riferimento', riferimento);
  const res = await fetch('/api/casa/estrai', { method: 'POST', body: fd });
  let body = null;
  try { body = await res.json(); } catch { /* risposta non JSON */ }
  if (!res.ok) { const e = new Error(body?.errore || 'Lettura non riuscita.'); e.serveRiferimento = !!body?.serve_riferimento; throw e; }
  return body;
}

