import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { router } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

import { fileURLToPath } from 'url';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount unified routes
  app.use(router);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ detail: `Route not found: ${req.method} ${req.path}` });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

const app = createApp();

// Start standalone server only when run directly from command line (not imported in test suites)
const isDirectExecution = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  const server = app.listen(env.port, env.host, () => {
    console.log(`🚀 NyayaSaathi Node.js AI Engine running on http://${env.host}:${env.port}`);
    console.log(`   LLM Provider: ${env.llmProvider} (Configured: ${env.isGeminiConfigured ? 'Gemini Live' : 'Statutory Mock'})`);
    console.log(`   Model: ${env.geminiModel}`);
    console.log(`   Supabase: ${env.supabaseUrl}`);
  });

  const shutdown = (signal) => {
    console.log(`\n📛 [AI Engine] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ [AI Engine] Server closed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('⚠️ [AI Engine] Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('💥 [AI Engine] Uncaught Exception:', err);
    process.exit(1);
  });
}

export default app;
