import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async ({ env }) => {
  return new Response(JSON.stringify({
    webhookUrl: env.DISCORD_WEBHOOK_URL ? `***${env.DISCORD_WEBHOOK_URL.slice(-20)}` : 'NOT SET',
    nodeVersion: process.version,
    hasGlobalFetch: typeof globalThis.fetch === 'function'
  }), { headers: { 'Content-Type': 'application/json' } });
};
