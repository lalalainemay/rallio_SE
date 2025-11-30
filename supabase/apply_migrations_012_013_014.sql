-- =====================================================
-- COMPREHENSIVE MIGRATION SCRIPT
-- Purpose:
--   1. Mark manually applied migrations (002-011) in migration history
--   2. Apply new migrations (012, 013, 014)
--   3. Mark new migrations as applied
--
-- RUN THIS IN SUPABASE DASHBOARD SQL EDITOR
-- =====================================================

-- Start transaction for safety
BEGIN;

-- =====================================================
-- STEP 1: Mark migrations 002-011 as applied
-- (These were applied manually via SQL Editor)
-- =====================================================

INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES
  ('002', 'add_nearby_venues_function', ARRAY['-- Applied manually via SQL Editor']),
  ('002', 'add_players_insert_policy', ARRAY['-- Applied manually via SQL Editor']),
  ('003', 'fix_court_availabilities', ARRAY['-- Applied manually via SQL Editor']),
  ('004', 'prevent_double_booking', ARRAY['-- Applied manually via SQL Editor']),
  ('005', 'add_missing_rls_policies', ARRAY['-- Applied manually via SQL Editor']),
  ('006', 'queue_master_helpers', ARRAY['-- Applied manually via SQL Editor']),
  ('007', 'auto_close_expired_sessions', ARRAY['-- Applied manually via SQL Editor']),
  ('008', 'add_matches_rls_policies', ARRAY['-- Applied manually via SQL Editor']),
  ('009', 'fix_queue_participant_count', ARRAY['-- Applied manually via SQL Editor']),
  ('010', 'add_missing_queue_rls_policies', ARRAY['-- Applied manually via SQL Editor']),
  ('011', 'create_player_ratings_table_v2', ARRAY['-- Applied manually via SQL Editor'])
ON CONFLICT (version, name) DO NOTHING;

RAISE NOTICE 'Marked migrations 002-011 as applied';

-- =====================================================
-- STEP 2: Apply MIGRATION 012 - Queue Session Approval Workflow
-- =====================================================

-- 1. ADD APPROVAL FIELDS TO queue_sessions
ALTER TABLE queue_sessions
  ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS approval_status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_notes text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approval_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_queue_sessions_approval_status
  ON queue_sessions(approval_status, court_id)
  WHERE approval_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_queue_sessions_approval_expires
  ON queue_sessions(approval_expires_at)
  WHERE approval_status = 'pending' AND approval_expires_at IS NOT NULL;

-- 2. UPDATE STATUS CONSTRAINTS
ALTER TABLE queue_sessions DROP CONSTRAINT IF EXISTS queue_sessions_status_check;
ALTER TABLE queue_sessions
  ADD CONSTRAINT queue_sessions_status_check
  CHECK (status IN ('draft', 'pending_approval', 'open', 'active', 'paused', 'closed', 'cancelled', 'rejected'));

-- 3. CREATE TRIGGER FOR AUTOMATIC APPROVAL EXPIRATION
CREATE OR REPLACE FUNCTION set_queue_approval_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.requires_approval = true AND NEW.approval_status = 'pending' THEN
    NEW.approval_expires_at := now() + interval '48 hours';
    NEW.status := 'pending_approval';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_queue_approval_expiration ON queue_sessions;
CREATE TRIGGER trigger_set_queue_approval_expiration
  BEFORE INSERT ON queue_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_queue_approval_expiration();

-- 4. CREATE FUNCTION TO EXPIRE OLD PENDING APPROVALS
CREATE OR REPLACE FUNCTION expire_pending_queue_approvals()
RETURNS TABLE(expired_count int) AS $$
DECLARE
  update_count int;
BEGIN
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

-- 5. CREATE NOTIFICATION TRIGGERS
CREATE OR REPLACE FUNCTION notify_court_admin_new_queue_approval()
RETURNS TRIGGER AS $$
DECLARE
  court_admin_id uuid;
  court_name text;
  venue_name text;
  organizer_name text;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.requires_approval = true AND NEW.approval_status = 'pending' THEN
    SELECT v.owner_id, c.name, v.name
    INTO court_admin_id, court_name, venue_name
    FROM courts c
    JOIN venues v ON c.venue_id = v.id
    WHERE c.id = NEW.court_id;

    SELECT COALESCE(display_name, first_name || ' ' || last_name, 'Unknown User')
    INTO organizer_name
    FROM profiles
    WHERE id = NEW.organizer_id;

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

