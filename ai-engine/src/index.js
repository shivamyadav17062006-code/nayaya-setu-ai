import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { queryRouter } from './routes/query.js';
import { embedRouter } from './routes/embed.js';
import { searchRouter } from './routes/search.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(healthRouter);
app.use(queryRouter);
app.use(embedRouter);
app.use(searchRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ detail: `Route not found: ${req.method} ${req.path}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[AI Engine Error]', err);
  res.status(500).json({
    detail: err.message || 'Internal AI engine error',
  });
});

const server = app.listen(config.port, config.host, () => {
  console.log(`🚀 NyayaSaathi Node.js AI Engine running on http://${config.host}:${config.port}`);
  console.log(`   LLM Provider: ${config.llmProvider}`);
  console.log(`   Supabase: ${config.supabaseUrl}`);
});

const shutdown = (signal) => {
  console.log(`\n📛 [AI Engine] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ [AI Engine] Server closed. Goodbye!');
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

export default app;
