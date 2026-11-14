# Migration Guide & Change Management — NyayaSaathi (न्यायसाथी)

This guide documents the canonical migration sequence, execution commands, non-destructive safety guarantees, and rollback procedures for the NyayaSaathi database.

---

## 1. Canonical Migration Sequence

All schema modifications are tracked as ordered, immutable SQL files located in [`supabase/migrations/`](file:///Users/vedanshsaini/Documents/Major_Project/nayaya-setu-ai/supabase/migrations):

```
supabase/migrations/
├── 20261114000000_schema_alignment_and_persistence.sql
└── 20261114000001_enable_app_persistence_and_chunks_rls.sql
```

### Migration Descriptions

#### Migration 1: `20261114000000_schema_alignment_and_persistence.sql`
- **Purpose**: Aligns core statutory knowledge tables and provisions missing application persistence tables.
- **Operations**:
  - Enables `vector` and `uuid-ossp` extensions.
  - Adds missing columns (`slug`, `icon`, `category`, `updated_at`) with non-destructive `IF NOT EXISTS`.
  - Creates baseline application persistence tables: `users`, `conversations`, `messages`, `legal_remedies`.
  - Creates 17 supporting B-tree performance indexes.
  - Enables Row Level Security (RLS) on persistence tables.
  - Notifies PostgREST (`NOTIFY pgrst, 'reload schema'`).

#### Migration 2: `20261114000001_enable_app_persistence_and_chunks_rls.sql`
- **Purpose**: Grants explicit RLS access policies for AI vector ingestion and session chat operations.
- **Operations**:
  - Grants `anon`, `authenticated`, and `service_role` write and select access to `legal_chunks`.
  - Grants public insert and select policies on `conversations` and `messages` for guest sessions.
  - Reloads PostgREST schema cache.

---

## 2. Execution Methods

> [!IMPORTANT]
> Never execute migrations automatically during CI or server startup. Always review SQL scripts before applying.

### Method A: Via Supabase Dashboard (Recommended for Managed Cloud)
1. Open your Supabase Dashboard: `https://supabase.com/dashboard/project/rmbfcfigiuyspsdutzov`
2. Navigate to **SQL Editor**.
3. Open and run the migration files in numerical order:
   - Run `20261114000000_schema_alignment_and_persistence.sql`
   - Run `20261114000001_enable_app_persistence_and_chunks_rls.sql`
4. Confirm success in the query results pane.

### Method B: Via Node.js Migration Verification Runner
From the repository root:
```bash
# Verify schema integrity without mutating data
node -e "
import fs from 'fs';
import('./backend/src/lib/prisma.js').then(async ({ prisma }) => {
  const sql = fs.readFileSync('./supabase/verify_schema.sql', 'utf8');
  await prisma.\$executeRawUnsafe(sql);
  console.log('✓ Verification script completed');
  await prisma.\$disconnect();
});
"
```

### Method C: Via Prisma Client Deploy (Direct Pooler)
```bash
cd backend
npx prisma migrate deploy
```

---

## 3. Non-Destructive Safety Rules

1. **No Data Deletion**:
   - Never run `prisma migrate reset` on shared or production databases.
   - Never issue `DROP TABLE` or `TRUNCATE` commands.
2. **Idempotency**:
   - All table creations use `CREATE TABLE IF NOT EXISTS`.
   - All column modifications use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
   - All index creations use `CREATE INDEX IF NOT EXISTS`.
3. **Data Preservation**:
   - Seed scripts must use `ON CONFLICT (id) DO UPDATE` or `upsert()` to preserve existing primary keys and foreign key references.
   - Anonymous chat sessions must be linked via `userId` updates, never deleted or recreated.

---

## 4. Rollback & Recovery Strategy

If an applied migration needs to be rolled back:

### 1. Reversing RLS Policy Changes
```sql
-- Re-apply restricted user-only policies
DROP POLICY IF EXISTS "Allow public insert conversations" ON conversations;
DROP POLICY IF EXISTS "Allow public select conversations" ON conversations;

CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### 2. Table Column Rollbacks
To preserve backward compatibility, never drop columns immediately. Deprecate the column at the application level before dropping.

### 3. PostgREST Cache Invalidation
Whenever schema or RLS policies change:
```sql
NOTIFY pgrst, 'reload schema';
```
