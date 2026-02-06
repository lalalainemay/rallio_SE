-- Remove default value of 1500 from rating
ALTER TABLE public.players ALTER COLUMN rating SET DEFAULT NULL;

-- Reset existing unranked players (who have 1500 but no skill level) to NULL
-- This ensures that users who haven't completed onboarding don't show as having a rating of 1500
UPDATE public.players 
SET rating = NULL 
WHERE rating = 1500 AND skill_level IS NULL;
