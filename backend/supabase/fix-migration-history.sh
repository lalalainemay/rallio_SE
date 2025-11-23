#!/bin/bash

# =====================================================
# Rallio Database Migration Setup Script
# =====================================================
# This script fixes the migration tracking for manually applied migrations
# Run this ONCE to sync your migration history with what's actually in the database
# =====================================================

set -e  # Exit on error

echo "🔧 Rallio Migration Repair Script"
echo "=================================="
echo ""
echo "⚠️  This script assumes you've already manually applied migrations 001-004"
echo "    through the Supabase SQL Editor. If you haven't, DON'T run this!"
echo ""
read -p "Have you manually applied migrations 001-004? (y/n): " confirm

if [[ $confirm != "y" ]]; then
  echo "❌ Cancelled. Apply your migrations first, then run this script."
  exit 1
fi

echo ""
echo "📍 Navigating to Supabase directory..."
cd "$(dirname "$0")"

echo ""
echo "🔗 Checking Supabase link..."
if ! supabase projects list &> /dev/null; then
  echo "❌ Not logged in to Supabase. Run: supabase login"
  exit 1
fi

echo ""
echo "🔍 Marking migrations as applied..."

# Mark each migration that was manually applied
migrations=(
  "001_initial_schema_v2"
  "002_add_nearby_venues_function"
  "002_add_players_insert_policy"
  "003_fix_court_availabilities"
  "004_prevent_double_booking"
)

for migration in "${migrations[@]}"; do
  echo "   ✓ Marking $migration as applied..."
  if supabase migration repair --status applied "$migration" 2>&1 | grep -q "Repaired"; then
    echo "   ✅ $migration marked as applied"
  else
    echo "   ⚠️  Warning: Could not mark $migration (may already be marked or doesn't exist)"
  fi
done

echo ""
echo "📋 Current migration status:"
supabase migration list --linked

echo ""
echo "✅ Migration history repaired!"
echo ""
echo "🚀 Next steps:"
echo "   1. Review the migration list above"
echo "   2. Apply remaining migration 005: supabase db push --linked"
echo "   3. From now on, use 'supabase migration new' for new migrations"
echo ""
echo "📖 Read MIGRATION_GUIDE.md for complete instructions"
