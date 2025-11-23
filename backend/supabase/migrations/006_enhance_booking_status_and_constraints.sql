-- =====================================================
-- Migration 006: Enhance Reservation Status & Overlap Enforcement
-- Date: 2025-11-23
-- Description: Align reservation statuses with payment flow and harden
--              overlap prevention across new status lifecycle values.
-- =====================================================

BEGIN;

-- Ensure required extension exists for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =====================================================
-- 1. Expand reservation status lifecycle
-- =====================================================

-- Relax and recreate the status check constraint with new lifecycle values
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (
    status IN (
      'pending_payment',
      'pending',
      'paid',
      'confirmed',
      'cancelled',
      'completed',
      'no_show'
    )
  );

-- Default new reservations to pending_payment to mirror payment initiation flow
ALTER TABLE reservations
  ALTER COLUMN status SET DEFAULT 'pending_payment';

-- Migrate legacy "pending" reservations to the new pending_payment status for accuracy
UPDATE reservations
SET status = 'pending_payment'
WHERE status = 'pending';

-- =====================================================
-- 2. Rebuild overlap constraint & supporting trigger logic
-- =====================================================

-- Drop and recreate the exclusion constraint with expanded status guard
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS no_overlapping_reservations;

ALTER TABLE reservations
  ADD CONSTRAINT no_overlapping_reservations
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (status IN ('pending_payment', 'pending', 'paid', 'confirmed'));

COMMENT ON CONSTRAINT no_overlapping_reservations ON reservations IS
  'Prevents overlapping reservations for the same court while active or awaiting payment.';

-- Refresh validation function to respect the expanded status list
CREATE OR REPLACE FUNCTION validate_reservation_no_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  overlap_count integer;
BEGIN
  -- Skip checks for inactive reservations
  IF NEW.status NOT IN ('pending_payment', 'pending', 'paid', 'confirmed') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
    INTO overlap_count
  FROM reservations
  WHERE court_id = NEW.court_id
    AND (NEW.id IS NULL OR id <> NEW.id)
    AND status IN ('pending_payment', 'pending', 'paid', 'confirmed')
    AND tstzrange(start_time, end_time) && tstzrange(NEW.start_time, NEW.end_time);

  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'Reservation overlaps with existing booking'
      USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate triggers to ensure the updated function is used
DROP TRIGGER IF EXISTS validate_no_overlap_before_insert ON reservations;
DROP TRIGGER IF EXISTS validate_no_overlap_before_update ON reservations;

CREATE TRIGGER validate_no_overlap_before_insert
  BEFORE INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION validate_reservation_no_overlap();

CREATE TRIGGER validate_no_overlap_before_update
  BEFORE UPDATE OF start_time, end_time, status ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION validate_reservation_no_overlap();

-- =====================================================
-- 3. Refresh helpful indexes for conflict checks
-- =====================================================

DROP INDEX IF EXISTS idx_reservations_court_time_status;

CREATE INDEX idx_reservations_court_time_status
ON reservations (court_id, start_time, end_time, status)
WHERE status IN ('pending_payment', 'pending', 'paid', 'confirmed');

COMMIT;
