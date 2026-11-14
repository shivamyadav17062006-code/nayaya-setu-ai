import { PrismaClient } from '@prisma/client';

/**
 * Helper to detect unconfigured placeholder patterns in database connection strings.
 */
function isPlaceholderConnectionUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  return (
    trimmed === '' ||
    trimmed.includes('[YOUR-PASSWORD]') ||
    trimmed.includes('[PASSWORD]') ||
    trimmed.includes('[YOUR-PROJECT-REF]') ||
    trimmed.includes('<password>') ||
    trimmed.includes('YOUR_PASSWORD') ||
    trimmed.includes('your-password')
  );
}

const rawDatabaseUrl = process.env.DATABASE_URL;

/**
 * Flag indicating whether DATABASE_URL is configured with a real connection string.
 */
export const isPrismaConfigured = !isPlaceholderConnectionUrl(rawDatabaseUrl);

function createPrismaClient() {
  if (!isPrismaConfigured) {
    return new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://postgres:unconfigured@localhost:5432/nyayasaathi_unconfigured',
        },
      },
      log: ['error'],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = global.__nyayasaathi_prisma || (global.__nyayasaathi_prisma = createPrismaClient());

/**
 * Test PostgreSQL connectivity via Prisma without throwing unhandled exceptions.
 */
export async function checkPrismaConnection() {
  if (!isPrismaConfigured) {
    return {
      connected: false,
      status: 'unconfigured',
      message: 'DATABASE_URL contains unreplaced placeholder or is not configured.',
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      status: 'connected',
      message: 'PostgreSQL connection verified via Prisma.',
    };
  } catch (err) {
    const errorMsg = err?.message || String(err);
    return {
      connected: false,
      status: 'unreachable',
      message: `Database unreachable: ${errorMsg.slice(0, 150)}`,
    };
  }
}
