/**
 * CityPulse Mumbai — Full-Stack Server
 * Express Backend API + Vite Dev Server Middleware
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createExpressApp } from './src/server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = createExpressApp();

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`CityPulse Mumbai municipal server operational on http://0.0.0.0:${port}`);
  });
}

createServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
