# Migration Application Guide

## Apply Migrations 021 and 022

### Migration 021: Global Admin RLS Policies
**Purpose**: Adds INSERT and DELETE policies for global admins on venues, courts, amenities, and court_amenities tables.

**File**: `/backend/supabase/migrations/021_global_admin_venue_court_insert_delete_policies.sql`

### Migration 022: Court Verification Workflow
**Purpose**: Adds `is_verified` column to courts and updates RLS policies so only verified courts are visible to public.

**File**: `/backend/supabase/migrations/022_add_court_verification.sql`

---

## Application Steps

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the contents of `021_global_admin_venue_court_insert_delete_policies.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Cmd+Enter / Ctrl+Enter)
8. ✅ Verify success message appears
9. Repeat steps 4-8 for `022_add_court_verification.sql`

### Option 2: Supabase CLI

```bash
# Navigate to backend directory
cd backend

# Ensure you're logged in
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push

# This will apply all pending migrations in order
```

### Option 3: Direct psql Connection

```bash
# Get your database connection string from Supabase Dashboard
# Settings → Database → Connection string

psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres"

# Then copy-paste each migration file contents
\i /path/to/021_global_admin_venue_court_insert_delete_policies.sql
\i /path/to/022_add_court_verification.sql
```

---

## Verification

After applying migrations, verify they were successful:

### Check Migration 021

```sql
-- List all policies on venues table
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'venues' AND policyname LIKE '%Global admins%';

-- Expected results:
-- - Global admins view all venues (SELECT)
-- - Global admins update venues (UPDATE)
-- - Global admins can insert venues (INSERT)
-- - Global admins can delete venues (DELETE)
```

### Check Migration 022

```sql
-- Verify is_verified column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'courts' AND column_name = 'is_verified';

-- Expected: is_verified | boolean | false

-- Check RLS policy
SELECT policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename = 'courts' AND policyname LIKE '%Verified courts%';

-- Expected: Verified courts are viewable by everyone (SELECT)

-- Verify indexes created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'courts' AND indexname LIKE '%verified%';

-- Expected: 
-- - idx_courts_is_verified
-- - idx_courts_venue_id_verified
```

---

## Rollback Instructions (If Needed)

### Rollback Migration 022

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_courts_is_verified;
DROP INDEX IF EXISTS idx_courts_venue_id_verified;

-- Remove new policy
DROP POLICY IF EXISTS "Verified courts are viewable by everyone" ON courts;

-- Restore old policies (if they existed)
-- Check your migration 001 or 013 for original policies

-- Remove column (CAUTION: This deletes data)
ALTER TABLE courts DROP COLUMN IF EXISTS is_verified;
```

### Rollback Migration 021

```sql
-- Remove INSERT policies
DROP POLICY IF EXISTS "Global admins can insert venues" ON venues;
DROP POLICY IF EXISTS "Global admins can insert courts" ON courts;

-- Remove DELETE policies  
DROP POLICY IF EXISTS "Global admins can delete venues" ON venues;
DROP POLICY IF EXISTS "Global admins can delete courts" ON courts;

-- Remove amenity policies
DROP POLICY IF EXISTS "Global admins view all amenities" ON amenities;
DROP POLICY IF EXISTS "Global admins insert amenities" ON amenities;
DROP POLICY IF EXISTS "Global admins update amenities" ON amenities;
DROP POLICY IF EXISTS "Global admins delete amenities" ON amenities;

-- Remove court_amenities policies
DROP POLICY IF EXISTS "Global admins view court amenities" ON court_amenities;
DROP POLICY IF EXISTS "Global admins insert court amenities" ON court_amenities;
DROP POLICY IF EXISTS "Global admins delete court amenities" ON court_amenities;
```

---

## Common Issues

### Issue 1: Permission Denied

**Error**: `permission denied for table venues`

**Solution**: 
- Ensure you're connected as the database owner or superuser
- Check that RLS is enabled: `ALTER TABLE venues ENABLE ROW LEVEL SECURITY;`

### Issue 2: Policy Already Exists

**Error**: `policy "..." for table "..." already exists`

**Solution**:
```sql
-- Drop the existing policy first
DROP POLICY IF EXISTS "policy_name" ON table_name;

-- Then re-run the migration
```

### Issue 3: Function has_role Not Found

**Error**: `function has_role(uuid, unknown) does not exist`

**Solution**: The `has_role` function should have been created in an earlier migration. Check migration 019:

```sql
-- Verify function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'has_role';

-- If missing, recreate it (from migration 019)
CREATE OR REPLACE FUNCTION has_role(user_id uuid, role_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = $1 AND r.name = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Issue 4: Existing Courts Don't Have is_verified

**Error**: `column "is_verified" of relation "courts" does not exist`

**Solution**: Ensure Migration 022 ran completely:

```sql
-- Add the column if missing
ALTER TABLE courts ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Set existing courts to verified (grandfather them in)
UPDATE courts SET is_verified = true WHERE is_verified IS NULL;
```

---

## Post-Migration Tasks

### 1. Restart Development Server

```bash
# Stop your dev server (Ctrl+C)
# Then restart
npm run dev
# or
yarn dev
```

### 2. Clear Browser Cache

- Open DevTools (F12)
- Right-click refresh button → "Empty Cache and Hard Reload"
- Or use incognito mode for testing

### 3. Verify User Roles

Ensure your test users have correct roles assigned:

```sql
-- Check global admin role assignment
SELECT p.email, r.name as role
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
JOIN roles r ON r.id = ur.role_id
WHERE r.name = 'global_admin';

-- If you need to assign global admin role to a user:
INSERT INTO user_roles (user_id, role_id)
SELECT 'USER_UUID', id FROM roles WHERE name = 'global_admin'
ON CONFLICT DO NOTHING;
```

### 4. Test Basic Functionality

```sql
-- As a global admin, test creating a venue
-- This should work after Migration 021
INSERT INTO venues (owner_id, name, city)
VALUES ('OWNER_UUID', 'Test Venue', 'Test City')
RETURNING id, name;

-- Test creating a court (should be unverified by default)
INSERT INTO courts (venue_id, name, court_type, capacity, hourly_rate)
VALUES ('VENUE_ID', 'Test Court', 'indoor', 10, 500)
RETURNING id, name, is_verified;

-- Expected is_verified: false

-- Clean up test data
DELETE FROM courts WHERE name = 'Test Court';
DELETE FROM venues WHERE name = 'Test Venue';
```

---

## Migration History Tracking

To keep track of applied migrations:

```sql
-- Check which migrations have been applied
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;

-- Manually record these migrations (if using manual application)
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES 
  ('021_global_admin_venue_court_insert_delete_policies'),
  ('022_add_court_verification')
ON CONFLICT DO NOTHING;
```

---

## Next Steps

After successful migration:

1. ✅ Run the test suite (see TESTING_VENUE_ENHANCEMENTS.md)
2. ✅ Test batch venue operations
3. ✅ Create an unverified court as court admin
4. ✅ Verify court as global admin
5. ✅ Check pending courts page shows correct data
6. ✅ Verify RLS policies work (unverified courts hidden from public)

---

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Review migration files for syntax errors
3. Verify database connection settings
4. Check that previous migrations (001-020) were applied successfully
5. Consult Supabase documentation: https://supabase.com/docs/guides/database

**Migrations Ready for Application! 🚀**
