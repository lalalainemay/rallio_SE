# Webhook Diagnosis - Implementation Summary

**Date:** 2025-11-24
**Issue:** PayMongo webhooks not reaching server
**Status:** Diagnostic tools implemented, ready for testing

---

## Changes Made

### 1. Enhanced Webhook Route (`/web/src/app/api/webhooks/paymongo/route.ts`)

#### Added GET Health Check Endpoint
```typescript
export async function GET(request: NextRequest) {
  // Returns JSON with status info
  // Use: curl https://your-ngrok-url/api/webhooks/paymongo
}
```

**Purpose:** Verify webhook endpoint is publicly accessible

**Test:**
```bash
curl https://YOUR-NGROK-URL/api/webhooks/paymongo
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "PayMongo webhook endpoint is reachable",
  "timestamp": "2025-11-24T...",
  "endpoint": "/api/webhooks/paymongo",
  "methods": ["GET", "POST", "OPTIONS"],
  "environment": "development"
}
```

---

#### Added OPTIONS Handler (CORS Support)
```typescript
export async function OPTIONS(request: NextRequest) {
  // Returns 204 with CORS headers
  // Handles preflight requests from PayMongo
}
```

**Purpose:** Allow PayMongo to send cross-origin webhook requests

**CORS Headers Applied:**
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, paymongo-signature`

---

#### Enhanced POST Handler Logging

**Critical First Logs:**
```typescript
console.log('🚨🚨🚨 [PayMongo Webhook] POST REQUEST RECEIVED! 🚨🚨🚨')
console.log('🚨 [PayMongo Webhook] Timestamp:', timestamp)
console.log('🚨 [PayMongo Webhook] Request URL:', request.url)
console.log('🚨 [PayMongo Webhook] Request method:', request.method)
```

**Purpose:** Immediately confirm webhook arrival (before any processing)

**Diagnostic Checklist:**
```typescript
console.log('🔍 [Webhook Debug Checklist]')
console.log('  ✓ Endpoint reachable?', 'YES - this log confirms it')
console.log('  ✓ POST method?', request.method)
console.log('  ✓ Content-Type:', request.headers.get('content-type'))
console.log('  ✓ Has paymongo-signature?', request.headers.has('paymongo-signature'))
console.log('  ✓ Content-Length:', request.headers.get('content-length'))
console.log('  ✓ User-Agent:', request.headers.get('user-agent'))
console.log('  ✓ Origin:', request.headers.get('origin'))
console.log('  ✓ All headers:', Object.fromEntries(request.headers))
```

**Purpose:** Diagnose what data PayMongo is sending

---

#### Development Mode Signature Bypass

**Updated Function Signature:**
```typescript
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  isDevelopment: boolean = false
): boolean
```

**Behavior:**
- **Production:** Requires valid `PAYMONGO_WEBHOOK_SECRET` and signature verification
- **Development (no secret):** Bypasses signature verification with warning logs
- **Development (with secret):** Performs full verification

**Purpose:** Allow testing without webhook secret configured

**Warning Logs:**
```
⚠️ [verifyWebhookSignature] DEVELOPMENT MODE: No webhook secret configured
⚠️ [verifyWebhookSignature] Bypassing signature verification (UNSAFE for production)
```

---

#### Comprehensive Signature Verification Logging

**Added Logs:**
```typescript
console.log('🔐 [verifyWebhookSignature] Starting signature verification')
console.log('🔐 [verifyWebhookSignature] Has signature header?', !!signature)
console.log('🔐 [verifyWebhookSignature] Is development mode?', isDevelopment)
console.log('🔐 [verifyWebhookSignature] Has webhook secret?', !!webhookSecret)
console.log('🔐 [verifyWebhookSignature] Signature header format:', signature.substring(0, 50) + '...')
console.log('🔐 [verifyWebhookSignature] Parsed components:', { ... })
console.log('🔐 [verifyWebhookSignature] Signature comparison:', { ... })
console.log('✅ [verifyWebhookSignature] Signature validation result:', isValid)
```

**Purpose:** Debug signature verification failures step-by-step

---

#### Added CORS Headers to All Responses

**All responses now include CORS headers:**
- Success: `{ status: 200, headers: corsHeaders }`
- Unauthorized: `{ status: 401, headers: corsHeaders }`
- Server Error: `{ status: 500, headers: corsHeaders }`

**Purpose:** Prevent CORS-related webhook rejections

---

### 2. Testing Documentation

#### Created `WEBHOOK_TEST_INSTRUCTIONS.md`

**Sections:**
1. **Problem Statement** - Clear description of the issue
2. **Step 1: Verify Endpoint is Reachable** - Health check tests
3. **Step 2: Verify ngrok Forwarding** - ngrok web interface checks
4. **Step 3: Verify PayMongo Configuration** - Dashboard validation
5. **Step 4: Manual Webhook Test** - curl-based testing
6. **Step 5: End-to-End Payment Test** - Complete booking flow
7. **Step 6: Check Environment Variables** - Configuration validation
8. **Troubleshooting Flowchart** - Decision tree for diagnosis
9. **Expected Terminal Output** - What success looks like
10. **Quick Reference Commands** - Copy-paste commands
11. **Next Steps After Diagnosis** - What to do based on results

**Key Features:**
- Clear step-by-step instructions
- Visual indicators (✅ ❌ ⚠️)
- Code examples with expected output
- Troubleshooting decision tree
- Complete diagnostic checklist

---

#### Created `test-webhook.json`

**Sample PayMongo webhook payload:**
```json
{
  "data": {
    "id": "evt_test_manual_20251124",
    "type": "event",
    "attributes": {
      "type": "source.chargeable",
      "data": {
        "id": "src_test_manual_gcash",
        "type": "source",
        "attributes": {
          "status": "chargeable",
          "amount": 50000,
          "currency": "PHP",
          "type": "gcash"
        }
      }
    }
  }
}
```

**Usage:**
```bash
curl -X POST https://YOUR-NGROK-URL/api/webhooks/paymongo \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

