-- =====================================================
-- MIGRATION 014: Blocked Dates Table
-- Purpose: Track maintenance periods, holidays, and blocked time slots
-- Dependencies: 001_initial_schema_v2.sql
-- =====================================================

-- =====================================================
-- 1. CREATE BLOCKED_DATES TABLE
-- =====================================================

-- Table to track when courts or venues are unavailable
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocked_dates_venue ON blocked_dates(venue_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_court ON blocked_dates(court_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date_range ON blocked_dates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_active ON blocked_dates(is_active) WHERE is_active = true;

-- Composite index for checking if a time slot is blocked
CREATE INDEX IF NOT EXISTS idx_blocked_dates_court_date_active
  ON blocked_dates(court_id, start_date, end_date, is_active)
  WHERE is_active = true;

COMMENT ON TABLE blocked_dates IS 'Tracks maintenance periods, holidays, and unavailable time slots for courts/venues';
COMMENT ON COLUMN blocked_dates.venue_id IS 'The venue this blocked date applies to (required)';
COMMENT ON COLUMN blocked_dates.court_id IS 'Specific court blocked. NULL = entire venue blocked';
COMMENT ON COLUMN blocked_dates.start_date IS 'When the blocked period starts';
COMMENT ON COLUMN blocked_dates.end_date IS 'When the blocked period ends';
COMMENT ON COLUMN blocked_dates.reason IS 'Reason for blocking (e.g., "Floor maintenance", "Holiday closure")';
COMMENT ON COLUMN blocked_dates.block_type IS 'Type of block: maintenance, holiday, private_event, other';
COMMENT ON COLUMN blocked_dates.is_active IS 'Whether this block is currently active';

-- =====================================================
-- 2. CREATE FUNCTION TO CHECK IF TIME SLOT IS BLOCKED
-- =====================================================

-- Function to check if a specific time slot is blocked
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
      -- Court-specific block
      bd.court_id = p_court_id
      OR
      -- Venue-wide block (court_id is NULL)
      (bd.court_id IS NULL AND bd.venue_id = (
        SELECT venue_id FROM courts WHERE id = p_court_id
      ))
    )
    -- Check for overlap with requested time
    AND bd.start_date < p_end_time
    AND bd.end_date > p_start_time
  LIMIT 1;

  -- If no blocked dates found, return not blocked
  IF NOT FOUND THEN
    RETURN QUERY SELECT false AS is_blocked, NULL::text AS reason, NULL::varchar(20) AS block_type;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_time_slot_blocked IS 'Checks if a court is blocked during a specific time range';

-- =====================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_blocked_dates_updated_at
  BEFORE UPDATE ON blocked_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- POLICY: View blocked dates
-- Everyone can see active blocked dates for public info
CREATE POLICY "Active blocked dates are viewable by everyone" ON blocked_dates
  FOR SELECT
  USING (is_active = true);

-- POLICY: Insert blocked dates
-- Only venue owners can create blocked dates for their venues
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

-- POLICY: Update blocked dates
-- Only venue owners can update their blocked dates
CREATE POLICY "Venue owners can update blocked dates" ON blocked_dates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = blocked_dates.venue_id
        AND v.owner_id = auth.uid()
    )
  );

-- POLICY: Delete blocked dates
-- Only venue owners can delete their blocked dates
CREATE POLICY "Venue owners can delete blocked dates" ON blocked_dates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venues v
      WHERE v.id = blocked_dates.venue_id
        AND v.owner_id = auth.uid()
    )
  );

-- =====================================================
-- 5. CREATE VIEW FOR ACTIVE BLOCKS
-- =====================================================

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
  AND bd.end_date > now() -- Only show current and future blocks
ORDER BY bd.start_date ASC;

COMMENT ON VIEW active_blocked_dates IS 'Shows all currently active blocked dates with venue/court details';

-- =====================================================
-- 6. DATA MIGRATION FROM METADATA
-- =====================================================

-- Migrate existing blocked dates from venue metadata (if any)
DO $$
DECLARE
  venue_rec RECORD;
  block_rec RECORD;
  blocked_dates_array jsonb;
BEGIN
  -- Loop through venues that have blocked_dates in metadata
  FOR venue_rec IN
    SELECT id, metadata, owner_id
    FROM venues
    WHERE metadata ? 'blocked_dates'
  LOOP
    blocked_dates_array := venue_rec.metadata->'blocked_dates';

    -- Loop through each blocked date in the array
    FOR block_rec IN
      SELECT * FROM jsonb_to_recordset(blocked_dates_array) AS x(
        id text,
        courtId text,
        startDate text,
        endDate text,
        reason text,
        blockType text,
        createdAt text
      )
    LOOP
      -- Insert into blocked_dates table (ignore if already exists)
      INSERT INTO blocked_dates (
        id,
        venue_id,
        court_id,
        start_date,
        end_date,
        reason,
        block_type,
        created_by,
        created_at,
        is_active
      )
      VALUES (
        block_rec.id::uuid,
        venue_rec.id,
        CASE WHEN block_rec.courtId IS NOT NULL THEN block_rec.courtId::uuid ELSE NULL END,
        block_rec.startDate::timestamptz,
        block_rec.endDate::timestamptz,
        block_rec.reason,
        COALESCE(block_rec.blockType, 'other'),
        venue_rec.owner_id,
        COALESCE(block_rec.createdAt::timestamptz, now()),
        true
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- Remove blocked_dates from metadata after migration
    UPDATE venues
    SET metadata = metadata - 'blocked_dates'
    WHERE id = venue_rec.id;
  END LOOP;

  RAISE NOTICE 'Blocked dates migration completed';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'blocked_dates'
  ) THEN
    RAISE EXCEPTION 'Migration 014 failed: blocked_dates table not created';
  END IF;

  -- Check if function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_time_slot_blocked'
  ) THEN
    RAISE EXCEPTION 'Migration 014 failed: is_time_slot_blocked function not created';
  END IF;

  -- Check if RLS policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blocked_dates'
  ) THEN
    RAISE EXCEPTION 'Migration 014 failed: RLS policies not created';
  END IF;

  RAISE NOTICE 'Migration 014 applied successfully';
END $$;
