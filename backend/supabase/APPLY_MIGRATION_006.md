# Apply Migration 006 - Enhanced Reservation Status

## Quick Start

**Run this command from the project root:**

```bash
cd backend/supabase && npx supabase db push
```

This will apply migration 006 and any other pending migrations.

## What This Migration Does

Migration 006 enhances the reservation status lifecycle to properly track payment flow:

**Before (Original Schema):**
```
pending → confirmed
```

**After (Migration 006):**
```
pending_payment → pending → paid → confirmed
```

### New Status Values

- **pending_payment**: Reservation created, awaiting payment initiation
- **paid**: Payment successful, reservation being confirmed
- **confirmed**: Final confirmed status (unchanged)

### Changes Made

1. **Expands CHECK constraint** on reservations.status column
2. **Updates default status** to 'pending_payment'
3. **Migrates existing data**: All current 'pending' reservations become 'pending_payment'
4. **Updates exclusion constraint** to prevent double booking across all active statuses
5. **Refreshes validation triggers** to respect new status lifecycle
6. **Adds performance index** on (court_id, start_time, end_time, status)

## Manual Application (If CLI Not Available)

### Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your Rallio project
3. Click "SQL Editor" → "New Query"
4. Copy the entire contents of `/backend/supabase/migrations/006_enhance_booking_status_and_constraints.sql`
5. Paste into the SQL editor
6. Click "Run" or press Cmd/Ctrl + Enter
7. Verify success message

### Verification Query

After applying, run this to confirm:

```sql
-- Should return the new constraint with all status values
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'reservations_status_check';

-- Should show 'pending_payment' as default
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name = 'status';

-- Check if exclusion constraint was updated
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'no_overlapping_reservations';
```

Expected results:
- CHECK constraint includes: 'pending_payment', 'pending', 'paid', 'confirmed', 'cancelled', 'completed', 'no_show'
- Default status: 'pending_payment'
- Exclusion constraint: Covers court_id and time range for statuses: pending_payment, pending, paid, confirmed

## Impact on Existing Data

**Safe to apply:** Migration automatically migrates existing 'pending' reservations to 'pending_payment' status.

**No data loss:** All existing reservations remain valid with updated status values.

**Backward compatible:** Code has fallback logic for databases without this migration.

## Rollback (If Needed)

If you need to rollback this migration:

```sql
BEGIN;

-- Revert CHECK constraint
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));

-- Migrate new statuses back to old ones
UPDATE reservations SET status = 'confirmed' WHERE status = 'paid';
UPDATE reservations SET status = 'pending' WHERE status = 'pending_payment';

-- Revert default
ALTER TABLE reservations
  ALTER COLUMN status SET DEFAULT 'pending';

-- Revert exclusion constraint
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS no_overlapping_reservations;

ALTER TABLE reservations
  ADD CONSTRAINT no_overlapping_reservations
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (status IN ('pending', 'confirmed'));

COMMIT;
```

## Why This Migration Matters

Without migration 006:
- ❌ Webhook tries to set 'paid' status → CHECK constraint violation → falls back to 'confirmed' (works but less granular)
- ❌ Payment status tracking is binary (pending or confirmed)
- ❌ Can't distinguish between "payment initiated" and "awaiting payment"

With migration 006:
- ✅ Full payment lifecycle tracking
- ✅ Better analytics on payment flow
- ✅ Clearer reservation state management
- ✅ Webhook handler works optimally

## Files Modified by This Fix

1. `/web/src/app/api/webhooks/paymongo/route.ts` - Webhook handler with fallback logic
2. `/web/src/app/actions/payments.ts` - Payment initiation sets 'pending_payment'
3. `/web/src/app/actions/reservations.ts` - Conflict detection includes new statuses

All files are **backward compatible** and will work with or without migration 006 applied.
