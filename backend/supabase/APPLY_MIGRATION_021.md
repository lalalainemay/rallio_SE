# Apply Migration 021

## Issue
Global admins cannot create or delete venues/courts due to missing RLS policies.

Error: `new row violates row-level security policy for table "venues"`

## Root Cause
Migration 019 only created SELECT and UPDATE policies for global admins, but not INSERT and DELETE policies.

## Solution
Apply migration 021 which adds:
- INSERT and DELETE policies for venues
- INSERT and DELETE policies for courts
- Full CRUD policies for amenities
- CRUD policies for court_amenities junction table

## Steps to Apply

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `021_global_admin_venue_court_insert_delete_policies.sql`
4. Paste and run the SQL
5. Verify success

### Option 2: Via Supabase CLI
```bash
cd backend
npx supabase db push
```

## Verification
After applying, test by:
1. Creating a new venue (should succeed)
2. Creating a court within a venue (should succeed)
3. Deleting a court (should succeed)
4. Deleting a venue (should succeed)

## Policies Added
- `Global admins can insert venues`
- `Global admins can delete venues`
- `Global admins can insert courts`
- `Global admins can delete courts`
- `Global admins view all amenities`
- `Global admins insert amenities`
- `Global admins update amenities`
- `Global admins delete amenities`
- `Global admins view court amenities`
- `Global admins insert court amenities`
- `Global admins delete court amenities`
