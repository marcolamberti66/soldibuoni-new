// Firma dei link di disiscrizione dell'email del lunedì: chi riceve
// l'email può smettere di riceverla con un clic, senza accedere.
// La chiave è derivata dalla service role (già segreta su Netlify):
// nessuna nuova variabile da configurare.
import { createHmac, timingSafeEqual } from 'node:crypto';

const chiave = (segreto) => createHmac('sha256', String(segreto)).update('sb-disiscrizione-v1').digest();

export function firma(userId, segreto) {
  return createHmac('sha256', chiave(segreto)).update(String(userId)).digest('base64url').slice(0, 32);
}

export function verifica(userId, t, segreto) {
  if (!userId || !t || !segreto) return false;
  const a = Buffer.from(firma(userId, segreto)), b = Buffer.from(String(t));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function linkDisiscrizione(sito, userId, segreto) {
  return `${sito}/api/casa/disiscrivi?u=${encodeURIComponent(userId)}&t=${firma(userId, segreto)}`;
}

// Indirizzo per la disiscrizione automatica dei client di posta.
export function linkUnClic(sito, userId, segreto) {
  return `${sito}/api/disiscrivi-1click?u=${encodeURIComponent(userId)}&t=${firma(userId, segreto)}`;
}
