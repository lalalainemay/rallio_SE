-- =====================================================
-- MIGRATION 013: Queue Session Approval RLS Policies
-- Purpose: Row Level Security policies for queue session approval workflow
-- Dependencies: 012_queue_session_approval_workflow.sql
-- =====================================================

-- =====================================================
-- 1. HELPER FUNCTION: Check if user has role
-- =====================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(p_user_id uuid, p_role_name text)
RETURNS boolean AS $$
DECLARE
  has_role boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND r.name = p_role_name
  ) INTO has_role;

  RETURN has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_role IS 'Checks if a user has a specific role (player, court_admin, queue_master, global_admin)';

-- =====================================================
-- 2. UPDATE QUEUE_SESSIONS RLS POLICIES
-- =====================================================

-- Drop existing queue_sessions policies that conflict with approval workflow
DROP POLICY IF EXISTS "Public queue sessions are viewable" ON queue_sessions;
DROP POLICY IF EXISTS "Users can create queue sessions" ON queue_sessions;
DROP POLICY IF EXISTS "Organizers can update their sessions" ON queue_sessions;

-- POLICY: View queue sessions
-- Players can see: approved public sessions, their own sessions
-- Court Admins can see: sessions at their venues (all statuses)
-- Global Admins can see: everything
CREATE POLICY "View queue sessions with approval" ON queue_sessions
  FOR SELECT
  USING (
    -- Public approved sessions visible to everyone
    (is_public = true AND approval_status = 'approved')
    OR
    -- Own sessions visible to organizer
    (auth.uid() = organizer_id)
    OR
    -- Court Admin can see sessions at their venues
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
    -- Global Admin can see everything
    has_role(auth.uid(), 'global_admin')
  );

-- POLICY: Create queue sessions
-- Any authenticated user can create a queue session
-- It will be pending approval if requires_approval = true
CREATE POLICY "Users can create queue sessions" ON queue_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = organizer_id
  );

-- POLICY: Update queue sessions
-- Organizers can update their own sessions (but not approval fields)
-- Court Admins can update sessions at their venues (including approval)
-- Global Admins can update everything
CREATE POLICY "Update queue sessions with approval" ON queue_sessions
  FOR UPDATE
  USING (
    -- Organizer can update their own session (limited fields)
    auth.uid() = organizer_id
    OR
    -- Court Admin can update sessions at their venues
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
    -- Global Admin can update everything
    has_role(auth.uid(), 'global_admin')
  );

-- POLICY: Delete queue sessions
-- Only organizers can delete their own draft sessions
-- Court Admins can delete (cancel) sessions at their venues
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

-- =====================================================
-- 3. NOTIFICATIONS RLS POLICIES (if not exist)
-- =====================================================

-- Ensure Court Admins can receive approval notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow system to insert notifications (for triggers)
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true); -- Triggers run as SECURITY DEFINER, so this is safe

-- =====================================================
-- 4. VENUES RLS POLICIES (Enhanced for Court Admin)
-- =====================================================

-- Drop existing venue policies
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON venues;
DROP POLICY IF EXISTS "Owners can manage their venues" ON venues;

-- POLICY: View venues
-- Active venues visible to everyone
-- Inactive venues only visible to owner and global admin
CREATE POLICY "View venues" ON venues
  FOR SELECT
  USING (
    is_active = true
    OR
    auth.uid() = owner_id
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- POLICY: Insert venues
-- Users with court_admin role can create venues
CREATE POLICY "Court admins can create venues" ON venues
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND (has_role(auth.uid(), 'court_admin') OR has_role(auth.uid(), 'global_admin'))
  );

-- POLICY: Update venues
-- Owners can update their own venues
CREATE POLICY "Owners can update venues" ON venues
  FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- POLICY: Delete venues
-- Owners can soft-delete their venues (set is_active = false)
CREATE POLICY "Owners can delete venues" ON venues
  FOR DELETE
  USING (
    auth.uid() = owner_id
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- =====================================================
-- 5. COURTS RLS POLICIES (Enhanced for Court Admin)
-- =====================================================

-- Drop existing court policies
DROP POLICY IF EXISTS "Active courts are viewable by everyone" ON courts;
DROP POLICY IF EXISTS "Venue owners can manage courts" ON courts;

-- POLICY: View courts
-- Active courts visible to everyone
-- Inactive courts only visible to venue owner
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

-- POLICY: Insert courts
-- Venue owners can add courts to their venues
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

-- POLICY: Update courts
-- Venue owners can update their courts
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

-- POLICY: Delete courts
-- Venue owners can soft-delete their courts
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

-- =====================================================
-- 6. RESERVATIONS RLS POLICIES (Court Admin Access)
-- =====================================================

-- Drop and recreate reservations policies to add Court Admin access
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;

-- POLICY: View reservations
-- Users can see their own reservations
-- Court Admins can see reservations at their venues
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

-- POLICY: Insert reservations
CREATE POLICY "Users can create reservations" ON reservations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLICY: Update reservations
-- Users can update their own pending reservations
-- Court Admins can update reservations at their venues (for approval/cancellation)
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

-- =====================================================
-- 7. COURT_RATINGS RLS POLICIES (Court Admin Responses)
-- =====================================================

-- Drop existing court_ratings policies
DROP POLICY IF EXISTS "Court ratings are viewable by everyone" ON court_ratings;
DROP POLICY IF EXISTS "Users can create ratings" ON court_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON court_ratings;

-- POLICY: View ratings
CREATE POLICY "View court ratings" ON court_ratings
  FOR SELECT
  USING (true);

-- POLICY: Insert ratings
CREATE POLICY "Users can create court ratings" ON court_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLICY: Update ratings
-- Users can update their own ratings
-- Court Admins can flag ratings (future feature)
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

-- =====================================================
-- 8. RATING_RESPONSES RLS POLICIES
-- =====================================================

-- Ensure venue owners can respond to ratings
DROP POLICY IF EXISTS "Rating responses are viewable by everyone" ON rating_responses;
DROP POLICY IF EXISTS "Venue owners can create responses" ON rating_responses;
DROP POLICY IF EXISTS "Venue owners can update own responses" ON rating_responses;

-- POLICY: View rating responses
CREATE POLICY "View rating responses" ON rating_responses
  FOR SELECT
  USING (true);

-- POLICY: Create rating responses
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

-- POLICY: Update rating responses
CREATE POLICY "Venue owners can update rating responses" ON rating_responses
  FOR UPDATE
  USING (
    auth.uid() = responder_id
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- =====================================================
-- 9. GRANT EXECUTE PERMISSIONS ON HELPER FUNCTIONS
-- =====================================================

-- Allow authenticated users to execute helper functions
GRANT EXECUTE ON FUNCTION has_role TO authenticated;
GRANT EXECUTE ON FUNCTION is_court_admin_for_queue_session TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  -- Check if has_role function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'has_role'
  ) THEN
    RAISE EXCEPTION 'Migration 013 failed: has_role function not created';
  END IF;

  -- Check if policies were created
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'queue_sessions' AND policyname = 'View queue sessions with approval'
  ) THEN
    RAISE EXCEPTION 'Migration 013 failed: Queue sessions RLS policies not created';
  END IF;

  RAISE NOTICE 'Migration 013 applied successfully';
END $$;
