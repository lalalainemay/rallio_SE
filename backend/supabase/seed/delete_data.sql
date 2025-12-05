-- =====================================================
-- DELETE EXISTING DATA (Preserves User Accounts)
-- Run this BEFORE the seed data
-- =====================================================

-- Disable triggers temporarily for faster deletion
SET session_replication_role = replica;

-- Delete in order of dependencies (most dependent first)

-- Queue-related
DELETE FROM queue_participants;
DELETE FROM matches;
DELETE FROM queue_sessions;

-- Payments and Reservations
DELETE FROM payment_splits;
DELETE FROM payments;
DELETE FROM refunds;
DELETE FROM reservations;

-- Ratings
DELETE FROM player_ratings;
DELETE FROM court_ratings;

-- Court details
DELETE FROM court_images;
DELETE FROM court_amenities;
DELETE FROM court_availabilities;

-- Courts and Venues
DELETE FROM courts;
DELETE FROM discount_rules;
DELETE FROM holiday_pricing;
DELETE FROM blocked_dates;
DELETE FROM venues;

-- Notifications (optional - uncomment if you want to clear notifications too)
-- DELETE FROM notifications;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify deletion
SELECT 'venues' as table_name, COUNT(*) as count FROM venues
UNION ALL
SELECT 'courts', COUNT(*) FROM courts
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'queue_sessions', COUNT(*) FROM queue_sessions
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;