DROP TRIGGER IF EXISTS trigger_notify_court_admin_new_queue_approval ON queue_sessions;
CREATE TRIGGER trigger_notify_court_admin_new_queue_approval
  AFTER INSERT ON queue_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_court_admin_new_queue_approval();

CREATE OR REPLACE FUNCTION notify_organizer_approval_decision()
RETURNS TRIGGER AS $$
DECLARE
  decision_text text;
  message_text text;
BEGIN
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
      RETURN NEW;
    END IF;

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

DROP TRIGGER IF EXISTS trigger_notify_organizer_approval_decision ON queue_sessions;
CREATE TRIGGER trigger_notify_organizer_approval_decision
  AFTER UPDATE ON queue_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_organizer_approval_decision();

-- 6. CREATE HELPER FUNCTION
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

-- 7. CREATE VIEW
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

-- 8. DATA MIGRATION
UPDATE queue_sessions
SET
  requires_approval = false,
  approval_status = 'approved',
  approved_at = created_at
WHERE approval_status IS NULL OR approval_status = 'pending';

RAISE NOTICE 'Migration 012 applied successfully';

-- =====================================================
-- STEP 3: Apply MIGRATION 013 - Queue Approval RLS Policies
-- =====================================================

-- 1. HELPER FUNCTION: Check if user has role
CREATE OR REPLACE FUNCTION has_role(p_user_id uuid, p_role_name text)
RETURNS boolean AS $$
DECLARE
  has_role_result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND r.name = p_role_name
  ) INTO has_role_result;
  RETURN has_role_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. UPDATE QUEUE_SESSIONS RLS POLICIES
DROP POLICY IF EXISTS "Public queue sessions are viewable" ON queue_sessions;
DROP POLICY IF EXISTS "Users can create queue sessions" ON queue_sessions;
DROP POLICY IF EXISTS "Organizers can update their sessions" ON queue_sessions;
DROP POLICY IF EXISTS "View queue sessions with approval" ON queue_sessions;
DROP POLICY IF EXISTS "Update queue sessions with approval" ON queue_sessions;
DROP POLICY IF EXISTS "Delete queue sessions" ON queue_sessions;

