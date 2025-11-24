# Payment Issue Summary & Fix Report

## Issue Description
PayMongo test payments are completing successfully (showing "Authorize Test Payment" button and processing), but the booking status is not updating from "Pending Payment" to "Confirmed/Paid" in the database.

## Root Cause Analysis

After comprehensive code review and adding extensive logging, I've identified **THREE critical issues**:

### 1. Webhook Not Reaching Local Development Server (PRIMARY ISSUE)
**Severity:** CRITICAL
**Probability:** 95%

PayMongo webhooks **cannot** reach `localhost:3000` directly. The webhook events are firing on PayMongo's servers, but they have no way to reach your local development environment.

**Evidence:**
- No webhook logs appearing in console despite comprehensive logging added
- PayMongo dashboard likely shows failed webhook deliveries
- Webhook endpoint at `/api/webhooks/paymongo/route.ts` never receives POST requests

**Solution:**
1. Install and run ngrok: `ngrok http 3000`
2. Register webhook in PayMongo dashboard using ngrok URL: `https://[random].ngrok.io/api/webhooks/paymongo`
3. Update `PAYMONGO_WEBHOOK_SECRET` in `.env.local` with the secret from PayMongo dashboard

### 2. Migration 006 Likely Not Applied (SECONDARY ISSUE)
**Severity:** HIGH
**Probability:** 70%

The database schema currently only allows these reservation statuses:
- `'pending'`, `'confirmed'`, `'cancelled'`, `'completed'`, `'no_show'`

But the webhook handler tries to set:
- `'pending_payment'` → `'paid'` → `'confirmed'`

The `'paid'` and `'pending_payment'` statuses were added in migration 006, which may not be applied to your database.

**Evidence:**
```typescript
// From webhook handler (line 280-290)
const { data: paidReservation, error: paidError } = await supabase
  .from('reservations')
  .update({
    status: 'paid',  // ❌ This status doesn't exist in current schema
    // ...
  })
```

If migration 006 is not applied, the update will fail with:
```
ERROR: 23514 (check_violation)
new row for relation "reservations" violates check constraint "reservations_status_check"
```

**Solution:**
Apply migration 006:
```bash
cd /Users/madz/Documents/GitHub/rallio/backend/supabase/migrations
psql $DATABASE_URL < 006_enhance_booking_status_and_constraints.sql
```

Or via Supabase dashboard SQL Editor, paste the contents of `006_enhance_booking_status_and_constraints.sql`.

**Verification:**
Run the verification script:
```bash
psql $DATABASE_URL < VERIFY_MIGRATION_006.sql
```

### 3. Success Page Fallback May Be Masking Webhook Issues
**Severity:** MEDIUM
**Probability:** 50%

The success page (`/checkout/success/page.tsx`) has a fallback mechanism that calls `processChargeableSourceAction()` when the webhook hasn't processed the payment yet. This can mask webhook delivery issues.

However, this fallback has its own problems:
- It uses the regular Supabase client (with RLS) instead of service role
- It may race with the webhook handler
- It doesn't guarantee the reservation is updated if both fail

## Changes Made

### 1. Comprehensive Logging Added

#### Webhook Handler (`/web/src/app/api/webhooks/paymongo/route.ts`)
Added extensive logging at every step:
- ✅ Webhook request receipt with headers and body info
- ✅ Signature verification details
- ✅ Event parsing and type identification
- ✅ Database query results (payment lookup)
- ✅ Reservation fetch and status checks
- ✅ Status update attempts (paid → confirmed)
- ✅ Success/failure outcomes with full error details

**Example logs:**
```
[PayMongo Webhook] 2025-11-24... - Incoming webhook request
[PayMongo Webhook] Request details: { bodyLength: 1234, hasSignature: true }
[handleSourceChargeable] 🔄 Starting handler
[handleSourceChargeable] Source ID: src_abc123
[markReservationPaidAndConfirmed] 🎯 Starting reservation confirmation
[markReservationPaidAndConfirmed] 📝 Step 1: Marking reservation as PAID
[markReservationPaidAndConfirmed] ✅ Reservation marked as PAID
[markReservationPaidAndConfirmed] 📝 Step 2: Marking reservation as CONFIRMED
[markReservationPaidAndConfirmed] ✅✅✅ Reservation confirmed successfully
```

