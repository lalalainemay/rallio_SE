-- Migration 025: Add skill level change tracking
-- Prevents skill level exploitation by tracking last change timestamp

-- Add skill_level_updated_at column to players table
ALTER TABLE players
ADD COLUMN IF NOT EXISTS skill_level_updated_at timestamptz;

-- Set initial value to created_at for existing players
-- This ensures existing users also have a cooldown from their creation date
UPDATE players
SET skill_level_updated_at = created_at
WHERE skill_level_updated_at IS NULL;

-- Add comment explaining the column
COMMENT ON COLUMN players.skill_level_updated_at IS 
'Timestamp of the last skill level change. Used to enforce 30-day cooldown between changes to prevent exploitation.';

-- Add index for performance when checking cooldown
CREATE INDEX IF NOT EXISTS idx_players_skill_level_updated 
ON players (user_id, skill_level_updated_at);
