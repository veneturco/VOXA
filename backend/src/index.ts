import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
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
    version: '5.5.0',
    model: 'gemini-2.5-flash (single-pass)',
    storage: StorageService.getInstance().getStorageStatus().mode,
    keepAlive: !!process.env.PUBLIC_BASE_URL,
    timestamp: new Date().toISOString()
  });
});

// Single Page Application (SPA) fallback to index.html when frontend build exists
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/webhook') ||
    req.path.startsWith('/audio') ||
    req.path.startsWith('/uploads')
  ) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    status: 'online',
    app: 'VOXA (by VENE TURCO)',
    version: '5.5.0',
    model: 'gemini-2.5-flash (single-pass)',
    storage: StorageService.getInstance().getStorageStatus().mode,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [VOXA Server - by VENE TURCO v5.5] Running on http://localhost:${PORT}`);
  console.log(`🎧 Audio static directory served at /audio`);
  console.log(`📡 Webhook endpoint ready at /webhook`);

  // Auto-KeepAlive for Render Free Tier (prevents 15-min spin-down sleep)
  const publicUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  if (publicUrl && publicUrl.startsWith('http') && !publicUrl.includes('localhost')) {
    console.log(`⚡ [Keep-Alive] Activated for ${publicUrl}/api/status every 10 minutes.`);
    setInterval(() => {
      axios
        .get(`${publicUrl}/api/status`)
        .then(() => console.log(`💓 [Keep-Alive] Heartbeat ping OK -> ${new Date().toISOString()}`))
        .catch(() => {});
    }, 10 * 60 * 1000);
  }
});
