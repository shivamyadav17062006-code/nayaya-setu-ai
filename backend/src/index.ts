import 'dotenv/config';
import { createApp } from './app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bootstrap(): Promise<void> {
  // Verify database connectivity
  try {
    await prisma.$connect();
    console.log('✅  PostgreSQL connected via Prisma');
  } catch (err) {
    console.warn('⚠️  Database connection warning (will retry on query):', (err as any)?.message || err);
  }

  const app = createApp();
  const port = parseInt(process.env.PORT ?? '4000', 10);

  const server = app.listen(port, () => {
    console.log(`🚀  NyayaSaathi API running at http://localhost:${port}`);
    console.log(`🌍  Environment: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`🤖  AI Engine: ${process.env.AI_ENGINE_URL ?? 'http://localhost:8000'}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n📛  Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
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
