-- =====================================================
-- Migration 006 Verification Script
-- Checks if the enhanced reservation status flow is applied
-- =====================================================

-- 1. Check if 'paid' and 'pending_payment' statuses are valid
SELECT
  'Testing reservation status constraints' AS test_description,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.check_constraints
      WHERE constraint_name = 'reservations_status_check'
        AND check_clause LIKE '%pending_payment%'
        AND check_clause LIKE '%paid%'
    ) THEN '✅ PASS: Migration 006 is applied - paid and pending_payment statuses exist'
    ELSE '❌ FAIL: Migration 006 NOT applied - missing paid/pending_payment statuses'
  END AS result;

-- 2. Check the actual constraint definition
SELECT
  'Current status constraint values' AS check_type,
  check_clause AS allowed_statuses
FROM information_schema.check_constraints
WHERE constraint_name = 'reservations_status_check';

-- 3. Test if we can insert a reservation with 'pending_payment' status
-- This is a dry run (will be rolled back)
BEGIN;
  INSERT INTO reservations (
    user_id,
    court_id,
    start_time,
    end_time,
    total_amount,
    status
  ) VALUES (
    (SELECT id FROM profiles LIMIT 1),
    (SELECT id FROM courts LIMIT 1),
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days 1 hour',
    100.00,
    'pending_payment'
  ) RETURNING
    'Test insert with pending_payment status' AS test,
    id,
    status;
ROLLBACK;

-- 4. Test if we can insert a reservation with 'paid' status
BEGIN;
  INSERT INTO reservations (
    user_id,
    court_id,
    start_time,
    end_time,
    total_amount,
    status
  ) VALUES (
    (SELECT id FROM profiles LIMIT 1),
    (SELECT id FROM courts LIMIT 1),
    NOW() + INTERVAL '8 days',
    NOW() + INTERVAL '8 days 1 hour',
    100.00,
    'paid'
  ) RETURNING
    'Test insert with paid status' AS test,
    id,
    status;
ROLLBACK;

-- 5. Show current reservations with their statuses
SELECT
  'Current reservation statuses in database' AS info,
  status,
  COUNT(*) AS count
FROM reservations
GROUP BY status
ORDER BY count DESC;

-- 6. Check if btree_gist extension is enabled (required for overlap constraint)
SELECT
  'Extension check' AS check_type,
  extname AS extension_name,
  CASE
    WHEN extname = 'btree_gist' THEN '✅ Required for overlap constraint'
    ELSE ''
  END AS status
FROM pg_extension
WHERE extname IN ('btree_gist', 'postgis');

-- 7. Check if the no_overlapping_reservations constraint exists
SELECT
  'Overlap constraint check' AS check_type,
  conname AS constraint_name,
  CASE
    WHEN conname = 'no_overlapping_reservations' THEN '✅ Overlap prevention active'
    ELSE ''
  END AS status
FROM pg_constraint
WHERE conname = 'no_overlapping_reservations';

-- =====================================================
-- Summary and Recommendations
-- =====================================================

SELECT
  '=== MIGRATION 006 STATUS SUMMARY ===' AS summary;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.check_constraints
      WHERE constraint_name = 'reservations_status_check'
        AND check_clause LIKE '%pending_payment%'
        AND check_clause LIKE '%paid%'
    ) THEN
      '✅ Migration 006 is APPLIED. Payment flow statuses (pending_payment, paid, confirmed) are available.'
    ELSE
      '❌ Migration 006 is NOT APPLIED. Run migration file: 006_enhance_booking_status_and_constraints.sql'
  END AS status,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.check_constraints
      WHERE constraint_name = 'reservations_status_check'
        AND check_clause LIKE '%pending_payment%'
        AND check_clause LIKE '%paid%'
    ) THEN
      'No action needed. Webhook handler will use: pending_payment → paid → confirmed flow.'
    ELSE
      'ACTION REQUIRED: Apply migration 006 to enable proper payment status tracking. Until then, webhook will use fallback: pending → confirmed.'
  END AS recommendation;