CREATE POLICY "View queue sessions with approval" ON queue_sessions
  FOR SELECT
  USING (
    (is_public = true AND approval_status = 'approved')
    OR
    (auth.uid() = organizer_id)
    OR
    (
      has_role(auth.uid(), 'court_admin')
      AND EXISTS (
        SELECT 1 FROM courts c
        JOIN venues v ON c.venue_id = v.id
        WHERE c.id = queue_sessions.court_id
          AND v.owner_id = auth.uid()
      )
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

CREATE POLICY "Users can create queue sessions" ON queue_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Update queue sessions with approval" ON queue_sessions
  FOR UPDATE
  USING (
    auth.uid() = organizer_id
    OR
    (
      has_role(auth.uid(), 'court_admin')
      AND EXISTS (
        SELECT 1 FROM courts c
        JOIN venues v ON c.venue_id = v.id
        WHERE c.id = queue_sessions.court_id
          AND v.owner_id = auth.uid()
      )
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

CREATE POLICY "Delete queue sessions" ON queue_sessions
  FOR DELETE
  USING (
    (auth.uid() = organizer_id AND status = 'draft')
    OR
    (
      has_role(auth.uid(), 'court_admin')
      AND EXISTS (
        SELECT 1 FROM courts c
        JOIN venues v ON c.venue_id = v.id
        WHERE c.id = queue_sessions.court_id
          AND v.owner_id = auth.uid()
      )
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- 3. NOTIFICATIONS RLS POLICIES
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- 4. VENUES RLS POLICIES
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON venues;
DROP POLICY IF EXISTS "Owners can manage their venues" ON venues;
DROP POLICY IF EXISTS "View venues" ON venues;
DROP POLICY IF EXISTS "Court admins can create venues" ON venues;
DROP POLICY IF EXISTS "Owners can update venues" ON venues;
DROP POLICY IF EXISTS "Owners can delete venues" ON venues;

CREATE POLICY "View venues" ON venues
  FOR SELECT
  USING (
    is_active = true
    OR
    auth.uid() = owner_id
    OR
    has_role(auth.uid(), 'global_admin')
  );

CREATE POLICY "Court admins can create venues" ON venues
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND (has_role(auth.uid(), 'court_admin') OR has_role(auth.uid(), 'global_admin'))
  );

CREATE POLICY "Owners can update venues" ON venues
  FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR
    has_role(auth.uid(), 'global_admin')
  );

CREATE POLICY "Owners can delete venues" ON venues
  FOR DELETE
  USING (
    auth.uid() = owner_id
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- 5. COURTS RLS POLICIES
DROP POLICY IF EXISTS "Active courts are viewable by everyone" ON courts;
DROP POLICY IF EXISTS "Venue owners can manage courts" ON courts;
DROP POLICY IF EXISTS "View courts" ON courts;
DROP POLICY IF EXISTS "Venue owners can insert courts" ON courts;
DROP POLICY IF EXISTS "Venue owners can update courts" ON courts;
DROP POLICY IF EXISTS "Venue owners can delete courts" ON courts;

CREATE POLICY "View courts" ON courts
  FOR SELECT
  USING (
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = courts.venue_id
        AND (v.owner_id = auth.uid() OR has_role(auth.uid(), 'global_admin'))
    )
  );

CREATE POLICY "Venue owners can insert courts" ON courts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = courts.venue_id
        AND v.owner_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

CREATE POLICY "Venue owners can update courts" ON courts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = courts.venue_id
        AND v.owner_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

CREATE POLICY "Venue owners can delete courts" ON courts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = courts.venue_id
        AND v.owner_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- 6. RESERVATIONS RLS POLICIES
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "View reservations" ON reservations;
DROP POLICY IF EXISTS "Update reservations" ON reservations;

CREATE POLICY "View reservations" ON reservations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM courts c
      JOIN venues v ON c.venue_id = v.id
      WHERE c.id = reservations.court_id
        AND v.owner_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

CREATE POLICY "Users can create reservations" ON reservations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update reservations" ON reservations
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM courts c
      JOIN venues v ON c.venue_id = v.id
      WHERE c.id = reservations.court_id
        AND v.owner_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- 7. COURT_RATINGS RLS POLICIES
DROP POLICY IF EXISTS "Court ratings are viewable by everyone" ON court_ratings;
DROP POLICY IF EXISTS "Users can create ratings" ON court_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON court_ratings;
DROP POLICY IF EXISTS "View court ratings" ON court_ratings;
DROP POLICY IF EXISTS "Users can create court ratings" ON court_ratings;
DROP POLICY IF EXISTS "Update court ratings" ON court_ratings;

CREATE POLICY "View court ratings" ON court_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create court ratings" ON court_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update court ratings" ON court_ratings
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM courts c
      JOIN venues v ON c.venue_id = v.id
      WHERE c.id = court_ratings.court_id
        AND v.owner_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- 8. RATING_RESPONSES RLS POLICIES
DROP POLICY IF EXISTS "Rating responses are viewable by everyone" ON rating_responses;
DROP POLICY IF EXISTS "Venue owners can create responses" ON rating_responses;
DROP POLICY IF EXISTS "Venue owners can update own responses" ON rating_responses;
DROP POLICY IF EXISTS "View rating responses" ON rating_responses;
DROP POLICY IF EXISTS "Venue owners can create rating responses" ON rating_responses;
DROP POLICY IF EXISTS "Venue owners can update rating responses" ON rating_responses;

CREATE POLICY "View rating responses" ON rating_responses
  FOR SELECT
  USING (true);

CREATE POLICY "Venue owners can create rating responses" ON rating_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = rating_responses.venue_id
        AND v.owner_id = auth.uid()
    )
    AND auth.uid() = responder_id
  );

CREATE POLICY "Venue owners can update rating responses" ON rating_responses
  FOR UPDATE
  USING (
    auth.uid() = responder_id
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- 9. GRANT EXECUTE PERMISSIONS
GRANT EXECUTE ON FUNCTION has_role TO authenticated;
GRANT EXECUTE ON FUNCTION is_court_admin_for_queue_session TO authenticated;

RAISE NOTICE 'Migration 013 applied successfully';

-- =====================================================
-- STEP 4: Apply MIGRATION 014 - Blocked Dates Table
-- =====================================================

-- 1. CREATE BLOCKED_DATES TABLE
CREATE TABLE IF NOT EXISTS blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  court_id uuid REFERENCES courts(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  reason text NOT NULL,
  block_type varchar(20) NOT NULL DEFAULT 'maintenance'
    CHECK (block_type IN ('maintenance', 'holiday', 'private_event', 'other')),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_venue ON blocked_dates(venue_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_court ON blocked_dates(court_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date_range ON blocked_dates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_active ON blocked_dates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_blocked_dates_court_date_active
  ON blocked_dates(court_id, start_date, end_date, is_active)
  WHERE is_active = true;

-- 2. CREATE FUNCTION TO CHECK IF TIME SLOT IS BLOCKED
CREATE OR REPLACE FUNCTION is_time_slot_blocked(
  p_court_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS TABLE(
  is_blocked boolean,
  reason text,
  block_type varchar(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS is_blocked,
    bd.reason,
    bd.block_type
  FROM blocked_dates bd
  WHERE bd.is_active = true
    AND (
      bd.court_id = p_court_id
      OR
      (bd.court_id IS NULL AND bd.venue_id = (
        SELECT venue_id FROM courts WHERE id = p_court_id
      ))
    )
    AND bd.start_date < p_end_time
    AND bd.end_date > p_start_time
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false AS is_blocked, NULL::text AS reason, NULL::varchar(20) AS block_type;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. CREATE TRIGGER FOR UPDATED_AT
DROP TRIGGER IF EXISTS update_blocked_dates_updated_at ON blocked_dates;
CREATE TRIGGER update_blocked_dates_updated_at
  BEFORE UPDATE ON blocked_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active blocked dates are viewable by everyone" ON blocked_dates;
DROP POLICY IF EXISTS "Venue owners can create blocked dates" ON blocked_dates;
DROP POLICY IF EXISTS "Venue owners can update blocked dates" ON blocked_dates;
DROP POLICY IF EXISTS "Venue owners can delete blocked dates" ON blocked_dates;

CREATE POLICY "Active blocked dates are viewable by everyone" ON blocked_dates
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Venue owners can create blocked dates" ON blocked_dates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = blocked_dates.venue_id
        AND v.owner_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Venue owners can update blocked dates" ON blocked_dates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = blocked_dates.venue_id
        AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY "Venue owners can delete blocked dates" ON blocked_dates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = blocked_dates.venue_id
        AND v.owner_id = auth.uid()
    )
  );

-- 5. CREATE VIEW FOR ACTIVE BLOCKS
CREATE OR REPLACE VIEW active_blocked_dates AS
SELECT
  bd.id,
  bd.venue_id,
  bd.court_id,
  bd.start_date,
  bd.end_date,
  bd.reason,
  bd.block_type,
  bd.created_at,
  v.name AS venue_name,
  c.name AS court_name,
  p.display_name AS created_by_name
FROM blocked_dates bd
JOIN venues v ON bd.venue_id = v.id
LEFT JOIN courts c ON bd.court_id = c.id
LEFT JOIN profiles p ON bd.created_by = p.id
WHERE bd.is_active = true
  AND bd.end_date > now()
ORDER BY bd.start_date ASC;

RAISE NOTICE 'Migration 014 applied successfully';

-- =====================================================
-- STEP 5: Mark new migrations (012-014) as applied
-- =====================================================

INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES
  ('012', 'queue_session_approval_workflow', ARRAY['-- Applied via comprehensive migration script']),
  ('013', 'queue_approval_rls_policies', ARRAY['-- Applied via comprehensive migration script']),
  ('014', 'blocked_dates_table', ARRAY['-- Applied via comprehensive migration script'])
ON CONFLICT (version, name) DO NOTHING;

RAISE NOTICE 'Marked migrations 012-014 as applied';

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

DO $$
BEGIN
  -- Check migrations table
  IF NOT EXISTS (
    SELECT 1 FROM supabase_migrations.schema_migrations
    WHERE version = '012' AND name = 'queue_session_approval_workflow'
  ) THEN
    RAISE EXCEPTION 'Migration 012 not marked as applied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM supabase_migrations.schema_migrations
    WHERE version = '014' AND name = 'blocked_dates_table'
  ) THEN
    RAISE EXCEPTION 'Migration 014 not marked as applied';
  END IF;

  -- Check if queue_sessions has approval columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_sessions' AND column_name = 'approval_status'
  ) THEN
    RAISE EXCEPTION 'queue_sessions approval columns not created';
  END IF;

  -- Check if blocked_dates table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'blocked_dates'
  ) THEN
    RAISE EXCEPTION 'blocked_dates table not created';
  END IF;

  RAISE NOTICE '✅ All migrations applied successfully!';
  RAISE NOTICE '✅ Total migrations in history: %', (SELECT COUNT(*) FROM supabase_migrations.schema_migrations);
END $$;

-- Commit transaction
COMMIT;

-- =====================================================
-- SUCCESS! You can now verify in Supabase Dashboard:
-- 1. Database → Tables → queue_sessions (see approval columns)
-- 2. Database → Tables → blocked_dates (new table)
-- 3. Database → Functions → has_role, is_court_admin_for_queue_session, etc.
-- 4. Database → Policies (all updated RLS policies)
-- =====================================================
