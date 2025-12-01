# Apply Migration 024 - Platform Settings

## Quick Start

This migration creates the platform_settings table with configurable platform-wide settings.

---

## Apply Migration

### Via Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `backend/supabase/migrations/024_platform_settings.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Verify success message appears

---

## What This Migration Does

1. **Creates `platform_settings` table** with JSONB schema for flexibility
2. **Inserts 6 default settings**:
   - `platform_fee`: 5% service fee (configurable)
   - `terms_and_conditions`: Default terms with Markdown
   - `refund_policy`: Default refund policy with Markdown
   - `general_settings`: Platform name, contact info, maintenance mode
   - `notification_settings`: Email, SMS, push notification toggles
   - `payment_settings`: Currency, payment methods, booking limits
3. **Creates indexes** for performance on `setting_key` and `is_public`
4. **Adds RLS policies**:
   - Global admins can view/update all settings
   - Public can view legal documents (terms, refund policy)
5. **Creates trigger** to auto-update `updated_at` timestamp

---

## Verification

After applying the migration, run these queries:

### 1. Check table exists
```sql
SELECT * FROM platform_settings;
```
**Expected:** 6 rows (platform_fee, terms_and_conditions, refund_policy, general_settings, notification_settings, payment_settings)

### 2. Check default platform fee
```sql
SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_fee';
```
**Expected:** `{"percentage": 5, "enabled": true, "description": "..."}`

### 3. Check RLS policies
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'platform_settings';
```
**Expected:** 4 policies (view all, view public, update, insert)

---

## Test the Settings Interface

### 1. Access Settings Page
- Navigate to `/admin/settings` as global admin
- Should see 5 tabs: General, Fees, Legal, Notifications, Payment

### 2. Test Platform Fee
- Go to "Platform Fees" tab
- Current percentage should be 5%
- Toggle enable/disable
- Change percentage
- Click "Save Platform Fee"
- Verify success message

### 3. Test Terms and Conditions
- Go to "Legal" tab
- See default terms in Markdown editor
- Make a small edit
- Click "Save Terms and Conditions"
- Visit `/terms` to verify changes appear

### 4. Test Refund Policy
- Still in "Legal" tab
- See default refund policy in Markdown editor
- Make a small edit
- Click "Save Refund Policy"
- Visit `/refund-policy` to verify changes appear

### 5. Test Public Access
- Open `/terms` in incognito/private window (no login)
- Should see terms and conditions
- Open `/refund-policy` in incognito/private window
- Should see refund policy
- Both should show "Last updated" date

---

## Integration with Booking System

The platform fee needs to be integrated into the booking flow. Here's how:

### 1. Import the Fee Calculator
```typescript
import { calculatePlatformFee } from '@/app/actions/global-admin-settings-actions'
```

### 2. Calculate Fee in Booking Flow
```typescript
// When user selects court and time
const courtPrice = 500 // Court hourly rate
const hours = 2
const subtotal = courtPrice * hours // 1000

// Calculate platform fee
const feeResult = await calculatePlatformFee(subtotal)

if (feeResult.success) {
  const { platformFee, total, feePercentage } = feeResult
  // Display breakdown:
  // Court Fee: ₱1,000.00
  // Platform Fee: ₱50.00 (5%)
  // Total: ₱1,050.00
}
```

### 3. Display Fee Breakdown
```tsx
<div className="space-y-2">
  <div className="flex justify-between">
    <span>Court Booking Fee</span>
    <span>₱{subtotal.toFixed(2)}</span>
  </div>
  <div className="flex justify-between text-sm text-gray-600">
    <span>Platform Service Fee ({feePercentage}%)</span>
    <span>₱{platformFee.toFixed(2)}</span>
  </div>
  <div className="border-t pt-2 flex justify-between font-semibold">
    <span>Total Amount</span>
    <span>₱{total.toFixed(2)}</span>
  </div>
</div>
```

### 4. Update Reservation Creation
```typescript
// When creating reservation
const reservation = {
  court_id,
  user_id,
  start_time,
  end_time,
  subtotal: subtotal,
  platform_fee: platformFee,
  total_amount: total,
  status: 'pending'
}
```

---

## Rollback (If Needed)

If you need to undo this migration:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS platform_settings_updated_at ON platform_settings;
DROP FUNCTION IF EXISTS update_platform_settings_timestamp();

-- Drop policies
DROP POLICY IF EXISTS "Global admins can view all settings" ON platform_settings;
DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON platform_settings;
DROP POLICY IF EXISTS "Global admins can update settings" ON platform_settings;
DROP POLICY IF EXISTS "Global admins can insert settings" ON platform_settings;

-- Drop indexes
DROP INDEX IF EXISTS idx_platform_settings_key;
DROP INDEX IF EXISTS idx_platform_settings_public;

-- Drop table
DROP TABLE IF EXISTS platform_settings;
```

---

## Next Steps

1. ✅ Apply migration
2. ✅ Verify table and data created
3. ✅ Test settings UI at `/admin/settings`
4. ✅ Test public pages at `/terms` and `/refund-policy`
5. ⏳ Integrate `calculatePlatformFee()` into booking flow
6. ⏳ Update reservation schema to store platform_fee amount
7. ⏳ Update booking UI to display fee breakdown
8. ⏳ Link to `/terms` and `/refund-policy` in footer/booking pages

---

## Common Issues

### Issue: "relation platform_settings does not exist"

**Cause:** Migration not applied

**Solution:** Run the migration SQL in Supabase Dashboard SQL Editor

### Issue: Settings page shows "Failed to load settings"

**Cause:** User doesn't have global_admin role

**Solution:** 
```sql
-- Grant global_admin role
INSERT INTO user_roles (user_id, role_id)
SELECT 'YOUR_USER_ID', id FROM roles WHERE name = 'global_admin';
```

### Issue: Public pages show empty content

**Cause:** Default settings not inserted

**Solution:** Re-run the INSERT statements from migration:
```sql
INSERT INTO platform_settings (setting_key, setting_value, description, is_public) VALUES ...
```

### Issue: ReactMarkdown not rendering

**Cause:** Missing dependency

**Solution:**
```bash
npm install react-markdown
# or
yarn add react-markdown
```

---

## Summary

**Migration:** 024_platform_settings.sql

**Tables Created:**
- `platform_settings` (6 default settings preloaded)

**RLS Policies:** 4 policies (admin full access, public read for legal docs)

**UI Pages:**
- `/admin/settings` (admin dashboard - 5 tabs)
- `/terms` (public terms and conditions)
- `/refund-policy` (public refund policy)

**Server Actions:** 9 functions for settings management and fee calculation

**Estimated Time:** < 2 minutes

**Downtime Required:** None

**Safe to Apply:** Yes (uses CREATE IF NOT EXISTS)
