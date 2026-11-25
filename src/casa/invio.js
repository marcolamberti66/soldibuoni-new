// Invio email transazionali via Brevo (stessa chiave già usata dal sito).
export async function inviaEmail({ apiKey, a, oggetto, html, testo, mittente }) {
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'SoldiBuoni', email: mittente || 'noreply@soldibuoni.it' },
      to: [{ email: a }],
      subject: oggetto,
      htmlContent: html,
      textContent: testo,
      tags: ['email-lunedi'],
    }),
  });
  if (!r.ok) throw new Error('Brevo ' + r.status + ': ' + (await r.text()).slice(0, 200));
}
