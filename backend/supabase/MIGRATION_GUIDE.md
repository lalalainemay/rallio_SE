# Migration Management Guide

## ⚠️ IMPORTANT: Stop Using SQL Editor for Schema Changes!

Running SQL files manually through Supabase SQL Editor causes:
- ❌ No migration tracking
- ❌ Team members can't replicate your database
- ❌ Production deployment will fail
- ❌ Conflicts and duplicate migrations

## ✅ Correct Workflow

### Initial Setup (One-time)

```bash
cd backend/supabase

# Link to your Supabase project
supabase link --project-ref angddotiqwhhktqdkiyx

# If you've already manually applied migrations, mark them as applied:
supabase migration repair --status applied 001_initial_schema_v2
supabase migration repair --status applied 002_add_nearby_venues_function
# ... repeat for each migration you've manually run
```

### Creating New Migrations

```bash
# Create a new migration file
supabase migration new your_feature_name

# This creates: migrations/20250123123456_your_feature_name.sql
# Edit the file with your SQL changes

# Apply it locally (if you have local Supabase running)
supabase db push --local

# Apply to remote/production
supabase db push --linked
```

### Applying Existing Migrations

```bash
# See what migrations need to be applied
supabase migration list --linked

# Dry run (see what would be applied without actually doing it)
supabase db push --linked --dry-run

# Actually apply pending migrations
supabase db push --linked
```

## 🔧 Fixing Your Current Situation

### Step 1: Mark Manually Applied Migrations

Since you've been running migrations manually, tell the CLI they're already applied:

```bash
cd /Users/madz/Documents/GitHub/rallio/backend/supabase

# Mark each migration as applied (only if you've already run it manually!)
supabase migration repair --status applied 001_initial_schema_v2
supabase migration repair --status applied 002_add_nearby_venues_function
supabase migration repair --status applied 002_add_players_insert_policy
supabase migration repair --status applied 003_fix_court_availabilities
supabase migration repair --status applied 004_prevent_double_booking
```

### Step 2: Apply Remaining Migration

```bash
# This will apply 005_add_missing_rls_policies.sql
supabase db push --linked
```

## 📋 For Team Members / Testers

Anyone who wants to run your app just needs to:

```bash
# 1. Clone the repo
git clone https://github.com/ymadz/rallio.git
cd rallio

# 2. Create their own Supabase project at https://supabase.com

# 3. Link to their project
cd backend/supabase
supabase link --project-ref their-project-id

# 4. Apply ALL migrations in order (automatic!)
supabase db push --linked

# Done! Database is ready
```

## 🗂️ Migration Files to Keep

Keep these in `backend/supabase/migrations/`:
- ✅ `001_initial_schema_v2.sql`
- ✅ `002_add_nearby_venues_function.sql`
- ✅ `002_add_players_insert_policy.sql`
- ✅ `003_fix_court_availabilities.sql`
- ✅ `004_prevent_double_booking.sql`
- ✅ `005_add_missing_rls_policies.sql`

Delete these (they're for manual execution):
- ❌ `RUN_THIS_NOW.sql` - Move to migrations or delete
- ❌ `VERIFY_MIGRATIONS_004_005.sql` - Keep in docs/ folder
- ❌ `APPLY_MIGRATION_002.md` - Delete, no longer needed

## 🚀 Production Deployment

When deploying to production:

```bash
# Point to production database
supabase link --project-ref your-production-project-id

# Review what will be applied
supabase db push --linked --dry-run

# Apply migrations
supabase db push --linked
```

## 📖 Best Practices

1. **Never manually run SQL in production** - Always use migrations
2. **One migration per feature** - Makes rollbacks easier
3. **Test locally first** - Use `--local` flag
4. **Review diffs** - Always use `--dry-run` first
5. **Commit migrations to git** - They're your database version control

## 🔍 Useful Commands

```bash
# See migration status
supabase migration list --linked

# See what's different between local and remote
supabase db diff

# Pull remote schema as a new migration
supabase db pull

# Repair migration history if something goes wrong
supabase migration repair --status applied <migration-name>
```

## ❓ Troubleshooting

### "Migration already exists"
- The migration was already applied. Check with `supabase migration list --linked`
- If you ran it manually, use `supabase migration repair --status applied <name>`

### "Connection refused"
- Your Supabase database might be paused or overloaded
- Wait a few minutes and try again
- Check your project status in the Supabase Dashboard

### "Max clients reached"
- Too many connections to database
- Close unused connections or wait a moment
- Consider upgrading your Supabase plan if this happens often
