-- =============================================================
-- Test Booking Cleanup Helper
-- -------------------------------------------------------------
-- This script helps identify and purge legacy test reservations
-- along with their dependent payments/payment_splits records.
--
-- ⚠️  Usage Instructions
-- 1. Adjust the patterns in the PARAMS CTE to match your test data.
--    - email_patterns: profile email filters (ILIKE patterns)
--    - note_keywords: reservations.notes keywords
--    - metadata_flags: reservation metadata keys that imply test data
--    - older_than: optional age threshold for stale pending bookings
--      (set to interval '0' to disable date-based filtering)
--    - include_statuses: reservation statuses eligible for deletion
-- 2. Run the PREVIEW section to review matches.
-- 3. Once confirmed, uncomment the CLEANUP transaction and run inside
--    the Supabase SQL editor (or psql) to delete the data safely.
--
-- All deletes cascade manually to maintain referential integrity:
--   payment_splits ➜ payments ➜ reservations
-- =============================================================

-- -------------------------------------------------------------
-- STEP 1: PREVIEW CANDIDATES (safe to run)
-- -------------------------------------------------------------
WITH params AS (
  SELECT
    ARRAY['test%', '%@example.com', '%demo%']::text[] AS email_patterns,
    ARRAY['test', 'demo', 'sample']::text[] AS note_keywords,
    ARRAY['is_test', 'test_mode']::text[] AS metadata_flags,
    interval '0 days' AS older_than, -- set > 0 to enable age-based filter
    ARRAY['pending_payment', 'pending', 'cancelled']::text[] AS include_statuses
),
matching_reservations AS (
  SELECT DISTINCT r.id
  FROM reservations r
  LEFT JOIN profiles p ON p.id = r.user_id
  CROSS JOIN params cfg
  WHERE
    -- Match by metadata flags (jsonb keys)
    EXISTS (
      SELECT 1
      FROM unnest(cfg.metadata_flags) flag
      WHERE flag <> '' AND r.metadata ? flag
    )
    OR (
      r.notes IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM unnest(cfg.note_keywords) kw
        WHERE kw <> '' AND r.notes ILIKE '%' || kw || '%'
      )
    )
    OR (
      p.email IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM unnest(cfg.email_patterns) pattern
        WHERE pattern <> '' AND p.email ILIKE pattern
      )
    )
    OR (
      cfg.older_than > interval '0'
      AND r.created_at < now() - cfg.older_than
      AND r.status = ANY(cfg.include_statuses)
    )
)
SELECT
  r.id,
  r.status,
  r.start_time,
  r.end_time,
  r.created_at,
  p.email,
  r.notes,
  r.metadata
FROM reservations r
JOIN matching_reservations mr ON mr.id = r.id
LEFT JOIN profiles p ON p.id = r.user_id
ORDER BY r.created_at DESC;

-- Optional quick counts per status
SELECT r.status, COUNT(*)
FROM reservations r
JOIN matching_reservations mr ON mr.id = r.id
GROUP BY r.status
ORDER BY r.status;

-- -------------------------------------------------------------
-- STEP 2: CLEANUP (UNCOMMENT AFTER REVIEW)
-- -------------------------------------------------------------
-- BEGIN;
-- WITH params AS (
--   SELECT
--     ARRAY['test%', '%@example.com', '%demo%']::text[] AS email_patterns,
--     ARRAY['test', 'demo', 'sample']::text[] AS note_keywords,
--     ARRAY['is_test', 'test_mode']::text[] AS metadata_flags,
--     interval '0 days' AS older_than,
--     ARRAY['pending_payment', 'pending', 'cancelled']::text[] AS include_statuses
-- ),
-- candidate_reservations AS (
--   SELECT DISTINCT r.id
--   FROM reservations r
--   LEFT JOIN profiles p ON p.id = r.user_id
--   CROSS JOIN params cfg
--   WHERE
--     EXISTS (SELECT 1 FROM unnest(cfg.metadata_flags) flag WHERE flag <> '' AND r.metadata ? flag)
--     OR (
--       r.notes IS NOT NULL
--       AND EXISTS (
--         SELECT 1 FROM unnest(cfg.note_keywords) kw
--         WHERE kw <> '' AND r.notes ILIKE '%' || kw || '%'
--       )
--     )
--     OR (
--       p.email IS NOT NULL
--       AND EXISTS (
--         SELECT 1 FROM unnest(cfg.email_patterns) pattern
--         WHERE pattern <> '' AND p.email ILIKE pattern
--       )
--     )
--     OR (
--       cfg.older_than > interval '0'
--       AND r.created_at < now() - cfg.older_than
--       AND r.status = ANY(cfg.include_statuses)
--     )
-- ),
-- deleted_payment_splits AS (
--   DELETE FROM payment_splits
--   WHERE reservation_id IN (SELECT id FROM candidate_reservations)
--   RETURNING id
-- ),
-- deleted_payments AS (
--   DELETE FROM payments
--   WHERE reservation_id IN (SELECT id FROM candidate_reservations)
--   RETURNING id
-- ),
-- deleted_reservations AS (
--   DELETE FROM reservations
--   WHERE id IN (SELECT id FROM candidate_reservations)
--   RETURNING id
-- )
-- SELECT
--   (SELECT COUNT(*) FROM candidate_reservations) AS reservations_marked,
--   (SELECT COUNT(*) FROM deleted_payment_splits) AS splits_removed,
--   (SELECT COUNT(*) FROM deleted_payments) AS payments_removed,
--   (SELECT COUNT(*) FROM deleted_reservations) AS reservations_removed;
-- COMMIT;
--
-- -------------------------------------------------------------
-- STEP 3: OPTIONAL - VACUUM/ANALYZE (run during maintenance windows)
-- -------------------------------------------------------------
-- VACUUM ANALYZE reservations;
-- VACUUM ANALYZE payments;
-- VACUUM ANALYZE payment_splits;
-- =============================================================
