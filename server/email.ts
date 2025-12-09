import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Pourfoliolic <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Pourfoliolic!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #d97706;">Welcome to Pourfoliolic, ${firstName || "there"}!</h1>
          <p>Thank you for joining our community of drink enthusiasts.</p>
          <p>With Pourfoliolic, you can:</p>
          <ul>
            <li>Log wines, beers, spirits, and cocktails</li>
            <li>Record detailed tasting notes (nose, palate, finish)</li>
            <li>Build your personal drink cellar</li>
            <li>Discover new drinks and share your favorites</li>
          </ul>
          <p>Start logging your first drink today!</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            Cheers,<br>
            The Pourfoliolic Team
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
