import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DISCORD_WEBHOOK_URL: string;
}

export const onRequest: PagesFunction<Env> = async ({ env }) => {
  return new Response(
    JSON.stringify({
      webhookUrl: env.DISCORD_WEBHOOK_URL ? `***${env.DISCORD_WEBHOOK_URL.slice(-20)}` : 'NOT SET',
      nodeVersion: undefined,
      hasGlobalFetch: true
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
