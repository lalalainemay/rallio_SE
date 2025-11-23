# Payment Webhook Fix - Reservation Status Confirmation

## Problem Summary

**Issue:** Reservations stay in 'pending' or 'pending_payment' status even after successful PayMongo payment completion.

**Root Cause:** Database schema mismatch and missing migration application.

## Database Schema Status Analysis

### Original Schema (001_initial_schema_v2.sql)
```sql
-- Valid reservation statuses:
status varchar(20) NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'))
```

### Migration 006 (Enhancement - CREATED BUT NOT APPLIED)
```sql
-- Expanded reservation statuses to support payment flow:
status IN (
  'pending_payment',  -- NEW: Awaiting payment initiation
  'pending',          -- Existing: Payment initiated, awaiting confirmation
  'paid',            -- NEW: Payment successful, awaiting final confirmation
  'confirmed',        -- Existing: Booking confirmed and secured
  'cancelled',
  'completed',
  'no_show'
)
```

**Migration 006 Status:** File created on Nov 23, 2025 at 15:03, but **NOT YET APPLIED** to database.

## Solution Implemented

### Code Changes Made

1. **`/web/src/app/api/webhooks/paymongo/route.ts`** - Fixed webhook handler
   - Implements graceful fallback for databases without migration 006
   - Tries to set status to 'paid' first (if migration 006 applied)
   - Falls back to 'confirmed' if 'paid' status causes CHECK constraint violation (error code 23514)
   - Always ensures reservation reaches 'confirmed' status after successful payment
   - Enhanced logging for debugging payment flow

2. **`/web/src/app/actions/payments.ts`** - Payment initiation
   - Sets reservation status to 'pending_payment' when payment is initiated
   - Works with migration 006 schema

3. **`/web/src/app/actions/reservations.ts`** - Conflict detection
   - Checks for conflicts with all active statuses: 'pending_payment', 'pending', 'paid', 'confirmed'
   - Properly handles both schema versions

### Webhook Flow (After Fix)

```
PayMongo Payment Success
  ↓
webhook receives 'payment.paid' event
  ↓
Find payment record by external_id/source_id
  ↓
Update payment status to 'completed'
  ↓
Try: Set reservation status to 'paid' (migration 006)
  ↓ (if fails)
Fallback: Proceed to 'confirmed' directly
  ↓
Set reservation status to 'confirmed' ✅
  ↓
Update amount_paid field
  ↓
Revalidate /reservations and /bookings pages
```

## Required Action: Apply Migration 006

**CRITICAL:** To fully enable the payment status lifecycle, apply migration 006 to your database.

### Option A: Using Supabase CLI (Recommended)

```bash
cd /Users/madz/Documents/GitHub/rallio/backend/supabase
npx supabase db push
```

This will apply all pending migrations including 006.

### Option B: Using Supabase Dashboard SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your Rallio project
3. Click "SQL Editor" → "New Query"
4. Copy and paste the entire contents of `/backend/supabase/migrations/006_enhance_booking_status_and_constraints.sql`
5. Click "Run" (or Cmd/Ctrl + Enter)
6. Verify success - you should see "Success. 0 rows affected"

### Option C: Quick Apply Script

Run this from the project root:

```bash
# Copy migration 006 to a standalone file
cat backend/supabase/migrations/006_enhance_booking_status_and_constraints.sql > /tmp/apply_migration_006.sql

# Apply via Supabase CLI
npx supabase db execute --file /tmp/apply_migration_006.sql
```

## Verification Steps

### 1. Test the Payment Flow

1. Create a new court reservation
2. Initiate payment (GCash or Maya test mode)
3. Complete the payment in PayMongo
4. Check webhook logs for successful processing
5. Verify reservation status is 'confirmed' in database

```sql
-- Check reservation status
SELECT id, status, amount_paid, created_at, updated_at, metadata
FROM reservations
WHERE id = 'YOUR_RESERVATION_ID';

-- Check payment record
SELECT id, status, paid_at, metadata
FROM payments
WHERE reservation_id = 'YOUR_RESERVATION_ID';
```

### 2. Verify Migration 006 Applied

```sql
-- Check if 'paid' and 'pending_payment' are valid statuses
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'reservations_status_check';

-- Expected output should include:
-- 'pending_payment', 'pending', 'paid', 'confirmed', 'cancelled', 'completed', 'no_show'
```

### 3. Check Webhook Logs

Look for these log messages in your application logs:

**Success Indicators:**
- ✅ "Reservation confirmed successfully"
- ✅ "payment.paid webhook: Reservation confirmed"

**Warning Indicators (if migration 006 not applied):**
- ⚠️ "Migration 006 not applied - going directly to confirmed status"
- (This is OK - fallback will still work, but apply migration 006 for full lifecycle)

**Error Indicators (needs investigation):**
- 🔴 "CRITICAL: Failed to confirm reservation after payment"
- 🔴 "Failed to mark reservation as paid" (with error code other than 23514)

## Testing Checklist

- [ ] Apply migration 006 to database
- [ ] Create a test reservation
- [ ] Initiate payment with GCash (test mode)
- [ ] Complete payment in PayMongo checkout
- [ ] Verify webhook receives 'payment.paid' event
- [ ] Check reservation status changes from 'pending_payment' → 'paid' → 'confirmed'
- [ ] Verify amount_paid field is populated
- [ ] Check that reservation shows as confirmed in UI
- [ ] Test with Maya payment method as well
- [ ] Test idempotency (webhook called multiple times for same payment)

## Rollback Plan

If migration 006 causes issues, you can rollback:

```sql
BEGIN;

-- Revert status constraint to original
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));

-- Migrate any 'paid' or 'pending_payment' reservations back to valid statuses
UPDATE reservations SET status = 'confirmed' WHERE status = 'paid';
UPDATE reservations SET status = 'pending' WHERE status = 'pending_payment';

-- Revert default status
ALTER TABLE reservations
  ALTER COLUMN status SET DEFAULT 'pending';

COMMIT;
```

## Environment Variables Required

Ensure these are set in your `.env.local`:

```bash
# PayMongo
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxx
PAYMONGO_SECRET_KEY=sk_test_xxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxx

# Supabase (for webhook service client)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx (CRITICAL - for webhook)

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or production URL)
```

**CRITICAL:** The webhook handler uses `createServiceClient()` which requires `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS policies.

## PayMongo Webhook Configuration

Make sure your PayMongo webhook is configured to send events to:

**Development:** Use ngrok or similar tunnel service
```
https://your-ngrok-url.ngrok.io/api/webhooks/paymongo
```

**Production:**
```
https://your-domain.com/api/webhooks/paymongo
```

**Events to listen for:**
- [x] `source.chargeable` - When GCash/Maya QR code is scanned and ready to charge
- [x] `payment.paid` - When payment is successfully completed
- [x] `payment.failed` - When payment fails

## Summary

**What was fixed:**
1. Webhook handler now properly updates reservation status to 'confirmed' after payment
2. Graceful fallback for databases without migration 006
3. Enhanced error handling and logging
4. Idempotency protection to handle duplicate webhook events

**What needs to be done:**
1. Apply migration 006 to database (using one of the methods above)
2. Test payment flow end-to-end
3. Monitor webhook logs for successful confirmations

**Expected result after fix:**
- Reservations properly transition through payment lifecycle
- Payment completion triggers immediate reservation confirmation
- Users can see their confirmed bookings immediately after payment
- Double booking prevention works with all status values
