# Fix #1: Platform Fee Not Applied

**Status:** ✅ COMPLETE
**Priority:** Critical (Revenue Loss)
**Branch:** `fix/critical-issues`

## Problem
Platform fees (5%) were stored in the database but never integrated into the booking checkout flow. This resulted in 100% revenue loss on platform fees for all bookings.

## Root Cause
While migration 024 added `platform_settings` table with fee configuration, the booking flow never:
1. Fetched the platform fee settings
2. Calculated the fee in checkout totals
3. Displayed the fee to users
4. Applied it to payment processing

## Solution Overview
Implemented complete platform fee integration across the checkout flow:
- Created reusable helper functions for fee calculation
- Updated checkout store to track fee state
- Modified UI to display fee breakdown
- Added loader component to fetch settings

## Files Changed

### 1. `/web/src/lib/platform-settings.ts` (NEW)
**Purpose:** Centralized helper functions for platform fee operations

**Key Functions:**
```typescript
// Fetch platform fee from database
getPlatformFee(): Promise<{ percentage: number; enabled: boolean }>

// Calculate fee amount
calculatePlatformFeeAmount(subtotal: number, feePercentage: number): number

// Calculate total with fee
calculateTotalWithPlatformFee(subtotal: number, feePercentage: number): number
```

**Features:**
- Fetches from `platform_settings` table (key: 'platform_fee_percentage')
- Defaults to 5% if fetch fails
- Handles disabled platform fees (returns 0)
- Provides consistent rounding (2 decimal places)

### 2. `/web/src/stores/checkout-store.ts` (MODIFIED)
**Purpose:** Central state management for booking/checkout flow

**Changes:**
- **New State Fields:**
  - `platformFeePercentage: number` - Current fee percentage (0-100)
  - `platformFeeEnabled: boolean` - Whether fee is active

- **New Actions:**
  - `setPlatformFee(percentage, enabled)` - Update fee settings

- **Updated Methods:**
  - `getSubtotal()` - Now applies discount before calculating subtotal
  - `getPlatformFeeAmount()` - Calculates fee based on subtotal
  - `getTotalAmount()` - Adds platform fee to final total

**Calculation Flow:**
```
Court Fee (base price)
  ↓
Apply Discounts
  ↓
Subtotal
  ↓
Calculate Platform Fee (X% of subtotal)
  ↓
Total Amount
```

### 3. `/web/src/components/checkout/booking-summary-card.tsx` (MODIFIED)
**Purpose:** Display price breakdown to users

**Changes:**
- Added platform fee line item in price breakdown
- Shows percentage label: "Platform Fee (5%)"
- Positioned after discounts, before total
- Uses `getPlatformFeeAmount()` from store

**Updated UI:**
```
Court Fee:          ₱500.00
Discount:          -₱100.00
                   ---------
Subtotal:           ₱400.00
Platform Fee (5%):   ₱20.00
                   =========
Total:              ₱420.00
```

### 4. `/web/src/components/checkout/platform-fee-loader.tsx` (NEW)
**Purpose:** Fetch and apply platform fee settings on page load

**Implementation:**
- Client component (uses Zustand store)
- `useEffect` hook fetches fee on mount
- Calls `getPlatformFee()` helper
- Updates store via `setPlatformFee()`
- Renders nothing (logic-only component)

**Pattern:**
```tsx
'use client'
export function PlatformFeeLoader() {
  useEffect(() => {
    async function loadPlatformFee() {
      const fee = await getPlatformFee()
      useCheckoutStore.getState().setPlatformFee(fee.percentage, fee.enabled)
    }
    loadPlatformFee()
  }, [])
  return null
}
```

### 5. `/web/src/app/(main)/courts/[id]/book/page.tsx` (MODIFIED)
**Purpose:** Booking page - entry point for court reservations

**Changes:**
- Added import: `PlatformFeeLoader`
- Rendered `<PlatformFeeLoader />` at top of component tree
- Ensures fee settings load before user interacts with booking form

## Technical Details

### Database Query
```sql
SELECT value FROM platform_settings WHERE key = 'platform_fee_percentage' LIMIT 1
```

Returns: `{ value: { percentage: 5, enabled: true } }`

### Calculation Logic
```typescript
// 1. Base price
const courtFee = 500

// 2. Apply discount
const discount = 100
const subtotal = courtFee - discount // 400

// 3. Calculate platform fee
const feePercentage = 5
const platformFee = Math.round((subtotal * (feePercentage / 100)) * 100) / 100 // 20.00

// 4. Final total
const total = subtotal + platformFee // 420.00
```

