import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { apiRouter } from './routes/api.js';
import { webhookRouter } from './routes/webhook.js';
import { StorageService } from './services/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Ensure public audio & upload directories exist
const audioDir = path.resolve(__dirname, '../public/audio');
const uploadsDir = path.resolve(__dirname, '../public/uploads');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static Assets
app.use('/audio', express.static(audioDir));
app.use('/uploads', express.static(uploadsDir));

// Frontend static distribution (for unified monorepo deployment e.g. on Render)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// Routes
app.use('/api', apiRouter);
app.use('/webhook', webhookRouter);

// Health / Status ping
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'online',
    app: 'VOXA (by VENE TURCO)',
    version: '4.8.0',
    model: 'gemini-2.5-flash (single-pass)',
    storage: StorageService.getInstance().getStorageStatus().mode,
    timestamp: new Date().toISOString()
  });
});

// Single Page Application (SPA) fallback to index.html when frontend build exists
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/webhook') || req.path.startsWith('/audio') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    status: 'online',
    app: 'VOXA (by VENE TURCO)',
    version: '4.8.0',
    model: 'gemini-2.5-flash (single-pass)',
    storage: StorageService.getInstance().getStorageStatus().mode,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [VOXA Server - by VENE TURCO] Running on http://localhost:${PORT}`);
  console.log(`🎧 Audio static directory served at http://localhost:${PORT}/audio`);
  console.log(`📡 Webhook endpoint ready at http://localhost:${PORT}/webhook`);
});
