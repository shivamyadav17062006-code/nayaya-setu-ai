import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Placeholder and URL validation detection
// ---------------------------------------------------------------------------

/**
 * Validates a PostgreSQL connection string for common configuration errors:
 * - Unreplaced placeholder tokens (e.g., [YOUR-PASSWORD])
 * - Reserved characters that require URL-encoding in passwords (@, #, $, %, etc.)
 * - Invalid protocol or missing components
 */
export function validateDatabaseUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, reason: 'missing', message: 'DATABASE_URL is not set.' };
  }

  const trimmed = url.trim();
  if (trimmed === '') {
    return { valid: false, reason: 'empty', message: 'DATABASE_URL is empty.' };
  }

  const PLACEHOLDER_TOKENS = [
    '[YOUR-PASSWORD]',
    '[PASSWORD]',
    '[YOUR-PROJECT-REF]',
    '<password>',
    'YOUR_PASSWORD',
    'your-password',
  ];

  for (const token of PLACEHOLDER_TOKENS) {
    if (trimmed.includes(token)) {
      return {
        valid: false,
        reason: 'placeholder',
        message: `DATABASE_URL contains placeholder token "${token}". Replace it with your actual Supabase database password.`,
      };
    }
  }

  if (!trimmed.startsWith('postgresql://') && !trimmed.startsWith('postgres://')) {
    return {
      valid: false,
      reason: 'invalid-protocol',
      message: 'DATABASE_URL must start with postgresql:// or postgres://.',
    };
  }

  // Check for unencoded brackets which trigger "invalid domain character" in URL parsers
  if (trimmed.includes('[') || trimmed.includes(']')) {
    return {
      valid: false,
      reason: 'invalid-brackets',
      message: 'DATABASE_URL contains bracket characters "[" or "]". If your password contains special characters, encode them using encodeURIComponent().',
    };
  }

  try {
    const parsed = new URL(trimmed);
    return {
      valid: true,
      reason: 'ok',
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: parsed.pathname.replace(/^\//, ''),
      username: parsed.username,
      hasSsl: parsed.searchParams.get('sslmode') || 'default',
    };
  } catch (err) {
    return {
      valid: false,
      reason: 'parse-error',
      message: `DATABASE_URL format is invalid: ${err.message}. Ensure password special characters are URL-encoded.`,
    };
  }
}

/**
 * Returns true if the DATABASE_URL contains an unfilled template token or invalid syntax.
 */
function isPlaceholderConnectionUrl(url) {
  const result = validateDatabaseUrl(url);
  return !result.valid;
}

// ---------------------------------------------------------------------------
// Singleton Prisma client
// ---------------------------------------------------------------------------

const rawDatabaseUrl = process.env.DATABASE_URL;

/** True when DATABASE_URL is a real, non-placeholder connection string. */
export const isPrismaConfigured = !isPlaceholderConnectionUrl(rawDatabaseUrl);

/** Summary of configuration state for diagnostics. */
export const prismaConfigStatus = isPrismaConfigured
  ? 'configured'
  : rawDatabaseUrl
  ? 'placeholder' // URL set but still has template tokens
  : 'missing';    // DATABASE_URL not set at all

function buildPrismaClient() {
  const logLevels =
    process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

  if (!isPrismaConfigured) {
    // Use a deliberately invalid local URL so Prisma never tries to connect.
    // All real queries will fail fast — caught by callers.
    return new PrismaClient({
      datasources: {
        db: { url: 'postgresql://unconfigured:unconfigured@localhost:5432/nyayasaathi_offline' },
      },
      log: ['error'],
    });
  }

  return new PrismaClient({ log: logLevels });
}

/**
 * Module-level singleton — reused across hot-reload cycles in development.
 * Uses globalThis to survive `--watch` restarts without opening duplicate connections.
 */
export const prisma =
  // @ts-ignore — globalThis key is intentional
  globalThis.__nyayasaathi_prisma ??
  // @ts-ignore
  (globalThis.__nyayasaathi_prisma = buildPrismaClient());

// ---------------------------------------------------------------------------
// Connection lifecycle helpers
// ---------------------------------------------------------------------------

/**
 * Verifies the database connection by running `SELECT 1`.
 * Never throws — always returns a typed status object.
 *
 * @returns {{ connected: boolean, status: string, message: string }}
 */
export async function checkPrismaConnection() {
  if (!isPrismaConfigured) {
    const val = validateDatabaseUrl(rawDatabaseUrl);
    return {
      connected: false,
      status: val.reason || prismaConfigStatus, // 'placeholder' | 'missing' | 'invalid-brackets'
      message: val.message,
    };
  }

  try {
    // Lightweight connectivity probe — does not read application data.
    await prisma.$queryRaw`SELECT 1 AS probe`;
    return {
      connected: true,
      status: 'connected',
      message: 'PostgreSQL reachable — Prisma session-mode pooler verified.',
    };
  } catch (err) {
    const raw = err?.message ?? String(err);

    // Classify the error so callers can give meaningful messages.
    let status = 'unreachable';
    if (/ECONNREFUSED|ETIMEDOUT|connect/.test(raw)) status = 'connection-refused';
    if (/SSL|certificate/.test(raw)) status = 'ssl-error';
    if (/password|authentication/.test(raw)) status = 'auth-error';
    if (/invalid.*url|parsing/i.test(raw)) status = 'invalid-url';

    return {
      connected: false,
      status,
      message: `PostgreSQL unreachable (${status}): ${raw.slice(0, 200)}`,
    };
  }
}

/**
 * Disconnects Prisma gracefully.
 * Safe to call during SIGTERM / SIGINT shutdown.
 */
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect errors during shutdown.
  }
}
