# Quick Fix Guide - Payment Status Not Updating

## TL;DR - The Fix in 5 Steps

### 1. Check if Migration 006 is Applied ⏱️ 2 minutes

Open Supabase SQL Editor and run:

```sql
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.check_constraints
      WHERE constraint_name = 'reservations_status_check'
        AND check_clause LIKE '%paid%'
    ) THEN '✅ Migration applied'
    ELSE '❌ Need to apply migration'
  END;
```

**If it says "Need to apply migration"**, run this in SQL Editor:

Open file: `backend/supabase/migrations/006_enhance_booking_status_and_constraints.sql`
Copy entire contents and paste into Supabase SQL Editor, then click Run.

### 2. Install ngrok ⏱️ 1 minute

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### 3. Start Dev Server + ngrok ⏱️ 1 minute

```bash
# Terminal 1: Start Next.js
npm run dev:web

# Terminal 2: Start ngrok
ngrok http 3000
```

Copy the ngrok URL that appears (looks like: `https://abc123.ngrok.io`)

### 4. Register Webhook in PayMongo ⏱️ 3 minutes

1. Go to: https://dashboard.paymongo.com/developers/webhooks
2. Click: **"Add Webhook"** or **"Create Webhook"**
3. Paste URL: `https://YOUR-NGROK-URL.ngrok.io/api/webhooks/paymongo`
   - Example: `https://abc123.ngrok.io/api/webhooks/paymongo`
4. Select events:
   - ✅ `source.chargeable`
   - ✅ `payment.paid`
   - ✅ `payment.failed`
5. Click **Save**
6. Copy the **Webhook Secret** (starts with `whsk_`)

### 5. Update Environment Variable ⏱️ 1 minute

Open `/web/.env.local` and update (or add):

```env
PAYMONGO_WEBHOOK_SECRET=whsk_YOUR_SECRET_HERE
```

**Restart your dev server** after updating .env.local:
- Press `Ctrl+C` in Terminal 1
- Run `npm run dev:web` again

## Test It Now!

1. Create a new booking
2. Select GCash payment
3. Click "Authorize Test Payment" on PayMongo page
4. Watch Terminal 1 for logs:

```
[PayMongo Webhook] Incoming webhook request ✅
[handleSourceChargeable] Starting handler ✅
[markReservationPaidAndConfirmed] Reservation confirmed ✅
```

5. Go to `/bookings` page
6. Your booking should now show as **"Confirmed/Paid"** 🎉

## If It Still Doesn't Work

Check Terminal 1 logs for errors:
- If you see `❌ Migration 006 NOT applied` → Go back to Step 1
- If you see `❌ Payment not found` → Wait 10 seconds and refresh the page
- If you see NO webhook logs at all → Check ngrok URL in PayMongo dashboard

## Verify Success

Run this in Supabase SQL Editor:

```sql
SELECT
  r.status AS reservation_status,
  p.status AS payment_status,
  r.created_at
FROM reservations r
JOIN payments p ON p.reservation_id = r.id
ORDER BY r.created_at DESC
LIMIT 1;
```

Expected result:
```
reservation_status: confirmed
payment_status: completed
```

## Important Notes

⚠️ **ngrok URL changes every time you restart it**
- If you close ngrok and reopen it, you'll get a new URL
- You must update the webhook URL in PayMongo dashboard each time
- Paid ngrok accounts keep the same URL

⚠️ **Keep both terminals running**
- Terminal 1: Next.js dev server
- Terminal 2: ngrok tunnel
- If either stops, webhooks won't work

⚠️ **Production Deployment**
- Replace ngrok URL with your production domain
- Keep PAYMONGO_WEBHOOK_SECRET in production environment variables

## Full Documentation

For detailed explanations, see:
- `/PAYMENT_ISSUE_SUMMARY.md` - Complete issue analysis and fixes
- `/WEBHOOK_DEBUGGING_GUIDE.md` - Comprehensive debugging steps
- `/backend/supabase/migrations/VERIFY_MIGRATION_006.sql` - Database verification

## Need Help?

1. Check the console logs - they're now very detailed
2. Read WEBHOOK_DEBUGGING_GUIDE.md for more solutions
3. Verify ngrok is running: `http://localhost:4040` (ngrok dashboard)
4. Check PayMongo webhook delivery status in dashboard
