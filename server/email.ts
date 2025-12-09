import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    const userName = firstName || "there";
    
    const { data, error } = await resend.emails.send({
      from: "Revanth from Pourfoliolic <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Pourfoliolic — Your Liquid Adventures Await",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <p>Hi ${userName},</p>
          
          <p>Welcome to Pourfoliolic — and congratulations on making the responsible choice to track your… let's call them "liquid adventures."</p>
          
          <p>I'm Revanth, the founder of Pourfoliolic.<br>
          Yes, a real human, not a whiskey-powered AI (although that would've been cool).</p>
          
          <p>You just joined a community of people who:</p>
          <ul style="margin: 10px 0;">
            <li>Appreciate good drinks</li>
            <li>Make questionable decisions</li>
            <li>And want their flavor notes to look more elegant than their hangovers</li>
          </ul>
          
          <p><strong>Here's what you can do inside Pourfoliolic starting right now:</strong></p>
          <p style="margin: 5px 0;">✔ Log every drink (even the ones you pretend you didn't have)</p>
          <p style="margin: 5px 0;">✔ Get smart tasting notes and flavor profiles</p>
          <p style="margin: 5px 0;">✔ See analytics that tell you things your liver probably already knows</p>
          <p style="margin: 5px 0;">✔ Save bottles, remember bars, and build your own classy drink portfolio</p>
          
          <p>Whether you're a whiskey lover, cocktail explorer, wine romantic, or tequila survivor — Pourfoliolic makes sure your taste journey is remembered even if you're not.</p>
          
          <p>Thank you for being one of the earliest users.<br>
          If you have feedback, ideas, or just want to brag about a fantastic bottle you tried, you can reply directly to this email — it comes straight to me.</p>
          
          <p><strong>Welcome to the family.</strong><br>
          Sip smart. Log honestly. Laugh often.</p>
          
          <p style="margin-top: 30px;">
            Cheers,<br>
            <strong>Revanth Mendu</strong><br>
            Founder, Pourfoliolic<br>
            <span style="font-size: 18px;">🍷🥃🍸</span>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      return false;
    }

    console.log("Welcome email sent:", data);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
}
