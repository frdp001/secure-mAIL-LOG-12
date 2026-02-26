// Shared utilities for Cloudflare Pages functions and local server

export interface Env {
  DISCORD_WEBHOOK_URL: string;
}

/**
 * Send a Discord webhook POST with a JSON payload.
 * Returns an object describing success/failure so callers can log accordingly.
 */
export async function sendDiscordWebhook(webhookUrl: string | undefined, payload: any) {
  if (!webhookUrl) {
    console.error('Discord webhook URL missing');
    return { ok: false, status: 0, body: 'no webhook url' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text().catch(() => '(no body)');
    if (!res.ok) {
      console.error('Discord webhook failed:', res.status, text);
      return { ok: false, status: res.status, body: text };
    }
    return { ok: true, status: res.status, body: text };
  } catch (e) {
    console.error('Error sending Discord webhook:', e);
    return { ok: false, status: 0, error: String(e) };
  }
}
