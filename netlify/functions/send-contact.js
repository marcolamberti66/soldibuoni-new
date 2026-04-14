export const handler = async (event, context) => {
    // Accettiamo solo richieste POST
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
  
    try {
      const { message } = JSON.parse(event.body);
  
      if (!message || message.trim() === "") {
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: "Il messaggio è vuoto." }) 
        };
      }
  
      // Assicurati che il nome di questa variabile coincida con quella che hai su Netlify!
      // Potrebbe chiamarsi BREVO_API_KEY o SENDINBLUE_API_KEY
      const API_KEY = process.env.BREVO_API_KEY; 
      
      // INSERISCI QUI LA TUA EMAIL REALE DOVE VUOI RICEVERE I MESSAGGI
      const TUA_EMAIL_DI_DESTINAZIONE = "clart.mgmt@gmail.com";
  
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": API_KEY
        },
        body: JSON.stringify({
          sender: { name: "Utente SoldiBuoni", email: "noreply@soldibuoni.it" },
          to: [{ email: TUA_EMAIL_DI_DESTINAZIONE, name: "Admin SoldiBuoni" }],
          subject: "💬 Nuovo messaggio dalla homepage di SoldiBuoni",
          textContent: `Hai ricevuto una nuova richiesta dalla Hero Page:\n\n"${message}"\n\n---\nRicorda: L'utente non ha lasciato la sua email, questa è una richiesta anonima per dare uno spunto/feedback. Se vorrai implementare la raccolta email lo faremo nello step successivo.`
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Errore Brevo API:", errorData);
        throw new Error("Errore durante l'invio a Brevo");
      }
  
      return { 
        statusCode: 200, 
        body: JSON.stringify({ success: true, message: "Inviato con successo!" }) 
      };
  
    } catch (error) {
      console.error("Function error:", error);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "Errore interno del server." }) 
      };
    }
  };