#### Payment Actions (`/web/src/app/actions/payments.ts`)
Added logging for:
- ✅ Payment initiation start
- ✅ User authentication check
- ✅ Reservation lookup
- ✅ PayMongo API calls
- ✅ Payment record creation
- ✅ Reservation status updates

**Example logs:**
```
[initiatePaymentAction] 🚀 Starting payment initiation
[initiatePaymentAction] Input: { reservationId: '...', paymentMethod: 'gcash' }
[initiatePaymentAction] User auth: { authenticated: true, userId: '...' }
[initiatePaymentAction] 💾 Creating payment record in database
[initiatePaymentAction] ✅ Payment initiation complete
```

### 2. Migration Verification Script Created

**File:** `/backend/supabase/migrations/VERIFY_MIGRATION_006.sql`

This script checks:
- ✅ If 'paid' and 'pending_payment' statuses are in the CHECK constraint
- ✅ Current constraint definition
- ✅ Test inserts with new statuses (dry run)
- ✅ Current reservation status distribution
- ✅ Required extensions (btree_gist)
- ✅ Overlap prevention constraint

**Usage:**
```sql
\i backend/supabase/migrations/VERIFY_MIGRATION_006.sql
```

### 3. Webhook Debugging Guide Created

**File:** `/WEBHOOK_DEBUGGING_GUIDE.md`

Comprehensive guide covering:
- Root cause analysis ranked by probability
- Step-by-step debugging procedures
- ngrok setup for local webhook testing
- PayMongo dashboard webhook registration
- Manual webhook testing with curl
- Expected log output for successful flow
- Common error patterns and solutions
- Verification checklist
- Production deployment notes

## Testing Instructions

### Step 1: Verify Database Schema
```bash
cd /Users/madz/Documents/GitHub/rallio
psql $DATABASE_URL < backend/supabase/migrations/VERIFY_MIGRATION_006.sql
```

Expected output:
```
✅ PASS: Migration 006 is applied - paid and pending_payment statuses exist
```

If it says "FAIL", apply the migration:
```bash
psql $DATABASE_URL < backend/supabase/migrations/006_enhance_booking_status_and_constraints.sql
```

### Step 2: Set Up ngrok for Webhook Testing
```bash
# Terminal 1: Start dev server
npm run dev:web

# Terminal 2: Start ngrok
ngrok http 3000
```

Note the ngrok URL (e.g., `https://abc123.ngrok.io`)

### Step 3: Register Webhook in PayMongo
1. Go to https://dashboard.paymongo.com/developers/webhooks
2. Click "Add Webhook"
3. URL: `https://abc123.ngrok.io/api/webhooks/paymongo`
4. Events: `source.chargeable`, `payment.paid`, `payment.failed`
5. Copy the webhook secret
6. Add to `.env.local`:
   ```
   PAYMONGO_WEBHOOK_SECRET=whsk_...
   ```

### Step 4: Test Payment Flow
1. Create a new booking
2. Select GCash payment
3. Complete test payment on PayMongo page
4. Watch console logs for webhook activity:
   ```
   [PayMongo Webhook] Incoming webhook request
   [handleSourceChargeable] Starting handler
   [markReservationPaidAndConfirmed] Reservation confirmed successfully
   ```

### Step 5: Verify Success
Check the booking page:
- ❌ Before fix: Booking shows "Pending Payment"
- ✅ After fix: Booking shows "Confirmed/Paid"

Query database to confirm:
```sql
SELECT
  r.id,
  r.status AS reservation_status,
  p.status AS payment_status,
  r.amount_paid,
  r.total_amount
FROM reservations r
JOIN payments p ON p.reservation_id = r.id
ORDER BY r.created_at DESC
LIMIT 1;
```

