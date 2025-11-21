# 🚨 CRITICAL: Apply Migration 002 Immediately

## The Problem
**Your profile completion is failing** because the `players` table is missing an INSERT policy in Row Level Security (RLS). This prevents users from creating player profiles during onboarding if the database trigger didn't create one.

**Error you're seeing:** "Player profile not initialized. Please contact support."

## The Solution
Migration `002_add_players_insert_policy.sql` adds the missing INSERT policy. **You MUST apply this migration to fix profile completion.**

---

## 📋 How to Apply (Supabase Dashboard) - DO THIS NOW

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your **Rallio** project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Run the Migration
5. Copy and paste this SQL code:

```sql
-- Add INSERT policy for players table
-- This allows users to create their own player profile during onboarding
-- if it wasn't created by the signup trigger for some reason

CREATE POLICY "Users can insert own player profile" ON players
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see: ✅ **"Success. No rows returned"**

## Verify the Policy was Created

Run this query to verify:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'players';
```

You should see these policies:
- `Players are viewable by everyone` (SELECT)
- `Users can update own player profile` (UPDATE)
- `Users can insert own player profile` (INSERT) ← New!

## Alternative: Apply via Supabase CLI (if using local dev)

If you're using local Supabase development:

```bash
cd /Users/madz/Documents/GitHub/rallio
supabase db push
```

This will apply all pending migrations to your remote database.