**Purpose:** Manually trigger webhook processing without PayMongo

---

#### Created `test-webhook.sh`

**Automated test script that runs 3 tests:**

1. **Health Check (GET)**
   - Verifies endpoint is accessible
   - Checks HTTP 200 response

2. **Webhook POST**
   - Sends test payload
   - Verifies processing succeeds
   - Checks HTTP 200 response

3. **CORS Preflight (OPTIONS)**
   - Simulates browser preflight
   - Verifies CORS headers
   - Checks HTTP 204 response

**Usage:**
```bash
# Test localhost
./test-webhook.sh

# Test ngrok URL
./test-webhook.sh https://abc123.ngrok.io
```

**Features:**
- Color-coded output (green=pass, red=fail, yellow=warning)
- Detailed response logging
- Test summary with pass/fail indicators
- Next steps suggestions

---

## Testing Workflow

### Quick Test (5 minutes)

1. **Start dev server:**
   ```bash
   cd /Users/madz/Documents/GitHub/rallio
   npm run dev:web --workspace=web
   ```

2. **Run automated test:**
   ```bash
   ./test-webhook.sh http://localhost:3000
   ```

3. **Expected Output:**
   ```
   ✅ Health check passed (HTTP 200)
   ✅ Webhook POST succeeded (HTTP 200)
   ✅ CORS preflight succeeded (HTTP 204)
   ✅ All tests passed!
   ```

4. **Check terminal logs:**
   - Should see: `🚨🚨🚨 [PayMongo Webhook] POST REQUEST RECEIVED! 🚨🚨🚨`
   - Should see: `🔍 [Webhook Debug Checklist]`
   - Should see: `🔐 [verifyWebhookSignature] Starting signature verification`

---

### Full Integration Test (15 minutes)

1. **Start ngrok:**
   ```bash
   npx ngrok http 3000
   ```

2. **Note ngrok URL:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

3. **Update PayMongo webhook:**
   - Dashboard: https://dashboard.paymongo.com/
   - Developers → Webhooks
   - Update URL to: `https://abc123.ngrok.io/api/webhooks/paymongo`

4. **Test with script:**
   ```bash
   ./test-webhook.sh https://abc123.ngrok.io
   ```

5. **Create test booking:**
   - Navigate to http://localhost:3000
   - Find a court, create booking
   - Select GCash/Maya payment
   - Click "Proceed to Payment"
   - On PayMongo test page: "Authorize Test Payment"

6. **Monitor terminal:**
   - Watch for `🚨🚨🚨 [PayMongo Webhook] POST REQUEST RECEIVED!`
   - If you see this log, webhook is working!
   - If not, proceed to troubleshooting steps

7. **Check ngrok web interface:**
   - Open http://localhost:4040
   - Look for POST to `/api/webhooks/paymongo`
   - Check status code and response

---

## What You'll Learn

### If Webhook Logs Appear

