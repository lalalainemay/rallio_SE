-- Migration: Drop player_ratings table
-- Purpose: Removing player-to-player rating system as requested
-- Date: 2026-02-03

DROP TABLE IF EXISTS player_ratings CASCADE;

-- Drop any related functions if they exist (cleanup)
DROP FUNCTION IF EXISTS get_player_average_rating(UUID);
DROP FUNCTION IF EXISTS get_player_rating_count(UUID);