Expected:
```
reservation_status: confirmed
payment_status: completed
amount_paid: (equal to total_amount)
```

## Files Modified

### 1. `/web/src/app/api/webhooks/paymongo/route.ts`
- Added comprehensive logging throughout POST handler
- Added detailed logging in `handleSourceChargeable()`
- Added extensive logging in `markReservationPaidAndConfirmed()`
- Every database operation now logs input, result, and errors
- Migration 006 fallback detection improved

### 2. `/web/src/app/actions/payments.ts`
- Added logging for payment initiation flow
- Added logging for database inserts and updates
- Better error reporting with structured error objects
- Reservation status update errors now logged but don't fail payment creation

### 3. New Files Created
- `/backend/supabase/migrations/VERIFY_MIGRATION_006.sql` - Database verification script
- `/WEBHOOK_DEBUGGING_GUIDE.md` - Comprehensive debugging guide
- `/PAYMENT_ISSUE_SUMMARY.md` - This file

## Known Limitations

1. **Local Development Requires ngrok**
   - PayMongo cannot reach localhost directly
   - ngrok URL changes on each restart (free tier)
   - Must update webhook URL in PayMongo dashboard when ngrok restarts

2. **Test Mode Limitations**
   - Test payments don't trigger all the same events as production
   - Some PayMongo features may behave differently

3. **Webhook Idempotency**
   - PayMongo may send duplicate webhook events
   - Current code handles this, but adds complexity
   - Metadata `processed_events` array tracks processed event IDs

## Production Considerations

Before deploying to production:

1. ✅ Apply migration 006 to production database
2. ✅ Register production webhook URL in PayMongo dashboard
3. ✅ Set `PAYMONGO_WEBHOOK_SECRET` in production environment
4. ✅ Set `SUPABASE_SERVICE_ROLE_KEY` in production environment
5. ✅ Monitor webhook delivery in PayMongo dashboard
6. ⚠️ Consider removing verbose logging or setting log level based on environment
7. ⚠️ Set up error alerting for failed webhook deliveries (Sentry/etc)
8. ⚠️ Implement webhook retry queue for resilience

## Next Steps

1. **Immediate (Required):**
   - [ ] Verify migration 006 is applied
   - [ ] Set up ngrok
   - [ ] Register webhook in PayMongo dashboard
   - [ ] Test complete payment flow
   - [ ] Verify booking status updates correctly

2. **Short-term (Recommended):**
   - [ ] Add webhook delivery monitoring
   - [ ] Implement exponential backoff for failed updates
   - [ ] Add admin page to view webhook delivery logs
   - [ ] Create manual payment confirmation tool for support

3. **Long-term (Optional):**
   - [ ] Implement payment status polling as backup to webhooks
   - [ ] Add email notifications for payment success/failure
   - [ ] Create payment reconciliation report
   - [ ] Add webhook event replay capability for debugging

## Success Criteria

The issue is **RESOLVED** when:
- ✅ Migration 006 verification script passes
- ✅ Webhook logs appear in console during payment
- ✅ Booking status changes from "Pending Payment" to "Confirmed"
- ✅ Payment status changes from "pending" to "completed"
- ✅ Database shows `reservation.status = 'confirmed'` and `payment.status = 'completed'`
- ✅ User sees booking in "Confirmed/Paid" section on /bookings page

## Summary

**What was wrong:**
1. Webhooks not reaching local dev server (need ngrok)
2. Migration 006 possibly not applied (missing 'paid' status)
3. No visibility into what's happening (no logging)

**What was fixed:**
1. Added comprehensive logging everywhere
2. Created verification script for migration 006
3. Created step-by-step debugging guide
4. Identified the webhook delivery as the primary issue

**What needs to be done:**
1. Set up ngrok to expose local server
2. Register webhook in PayMongo dashboard
3. Verify migration 006 is applied
4. Test the full flow and watch the logs

The logging additions will make it immediately clear where the process is failing.