**You'll see:**
```
🚨🚨🚨 [PayMongo Webhook] POST REQUEST RECEIVED! 🚨🚨🚨
🚨 [PayMongo Webhook] Timestamp: 2025-11-24T...
🔍 [Webhook Debug Checklist]
  ✓ Endpoint reachable? YES - this log confirms it
  ✓ POST method? POST
  ✓ Content-Type: application/json
  ✓ Has paymongo-signature? true
```

**Diagnosis:** Webhook is reaching server ✅

**Next:** Check if processing succeeds or fails
- Success: Look for `✅ Webhook processed successfully`
- Failure: Look for error logs and determine cause

---

### If Webhook Logs DON'T Appear

**Diagnosis:** Webhook NOT reaching server ❌

**Possible Causes:**

1. **ngrok URL mismatch**
   - Check PayMongo dashboard webhook URL
   - Compare with `ngrok http 3000` output
   - URLs must match EXACTLY

2. **ngrok not forwarding**
   - Check http://localhost:4040
   - Look for POST requests
   - If none, PayMongo isn't sending

3. **PayMongo not sending webhooks**
   - Check PayMongo dashboard webhook logs
   - Look for delivery failures
   - Check webhook event configuration

4. **Network/firewall blocking**
   - Test health check from external network
   - Try different ngrok region
   - Check firewall rules

---

## Expected Behavior Changes

### Before Changes
```
[initiatePaymentAction] ✅ Payment initiation complete
POST /checkout 200 in 1028ms
GET /checkout/success?reservation=... 200 in 306ms
[silence when payment authorized]
```

### After Changes (Webhook Arrives)
```
[initiatePaymentAction] ✅ Payment initiation complete
POST /checkout 200 in 1028ms

🚨🚨🚨 [PayMongo Webhook] POST REQUEST RECEIVED! 🚨🚨🚨
🚨 [PayMongo Webhook] Timestamp: 2025-11-24T12:34:56.789Z
🔍 [Webhook Debug Checklist]
  ✓ Endpoint reachable? YES - this log confirms it
  ✓ POST method? POST
  ✓ Content-Type: application/json
  ✓ Has paymongo-signature? true

🔐 [verifyWebhookSignature] Starting signature verification
⚠️ [verifyWebhookSignature] DEVELOPMENT MODE: Bypassing signature verification

[PayMongo Webhook] 📦 Event parsed: {
  eventType: 'source.chargeable',
  eventId: 'evt_...'
}

[PayMongo Webhook] 🔄 Handling source.chargeable event
[handleSourceChargeable] 🔄 Starting handler
[markReservationPaidAndConfirmed] 🎯 Starting reservation confirmation
[markReservationPaidAndConfirmed] ✅✅✅ Reservation confirmed successfully
[PayMongo Webhook] ✅ Webhook processed successfully

GET /checkout/success?reservation=... 200 in 306ms
```

---

## Files Modified

1. **`/web/src/app/api/webhooks/paymongo/route.ts`**
   - Added GET health check endpoint
   - Added OPTIONS CORS handler
   - Enhanced POST logging (critical first logs)
   - Development mode signature bypass
   - Comprehensive signature verification logging
   - CORS headers on all responses

---

## Files Created

1. **`WEBHOOK_TEST_INSTRUCTIONS.md`** (6 KB)
   - Complete testing guide
   - Troubleshooting steps
   - Expected outputs
   - Decision flowchart

2. **`test-webhook.json`** (500 bytes)
   - Sample PayMongo webhook payload
   - For manual curl testing

3. **`test-webhook.sh`** (3 KB)
   - Automated test script
   - 3 tests: health, webhook, CORS
   - Color-coded output
   - Executable (`chmod +x`)

4. **`WEBHOOK_DIAGNOSIS_SUMMARY.md`** (this file)
   - Implementation summary
   - Testing workflow
   - Expected behaviors

---

## Next Actions (Priority Order)

### 1. Immediate Test (5 min)
```bash
# Start dev server
npm run dev:web --workspace=web

# In another terminal, run test
./test-webhook.sh http://localhost:3000
```

**Expected:** All 3 tests pass, webhook logs appear in dev server

---

### 2. ngrok Integration Test (10 min)
```bash
# Start ngrok
npx ngrok http 3000

# Test with ngrok URL
./test-webhook.sh https://YOUR-NGROK-URL
```

**Expected:** All 3 tests pass with ngrok URL

---

### 3. Update PayMongo Dashboard (2 min)
1. Log into https://dashboard.paymongo.com/
2. Developers → Webhooks
3. Update webhook URL to ngrok URL
4. Verify events: `source.chargeable`, `payment.paid`, `payment.failed`

---

