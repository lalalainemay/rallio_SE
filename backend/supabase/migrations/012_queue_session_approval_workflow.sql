-- =====================================================
-- MIGRATION 012: Queue Session Approval Workflow
-- Purpose: Implement Court Admin approval requirement for queue sessions
-- Dependencies: 001_initial_schema_v2.sql
-- =====================================================

-- =====================================================
-- 1. ADD APPROVAL FIELDS TO queue_sessions
-- =====================================================

-- Add approval-related columns to queue_sessions table
ALTER TABLE queue_sessions
  ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS approval_status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_notes text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approval_expires_at timestamptz;

-- Add index for pending approvals query
CREATE INDEX IF NOT EXISTS idx_queue_sessions_approval_status
  ON queue_sessions(approval_status, court_id)
  WHERE approval_status = 'pending';

-- Add index for expiring approvals
CREATE INDEX IF NOT EXISTS idx_queue_sessions_approval_expires
  ON queue_sessions(approval_expires_at)
  WHERE approval_status = 'pending' AND approval_expires_at IS NOT NULL;

COMMENT ON COLUMN queue_sessions.requires_approval IS 'Whether this session requires Court Admin approval';
COMMENT ON COLUMN queue_sessions.approval_status IS 'Current approval status: pending, approved, rejected';
COMMENT ON COLUMN queue_sessions.approved_by IS 'Court Admin who approved/rejected the session';
COMMENT ON COLUMN queue_sessions.approved_at IS 'Timestamp when approval decision was made';
COMMENT ON COLUMN queue_sessions.approval_notes IS 'Notes from Court Admin (e.g., special instructions)';
COMMENT ON COLUMN queue_sessions.rejection_reason IS 'Reason for rejection (if rejected)';
COMMENT ON COLUMN queue_sessions.approval_expires_at IS 'Automatic expiration time for pending approvals (48 hours)';

-- =====================================================
-- 2. UPDATE STATUS CONSTRAINTS
-- =====================================================

-- Update the status check constraint to prevent sessions from going active without approval
ALTER TABLE queue_sessions DROP CONSTRAINT IF EXISTS queue_sessions_status_check;

ALTER TABLE queue_sessions
  ADD CONSTRAINT queue_sessions_status_check
  CHECK (status IN ('draft', 'pending_approval', 'open', 'active', 'paused', 'closed', 'cancelled', 'rejected'));

COMMENT ON CONSTRAINT queue_sessions_status_check ON queue_sessions IS 'Added pending_approval and rejected statuses';

-- =====================================================
-- 3. CREATE TRIGGER FOR AUTOMATIC APPROVAL EXPIRATION
-- =====================================================

-- Function to set approval expiration time when session is created
CREATE OR REPLACE FUNCTION set_queue_approval_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set expiration for new sessions that require approval
  IF TG_OP = 'INSERT' AND NEW.requires_approval = true AND NEW.approval_status = 'pending' THEN
    -- Set expiration to 48 hours from now
    NEW.approval_expires_at := now() + interval '48 hours';
    -- Set initial status to pending_approval
    NEW.status := 'pending_approval';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_queue_approval_expiration
  BEFORE INSERT ON queue_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_queue_approval_expiration();

COMMENT ON FUNCTION set_queue_approval_expiration() IS 'Sets 48-hour expiration time for pending queue session approvals';

-- =====================================================
-- 4. CREATE FUNCTION TO EXPIRE OLD PENDING APPROVALS
-- =====================================================

-- Function to automatically reject expired pending approvals
CREATE OR REPLACE FUNCTION expire_pending_queue_approvals()
RETURNS TABLE(expired_count int) AS $$
DECLARE
  update_count int;
BEGIN
  -- Update all expired pending approvals to rejected status
  UPDATE queue_sessions
  SET
    approval_status = 'rejected',
    status = 'cancelled',
    rejection_reason = 'Approval request expired after 48 hours',
    updated_at = now()
  WHERE
    approval_status = 'pending'
    AND approval_expires_at IS NOT NULL
    AND approval_expires_at < now()
    AND status = 'pending_approval';

  GET DIAGNOSTICS update_count = ROW_COUNT;

  RETURN QUERY SELECT update_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_pending_queue_approvals() IS 'Expires queue session approvals older than 48 hours. Should be run via scheduled job (Edge Function or pg_cron).';

-- =====================================================
-- 5. CREATE NOTIFICATION TRIGGERS
-- =====================================================

-- Function to create notification when queue session needs approval
CREATE OR REPLACE FUNCTION notify_court_admin_new_queue_approval()
RETURNS TRIGGER AS $$
DECLARE
  court_admin_id uuid;
  court_name text;
  venue_name text;
  organizer_name text;
