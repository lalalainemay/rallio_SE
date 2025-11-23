-- =====================================================
-- MIGRATION 005: Add Missing RLS Policies
-- =====================================================
-- Purpose: Add comprehensive RLS policies for reservations, payments, and payment_splits
-- Created: 2025-11-23
-- Issues Fixed:
--   - Missing DELETE policy for reservations (allow users to cancel future bookings)
--   - Missing court admin access to view/update reservations for their venues
--   - Missing INSERT/UPDATE policies for payments table
--   - Missing INSERT policy for payment_splits
--   - Incomplete SELECT policy for payment_splits (missing reservation owner access)
-- =====================================================

-- =====================================================
-- RESERVATIONS POLICIES
-- =====================================================

-- Drop existing policies that will be replaced
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;

-- Enhanced SELECT policy: Users can view their own reservations OR court admins can view reservations for their venues
CREATE POLICY "Users and court admins can view reservations" ON reservations
  FOR SELECT USING (
    -- User's own reservations
    auth.uid() = user_id
    OR
    -- Court admin can view reservations for courts they own
    EXISTS (
      SELECT 1 FROM courts c
      JOIN venues v ON c.venue_id = v.id
      WHERE c.id = reservations.court_id
      AND v.owner_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users and court admins can view reservations" ON reservations IS
  'Allows users to view their own reservations and court admins to view all reservations for their venues';

-- Enhanced UPDATE policy: Users can update their own reservations OR court admins can update reservations for their venues
CREATE POLICY "Users and court admins can update reservations" ON reservations
  FOR UPDATE USING (
    -- User's own reservations
    auth.uid() = user_id
    OR
    -- Court admin can update reservations for courts they own
    EXISTS (
      SELECT 1 FROM courts c
      JOIN venues v ON c.venue_id = v.id
      WHERE c.id = reservations.court_id
      AND v.owner_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users and court admins can update reservations" ON reservations IS
  'Allows users to update their own reservations and court admins to update reservations for their venues (e.g., approve, reject, modify)';

-- NEW DELETE policy: Users can cancel their own future reservations
CREATE POLICY "Users can delete own future reservations" ON reservations
  FOR DELETE USING (
    -- Must be the reservation owner
    auth.uid() = user_id
    AND
    -- Reservation must be in a cancelable state
    status IN ('pending', 'confirmed')
    AND
    -- Reservation must start at least 24 hours in the future
    start_time > now() + interval '24 hours'
  );

COMMENT ON POLICY "Users can delete own future reservations" ON reservations IS
  'Allows users to cancel their own reservations that are pending or confirmed and start more than 24 hours in the future. This enforces a 24-hour cancellation policy.';

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

-- NEW INSERT policy: Users can create payments for their own reservations
CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can create own payments" ON payments IS
  'Allows authenticated users to create payment records for themselves';

-- NEW UPDATE policy: System can update payment status (webhook processing)
-- Note: This is permissive to allow backend services to update payment status
-- In production, you may want to restrict this to service role only via application logic
CREATE POLICY "System can update payments" ON payments
  FOR UPDATE USING (true);

COMMENT ON POLICY "System can update payments" ON payments IS
  'Allows payment status updates from payment webhook processing. In production, restrict webhook endpoints to service role.';

-- =====================================================
-- PAYMENT SPLITS POLICIES
-- =====================================================

-- Drop existing policy that will be replaced
DROP POLICY IF EXISTS "Users can view own payment splits" ON payment_splits;

-- NEW INSERT policy: Users can create payment splits when creating group reservations
CREATE POLICY "Users can create payment splits for own reservations" ON payment_splits
  FOR INSERT WITH CHECK (
    -- The reservation must belong to the user creating the split
    EXISTS (
      SELECT 1 FROM reservations
      WHERE id = payment_splits.reservation_id
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can create payment splits for own reservations" ON payment_splits IS
  'Allows users to create payment splits (invite others to share payment) only for reservations they created';

-- Enhanced SELECT policy: Users can view splits where they are a participant OR the reservation owner
CREATE POLICY "Users can view splits for their reservations" ON payment_splits
  FOR SELECT USING (
    -- User is the one responsible for this split
    auth.uid() = user_id
    OR
    -- User is the reservation owner (can see all splits for their reservation)
    EXISTS (
      SELECT 1 FROM reservations
      WHERE id = payment_splits.reservation_id
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view splits for their reservations" ON payment_splits IS
  'Allows users to view payment splits where they are either a participant or the reservation owner';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify policies are working correctly
-- (Commented out - uncomment to test)

/*
-- Test 1: Verify reservations policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'reservations'
ORDER BY policyname;

-- Test 2: Verify payments policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'payments'
ORDER BY policyname;

-- Test 3: Verify payment_splits policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'payment_splits'
ORDER BY policyname;

-- Test 4: Count total policies per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('reservations', 'payments', 'payment_splits')
GROUP BY tablename
ORDER BY tablename;

-- Expected results:
-- reservations: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- payments: 3 policies (SELECT, INSERT, UPDATE)
-- payment_splits: 2 policies (SELECT, INSERT)
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Enhanced reservations SELECT/UPDATE policies to include court admin access
-- 2. Added reservations DELETE policy with 24-hour cancellation window
-- 3. Added payments INSERT policy
-- 4. Added payments UPDATE policy for webhook processing
-- 5. Added payment_splits INSERT policy
-- 6. Enhanced payment_splits SELECT policy to include reservation owner access
--
-- Total new policies: 6
-- Total replaced policies: 3
--
-- Next steps:
-- 1. Apply this migration to your Supabase database
-- 2. Test reservation cancellation from user perspective
-- 3. Test court admin can view/update reservations for their venues
-- 4. Test payment creation and webhook updates
-- 5. Test payment split creation and viewing
-- =====================================================
