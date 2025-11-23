-- =====================================================
-- Migration Verification Script
-- =====================================================
-- Purpose: Verify that migrations 004 and 005 have been applied correctly
-- How to use: Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- SECTION 1: Verify Migration 004 Applied
-- =====================================================

-- Check if btree_gist extension is enabled (required for exclusion constraint)
SELECT
  extname as extension_name,
  extversion as version,
  'MIGRATION 004 - Extension' as check_type,
  CASE
    WHEN extname = 'btree_gist' THEN 'PASS: btree_gist extension installed'
    ELSE 'FAIL: Extension missing'
  END as status
FROM pg_extension
WHERE extname = 'btree_gist';

-- Check if exclusion constraint exists on reservations table
SELECT
  conname as constraint_name,
  'MIGRATION 004 - Constraint' as check_type,
  CASE
    WHEN conname = 'no_overlapping_reservations' THEN 'PASS: Exclusion constraint exists'
    ELSE 'FAIL: Constraint missing'
  END as status,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'reservations'::regclass
  AND conname = 'no_overlapping_reservations';

-- Check if expire_old_payments function exists
SELECT
  proname as function_name,
  'MIGRATION 004 - Function' as check_type,
  CASE
    WHEN proname = 'expire_old_payments' THEN 'PASS: Payment expiration function exists'
    ELSE 'FAIL: Function missing'
  END as status
FROM pg_proc
WHERE proname = 'expire_old_payments';

-- Check if required indexes exist
SELECT
  indexname,
  'MIGRATION 004 - Indexes' as check_type,
  CASE
    WHEN indexname IN (
      'idx_payments_pending_created',
      'idx_payments_status_expires',
      'idx_reservations_court_time_status'
    ) THEN 'PASS: Index exists'
    ELSE 'UNKNOWN'
  END as status,
  indexdef
FROM pg_indexes
WHERE indexname IN (
  'idx_payments_pending_created',
  'idx_payments_status_expires',
  'idx_reservations_court_time_status'
);

-- Check if validation triggers exist
SELECT
  trigger_name,
  event_object_table,
  'MIGRATION 004 - Triggers' as check_type,
  CASE
    WHEN trigger_name IN (
      'validate_no_overlap_before_insert',
      'validate_no_overlap_before_update'
    ) THEN 'PASS: Validation trigger exists'
    ELSE 'UNKNOWN'
  END as status
FROM information_schema.triggers
WHERE trigger_name IN (
  'validate_no_overlap_before_insert',
  'validate_no_overlap_before_update'
);

-- Check if views exist
SELECT
  table_name,
  'MIGRATION 004 - Views' as check_type,
  CASE
    WHEN table_name IN ('active_reservations', 'payment_summary')
    THEN 'PASS: View exists'
    ELSE 'UNKNOWN'
  END as status
FROM information_schema.views
WHERE table_name IN ('active_reservations', 'payment_summary');

-- =====================================================
-- SECTION 2: Verify Migration 005 Applied
-- =====================================================

-- Check reservations policies
SELECT
  policyname,
  tablename,
  'MIGRATION 005 - Reservations Policies' as check_type,
  CASE
    WHEN policyname IN (
      'Users and court admins can view reservations',
      'Users and court admins can update reservations',
      'Users can delete own future reservations'
    ) THEN 'PASS: Policy exists'
    ELSE 'UNKNOWN'
  END as status,
  cmd as operation
FROM pg_policies
WHERE tablename = 'reservations'
ORDER BY policyname;

-- Check payments policies
SELECT
  policyname,
  tablename,
  'MIGRATION 005 - Payments Policies' as check_type,
  CASE
    WHEN policyname IN (
      'Users can create own payments',
      'System can update payments'
    ) THEN 'PASS: Policy exists'
    ELSE 'UNKNOWN'
  END as status,
  cmd as operation
FROM pg_policies
WHERE tablename = 'payments'
ORDER BY policyname;

-- Check payment_splits policies
SELECT
  policyname,
  tablename,
  'MIGRATION 005 - Payment Splits Policies' as check_type,
  CASE
    WHEN policyname IN (
      'Users can create payment splits for own reservations',
      'Users can view splits for their reservations'
    ) THEN 'PASS: Policy exists'
    ELSE 'UNKNOWN'
  END as status,
  cmd as operation
FROM pg_policies
WHERE tablename = 'payment_splits'
ORDER BY policyname;

-- =====================================================
-- SECTION 3: Policy Count Summary
-- =====================================================

SELECT
  tablename,
  COUNT(*) as policy_count,
  'Policy Count Summary' as check_type,
  CASE
    WHEN tablename = 'reservations' AND COUNT(*) >= 4 THEN 'PASS: All reservation policies exist'
    WHEN tablename = 'payments' AND COUNT(*) >= 2 THEN 'PASS: Payment policies exist'
    WHEN tablename = 'payment_splits' AND COUNT(*) >= 2 THEN 'PASS: Payment split policies exist'
    ELSE 'WARN: Check policy count'
  END as status
FROM pg_policies
WHERE tablename IN ('reservations', 'payments', 'payment_splits')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- SECTION 4: Data Integrity Checks
-- =====================================================

-- Check for any existing overlapping reservations (there should be none)
SELECT
  COUNT(*) as overlap_count,
  'Data Integrity - Overlaps' as check_type,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: No overlapping reservations found'
    ELSE 'WARN: Found overlapping reservations - may need cleanup'
  END as status
FROM reservations r1
JOIN reservations r2 ON
  r1.court_id = r2.court_id
  AND r1.id < r2.id
  AND r1.status IN ('pending', 'confirmed')
  AND r2.status IN ('pending', 'confirmed')
  AND tstzrange(r1.start_time, r1.end_time) && tstzrange(r2.start_time, r2.end_time);

-- =====================================================
-- EXPECTED RESULTS SUMMARY
-- =====================================================
-- Migration 004:
--   - btree_gist extension: INSTALLED
--   - no_overlapping_reservations constraint: EXISTS
--   - expire_old_payments function: EXISTS
--   - 3 indexes: ALL EXIST
--   - 2 validation triggers: ALL EXIST
--   - 2 views: ALL EXIST
--
-- Migration 005:
--   - Reservations policies: 4 (SELECT, INSERT, UPDATE, DELETE)
--   - Payments policies: 3 (SELECT, INSERT, UPDATE)
--   - Payment splits policies: 2 (SELECT, INSERT)
--
-- Data Integrity:
--   - No overlapping reservations
-- =====================================================