BEGIN
  -- Only notify on INSERT when approval is required
  IF TG_OP = 'INSERT' AND NEW.requires_approval = true AND NEW.approval_status = 'pending' THEN

    -- Get court admin (venue owner) for this court
    SELECT v.owner_id, c.name, v.name
    INTO court_admin_id, court_name, venue_name
    FROM courts c
    JOIN venues v ON c.venue_id = v.id
    WHERE c.id = NEW.court_id;

    -- Get organizer name
    SELECT COALESCE(display_name, first_name || ' ' || last_name, 'Unknown User')
    INTO organizer_name
    FROM profiles
    WHERE id = NEW.organizer_id;

    -- Create notification for court admin
    IF court_admin_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, action_url)
      VALUES (
        court_admin_id,
        'queue_approval_request',
        'New Queue Session Approval Request',
        organizer_name || ' wants to host a queue session at ' || venue_name || ' - ' || court_name,
        '/court-admin/approvals/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_court_admin_new_queue_approval
  AFTER INSERT ON queue_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_court_admin_new_queue_approval();

COMMENT ON FUNCTION notify_court_admin_new_queue_approval() IS 'Sends notification to Court Admin when new queue session needs approval';

-- Function to notify organizer when approval decision is made
CREATE OR REPLACE FUNCTION notify_organizer_approval_decision()
RETURNS TRIGGER AS $$
DECLARE
  decision_text text;
  message_text text;
BEGIN
  -- Only notify on UPDATE when approval_status changes
  IF TG_OP = 'UPDATE' AND OLD.approval_status != NEW.approval_status THEN

    IF NEW.approval_status = 'approved' THEN
      decision_text := 'approved';
      message_text := 'Your queue session has been approved! You can now start accepting players.';
      IF NEW.approval_notes IS NOT NULL THEN
        message_text := message_text || ' Note: ' || NEW.approval_notes;
      END IF;
    ELSIF NEW.approval_status = 'rejected' THEN
      decision_text := 'rejected';
      message_text := 'Your queue session request was not approved.';
      IF NEW.rejection_reason IS NOT NULL THEN
        message_text := message_text || ' Reason: ' || NEW.rejection_reason;
      END IF;
    ELSE
      RETURN NEW; -- No notification for other status changes
    END IF;

    -- Create notification for organizer
    INSERT INTO notifications (user_id, type, title, message, action_url)
    VALUES (
      NEW.organizer_id,
      'queue_approval_' || decision_text,
      'Queue Session ' || INITCAP(decision_text),
      message_text,
      '/queue/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_organizer_approval_decision
  AFTER UPDATE ON queue_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_organizer_approval_decision();

COMMENT ON FUNCTION notify_organizer_approval_decision() IS 'Notifies Queue Master when their session is approved or rejected';

-- =====================================================
-- 6. CREATE HELPER FUNCTION FOR COURT ADMIN APPROVAL CHECK
-- =====================================================

-- Function to check if a user is the court admin for a queue session
CREATE OR REPLACE FUNCTION is_court_admin_for_queue_session(
  p_user_id uuid,
  p_queue_session_id uuid
)
RETURNS boolean AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM queue_sessions qs
    JOIN courts c ON qs.court_id = c.id
    JOIN venues v ON c.venue_id = v.id
    WHERE qs.id = p_queue_session_id
      AND v.owner_id = p_user_id
  ) INTO is_admin;

  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_court_admin_for_queue_session IS 'Checks if a user owns the venue for a specific queue session';

-- =====================================================
-- 7. CREATE VIEW FOR PENDING APPROVALS
-- =====================================================

-- View to easily query pending queue approvals with all relevant details
CREATE OR REPLACE VIEW pending_queue_approvals AS
SELECT
  qs.id AS session_id,
  qs.court_id,
  qs.organizer_id,
  qs.start_time,
  qs.end_time,
  qs.mode,
  qs.game_format,
  qs.max_players,
  qs.cost_per_game,
  qs.approval_expires_at,
  qs.created_at,
  c.name AS court_name,
  v.id AS venue_id,
  v.name AS venue_name,
  v.owner_id AS court_admin_id,
  p.display_name AS organizer_name,
  p.first_name AS organizer_first_name,
  p.last_name AS organizer_last_name,
  p.avatar_url AS organizer_avatar,
  pl.skill_level AS organizer_skill_level,
  pl.rating AS organizer_rating,
  EXTRACT(EPOCH FROM (qs.approval_expires_at - now())) / 3600 AS hours_until_expiration
FROM queue_sessions qs
JOIN courts c ON qs.court_id = c.id
JOIN venues v ON c.venue_id = v.id
LEFT JOIN profiles p ON qs.organizer_id = p.id
LEFT JOIN players pl ON p.id = pl.user_id
WHERE qs.approval_status = 'pending'
  AND qs.status = 'pending_approval';

COMMENT ON VIEW pending_queue_approvals IS 'Shows all pending queue session approvals with venue and organizer details';

-- =====================================================
-- 8. DATA MIGRATION (if needed)
-- =====================================================

-- Update existing queue sessions to not require approval (grandfather clause)
-- This prevents existing sessions from suddenly requiring approval
UPDATE queue_sessions
SET
  requires_approval = false,
  approval_status = 'approved',
  approved_at = created_at
WHERE approval_status IS NULL OR approval_status = 'pending';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if migration applied successfully
DO $$
BEGIN
  -- Check if new columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_sessions' AND column_name = 'approval_status'
  ) THEN
    RAISE EXCEPTION 'Migration 012 failed: approval_status column not created';
  END IF;

  -- Check if triggers exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_set_queue_approval_expiration'
  ) THEN
    RAISE EXCEPTION 'Migration 012 failed: approval expiration trigger not created';
  END IF;

  RAISE NOTICE 'Migration 012 applied successfully';
END $$;
