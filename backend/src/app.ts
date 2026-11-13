import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { router } from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { isSupabaseConfigured, supabaseService } from './services/supabaseService';

export function createApp(): Application {
  const app = express();

  // ---- Security Headers ----
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
  }));

  // ---- CORS ----
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Accept-Language'],
  }));

  // ---- Body Parsing ----
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // ---- Compression ----
  app.use(compression());

  // ---- Request Logging ----
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // ---- Global Rate Limit ----
  const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many requests. Please try again later.',
    },
  });
  app.use('/api', globalLimiter);

  // ---- Stricter Rate Limit for Chat (AI calls are expensive) ----
  const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Chat rate limit exceeded. Please wait a moment.',
    },
  });
  app.use('/api/chat', chatLimiter);

  // ---- Health Check ----
  app.get('/health', async (_req, res) => {
    const supabaseConnected = isSupabaseConfigured ? await supabaseService.ping() : false;

    res.json({
      status: 'ok',
      service: 'nyayasaathi-backend',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      dependencies: {
        supabase: isSupabaseConfigured
          ? supabaseConnected
            ? 'connected'
            : 'configured-but-unreachable'
          : 'not-configured',
        aiEngine: process.env.AI_ENGINE_URL ?? 'http://localhost:8001',
      },
    });
  });

  // ---- API Routes ----
  app.use('/api', router);

  // ---- 404 Handler ----
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // ---- Global Error Handler ----
  app.use(errorHandler);

  return app;
}
