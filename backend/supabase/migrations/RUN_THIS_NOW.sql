-- ============================================================================
-- 🚨 CRITICAL FIX: Add INSERT Policy for Players Table
-- ============================================================================
--
-- PROBLEM: Profile completion is failing with "Player profile not initialized"
-- SOLUTION: Add the missing INSERT policy to allow users to create player records
--
-- HOW TO RUN:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your Rallio project
-- 3. Click "SQL Editor" → "New Query"
-- 4. Copy/paste this entire file
-- 5. Click "Run" (or Cmd/Ctrl + Enter)
-- 6. You should see: ✅ "Success. No rows returned"
--
-- ============================================================================

-- Add INSERT policy for players table
CREATE POLICY "Users can insert own player profile" ON players
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verify the policy was created (this will show all policies on players table)
SELECT
  policyname,
  cmd as operation,
  CASE
    WHEN cmd = 'SELECT' THEN '✅ Read'
    WHEN cmd = 'INSERT' THEN '✅ Create (NEW!)'
    WHEN cmd = 'UPDATE' THEN '✅ Update'
    WHEN cmd = 'DELETE' THEN '✅ Delete'
  END as description
FROM pg_policies
WHERE tablename = 'players'
ORDER BY cmd;
