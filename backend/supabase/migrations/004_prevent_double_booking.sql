-- =====================================================
-- Migration: Prevent Double Booking & Add Payment Fixes
-- Date: 2025-11-23
-- Description: Critical fixes for booking and payment system
-- =====================================================

-- Enable btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =====================================================
-- 1. PREVENT OVERLAPPING RESERVATIONS
-- =====================================================

-- Add exclusion constraint to prevent double booking
-- This ensures no two active reservations can overlap for the same court
ALTER TABLE reservations
ADD CONSTRAINT no_overlapping_reservations
EXCLUDE USING gist (
  court_id WITH =,
  tstzrange(start_time, end_time) WITH &&
)
WHERE (status IN ('pending', 'confirmed'));

COMMENT ON CONSTRAINT no_overlapping_reservations ON reservations IS 
'Prevents overlapping reservations for the same court when status is pending or confirmed';

-- =====================================================
-- 2. ADD PAYMENT EXPIRATION TRIGGER
-- =====================================================

-- Function to automatically expire old pending payments
CREATE OR REPLACE FUNCTION expire_old_payments()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Expire payments older than 15 minutes that are still pending
  UPDATE payments
  SET 
    status = 'expired',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{expired_at}',
      to_jsonb(now())
    )
  WHERE 
    status = 'pending'
    AND created_at < (now() - interval '15 minutes')
    AND (expires_at IS NULL OR expires_at < now());

  -- Cancel associated reservations
  UPDATE reservations r
  SET 
    status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = 'Payment expired'
  FROM payments p
  WHERE 
    r.id = p.reservation_id
    AND p.status = 'expired'
    AND r.status = 'pending';
    
  RAISE NOTICE 'Expired % old pending payments', (
    SELECT COUNT(*) FROM payments WHERE status = 'expired'
  );
END;
$$;

COMMENT ON FUNCTION expire_old_payments IS 
'Expires pending payments older than 15 minutes and cancels their reservations';

-- =====================================================
-- 3. ADD INDEX FOR PAYMENT EXPIRATION QUERIES
-- =====================================================

-- Index to speed up expiration checks
CREATE INDEX idx_payments_pending_created 
ON payments(created_at) 
WHERE status = 'pending';

-- =====================================================
-- 4. ADD MISSING INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Index for finding payments by status and expiration
CREATE INDEX idx_payments_status_expires 
ON payments(status, expires_at) 
WHERE status IN ('pending', 'processing');

-- Index for reservation conflict checks
CREATE INDEX idx_reservations_court_time_status 
ON reservations(court_id, start_time, end_time, status)
WHERE status IN ('pending', 'confirmed');

-- =====================================================
-- 5. ADD VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate reservation doesn't overlap (additional safety check)
CREATE OR REPLACE FUNCTION validate_reservation_no_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  overlap_count INTEGER;
BEGIN
  -- Only check for pending and confirmed reservations
  IF NEW.status NOT IN ('pending', 'confirmed') THEN
    RETURN NEW;
  END IF;

  -- Check for overlapping reservations
  SELECT COUNT(*) INTO overlap_count
  FROM reservations
  WHERE 
    court_id = NEW.court_id
    AND id != NEW.id
    AND status IN ('pending', 'confirmed')
    AND tstzrange(start_time, end_time) && tstzrange(NEW.start_time, NEW.end_time);

  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'Reservation overlaps with existing booking'
      USING ERRCODE = '23P01'; -- exclusion_violation
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to validate before insert/update
CREATE TRIGGER validate_no_overlap_before_insert
  BEFORE INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION validate_reservation_no_overlap();

CREATE TRIGGER validate_no_overlap_before_update
  BEFORE UPDATE OF start_time, end_time, status ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION validate_reservation_no_overlap();

-- =====================================================
-- 6. ADD HELPFUL VIEWS
-- =====================================================

-- View for active reservations
CREATE OR REPLACE VIEW active_reservations AS
SELECT 
  r.*,
  c.name as court_name,
  v.name as venue_name,
  p.first_name || ' ' || p.last_name as user_name
FROM reservations r
JOIN courts c ON r.court_id = c.id
JOIN venues v ON c.venue_id = v.id
LEFT JOIN profiles p ON r.user_id = p.id
WHERE r.status IN ('pending', 'confirmed')
ORDER BY r.start_time;

COMMENT ON VIEW active_reservations IS 
'Shows all active reservations with related venue and user information';

-- View for payment summary
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
  p.*,
  r.court_id,
  r.start_time,
  r.end_time,
  prof.email as user_email,
  prof.first_name || ' ' || prof.last_name as user_name
FROM payments p
LEFT JOIN reservations r ON p.reservation_id = r.id
LEFT JOIN profiles prof ON p.user_id = prof.id
ORDER BY p.created_at DESC;

COMMENT ON VIEW payment_summary IS 
'Shows all payments with related reservation and user information';

-- =====================================================
-- 7. ADD SCHEDULED JOB PLACEHOLDER
-- =====================================================

-- Note: To enable automatic payment expiration, set up a Supabase Edge Function
-- or use pg_cron extension to run expire_old_payments() every 5 minutes:
-- 
-- SELECT cron.schedule(
--   'expire-old-payments',
--   '*/5 * * * *', -- Every 5 minutes
--   'SELECT expire_old_payments();'
-- );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test the overlap constraint (should fail)
-- INSERT INTO reservations (court_id, user_id, start_time, end_time, total_amount, status)
-- VALUES (
--   'c0000003-0001-0000-0000-000000000001',
--   (SELECT id FROM profiles LIMIT 1),
--   '2025-11-23 10:00:00+00',
--   '2025-11-23 11:00:00+00',
--   500,
--   'pending'
-- );
-- -- Try to insert overlapping booking (should fail)
-- INSERT INTO reservations (court_id, user_id, start_time, end_time, total_amount, status)
-- VALUES (
--   'c0000003-0001-0000-0000-000000000001',
--   (SELECT id FROM profiles LIMIT 1),
--   '2025-11-23 10:30:00+00',
--   '2025-11-23 11:30:00+00',
--   500,
--   'pending'
-- );

-- Verify indexes created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('reservations', 'payments')
ORDER BY tablename, indexname;
