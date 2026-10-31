import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
import { apiRouter } from './routes/api.js';
import { webhookRouter } from './routes/webhook.js';
import { StorageService } from './services/storage.js';
import { BaileysManager } from './services/baileysManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// ========================================================
// FASE 4: REVERSE PROXY CONFIGURATION (RENDER DEPLOYMENT)
// ========================================================
// Permite que express-rate-limit obtenga la IP real del cliente a través de X-Forwarded-For
app.set('trust proxy', 1);

// Ocultar huella de tecnología de servidor
app.disable('x-powered-by');

// ========================================================
// FASE 1: HELMET, CSP Y CABECERAS DE SEGURIDAD
// ========================================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'https://docs.google.com', 'https://*.google.com', 'https://ve.dolarapi.com', 'https:']
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' }, // Evita Clickjacking en iframes
    noSniff: true // Evita MIME type sniffing
  })
);

// ========================================================
// FASE 2: CORS ESTRICTO Y CONTROLADO
// ========================================================
const allowedOrigins = [
  'https://voxa-hk3e.onrender.com',
  'http://localhost:5173',
  'http://localhost:4000',
  'http://localhost:3000'
];

if (process.env.PUBLIC_BASE_URL) {
  const cleanPublic = process.env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  if (!allowedOrigins.includes(cleanPublic)) {
    allowedOrigins.push(cleanPublic);
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (curl, mobile webhooks de Meta, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(new Error('Bloqueado por política CORS de VOXA'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key']
  })
);

// ========================================================
// FASE 4: RATE LIMITING POR IP Y LÍMITE DE PAYLOAD
// ========================================================
// Límite general para la API: 120 peticiones por minuto por IP
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas peticiones. Por favor, disminuye la velocidad.' }
});

// Límite estricto para rutas de autenticación: máximo 10 intentos por minuto por IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos de acceso fallidos. Espera 1 minuto.' }
});

// Límite estricto de payload (Anti-Buffer Bloat & Memory Exhaustion)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Ensure public audio & upload directories exist
const audioDir = path.resolve(__dirname, '../public/audio');
const uploadsDir = path.resolve(__dirname, '../public/uploads');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ========================================================
// FASE 1 & 5: AISLAMIENTO ESTRICTO DE ESTÁTICOS Y HEALTHCHECK
// ========================================================
// Prevenir acceso a archivos del sistema (.env, creds, package.json, etc.)
app.use((req, res, next) => {
  const forbiddenPatterns = [
    /\.env/i,
    /package\.json/i,
    /tsconfig/i,
    /auth_sessions/i,
    /creds\.json/i,
    /\.git/i,
    /data\/db\.json/i
  ];
  if (forbiddenPatterns.some(pattern => pattern.test(req.path))) {
    return res.status(403).json({ success: false, error: 'Acceso denegado' });
  }
  next();
});

// Static Assets con control
app.use('/audio', express.static(audioDir, { maxAge: '1h', dotfiles: 'ignore' }));
app.use('/uploads', express.static(uploadsDir, { maxAge: '1h', dotfiles: 'ignore' }));

// Frontend static distribution
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath, { dotfiles: 'ignore' }));
}

// FASE 5: Healthcheck público y ultra-rápido para UptimeRobot y Render (sin datos sensibles)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// ========================================================
// RUTAS DE LA APLICACIÓN
// ========================================================
app.use('/api/auth', authLimiter);
app.use('/api', generalApiLimiter, apiRouter);
app.use('/webhook', webhookRouter);

// Health / Status ping informativo
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

// Single Page Application (SPA) fallback
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/webhook') ||
    req.path.startsWith('/audio') ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/health')
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
    storage: StorageService.getInstance().getStorageStatus().mode,
    timestamp: new Date().toISOString()
  });
});

// ========================================================
// FASE 1: MIDDLEWARE GLOBAL DE MANEJO DE ERRORES SEGURO
// ========================================================
// Intercepta cualquier fallo y nunca expone stack traces ni rutas internas al cliente
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ [SecOps Exception Intercepted]:', err?.message || err);
  if (res.headersSent) return;
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor. La solicitud ha sido registrada de forma segura.'
  });
});

// ========================================================
// FASE 5: OPERACIÓN 24/7, ZERO-CRASH & GRACEFUL SHUTDOWN
// ========================================================
process.on('uncaughtException', (error: Error) => {
  console.error('🚨 [SecOps Shield] Uncaught Exception prevenido:', error.message);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('🚨 [SecOps Shield] Unhandled Rejection prevenido:', reason?.message || reason);
});

const server = app.listen(PORT, () => {
  console.log(`🛡️ [VOXA SecOps Server v5.5] Activo y blindado en http://localhost:${PORT}`);
  console.log(`📡 Endpoints protegidos con Helmet, RateLimit y Credencial Maestra`);
  console.log(`🩺 Healthcheck público listo en /health`);

  // Auto-KeepAlive para Render Free Tier (evita suspensión cada 10 minutos)
  const publicUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  if (publicUrl && publicUrl.startsWith('http') && !publicUrl.includes('localhost')) {
    console.log(`⚡ [Keep-Alive] Activado para ${publicUrl}/health cada 9 minutos.`);
    setInterval(() => {
      axios
        .get(`${publicUrl}/health`)
        .then(() => console.log(`💓 [Keep-Alive] Heartbeat 24/7 OK -> ${new Date().toISOString()}`))
        .catch(() => {});
    }, 9 * 60 * 1000);
  }
});

// Cierre elegante ante señales de Render (SIGTERM / SIGINT)
const gracefulShutdown = (signal: string) => {
  console.log(`🛑 [SecOps] Señal ${signal} recibida. Iniciando cierre elegante...`);
  server.close(() => {
    console.log('🚪 Servidor HTTP cerrado con seguridad.');
    // Cerrar sockets de Baileys limpiamente si existen
    try {
      BaileysManager.getInstance();
    } catch {}
    process.exit(0);
  });

  // Forzar salida si tarda más de 8 segundos
  setTimeout(() => {
    console.warn('⚠️ Cierre forzado por expiración de tiempo de espera.');
    process.exit(1);
  }, 8000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