### 4. End-to-End Payment Test (5 min)
1. Create a booking
2. Select payment method
3. Click "Proceed to Payment"
4. On PayMongo test page: "Authorize Test Payment"
5. **Watch terminal for webhook logs**

**Success Indicators:**
- ✅ See `🚨🚨🚨 [PayMongo Webhook] POST REQUEST RECEIVED!`
- ✅ See `✅ Webhook processed successfully`
- ✅ Reservation status becomes 'confirmed'
- ✅ User redirected to success page

---

### 5. If Webhooks Still Don't Arrive

**Check ngrok web interface:**
```bash
# Open in browser
open http://localhost:4040
```

**Look for:**
- POST requests to `/api/webhooks/paymongo`
- Status codes (200, 401, 404, 500?)
- Request/response details

**Check PayMongo dashboard:**
- Webhook delivery logs
- Failed delivery attempts
- Error messages from PayMongo

**Follow `WEBHOOK_TEST_INSTRUCTIONS.md`:**
- Complete troubleshooting flowchart
- Step-by-step diagnosis
- Network vs. code issue determination

---

## Success Criteria

You'll know the issue is RESOLVED when:

1. ✅ Health check endpoint returns 200 OK
2. ✅ Test script shows all 3 tests passing
3. ✅ Terminal shows `🚨🚨🚨 [PayMongo Webhook] POST REQUEST RECEIVED!` when payment authorized
4. ✅ Webhook processes without errors
5. ✅ Reservation status changes to 'confirmed'
6. ✅ User sees success page with booking details
7. ✅ ngrok web interface shows 200 OK responses to webhook endpoint

---

## Diagnostic Output Interpretation

### Scenario A: Local Test Passes, ngrok Test Fails
**Diagnosis:** Network/ngrok issue, not code issue

**Fixes:**
- Restart ngrok
- Try different ngrok region
- Check ngrok account status (free tier limits?)
- Verify no firewall blocking ngrok

---

### Scenario B: Both Tests Fail
**Diagnosis:** Code/configuration issue

**Fixes:**
- Check Next.js route file exists at correct path
- Verify no TypeScript errors
- Restart dev server
- Check port 3000 not in use by another process

---

### Scenario C: Tests Pass, PayMongo Webhooks Don't Arrive
**Diagnosis:** PayMongo configuration issue

**Fixes:**
- Verify webhook URL in dashboard matches ngrok URL exactly
- Check webhook events include required types
- Check PayMongo dashboard for delivery failures
- Contact PayMongo support with diagnostic data

---

### Scenario D: Webhooks Arrive But Fail Processing
**Diagnosis:** Business logic issue (progress!)

**Fixes:**
- Check database connection
- Verify RLS policies allow service role
- Check migration 006 status
- Review error logs for specific failure point

---

## Environment Variables Checklist

### Required for Development
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxx
PAYMONGO_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional for Development
```bash
# Not required in dev mode - signature verification bypassed
PAYMONGO_WEBHOOK_SECRET=whsk_xxx
```

### Required for Production
```bash
# All of the above PLUS:
PAYMONGO_WEBHOOK_SECRET=whsk_xxx  # REQUIRED in production
NODE_ENV=production
```

---

## Rollback Instructions

If these changes cause issues:

```bash
# Restore original webhook route
git checkout HEAD -- web/src/app/api/webhooks/paymongo/route.ts

# Remove test files
rm test-webhook.json test-webhook.sh
rm WEBHOOK_TEST_INSTRUCTIONS.md WEBHOOK_DIAGNOSIS_SUMMARY.md

# Restart dev server
npm run dev:web --workspace=web
```

---

## Contact & Support

**If you need help:**
1. Collect diagnostic logs (see WEBHOOK_TEST_INSTRUCTIONS.md)
2. Run `./test-webhook.sh` and save output
3. Check ngrok web interface (http://localhost:4040)
4. Check PayMongo dashboard webhook logs
5. Provide all of above when asking for help

**PayMongo Support:**
- Docs: https://developers.paymongo.com/docs
- Support: https://developers.paymongo.com/docs/support

---

## Implementation Complete ✅

All diagnostic tools are now in place. The next time you:
1. Create a booking
2. Proceed to payment
3. Click "Authorize Test Payment"

You will DEFINITIVELY know:
- ✅ Whether webhook reached server (logs will show immediately)
- ❌ If webhook didn't reach server (check ngrok interface & PayMongo dashboard)

This is a **network vs. code issue determination**. The logs will tell you exactly where the problem is.

Good luck with testing! 🚀
