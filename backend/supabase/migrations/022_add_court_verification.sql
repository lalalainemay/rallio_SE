-- Migration 022: Add court verification workflow
-- This migration adds is_verified column to courts and updates RLS policies
-- to ensure only verified courts are visible to public users

-- Add is_verified column to courts table
ALTER TABLE courts
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Set existing courts to verified (grandfather existing courts)
UPDATE courts
SET is_verified = true
WHERE is_verified IS NULL OR is_verified = false;

-- Add comment for documentation
COMMENT ON COLUMN courts.is_verified IS 'Indicates if the court has been verified by a global admin. Unverified courts are only visible to their owners and global admins.';

-- Drop existing public view policy if it exists
DROP POLICY IF EXISTS "Courts are viewable by everyone" ON courts;
DROP POLICY IF EXISTS "View courts" ON courts;

-- Create new RLS policy: Only verified courts are viewable by public
CREATE POLICY "Verified courts are viewable by everyone"
  ON courts FOR SELECT
  USING (
    is_verified = true
    OR
    -- Court owners can see their own unverified courts
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
    OR
    -- Global admins can see all courts
    has_role(auth.uid(), 'global_admin')
  );

-- Ensure court owners can create courts (they start as unverified)
DROP POLICY IF EXISTS "Owners can insert courts" ON courts;
CREATE POLICY "Owners can insert courts"
  ON courts FOR INSERT
  WITH CHECK (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- Owners can update their own courts
DROP POLICY IF EXISTS "Owners can update courts" ON courts;
CREATE POLICY "Owners can update courts"
  ON courts FOR UPDATE
  USING (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'global_admin')
  );

-- Add index for performance on is_verified queries
CREATE INDEX IF NOT EXISTS idx_courts_is_verified ON courts(is_verified);
CREATE INDEX IF NOT EXISTS idx_courts_venue_id_verified ON courts(venue_id, is_verified);
