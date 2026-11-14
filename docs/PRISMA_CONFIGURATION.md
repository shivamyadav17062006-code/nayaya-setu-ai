# Prisma Configuration & Lifecycle Management — NyayaSaathi (न्यायसाथी)

This document details the configuration, connection management, schema mappings, and lifecycle safeguards for Prisma Client in the NyayaSaathi project.

---

## 1. Prisma Specifications

- **Prisma Version**: `5.22.0`
- **Client Package**: `@prisma/client@5.22.0`
- **Target Architecture**: `darwin-arm64` (macOS Apple Silicon)
- **Database Engine**: PostgreSQL 15+ with `pgvector` extension
- **Client Language**: Modern JavaScript ES Modules (`import`/`export`)

---

## 2. Datasource Configuration (`schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Why Both `url` and `directUrl`?
- **`url` (DATABASE_URL)**: Points to the Supabase Connection Pooler in Session mode (`aws-0-ap-south-1.pooler.supabase.com:5432`). It manages connection pooling for high-concurrency Node.js queries and ensures IPv4 compatibility for local development.
- **`directUrl` (DIRECT_URL)**: Used by Prisma CLI for schema discovery, migrations, and introspection (`prisma migrate`, `prisma db push`) which require a direct connection without pooler proxy overhead.

---

## 3. Singleton Client & Connection Lifecycle (`backend/src/lib/prisma.js`)

To prevent connection exhaustion and duplicate PrismaClient instances during hot-reloading in development (`node --watch`), NyayaSaathi uses a module-level singleton pattern bound to `globalThis`:

```javascript
import { PrismaClient } from '@prisma/client';

export const isPrismaConfigured = !isPlaceholderConnectionUrl(rawDatabaseUrl);

function buildPrismaClient() {
  const logLevels = process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

  if (!isPrismaConfigured) {
    // Deliberately offline dummy client that fails fast without DNS resolution
    return new PrismaClient({
      datasources: {
        db: { url: 'postgresql://unconfigured:unconfigured@localhost:5432/nyayasaathi_offline' },
      },
      log: ['error'],
    });
  }

  return new PrismaClient({ log: logLevels });
}

// Bound to globalThis to survive watch reloads
export const prisma =
  globalThis.__nyayasaathi_prisma ??
  (globalThis.__nyayasaathi_prisma = buildPrismaClient());
```

---

## 4. Connection Health Verification

The function `checkPrismaConnection()` performs a non-destructive ping against PostgreSQL:

```javascript
export async function checkPrismaConnection() {
  if (!isPrismaConfigured) {
    const val = validateDatabaseUrl(rawDatabaseUrl);
    return {
      connected: false,
      status: val.reason || prismaConfigStatus,
      message: val.message,
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1 AS probe`;
    return {
      connected: true,
      status: 'connected',
      message: 'PostgreSQL reachable — Prisma session-mode pooler verified.',
    };
  } catch (err) {
    const raw = err?.message ?? String(err);
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
```

---

## 5. Graceful Process Shutdown

During server termination (`SIGTERM` or `SIGINT`), Prisma connections must be cleanly disconnected to release pool slots in Supabase:

```javascript
// backend/src/index.js
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
```

---

## 6. Table & Field Name Conventions

To ensure zero friction between PostgreSQL naming standards (`snake_case`) and JavaScript object conventions (`camelCase`), all Prisma models use explicit mapping attributes:

- `@map("snake_case_column")` on individual fields.
- `@@map("snake_case_table")` on model definitions.
- `Unsupported("vector(384)")` for pgvector column in `LegalChunk`.

Example:
```prisma
model Conversation {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId String    @unique @map("session_id")
  userId    String?   @map("user_id") @db.Uuid
  user      User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  language  String    @default("en")
  messages  Message[]
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("conversations")
}
```

---

## 7. Operational Commandments

1. **Never run `prisma migrate reset`**: It destroys existing tables, schema triggers, and RPC functions in Supabase.
2. **Always validate schema before code generation**:
   ```bash
   npx prisma validate
   npx prisma generate
   ```
3. **Database schema authority**: All structural DDL is maintained in `supabase/schema.sql` and `supabase/migrations/`. Prisma schema reflects this truth.