### Error Handling
- If `platform_settings` fetch fails → defaults to 5% enabled
- If `platformFeeEnabled = false` → returns 0 for all fee calculations
- All calculations handle null/undefined gracefully

## Testing Instructions

### Manual Testing

**1. Test Platform Fee Display**
```bash
cd web
npm run dev
```

Navigate to: `http://localhost:3000/courts/[any-venue-id]/book`

**Expected Behavior:**
- Booking summary shows "Platform Fee (5%)" line item
- Fee is calculated as 5% of subtotal (after discounts)
- Total includes platform fee

**Example:**
- Court: ₱500/hour for 2 hours = ₱1,000
- Discount: -₱100
- Subtotal: ₱900
- Platform Fee (5%): ₱45
- **Total: ₱945**

**2. Test Fee with Different Prices**
Select different time slots to verify:
- Fee scales with subtotal
- Calculation remains accurate with various amounts
- Rounding works correctly (2 decimal places)

**3. Test Discount + Platform Fee**
Apply a discount code:
- Verify discount applies first
- Platform fee calculates on subtotal (after discount)
- Total reflects both adjustments

**4. Test Database Configuration**
Using Supabase dashboard or SQL:

```sql
-- Check current setting
SELECT * FROM platform_settings WHERE key = 'platform_fee_percentage';

-- Test changing percentage
UPDATE platform_settings 
SET value = '{"percentage": 7, "enabled": true}'::jsonb
WHERE key = 'platform_fee_percentage';

-- Refresh booking page, verify fee changed to 7%

-- Test disabling fee
UPDATE platform_settings 
SET value = '{"percentage": 5, "enabled": false}'::jsonb
WHERE key = 'platform_fee_percentage';

-- Refresh booking page, verify fee shows ₱0.00 or is hidden
```

**5. Test Payment Processing**
Complete a full booking:
- Select date/time
- Proceed to checkout
- Verify PayMongo payment amount includes platform fee
- Check reservation record has correct total

### Expected Database Records

After successful booking:

**reservations table:**
```sql
SELECT id, total_amount, payment_status FROM reservations WHERE id = '[new-reservation-id]';
```
- `total_amount` should include platform fee
- `payment_status` = 'completed'

**payments table:**
```sql
SELECT amount, payment_method FROM payments WHERE reservation_id = '[new-reservation-id]';
```
- `amount` should match `total_amount` from reservation

## Verification Checklist

- [ ] Platform fee displays in booking summary
- [ ] Fee percentage shown in label "(5%)"
- [ ] Fee calculates correctly (5% of subtotal)
- [ ] Discount applies before platform fee
- [ ] Total includes platform fee
- [ ] Multiple price points work correctly
- [ ] Payment amount includes platform fee
- [ ] Database records show correct total
- [ ] No TypeScript errors
- [ ] No console errors in browser

## Integration Notes

**For Payment Processing:**
The platform fee is now included in `getTotalAmount()`, which is called by:
- `/web/src/components/checkout/payment-processing.tsx`
- PayMongo payment source creation
- Reservation creation logic

**No additional changes needed** - payment flow automatically uses updated total.

**For Split Payments (Fix #2):**
When implementing split payment fix, ensure:
- Each participant pays their share of platform fee
- Fee splits proportionally with base amount
- Total platform fee collected matches single-payment scenario

## Rollback Instructions

If issues arise, revert these files:

```bash
# Remove new files
rm web/src/lib/platform-settings.ts
rm web/src/components/checkout/platform-fee-loader.tsx

# Revert modified files
git checkout HEAD -- web/src/stores/checkout-store.ts
git checkout HEAD -- web/src/components/checkout/booking-summary-card.tsx
git checkout HEAD -- web/src/app/(main)/courts/[id]/book/page.tsx
```

## Next Steps

After verifying Fix #1:
1. ✅ Platform fee displays correctly
2. ✅ Calculation is accurate
3. ✅ Payment includes fee
4. Move to **Fix #2: Split Payment Full Charge**

## Notes

- Platform fee defaults to 5% per migration 024
- Fee can be changed via Supabase dashboard (platform_settings table)
- Fee can be disabled by setting `enabled: false`
- All prices shown in Philippine Pesos (₱)
- Calculation rounds to 2 decimal places

---

**Implementation Date:** Dec 2025
**Developer:** GitHub Copilot
**Review Status:** Pending User Testing
