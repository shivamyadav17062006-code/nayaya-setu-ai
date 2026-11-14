import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // fallback to current working directory

import { createApp } from './app.js';
import { checkPrismaConnection, disconnectPrisma } from './lib/prisma.js';

async function bootstrap() {
  try {
    const dbCheck = await checkPrismaConnection();
    if (dbCheck.connected) {
      console.log('✅  PostgreSQL connected via Prisma');
    } else {
      console.warn(`⚠️  Database status: ${dbCheck.message}`);
    }
  } catch (err) {
    console.warn('⚠️  Database connection warning (will retry on query):', err?.message || err);
  }

  const app = createApp();
  const port = parseInt(process.env.PORT ?? '8000', 10);
  const aiEngineUrl = process.env.AI_ENGINE_URL ?? 'http://localhost:8001';

  const server = app.listen(port, () => {
    console.log(`🚀  NyayaSaathi API running at http://localhost:${port}`);
    console.log(`🌍  Environment: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`🤖  AI Engine: ${aiEngineUrl}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n📛  Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await disconnectPrisma();
      } catch {}
      console.log('✅  Database disconnected. Goodbye!');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('⚠️  Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('💥  Uncaught Exception:', err);
    process.exit(1);
  });
}

bootstrap();
